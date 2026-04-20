import { createConfig, http, fallback } from "wagmi";
import { metaMask, walletConnect } from "wagmi/connectors";
import { defineChain } from "viem";

export const seismicTestnet = defineChain({
  id: 5124,
  name: "Seismic Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_SEISMIC_RPC_URL || "https://gcp-1.seismictest.net/rpc",
        process.env.NEXT_PUBLIC_SEISMIC_RPC_URL_FALLBACK || "https://gcp-2.seismictest.net/rpc"
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "SocialScan",
      url: "https://seismic-testnet.socialscan.io",
    },
  },
  testnet: true,
});

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "d685ab98531d33fd94fa2fb1ac8e93e2";

export const config = createConfig({
  chains: [seismicTestnet],
  connectors: [metaMask(), walletConnect({ projectId })],
  transports: {
    [seismicTestnet.id]: fallback([
      http(process.env.NEXT_PUBLIC_SEISMIC_RPC_URL || "https://gcp-1.seismictest.net/rpc", { retryCount: 2 }),
      http(process.env.NEXT_PUBLIC_SEISMIC_RPC_URL_FALLBACK || "https://gcp-2.seismictest.net/rpc", { retryCount: 2 }),
    ]),
  },
});
