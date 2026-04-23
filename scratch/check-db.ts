import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
  })
}

const prisma = createPrismaClient()

async function main() {
  const sessions = await prisma.plannedSession.findMany()
  console.log('Planned Sessions Count:', sessions.length)
  if (sessions.length > 0) {
    console.log('First Session ID:', sessions[0].id)
  }
  
  const phases = await prisma.trainingPhase.findMany()
  console.log('Training Phases Count:', phases.length)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
