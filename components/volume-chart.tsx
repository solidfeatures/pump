'use client'

import { useWorkout } from '@/lib/workout-context'
import { muscleGroupLabels, muscleGroupColors } from '@/lib/mock-data'
import { MuscleGroup } from '@/lib/types'
import { MEV_THRESHOLD, MRV_THRESHOLD } from '@/lib/periodization'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from 'recharts'
import { useMemo } from 'react'

export function VolumeChart() {
  const { getWeeklyVolumeByMuscle } = useWorkout()

  const volumeData = useMemo(() => {
    const byMuscle = getWeeklyVolumeByMuscle()
    return Object.entries(byMuscle)
      .filter(([, sets]) => sets > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([muscle, sets]) => ({
        muscle: muscleGroupLabels[muscle as MuscleGroup],
        sets: parseFloat(sets.toFixed(1)),
        color: muscleGroupColors[muscle as MuscleGroup],
        isAboveMrv: sets >= MRV_THRESHOLD,
        isBelowMev: sets < MEV_THRESHOLD,
      }))
  }, [getWeeklyVolumeByMuscle])

  if (volumeData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p className="text-sm">Complete treinos para ver seu volume por grupo muscular</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={volumeData}
          layout="vertical"
          margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
        >
          <XAxis
            type="number"
            domain={[0, MRV_THRESHOLD + 4]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'oklch(0.65 0.01 285)', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="muscle"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'oklch(0.85 0.01 285)', fontSize: 12 }}
            width={90}
          />
          <Tooltip
            cursor={{ fill: 'oklch(1 0 0 / 0.05)' }}
            contentStyle={{
              background: 'oklch(0.16 0.005 285 / 0.95)',
              border: '1px solid oklch(1 0 0 / 0.1)',
              borderRadius: '12px',
              backdropFilter: 'blur(16px)',
            }}
            labelStyle={{ color: 'oklch(0.98 0 0)' }}
            formatter={(value: number) => [`${value} séries`, 'Volume (série-fator)']}
          />
          {/* MEV threshold */}
          <ReferenceLine
            x={MEV_THRESHOLD}
            stroke="oklch(0.72 0.17 162 / 0.4)"
            strokeDasharray="4 4"
            label={{ value: 'MEV', fill: 'oklch(0.72 0.17 162)', fontSize: 10, position: 'top' }}
          />
          {/* MRV threshold */}
          <ReferenceLine
            x={MRV_THRESHOLD}
            stroke="oklch(0.62 0.2 25 / 0.5)"
            strokeDasharray="4 4"
            label={{ value: 'MRV', fill: 'oklch(0.62 0.2 25)', fontSize: 10, position: 'top' }}
          />
          <Bar dataKey="sets" radius={[0, 6, 6, 0]} barSize={22}>
            {volumeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={
                  entry.isAboveMrv
                    ? 'oklch(0.62 0.2 25)'
                    : entry.isBelowMev
                    ? 'oklch(1 0 0 / 0.2)'
                    : 'oklch(0.72 0.17 162)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
