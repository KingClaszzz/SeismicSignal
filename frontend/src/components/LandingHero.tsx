"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { ArrowRight, Compass, Shield, Sparkles } from "lucide-react";
import { MouseEvent } from "react";
import { useWallet } from "@/hooks/useWallet";
import { BrandMark } from "./BrandMark";

export function LandingHero() {
  const { open } = useWeb3Modal();
  const { prepareForConnect } = useWallet();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 24, mass: 0.4 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 24, mass: 0.4 });
  const orbX = useTransform(smoothX, (value) => value * 26);
  const orbY = useTransform(smoothY, (value) => value * 20);
  const reverseOrbX = useTransform(orbX, (value) => value * -0.7);
  const reverseOrbY = useTransform(orbY, (value) => value * -0.55);
  const floorX = useTransform(orbX, (value) => value * 0.35);
  const panelRotateX = useTransform(smoothY, (value) => value * -4);
  const panelRotateY = useTransform(smoothX, (value) => value * 5);

  const handlePointerMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section onMouseMove={handlePointerMove} className="landing-motion-field relative overflow-hidden px-5 pb-16 pt-32 lg:min-h-[calc(100vh-7rem)] lg:pt-36">
      <motion.div style={{ x: orbX, y: orbY }} className="pointer-events-none absolute left-[-8%] top-16 h-[24rem] w-[24rem] rounded-full bg-[rgba(130,90,109,0.18)] blur-[120px]" />
      <motion.div style={{ x: reverseOrbX, y: reverseOrbY }} className="pointer-events-none absolute right-[-4%] top-24 h-[22rem] w-[22rem] rounded-full bg-[rgba(209,204,191,0.07)] blur-[120px]" />
      <motion.div style={{ x: floorX }} className="pointer-events-none absolute bottom-0 left-1/2 h-[18rem] w-[56rem] -translate-x-1/2 bg-[radial-gradient(circle_at_center,rgba(166,146,77,0.12),transparent_60%)]" />
      <motion.div style={{ rotateX: panelRotateX, rotateY: panelRotateY }} className="landing-depth-grid pointer-events-none absolute inset-x-0 top-20 mx-auto h-[32rem] max-w-6xl" />

      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }} className="relative z-10 max-w-3xl">
          <div className="signal-badge">
            <BrandMark className="h-6 w-6 rounded-xl" />
            Seismic ecosystem explorer
          </div>

          <h1 className="mt-8 text-[clamp(4rem,7vw,6.5rem)] font-black leading-[0.94] tracking-[-0.05em] text-[var(--text-primary)]">
            Find the projects
            <br />
            building on
            <br />
            <span className="text-[var(--signal-plum)]">Seismic testnet.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-[15px] leading-8 text-[var(--text-secondary)] sm:text-lg">
            A cleaner way to explore what is being built on Seismic testnet, understand where the signal is, and move from research
            into action without losing context.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
            <span className="rounded-full border border-[var(--border-light)] bg-white/[0.03] px-4 py-2">Curated listings</span>
            <span className="rounded-full border border-[var(--border-light)] bg-white/[0.03] px-4 py-2">Signal-based ranking</span>
            <span className="rounded-full border border-[var(--border-light)] bg-white/[0.03] px-4 py-2">Wallet tools and AI</span>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                prepareForConnect();
                open();
              }}
              className="btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 text-base"
            >
              Connect wallet
              <ArrowRight className="h-4 w-4" />
            </motion.button>

            <a href="/submit-project" className="btn-secondary inline-flex items-center justify-center px-8 py-4 text-sm">
              Submit a project
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ rotateX: panelRotateX, rotateY: panelRotateY, transformPerspective: 1200 }}
          transition={{ duration: 0.8, delay: 0.08 }}
          className="relative z-10 lg:justify-self-end"
        >
          <div className="glass-card interactive-panel relative w-full max-w-[34rem] overflow-hidden p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_28%),linear-gradient(135deg,rgba(130,90,109,0.18),transparent_58%)]" />
            <div className="relative">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Signal Preview</p>
              <div className="mt-6 rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(160deg,rgba(209,204,191,0.08),rgba(82,53,66,0.24)_42%,rgba(9,8,8,0.94)_86%)] p-6">
                <div className="flex items-center justify-between">
                  <BrandMark className="h-14 w-14 rounded-[1.25rem]" />
                  <span className="rounded-full border border-[rgba(209,204,191,0.16)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                    Testnet
                  </span>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-black/20 p-5">
                    <div className="flex items-center gap-3">
                      <Compass className="h-5 w-5 text-[var(--accent)]" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">A curated directory for Seismic apps</p>
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-black/20 p-5">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-[var(--signal-gold)]" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Designed for discovery before interaction</p>
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--border-light)] bg-black/20 p-5">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-[var(--signal-plum)]" />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Built around trust, context, and safer flows</p>
                    </div>
                  </div>
                </div>

                <p className="mt-8 text-sm leading-7 text-[var(--text-secondary)]">
                  The goal is to make Seismic testnet easier to navigate while keeping the product closer to a curated ecosystem layer
                  than a generic dashboard.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
