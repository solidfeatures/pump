'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, X, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  ZoomIn, Scale, Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getProgressPhotosAction } from '@/app/measures/actions'
import type { ProgressPhoto } from '@/lib/db/photos'
import type { BodyMetric } from '@/lib/db/measures'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ANGLE_ORDER = ['Frente', 'Costas', 'Lateral Esquerda', 'Lateral Direita', 'Outro']

interface Checkpoint {
  date: string
  metrics: BodyMetric | null
  photos: ProgressPhoto[]
  primaryPhoto: ProgressPhoto | null
  deltaWeight: number | null
  deltaBF: number | null
  deltaWaist: number | null
  deltaArms: number | null
  daysFromPrev: number | null
}

function armsValue(m: BodyMetric | null): number | null {
  if (!m) return null
  if (m.arms_cm) return Number(m.arms_cm)
  if (m.arm_left_cm && m.arm_right_cm) return (Number(m.arm_left_cm) + Number(m.arm_right_cm)) / 2
  if (m.arm_left_cm) return Number(m.arm_left_cm)
  if (m.arm_right_cm) return Number(m.arm_right_cm)
  return null
}

function buildCheckpoints(metrics: BodyMetric[], photos: ProgressPhoto[]): Checkpoint[] {
  const allDates = [...new Set([
    ...metrics.map(m => m.date),
    ...photos.map(p => p.date),
  ])].sort()

  // metrics are sorted desc from DB — build an ascending lookup map
  const metricByDate = new Map(metrics.map(m => [m.date, m]))

  let lastMetric: BodyMetric | null = null
  let lastDate: string | null = null

  return allDates.map(date => {
    const metric = metricByDate.get(date) ?? null
    const datePhotos = photos
      .filter(p => p.date === date)
      .sort((a, b) => ANGLE_ORDER.indexOf(a.angle) - ANGLE_ORDER.indexOf(b.angle))

    const prev = lastMetric
    const prevDate = lastDate
    if (metric) lastMetric = metric
    lastDate = date

    const daysFromPrev = prevDate ? differenceInDays(parseISO(date), parseISO(prevDate)) : null

    return {
      date,
      metrics: metric,
      photos: datePhotos,
      primaryPhoto: datePhotos[0] ?? null,
      deltaWeight: metric?.weight_kg != null && prev?.weight_kg != null
        ? Number(metric.weight_kg) - Number(prev.weight_kg) : null,
      deltaBF: metric?.bf_pct != null && prev?.bf_pct != null
        ? Number(metric.bf_pct) - Number(prev.bf_pct) : null,
      deltaWaist: metric?.waist_cm != null && prev?.waist_cm != null
        ? Number(metric.waist_cm) - Number(prev.waist_cm) : null,
      deltaArms: armsValue(metric) != null && armsValue(prev) != null
        ? armsValue(metric)! - armsValue(prev)! : null,
      daysFromPrev,
    }
  })
}

function DeltaPill({
  delta, unit, invertGood = false, className,
}: {
  delta: number | null
  unit: string
  invertGood?: boolean
  className?: string
}) {
  if (delta === null) return null
  if (Math.abs(delta) < 0.05) return (
    <span className={cn('inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white/10 text-muted-foreground', className)}>
      <Minus className="w-2.5 h-2.5" />±0{unit}
    </span>
  )
  const isGain = delta > 0
  const isGood = invertGood ? !isGain : isGain
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md',
      isGood ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400',
      className,
    )}>
      {isGain ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
      {isGain ? '+' : ''}{delta.toFixed(1)}{unit}
    </span>
  )
}

// ─────────────────────────── TimelineCard ────────────────────────────

function TimelineCard({ cp, index, isSelected, onClick }: {
  cp: Checkpoint
  index: number
  isSelected: boolean
  onClick: () => void
}) {
  const progressGlow = (cp.deltaBF !== null && cp.deltaBF < -0.3) ||
    (cp.deltaWaist !== null && cp.deltaWaist < -0.5) ||
    (cp.deltaArms !== null && cp.deltaArms > 0.3)

  return (
    <motion.button
      data-card-index={index}
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), type: 'spring', stiffness: 260, damping: 24 }}
      className={cn(
        'relative shrink-0 w-[136px] snap-center rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer focus:outline-none',
        isSelected
          ? 'border-emerald-500/50 scale-[1.03]'
          : 'border-white/10 hover:border-white/20 hover:scale-[1.01]',
      )}
      style={isSelected ? {
        boxShadow: progressGlow
          ? '0 0 28px rgba(16,185,129,0.30), 0 8px 32px rgba(0,0,0,0.5)'
          : '0 0 20px rgba(99,102,241,0.20), 0 8px 32px rgba(0,0,0,0.5)',
      } : undefined}
    >
      {/* Photo or placeholder */}
      <div className="aspect-[3/4] bg-black/60 relative">
        {cp.primaryPhoto ? (
          <img
            src={cp.primaryPhoto.url}
            alt="progresso"
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              isSelected ? 'brightness-100' : 'brightness-[0.65]',
            )}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Camera className={cn('w-7 h-7 transition-colors', isSelected ? 'text-muted-foreground/50' : 'text-muted-foreground/20')} />
            {cp.metrics && (
              <p className={cn('text-[9px] font-bold', isSelected ? 'text-muted-foreground/60' : 'text-muted-foreground/30')}>
                só medidas
              </p>
            )}
          </div>
        )}

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-black/30 pointer-events-none" />

        {/* Selected ring */}
        {isSelected && (
          <div className="absolute inset-0 rounded-2xl ring-2 ring-inset ring-emerald-500/50 pointer-events-none" />
        )}

        {/* Date chip */}
        <div className="absolute top-2 inset-x-2">
          <span className={cn(
            'block text-center text-[9px] font-bold px-2 py-0.5 rounded-lg transition-colors',
            isSelected ? 'bg-emerald-500 text-white' : 'bg-black/60 text-white/60',
          )}>
            {format(parseISO(cp.date), 'd MMM yy', { locale: ptBR })}
          </span>
        </div>

        {/* Bottom stats */}
        <div className="absolute bottom-2 inset-x-2 space-y-0.5">
          {cp.metrics?.weight_kg != null && (
            <p className="text-xs font-black text-white leading-none drop-shadow">
              {Number(cp.metrics.weight_kg).toFixed(1)} <span className="text-[9px] font-normal opacity-70">kg</span>
            </p>
          )}
          {cp.metrics?.bf_pct != null && (
            <p className="text-[9px] text-white/50 leading-none">
              {Number(cp.metrics.bf_pct).toFixed(1)}% BF
            </p>
          )}
          {cp.deltaWeight !== null && (
            <div className="pt-0.5">
              <DeltaPill delta={cp.deltaWeight} unit="kg" invertGood />
            </div>
          )}
        </div>
      </div>

      {/* Timeline dot below */}
      <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 z-10">
        <div className={cn(
          'w-2.5 h-2.5 rounded-full border-2 transition-colors',
          isSelected ? 'bg-emerald-400 border-emerald-400' : 'bg-background border-white/20',
        )} />
      </div>
    </motion.button>
  )
}

// ─────────────────────────── CheckpointDetail ────────────────────────

function CheckpointDetail({ cp, index, total, onLightbox }: {
  cp: Checkpoint
  index: number
  total: number
  onLightbox: (p: ProgressPhoto) => void
}) {
  const m = cp.metrics

  type StatEntry = { label: string; value: string; delta: number | null; invertGood?: boolean }
  const stats: StatEntry[] = [
    m?.weight_kg != null ? { label: 'Peso', value: `${Number(m.weight_kg).toFixed(1)} kg`, delta: cp.deltaWeight, invertGood: true } : null,
    m?.bf_pct != null ? { label: 'Gordura', value: `${Number(m.bf_pct).toFixed(1)}%`, delta: cp.deltaBF, invertGood: true } : null,
    m?.waist_cm != null ? { label: 'Cintura', value: `${Number(m.waist_cm)} cm`, delta: cp.deltaWaist, invertGood: true } : null,
    armsValue(m) != null ? { label: 'Braços', value: `${armsValue(m)!.toFixed(1)} cm`, delta: cp.deltaArms } : null,
    m?.chest_cm != null ? { label: 'Peito', value: `${Number(m.chest_cm)} cm`, delta: null } : null,
    m?.hips_cm != null ? { label: 'Quadril', value: `${Number(m.hips_cm)} cm`, delta: null } : null,
    m?.thighs_cm != null ? { label: 'Coxas', value: `${Number(m.thighs_cm)} cm`, delta: null } : null,
    m?.shoulders_cm != null ? { label: 'Ombros', value: `${Number(m.shoulders_cm)} cm`, delta: null } : null,
  ].filter(Boolean) as StatEntry[]

  const hasContent = cp.photos.length > 0 || stats.length > 0

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/20 backdrop-blur-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex flex-wrap items-start gap-3 justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
            Checkpoint {index + 1} / {total}
            {cp.daysFromPrev !== null && ` · +${cp.daysFromPrev}d do anterior`}
          </p>
          <h3 className="text-lg font-black text-white leading-none">
            {format(parseISO(cp.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <DeltaPill delta={cp.deltaWeight} unit="kg" invertGood className="text-xs px-2 py-1" />
          <DeltaPill delta={cp.deltaBF} unit="% BF" invertGood className="text-xs px-2 py-1" />
          <DeltaPill delta={cp.deltaArms} unit="cm braço" className="text-xs px-2 py-1" />
        </div>
      </div>

      {/* Body */}
      {hasContent ? (
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Photos */}
          {cp.photos.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Fotos · {cp.photos.length} ângulo{cp.photos.length !== 1 ? 's' : ''}
              </p>
              <div className={cn(
                'grid gap-2',
                cp.photos.length === 1 ? 'grid-cols-1 max-w-[200px]' :
                cp.photos.length === 2 ? 'grid-cols-2' :
                cp.photos.length === 3 ? 'grid-cols-3' :
                'grid-cols-4',
              )}>
                {cp.photos.map(photo => (
                  <motion.div
                    key={photo.id}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer group"
                    onClick={() => onLightbox(photo)}
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-white/5">
                      <img
                        src={photo.url}
                        alt={photo.angle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white" />
                      </div>
                      <div className="absolute bottom-1 inset-x-1">
                        <span className="block text-center text-[9px] font-bold bg-black/70 rounded px-1.5 py-0.5 text-white/80 truncate">
                          {photo.angle}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[120px] gap-2 text-muted-foreground/30 border border-dashed border-white/8 rounded-xl">
              <Camera className="w-7 h-7" />
              <p className="text-xs">Sem fotos neste checkpoint</p>
            </div>
          )}

          {/* Metrics */}
          {stats.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                Medidas
              </p>
              <div className="grid grid-cols-2 gap-2">
                {stats.map(({ label, value, delta, invertGood }) => (
                  <div key={label} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-base font-bold leading-none">{value}</p>
                    {delta !== null && (
                      <DeltaPill delta={delta} unit="" invertGood={invertGood} />
                    )}
                  </div>
                ))}
              </div>

              {/* Energy bar */}
              {m?.energy_level != null && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">Energia</span>
                  <div className="flex gap-0.5 flex-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex-1 h-1.5 rounded-full',
                          i < Number(m.energy_level) ? 'bg-emerald-500' : 'bg-white/10',
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold">{m.energy_level}/10</span>
                </div>
              )}

              {m?.pain_notes && (
                <p className="mt-3 text-xs text-amber-400/70 italic border-l-2 border-amber-500/30 pl-2 leading-relaxed">
                  "{m.pain_notes}"
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[120px] gap-2 text-muted-foreground/30 border border-dashed border-white/8 rounded-xl">
              <Scale className="w-7 h-7" />
              <p className="text-xs">Sem medidas neste checkpoint</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground/30">
          <Camera className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Checkpoint sem dados registrados</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────── BodyProgressTimeline ────────────────────

export interface BodyProgressTimelineProps {
  metrics: BodyMetric[]
}

export function BodyProgressTimeline({ metrics }: BodyProgressTimelineProps) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressPhoto | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getProgressPhotosAction(200).then(r => {
      const list = r.success ? r.data : []
      setPhotos(list)
      const cp = buildCheckpoints(metrics, list)
      setCheckpoints(cp)
      if (cp.length > 0) setSelectedIdx(cp.length - 1)
      setLoading(false)
    })
  }, [metrics])

  useEffect(() => {
    if (!scrollRef.current || checkpoints.length === 0) return
    const cards = scrollRef.current.querySelectorAll<HTMLElement>('[data-card-index]')
    cards[selectedIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedIdx, checkpoints.length])

  if (loading || checkpoints.length === 0) return null

  const selected = checkpoints[selectedIdx]

  const oldest = metrics[metrics.length - 1]
  const newest = metrics[0]
  const journeyWeight = oldest?.weight_kg != null && newest?.weight_kg != null
    ? Number(newest.weight_kg) - Number(oldest.weight_kg) : null
  const journeyBF = oldest?.bf_pct != null && newest?.bf_pct != null
    ? Number(newest.bf_pct) - Number(oldest.bf_pct) : null
  const totalDays = checkpoints.length > 1
    ? differenceInDays(parseISO(checkpoints[checkpoints.length - 1].date), parseISO(checkpoints[0].date))
    : 0

  const isOverallPositive = (journeyBF !== null && journeyBF < -0.5) ||
    (journeyWeight !== null && journeyWeight < -1)

  return (
    <div className="space-y-5">
      {/* ── Atmospheric cinematic header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/10"
        style={{
          background: isOverallPositive
            ? 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(0,0,0,0.5) 60%, rgba(5,150,105,0.06) 100%)'
            : 'linear-gradient(135deg, rgba(99,102,241,0.10) 0%, rgba(0,0,0,0.5) 60%, rgba(139,92,246,0.06) 100%)',
        }}
      >
        {/* Film grain */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'w-2 h-2 rounded-full',
                isOverallPositive ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400 animate-pulse',
              )} />
              <span className={cn(
                'text-[10px] font-black uppercase tracking-[0.2em]',
                isOverallPositive ? 'text-emerald-400/80' : 'text-indigo-400/80',
              )}>
                Jornada Física
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white">Transformação</h2>
            <p className="text-sm text-white/40 mt-0.5">
              {checkpoints.length} checkpoint{checkpoints.length !== 1 ? 's' : ''}
              {totalDays > 0 && ` · ${totalDays} dias`}
              {checkpoints.length > 0 && (
                ` · ${format(parseISO(checkpoints[0].date), 'MMM yy', { locale: ptBR })} → ${format(parseISO(checkpoints[checkpoints.length - 1].date), 'MMM yy', { locale: ptBR })}`
              )}
            </p>
          </div>

          {(journeyWeight !== null || journeyBF !== null) && (
            <div className="flex gap-6 sm:text-right">
              {journeyWeight !== null && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Peso total</p>
                  <p className={cn(
                    'text-xl font-black',
                    journeyWeight <= 0 ? 'text-emerald-400' : 'text-amber-400',
                  )}>
                    {journeyWeight > 0 ? '+' : ''}{journeyWeight.toFixed(1)} kg
                  </p>
                </div>
              )}
              {journeyBF !== null && (
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">BF total</p>
                  <p className={cn(
                    'text-xl font-black',
                    journeyBF <= 0 ? 'text-emerald-400' : 'text-amber-400',
                  )}>
                    {journeyBF > 0 ? '+' : ''}{journeyBF.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Timeline strip ── */}
      <div className="relative">
        {/* Connector line */}
        <div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
          style={{ top: '68px' }}
        />

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 px-1"
          style={{ scrollPaddingInline: '16px' }}
        >
          {checkpoints.map((cp, i) => (
            <TimelineCard
              key={cp.date}
              cp={cp}
              index={i}
              isSelected={i === selectedIdx}
              onClick={() => setSelectedIdx(i)}
            />
          ))}
        </div>

        {/* Edge fade overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />

        {/* Prev/Next arrows */}
        {selectedIdx > 0 && (
          <button
            onClick={() => setSelectedIdx(i => i - 1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/70 border border-white/10 hover:bg-black/90 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-white" />
          </button>
        )}
        {selectedIdx < checkpoints.length - 1 && (
          <button
            onClick={() => setSelectedIdx(i => i + 1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-black/70 border border-white/10 hover:bg-black/90 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* ── Selected checkpoint detail ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.date}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          <CheckpointDetail
            cp={selected}
            index={selectedIdx}
            total={checkpoints.length}
            onLightbox={setLightboxPhoto}
          />
        </motion.div>
      </AnimatePresence>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 8 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="relative max-w-[480px] w-full"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.angle}
                className="w-full rounded-2xl object-cover shadow-2xl"
              />
              <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2">
                <span className="text-xs font-bold bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-white shadow">
                  {lightboxPhoto.angle} · {format(parseISO(lightboxPhoto.date), "d MMM yyyy", { locale: ptBR })}
                </span>
                {lightboxPhoto.notes && (
                  <span className="text-xs bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 text-white/70 max-w-[160px] truncate shadow">
                    {lightboxPhoto.notes}
                  </span>
                )}
              </div>
            </motion.div>
            <button
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
              onClick={() => setLightboxPhoto(null)}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
