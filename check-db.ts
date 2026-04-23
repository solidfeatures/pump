import { prisma } from './lib/prisma';
prisma.plannedSession.findMany().then(console.log);
