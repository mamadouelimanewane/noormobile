const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.user.updateMany({
    where: { accountStatus: 'PENDING' },
    data: { accountStatus: 'APPROVED' }
  });
  console.log('Updated:', res.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
