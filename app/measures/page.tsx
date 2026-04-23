'use server'

import { getMeasuresHistoryAction } from './actions'
import { MeasuresClient } from './measures-client'
import { getLatestBodyMetrics } from '@/lib/db'

export default async function MeasuresPage() {
  const initialHistory = await getMeasuresHistoryAction()
  const latestMetrics = await getLatestBodyMetrics()

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Medidas Corporais</h1>
        <p className="text-muted-foreground">
          Acompanhe seu progresso físico e analise suas proporções.
        </p>
      </div>

      <MeasuresClient 
        initialHistory={initialHistory.success ? initialHistory.data : []} 
        latestMetrics={latestMetrics}
      />
    </div>
  )
}
