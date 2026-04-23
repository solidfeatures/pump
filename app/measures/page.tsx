import { getMeasuresHistoryAction } from './actions'
import { MeasuresClient } from './measures-client'
import { getLatestBodyMetrics } from '@/lib/db'

export default async function MeasuresPage() {
  const initialHistory = await getMeasuresHistoryAction()
  const latestMetrics = await getLatestBodyMetrics()

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight"></h1>
      </div>

      <MeasuresClient
        initialHistory={initialHistory.success ? initialHistory.data : []}
        latestMetrics={latestMetrics}
      />
    </div>
  )
}
