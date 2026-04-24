import NutritionClient from './nutrition-client'
import { getActiveProtocol, getAllProtocols } from '@/lib/db/nutrition'

export default async function NutritionPage() {
  const [activeProtocol, protocols] = await Promise.all([
    getActiveProtocol(),
    getAllProtocols(20),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <NutritionClient
        initialProtocol={activeProtocol}
        initialProtocols={protocols}
      />
    </div>
  )
}
