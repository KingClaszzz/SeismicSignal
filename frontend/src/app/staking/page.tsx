"use client";

import { useWallet } from "@/hooks/useWallet";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Lock, 
  ArrowUpRight, 
  AlertCircle, 
  Loader2, 
  CheckCircle2,
  TrendingUp,
  PieChart,
  Clock,
  XCircle,
  HelpCircle
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { parseEther, formatEther } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

const STAKING_ABI = [
  { name: "stake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }] },
  { name: "requestUnstake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "amount", type: "uint256" }] },
  { name: "cancelUnstake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "index", type: "uint256" }] },
  { name: "claimUnstake", type: "function", stateMutability: "nonpayable", inputs: [{ name: "index", type: "uint256" }] },
  { name: "getReward", type: "function", stateMutability: "nonpayable", inputs: [] },
  { name: "earned", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { 
    name: "getUnstakeRequests", 
    type: "function", 
    stateMutability: "view", 
    inputs: [{ name: "account", type: "address" }], 
    outputs: [{ 
      name: "", 
      type: "tuple[]", 
      components: [
        { name: "amount", type: "uint256" },
        { name: "releaseTime", type: "uint256" },
        { name: "claimed", type: "bool" }
      ] 
    }] 
  },
] as const;

const ERC20_ABI = [
  { name: "approve", type: "function", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }] },
  { name: "allowance", type: "function", stateMutability: "view", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "https://arlor-seis.hf.space");

interface PendingUnstake {
  amount: bigint;
  releaseTime: bigint;
  claimed: boolean;
}

export default function StakingPage() {
  const { address, isLoggedIn, prepareForConnect } = useWallet();
  const { isConnected } = useAccount();
  const mounted = useIsMounted();
  const { open } = useWeb3Modal();
  const publicClient = usePublicClient();
  const { data: hash, error, isPending, writeContractAsync } = useWriteContract();

  const [stakeAmount, setStakeAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [totalStaked, setTotalStaked] = useState("0");
  const [userStaked, setUserStaked] = useState("0");
  const [userEarned, setUserEarned] = useState("0");
  const [userArseiBalance, setUserArseiBalance] = useState("0");
  const [allowance, setAllowance] = useState(0n);
  const [pendingRequests, setPendingRequests] = useState<PendingUnstake[]>([]);
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [txNotice, setTxNotice] = useState<string | null>(null);

  const stakingAddress = (process.env.NEXT_PUBLIC_SEISMIC_STAKING_ADDRESS || ZERO_ADDR) as `0x${string}`;
  const arseiAddress = (process.env.NEXT_PUBLIC_ARSEI_TOKEN_ADDRESS || ZERO_ADDR) as `0x${string}`;
  const isConfigured = stakingAddress !== ZERO_ADDR && arseiAddress !== ZERO_ADDR;

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const refreshData = useCallback(async () => {
    if (!publicClient || !isConfigured) return;

    try {
      const tsData = await publicClient.readContract({
        address: stakingAddress,
        abi: STAKING_ABI,
        functionName: "totalSupply",
      });
      setTotalStaked(formatEther(tsData as bigint));

      if (address) {
        const [usData, ueData, ubData, alData, requestsData] = await Promise.all([
          publicClient.readContract({ address: stakingAddress, abi: STAKING_ABI, functionName: "balanceOf", args: [address] }),
          publicClient.readContract({ address: stakingAddress, abi: STAKING_ABI, functionName: "earned", args: [address] }),
          publicClient.readContract({ address: arseiAddress, abi: ERC20_ABI, functionName: "balanceOf", args: [address] }),
          publicClient.readContract({ address: arseiAddress, abi: ERC20_ABI, functionName: "allowance", args: [address, stakingAddress] }),
          publicClient.readContract({ address: stakingAddress, abi: STAKING_ABI, functionName: "getUnstakeRequests", args: [address] }),
        ]);

        setUserStaked(formatEther(usData as bigint));
        setUserEarned(formatEther(ueData as bigint));
        setUserArseiBalance(formatEther(ubData as bigint));
        setAllowance(alData as bigint);
        setPendingRequests(requestsData as PendingUnstake[]);
      }
    } catch (err) {
      console.warn("RPC failed for staking data. Trying fallback for ARSEI balance...");
      if (address) {
        try {
          const tokenRes = await axios.get(`${API_BASE}/api/user/${address}/tokens`);
          if (tokenRes.data.success && Array.isArray(tokenRes.data.data)) {
            const arsei = tokenRes.data.data.find((t: any) => (t.symbol || "").toUpperCase() === "ARSEI");
            if (arsei) {
               const decimals = Number(arsei.tokenDecimal || "18");
               const raw = BigInt(arsei.balance || "0");
               const divisor = BigInt(10) ** BigInt(decimals);
               const whole = raw / divisor;
               const fraction = raw % divisor;
               const fractionStr = decimals > 0 ? fraction.toString().padStart(decimals, "0").slice(0, 4) : "0000";
               setUserArseiBalance(`${whole}.${fractionStr}`);
            }
          }
        } catch (fb) {}
      }
    }
  }, [address, arseiAddress, isConfigured, publicClient, stakingAddress]);

  useEffect(() => {
    if (mounted) refreshData();
    const interval = setInterval(() => mounted && refreshData(), 10000);
    return () => clearInterval(interval);
  }, [mounted, refreshData]);

  useEffect(() => {
    if (isSuccess) {
      setTxNotice("Transaction confirmed! Updating...");
      refreshData();
      setTimeout(() => setTxNotice(null), 5000);
    }
  }, [isSuccess, refreshData]);

  const needsApproval = useMemo(() => {
    if (!stakeAmount || Number(stakeAmount) <= 0) return false;
    try {
      return allowance < parseEther(stakeAmount);
    } catch { return false; }
  }, [allowance, stakeAmount]);

  const handleAction = async (fn: string, args: any[], msg: string) => {
    setActionError(null);
    setTxNotice(null);
    try {
      await writeContractAsync({
        address: fn === "approve" ? arseiAddress : stakingAddress,
        abi: fn === "approve" ? ERC20_ABI : STAKING_ABI,
        functionName: fn as any,
        args,
      });
      setTxNotice(msg);
    } catch (err: any) {
      setActionError(err?.shortMessage || err?.message || "Action failed.");
    }
  };

  if (!mounted) return null;

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <Navbar />

      <div className="flex flex-1 flex-col items-center px-5 pb-24 pt-32">
        <div className="mb-8 w-full max-w-4xl">
          <a href="/" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-light)] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:bg-white/[0.06] hover:text-[var(--text-primary)]">
            <ArrowLeft className="h-4 w-4" />
            Back to explorer
          </a>
        </div>

        <div className="grid w-full max-w-4xl gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-6">
            <StatsCard icon={<ShieldCheck className="h-6 w-6 text-[var(--accent)]" />} label="Total Staked" value={totalStaked} symbol="ARSEI" />
            <StatsCard icon={<Zap className="h-6 w-6 text-[var(--signal-gold)]" />} label="Signal APR" value="42.0%" symbol="APY" />
            
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6 border-l-4 border-l-[var(--accent)]">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(130,90,109,0.14)] text-[var(--accent)]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)]">Pending Rewards</h4>
                  <p className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">Real-time Signal</p>
                </div>
              </div>
              <div className="mb-6">
                <h2 className="text-3xl font-black text-[var(--text-primary)]">{Number(userEarned).toFixed(4)} <span className="text-sm font-bold opacity-60">ARSEI</span></h2>
              </div>
              <button 
                onClick={() => handleAction("getReward", [], "Claiming rewards...")}
                disabled={!isLoggedIn || Number(userEarned) === 0 || isPending || isConfirming}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                Claim Rewards
              </button>
            </motion.div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!isLoggedIn ? (
              <LoginPrompt onConnect={() => { prepareForConnect(); open(); }} />
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card flex flex-col p-8">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-2xl font-black text-[var(--text-primary)]">Signal Portal</h3>
                  <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
                </div>

                <div className="space-y-6">
                  <AmountInput 
                    value={stakeAmount} 
                    onChange={setStakeAmount} 
                    maxLabel={activeTab === "stake" ? "Balance" : "Staked"} 
                    maxValue={activeTab === "stake" ? userArseiBalance : userStaked} 
                  />

                  {activeTab === "stake" && needsApproval && (
                    <InfoBox icon={<ShieldCheck className="h-5 w-5 text-[var(--accent)]" />} title="Limited Approval Required" description="To protect your funds, we only ask for permission to spend the exact amount you want to stake." />
                  )}

                  {activeTab === "unstake" && (
                    <InfoBox icon={<Clock className="h-5 w-5 text-amber-400" />} title="14-Day Cooldown" description="Unstaking tokens takes 14 days to process. You can cancel back to active staking at any time during this period." />
                  )}

                  <FeedbackMessages txNotice={txNotice} actionError={actionError || (error as any)?.shortMessage} />

                  <div className="pt-4">
                    <ActionButton 
                      activeTab={activeTab} 
                      needsApproval={needsApproval} 
                      isPending={isPending || isConfirming} 
                      amount={stakeAmount}
                      onApprove={() => handleAction("approve", [stakingAddress, parseEther(stakeAmount)], "Approval sent...")}
                      onStake={() => handleAction("stake", [parseEther(stakeAmount)], "Staking sent...")}
                      onUnstake={() => handleAction("requestUnstake", [parseEther(stakeAmount)], "Unstaking request sent. Cooldown: 14 days.")}
                    />
                  </div>

                  <PendingUnstakes 
                    requests={pendingRequests} 
                    isActionPending={isPending || isConfirming}
                    onCancel={(idx: number) => handleAction("cancelUnstake", [BigInt(idx)], "Cancelling unstake...")}
                    onClaim={(idx: number) => handleAction("claimUnstake", [BigInt(idx)], "Claiming unstake...")}
                  />

                  <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-[var(--border-light)] text-[10px] text-[var(--text-muted)] flex items-center gap-3">
                    <PieChart className="h-4 w-4" />
                    <span>Your stake represents {totalStaked !== "0" ? ((Number(userStaked) / Number(totalStaked)) * 100).toFixed(2) : "0.00"}% of the total signal pool.</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function StatsCard({ icon, label, value, symbol }: any) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Verified</span>
      </div>
      <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
      <h2 className="text-3xl font-black text-[var(--text-primary)] mt-1">{value} <span className="text-sm font-bold opacity-60">{symbol}</span></h2>
    </motion.div>
  );
}

function LoginPrompt({ onConnect }: any) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="glass-card h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[rgba(130,90,109,0.14)] text-[var(--accent)]">
        <Lock className="h-10 w-10" />
      </div>
      <h1 className="mb-4 text-3xl font-black text-white">Secure Staking</h1>
      <p className="mb-10 font-medium leading-relaxed text-[var(--text-secondary)] max-w-sm">Connect your wallet to earn signal rewards through the secure 14-day cooldown pool.</p>
      <button onClick={onConnect} className="btn-primary w-full max-w-sm">Connect Wallet</button>
    </motion.div>
  );
}

function TabSwitcher({ activeTab, onTabChange }: any) {
  return (
    <div className="flex bg-white/[0.04] p-1 rounded-full border border-[var(--border-light)]">
      {["stake", "unstake"].map((tab) => (
        <button key={tab} onClick={() => onTabChange(tab as any)} className={`px-6 py-2 rounded-full text-xs font-bold transition-all uppercase ${activeTab === tab ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:text-white"}`}>
          {tab}
        </button>
      ))}
    </div>
  );
}

function AmountInput({ value, onChange, maxLabel, maxValue }: any) {
  return (
    <div className="rounded-[2rem] border border-[var(--border-light)] bg-white/[0.04] p-6">
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">{maxLabel}</span>
        <span className="text-xs font-mono font-bold text-[var(--accent)]">{Number(maxValue).toFixed(4)} ARSEI</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.0" className="w-full bg-transparent text-4xl font-black text-white outline-none placeholder:text-[var(--text-muted)]" />
        <button onClick={() => onChange(maxValue)} className="text-[10px] font-black text-[var(--accent)] border border-[rgba(130,90,109,0.3)] rounded-lg px-2 py-1 hover:bg-[rgba(130,90,109,0.1)]">MAX</button>
      </div>
    </div>
  );
}

function InfoBox({ icon, title, description }: any) {
  return (
    <div className="p-4 rounded-2xl bg-[rgba(209,204,191,0.06)] border border-[rgba(209,204,191,0.16)]">
      <div className="flex gap-3">
        {icon}
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function FeedbackMessages({ txNotice, actionError }: any) {
  return (
    <>
      {txNotice && (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(209,204,191,0.16)] bg-[rgba(209,204,191,0.06)] p-4 text-sm text-white">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--accent)]" />
          <span>{txNotice}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-start gap-3 rounded-[1.4rem] border border-[rgba(130,90,109,0.26)] bg-[rgba(130,90,109,0.12)] p-4 text-sm text-white">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--signal-plum)]" />
          <span>{actionError}</span>
        </div>
      )}
    </>
  );
}

function ActionButton({ activeTab, needsApproval, isPending, amount, onApprove, onStake, onUnstake }: any) {
  const disabled = isPending || !amount || Number(amount) <= 0;
  
  if (activeTab === "stake") {
    if (needsApproval) {
      return (
        <button onClick={onApprove} disabled={disabled} className="btn-primary w-full py-5 text-lg font-bold flex items-center justify-center gap-3">
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} Approve ARSEI
        </button>
      );
    }
    return (
      <button onClick={onStake} disabled={disabled} className="btn-primary w-full py-5 text-lg font-bold flex items-center justify-center gap-3">
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUpRight className="h-5 w-5" />} Stake ARSEI
      </button>
    );
  }
  
  return (
    <button onClick={onUnstake} disabled={disabled} className="btn-primary w-full py-5 text-lg font-bold flex items-center justify-center gap-3">
      {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowUpRight className="h-5 w-5" />} Request Unstake
    </button>
  );
}

function PendingUnstakes({ requests, isActionPending, onCancel, onClaim }: any) {
  const activeRequests = requests.filter((r: any) => !r.claimed && r.amount > 0n);
  if (activeRequests.length === 0) return null;

  return (
    <div className="mt-8 space-y-4">
      <h4 className="text-sm font-bold text-white px-2">Pending Withdrawals</h4>
      {requests.map((req: PendingUnstake, idx: number) => {
        if (req.claimed || req.amount === 0n) return null;
        const now = Math.floor(Date.now() / 1000);
        const isReady = BigInt(now) >= req.releaseTime;
        const timeLeft = Number(req.releaseTime) - now;
        const daysLeft = Math.ceil(timeLeft / (24 * 3600));

        return (
          <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">{formatEther(req.amount)} ARSEI</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isReady ? "text-[var(--accent)]" : "text-amber-400"}`}>
                {isReady ? "Ready to Claim" : `Releases in ${daysLeft} days`}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onCancel(idx)} disabled={isActionPending} className="text-[10px] font-bold px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-white">CANCEL</button>
              {isReady && (
                <button onClick={() => onClaim(idx)} disabled={isActionPending} className="text-[10px] font-bold px-3 py-2 rounded-lg bg-[var(--accent)] hover:opacity-80 text-white">CLAIM</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
