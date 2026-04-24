import { NextRequest, NextResponse } from 'next/server'
import { getAthleteProfile, updateAthleteProfile } from '@/lib/db/athlete'

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { training_day_mask, auto_weekly_plan, auto_contingency_plan, auto_phase_alert } = body

    if (training_day_mask !== undefined) {
      if (!Array.isArray(training_day_mask) || training_day_mask.some((d: unknown) => typeof d !== 'number' || d < 1 || d > 7)) {
        return NextResponse.json({ error: 'training_day_mask must be an array of ints 1-7' }, { status: 400 })
      }
    }

    const profile = await getAthleteProfile()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const updated = await updateAthleteProfile({
      ...profile,
      ...(training_day_mask !== undefined && { training_day_mask }),
      ...(auto_weekly_plan !== undefined && { auto_weekly_plan }),
      ...(auto_contingency_plan !== undefined && { auto_contingency_plan }),
      ...(auto_phase_alert !== undefined && { auto_phase_alert }),
    })

    return NextResponse.json({ success: true, profile: updated })
  } catch (e) {
    console.error('[PATCH /api/plan/training-days]', e)
    return NextResponse.json({ error: 'Falha ao salvar dias de treino' }, { status: 500 })
  }
}
