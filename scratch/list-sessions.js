const { PrismaClient } = require('@prisma/client');
const { Pg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

async function main() {
  const pool = new Pool({ connectionString });
  const adapter = new Pg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const sessions = await prisma.plannedSession.findMany({
      select: { id: true, name: true, day_of_week: true }
    });
    console.log('Sessions in DB:', sessions);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
