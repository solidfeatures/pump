'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { AthleteProfile } from '@/lib/db/athlete'
import { updateProfileAction } from '@/app/actions'
import {
  User, Target, Dumbbell, ShieldAlert, Save, Loader2, Calendar,
  Bot, Database, FileDown, AlertTriangle,
} from 'lucide-react'
import { AiSettingsPanel } from '@/components/ai-settings-panel'
import { WeeklyDaySelector } from '@/components/weekly-day-selector'
import { AthleteSummaryCard } from '@/components/athlete-summary-card'

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null
  const today = new Date()
  const dob = new Date(birthDate)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

interface Props {
  initialProfile: AthleteProfile | null
}

export function ProfileForm({ initialProfile }: Props) {
  const [profile, setProfile] = useState<AthleteProfile | null>(initialProfile)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    try {
      const updated = await updateProfileAction(profile)
      if (updated) setProfile(updated)
      toast.success('Perfil atualizado com sucesso!')
    } catch {
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
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
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto pb-24 md:pb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie seus dados e preferências do app.
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass border-white/10">
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="w-4 h-4" />
            Automação IA
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="w-4 h-4" />
            Dados & Conta
          </TabsTrigger>
        </TabsList>

        {/* ────────── TAB 1: PERFIL ────────── */}
        <TabsContent value="profile" className="space-y-6">
          <AthleteSummaryCard />

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onChange={e => setProfile({ ...profile, name: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Nível de Experiência</Label>
                  <Select
                    value={profile.experience_level}
                    onValueChange={v => setProfile({ ...profile, experience_level: v })}
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
                      onChange={e => setProfile({ ...profile, training_days: parseInt(e.target.value) || 1 })}
                      className="bg-white/5 border-white/10 pl-10"
                    />
                    <Dumbbell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Sexo</Label>
                  <Select
                    value={profile.gender ?? 'Masculino'}
                    onValueChange={v => setProfile({ ...profile, gender: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Masculino">Masculino</SelectItem>
                      <SelectItem value="Feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <div className="relative">
                    <Input
                      id="birth_date"
                      type="date"
                      value={profile.birth_date ?? ''}
                      onChange={e => setProfile({ ...profile, birth_date: e.target.value })}
                      className="bg-white/5 border-white/10 pl-10"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  {profile.birth_date && (
                    <p className="text-xs text-muted-foreground">{calcAge(profile.birth_date)} anos</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <GlassCardTitle>Objetivo & Plano</GlassCardTitle>
                </div>

                <div className="space-y-2">
                  <Label>Objetivo Atual</Label>
                  <Select
                    value={profile.goal ?? ''}
                    onValueChange={v => setProfile({ ...profile, goal: v })}
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
                    Este objetivo guiará as recomendações da IA.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Dias de Treino</Label>
                  <WeeklyDaySelector
                    value={profile.training_day_mask ?? [1, 3, 5]}
                    onChange={days => setProfile({ ...profile, training_day_mask: days })}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    A IA usará estes dias como âncoras ao gerar o plano semanal.
                  </p>
                </div>
              </GlassCard>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground min-w-[150px]"
              >
                {saving ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : (<><Save className="w-4 h-4" />Salvar Alterações</>)}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ────────── TAB 2: AUTOMAÇÃO IA ────────── */}
        <TabsContent value="ai" className="space-y-6">
          <AiSettingsPanel
            settings={{
              auto_weekly_plan: profile.auto_weekly_plan ?? true,
              auto_contingency_plan: profile.auto_contingency_plan ?? true,
              auto_phase_alert: profile.auto_phase_alert ?? true,
            }}
            onChange={async (key, value) => {
              const updated = { ...profile, [key]: value }
              setProfile(updated)
              try {
                await updateProfileAction(updated)
                toast.success('Configuração atualizada')
              } catch {
                toast.error('Erro ao salvar configuração')
                setProfile(profile)
              }
            }}
          />

          <GlassCard className="p-6">
            <GlassCardTitle className="mb-3">Como funciona</GlassCardTitle>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">Replanejamento Semanal:</strong> toda segunda-feira a IA analisa seu treino da semana anterior (cargas, RPE, volume) e gera automaticamente as sessões da nova semana com progressão adequada.
              </p>
              <p>
                <strong className="text-foreground">Contingência:</strong> após cada treino concluído, a IA verifica se você perdeu exercícios ou séries e redistribui o volume pelas sessões restantes da semana — respeitando limites de fadiga.
              </p>
              <p>
                <strong className="text-foreground">Alertas de Fase:</strong> quando uma fase atinge o número máximo de semanas planejado, a IA sugere iniciar a próxima fase do macrociclo.
              </p>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ────────── TAB 3: DADOS & CONTA ────────── */}
        <TabsContent value="data" className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
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
                  onChange={e =>
                    setProfile({
                      ...profile,
                      injuries: e.target.value.split('\n').filter(l => l.trim() !== ''),
                    })
                  }
                  className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  placeholder={'Ex: Lesão no ombro direito\nDores no joelho ao agachar'}
                />
                <p className="text-[10px] text-muted-foreground">
                  A IA considera estas limitações ao selecionar exercícios.
                </p>
              </div>
            </GlassCard>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saving}
                className="gap-2 bg-primary hover:bg-primary/80 text-primary-foreground min-w-[150px]"
              >
                {saving ? (<><Loader2 className="w-4 h-4 animate-spin" />Salvando...</>) : (<><Save className="w-4 h-4" />Salvar</>)}
              </Button>
            </div>
          </form>

          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileDown className="w-5 h-5 text-blue-400" />
              <GlassCardTitle>Exportar Dados</GlassCardTitle>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Exporte seu histórico completo de treinos, medidas e planos nutricionais.
            </p>
            <Button variant="outline" size="sm" disabled className="gap-2 border-white/10 bg-white/5">
              <FileDown className="w-4 h-4" />
              Exportar CSV (em breve)
            </Button>
          </GlassCard>

          <GlassCard className="p-6 border-red-500/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <GlassCardTitle>Zona de Perigo</GlassCardTitle>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Ações irreversíveis. Proceda com cautela.
            </p>
            <Button variant="outline" size="sm" disabled className="gap-2 border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10">
              <AlertTriangle className="w-4 h-4" />
              Resetar todos os dados (em breve)
            </Button>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
