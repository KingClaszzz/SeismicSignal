"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Starting seeding Seismic Ecosystem projects...");
    const projects = [
        {
            name: "SocialScan",
            description: "Official block explorer for Seismic Testnet. A privacy-aware explorer to track transactions and network health.",
            websiteUrl: "https://seismic-testnet.socialscan.io",
            imageUrl: "https://seismic-testnet.socialscan.io/logo.png",
            status: "APPROVED",
            twitterUrl: "https://x.com/socialscan_io"
        },
        {
            name: "Seismic Bridge",
            description: "The official bridge to move assets between Ethereum and the Seismic Testnet. Essential for bootstrapping liquidity.",
            websiteUrl: "https://bridge.seismictest.net",
            status: "APPROVED",
            twitterUrl: "https://x.com/seismicsystems"
        },
        {
            name: "Folio",
            description: "A next-generation portfolio tracker designed specifically for the encrypted efficiency of Seismic.",
            websiteUrl: "https://folio.seismictest.net",
            status: "APPROVED",
            twitterUrl: "https://x.com/seismicsystems"
        },
        {
            name: "Riff",
            description: "A privacy-first fintech protocol on Seismic, enabling encrypted lending and yield strategies.",
            websiteUrl: "https://riff.seismictest.net",
            status: "APPROVED",
            twitterUrl: "https://x.com/seismicsystems"
        },
        {
            name: "Nibble",
            description: "Encryption-native consumer apps at your fingertips. Bringing mass adoption to the Seismic ecosystem.",
            websiteUrl: "https://nibble.seismictest.net",
            status: "APPROVED",
            twitterUrl: "https://x.com/seismicsystems"
        },
        {
            name: "Seismic Faucet",
            description: "Get free testnet tokens to start building and exploring on the Seismic Network.",
            websiteUrl: "https://faucet.seismictest.net",
            status: "APPROVED"
        },
        {
            name: "Arsei Signal",
            description: "Community-led explorer and signal aggregator. Stake ARSEI to help rank the best projects in the ecosystem.",
            websiteUrl: "http://localhost:3000",
            status: "APPROVED",
            twitterUrl: "https://x.com/seismicsystems"
        }
    ];
    for (const project of projects) {
        const p = await prisma.project.upsert({
            where: { id: "00000000-0000-0000-0000-000000000000" },
            update: {},
            create: project,
        });
        console.log(`Created/Updated project: ${p.name}`);
    }
    console.log("Seeding finished successfully!");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
