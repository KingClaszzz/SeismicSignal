import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { votes: true }
  });
  console.log('--- DATABASE FULL CHECK ---');
  console.log(`Total Users Found: ${users.length}`);
  users.forEach(u => {
    console.log(`Address: ${u.address}`);
    console.log(`Votes Count: ${u.votes.length}`);
    console.log(`Join Date: ${u.createdAt}`);
    console.log('---');
  });
  console.log('---------------------------');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
