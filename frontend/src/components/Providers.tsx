"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config, seismicTestnet } from "@/lib/wagmi";
import { useState } from "react";
import { createWeb3Modal } from "@web3modal/wagmi/react";

const queryClient = new QueryClient();
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "d685ab98531d33fd94fa2fb1ac8e93e2";

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  defaultChain: seismicTestnet,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#8cf7e2",
  },
  enableOnramp: false,
  enableSwaps: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => queryClient);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
