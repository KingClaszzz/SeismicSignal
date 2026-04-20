"use client";

import { Fragment, ReactNode, useMemo, useState } from "react";
import { RotateCcw, Waves, Sparkles, Send, X, Wallet, ArrowRightLeft, ShieldCheck, CornerDownRight } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useAccount, usePublicClient, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "viem";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

type AgentAction =
  | { type: "transfer"; token: "ETH" | "ARSEI" | "SUSD"; amount: string; address: string }
  | { type: "swap"; fromToken: "ETH"; toToken: "ARSEI"; amount: string }
  | { type: "stake"; amount: string };

const PRECONNECT_STARTERS = [
  "What is Seismic testnet?",
  "How is Seismic different from Ethereum?",
  "What is Seismic Signal",
  "How do private tokens work on Seismic?",
];

const CONNECTED_STARTERS = [
  "What can Signal Agent do?",
  "Show me Seismic ecosystem apps",
  "Help me swap 0.01 ETH to ARSEI",
  "Help me stake 100 ARSEI",
];

const ROUTER_ABI = [
  {
    name: "getAmountsOut",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "path", type: "address[]" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
  {
    name: "swapExactETHForTokens",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }],
  },
] as const;

const ERC20_ABI = [
  { name: "transfer", type: "function", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

const STAKING_ABI = [
  { name: "stake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }] },
] as const;

const ZERO = "0x0000000000000000000000000000000000000000";

function parseAssistantPayload(content: string) {
  const actions: AgentAction[] = [];
  const markers = [
    ...content.matchAll(/\[\[EXECUTE_TRANSFER:([A-Z]+):([^:\]]+):(0x[a-fA-F0-9]{40})\]\]/g),
    ...content.matchAll(/\[\[EXECUTE_SWAP:(ETH):(ARSEI):([^:\]]+)\]\]/g),
    ...content.matchAll(/\[\[EXECUTE_STAKE:([^\]]+)\]\]/g),
  ];

  markers.forEach((match) => {
    if (match[0].startsWith("[[EXECUTE_TRANSFER")) {
      const token = match[1] as "ETH" | "ARSEI" | "SUSD";
      actions.push({ type: "transfer", token, amount: match[2], address: match[3] });
    } else if (match[0].startsWith("[[EXECUTE_SWAP")) {
      actions.push({ type: "swap", fromToken: "ETH", toToken: "ARSEI", amount: match[3] });
    } else if (match[0].startsWith("[[EXECUTE_STAKE")) {
      actions.push({ type: "stake", amount: match[1] });
    }
  });

  const cleaned = content
    .replace(/\[\[EXECUTE_TRANSFER:[^\]]+\]\]/g, "")
    .replace(/\[\[EXECUTE_SWAP:[^\]]+\]\]/g, "")
    .replace(/\[\[EXECUTE_STAKE:[^\]]+\]\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { cleaned, actions };
}

export default function SeismicAgent() {
  const { address, isConnected } = useWallet();
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const { sendTransactionAsync, data: sendHash } = useSendTransaction();
  const { writeContractAsync, data: writeHash } = useWriteContract();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [executingLabel, setExecutingLabel] = useState<string | null>(null);

  const routerAddress = (process.env.NEXT_PUBLIC_SEISMIC_ROUTER_ADDRESS || ZERO) as `0x${string}`;
  const wrappedNativeAddress = (process.env.NEXT_PUBLIC_SEISMIC_WETH_ADDRESS || ZERO) as `0x${string}`;
  const arseiAddress = (process.env.NEXT_PUBLIC_ARSEI_TOKEN_ADDRESS || ZERO) as `0x${string}`;
  const stakingAddress = (process.env.NEXT_PUBLIC_SEISMIC_STAKING_ADDRESS || ZERO) as `0x${string}`;

  useWaitForTransactionReceipt({ hash: sendHash });
  useWaitForTransactionReceipt({ hash: writeHash });

  const starters = useMemo(() => (isConnected ? CONNECTED_STARTERS : PRECONNECT_STARTERS), [isConnected]);

  const resetConversation = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
    setActionNotice(null);
    setActionError(null);
    setExecutingLabel(null);
  };

  const renderInlineText = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);

    return parts.map((part, index) => {
      if (/^https?:\/\/[^\s]+$/.test(part)) {
        return (
          <a
            key={`${part}-${index}`}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="break-all text-[var(--accent)] underline decoration-[rgba(209,204,191,0.25)] underline-offset-4"
          >
            {part}
          </a>
        );
      }

      return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
    });
  };

  const renderAssistantContent = (content: string): ReactNode => {
    const lines = content
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const blocks: ReactNode[] = [];
    let bullets: string[] = [];

    const flushBullets = () => {
      if (bullets.length === 0) return;
      blocks.push(
        <ul key={`bullets-${blocks.length}`} className="list-disc space-y-2 pl-5 text-[var(--text-secondary)]">
          {bullets.map((bullet, index) => (
            <li key={`${bullet}-${index}`}>{renderInlineText(bullet)}</li>
          ))}
        </ul>
      );
      bullets = [];
    };

    lines.forEach((line) => {
      const normalized = line.replace(/^[-*]\s+/, "");
      const isBullet = /^[-*]\s+/.test(line);

      if (isBullet) {
        bullets.push(normalized);
        return;
      }

      flushBullets();

      const looksLikeLabel = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s]+:$/.test(line);

      blocks.push(
        <p
          key={`${line}-${blocks.length}`}
          className={looksLikeLabel ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}
        >
          {renderInlineText(line)}
        </p>
      );
    });

    flushBullets();

    return <div className="space-y-3">{blocks}</div>;
  };

  const sendMessage = async (seed?: string) => {
    const content = (seed ?? input).trim();
    if (!content || loading) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setActionNotice(null);
    setActionError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/user/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          address: isConnected ? address : undefined,
          history: nextMessages.slice(-10),
        }),
      });

      const data = await res.json();
      const reply = data?.reply || "I can still help with Seismic and Seismic Signal. Try asking again more specifically.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I can still help with Seismic and Seismic Signal.\n\nTry asking about:\n- Seismic testnet basics\n- Seismic ecosystem apps\n- ETH to ARSEI swap\n- ARSEI staking\n- project discovery",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: AgentAction) => {
    setActionNotice(null);
    setActionError(null);

    if (!address || !isConnected || chain?.id !== 5124) {
      setActionError("Connect a wallet on Seismic testnet first.");
      return;
    }

    try {
      if (action.type === "transfer") {
        setExecutingLabel(`Preparing ${action.token} transfer...`);
        if (action.token === "ETH") {
          await sendTransactionAsync({
            to: action.address as `0x${string}`,
            value: parseEther(action.amount),
          });
        } else if (action.token === "ARSEI") {
          await writeContractAsync({
            address: arseiAddress,
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [action.address as `0x${string}`, parseEther(action.amount)],
            chainId: 5124,
          });
        } else {
          setActionError("That token action is not wired yet in the agent.");
          return;
        }

        setActionNotice(`${action.token} transfer submitted. Confirm it in your wallet and wait for onchain confirmation.`);
        return;
      }

      if (action.type === "swap") {
        setExecutingLabel("Preparing ETH to ARSEI swap...");
        const amountIn = parseEther(action.amount);
        const path = [wrappedNativeAddress, arseiAddress] as `0x${string}`[];
        const quote = await publicClient?.readContract({
          address: routerAddress,
          abi: ROUTER_ABI,
          functionName: "getAmountsOut",
          args: [amountIn, path],
        });

        if (!quote || quote[1] <= 0n) {
          setActionError("Unable to fetch a fresh swap quote right now.");
          return;
        }

        const amountOutMin = (quote[1] * 98n) / 100n;
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

        await writeContractAsync({
          address: routerAddress,
          abi: ROUTER_ABI,
          functionName: "swapExactETHForTokens",
          args: [amountOutMin, path, address, deadline],
          value: amountIn,
          chainId: 5124,
        });

        setActionNotice("Swap submitted. Your wallet will confirm the transaction using fresh chain state.");
        return;
      }

      if (action.type === "stake") {
        setExecutingLabel("Preparing ARSEI staking...");
        const amount = parseEther(action.amount);
        const allowance = await publicClient?.readContract({
          address: arseiAddress,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [address, stakingAddress],
        });

        if (!allowance || allowance < amount) {
          await writeContractAsync({
            address: arseiAddress,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [stakingAddress, amount],
            chainId: 5124,
          });
          setActionNotice("Approval submitted. After approval confirms, ask me to stake again or use the staking page to continue.");
          return;
        }

        await writeContractAsync({
          address: stakingAddress,
          abi: STAKING_ABI,
          functionName: "stake",
          args: [amount],
          chainId: 5124,
        });

        setActionNotice("Staking submitted. Confirm it in your wallet to continue.");
        return;
      }
    } catch (err: any) {
      setActionError(err?.shortMessage || err?.message || "Action failed.");
    } finally {
      setExecutingLabel(null);
    }
  };

  const renderActionButton = (action: AgentAction, index: number) => {
    if (action.type === "transfer") {
      return (
        <button
          key={`action-${index}`}
          onClick={() => executeAction(action)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[rgba(209,204,191,0.22)]"
        >
          <Wallet className="h-3.5 w-3.5" />
          Send {action.amount} {action.token}
        </button>
      );
    }

    if (action.type === "swap") {
      return (
        <button
          key={`action-${index}`}
          onClick={() => executeAction(action)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[rgba(209,204,191,0.22)]"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Swap {action.amount} ETH to ARSEI
        </button>
      );
    }

    if (action.type === "stake") {
      return (
        <button
          key={`action-${index}`}
          onClick={() => executeAction(action)}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-all hover:border-[rgba(209,204,191,0.22)]"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Stake {action.amount} ARSEI
        </button>
      );
    }
    return null;
  };

  const renderActionCard = (action: AgentAction, index: number) => {
    if (action.type === "transfer") {
      return (
        <div
          key={`card-${index}`}
          className="mt-4 overflow-hidden rounded-[1.35rem] border border-[rgba(209,204,191,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
        >
          <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent)]">
              <Wallet className="h-3.5 w-3.5" />
              Transfer Summary
            </div>
          </div>
          <div className="grid gap-3 px-4 py-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Token</p>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">{action.token}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Amount</p>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">{action.amount}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Recipient</p>
              <p className="mt-2 break-all font-mono text-[13px] text-[var(--text-primary)]">{action.address}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.06)] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <CornerDownRight className="h-3.5 w-3.5" />
              Final confirmation stays in your wallet
            </div>
            {renderActionButton(action, index)}
          </div>
        </div>
      );
    }

    if (action.type === "swap") {
      return (
        <div
          key={`card-${index}`}
          className="mt-4 overflow-hidden rounded-[1.35rem] border border-[rgba(209,204,191,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
        >
          <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent)]">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Swap Summary
            </div>
          </div>
          <div className="grid gap-3 px-4 py-4 text-sm md:grid-cols-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">From</p>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">{action.fromToken}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">To</p>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">{action.toToken}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Amount In</p>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">{action.amount}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.06)] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <CornerDownRight className="h-3.5 w-3.5" />
              Quote is refreshed before submission
            </div>
            {renderActionButton(action, index)}
          </div>
        </div>
      );
    }

    if (action.type === "stake") {
      return (
        <div
          key={`card-${index}`}
          className="mt-4 overflow-hidden rounded-[1.35rem] border border-[rgba(209,204,191,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
        >
          <div className="border-b border-[rgba(255,255,255,0.06)] px-4 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent)]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Staking Summary
            </div>
          </div>
          <div className="grid gap-3 px-4 py-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Token</p>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">ARSEI</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Amount</p>
              <p className="mt-2 font-semibold text-[var(--text-primary)]">{action.amount}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.06)] px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <CornerDownRight className="h-3.5 w-3.5" />
              Approval may be needed before staking
            </div>
            {renderActionButton(action, index)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[rgba(209,204,191,0.12)] bg-[rgba(17,15,16,0.88)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[0_18px_48px_rgba(0,0,0,0.28)] backdrop-blur-xl hover:border-[rgba(209,204,191,0.22)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(130,90,109,0.16)] text-[var(--accent)]">
            <Sparkles className="h-4 w-4" />
          </div>
          Ask Signal Agent
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass-card w-full max-w-2xl overflow-hidden border-[var(--border-light)]">
            <div className={`flex items-center justify-between border-b border-[var(--border-light)] px-6 ${messages.length > 0 ? "py-3" : "py-5"}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(130,90,109,0.14)] text-[var(--accent)]">
                  <Waves className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text-primary)]">Signal Agent</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">Seismic ecosystem assistant</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-xl border border-[var(--border-light)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`space-y-4 px-6 ${messages.length > 0 ? "py-3" : "py-5"}`}>
              {messages.length === 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {starters.map((starter) => (
                    <button
                      key={starter}
                      onClick={() => sendMessage(starter)}
                      className="interactive-panel rounded-2xl border border-[var(--border-light)] bg-white/[0.03] px-4 py-4 text-left text-sm text-[var(--text-secondary)] hover:border-[rgba(209,204,191,0.24)] hover:text-[var(--text-primary)]"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              )}

              {messages.length > 0 && (
                <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  <div className="flex justify-end">
                    <button
                      onClick={resetConversation}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Back to suggestions
                    </button>
                  </div>
                  {messages.map((message, index) => {
                    const parsed = message.role === "assistant" ? parseAssistantPayload(message.content) : null;

                    return (
                      <div
                        key={`${message.role}-${index}`}
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user"
                            ? "ml-auto max-w-[85%] bg-[var(--accent)] text-[#090807]"
                            : "max-w-[92%] border border-[var(--border-light)] bg-white/[0.03] text-[var(--text-primary)]"
                          }`}
                      >
                        {message.role === "assistant" && parsed ? renderAssistantContent(parsed.cleaned) : message.content}

                        {message.role === "assistant" && parsed && parsed.actions.length > 0 && (
                          <div className="mt-2 space-y-3">
                            {parsed.actions.map((action, actionIndex) => renderActionCard(action, actionIndex))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {loading && <div className="text-sm text-[var(--text-muted)]">Signal Agent is thinking...</div>}
                </div>
              )}

              {(actionNotice || actionError || executingLabel) && (
                <div className="space-y-2">
                  {executingLabel && <div className="text-xs text-[var(--text-muted)]">{executingLabel}</div>}
                  {actionNotice && <div className="rounded-2xl border border-[var(--border-light)] bg-white/[0.03] px-4 py-3 text-sm text-[var(--text-primary)]">{actionNotice}</div>}
                  {actionError && <div className="rounded-2xl border border-[rgba(130,90,109,0.26)] bg-[rgba(130,90,109,0.12)] px-4 py-3 text-sm text-[var(--text-primary)]">{actionError}</div>}
                </div>
              )}
            </div>

            <div className={`border-t border-[var(--border-light)] px-6 ${messages.length > 0 ? "py-3" : "py-5"}`}>
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-white/[0.03] px-4 py-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={isConnected ? "Ask about Seismic apps, swaps, staking, or transfers..." : "Ask about Seismic testnet, apps, privacy, or docs..."}
                  className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-[#090807] disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
