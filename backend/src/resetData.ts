import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Resetting all project data to PENDING...");

    await prisma.vote.deleteMany({});
    console.log("All votes cleared.");

    const demoIds = [
        "demo-seismic-signal",
        "demo-arsei-swap",
        "demo-seismic-faucet"
    ];

    for (const id of demoIds) {
        const p = await prisma.project.update({
            where: { id },
            data: { status: "PENDING" }
        });
        console.log(`Reset status for: ${p.name}`);
    }

    console.log("Reset finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
