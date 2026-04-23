import { prisma } from '@/lib/prisma'

export interface BodyMetric {
  id?: string
  date: string
  weight_kg?: number
  height_cm?: number
  bf_pct?: number
  sleep_hours?: number
  waist_cm?: number
  chest_cm?: number
  shoulders_cm?: number
  arms_cm?: number
  arm_left_cm?: number
  arm_right_cm?: number
  forearms_cm?: number
  forearm_left_cm?: number
  forearm_right_cm?: number
  thighs_cm?: number
  thigh_left_cm?: number
  thigh_right_cm?: number
  calves_cm?: number
  calf_left_cm?: number
  calf_right_cm?: number
  pain_notes?: string
  energy_level?: number
  neck_cm?: number
  hips_cm?: number
  created_at?: string
  wrist_cm?: number
  ankle_cm?: number
}

function mapMetric(raw: any): BodyMetric {
  return {
    id: raw.id,
    date: raw.date.toISOString().split('T')[0],
    weight_kg: raw.weight_kg != null ? Number(raw.weight_kg) : undefined,
    height_cm: raw.height_cm != null ? Number(raw.height_cm) : undefined,
    bf_pct: raw.bf_pct != null ? Number(raw.bf_pct) : undefined,
    sleep_hours: raw.sleep_hours != null ? Number(raw.sleep_hours) : undefined,
    waist_cm: raw.waist_cm != null ? Number(raw.waist_cm) : undefined,
    chest_cm: raw.chest_cm != null ? Number(raw.chest_cm) : undefined,
    shoulders_cm: raw.shoulders_cm != null ? Number(raw.shoulders_cm) : undefined,
    arms_cm: raw.arms_cm != null ? Number(raw.arms_cm) : undefined,
    arm_left_cm: raw.arm_left_cm != null ? Number(raw.arm_left_cm) : undefined,
    arm_right_cm: raw.arm_right_cm != null ? Number(raw.arm_right_cm) : undefined,
    forearms_cm: raw.forearms_cm != null ? Number(raw.forearms_cm) : undefined,
    forearm_left_cm: raw.forearm_left_cm != null ? Number(raw.forearm_left_cm) : undefined,
    forearm_right_cm: raw.forearm_right_cm != null ? Number(raw.forearm_right_cm) : undefined,
    thighs_cm: raw.thighs_cm != null ? Number(raw.thighs_cm) : undefined,
    thigh_left_cm: raw.thigh_left_cm != null ? Number(raw.thigh_left_cm) : undefined,
    thigh_right_cm: raw.thigh_right_cm != null ? Number(raw.thigh_right_cm) : undefined,
    calves_cm: raw.calves_cm != null ? Number(raw.calves_cm) : undefined,
    calf_left_cm: raw.calf_left_cm != null ? Number(raw.calf_left_cm) : undefined,
    calf_right_cm: raw.calf_right_cm != null ? Number(raw.calf_right_cm) : undefined,
    wrist_cm: raw.wrist_cm != null ? Number(raw.wrist_cm) : undefined,
    ankle_cm: raw.ankle_cm != null ? Number(raw.ankle_cm) : undefined,
    pain_notes: raw.pain_notes ?? undefined,
    energy_level: raw.energy_level ?? undefined,
    neck_cm: raw.neck_cm != null ? Number(raw.neck_cm) : undefined,
    hips_cm: raw.hips_cm != null ? Number(raw.hips_cm) : undefined,
    created_at: raw.created_at.toISOString(),
  }
}

export async function getLatestBodyMetrics(): Promise<BodyMetric | null> {
  const row = await prisma.bodyMetric.findFirst({
    orderBy: { date: 'desc' },
  })
  return row ? mapMetric(row) : null
}

export async function getBodyMetricsHistory(limit = 12): Promise<BodyMetric[]> {
  const rows = await prisma.bodyMetric.findMany({
    orderBy: { date: 'desc' },
    take: limit,
  })
  return rows.map(mapMetric)
}

export async function upsertBodyMetrics(metrics: Partial<BodyMetric>): Promise<BodyMetric> {
  if (!metrics.date) throw new Error('date is required')

  const dateObj = new Date(metrics.date)

  const payload = {
    weight_kg: metrics.weight_kg,
    height_cm: metrics.height_cm,
    bf_pct: metrics.bf_pct,
    sleep_hours: metrics.sleep_hours,
    waist_cm: metrics.waist_cm,
    chest_cm: metrics.chest_cm,
    shoulders_cm: metrics.shoulders_cm,
    arms_cm: metrics.arms_cm,
    arm_left_cm: metrics.arm_left_cm,
    arm_right_cm: metrics.arm_right_cm,
    forearms_cm: metrics.forearms_cm,
    forearm_left_cm: metrics.forearm_left_cm,
    forearm_right_cm: metrics.forearm_right_cm,
    thighs_cm: metrics.thighs_cm,
    thigh_left_cm: metrics.thigh_left_cm,
    thigh_right_cm: metrics.thigh_right_cm,
    calves_cm: metrics.calves_cm,
    calf_left_cm: metrics.calf_left_cm,
    calf_right_cm: metrics.calf_right_cm,
    wrist_cm: metrics.wrist_cm,
    ankle_cm: metrics.ankle_cm,
    neck_cm: metrics.neck_cm,
    hips_cm: metrics.hips_cm,
    pain_notes: metrics.pain_notes,
    energy_level: metrics.energy_level,
  }

  // If we have an ID, update specifically that record
  if (metrics.id) {
    const row = await prisma.bodyMetric.update({
      where: { id: metrics.id },
      data: { date: dateObj, ...payload },
    })
    return mapMetric(row)
  }

  // Otherwise, use upsert by date to prevent duplicates for same day
  const row = await prisma.bodyMetric.upsert({
    where: { date: dateObj },
    create: { date: dateObj, ...payload },
    update: payload,
  })
  return mapMetric(row)
}

export async function deleteBodyMetric(id: string): Promise<boolean> {
  try {
    await prisma.bodyMetric.delete({
      where: { id },
    })
    return true
  } catch (error) {
    console.error('[deleteBodyMetric]', error)
    return false
  }
}
