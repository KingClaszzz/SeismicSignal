"use client";

import { useWallet } from "@/hooks/useWallet";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Wallet, History, Image as ImageIcon, ArrowLeft, Lock, ArrowUpRight, ArrowDownLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { usePublicClient } from "wagmi";
import { formatEther } from "viem";

const ERC20_ABI = [
  { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
] as const;

const ARSEI_ADDRESS = (process.env.NEXT_PUBLIC_ARSEI_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:4000" : "https://arlor-seis.hf.space");

const TOKEN_CONFIG: Record<string, { color: string; bgSent: string; bgReceived: string; label: string }> = {
  ETH: {
    color: "text-[#8cf7e2]",
    bgSent: "bg-red-500/10 text-red-400",
    bgReceived: "bg-[#8cf7e2]/10 text-[#8cf7e2]",
    label: "ETH",
  },
  ARSEI: {
    color: "text-amber-300",
    bgSent: "bg-red-500/10 text-red-400",
    bgReceived: "bg-amber-300/10 text-amber-300",
    label: "ARSEI",
  },
  SUSD: {
    color: "text-sky-300",
    bgSent: "bg-red-500/10 text-red-400",
    bgReceived: "bg-sky-300/10 text-sky-300",
    label: "sUSD",
  },
  WETH: {
    color: "text-blue-300",
    bgSent: "bg-red-500/10 text-red-400",
    bgReceived: "bg-blue-300/10 text-blue-300",
    label: "WETH",
  },
};

const DEFAULT_TOKEN_CONFIG = {
  color: "text-[var(--accent)]",
  bgSent: "bg-red-500/10 text-red-400",
  bgReceived: "bg-[var(--accent-soft)] text-[var(--accent)]",
  label: "Token",
};

function formatAmount(tx: any): string {
  try {
    const decimals = Math.max(0, Number(tx.tokenDecimal ?? tx.decimals ?? "18"));
    const raw = BigInt(tx.value ?? tx.balance ?? "0");
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    const fractionStr = decimals > 0 ? fraction.toString().padStart(decimals, "0").slice(0, 4) : "0000";
    return `${whole}.${fractionStr}`;
  } catch {
    return "0.0000";
  }
}

function formatRawBalance(rawValue: string, decimalsValue: string): string {
  try {
    const decimals = Math.max(0, Number(decimalsValue || "18"));
    const raw = BigInt(rawValue || "0");
    const divisor = BigInt(10) ** BigInt(decimals);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    const fractionStr = decimals > 0 ? fraction.toString().padStart(decimals, "0").slice(0, 4) : "0000";
    return `${whole}.${fractionStr}`;
  } catch {
    return "0.0000";
  }
}

export default function ProfilePage() {
  const { address, balance, isLoggedIn, prepareForConnect } = useWallet();
  const mounted = useIsMounted();
  const { open } = useWeb3Modal();
  const publicClient = usePublicClient();
  const [history, setHistory] = useState<any[]>([]);
  const [nfts, setNfts] = useState<any[]>([]);
  const [arseiBalance, setArseiBalance] = useState("0");
  const [nativeBalance, setNativeBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchArseiBalance = useCallback(async () => {
    if (!publicClient || !address || ARSEI_ADDRESS === "0x0000000000000000000000000000000000000000") return;
    try {
      const bal = await publicClient.readContract({
        address: ARSEI_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address],
      });
      setArseiBalance(formatEther(bal));
    } catch (e) {
      console.error("Failed to fetch ARSEI balance:", e);
    }
  }, [address, publicClient]);

  const fetchProfileData = useCallback(async () => {
    if (!address) return;
    try {
      setLoading(true);
      const backendUrl = `${API_BASE}/api/user`;
      const [historyRes, nftRes, tokenRes, nativeRes] = await Promise.allSettled([
        axios.get(`${backendUrl}/${address}/history`),
        axios.get(`${backendUrl}/${address}/nfts`),
        axios.get(`${backendUrl}/${address}/tokens`),
        axios.get(`${backendUrl}/${address}/native-balance`),
      ]);

      if (historyRes.status === "fulfilled" && historyRes.value.data.success) setHistory(historyRes.value.data.data);
      if (nftRes.status === "fulfilled" && nftRes.value.data.success) setNfts(nftRes.value.data.data);
      if (tokenRes.status === "fulfilled" && tokenRes.value.data.success && Array.isArray(tokenRes.value.data.data)) {
        const arsei = tokenRes.value.data.data.find((token: any) => {
          const symbol = String(token.symbol || token.tokenSymbol || token.TokenSymbol || "").toUpperCase();
          return symbol === "ARSEI";
        });

        if (arsei) {
          const raw = String(arsei.balance || arsei.TokenQuantity || "0");
          const decimals = String(arsei.tokenDecimal || arsei.TokenDecimals || arsei.decimals || "18");
          setArseiBalance(formatRawBalance(raw, decimals));
        }
      }
      if (nativeRes.status === "fulfilled" && nativeRes.value.data.success) {
        setNativeBalance(String(nativeRes.value.data.data?.formatted || null));
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (mounted && isLoggedIn && address) {
      fetchProfileData();
      fetchArseiBalance();
    }
  }, [address, fetchArseiBalance, fetchProfileData, isLoggedIn, mounted]);

  if (!mounted) return null;

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 py-24">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card max-w-lg border-white/10 p-12 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#8cf7e2]/10 text-[#8cf7e2]">
            <Lock className="h-10 w-10" />
          </div>
          <h1 className="mb-4 text-3xl font-black text-white">My Seismic</h1>
          <p className="mb-10 font-medium leading-relaxed text-slate-400">
            Connect your wallet to inspect balances, activity, and your footprint across the Seismic ecosystem.
          </p>
          <button onClick={() => { prepareForConnect(); open(); }} className="btn-primary w-full">
            Connect Wallet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-10 space-y-4">
          <a href="/" className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to signal
          </a>
          <div>
            <h1 className="mb-1 text-3xl font-black text-white">My Seismic</h1>
            <p className="text-sm text-slate-500">Wallet dashboard connected to {address?.slice(0, 6)}...{address?.slice(-4)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-4">
            <div className="glass-card relative overflow-hidden border-[#8cf7e2]/10 p-10">
              <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-full bg-[#8cf7e2]/5 blur-3xl" />
              <h2 className="mb-10 flex items-center gap-3 text-2xl font-black text-white">
                <Wallet className="h-6 w-6 text-[#8cf7e2]" />
                Wallet Snapshot
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Address</p>
                  <div className="break-all rounded-2xl border border-white/5 bg-white/[0.03] p-4 font-mono text-[11px] leading-relaxed text-[#c8fff6]">
                    {address}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#8cf7e2]/10 bg-[#8cf7e2]/5 p-6">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#8cf7e2]/60">Native Balance</p>
                    <p className="text-4xl font-black text-white">{balance && balance !== "--- ETH" ? balance : nativeBalance ?? "0.0000 ETH"}</p>
                  </div>
                  
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-[0_0_20px_rgba(251,191,36,0.05)]">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300/60">ARSEI Signal</p>
                      <ShieldCheck className="h-3 w-3 text-amber-400" />
                    </div>
                    <p className="text-4xl font-black text-white">{Number(arseiBalance).toFixed(4)} ARSEI</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400 leading-relaxed italic">
                  Your <span className="text-amber-300 font-bold">ARSEI</span> tokens are synced. Stake them in the <span className="text-[#8cf7e2] font-bold">Signal Portal</span> to start earning rewards and securing the network.
                </div>
              </div>
            </div>

            <div className="glass-card p-10">
              <h2 className="mb-6 flex items-center gap-3 text-xl font-black text-white">
                <ImageIcon className="h-5 w-5 text-purple-400" />
                NFT Assets
              </h2>
              {nfts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {nfts.map((nft, index) => (
                    <a
                      key={index}
                      href={`https://seismic-testnet.socialscan.io/token/${nft.contractAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative aspect-square rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center transition-all hover:border-purple-500/30 hover:bg-purple-500/5"
                    >
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-2xl transition-transform group-hover:scale-110">
                        *
                      </div>
                      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-tighter text-slate-500">{nft.symbol}</p>
                      <p className="line-clamp-1 text-xs font-bold text-white">{nft.name}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/5 py-12 text-center">
                  <p className="text-sm font-medium italic text-slate-500">No NFT assets found</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="glass-card min-h-[500px] p-10">
              <div className="mb-10 flex items-center justify-between">
                <h2 className="flex items-center gap-3 text-2xl font-black text-white">
                  <History className="h-6 w-6 text-[#8cf7e2]" />
                  Activity Feed
                </h2>
                {history.length > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {history.length} entries
                  </span>
                )}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, index) => <div key={index} className="h-20 w-full animate-pulse rounded-2xl bg-white/[0.03]" />)}
                </div>
              ) : history.length > 0 ? (
                <div className="max-h-[700px] space-y-3 overflow-y-auto pr-1 text-slate-800">
                  {history.map((tx, index) => {
                    const isSent = tx.from?.toLowerCase() === address?.toLowerCase();
                    const symbol = (tx.tokenSymbol || tx.symbol || "ETH").toUpperCase();
                    const cfg = TOKEN_CONFIG[symbol] ?? { ...DEFAULT_TOKEN_CONFIG, label: symbol };
                    const amount = formatAmount(tx);

                    return (
                      <motion.a
                        key={index}
                        href={`https://seismic-testnet.socialscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isSent ? cfg.bgSent : cfg.bgReceived}`}>
                            {isSent ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                          </div>
                          <div>
                            <div className="mb-0.5 flex items-center gap-2">
                              <p className="text-base font-bold text-white">{isSent ? "Sent" : "Received"} {cfg.label}</p>
                              <span className={`rounded-full border border-white/5 bg-white/[0.04] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${cfg.color}`}>
                                {symbol}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-slate-500">
                              {new Date(Number(tx.timeStamp) * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-black ${isSent ? "text-white" : cfg.color}`}>{isSent ? "-" : "+"}{amount}</p>
                          <p className="flex items-center justify-end gap-1 text-[10px] font-bold uppercase text-slate-600 transition-colors group-hover:text-[#8cf7e2]/60">
                            Details <ExternalLink className="h-2.5 w-2.5" />
                          </p>
                        </div>
                      </motion.a>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] text-slate-700">
                    <History className="h-8 w-8" />
                  </div>
                  <p className="font-medium text-slate-500">No recent activity found on SocialScan yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
