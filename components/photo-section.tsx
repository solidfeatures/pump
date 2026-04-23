'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Upload, Trash2, X, ZoomIn, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  getProgressPhotosAction, saveProgressPhotoAction, deleteProgressPhotoAction,
} from '@/app/measures/actions'
import type { ProgressPhoto } from '@/lib/db/photos'

const ANGLES = ['Frente', 'Costas', 'Lateral Esquerda', 'Lateral Direita', 'Outro'] as const
const BUCKET = 'progress-photos'

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}

function today() {
  return new Date().toISOString().split('T')[0]
}

export function PhotoSection() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [angle, setAngle] = useState<string>('Frente')
  const [photoDate, setPhotoDate] = useState(today())
  const [notes, setNotes] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadPhotos = useCallback(async () => {
    const r = await getProgressPhotosAction(20)
    if (r.success) setPhotos(r.data)
  }, [])

  useEffect(() => { loadPhotos() }, [loadPhotos])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const ext = selectedFile.name.split('.').pop() ?? 'jpg'
      const path = `${photoDate}/${angle.replace(/\s+/g, '_')}/${Date.now()}.${ext}`

      const sb = supabaseClient()
      const { error } = await sb.storage.from(BUCKET).upload(path, selectedFile, { upsert: false })
      if (error) throw new Error(error.message)

      const result = await saveProgressPhotoAction({ date: photoDate, storage_path: path, angle, notes: notes || undefined })
      if (!result.success) throw new Error(result.error)

      toast.success('Foto registrada!')
      setDialogOpen(false)
      setSelectedFile(null)
      setPreview(null)
      setNotes('')
      setAngle('Frente')
      setPhotoDate(today())
      if (fileInputRef.current) fileInputRef.current.value = ''
      loadPhotos()
    } catch (e) {
      toast.error(`Erro ao enviar foto: ${e}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photo: ProgressPhoto) => {
    try {
      const sb = supabaseClient()
      await sb.storage.from(BUCKET).remove([photo.storage_path])
      await deleteProgressPhotoAction(photo.id, photo.storage_path)
      toast.success('Foto removida.')
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
    } catch (e) {
      toast.error('Erro ao remover foto.')
    }
  }

  // Group by date for display
  const byDate = photos.reduce<Record<string, ProgressPhoto[]>>((acc, p) => {
    acc[p.date] = [...(acc[p.date] ?? []), p]
    return acc
  }, {})

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          <GlassCardTitle>Fotos de Progresso</GlassCardTitle>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              Adicionar Foto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Foto de Progresso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="preview" className="w-full rounded-xl object-cover max-h-64" />
                  <button
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1"
                    onClick={() => { setPreview(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar ou tirar foto</p>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data</Label>
                  <Input type="date" value={photoDate} onChange={e => setPhotoDate(e.target.value)} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Ângulo</Label>
                  <Select value={angle} onValueChange={setAngle}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANGLES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Notas (opcional)</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Após 4 semanas de bulking" className="bg-white/5 border-white/10" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="gap-2">
                {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                {uploading ? 'Enviando...' : 'Salvar Foto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
          <Camera className="w-10 h-10 opacity-20" />
          <p className="text-sm">Nenhuma foto registrada ainda.</p>
          <p className="text-xs">Registre fotos periodicamente para acompanhar seu progresso visual.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byDate).map(([date, datePhotos]) => (
            <div key={date}>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {datePhotos.map(photo => (
                  <div key={photo.id} className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <img src={photo.url} alt={photo.angle} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                      <p className="text-[10px] text-white font-semibold">{photo.angle}</p>
                      <div className="flex gap-1.5">
                        <button onClick={() => setLightboxUrl(photo.url)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer">
                          <ZoomIn className="w-3.5 h-3.5 text-white" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 transition-colors cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover foto?</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(photo)} className="bg-red-600 hover:bg-red-500">Remover</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
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
