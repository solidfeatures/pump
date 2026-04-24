'use client'

import { motion } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO, isToday } from 'date-fns'

const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function currentWeekDates(): string[] {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d)
  monday.setDate(diff)
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday)
    dt.setDate(monday.getDate() + i)
    return dt.toISOString().split('T')[0]
  })
}

export function WeeklyCalendar() {
  const { sessions } = useWorkout()

  const weekDates = currentWeekDates()
  const weekSessions = weekDates.map((date, index) => {
    const session = sessions.find(s => s.date === date)
    return {
      date,
      dayLabel: dayLabels[index],
      dayNumber: format(parseISO(date), 'd'),
      session,
      isToday: isToday(parseISO(date)),
    }
  })
  
  return (
    <div className="overflow-x-auto -mx-1">
    <div className="grid grid-cols-7 gap-2 min-w-[420px]">
      {weekSessions.map((day, index) => (
        <motion.div
          key={day.date}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          {day.session ? (
            <Link href={`/workout/${day.session.id}`}>
              <div
                className={cn(
                  "relative p-3 rounded-xl text-center transition-all cursor-pointer",
                  day.isToday 
                    ? "bg-primary/20 border border-primary/30" 
                    : "glass-subtle hover:bg-white/10",
                  day.session.status === 'completed' && "bg-primary/10"
                )}
              >
                <p className="text-xs text-muted-foreground mb-1">{day.dayLabel}</p>
                <p className={cn(
                  "text-lg font-semibold mb-2",
                  day.isToday && "text-primary"
                )}>
                  {day.dayNumber}
                </p>
                
                <div className="flex justify-center">
                  {day.session.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Dumbbell className={cn(
                      "w-5 h-5",
                      day.isToday ? "text-primary" : "text-muted-foreground"
                    )} />
                  )}
                </div>
                
                <p className="text-xs mt-2 truncate text-muted-foreground">
                  {day.session.name}
                </p>
              </div>
            </Link>
          ) : (
            <div className="p-3 rounded-xl text-center glass-subtle opacity-50">
              <p className="text-xs text-muted-foreground mb-1">{day.dayLabel}</p>
              <p className="text-lg font-semibold mb-2">{day.dayNumber}</p>
              <div className="flex justify-center">
                <Circle className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-xs mt-2 text-muted-foreground">Descanso</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
    </div>
  )
}
