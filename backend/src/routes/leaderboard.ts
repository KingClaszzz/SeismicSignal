import { Router } from "express";
import { prisma } from "../lib/prisma";
import { createPublicClient, defineChain, http, parseAbi, formatEther, isAddress } from "viem";

const router = Router();
const SEISMIC_RPC_URL = process.env.SEISMIC_RPC_URL || "https://gcp-1.seismictest.net/rpc";
const STAKING_ADDRESS = (process.env.SEISMIC_STAKING_ADDRESS || "0xF9c7f7048dAb1C982F72e80FB3fD3a4070D60875") as `0x${string}`;

const seismicTestnet = defineChain({
  id: 5124,
  name: "Seismic Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [SEISMIC_RPC_URL] } },
  testnet: true,
});

const publicClient = createPublicClient({
  chain: seismicTestnet,
  transport: http(SEISMIC_RPC_URL),
});

const stakingAbi = parseAbi(["function balanceOf(address account) view returns (uint256)"]);

function getRankTier(rank: number) {
  if (rank === 1) {
    return "Signal Sovereign";
  }

  if (rank <= 10) {
    return "Signal Vanguard";
  }

  return "Explorer";
}

router.get("/", async (req, res) => {
  try {
    const sessionAddress = (req.session as any)?.siwe?.address;
    const queryAddress = typeof req.query.address === "string" && isAddress(req.query.address) ? req.query.address : undefined;
    const activeAddress = queryAddress || sessionAddress;

    const users = await prisma.user.findMany({
      include: {
        votes: true,
      },
    });

    const leaderboard = await Promise.all(
      users.map(async (user) => {
        let staked = 0n;
        try {
          staked = await publicClient.readContract({
            address: STAKING_ADDRESS,
            abi: stakingAbi,
            functionName: "balanceOf",
            args: [user.address as `0x${string}`],
          });
        } catch {}

        const stakedVal = parseFloat(formatEther(staked));
        const voteCount = user.votes.length;
        const points = Math.floor(stakedVal / 1000) + Math.floor(voteCount / 2);

        return {
          address: user.address,
          points,
          votes: voteCount,
          staked: stakedVal,
          firstSeenAt: user.createdAt,
          rank: 0,
          rankTier: "Explorer",
        };
      })
    );

    let sorted = leaderboard
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.votes !== a.votes) return b.votes - a.votes;
        return b.staked - a.staked;
      })
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        rankTier: getRankTier(index + 1),
      }));

    let me = activeAddress
      ? sorted.find((user) => user.address.toLowerCase() === activeAddress.toLowerCase())
      : null;

    if (!me && activeAddress) {
      let staked = 0n;
      try {
        staked = await publicClient.readContract({
          address: STAKING_ADDRESS,
          abi: stakingAbi,
          functionName: "balanceOf",
          args: [activeAddress as `0x${string}`],
        });
      } catch {}

      const user = await prisma.user.findUnique({
        where: { address: activeAddress },
        include: { votes: true },
      });

      const stakedVal = parseFloat(formatEther(staked));
      const voteCount = user?.votes.length || 0;
      const points = Math.floor(stakedVal / 1000) + Math.floor(voteCount / 2);

      if (stakedVal > 0 || voteCount > 0) {
        me = {
          address: activeAddress,
          points,
          votes: voteCount,
          staked: stakedVal,
          firstSeenAt: user?.createdAt || new Date(),
          rank: sorted.length + 1,
          rankTier: "Explorer",
        };

        sorted = [...sorted, me]
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.votes !== a.votes) return b.votes - a.votes;
            return b.staked - a.staked;
          })
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
            rankTier: getRankTier(index + 1),
          }));

        me = sorted.find((entry) => entry.address.toLowerCase() === activeAddress.toLowerCase()) || me;
      }
    }

    res.json({ success: true, data: sorted, me });
  } catch (error: any) {
    console.error("[Leaderboard Fatal Error]:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

export default router;
