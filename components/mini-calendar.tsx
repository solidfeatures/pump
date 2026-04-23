'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useWorkout } from '@/lib/workout-context'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'

interface MiniCalendarProps {
  selectedDate: string // YYYY-MM-DD
  onDayClick: (date: string) => void
  className?: string
}

export function MiniCalendar({ selectedDate, onDayClick, className }: MiniCalendarProps) {
  const { getSessionByDate } = useWorkout()
  const parsedDate = parseISO(selectedDate)

  const daysToDisplay = useMemo(() => {
    const monthStart = startOfMonth(parsedDate)
    const monthEnd = endOfMonth(parsedDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [parsedDate])

  return (
    <GlassCard className={className}>
      <GlassCardTitle className="mb-4 text-sm font-medium capitalize">
        {format(parsedDate, 'MMMM yyyy', { locale: ptBR })}
      </GlassCardTitle>

      <TooltipProvider delayDuration={200}>
        <div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((day, idx) => (
              <div key={idx} className="text-center text-[10px] text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysToDisplay.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const session = getSessionByDate(dateStr)
              const isCurrentMonth = isSameMonth(day, parsedDate)
              const isSelected = dateStr === selectedDate
              const isToday = isSameDay(day, new Date())

              // Determine muscle groups from session exercises
              return (
                <Tooltip key={dateStr}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onDayClick(dateStr)}
                      className={cn(
                        "h-8 w-full flex items-center justify-center text-[11px] rounded-full transition-all relative",
                        !isCurrentMonth && "text-muted-foreground/30",
                        isCurrentMonth && "text-foreground",
                        isToday && !isSelected && "text-primary font-bold bg-primary/10",
                        isSelected && "bg-primary text-primary-foreground font-bold shadow-sm"
                      )}
                    >
                      {format(day, 'd')}
                      {session && (
                        <span className={cn(
                          "absolute bottom-1.5 w-1 h-1 rounded-full",
                          isSelected ? "bg-primary-foreground/50" : session.status === 'completed' ? "bg-primary" : "bg-primary/40"
                        )} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-semibold text-[11px]">{format(day, "d 'de' MMMM", { locale: ptBR })}</p>
                      {session ? (
                        <>
                          <p className="text-[10px] text-muted-foreground">{session.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Status: {session.status === 'completed' ? 'Concluído' : session.status === 'in-progress' ? 'Em Progresso' : 'Pendente'}
                          </p>
                        </>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Descanso</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>
      </TooltipProvider>
    </GlassCard>
  )
}
