const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

async function test() {
  console.log('Testing Prisma connection...')
  const connectionString = "postgresql://postgres.rarkklhkvqqsppubvieh:xoLcrBB5u3gCzSdU@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  console.log('DATABASE_URL:', connectionString)
  
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const phases = await prisma.trainingPhase.findMany()
    console.log('Successfully connected to DB via Prisma!')
    console.log('Phases count:', phases.length)
    const currentPhase = await prisma.trainingPhase.findFirst({ where: { is_current: true } })
    console.log('Current Phase:', currentPhase ? currentPhase.name : 'None')
  } catch (err) {
    console.error('Prisma connection failed:', err)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

test()
