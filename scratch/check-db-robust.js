const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

async function test() {
  const connectionString = "postgresql://postgres.rarkklhkvqqsppubvieh:xoLcrBB5u3gCzSdU@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const phase = await prisma.trainingPhase.findFirst({ where: { is_current: true } })
    console.log('Current Phase:', phase)
    
    const sessions = await prisma.plannedSession.findMany({
      select: { id: true, name: true, day_of_week: true, phase_id: true }
    });
    console.log('All Sessions:', JSON.stringify(sessions, null, 2));

  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
    await pool.end()
  }
}

test()
