"use client";

import { motion } from "framer-motion";
import { Compass, ShieldCheck, Sparkles, Vote } from "lucide-react";

const features = [
  {
    title: "Follow Real Signal",
    desc: "See live ecosystem projects in a calmer format that helps you decide what is worth opening next.",
    icon: Compass,
  },
  {
    title: "Move With Context",
    desc: "Swap, staking, wallet checks, and AI assistance stay close to discovery so useful actions happen without breaking flow.",
    icon: Vote,
  },
  {
    title: "Curated, Then Ranked",
    desc: "The directory stays intentional, while community voting helps surface the projects attracting the strongest momentum.",
    icon: ShieldCheck,
  },
  {
    title: "Seismic-Aligned Product",
    desc: "The visual language and structure are shaped around Seismic's identity: restrained, security-aware, and built for serious onchain use.",
    icon: Sparkles,
  },
];

export function LandingFeatures() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div className="max-w-xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Product Direction</p>
          <h2 className="mt-5 text-4xl font-black leading-[1.02] text-[var(--text-primary)] sm:text-5xl">
            A discovery layer that feels calm, useful, and worth returning to.
          </h2>
          <p className="mt-6 text-base leading-8 text-[var(--text-secondary)]">
            Instead of pushing users straight into transactions, the product gives them a cleaner way to scan the ecosystem, compare
            listings, and decide where to go next.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="glass-card interactive-panel p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-[1.35rem] bg-[rgba(255,255,255,0.04)] text-[var(--accent)]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">{feature.title}</h3>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
