import { useWallet } from "@/hooks/useWallet";
import { motion } from "framer-motion";
import { Activity, ArrowRight, Wallet } from "lucide-react";

export function Hero() {
  const { shortAddress, balance } = useWallet();

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-40">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[34rem] w-[70rem] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(130,90,109,0.16),transparent_58%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">
            Live Explorer
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-5 max-w-4xl text-4xl font-black leading-[0.98] text-[var(--text-primary)] sm:text-6xl"
          >
            Your entry point for
            <br />
            Seismic ecosystem
            <br />
            discovery and action.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)]"
          >
            Browse approved projects, see what the community is pushing upward, and move from discovery into live interaction without
            leaving the Seismic context.
          </motion.p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="grid gap-4 sm:grid-cols-2">
          <div className="glass-card interactive-panel p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-[var(--accent-soft)] text-[var(--accent)]">
              <Wallet className="h-5 w-5" />
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Active Wallet</p>
            <p className="mt-3 font-mono text-lg font-bold text-[var(--text-primary)]">{shortAddress}</p>
          </div>

          <div className="glass-card interactive-panel p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.2rem] bg-[rgba(166,146,77,0.14)] text-[var(--signal-gold)]">
              <Activity className="h-5 w-5" />
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Native Balance</p>
            <p className="mt-3 text-lg font-bold text-[var(--text-primary)]">{balance ?? "0.0000 ETH"}</p>
          </div>

          <a href="/governance" className="glass-card interactive-panel group p-6 sm:col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Community Signal</p>
            <div className="mt-4 flex items-center justify-between gap-6">
              <p className="max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
                Vote on approved listings and help keep the Seismic explorer ranked by quality and momentum.
              </p>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-[var(--accent)] transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
