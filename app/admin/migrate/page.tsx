'use client'

import { useState } from 'react'
import { GlassCard, GlassCardTitle } from '@/components/glass-card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, AlertTriangle, Upload } from 'lucide-react'
import { migrateWorkoutCSVAction, MigrationResult } from './actions'

export default function MigratePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  const handleMigrate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const r = await migrateWorkoutCSVAction()
      setResult(r)
    } catch (e) {
      setResult({
        sessionsCreated: 0, sessionsSkipped: 0,
        setsCreated: 0, setsSkipped: 0,
        notFound: [], errors: [String(e)],
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Migração de Dados</h1>
      <p className="text-muted-foreground mb-8">
        Importa o histórico de treinos dos arquivos CSV para o Supabase.
        A operação é idempotente — pode ser executada mais de uma vez sem duplicar dados.
      </p>

      <GlassCard className="p-6 space-y-6">
        <div>
          <GlassCardTitle className="mb-1">MIG-001 — Treinos (docs/treinos - Treinos.csv)</GlassCardTitle>
          <p className="text-sm text-muted-foreground">
            8 sessões · 2026-04-07 a 2026-04-20 · ~137 séries
          </p>
        </div>

        <Button onClick={handleMigrate} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {loading ? 'Migrando...' : 'Executar Migração'}
        </Button>

        {result && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Sessões criadas', value: result.sessionsCreated, ok: true },
                { label: 'Sessões ignoradas', value: result.sessionsSkipped, ok: null },
                { label: 'Séries criadas', value: result.setsCreated, ok: true },
                { label: 'Séries ignoradas', value: result.setsSkipped, ok: null },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.ok && s.value > 0 ? 'text-green-400' : ''}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {result.notFound.length > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-400">Exercícios não encontrados no banco</p>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {result.notFound.map(n => <li key={n}>• {n}</li>)}
                </ul>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-semibold text-red-400 mb-2">Erros</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              </div>
            )}

            {result.errors.length === 0 && result.notFound.length === 0 && (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <p className="text-sm">Migração concluída sem erros.</p>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
