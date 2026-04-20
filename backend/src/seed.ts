import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Seismic Signal demo projects...");

  const projects = [
    {
      name: "Seismic Signal",
      description: "Discovery and interaction layer for the Seismic ecosystem.",
      websiteUrl: "https://www.seismic.systems/",
      forumUrl: "https://docs.seismic.systems/",
      twitterUrl: "https://x.com/SeismicSys",
      imageUrl: "/seismic-mark.svg",
      status: "APPROVED",
    },
    {
      name: "ARSEI Swap",
      description: "Bootstrap liquidity experience for swapping native ETH into ARSEI on Seismic testnet.",
      websiteUrl: "https://www.seismic.systems/",
      forumUrl: "https://docs.seismic.systems/tutorials/src20",
      twitterUrl: "https://x.com/arlor09",
      imageUrl: "/seismic-mark.svg",
      status: "PENDING",
    },
    {
      name: "Seismic Faucet",
      description: "Official faucet for getting started with Seismic testnet ETH.",
      websiteUrl: "https://faucet.seismictest.net/",
      forumUrl: "https://docs.seismic.systems/networks/testnet",
      twitterUrl: "https://x.com/SeismicSys",
      imageUrl: "/seismic-mark.svg",
      status: "APPROVED",
    },
  ];

  for (const project of projects) {
    const id = `demo-${project.name.toLowerCase().replace(/\s/g, "-")}`;
    const created = await prisma.project.upsert({
      where: { id },
      update: { ...project },
      create: {
        id,
        ...project,
      },
    });
    console.log(`Created/Updated project: ${created.name}`);
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
