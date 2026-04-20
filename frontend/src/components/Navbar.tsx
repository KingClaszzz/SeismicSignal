import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { motion } from "framer-motion";
import { Menu, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";
import { BrandMark } from "./BrandMark";

export function Navbar() {
  const { isConnected, shortAddress, disconnect, isWrongNetwork, prepareForConnect, isAdmin } = useWallet();
  const { open } = useWeb3Modal();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navItems = useMemo(() => {
    const items = [
      { label: "Explorer", href: "/" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Governance", href: "/governance" },
      { label: "Swap", href: "/swap" },
      { label: "Stake", href: "/staking" },
      { label: "Profile", href: "/profile" },
    ];

    if (isAdmin) {
      items.push({ label: "Admin", href: "/admin" });
    }

    return items;
  }, [isAdmin]);

  return (
    <nav className="fixed left-1/2 top-6 z-50 w-[95%] max-w-7xl -translate-x-1/2">
      <div className="glass-card flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-3">
            <BrandMark className="h-10 w-10 rounded-[1rem] transition-transform group-hover:rotate-3" />
            <div>
              <p className="text-lg font-black text-[var(--text-primary)]">Seismic Signal</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[var(--text-muted)]">Explorer Layer</p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link key={item.label} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-[var(--border-light)] bg-white/[0.03] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--accent)] xl:flex">
            Seismic Testnet
          </div>

          {isWrongNetwork && (
            <div className="hidden rounded-full border border-[rgba(166,146,77,0.2)] bg-[rgba(166,146,77,0.12)] px-3 py-1.5 text-xs font-semibold text-[var(--signal-gold)] sm:flex">
              Switch to chain 5124
            </div>
          )}

          {isConnected ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => open()}
                className="rounded-full border border-[var(--border-light)] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-all hover:bg-white/[0.08]"
              >
                {shortAddress}
              </button>
              <button
                onClick={() => disconnect()}
                className="rounded-full border border-transparent px-3 py-2 text-[var(--text-muted)] transition-all hover:border-[var(--border-light)] hover:text-[var(--text-primary)]"
                title="Disconnect"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                prepareForConnect();
                open();
              }}
              className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
            >
              <Wallet className="h-4 w-4" />
              Connect
            </button>
          )}

          <button className="p-2 text-[var(--text-secondary)] lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="glass-card mt-3 flex flex-col gap-3 p-5 lg:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-transparent px-4 py-3 text-base font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--border-light)] hover:bg-white/[0.03]"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <a href="https://faucet.seismictest.net/" target="_blank" rel="noreferrer" className="btn-secondary text-center">
            Seismic Faucet
          </a>
        </motion.div>
      )}
    </nav>
  );
}
