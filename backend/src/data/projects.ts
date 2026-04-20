export interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  url: string;
  imageUrl?: string;
  twitterUrl?: string;
  forumUrl?: string;
  tags: string[];
  featured: boolean;
}

export const projects: Project[] = [
  {
    id: 1,
    name: "Seismic Signal",
    description: "A discovery and interaction layer for browsing, evaluating, and launching Seismic ecosystem projects with community signal.",
    category: "Tools",
    url: "https://www.seismic.systems/",
    twitterUrl: "https://x.com/SeismicSys",
    forumUrl: "https://docs.seismic.systems/",
    tags: ["explorer", "discovery", "ecosystem"],
    featured: true,
  },
  {
    id: 2,
    name: "SocialScan",
    description: "Explorer surface for monitoring Seismic testnet transactions, contracts, and addresses.",
    category: "Tools",
    url: "https://seismic-testnet.socialscan.io/",
    twitterUrl: "https://x.com/SeismicSys",
    forumUrl: "https://seismic-testnet.socialscan.io/",
    tags: ["explorer", "analytics", "transactions"],
    featured: true,
  },
  {
    id: 3,
    name: "Seismic Faucet",
    description: "Official faucet for acquiring testnet ETH and getting started on Seismic testnet.",
    category: "Tools",
    url: "https://faucet.seismictest.net/",
    twitterUrl: "https://x.com/SeismicSys",
    forumUrl: "https://docs.seismic.systems/networks/testnet",
    tags: ["faucet", "testnet", "onboarding"],
    featured: true,
  },
  {
    id: 4,
    name: "ARSEI Swap",
    description: "Bootstrap swap flow for the ARSEI ecosystem token using native ETH to ARSEI liquidity on Seismic testnet.",
    category: "DEX",
    url: "#",
    twitterUrl: "https://x.com/arlor09",
    forumUrl: "https://docs.seismic.systems/tutorials/src20",
    tags: ["swap", "arsei", "liquidity"],
    featured: false,
  },
  {
    id: 5,
    name: "Seismic Privacy Playground",
    description: "Reference-style environment for understanding Seismic-native privacy patterns such as shielded values and signed reads.",
    category: "Infrastructure",
    url: "https://docs.seismic.systems/",
    twitterUrl: "https://x.com/SeismicSys",
    forumUrl: "https://docs.seismic.systems/overview/how-seismic-works",
    tags: ["privacy", "signed-reads", "learning"],
    featured: false,
  },
];
