'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkout } from '@/lib/workout-context'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Dumbbell
} from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
  min,
  max,
  getYear,
  getMonth,
  setYear,
  setMonth
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CalendarView, WorkoutSession } from '@/lib/types'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'


interface WorkoutCalendarProps {
  onDateSelect?: (date: Date) => void
  selectedDate?: Date
  initialView?: CalendarView
  initialDate?: Date
}

export function WorkoutCalendar({ 
  onDateSelect, 
  selectedDate,
  initialView = 'month',
  initialDate
}: WorkoutCalendarProps) {
  const { sessions, getSessionByDate } = useWorkout()
  const [currentDate, setCurrentDate] = useState(initialDate || selectedDate || new Date())
  const [view, setView] = useState<CalendarView>(initialView)
  
  // Calculate date range for constraints
  const sessionDates = useMemo(() => {
    if (sessions.length === 0) return { minDate: new Date(), maxDate: new Date() }
    const dates = sessions.map(s => parseISO(s.date))
    return {
      minDate: startOfMonth(min(dates)),
      maxDate: endOfMonth(max(dates))
    }
  }, [sessions])

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const startYear = Math.min(sessionDates.minDate.getFullYear(), currentYear - 2)
    const endYear = Math.max(sessionDates.maxDate.getFullYear(), currentYear + 1)
    const result = []
    for (let y = startYear; y <= endYear; y++) {
      result.push(y)
    }
    return result
  }, [sessionDates])



  const handleYearChange = (year: string) => {
    setCurrentDate(setYear(currentDate, parseInt(year)))
  }

  const handleMonthChange = (month: string) => {
    setCurrentDate(setMonth(currentDate, parseInt(month)))
  }

  const months = [
    { value: '0', label: 'Janeiro' },
    { value: '1', label: 'Fevereiro' },
    { value: '2', label: 'Março' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Maio' },
    { value: '5', label: 'Junho' },
    { value: '6', label: 'Julho' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Setembro' },
    { value: '9', label: 'Outubro' },
    { value: '10', label: 'Novembro' },
    { value: '11', label: 'Dezembro' }
  ]
  
  const today = new Date()
  
  // Navigation handlers
  const goNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1))
    else setCurrentDate(addDays(currentDate, 1))
  }
  
  const goBack = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1))
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1))
    else setCurrentDate(subDays(currentDate, 1))
  }
  
  const goToToday = () => setCurrentDate(new Date())
  
  // Get days to display based on view
  const daysToDisplay = useMemo(() => {
    if (view === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    } else {
      return [currentDate]
    }
  }, [currentDate, view])
  
  // Get session for a specific day
  const getSessionForDay = (day: Date): WorkoutSession | undefined => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return getSessionByDate(dateStr)
  }
  
  // Get title based on view
  const getTitle = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy', { locale: ptBR })
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(weekStart, 'd MMM', { locale: ptBR })} - ${format(weekEnd, 'd MMM yyyy', { locale: ptBR })}`
    }
    return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="rounded-full hover:bg-white/10"
            disabled={view === 'month' && isSameDay(startOfMonth(currentDate), sessionDates.minDate)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <Select 
              value={currentDate.getMonth().toString()} 
              onValueChange={(val) => {
                const newDate = new Date(currentDate)
                newDate.setMonth(parseInt(val))
                setCurrentDate(newDate)
              }}
            >
              <SelectTrigger className="w-[130px] h-9 bg-white/5 border-white/10">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={currentDate.getFullYear().toString()} 
              onValueChange={(val) => {
                const newDate = new Date(currentDate)
                newDate.setFullYear(parseInt(val))
                setCurrentDate(newDate)
              }}
            >
              <SelectTrigger className="w-[90px] h-9 bg-white/5 border-white/10">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goNext}
            className="rounded-full hover:bg-white/10"
            disabled={view === 'month' && isSameDay(endOfMonth(currentDate), sessionDates.maxDate)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 mr-2">
            <Button
              variant={view === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('week')}
              className="h-7 text-xs px-3"
            >
              Semana
            </Button>
            <Button
              variant={view === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className="h-7 text-xs px-3"
            >
              Mês
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-xs h-9 bg-white/5 hover:bg-white/10 border border-white/10"
          >
            Hoje
          </Button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${view}-${currentDate.toISOString()}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'month' && (
            <MonthView 
              days={daysToDisplay} 
              currentDate={currentDate}
              today={today}
              getSessionForDay={getSessionForDay}
              onDateSelect={onDateSelect}
              selectedDate={selectedDate}
            />
          )}
          
          {view === 'week' && (
            <WeekView 
              days={daysToDisplay}
              today={today}
              getSessionForDay={getSessionForDay}
              onDateSelect={onDateSelect}
              selectedDate={selectedDate}
            />
          )}
          
          {view === 'day' && (
            <DayView 
              day={currentDate}
              today={today}
              getSessionForDay={getSessionForDay}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// Month View Component
function MonthView({ 
  days, 
  currentDate, 
  today, 
  getSessionForDay,
  onDateSelect,
  selectedDate
}: {
  days: Date[]
  currentDate: Date
  today: Date
  getSessionForDay: (day: Date) => WorkoutSession | undefined
  onDateSelect?: (date: Date) => void
  selectedDate?: Date
}) {
  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          const session = getSessionForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, today)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          
          return (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.01 }}
              onClick={() => onDateSelect?.(day)}
              className={cn(
                "aspect-square p-1 rounded-xl transition-all flex flex-col items-center justify-center gap-0.5",
                isCurrentMonth ? "text-foreground" : "text-muted-foreground/40",
                isToday && "ring-2 ring-primary",
                isSelected && "bg-primary/20",
                session && "hover:bg-white/10",
                !session && "hover:bg-white/5"
              )}
            >
              <span className={cn(
                "text-sm",
                isToday && "font-bold text-primary"
              )}>
                {format(day, 'd')}
              </span>
              {session && (
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  session.status === 'completed' ? "bg-primary" : 
                  session.status === 'in-progress' ? "bg-amber-400" : "bg-white/30"
                )} />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// Week View Component
function WeekView({ 
  days, 
  today, 
  getSessionForDay,
  onDateSelect,
  selectedDate
}: {
  days: Date[]
  today: Date
  getSessionForDay: (day: Date) => WorkoutSession | undefined
  onDateSelect?: (date: Date) => void
  selectedDate?: Date
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, idx) => {
        const session = getSessionForDay(day)
        const isToday = isSameDay(day, today)
        const isSelected = selectedDate && isSameDay(day, selectedDate)
        const isPast = day < today && !isToday
        
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onDateSelect?.(day)}
            className={cn(
              "p-3 rounded-xl transition-all cursor-pointer min-h-24",
              isToday ? "ring-2 ring-primary bg-white/5" : "bg-white/5 hover:bg-white/10",
              isSelected && "ring-2 ring-primary/50",
              isPast && !session?.status?.includes('completed') && "opacity-60"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground capitalize">
                {format(day, 'EEE', { locale: ptBR })}
              </span>
              <span className={cn(
                "text-lg font-semibold",
                isToday && "text-primary"
              )}>
                {format(day, 'd')}
              </span>
            </div>
            
            {session ? (
              <Link href={`/workout/${session.id}`}>
                <div className={cn(
                  "p-2 rounded-lg text-xs transition-colors",
                  session.status === 'completed' ? "bg-primary/20 text-primary" :
                  session.status === 'in-progress' ? "bg-amber-400/20 text-amber-400" :
                  "bg-white/10"
                )}>
                  <div className="flex items-center gap-1 mb-1">
                    {session.status === 'completed' ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : session.status === 'in-progress' ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <Dumbbell className="w-3 h-3" />
                    )}
                    <span className="font-medium truncate">{session.name}</span>
                  </div>
                  <p className="text-muted-foreground truncate">
                    {session.exercises?.length || 0} exercícios
                  </p>
                </div>
              </Link>
            ) : (
              <div className="p-2 rounded-lg bg-white/5 text-xs text-muted-foreground">
                Descanso
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// Day View Component
function DayView({ 
  day, 
  today, 
  getSessionForDay 
}: {
  day: Date
  today: Date
  getSessionForDay: (day: Date) => WorkoutSession | undefined
}) {
  const session = getSessionForDay(day)
  const isToday = isSameDay(day, today)
  
  return (
    <div className="space-y-4">
      <div className={cn(
        "p-6 rounded-2xl",
        isToday ? "bg-primary/10 ring-2 ring-primary" : "bg-white/5"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground capitalize">
              {format(day, 'EEEE', { locale: ptBR })}
            </p>
            <p className="text-2xl font-bold">
              {format(day, "d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          {isToday && (
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
              Hoje
            </span>
          )}
        </div>
        
        {session ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{session.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {session.exercises?.length || 0} exercícios programados
                </p>
              </div>
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                session.status === 'completed' ? "bg-primary/20 text-primary" :
                session.status === 'in-progress' ? "bg-amber-400/20 text-amber-400" :
                "bg-white/10"
              )}>
                {session.status === 'completed' ? (
                  <><CheckCircle2 className="w-4 h-4" /> Concluído</>
                ) : session.status === 'in-progress' ? (
                  <><Clock className="w-4 h-4" /> Em progresso</>
                ) : (
                  <><Dumbbell className="w-4 h-4" /> Pendente</>
                )}
              </div>
            </div>
            
            {/* Exercise list preview */}
            <div className="space-y-2">
              {session.exercises?.slice(0, 5).map((ex, idx) => (
                <div 
                  key={ex.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{ex.exercise.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {ex.sets.length} séries
                  </span>
                </div>
              ))}
              {session.exercises && session.exercises.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{session.exercises.length - 5} mais exercícios
                </p>
              )}
            </div>
            
            <Link href={`/workout/${session.id}`}>
              <Button className="w-full gap-2">
                {session.status === 'completed' ? 'Ver Treino' : 
                 session.status === 'in-progress' ? 'Continuar Treino' : 'Iniciar Treino'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Dia de descanso</p>
            <p className="text-sm text-muted-foreground mt-1">
              Nenhum treino programado para este dia
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
