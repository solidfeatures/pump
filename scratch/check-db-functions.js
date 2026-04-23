const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function test() {
  try {
    const phase = await prisma.trainingPhase.findFirst({ where: { is_current: true } })
    console.log('Current Phase:', phase)
    
    if (phase) {
      const sessions = await prisma.plannedSession.findMany({
        where: { phase_id: phase.id }
      })
      console.log('Sessions Count:', sessions.length)
      console.log('First Session:', sessions[0])
    }
    
    const exercises = await prisma.exercise.findMany({ take: 5 })
    console.log('Exercises Count:', exercises.length)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
