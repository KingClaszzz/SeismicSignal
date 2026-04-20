import { Router, Request, Response } from "express";

const router = Router();

const SEISMIC_NETWORK = {
  chainId: "0x" + (5124).toString(16),
  chainName: "Seismic Testnet",
  rpcUrls: [process.env.SEISMIC_RPC_URL || "https://gcp-1.seismictest.net/rpc"],
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  blockExplorerUrls: [process.env.SEISMIC_EXPLORER_URL || "https://seismic-testnet.socialscan.io"],
};

router.get("/", (_req: Request, res: Response) => {
  res.json({ success: true, data: SEISMIC_NETWORK });
});

export default router;
