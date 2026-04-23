import NutritionClient from './nutrition-client'
import { getLatestNutritionPlan } from '@/lib/db/nutrition'

export default async function NutritionPage() {
  const latestPlan = await getLatestNutritionPlan()

  // Ensure meals is parsed if it's stored as a string or handle the any type safely
  const formattedPlan = latestPlan ? {
    ...latestPlan,
    meals: Array.isArray(latestPlan.meals) ? latestPlan.meals : []
  } : null

  return (
    <div className="container mx-auto px-4 py-8">
      <NutritionClient initialPlan={formattedPlan as any} />
    </div>
  )
}
