import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/Providers";
import SeismicAgent from "@/components/SeismicAgent";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Seismic Signal",
  description: "Discover, evaluate, and launch projects building on Seismic testnet",
  icons: {
    icon: "/seismic-mark.svg",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased selection:bg-[rgba(130,90,109,0.45)] selection:text-[var(--text-primary)]">
        <Providers>
          {children}
          <SeismicAgent />
        </Providers>
      </body>
    </html>
  );
}
