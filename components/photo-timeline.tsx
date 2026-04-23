'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, ChevronLeft, ChevronRight, GitCompareArrows } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { cn } from '@/lib/utils'
import { getProgressPhotosAction } from '@/app/measures/actions'
import type { ProgressPhoto } from '@/lib/db/photos'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const ANGLE_ORDER = ['Frente', 'Costas', 'Lateral Esquerda', 'Lateral Direita', 'Outro']

export function PhotoTimeline() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [compareDate, setCompareDate] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const r = await getProgressPhotosAction(100)
    if (r.success) {
      setPhotos(r.data)
      const uniqueDates = [...new Set(r.data.map(p => p.date))].sort((a, b) => b.localeCompare(a))
      setDates(uniqueDates)
      if (uniqueDates.length > 0 && !selectedDate) setSelectedDate(uniqueDates[0])
    }
    setLoading(false)
  }, [selectedDate])

  useEffect(() => { load() }, [load])

  const photosForDate = (date: string | null) =>
    date ? photos.filter(p => p.date === date).sort((a, b) => ANGLE_ORDER.indexOf(a.angle) - ANGLE_ORDER.indexOf(b.angle)) : []

  const selectedPhotos = photosForDate(selectedDate)
  const comparePhotos = photosForDate(compareDate)

  if (loading) return null
  if (dates.length === 0) return null

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <GlassCardTitle>Linha do Tempo de Progresso</GlassCardTitle>
        </div>
        {dates.length > 1 && (
          <Button
            size="sm"
            variant={compareMode ? 'default' : 'outline'}
            className="gap-1.5 text-xs"
            onClick={() => {
              setCompareMode(!compareMode)
              if (!compareMode && dates.length > 1) setCompareDate(dates[1])
              else setCompareDate(null)
            }}
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            Comparar
          </Button>
        )}
      </div>

      {/* Date selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {dates.map(date => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
              selectedDate === date
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
            )}
          >
            {format(parseISO(date), "d MMM yy", { locale: ptBR })}
            <span className="ml-1 text-[10px] opacity-60">({photos.filter(p => p.date === date).length})</span>
          </button>
        ))}
      </div>

      {compareMode && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <span className="shrink-0 text-xs text-muted-foreground self-center">Comparar com:</span>
          {dates.filter(d => d !== selectedDate).map(date => (
            <button
              key={date}
              onClick={() => setCompareDate(date)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
                compareDate === date
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
              )}
            >
              {format(parseISO(date), "d MMM yy", { locale: ptBR })}
            </button>
          ))}
        </div>
      )}

      {/* Photos grid */}
      {compareMode && compareDate ? (
        <div className="space-y-4">
          {ANGLE_ORDER.map(angle => {
            const p1 = selectedPhotos.find(p => p.angle === angle)
            const p2 = comparePhotos.find(p => p.angle === angle)
            if (!p1 && !p2) return null
            return (
              <div key={angle}>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">{angle}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[{ photo: p1, date: selectedDate! }, { photo: p2, date: compareDate }].map(({ photo, date }, i) => (
                    <div key={i} className="space-y-1">
                      <p className={cn('text-[10px] font-bold text-center px-2 py-0.5 rounded-md', i === 0 ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-400')}>
                        {format(parseISO(date), "d MMM yy", { locale: ptBR })}
                      </p>
                      {photo ? (
                        <div
                          className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer"
                          onClick={() => setLightboxUrl(photo.url)}
                        >
                          <img src={photo.url} alt={photo.angle} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="aspect-[3/4] rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {selectedPhotos.map(photo => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="cursor-pointer"
              onClick={() => setLightboxUrl(photo.url)}
            >
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/40 transition-colors">
                <img src={photo.url} alt={photo.angle} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-1">{photo.angle}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              src={lightboxUrl}
              alt="foto ampliada"
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
              onClick={() => setLightboxUrl(null)}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}
