import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { prisma } from '@/lib/prisma'
import { getAthleteProfile } from '@/lib/db/athlete'
import { getCurrentPhase } from '@/lib/db/phases'
import { getWorkoutSessionsInRange } from '@/lib/db/sessions'
import { getWeeklyVolumeByMuscle } from '@/lib/db/volume'
import {
  createWeeklyPlanLog, updateWeeklyPlanLog,
  getPendingGenerationLog, getWeeklyPlanLog,
  getIsoWeek, getWeekStart,
} from '@/lib/db/adaptive'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const AI_MODEL = process.env.AI_MODEL || 'gpt-4.1-mini'

interface RawExercise {
  exercise_name?: string
  name?: string
  nome?: string
  sets_count?: number
  sets?: number
  num_sets?: number
  reps_min?: number
  reps_max?: number
  reps?: number
  suggested_load_kg?: number
  load_kg?: number
  carga?: number
  target_rpe?: number
  rpe?: number
  target_rir?: number
  rir?: number
}

interface SessionPlan {
  day_of_week: number
  name: string
  coaching_note?: string
  exercises: {
    exercise_name: string
    sets_count: number
    reps_min?: number
    reps_max?: number
    suggested_load_kg?: number
    target_rpe?: number
    target_rir?: number
  }[]
}

function normaliseExercise(raw: RawExercise): SessionPlan['exercises'][0] {
  const repsVal = raw.reps
  return {
    exercise_name: raw.exercise_name ?? raw.name ?? raw.nome ?? 'Exercício',
    sets_count: raw.sets_count ?? raw.sets ?? raw.num_sets ?? 3,
    reps_min: raw.reps_min ?? (typeof repsVal === 'number' ? repsVal : undefined),
    reps_max: raw.reps_max ?? (typeof repsVal === 'number' ? repsVal : undefined),
    suggested_load_kg: raw.suggested_load_kg ?? raw.load_kg ?? raw.carga ?? null,
    target_rpe: raw.target_rpe ?? raw.rpe ?? null,
    target_rir: raw.target_rir ?? raw.rir ?? null,
  }
}

function normaliseSession(raw: any): SessionPlan | null {
  if (!raw || typeof raw !== 'object') return null
  const dow = raw.day_of_week ?? raw.dayOfWeek ?? raw.dia ?? raw.day ?? 1
  const name = raw.name ?? raw.nome ?? raw.session_name ?? `Treino ${dow}`
  const rawExercises: RawExercise[] = raw.exercises ?? raw.exercicios ?? raw.exercícios ?? []
  return {
    day_of_week: Number(dow),
    name: String(name),
    coaching_note: raw.coaching_note ?? raw.note ?? raw.nota ?? undefined,
    exercises: Array.isArray(rawExercises)
      ? rawExercises.map(normaliseExercise)
      : [],
  }
}

function extractSessions(data: any): SessionPlan[] | null {
  if (!data || typeof data !== 'object') return null

  // Try direct and common key names
  const KEYS = ['sessions', 'sessoes', 'sessões', 'treinos', 'training_sessions', 'week_sessions', 'plano', 'plan']
  for (const key of KEYS) {
    if (Array.isArray(data[key]) && data[key].length > 0) {
      return data[key].map(normaliseSession).filter(Boolean) as SessionPlan[]
    }
  }

  // Try one level of nesting (e.g. { "plan": { "sessions": [...] } })
  for (const val of Object.values(data)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const nested = extractSessions(val)
      if (nested?.length) return nested
    }
    // Top-level array that looks like sessions
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && (val[0].exercises ?? val[0].exercicios)) {
      return (val as any[]).map(normaliseSession).filter(Boolean) as SessionPlan[]
    }
  }

  return null
}

// ─── Route ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const isManual = body.manual === true

    const profile = await getAthleteProfile()
    if (!profile) return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })

    if (!isManual && !profile.auto_weekly_plan) {
      return NextResponse.json({ skipped: true, reason: 'auto_plan_disabled' })
    }

    const phase = await getCurrentPhase()
    if (!phase) return NextResponse.json({ error: 'Nenhuma fase ativa. Gere um plano primeiro.' }, { status: 400 })

    const now = new Date()
    const { week: isoWeek, year: isoYear } = getIsoWeek(now)

    // Idempotency: if another generation is already in flight, return pending
    const inFlight = await getPendingGenerationLog(isoWeek, isoYear, 5)
    if (inFlight && !body.overwrite) {
      return NextResponse.json({ pending: true, reason: 'generation_in_progress', lock_id: inFlight.id })
    }

    // Check if this week already has a plan (skip unless forced)
    const existing = await getWeeklyPlanLog(isoWeek, isoYear, 2)
    if (existing && !body.overwrite) {
      const sessions = await prisma.plannedSession.findMany({
        where: { iso_week: isoWeek, iso_year: isoYear, is_template: false },
        include: { exercises: { include: { exercise: true }, orderBy: { sort_order: 'asc' } } },
        orderBy: { day_of_week: 'asc' },
      })
      return NextResponse.json({ skipped: true, reason: 'week_already_planned', sessions })
    }

    // Last week's data
    const lastWeekStart = getWeekStart(new Date(now.getTime() - 7 * 86400000))
    const lastWeekEnd = new Date(lastWeekStart)
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6)
    const lwStartStr = lastWeekStart.toISOString().split('T')[0]
    const lwEndStr = lastWeekEnd.toISOString().split('T')[0]

    const [lastWeekSessions, lastWeekVolume] = await Promise.all([
      getWorkoutSessionsInRange(lwStartStr, lwEndStr),
      getWeeklyVolumeByMuscle(lwStartStr, lwEndStr),
    ])

    // Get last body metric
    const lastMetric = await prisma.bodyMetric.findFirst({
      orderBy: { date: 'desc' },
      select: { weight_kg: true, bf_pct: true, sleep_hours: true, energy_level: true },
    })

    // Get template sessions for the current phase to know exercise roster
    const templateSessions = await prisma.plannedSession.findMany({
      where: { phase_id: phase.id, is_template: true },
      include: { exercises: { include: { exercise: true }, orderBy: { sort_order: 'asc' } } },
      orderBy: { day_of_week: 'asc' },
    })

    // Build progression map from last week sessions
    const progMap: Record<string, { trend: string; last_load: number; last_reps: number }> = {}
    for (const session of lastWeekSessions) {
      const workingTypes = ['Working Set', 'Top Set', 'Back Off Set']
      const workSets = (session.sets ?? []).filter(s => workingTypes.includes(s.setType))
      const byEx: Record<string, typeof workSets> = {}
      for (const s of workSets) {
        if (!byEx[s.exerciseId]) byEx[s.exerciseId] = []
        byEx[s.exerciseId].push(s)
      }
      for (const [exId, sets] of Object.entries(byEx)) {
        const best = sets.reduce((a, b) => (b.oneRmEpley ?? 0) > (a.oneRmEpley ?? 0) ? b : a)
        progMap[exId] = { trend: '+', last_load: best.loadKg ?? 0, last_reps: best.reps }
      }
    }

    // Compact context for Tier 2
    const dias = profile.training_day_mask
    const rirStr = `${phase.targetRirMin ?? 2}-${phase.targetRirMax ?? 3}`

    const lastWeekStr = lastWeekSessions.map(s => {
      const workSets = (s.sets ?? []).filter(st => ['Working Set', 'Top Set', 'Back Off Set'].includes(st.setType))
      const byEx: Record<string, typeof workSets> = {}
      for (const st of workSets) {
        if (!byEx[st.exerciseId]) byEx[st.exerciseId] = []
        byEx[st.exerciseId].push(st)
      }
      const execArr = Object.values(byEx).map(sets => {
        const best = sets[0]
        const exName = best.exerciseId
        return `{ex:"${exName.slice(0,8)}",s:${sets.length},kg:${best.loadKg},r:${best.reps},rpe:${best.rpe ?? '?'}}`
      })
      return `{dia:${new Date(s.date).getDay() || 7},exec:[${execArr.join(',')}]}`
    })

    const volStr = lastWeekVolume.map(v => `${v.muscleGroup}:${v.weeklySetCount}`).join(',')
    const metStr = lastMetric
      ? `pc:${lastMetric.weight_kg ? Number(lastMetric.weight_kg) : '?'},sono:${lastMetric.sleep_hours ?? '?'},energia:${lastMetric.energy_level ?? '?'}`
      : ''

    const templateStr = templateSessions.map(t => {
      const exStr = t.exercises.map(e => `"${e.exercise.name}"`).join(',')
      return `{dia:${t.day_of_week},nome:"${t.name}",exerc:[${exStr}]}`
    }).join(',')

    const compactCtx = [
      `ATLETA:{nm:"${profile.name}",lvl:"${profile.experience_level.slice(0,3)}",obj:"${profile.goal}",dias:[${dias.join(',')}]}`,
      `FASE:{nome:"${phase.name}",rir:"${rirStr}",prog:"${phase.progressionRule ?? 'linear'}"}`,
      `SEMANA_ANT:[${lastWeekStr.join(',')}]`,
      `VOL_ANT:{${volStr}}`,
      `MEDIDAS:{${metStr}}`,
      `TEMPLATES:[${templateStr}]`,
      `DIAS_SEMANA:[${dias.join(',')}]`,
    ].join('\n')

    const systemPrompt = `Você é um coach de musculação especializado na metodologia de periodização em blocos de Jayme de Lamadrid.
Gere o planejamento semanal de treino com base no contexto fornecido.
Regras:
- Use os templates como base para os exercícios, mas ajuste cargas e repetições com base na progressão
- Progrida 2,5kg em compostos e 1kg em isoladores se o atleta estiver progredindo
- Se estagnado: mantenha carga, aumente 1 rep
- Se regredindo: reduza carga em 5%
- RPE alvo baseado na fase (RIR = ${rirStr})
- Máximo de 6 exercícios por sessão
- Responda SOMENTE com JSON válido no formato especificado`

    const userPrompt = `${compactCtx}

Gere um objeto JSON com a chave "sessions" contendo array de sessões para a semana. Cada sessão:
{
  "day_of_week": <1-7, sendo 1=segunda>,
  "name": "<nome da sessão>",
  "coaching_note": "<nota motivacional curta>",
  "exercises": [
    {
      "exercise_name": "<nome exato do exercício>",
      "sets_count": <número>,
      "reps_min": <número>,
      "reps_max": <número>,
      "suggested_load_kg": <número ou null>,
      "target_rpe": <número>,
      "target_rir": <número>
    }
  ]
}`

    // Insert pending sentinel so concurrent requests see a lock
    const pendingLog = await createWeeklyPlanLog({
      iso_week: isoWeek,
      iso_year: isoYear,
      phase_id: phase.id,
      tier: 2,
      trigger_type: '__pending__',
      context_sent: compactCtx,
      sessions_updated: 0,
    })

    const aiRes = await openai.chat.completions.create({
      model: AI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    })

    const rawJson = aiRes.choices[0]?.message?.content ?? '{}'
    let sessions: SessionPlan[]
    try {
      const parsed = JSON.parse(rawJson)
      const extracted = extractSessions(parsed)
      if (!extracted?.length) {
        await updateWeeklyPlanLog(pendingLog.id, { trigger_type: '__failed__', ai_response: rawJson, sessions_updated: 0 })
        console.error('[weekly-plan] unexpected shape:', rawJson.slice(0, 500))
        return NextResponse.json(
          { error: 'AI não retornou sessões no formato esperado', raw: rawJson.slice(0, 500) },
          { status: 500 },
        )
      }
      sessions = extracted
    } catch {
      await updateWeeklyPlanLog(pendingLog.id, { trigger_type: '__failed__', ai_response: rawJson, sessions_updated: 0 })
      return NextResponse.json({ error: 'AI retornou JSON inválido', raw: rawJson.slice(0, 500) }, { status: 500 })
    }

    // Delete existing non-template sessions for this week if overwriting
    if (body.overwrite) {
      await prisma.plannedSession.deleteMany({
        where: { phase_id: phase.id, iso_week: isoWeek, iso_year: isoYear, is_template: false },
      })
    }

    // Create PlannedSession + PlannedExercise rows for each session
    const createdSessions: string[] = []
    for (const [idx, s] of sessions.entries()) {
      // Find matching exercise IDs from DB
      const exerciseNames = s.exercises.map(e => e.exercise_name)
      const exercises = await prisma.exercise.findMany({
        where: { name: { in: exerciseNames } },
        select: { id: true, name: true },
      })
      const nameToId = new Map(exercises.map(e => [e.name, e.id]))

      const session = await prisma.plannedSession.create({
        data: {
          phase_id: phase.id,
          name: s.name,
          day_of_week: s.day_of_week,
          week_number: isoWeek,
          meso_week: 1,
          session_number: idx + 1,
          status: 'Pendente',
          ai_notes: s.coaching_note ?? null,
          is_template: false,
          iso_week: isoWeek,
          iso_year: isoYear,
          tier: 2,
        },
      })

      createdSessions.push(session.id)

      for (const [eIdx, ex] of s.exercises.entries()) {
        const exId = nameToId.get(ex.exercise_name)
        if (!exId) continue
        await prisma.plannedExercise.create({
          data: {
            planned_session_id: session.id,
            exercise_id: exId,
            sets_count: ex.sets_count ?? 3,
            reps_min: ex.reps_min ?? null,
            reps_max: ex.reps_max ?? null,
            suggested_load_kg: ex.suggested_load_kg ?? null,
            target_rpe: ex.target_rpe ?? null,
            target_rir: ex.target_rir ?? null,
            sort_order: eIdx,
          },
        })
      }
    }

    // Mark the pending sentinel as done (reuse same row)
    await updateWeeklyPlanLog(pendingLog.id, {
      trigger_type: isManual ? 'manual' : 'auto_monday',
      ai_response: rawJson,
      sessions_updated: createdSessions.length,
    })

    return NextResponse.json({
      success: true,
      sessions_created: createdSessions.length,
      iso_week: isoWeek,
      iso_year: isoYear,
      log_id: pendingLog.id,
    })
  } catch (e) {
    console.error('[POST /api/ai/weekly-plan]', e)
    return NextResponse.json({ error: 'Erro ao gerar plano semanal' }, { status: 500 })
  }
}
