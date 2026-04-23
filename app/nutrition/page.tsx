import NutritionClient from './nutrition-client'
import { getLatestNutritionPlan, getNutritionHistory } from '@/lib/db/nutrition'

export default async function NutritionPage() {
  const latestPlan = await getLatestNutritionPlan()
  const history = await getNutritionHistory(20)

  // Ensure meals is parsed if it's stored as a string or handle the any type safely
  const formattedPlan = latestPlan ? {
    ...latestPlan,
    meals: Array.isArray(latestPlan.meals) ? latestPlan.meals : []
  } : null

  const formattedHistory = history.map(plan => ({
    ...plan,
    meals: Array.isArray(plan.meals) ? plan.meals : []
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <NutritionClient initialPlan={formattedPlan as any} initialHistory={formattedHistory as any} />
    </div>
  )
}

