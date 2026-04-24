import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { getAthleteProfile } from '@/lib/db/athlete'
import { getCurrentPhase } from '@/lib/db/phases'
import { createWeeklyPlanLog, createContingencyEvent, getIsoWeek, getWeekStart } from '@/lib/db/adaptive'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const AI_MODEL = process.env.AI_MODEL || 'gpt-4.1-mini'

const MAX_SETS_PER_MUSCLE_PER_SESSION = 8

interface ContingencyAdjustment {
  session_id: string
  exercises_to_add: {
    exercise_name: string
    sets_count: number
    reps_min?: number
    reps_max?: number
    suggested_load_kg?: number
    target_rpe?: number
    coaching_note?: string
  }[]
  coaching_note?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { workout_session_id, planned_session_id, manual } = body
    const isManual = manual === true

    if (!workout_session_id) {
      return NextResponse.json({ error: 'workout_session_id é obrigatório' }, { status: 400 })
    }

    const profile = await getAthleteProfile()
    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    if (!isManual && !profile.auto_contingency_plan) {
      return NextResponse.json({ skipped: true, reason: 'auto_contingency_disabled' })
    }

    const phase = await getCurrentPhase()
    if (!phase) return NextResponse.json({ error: 'Nenhuma fase ativa' }, { status: 400 })

    const now = new Date()
    const { week: isoWeek, year: isoYear } = getIsoWeek(now)
    const weekStart = getWeekStart(now)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    // Fetch the completed workout session
    const completedSession = await prisma.workoutSession.findUnique({
      where: { id: workout_session_id },
      include: {
        sets: {
          include: { exercise: { include: { muscles: true } } },
          orderBy: { set_number: 'asc' },
        },
      },
    })
    if (!completedSession) return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })

    // Find the linked planned session
    const plannedSession = planned_session_id
      ? await prisma.plannedSession.findUnique({
          where: { id: planned_session_id },
          include: { exercises: { include: { exercise: true } } },
        })
      : await prisma.plannedSession.findFirst({
          where: {
            iso_week: isoWeek,
            iso_year: isoYear,
            day_of_week: completedSession.date.getDay() || 7,
          },
          include: { exercises: { include: { exercise: true } } },
        })

    // Remaining sessions this week (future days)
    const todayDay = (completedSession.date.getDay() || 7)
    const remainingSessions = await prisma.plannedSession.findMany({
      where: {
        iso_week: isoWeek,
        iso_year: isoYear,
        is_template: false,
        status: 'Pendente',
        day_of_week: { gt: todayDay },
      },
      include: {
        exercises: { include: { exercise: { include: { muscles: true } } } },
      },
      orderBy: { day_of_week: 'asc' },
    })

    // Detect contingencies: what was planned but not done
    const workingTypes = ['Working Set', 'Top Set', 'Back Off Set']
    const completedSets = completedSession.sets.filter(s => workingTypes.includes(s.set_type))

    // Group completed sets by exercise
    const doneByEx: Record<string, typeof completedSets> = {}
    for (const s of completedSets) {
      if (!doneByEx[s.exercise_id]) doneByEx[s.exercise_id] = []
      doneByEx[s.exercise_id].push(s)
    }

    // Detect missed exercises and partial sets from planned session
    type Contingency = {
      type: string
      exercise_name: string
      muscle: string
      sets_missed: number
    }
    const contingencies: Contingency[] = []
    if (plannedSession) {
      for (const pe of plannedSession.exercises) {
        const doneSets = doneByEx[pe.exercise_id]?.length ?? 0
        const plannedSets = pe.sets_count
        if (doneSets === 0) {
          const primaryMuscle = pe.exercise.muscles.find(m => Number(m.series_factor) >= 1)
          contingencies.push({
            type: 'missed_exercise',
            exercise_name: pe.exercise.name,
            muscle: primaryMuscle?.muscle_group ?? 'Desconhecido',
            sets_missed: plannedSets,
          })
        } else if (doneSets < plannedSets) {
          const primaryMuscle = pe.exercise.muscles.find(m => Number(m.series_factor) >= 1)
          contingencies.push({
            type: 'partial_sets',
            exercise_name: pe.exercise.name,
            muscle: primaryMuscle?.muscle_group ?? 'Desconhecido',
            sets_missed: plannedSets - doneSets,
          })
        }
      }
    }

    if (contingencies.length === 0 || remainingSessions.length === 0) {
      return NextResponse.json({
        success: true,
        contingencies_detected: 0,
        message: 'Nenhuma contingência detectada ou sem sessões restantes',
      })
    }

    // Build compact Tier 3 context
    const execArr = Object.entries(doneByEx).map(([exId, sets]) => {
      const ex = sets[0]?.exercise
      const best = sets.reduce((a, b) => Number(b.load_kg ?? 0) > Number(a.load_kg ?? 0) ? b : a)
      return `{ex:"${ex?.name ?? exId.slice(0, 8)}",s:${sets.length},kg:${Number(best.load_kg ?? 0)},r:${best.reps}}`
    })

    const faltouArr = contingencies.map(c =>
      `{ex:"${c.exercise_name}",s:${c.sets_missed},tipo:"${c.type}"}`
    )

    const restantesArr = remainingSessions.map(s => {
      const exNames = s.exercises.map(e => `"${e.exercise.name}"`).join(',')
      return `{dia:${s.day_of_week},id:"${s.id}",nome:"${s.name}",exerc:[${exNames}]}`
    })

    const contingArr = contingencies.map(c =>
      `{tipo:"${c.type}",musculo:"${c.muscle}",series:${c.sets_missed}}`
    )

    const compactCtx = [
      `FASE:{nome:"${phase.name}",rir:"${phase.targetRirMin ?? 2}-${phase.targetRirMax ?? 3}"}`,
      `SESSAO_HOJE:{nome:"${plannedSession?.name ?? 'Treino'}",data:"${completedSession.date.toISOString().split('T')[0]}",exec:[${execArr.join(',')}],faltou:[${faltouArr.join(',')}]}`,
      `SESS_RESTANTES:[${restantesArr.join(',')}]`,
      `CONTINGENCIAS:[${contingArr.join(',')}]`,
      `REGRA:max ${MAX_SETS_PER_MUSCLE_PER_SESSION} series/musculo/sessao`,
    ].join('\n')

    const systemPrompt = `Você é um coach de musculação especializado em periodização em blocos.
Analise as contingências e redistribua o volume perdido nas sessões restantes da semana.
Regras OBRIGATÓRIAS:
- Máximo ${MAX_SETS_PER_MUSCLE_PER_SESSION} séries por músculo por sessão
- Não adicione um músculo que já foi treinado nessa sessão restante
- Se 3+ sessões ausentes: retorne array vazio (discard_remaining)
- Mantenha as séries redistribuídas APENAS nos dias restantes disponíveis
- Responda SOMENTE com JSON válido`

    const userPrompt = `${compactCtx}

Retorne um JSON com a chave "adjustments" contendo array de ajustes por sessão:
{
  "adjustments": [
    {
      "session_id": "<id da sessão restante>",
      "exercises_to_add": [
        {
          "exercise_name": "<nome do exercício>",
          "sets_count": <número de séries a adicionar>,
          "reps_min": <número>,
          "reps_max": <número>,
          "suggested_load_kg": <número ou null>,
          "target_rpe": <número>,
          "coaching_note": "<nota curta>"
        }
      ],
      "coaching_note": "<nota para a sessão>"
    }
  ],
  "discard_remaining": <true se 3+ dias ausentes>,
  "summary": "<resumo do replanejamento>"
}`

    const aiRes = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.2,
    })

    const rawJson = aiRes.choices[0]?.message?.content ?? '{}'
    let parsed: { adjustments: ContingencyAdjustment[]; discard_remaining?: boolean; summary?: string }
    try {
      parsed = JSON.parse(rawJson)
    } catch {
      return NextResponse.json({ error: 'AI retornou JSON inválido', raw: rawJson }, { status: 500 })
    }

    if (parsed.discard_remaining) {
      await createWeeklyPlanLog({
        iso_week: isoWeek, iso_year: isoYear, phase_id: phase.id, tier: 3,
        trigger_type: 'post_workout', context_sent: compactCtx, ai_response: rawJson,
        sessions_updated: 0, contingencies_detected: contingencies,
      })
      return NextResponse.json({
        success: true,
        discard_remaining: true,
        message: 'Múltiplas ausências detectadas — plano retomado semana que vem',
      })
    }

    // Apply AI adjustments to remaining sessions
    const log = await createWeeklyPlanLog({
      iso_week: isoWeek, iso_year: isoYear, phase_id: phase.id, tier: 3,
      trigger_type: 'post_workout', context_sent: compactCtx, ai_response: rawJson,
      sessions_updated: parsed.adjustments?.length ?? 0, contingencies_detected: contingencies,
    })

    let totalRedistributed = 0
    for (const adj of (parsed.adjustments ?? [])) {
      if (!adj.session_id || !adj.exercises_to_add?.length) continue

      const session = remainingSessions.find(s => s.id === adj.session_id)
      if (!session) continue

      // Update session AI notes
      if (adj.coaching_note) {
        await prisma.plannedSession.update({
          where: { id: adj.session_id },
          data: { ai_notes: adj.coaching_note },
        })
      }

      for (const ex of adj.exercises_to_add) {
        const exercise = await prisma.exercise.findFirst({
          where: { name: ex.exercise_name },
          select: { id: true },
        })
        if (!exercise) continue

        const sortMax = await prisma.plannedExercise.aggregate({
          where: { planned_session_id: adj.session_id },
          _max: { sort_order: true },
        })
        const nextSort = (sortMax._max.sort_order ?? 0) + 1

        await prisma.plannedExercise.create({
          data: {
            planned_session_id: adj.session_id,
            exercise_id: exercise.id,
            sets_count: ex.sets_count,
            reps_min: ex.reps_min ?? null,
            reps_max: ex.reps_max ?? null,
            suggested_load_kg: ex.suggested_load_kg ?? null,
            target_rpe: ex.target_rpe ?? null,
            sort_order: nextSort,
            contingency_added: true,
            ai_feedback: ex.coaching_note ?? null,
          },
        })
        totalRedistributed += ex.sets_count
      }
    }

    // Create contingency event records
    for (const c of contingencies) {
      await createContingencyEvent({
        date: completedSession.date.toISOString().split('T')[0],
        week_log_id: log.id,
        event_type: c.type,
        muscle_affected: c.muscle,
        sets_missed: c.sets_missed,
        sets_redistributed: totalRedistributed > 0 ? totalRedistributed / contingencies.length : 0,
        resolution: totalRedistributed > 0 ? 'redistributed' : 'none',
      })
    }

    return NextResponse.json({
      success: true,
      contingencies_detected: contingencies.length,
      sets_redistributed: totalRedistributed,
      summary: parsed.summary,
      log_id: log.id,
    })
  } catch (e) {
    console.error('[POST /api/ai/contingency]', e)
    return NextResponse.json({ error: 'Erro no replanejamento por contingência' }, { status: 500 })
  }
}
