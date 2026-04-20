"use client";

import { useWallet } from "@/hooks/useWallet";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRightLeft, ArrowDownUp, Waves, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { parseEther, formatEther } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

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

const ZERO = "0x0000000000000000000000000000000000000000";

const ERC20_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

export default function SwapPage() {
  const { address, balance, isLoggedIn, prepareForConnect } = useWallet();
  const { isConnected, chain } = useAccount();
  const mounted = useIsMounted();
  const { open } = useWeb3Modal();
  const publicClient = usePublicClient();
  const { data: hash, error, isPending, writeContractAsync } = useWriteContract();

  const [swapAmount, setSwapAmount] = useState("");
  const [fromToken, setFromToken] = useState<"ETH" | "ARSEI">("ETH");
  const [quotedOut, setQuotedOut] = useState("");
  const [quotedOutRaw, setQuotedOutRaw] = useState<bigint | null>(null);
  const [arseiBalance, setArseiBalance] = useState("0");
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [txNotice, setTxNotice] = useState<string | null>(null);

  const toToken = fromToken === "ETH" ? "ARSEI" : "ETH";
  const routerAddress = (process.env.NEXT_PUBLIC_SEISMIC_ROUTER_ADDRESS || ZERO) as `0x${string}`;
  const wrappedNativeAddress = (process.env.NEXT_PUBLIC_SEISMIC_WETH_ADDRESS || ZERO) as `0x${string}`;
  const arseiAddress = (process.env.NEXT_PUBLIC_ARSEI_TOKEN_ADDRESS || ZERO) as `0x${string}`;
  const isConfigured = ![routerAddress, wrappedNativeAddress, arseiAddress].some((value) => /^0x0+$/.test(value));

  const path = useMemo(() => {
    return fromToken === "ETH" ? [wrappedNativeAddress, arseiAddress] : [arseiAddress, wrappedNativeAddress];
  }, [fromToken, wrappedNativeAddress, arseiAddress]);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const fetchArseiBalance = useCallback(async () => {
    if (!publicClient || !address || arseiAddress === ZERO) return;
    try {
      const bal = await publicClient.readContract({
        address: arseiAddress,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      setArseiBalance(formatEther(bal));
    } catch (e) {
      console.error("Failed to fetch ARSEI balance:", e);
    }
  }, [address, arseiAddress, publicClient]);

  useEffect(() => {
    if (isLoggedIn && address && mounted) {
      fetchArseiBalance();
    }
  }, [address, fetchArseiBalance, isLoggedIn, mounted, isSuccess]);

  useEffect(() => {
    let ignore = false;

    async function loadQuote() {
      if (!publicClient || !isConfigured || !swapAmount || Number(swapAmount) <= 0) {
        setQuotedOut("");
        setQuotedOutRaw(null);
        setQuoteError(null);
        return;
      }

      if (fromToken !== "ETH") {
        setQuotedOut("");
        setQuotedOutRaw(null);
        setQuoteError("ARSEI to ETH is not enabled in the live UI yet.");
        return;
      }

      try {
        setQuoteError(null);
        const amountIn = parseEther(swapAmount);
        const amounts = await publicClient.readContract({
          address: routerAddress,
          abi: ROUTER_ABI,
          functionName: "getAmountsOut",
          args: [amountIn, path],
        });

        if (!ignore) {
          setQuotedOutRaw(amounts[1]);
          setQuotedOut(Number(formatEther(amounts[1])).toFixed(6).replace(/\.?0+$/, ""));
        }
      } catch (err: any) {
        if (!ignore) {
          setQuotedOut("");
          setQuotedOutRaw(null);
          setQuoteError("Unable to fetch a live quote from the Seismic router.");
        }
      }
    }

    loadQuote();
    return () => {
      ignore = true;
    };
  }, [publicClient, isConfigured, swapAmount, fromToken, routerAddress, path]);

  useEffect(() => {
    if (isSuccess) {
      setTxNotice("Swap submitted and confirmed onchain.");
      setActionError(null);
    }
  }, [isSuccess]);

  const canSubmit =
    isLoggedIn &&
    isConnected &&
    chain?.id === 5124 &&
    !!swapAmount &&
    Number(swapAmount) > 0 &&
    isConfigured &&
    fromToken === "ETH" &&
    !quoteError &&
    !!quotedOutRaw &&
    quotedOutRaw > 0n &&
    !isPending &&
    !isConfirming;

  const helperMessage = useMemo(() => {
    if (!isConfigured) return "Add your live router, WETH, and ARSEI addresses to the frontend env before swapping.";
    if (fromToken !== "ETH") return "ARSEI to ETH needs the token approval flow. ETH to ARSEI is live first.";
    if (quoteError) return quoteError;
    return "This route sends a live transaction through the Seismic router using ETH -> ARSEI.";
  }, [isConfigured, fromToken, quoteError]);

  const onSubmitSwap = async () => {
    setActionError(null);
    setTxNotice(null);

    if (!address) {
      setActionError("Connect your wallet first.");
      return;
    }

    if (!isConfigured) {
      setActionError("Router addresses are still missing in the frontend env.");
      return;
    }

    if (fromToken !== "ETH") {
      setActionError("ARSEI to ETH is not enabled yet. Switch back to ETH -> ARSEI.");
      return;
    }

    try {
      const amountIn = parseEther(swapAmount);
      const freshQuote = await publicClient?.readContract({
        address: routerAddress,
        abi: ROUTER_ABI,
        functionName: "getAmountsOut",
        args: [amountIn, path],
      });

      if (!freshQuote || freshQuote[1] <= 0n) {
        setActionError("Unable to refresh the quote. Please try again.");
        return;
      }

      const amountOutMin = (freshQuote[1] * 98n) / 100n;
      if (amountOutMin <= 0n) {
        setActionError("Quote protection failed. Please try a larger amount.");
        return;
      }

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      await writeContractAsync({
        address: routerAddress,
        abi: ROUTER_ABI,
        functionName: "swapExactETHForTokens",
        args: [amountOutMin, path, address, deadline],
        value: amountIn,
        chainId: 5124,
      });

      setTxNotice("Transaction sent. Waiting for confirmation...");
    } catch (err: any) {
      setActionError(err?.shortMessage || err?.message || "Swap transaction failed.");
    }
  };

  if (!mounted) return null;

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <Navbar />

      <div className="flex flex-1 flex-col items-center px-5 pb-24 pt-32">
        <div className="mb-8 w-full max-w-xl">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:bg-white/[0.06] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to explorer
          </a>
        </div>

        {!isLoggedIn ? (
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-xl p-10 text-center md:p-12">
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[rgba(130,90,109,0.14)] text-[var(--accent)]">
              <ArrowRightLeft className="h-10 w-10" />
            </div>
            <h1 className="mb-4 text-3xl font-black text-[var(--text-primary)]">Swap on Seismic</h1>
            <p className="mb-10 font-medium leading-relaxed text-[var(--text-secondary)]">
              Connect your wallet to access the bootstrap route for ETH and ARSEI on Seismic testnet.
            </p>
            <button
              onClick={() => {
                prepareForConnect();
                open();
              }}
              className="btn-primary w-full"
            >
              Connect Wallet
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-card w-full max-w-xl p-7 md:p-8">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
                  <ArrowRightLeft className="h-5 w-5 text-[var(--accent)]" />
                  Signal Swap
                </h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Live bootstrap route for ETH to ARSEI.</p>
              </div>
              <span className="w-fit rounded-full border border-[rgba(209,204,191,0.12)] bg-white/[0.04] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
                Seismic Bootstrap Pool
              </span>
            </div>

            <div className="mb-8 grid grid-cols-2 gap-4">
              <div className="rounded-[1.4rem] border border-[var(--border-light)] bg-white/[0.03] p-4 text-center">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">Native Balance</p>
                <p className="font-mono font-bold text-[var(--accent)]">{balance ?? "0.0000 ETH"}</p>
              </div>
              <div className="rounded-[1.4rem] border border-[var(--border-light)] bg-white/[0.03] p-4 text-center">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">ARSEI Balance</p>
                <p className="font-mono font-bold text-white">{Number(arseiBalance).toFixed(4)} ARSEI</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-[var(--border-light)] bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-4">
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    placeholder="0.0"
                    min="0"
                    step="0.0001"
                    className="w-full bg-transparent text-4xl font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                  <div className="rounded-[1.15rem] border border-[rgba(209,204,191,0.14)] bg-[rgba(209,204,191,0.06)] px-5 py-3 text-xl font-bold text-[var(--accent)]">
                    {fromToken}
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex justify-center -my-1">
                <button
                  type="button"
                  onClick={() => {
                    setFromToken((current) => (current === "ETH" ? "ARSEI" : "ETH"));
                    setActionError(null);
                    setTxNotice(null);
                  }}
                  className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] border border-[var(--border-light)] bg-[#0e0d0e] text-[var(--text-secondary)] transition-all hover:border-[rgba(209,204,191,0.24)] hover:text-[var(--text-primary)]"
                >
                  <ArrowDownUp className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-[2rem] border border-[var(--border-light)] bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-4">
                  <input
                    type="text"
                    disabled
                    value={quotedOut}
                    placeholder="0.0"
                    className="w-full bg-transparent text-4xl font-black text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                  <div className="rounded-[1.15rem] border border-[var(--border-light)] bg-white/[0.04] px-5 py-3 text-xl font-bold text-[var(--text-secondary)]">
                    {toToken}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-[var(--border-light)] bg-white/[0.03] p-4 text-sm leading-7 text-[var(--text-secondary)]">
                {helperMessage}
              </div>

              {txNotice && (
                <div className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(209,204,191,0.16)] bg-[rgba(209,204,191,0.06)] p-4 text-sm text-[var(--text-primary)]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
                  <span>{txNotice}</span>
                </div>
              )}

              {(actionError || error) && (
                <div className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(130,90,109,0.26)] bg-[rgba(130,90,109,0.12)] p-4 text-sm text-[var(--text-primary)]">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--signal-plum)]" />
                  <span>{actionError || error?.message}</span>
                </div>
              )}

              <button
                type="button"
                onClick={onSubmitSwap}
                disabled={!canSubmit}
                className="flex w-full items-center justify-between rounded-full bg-[linear-gradient(180deg,#e6dece_0%,#d8cfbe_100%)] px-7 py-5 text-left text-[#11100f] shadow-[0_18px_40px_rgba(209,204,191,0.14)] transition-all disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/6">
                  {isPending || isConfirming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Waves className="h-5 w-5" />}
                </span>
                <span className="flex-1 px-4 text-center text-[1.05rem] font-bold">
                  {isPending || isConfirming ? "Waiting for confirmation..." : fromToken === "ETH" ? "Swap ETH for ARSEI" : "ARSEI to ETH coming soon"}
                </span>
                <span className="text-sm font-semibold opacity-70">
                  {fromToken === "ETH" ? "Live" : "Soon"}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </main>
  );
}
