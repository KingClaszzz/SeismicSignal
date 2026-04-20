"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Navbar } from "@/components/Navbar";
import { LandingHero } from "@/components/LandingHero";
import { LandingFeatures } from "@/components/LandingFeatures";
import { LandingEcosystem } from "@/components/LandingEcosystem";
import { Hero as DashboardHero } from "@/components/Hero";
import { Recommendations } from "@/components/Recommendations";
import { ProjectGrid } from "@/components/ProjectGrid";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { isConnected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="relative z-10">
      <Navbar />

      {!isConnected ? (
        <>
          <LandingHero />
          <LandingFeatures />
          <LandingEcosystem />
        </>
      ) : (
        <>
          <DashboardHero />
          <Recommendations />
          <ProjectGrid />
        </>
      )}

      <Footer />
    </main>
  );
}
