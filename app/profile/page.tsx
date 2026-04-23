'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { AthleteGoal } from '@/lib/types'
import { AthleteProfile } from '@/lib/db/athlete'
import { getProfileAction, updateProfileAction } from '@/app/actions'
import { User, Target, Calendar, Dumbbell, ShieldAlert, Save, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<AthleteProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const p = await getProfileAction()
        if (p) {
          setProfile(p)
        }
      } catch (e) {
        console.error(e)
        toast.error('Erro ao carregar perfil')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      await updateProfileAction(profile)
      toast.success('Perfil atualizado com sucesso!')
    } catch (e) {
      console.error(e)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Perfil não encontrado.</p>
        <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie seus dados e objetivos para que a IA possa personalizar seu plano.
        </p>
      </motion.div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <GlassCardTitle>Informações Básicas</GlassCardTitle>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input 
                id="name" 
                value={profile.name} 
                onChange={e => setProfile({...profile, name: e.target.value})}
                className="bg-white/5 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <Select 
                value={profile.gender} 
                onValueChange={v => setProfile({...profile, gender: v})}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <div className="relative">
                <Input 
                  id="birth_date" 
                  type="date"
                  value={profile.birth_date} 
                  onChange={e => setProfile({...profile, birth_date: e.target.value})}
                  className="bg-white/5 border-white/10 pl-10"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </GlassCard>

          {/* Objetivo e Nível */}
          <GlassCard className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <GlassCardTitle>Objetivo & Plano</GlassCardTitle>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo Atual</Label>
              <Select 
                value={profile.goal} 
                onValueChange={v => setProfile({...profile, goal: v as AthleteGoal})}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Selecione seu objetivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Crescer Seco">Crescer Seco</SelectItem>
                  <SelectItem value="Emagrecer">Emagrecer</SelectItem>
                  <SelectItem value="Ganho de Peso">Ganho de Peso</SelectItem>
                  <SelectItem value="Manutenção">Manutenção</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Este objetivo guiará as recomendações de treino e nutrição da IA.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Nível de Experiência</Label>
              <Select 
                value={profile.experience_level} 
                onValueChange={v => setProfile({...profile, experience_level: v})}
              >
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Selecione seu nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="training_days">Dias de Treino por Semana</Label>
              <div className="relative">
                <Input 
                  id="training_days" 
                  type="number"
                  min={1}
                  max={7}
                  value={profile.training_days} 
                  onChange={e => setProfile({...profile, training_days: parseInt(e.target.value) || 0})}
                  className="bg-white/5 border-white/10 pl-10"
                />
                <Dumbbell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Lesões */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <GlassCardTitle>Lesões ou Limitações</GlassCardTitle>
          </div>
          <div className="space-y-2">
            <Label htmlFor="injuries">Descreva qualquer lesão (uma por linha)</Label>
            <textarea
              id="injuries"
              value={profile.injuries.join('\n')}
              onChange={e => setProfile({...profile, injuries: e.target.value.split('\n').filter(l => l.trim() !== '')})}
              className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              placeholder="Ex: Lesão no ombro direito&#10;Dores no joelho ao agachar"
            />
          </div>
        </GlassCard>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving}
            className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground min-w-[150px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
