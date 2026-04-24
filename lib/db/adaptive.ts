import { prisma } from '@/lib/prisma'

export interface WeeklyPlanLog {
  id: string
  iso_week: number
  iso_year: number
  phase_id?: string | null
  tier: number
  trigger_type?: string | null
  sessions_updated: number
  contingencies_detected?: unknown
  created_at: string
}

export interface ContingencyEvent {
  id: string
  date: string
  week_log_id?: string | null
  event_type: string
  muscle_affected?: string | null
  sets_missed?: number | null
  sets_redistributed?: number | null
  resolution?: string | null
  created_at: string
}

export async function createWeeklyPlanLog(data: {
  iso_week: number
  iso_year: number
  phase_id?: string | null
  tier: number
  trigger_type?: string
  context_sent?: string
  ai_response?: string
  sessions_updated?: number
  contingencies_detected?: unknown
}): Promise<WeeklyPlanLog> {
  const row = await prisma.weeklyPlanLog.create({
    data: {
      iso_week: data.iso_week,
      iso_year: data.iso_year,
      phase_id: data.phase_id ?? null,
      tier: data.tier,
      trigger_type: data.trigger_type ?? null,
      context_sent: data.context_sent ?? null,
      ai_response: data.ai_response ?? null,
      sessions_updated: data.sessions_updated ?? 0,
      contingencies_detected: data.contingencies_detected
        ? (data.contingencies_detected as object)
        : undefined,
    },
  })
  return {
    id: row.id,
    iso_week: row.iso_week,
    iso_year: row.iso_year,
    phase_id: row.phase_id,
    tier: row.tier,
    trigger_type: row.trigger_type,
    sessions_updated: row.sessions_updated,
    contingencies_detected: row.contingencies_detected,
    created_at: row.created_at.toISOString(),
  }
}

export async function createContingencyEvent(data: {
  date: string
  week_log_id?: string | null
  event_type: string
  muscle_affected?: string | null
  sets_missed?: number | null
  sets_redistributed?: number | null
  resolution?: string | null
}): Promise<ContingencyEvent> {
  const row = await prisma.contingencyEvent.create({
    data: {
      date: new Date(data.date),
      week_log_id: data.week_log_id ?? null,
      event_type: data.event_type,
      muscle_affected: data.muscle_affected ?? null,
      sets_missed: data.sets_missed ?? null,
      sets_redistributed: data.sets_redistributed ?? null,
      resolution: data.resolution ?? null,
    },
  })
  return {
    id: row.id,
    date: row.date.toISOString().split('T')[0],
    week_log_id: row.week_log_id,
    event_type: row.event_type,
    muscle_affected: row.muscle_affected,
    sets_missed: row.sets_missed != null ? Number(row.sets_missed) : null,
    sets_redistributed: row.sets_redistributed != null ? Number(row.sets_redistributed) : null,
    resolution: row.resolution,
    created_at: row.created_at.toISOString(),
  }
}

export async function getWeeklyPlanLog(iso_week: number, iso_year: number, tier = 2) {
  return prisma.weeklyPlanLog.findFirst({
    where: { iso_week, iso_year, tier },
    orderBy: { created_at: 'desc' },
  })
}

/** Returns ISO week number and year for a given date */
export function getIsoWeek(date: Date): { week: number; year: number } {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  const week = Math.round(((d.getTime() - week1.getTime()) / 86400000 + ((week1.getDay() + 6) % 7)) / 7) + 1
  return { week, year: d.getFullYear() }
}

/** Start of the ISO week (Monday) for a given date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
