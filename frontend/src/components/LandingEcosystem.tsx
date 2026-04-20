"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Bot, Radar, ShieldCheck, Waves, Workflow } from "lucide-react";

const ecosystemLines = [
  {
    label: "Ecosystem Layer",
    title: "See the Seismic testnet as a living product surface",
    body: "Projects, rankings, utility rails, and wallet context live together so the ecosystem feels navigable instead of fragmented.",
    icon: Radar,
  },
  {
    label: "Security Framing",
    title: "Interaction should feel intentional before it feels fast",
    body: "The product leans into trust, context, and safer user flows so exploration is not separated from decision quality.",
    icon: ShieldCheck,
  },
  {
    label: "Network Motion",
    title: "Built to evolve with the testnet as more projects come online",
    body: "The explorer can keep expanding with new listings, rankings, and utility modules without losing its structure.",
    icon: Waves,
  },
];

const participantRail = [
  {
    label: "Explore credible projects",
    href: "https://www.seismic.systems/",
  },
  {
    label: "Track what the community is pushing up",
    href: "https://seismic-testnet.socialscan.io/",
  },
  {
    label: "Use AI and wallet tools with more context",
    href: "https://docs.seismic.systems/",
  },
  {
    label: "Move into swap and staking when it actually makes sense",
    href: "https://docs.seismic.systems/networks/testnet",
  },
];

const utilitySurfaces = [
  {
    title: "Signal Agent",
    desc: "Ask questions about Seismic, scan listings faster, and prepare wallet actions without giving up custody.",
    icon: Bot,
  },
  {
    title: "Utility Rails",
    desc: "Swap and staking stay available as native actions, but they sit inside a broader ecosystem experience.",
    icon: Workflow,
  },
];

export function LandingEcosystem() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24">
      <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-5">
          {ecosystemLines.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="glass-card interactive-panel p-7 md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="rounded-[1.25rem] bg-white/[0.04] p-3 text-[var(--accent)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">{item.label}</p>
                  <h3 className="mt-4 text-2xl font-black text-[var(--text-primary)]">{item.title}</h3>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{item.body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card interactive-panel overflow-hidden p-7 md:p-8"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Contributor Rail</p>
            <h3 className="mt-5 text-3xl font-black leading-[1.04] text-[var(--text-primary)]">
              A cleaner front door for people following the Seismic testnet closely.
            </h3>

            <div className="mt-7 grid gap-3">
              {participantRail.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-[1.35rem] border border-[var(--border-light)] bg-white/[0.03] px-4 py-4 transition-all hover:border-[rgba(209,204,191,0.2)] hover:bg-white/[0.05]"
                >
                  <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{item.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              ))}
            </div>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2">
            {utilitySurfaces.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.06 * (index + 1) }}
                className="glass-card interactive-panel p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-[rgba(255,255,255,0.04)] text-[var(--accent)]">
                  <card.icon className="h-5 w-5" />
                </div>
                <h4 className="mt-5 text-xl font-black text-[var(--text-primary)]">{card.title}</h4>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
