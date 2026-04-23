import { NextResponse } from 'next/server'
import { 
  getLatestBodyMetrics, 
  getBodyMetricsHistory,
  getCurrentPhase, 
  getAllRules,
  getAthleteProfile,
  saveNutritionPlan
} from '@/lib/db'
import { calcIdealProportions, calcNaturalLBMLimit } from '@/lib/body-proportions'
import { format } from 'date-fns'

export async function POST() {
  let weight: number | undefined
  let height: number | undefined
  let bfPct: number | undefined
  let sleepHours = 8
  let energyLevel = 7
  let wrist: number | undefined
  let ankle: number | undefined
  let aiLogicSteps: string[] = []
  let recommendations: string[] = []

  try {
    // 1. Collect Context

    // 1. Collect Context
    const [latestMetrics, metricsHistory, currentPhase, aiRules, athleteProfile] = await Promise.all([
      getLatestBodyMetrics(),
      getBodyMetricsHistory(30),
      getCurrentPhase(),
      getAllRules(),
      getAthleteProfile()
    ])

    // 2. Data Resolution (Find most recent non-null/non-zero values)
    weight = latestMetrics?.weight_kg || metricsHistory.find(m => m.weight_kg != null && m.weight_kg > 0)?.weight_kg
    height = latestMetrics?.height_cm || metricsHistory.find(m => m.height_cm != null && m.height_cm > 0)?.height_cm
    bfPct = latestMetrics?.bf_pct || metricsHistory.find(m => m.bf_pct != null && m.bf_pct > 0)?.bf_pct
    sleepHours = latestMetrics?.sleep_hours || metricsHistory.find(m => m.sleep_hours != null && m.sleep_hours > 0)?.sleep_hours || 8
    energyLevel = latestMetrics?.energy_level || metricsHistory.find(m => m.energy_level != null && m.energy_level > 0)?.energy_level || 7
    
    // Proportionality metrics
    wrist = latestMetrics?.wrist_cm || metricsHistory.find(m => m.wrist_cm != null && m.wrist_cm > 0)?.wrist_cm
    ankle = latestMetrics?.ankle_cm || metricsHistory.find(m => m.ankle_cm != null && m.ankle_cm > 0)?.ankle_cm

    // 3. Validation
    const missingFields = []
    if (!weight || weight <= 0) missingFields.push('Peso')
    
    if (missingFields.length > 0) {
      return NextResponse.json({ 
        error: `Dados insuficientes: [${missingFields.join(', ')}]. Por favor, registre estas medidas na aba Medidas para uma análise nutricional precisa.` 
      }, { status: 400 })
    }

    // Height fallback as per docs/nutrition.md
    const finalHeight = height || 175
    if (!height) {
      aiLogicSteps.push("Aviso: Altura não encontrada, usando padrão 175cm")
    }

    // 4. Baseline Calculations
    let age = 25
    let isMale = true

    if (athleteProfile?.birth_date) {
      const birth = new Date(athleteProfile.birth_date)
      const today = new Date()
      age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
      }
    }

    if (athleteProfile?.gender) {
      isMale = athleteProfile.gender.toLowerCase() === 'masculino'
    }

    aiLogicSteps.push(`Perfil: ${age} anos, ${isMale ? 'Masc' : 'Fem'}`)

    // BMR (Mifflin-St Jeor)
    let bmr = (10 * Number(weight)) + (6.25 * Number(finalHeight)) - (5 * age)
    bmr = isMale ? bmr + 5 : bmr - 161

    // TDEE Calculation (Activity inference from training frequency as per specs)
    const trainingDays = athleteProfile?.training_days || 4
    let activityFactor = 1.375
    if (trainingDays >= 5) activityFactor = 1.725
    else if (trainingDays >= 3) activityFactor = 1.55

    const tdee = Math.round(bmr * activityFactor)

    // Goal Adjustment based on Athlete Profile Goal
    const athleteGoal = athleteProfile?.goal || 'Crescer Seco'
    const phaseType = currentPhase?.phaseType || 'Manutenção'
    let calories = tdee

    aiLogicSteps.push(`Objetivo Atleta: ${athleteGoal}`)

    switch (athleteGoal) {
      case 'Crescer Seco':
        // Lean bulk / Recomp - moderate surplus
        calories += 250
        break
      case 'Emagrecer':
        // Aggressive cut - significant deficit
        calories -= 500
        break
      case 'Ganho de Peso':
        // Traditional bulk - higher surplus
        calories += 500
        break
      case 'Manutenção':
      default:
        // Maintenance baseline
        calories = tdee
        break
    }

    // Secondary adjustment based on phase (Fine tuning)
    if (phaseType.toLowerCase().includes('intensificação')) {
      calories += 100 // Extra energy for peak performance
      aiLogicSteps.push(`Ajuste Fase: Intensificação (+100kcal)`)
    } else if (phaseType.toLowerCase().includes('deload')) {
      calories -= 200 // Less energy needed during deload
      aiLogicSteps.push(`Ajuste Fase: Deload (-200kcal)`)
    }

    // 5. Adaptive Engine Logic (Decision Explanation)
    aiLogicSteps.push(`BMR: ${Math.round(bmr)}kcal`)
    aiLogicSteps.push(`TDEE: ${tdee}kcal (${trainingDays} dias/sem)`)
    
    if (wrist) {
      const proportions = calcIdealProportions(wrist)
      if (proportions) {
        aiLogicSteps.push(`Proporções: Braço ${proportions.arms.toFixed(1)}cm, Peito ${proportions.chest.toFixed(1)}cm`)
      }
    }

    if (wrist && ankle && finalHeight) {
      const naturalLimit = calcNaturalLBMLimit(wrist, ankle, finalHeight)
      if (naturalLimit) {
        aiLogicSteps.push(`LBM Limite: ${naturalLimit.toFixed(1)}kg`)
      }
    }

    aiLogicSteps.push(`Objetivo: ${athleteGoal.toUpperCase()} (${phaseType}) -> ${calories}kcal iniciais`)

    // Weight Trend Analysis (Last 7 entries as per spec)
    const metrics7d = metricsHistory.slice(0, 7)
    if (metrics7d.length >= 2) {
      const latestW = weight!
      const oldestInWindow = metrics7d[metrics7d.length - 1]
      const oldestW = oldestInWindow.weight_kg || latestW
      const weightChange = (latestW - oldestW) / oldestW

      if (athleteGoal === 'Crescer Seco' || athleteGoal === 'Ganho de Peso') {
        if (weightChange > 0.005) {
          calories -= 150
          aiLogicSteps.push(`Ajuste Adaptativo: Ganho rápido (${(weightChange * 100).toFixed(2)}%/sem), -150kcal`)
          recommendations.push("Ganho de peso acima do ideal. Calorias reduzidas levemente para evitar ganho excessivo de gordura.")
        } else if (weightChange < 0.001) {
          calories += 150
          aiLogicSteps.push(`Ajuste Adaptativo: Ganho lento (${(weightChange * 100).toFixed(2)}%/sem), +150kcal`)
          recommendations.push("Progresso de peso abaixo da meta. Superávit aumentado para otimizar anabolismo.")
        }
      } else if (athleteGoal === 'Emagrecer') {
        if (weightChange > -0.0025) {
          calories -= 150
          aiLogicSteps.push(`Ajuste Adaptativo: Perda lenta (${(weightChange * 100).toFixed(2)}%/sem), -150kcal`)
          recommendations.push("Perda de peso estagnada. Déficit aumentado.")
        } else if (weightChange < -0.01) {
          calories += 150
          aiLogicSteps.push(`Ajuste Adaptativo: Perda agressiva (${(weightChange * 100).toFixed(2)}%/sem), +150kcal`)
          recommendations.push("Perda de peso muito rápida. Calorias aumentadas para preservar massa magra.")
        }
      }
    }

    // Recovery-based adjustments
    if (sleepHours < 6 || energyLevel < 4) {
      aiLogicSteps.push(`Recovery: Sono/Energia críticos (${sleepHours}h / ${energyLevel}/10) -> +10% Carbs`)
      recommendations.push("Recuperação sub-ótima detectada. Priorize o descanso e aumente levemente os carboidratos.")
    }

    // 6. Macro Calculation (Physiological constraints enforced)
    let proteinG: number
    if (bfPct) {
      const leanMass = weight! * (1 - (bfPct / 100))
      proteinG = Math.round(leanMass * 2.2)
      aiLogicSteps.push(`Proteína: ${proteinG}g (2.2g/kg Massa Magra)`)
    } else {
      proteinG = Math.round(weight! * 2.0)
      aiLogicSteps.push(`Proteína: ${proteinG}g (2.0g/kg Peso Total)`)
    }
    
    // Enforce Protein ≥ 1.6g/kg constraint
    const minProtein = Math.round(weight! * 1.6)
    if (proteinG < minProtein) {
      proteinG = minProtein
      aiLogicSteps.push("Proteína ajustada para mínimo (1.6g/kg)")
    }

    // Enforce Fat ≥ 0.6g/kg constraint
    let fatG = Math.round(weight! * 0.8)
    const minFat = Math.round(weight! * 0.6)
    if (fatG < minFat) {
      fatG = minFat
      aiLogicSteps.push("Gordura ajustada para mínimo (0.6g/kg)")
    } else {
      aiLogicSteps.push(`Gordura: ${fatG}g (0.8g/kg)`)
    }
    
    const proteinCal = proteinG * 4
    const fatCal = fatG * 9
    let remainingCal = calories - (proteinCal + fatCal)
    
    // Carb adjustment for recovery
    if (sleepHours < 6 || energyLevel < 4) {
      remainingCal *= 1.1 
      calories = Math.round(proteinCal + fatCal + remainingCal)
    }

    const carbsG = Math.max(0, Math.round(remainingCal / 4))
    aiLogicSteps.push(`Carboidratos: ${carbsG}g`)

    // 7. Meal Plan Construction (Refined UI-friendly structure)
    const mealPlan = [
      { 
        name: "Café da Manhã", 
        time: "07:30", 
        items: [
          `${Math.round(carbsG * 0.25)}g de Carbos (ex: Banana, Aveia, Mel)`,
          `${Math.round(proteinG * 0.2)}g de Prot (ex: Ovos, Whey Protein)`,
          "Fonte de gordura opcional"
        ]
      },
      { 
        name: "Almoço", 
        time: "12:30", 
        items: [
          `${Math.round(carbsG * 0.3)}g de Carbos (ex: Arroz, Feijão, Batata)`,
          `${Math.round(proteinG * 0.3)}g de Prot (ex: Frango, Patinho, Peixe)`,
          "Salada verde à vontade",
          "1 colher de sopa de Azeite"
        ]
      },
      { 
        name: "Lanche Pré-Treino", 
        time: "16:00", 
        items: [
          `${Math.round(carbsG * 0.2)}g de Carbos simples (ex: Fruta, Arroz branco)`,
          "Café preto (opcional)"
        ]
      },
      { 
        name: "Jantar Pós-Treino", 
        time: "19:30", 
        items: [
          `${Math.round(carbsG * 0.25)}g de Carbos complexos`,
          `${Math.round(proteinG * 0.3)}g de Prot para recuperação`,
          "Legumes cozidos variados"
        ]
      },
      { 
        name: "Ceia", 
        time: "22:00", 
        items: [
          `${Math.round(proteinG * 0.2)}g de Prot (ex: Iogurte Grego, Caseína)`,
          "Gorduras boas (ex: Amendoim, Abacate)"
        ]
      }
    ]

    const finalRecommendations = [
      ...recommendations,
      "Hidratação: Consuma 40ml de água por kg de peso corporal.",
      "Consistência: Tente manter os horários das refeições similares todos os dias.",
      "Ajuste Fino: Se sentir fome excessiva, aumente o volume de vegetais."
    ]

    const result = {
      date: format(new Date(), 'yyyy-MM-dd'),
      goal: athleteGoal,
      calories_target: Math.round(calories),
      protein_g: proteinG,
      carbs_g: carbsG,
      fat_g: fatG,
      meals: mealPlan,
      meal_plan: mealPlan, // redundant for compatibility
      ai_logic: aiLogicSteps.join(' | '),
      recommendations: finalRecommendations,
      weight_at_generation: Number(weight),
      phase_id: currentPhase?.id,
      model_used: "Pump Adaptive Engine v2"
    }

    // 8. Persist to Database
    await saveNutritionPlan(result)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('[Nutrition AI Route] Critical Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro interno ao processar plano nutricional. Tente novamente.' 
    }, { status: 500 })
  }
}
