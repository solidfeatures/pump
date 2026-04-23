import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const phases = await prisma.trainingPhase.findMany();
    console.log('Phases:', JSON.stringify(phases, null, 2));
    
    const sessions = await prisma.plannedSession.findMany();
    console.log('Sessions:', JSON.stringify(sessions, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
