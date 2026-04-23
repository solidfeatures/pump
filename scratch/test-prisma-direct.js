const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  const phaseId = 'ea1cc646-6744-4ce5-b9d1-88a6543d912b'
  
  try {
    console.log('Testing phaseId:', phaseId)
    const rows = await prisma.plannedSession.findMany({
      where: { phase_id: phaseId },
      include: {
        exercises: {
          include: { exercise: true }
        }
      }
    })
    
    console.log('Found rows:', rows.length)
    if (rows.length > 0) {
      console.log('First row name:', rows[0].name)
    }
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
