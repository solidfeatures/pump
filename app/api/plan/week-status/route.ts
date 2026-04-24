import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWeeklyVolumeByMuscle } from '@/lib/db/volume'
import { getCurrentPhase } from '@/lib/db/phases'
import { getIsoWeek, getWeekStart, getPendingGenerationLog } from '@/lib/db/adaptive'

export async function GET() {
  try {
    const now = new Date()
    const weekStart = getWeekStart(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const { week: isoWeek, year: isoYear } = getIsoWeek(now)

    const startStr = weekStart.toISOString().split('T')[0]
    const endStr = weekEnd.toISOString().split('T')[0]

    const [phase, volumeData, plannedSessions, pendingLog] = await Promise.all([
      getCurrentPhase(),
      getWeeklyVolumeByMuscle(startStr, endStr),
      prisma.plannedSession.findMany({
        where: {
          iso_week: isoWeek,
          iso_year: isoYear,
          is_template: false,
        },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { sort_order: 'asc' },
          },
        },
        orderBy: { day_of_week: 'asc' },
      }),
      getPendingGenerationLog(isoWeek, isoYear, 5),
    ])

    const volumeByMuscle: Record<string, number> = {}
    for (const v of volumeData) {
      volumeByMuscle[v.muscleGroup] = v.weeklySetCount
    }

    const sessions = plannedSessions.map(s => ({
      id: s.id,
      name: s.name,
      day_of_week: s.day_of_week,
      status: s.status,
      ai_notes: s.ai_notes,
      tier: s.tier,
      exercises: s.exercises.map(e => ({
        id: e.id,
        exercise_name: e.exercise.name,
        sets_count: e.sets_count,
        reps_min: e.reps_min,
        reps_max: e.reps_max,
        suggested_load_kg: e.suggested_load_kg ? Number(e.suggested_load_kg) : null,
        target_rpe: e.target_rpe ? Number(e.target_rpe) : null,
        target_rir: e.target_rir,
        actual_sets_done: e.actual_sets_done,
        contingency_added: e.contingency_added,
      })),
    }))

    const hasCurrentWeekPlan = sessions.length > 0

    return NextResponse.json({
      iso_week: isoWeek,
      iso_year: isoYear,
      week_start: startStr,
      week_end: endStr,
      phase: phase ? {
        id: phase.id,
        name: phase.name,
        phase_order: phase.phaseOrder,
        duration_weeks: phase.durationWeeks,
        progression_rule: phase.progressionRule,
      } : null,
      sessions,
      has_current_week_plan: hasCurrentWeekPlan,
      is_generating: !!pendingLog,
      volume_by_muscle: volumeByMuscle,
    })
  } catch (e) {
    console.error('[GET /api/plan/week-status]', e)
    return NextResponse.json({ error: 'Falha ao buscar status da semana' }, { status: 500 })
  }
}
