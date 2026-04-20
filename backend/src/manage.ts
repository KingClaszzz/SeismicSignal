import { PrismaClient } from "@prisma/client";
import * as readline from 'readline';

const prisma = new PrismaClient();

function askQuestion(query: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

async function main() {
    const action = process.argv[2];
    const projectId = process.argv[3];

    if (!action || action === 'list') {
        const projects = await prisma.project.findMany({
            select: { id: true, name: true, status: true }
        });
        console.log("\n--- Project List ---");
        projects.forEach(p => console.log(`[${p.status}] ID: ${p.id} | Name: ${p.name}`));
        console.log("\nCommands available: list, add, edit <id>, approve <id>, pending <id>, delete <id>, delete-all");
        return;
    }

    if (action === 'delete-all') {
        const confirm = await askQuestion("Are you sure you want to delete ALL projects? This action cannot be undone. (y/N): ");
        if (confirm.toLowerCase() === 'y') {
            const result = await prisma.project.deleteMany();
            console.log(`\n🗑️ Deleted ${result.count} projects from the database.`);
        } else {
            console.log("Action cancelled.");
        }
        return;
    }

    if (action === 'add') {
        console.log("--- Add New Project ---");
        const name = await askQuestion("Project Name: ");
        const description = await askQuestion("Description: ");
        const websiteUrl = await askQuestion("Website URL (optional): ");
        const imageUrl = await askQuestion("Image URL (optional): ");
        const forumUrl = await askQuestion("Reference URL (optional): ");
        const twitterUrl = await askQuestion("X Builder URL (optional): ");
        const statusPrompt = await askQuestion("Status (1 for APPROVED, 2 for PENDING) [default: 1]: ");
        
        const status = statusPrompt.trim() === '2' ? 'PENDING' : 'APPROVED';

        const p = await prisma.project.create({
            data: {
                name,
                description,
                websiteUrl: websiteUrl || null,
                imageUrl: imageUrl || null,
                forumUrl: forumUrl || null,
                twitterUrl: twitterUrl || null,
                status
            }
        });
        console.log(`\n✅ Project "${p.name}" successfully added to ${status === 'APPROVED' ? 'Ecosystem' : 'Governance'}! ID: ${p.id}`);
        return;
    }

    if (!projectId) {
        console.log("Please provide a Project ID for this action. Usage: npm run manage <action> <id>");
        return;
    }

    const existing = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existing) {
        console.log(`❌ Project with ID ${projectId} not found.`);
        return;
    }

    if (action === 'edit') {
        console.log(`--- Editing Project: ${existing.name} ---`);
        console.log("Press enter to keep the current value.");
        
        const name = await askQuestion(`Name [${existing.name}]: `);
        const description = await askQuestion(`Description [${existing.description}]: `);
        const websiteUrl = await askQuestion(`Website URL [${existing.websiteUrl || ''}]: `);
        const imageUrl = await askQuestion(`Image URL [${existing.imageUrl || ''}]: `);
        const forumUrl = await askQuestion(`Reference URL [${existing.forumUrl || ''}]: `);
        const twitterUrl = await askQuestion(`X Builder [${existing.twitterUrl || ''}]: `);
        
        const updated = await prisma.project.update({
            where: { id: projectId },
            data: {
                name: name.trim() || existing.name,
                description: description.trim() || existing.description,
                websiteUrl: websiteUrl.trim() || existing.websiteUrl,
                imageUrl: imageUrl.trim() || existing.imageUrl,
                forumUrl: forumUrl.trim() || existing.forumUrl,
                twitterUrl: twitterUrl.trim() || existing.twitterUrl,
            }
        });
        console.log(`\n✅ Project "${updated.name}" successfully updated!`);
        return;
    }
    else if (action === 'approve') {
        await prisma.project.update({
            where: { id: projectId },
            data: { status: 'APPROVED' }
        });
        console.log(`✅ Project ${projectId} has been APPROVED and moved to Ecosystem.`);
    }
    else if (action === 'delete') {
        const confirm = await askQuestion(`Are you sure you want to delete "${existing.name}"? (y/N): `);
        if (confirm.toLowerCase() === 'y') {
            await prisma.project.delete({
                where: { id: projectId }
            });
            console.log(`🗑️ Project ${projectId} has been DELETED.`);
        } else {
            console.log("Deletion cancelled.");
        }
    }
    else if (action === 'pending') {
        await prisma.project.update({
            where: { id: projectId },
            data: { status: 'PENDING' }
        });
        console.log(`⏳ Project ${projectId} has been moved back to Governance (PENDING).`);
    }
    else {
        console.log("Unknown action. Use: add, edit, approve, delete, pending, list");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
