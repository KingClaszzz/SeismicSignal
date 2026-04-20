import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding Seismic ecosystem demo projects...");

  const newProjects = [
    {
      id: "seismic-signal",
      name: "Seismic Signal",
      description: "Discovery, recommendation, and interaction layer for Seismic testnet projects.",
      websiteUrl: "https://www.seismic.systems/",
      forumUrl: "https://docs.seismic.systems/",
      twitterUrl: "https://x.com/SeismicSys",
      imageUrl: "/seismic-mark.svg",
      status: "APPROVED",
    },
    {
      id: "socialscan",
      name: "SocialScan",
      description: "Transaction and contract explorer for Seismic testnet activity.",
      websiteUrl: "https://seismic-testnet.socialscan.io/",
      forumUrl: "https://seismic-testnet.socialscan.io/",
      twitterUrl: "https://x.com/SeismicSys",
      imageUrl: "/seismic-mark.svg",
      status: "APPROVED",
    },
    {
      id: "arsei-swap",
      name: "ARSEI Swap",
      description: "Bootstrap ETH to ARSEI swap flow for the ecosystem token on Seismic.",
      websiteUrl: "https://www.seismic.systems/",
      forumUrl: "https://docs.seismic.systems/tutorials/src20",
      twitterUrl: "https://x.com/arlor09",
      imageUrl: "/seismic-mark.svg",
      status: "PENDING",
    },
    {
      id: "privacy-playground",
      name: "Seismic Privacy Playground",
      description: "Learning surface for signed reads, shielded values, and privacy-aware Seismic flows.",
      websiteUrl: "https://docs.seismic.systems/",
      forumUrl: "https://docs.seismic.systems/overview/how-seismic-works",
      twitterUrl: "https://x.com/SeismicSys",
      imageUrl: "/seismic-mark.svg",
      status: "PENDING",
    },
  ];

  for (const project of newProjects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        ...project,
      },
      create: project,
    });
    console.log(`Added/Updated: ${project.name}`);
  }

  console.log("Projects added successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
