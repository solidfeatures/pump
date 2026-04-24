import type { MuscleGroup } from './types'

// UI colour and label maps — referenced by chart and volume components

export const muscleGroupColors: Record<MuscleGroup, string> = {
  chest:      'bg-rose-500',
  triceps:    'bg-orange-500',
  shoulders:  'bg-amber-600',
  back:       'bg-blue-600',
  biceps:     'bg-sky-500',
  forearms:   'bg-indigo-500',
  quadriceps: 'bg-violet-500',
  glutes:     'bg-purple-600',
  hamstrings: 'bg-emerald-600',
  calves:     'bg-teal-500',
  core:       'bg-lime-600',
}

export const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest:      'Peitoral',
  back:       'Costas',
  shoulders:  'Ombros',
  biceps:     'Bíceps',
  triceps:    'Tríceps',
  quadriceps: 'Quadríceps',
  hamstrings: 'Posteriores',
  glutes:     'Glúteo',
  calves:     'Panturrilha',
  core:       'Core',
  forearms:   'Antebraço',
}
