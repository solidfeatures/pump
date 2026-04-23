'use client'

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Dumbbell, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWorkout } from '@/lib/workout-context'
import { isSameDay } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DayNavProps {
  date: string
  onPrev: () => void
  onNext: () => void
  className?: string
}

export function DayNav({ date, onPrev, onNext, className }: DayNavProps) {
  const { getSessionByDate } = useWorkout()
  const parsedDate = parseISO(date)
  const session = getSessionByDate(date)
  const today = new Date()
  const isToday = isSameDay(parsedDate, today)

  return (
    <div className={cn(
      "p-5 lg:p-6 rounded-2xl border border-white/10 flex flex-col",
      isToday ? "bg-primary/5 ring-1 ring-primary/20" : "bg-white/5",
      className
    )}>
      {/* Header with Navigation */}
      <div className="flex items-start justify-between mb-4 shrink-0">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {format(parsedDate, 'EEEE', { locale: ptBR })}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-xl font-bold tracking-tight">
              {format(parsedDate, "d 'de' MMMM", { locale: ptBR })}
            </h2>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
                Hoje
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg">
          <Button variant="ghost" size="icon" onClick={onPrev} className="h-7 w-7 cursor-pointer rounded-md">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onNext} className="h-7 w-7 cursor-pointer rounded-md">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Session Details */}
      {session ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-start justify-between shrink-0">
            <div>
              <h3 className="text-lg font-semibold">{session.name}</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {session.exercises?.length || 0} exercícios programados
              </p>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border",
              session.status === 'completed' ? "bg-primary/10 text-primary border-primary/20" :
              session.status === 'in-progress' ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
              "bg-white/5 border-white/10 text-muted-foreground"
            )}>
              {session.status === 'completed' ? (
                <><CheckCircle2 className="w-3 h-3" /> Concluído</>
              ) : session.status === 'in-progress' ? (
                <><Clock className="w-3 h-3" /> Em progresso</>
              ) : (
                <><Dumbbell className="w-3 h-3" /> Pendente</>
              )}
            </div>
          </div>
          
          <div className="space-y-1 mt-4 flex-1 overflow-y-auto min-h-0 pr-1 pb-1 scrollbar-thin">
            {session.exercises?.map((ex, idx) => (
              <div 
                key={ex.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border border-white/5 shrink-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-medium">{ex.exercise.name}</span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {ex.sets.length} séries
                </span>
              </div>
            ))}
          </div>
          
          <div className="shrink-0 mt-3">
            <Link href={`/workout/${session.id}`} className="block">
              <Button className="w-full h-9 text-xs font-medium gap-2">
                {session.status === 'completed' ? 'Ver Treino' : 
                 session.status === 'in-progress' ? 'Continuar Treino' : 'Iniciar Treino'}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 bg-black/10 rounded-xl border border-white/5 mt-4">
          <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-base font-medium text-muted-foreground">Dia de Descanso</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Nenhum treino programado
          </p>
        </div>
      )}
    </div>
  )
}
