import Link from "next/link";
import Image from "next/image";
import { BrandMark } from "./BrandMark";

export function Footer() {
  const badgeStyle =
    "cursor-default select-none rounded-full border border-[var(--border-light)] bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--text-secondary)]";

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-[var(--border-light)] px-5 pb-12 pt-20">
      <div className="pointer-events-none absolute left-[-10%] top-0 h-[28rem] w-[28rem] rounded-full bg-[rgba(130,90,109,0.14)] blur-[120px]" />

      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <BrandMark className="h-12 w-12 rounded-[1rem]" />
              <div>
                <h2 className="text-2xl font-black text-[var(--text-primary)]">Seismic Signal</h2>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Explorer for Seismic projects</p>
              </div>
            </div>

            <p className="max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
              Built as a discovery layer for the Seismic testnet ecosystem. Users can find projects faster, builders can submit
              listings for review, and governance is used to rank projects that are already live.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className={badgeStyle}>Explorer</span>
              <span className={badgeStyle}>Governance</span>
              <span className={badgeStyle}>AI Agent</span>
              <span className={badgeStyle}>Swap Utility</span>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Product</h4>
              <ul className="mt-5 space-y-4">
                <li><Link href="/leaderboard" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Leaderboard</Link></li>
                <li><Link href="/governance" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Governance</Link></li>
                <li><Link href="/submit-project" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Submit Project</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Seismic</h4>
              <ul className="mt-5 space-y-4">
                <li><a href="https://www.seismic.systems/" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Website</a></li>
                <li><a href="https://docs.seismic.systems/" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Docs</a></li>
                <li><a href="https://discord.gg/seismic" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Discord</a></li>
                <li><a href="https://x.com/SeismicSys" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">X</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.28em] text-[var(--text-muted)]">Builder</h4>
              <ul className="mt-5 space-y-4">
                <li><Link href="/submit-project" className="text-sm font-semibold text-[var(--accent)] hover:text-[var(--text-primary)]">Submit Project</Link></li>
                <li><a href="https://faucet.seismictest.net/" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Get Testnet ETH</a></li>
                <li><a href="https://docs.seismic.systems/tutorials/src20" target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">SRC20 Tutorial</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-[var(--border-light)] pt-8 text-[11px] text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
          <p>© 2026 Seismic Signal. Built for Seismic testnet discovery.</p>
          <div className="flex items-center gap-3">
            <Image src="/seismic-text.png" alt="Seismic" width={86} height={22} className="h-[22px] w-auto" />
            <p>By Arlor09</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
