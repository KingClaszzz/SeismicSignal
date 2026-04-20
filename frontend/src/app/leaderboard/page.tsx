"use client";

import { motion } from "framer-motion";
import { Crown, Hash, Shield, Star, User, Vote } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useWallet } from "@/hooks/useWallet";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const tierConfig: Record<string, { color: string; icon: any; description: string }> = {
  "Signal Sovereign": { color: "#C6A24D", icon: Crown, description: "Rank 1" },
  "Signal Vanguard": { color: "#BFA7B4", icon: Star, description: "Ranks 2-10" },
  Explorer: { color: "#888888", icon: Shield, description: "Ranks 11+" },
};

interface LeaderboardUser {
  rank: number;
  address: string;
  points: number;
  votes: number;
  rankTier: string;
  firstSeenAt: string;
}

export default function LeaderboardPage() {
  const { address, isConnected } = useWallet();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [me, setMe] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchLeaderboard = async () => {
      try {
        const url = address ? `${API_URL}/api/leaderboard?address=${address}` : `${API_URL}/api/leaderboard`;
        const res = await axios.get(url, { withCredentials: true });
        if (res.data.success) {
          setLeaderboard(res.data.data);
          setMe(res.data.me);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [address, mounted]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen pt-32">
      <Navbar />

      <div className="mx-auto w-[95%] max-w-7xl">
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 inline-flex rounded-full border border-[var(--border-light)] bg-white/[0.03] px-6 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent)]"
          >
            Ecosystem Ranking
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-4xl font-black md:text-6xl"
          >
            Seismic <span className="text-grad">Leaderboard</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl text-[var(--text-secondary)]"
          >
            Ranking is based on activity points from staking and governance. No loyalty bonus is applied.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2"
          >
            <div className="rounded-[1.6rem] border border-[var(--border-light)] bg-white/[0.03] p-5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Activity Points</p>
              <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                <p>1 point for every 1,000 ARSEI staked.</p>
                <p>1 point for every 2 governance votes.</p>
              </div>
            </div>
            <div className="rounded-[1.6rem] border border-[var(--border-light)] bg-white/[0.03] p-5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Rank Tiers</p>
              <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                <p>Rank 1: Signal Sovereign</p>
                <p>Ranks 2-10: Signal Vanguard</p>
                <p>Ranks 11+: Explorer</p>
              </div>
            </div>
          </motion.div>
        </div>

        {me && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card mb-8 border border-[var(--accent)]/30 bg-[var(--accent)]/[0.02] p-8"
          >
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] text-3xl font-black text-[#0f0e0d]">
                  #{me.rank}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">Your Position</p>
                  <p className="mt-1 text-2xl font-black text-[var(--text-primary)]">{me.address.slice(0, 10)}...{me.address.slice(-6)}</p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">Points come from staking and governance activity.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-10 text-center md:text-right">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Tier</p>
                  <p className="mt-1 text-lg font-black text-[var(--text-primary)]">{me.rankTier}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Votes</p>
                  <p className="mt-1 text-lg font-black text-[var(--text-primary)]">{me.votes}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Points</p>
                  <p className="mt-1 text-3xl font-black text-grad">{me.points}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {!me && isConnected && !loading && (
          <div className="mb-8 rounded-[1.6rem] border border-[var(--border-light)] bg-white/[0.03] p-5 text-sm text-[var(--text-secondary)]">
            Your wallet is connected, but it does not have any indexed leaderboard activity yet. Once stake or vote activity is picked
            up, it will appear here automatically.
          </div>
        )}

        <div className="glass-card mb-20 overflow-hidden border border-[var(--border-light)]">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-light)] overflow-x-auto">
              <div className="grid grid-cols-[80px_1fr_200px_120px_150px] items-center bg-white/[0.02] px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3" /> Rank
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" /> Wallet
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="h-3 w-3" /> Tier
                </div>
                <div className="flex items-center gap-2 text-right">
                  <Vote className="h-3 w-3" /> Votes
                </div>
                <div className="text-right">Points</div>
              </div>

              {leaderboard.map((user) => {
                const TierIcon = tierConfig[user.rankTier]?.icon || Shield;
                const tierColor = tierConfig[user.rankTier]?.color || "#888888";

                return (
                  <motion.div
                    key={user.address}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                    className="group grid grid-cols-[80px_1fr_200px_120px_150px] items-center px-8 py-6 transition-all"
                  >
                    <div className="flex items-center font-black text-2xl">
                      {user.rank <= 3 ? (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-opacity-20 text-xl
                          ${user.rank === 1 ? "bg-[#C6A24D] text-[#C6A24D]" : ""}
                          ${user.rank === 2 ? "bg-gray-400 text-gray-400" : ""}
                          ${user.rank === 3 ? "bg-orange-600 text-orange-600" : ""}
                        `}
                        >
                          {user.rank}
                        </div>
                      ) : (
                        <span className="ml-3 text-[var(--text-muted)]">{user.rank}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-base font-bold text-[var(--text-primary)]">
                        {user.address.slice(0, 6)}...{user.address.slice(-4)}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Indexed {new Date(user.firstSeenAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <div
                        className="inline-flex items-center gap-2 rounded-lg bg-opacity-10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider"
                        style={{ color: tierColor, backgroundColor: `${tierColor}15` }}
                      >
                        <TierIcon className="h-3.5 w-3.5" />
                        {user.rankTier}
                      </div>
                    </div>

                    <div className="text-right font-bold text-[var(--text-secondary)]">{user.votes}</div>
                    <div className="text-right font-black text-xl text-grad">{user.points}</div>
                  </motion.div>
                );
              })}

              {leaderboard.length === 0 && (
                <div className="p-20 text-center">
                  <p className="text-[var(--text-muted)]">No leaderboard activity has been indexed yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
