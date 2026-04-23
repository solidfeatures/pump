/**
 * Seed script — inserts the full Jayme de Lamadrid macrocycle into Supabase.
 * Run with: npx tsx prisma/seed.ts
 *
 * Safe to re-run: uses upsertMany via createMany + skipDuplicates where possible,
 * or updateOrCreate per-record for phases/sessions that must be idempotent.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

try { process.loadEnvFile('.env.local') } catch { /* ok */ }
try { process.loadEnvFile('.env') } catch { /* ok */ }

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ─── RAW EXERCISE DATA ────────────────────────────────────────────────────────

const EXERCISES = [
  { mockId: '1',  name: 'Supino Reto (Barra)',          movementPattern: 'Horizontal Push',       classification: 'Compound',  neuralDemand: 8 },
  { mockId: '2',  name: 'Supino Inclinado (Halteres)',  movementPattern: 'Incline Push',           classification: 'Compound',  neuralDemand: 7 },
  { mockId: '3',  name: 'Crossover (Cabo)',             movementPattern: 'Horizontal Adduction',   classification: 'Isolation', neuralDemand: 4 },
  { mockId: '4',  name: 'Remada Curvada (Barra)',       movementPattern: 'Horizontal Pull',        classification: 'Compound',  neuralDemand: 8 },
  { mockId: '5',  name: 'Pulldown (Polia)',             movementPattern: 'Vertical Pull',          classification: 'Compound',  neuralDemand: 6 },
  { mockId: '6',  name: 'Remada Sentada (Cabo)',        movementPattern: 'Horizontal Pull',        classification: 'Compound',  neuralDemand: 6 },
  { mockId: '7',  name: 'Desenvolvimento (Barra)',      movementPattern: 'Vertical Push',          classification: 'Compound',  neuralDemand: 8 },
  { mockId: '8',  name: 'Elevação Lateral',             movementPattern: 'Shoulder Abduction',     classification: 'Isolation', neuralDemand: 3 },
  { mockId: '9',  name: 'Face Pull (Cabo)',             movementPattern: 'External Rotation',      classification: 'Isolation', neuralDemand: 3 },
  { mockId: '10', name: 'Rosca Direta (Barra)',         movementPattern: 'Elbow Flexion',          classification: 'Isolation', neuralDemand: 4 },
  { mockId: '11', name: 'Rosca Martelo',                movementPattern: 'Elbow Flexion',          classification: 'Isolation', neuralDemand: 3 },
  { mockId: '12', name: 'Tríceps Corda (Polia)',        movementPattern: 'Elbow Extension',        classification: 'Isolation', neuralDemand: 3 },
  { mockId: '13', name: 'Tríceps Francês',              movementPattern: 'Elbow Extension',        classification: 'Isolation', neuralDemand: 5 },
  { mockId: '14', name: 'Agachamento Livre',            movementPattern: 'Knee Dominant',          classification: 'Compound',  neuralDemand: 10 },
  { mockId: '15', name: 'Levantamento Terra',           movementPattern: 'Hip Hinge',              classification: 'Compound',  neuralDemand: 10 },
  { mockId: '16', name: 'Leg Press',                    movementPattern: 'Knee Dominant',          classification: 'Compound',  neuralDemand: 6 },
  { mockId: '17', name: 'Cadeira Extensora',            movementPattern: 'Knee Extension',         classification: 'Isolation', neuralDemand: 3 },
  { mockId: '18', name: 'Cadeira Flexora',              movementPattern: 'Knee Flexion',           classification: 'Isolation', neuralDemand: 3 },
  { mockId: '19', name: 'Agachamento Búlgaro',          movementPattern: 'Knee Dominant',          classification: 'Compound',  neuralDemand: 7 },
  { mockId: '20', name: 'Hip Thrust',                   movementPattern: 'Hip Extension',          classification: 'Compound',  neuralDemand: 6 },
  { mockId: '21', name: 'Panturrilha em Pé',            movementPattern: 'Ankle Plantar Flexion',  classification: 'Isolation', neuralDemand: 3 },
  { mockId: '22', name: 'Rosca Concentrada',            movementPattern: 'Elbow Flexion',          classification: 'Isolation', neuralDemand: 4 },
  { mockId: '23', name: 'Paralela',                     movementPattern: 'Vertical Push',          classification: 'Compound',  neuralDemand: 7 },
  { mockId: '24', name: 'Barra Fixa',                   movementPattern: 'Vertical Pull',          classification: 'Compound',  neuralDemand: 7 },
  { mockId: '25', name: 'Peck Deck',                    movementPattern: 'Horizontal Adduction',   classification: 'Isolation', neuralDemand: 3 },
  { mockId: '26', name: 'Remada Unilateral (Halter)',   movementPattern: 'Horizontal Pull',        classification: 'Compound',  neuralDemand: 6 },
]

// mockId → [{ muscleGroup, muscle, seriesFactor }]
const MUSCLES: Record<string, { muscleGroup: string; muscle: string; seriesFactor: number }[]> = {
  '1':  [{ muscleGroup: 'chest',     muscle: 'Peitoral Maior',             seriesFactor: 1.0 }, { muscleGroup: 'triceps',    muscle: 'Tríceps',                  seriesFactor: 0.5 }, { muscleGroup: 'shoulders',  muscle: 'Deltóide Anterior',        seriesFactor: 0.5 }],
  '2':  [{ muscleGroup: 'chest',     muscle: 'Peitoral Superior',          seriesFactor: 1.0 }, { muscleGroup: 'triceps',    muscle: 'Tríceps',                  seriesFactor: 0.5 }, { muscleGroup: 'shoulders',  muscle: 'Deltóide Anterior',        seriesFactor: 0.5 }],
  '3':  [{ muscleGroup: 'chest',     muscle: 'Peitoral Maior',             seriesFactor: 1.0 }],
  '4':  [{ muscleGroup: 'back',      muscle: 'Latíssimo do Dorso',         seriesFactor: 1.0 }, { muscleGroup: 'biceps',     muscle: 'Bíceps',                   seriesFactor: 0.5 }, { muscleGroup: 'shoulders',  muscle: 'Deltóide Posterior',       seriesFactor: 0.5 }],
  '5':  [{ muscleGroup: 'back',      muscle: 'Latíssimo do Dorso',         seriesFactor: 1.0 }, { muscleGroup: 'biceps',     muscle: 'Bíceps',                   seriesFactor: 0.5 }],
  '6':  [{ muscleGroup: 'back',      muscle: 'Rombóides / Trapézio Médio', seriesFactor: 1.0 }, { muscleGroup: 'biceps',     muscle: 'Bíceps',                   seriesFactor: 0.5 }],
  '7':  [{ muscleGroup: 'shoulders', muscle: 'Deltóide Anterior/Médio',    seriesFactor: 1.0 }, { muscleGroup: 'triceps',    muscle: 'Tríceps',                  seriesFactor: 0.5 }],
  '8':  [{ muscleGroup: 'shoulders', muscle: 'Deltóide Médio',             seriesFactor: 1.0 }],
  '9':  [{ muscleGroup: 'shoulders', muscle: 'Deltóide Posterior',         seriesFactor: 1.0 }],
  '10': [{ muscleGroup: 'biceps',    muscle: 'Bíceps Braquial',            seriesFactor: 1.0 }],
  '11': [{ muscleGroup: 'biceps',    muscle: 'Braquial',                   seriesFactor: 1.0 }],
  '12': [{ muscleGroup: 'triceps',   muscle: 'Tríceps (porção lateral)',   seriesFactor: 1.0 }],
  '13': [{ muscleGroup: 'triceps',   muscle: 'Tríceps (porção longa)',     seriesFactor: 1.0 }],
  '14': [{ muscleGroup: 'quadriceps', muscle: 'Quadríceps',               seriesFactor: 1.0 }, { muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 0.5 }, { muscleGroup: 'hamstrings', muscle: 'Isquiotibiais',           seriesFactor: 0.5 }],
  '15': [{ muscleGroup: 'hamstrings', muscle: 'Isquiotibiais',            seriesFactor: 1.0 }, { muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 1.0 }, { muscleGroup: 'back',       muscle: 'Eretores da Espinha',      seriesFactor: 0.5 }],
  '16': [{ muscleGroup: 'quadriceps', muscle: 'Quadríceps',               seriesFactor: 1.0 }, { muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 0.5 }],
  '17': [{ muscleGroup: 'quadriceps', muscle: 'Quadríceps',               seriesFactor: 1.0 }],
  '18': [{ muscleGroup: 'hamstrings', muscle: 'Isquiotibiais',            seriesFactor: 1.0 }],
  '19': [{ muscleGroup: 'quadriceps', muscle: 'Quadríceps',               seriesFactor: 1.0 }, { muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',            seriesFactor: 0.5 }],
  '20': [{ muscleGroup: 'glutes',    muscle: 'Glúteo Máximo',             seriesFactor: 1.0 }, { muscleGroup: 'hamstrings', muscle: 'Isquiotibiais',           seriesFactor: 0.5 }],
  '21': [{ muscleGroup: 'calves',    muscle: 'Gastrocnêmio',              seriesFactor: 1.0 }],
  '22': [{ muscleGroup: 'biceps',    muscle: 'Bíceps (pico)',             seriesFactor: 1.0 }],
  '23': [{ muscleGroup: 'chest',     muscle: 'Peitoral Inferior',         seriesFactor: 1.0 }, { muscleGroup: 'triceps',    muscle: 'Tríceps',                  seriesFactor: 0.5 }],
  '24': [{ muscleGroup: 'back',      muscle: 'Latíssimo do Dorso',        seriesFactor: 1.0 }, { muscleGroup: 'biceps',     muscle: 'Bíceps',                   seriesFactor: 0.5 }],
  '25': [{ muscleGroup: 'chest',     muscle: 'Peitoral (contração)',      seriesFactor: 1.0 }],
  '26': [{ muscleGroup: 'back',      muscle: 'Latíssimo / Rombóides',    seriesFactor: 1.0 }, { muscleGroup: 'biceps',     muscle: 'Bíceps',                   seriesFactor: 0.5 }],
}

// ─── PHASES ───────────────────────────────────────────────────────────────────

const PHASES = [
  { name: 'Acumulação 1',                        etapa: 1, phaseType: 'Acumulação',            mesoNumber: 1,    techniqueFocus: null, phaseOrder: 1,  durationWeeks: 4, targetRirMin: 2, targetRirMax: 3, volumePctTension: 0.40, volumePctMetabolic: 0.60, progressionRule: 'Progressão dupla: aumente repetições primeiro. Ao atingir o teto de reps, aumente 2,5 kg.', isCurrent: true },
  { name: 'Acumulação 2',                        etapa: 1, phaseType: 'Acumulação',            mesoNumber: 2,    techniqueFocus: null, phaseOrder: 2,  durationWeeks: 4, targetRirMin: 2, targetRirMax: 3, volumePctTension: 0.40, volumePctMetabolic: 0.60, progressionRule: 'Aumentar volume em 2 séries semanais por músculo. Manter RIR 2.', isCurrent: false },
  { name: 'Transição',                           etapa: 1, phaseType: 'Transição',             mesoNumber: null, techniqueFocus: null, phaseOrder: 3,  durationWeeks: 4, targetRirMin: 2, targetRirMax: 2, volumePctTension: 0.60, volumePctMetabolic: 0.40, progressionRule: 'Manter volume total. Progredir via densidade: reduzir descanso progressivamente.', isCurrent: false },
  { name: 'Intensificação 1',                    etapa: 1, phaseType: 'Intensificação',        mesoNumber: 1,    techniqueFocus: null, phaseOrder: 4,  durationWeeks: 4, targetRirMin: 1, targetRirMax: 1, volumePctTension: 0.70, volumePctMetabolic: 0.30, progressionRule: 'Reduzir volume. Foco em progressão de carga nos compostos. RIR 1.', isCurrent: false },
  { name: 'Intensificação 2',                    etapa: 1, phaseType: 'Intensificação',        mesoNumber: 2,    techniqueFocus: null, phaseOrder: 5,  durationWeeks: 4, targetRirMin: 0, targetRirMax: 1, volumePctTension: 0.70, volumePctMetabolic: 0.30, progressionRule: 'Volume mínimo. Maximizar carga nos exercícios principais. Chegar ao limite.', isCurrent: false },
  { name: 'Semana de Teste',                     etapa: 1, phaseType: 'Teste',                 mesoNumber: null, techniqueFocus: null, phaseOrder: 6,  durationWeeks: 1, targetRirMin: 0, targetRirMax: 0, volumePctTension: 1.00, volumePctMetabolic: 0.00, progressionRule: 'Testar 1RM ou AMRAP nos exercícios principais. Registrar novos recordes.', isCurrent: false },
  { name: 'Hipertrofia e Resistência — Meso 1',  etapa: 2, phaseType: 'Hipertrofia_Resistência', mesoNumber: 1,  techniqueFocus: null, phaseOrder: 7,  durationWeeks: 4, targetRirMin: 0, targetRirMax: 1, volumePctTension: 0.40, volumePctMetabolic: 0.60, progressionRule: 'Usar 80% do 1RM. Esquema semanal: Sem 1 → 8×2 | Sem 2 → 6×3 | Sem 3 → 5×4 | Sem 4 → 4×5.', isCurrent: false },
  { name: 'Hipertrofia e Resistência — Meso 2',  etapa: 2, phaseType: 'Hipertrofia_Resistência', mesoNumber: 2,  techniqueFocus: null, phaseOrder: 8,  durationWeeks: 4, targetRirMin: 0, targetRirMax: 1, volumePctTension: 0.40, volumePctMetabolic: 0.60, progressionRule: 'Progressão estritamente em repetições nas Working Sets: +1 rep por semana na mesma carga.', isCurrent: false },
  { name: 'Hipertrofia e Resistência — Meso 3',  etapa: 2, phaseType: 'Hipertrofia_Resistência', mesoNumber: 3,  techniqueFocus: 'Drop Set', phaseOrder: 9, durationWeeks: 4, targetRirMin: 0, targetRirMax: 0, volumePctTension: 0.40, volumePctMetabolic: 0.60, progressionRule: 'Introduzir Drop Sets nas Working Sets principais. Objetivo: aumentar volume total por semana.', isCurrent: false },
  { name: 'Hipertrofia e Resistência — Meso 4',  etapa: 2, phaseType: 'Hipertrofia_Resistência', mesoNumber: 4,  techniqueFocus: 'Super Set', phaseOrder: 10, durationWeeks: 4, targetRirMin: 0, targetRirMax: 0, volumePctTension: 0.40, volumePctMetabolic: 0.60, progressionRule: 'Periodização ondulante diária + Super Sets.', isCurrent: false },
  { name: 'Hipertrofia Pico — Meso 1',           etapa: 2, phaseType: 'Hipertrofia_Pico',     mesoNumber: 1,    techniqueFocus: 'Falsa Pirâmide', phaseOrder: 11, durationWeeks: 4, targetRirMin: 0, targetRirMax: 0, volumePctTension: 0.30, volumePctMetabolic: 0.70, progressionRule: 'Usar Falsa Pirâmide. Altos volumes, intensidade brutal.', isCurrent: false },
  { name: 'Hipertrofia Pico — Meso 2 (MRV)',     etapa: 2, phaseType: 'Hipertrofia_Pico',     mesoNumber: 2,    techniqueFocus: 'Falsa Pirâmide', phaseOrder: 12, durationWeeks: 4, targetRirMin: 0, targetRirMax: 0, volumePctTension: 0.30, volumePctMetabolic: 0.70, progressionRule: 'Ápice do MRV. RPE 10. Adicionar +1 dia de frequência para suportar volume máximo.', isCurrent: false },
]

// mockExerciseId → [planned session mockId, ...planned exercises]
// Planned sessions for Acumulação 1
const PLANNED_SESSIONS = [
  { mockId: 'upper-a', sessionNumber: 1, aiNotes: 'Superior A — Peito/Tríceps primário. Iniciar com compostos antes dos isoladores.' },
  { mockId: 'lower-a', sessionNumber: 2, aiNotes: 'Inferior A — Quadríceps/Glúteo primário. Aquecimento de quadril obrigatório.' },
  { mockId: 'upper-b', sessionNumber: 3, aiNotes: 'Superior B — Costas/Bíceps primário. Focar na retração escapular nas remadas.' },
  { mockId: 'lower-b', sessionNumber: 4, aiNotes: 'Inferior B — Posterior de coxa/Glúteo primário.' },
]

// [sessionMockId, exerciseMockId, setsCount, repsMin, repsMax, loadKg, rpe, rir, technique, aiFeedback, sortOrder]
type PERow = [string, string, number, number, number, number | null, number, number, string | null, string | null, number]

const PLANNED_EXERCISES: PERow[] = [
  // Superior A
  ['upper-a', '1',  4, 6,  8,  80,  8, 2, 'Excêntrica controlada 2s', 'Fase de Acumulação 1: priorize a conexão mente-músculo no peito. Se atingir 8 reps com RIR 2 por 2 sessões consecutivas, aumente 2,5 kg na próxima.', 1],
  ['upper-a', '7',  4, 6,  8,  50,  8, 2, 'Escápulas retraídas e deprimidas durante todo o movimento', 'Desenvolvimento é o motor de ombros desta fase. Mantenha a carga estável até dominar a técnica — progrida em reps antes de adicionar peso.', 2],
  ['upper-a', '25', 3, 12, 15, 50,  7, 3, 'Pausa na contração máxima', null, 3],
  ['upper-a', '8',  3, 15, 20, 10,  7, 3, 'Cotovelo levemente flexionado, não balançar o tronco', null, 4],
  ['upper-a', '12', 3, 12, 15, 25,  7, 3, null, null, 5],
  // Inferior A
  ['lower-a', '14', 4, 5,  6,  100, 8, 2, 'Profundidade total, joelhos alinhados com os pés', 'Agachamento é o maior gerador neural desta fase. RIR 2 é obrigatório — não chegue à falha. Aquecimento de no mínimo 3 séries progressivas antes das Working Sets.', 1],
  ['lower-a', '16', 3, 8,  10, 180, 8, 2, 'Pés afastados na largura dos ombros, descer até 90°', 'Leg Press é o volume metabólico do quadríceps. Progrida em reps primeiro — quando atingir 10 com boa forma, adicione 10 kg.', 2],
  ['lower-a', '17', 3, 12, 15, 40,  7, 3, 'Pausa 1s na extensão completa', null, 3],
  ['lower-a', '20', 3, 12, 15, 100, 7, 3, 'Extensão de quadril completa, apertar glúteo no topo', null, 4],
  ['lower-a', '21', 4, 15, 20, 80,  7, 3, null, null, 5],
  // Superior B
  ['upper-b', '4',  4, 6,  8,  80,  8, 2, 'Retração escapular antes de puxar, ROM completo', 'Remada Curvada é o composto principal de costas nesta fase. Foco: iniciar o movimento com a escápula, não com os braços. Se a técnica degradar, reduza a carga 5 kg.', 1],
  ['upper-b', '24', 3, 6,  10, null, 8, 2, 'Adicionar carga assim que atingir 10 reps com RIR 2', 'Barra Fixa: use apenas peso corporal agora. Quando dominar 10 reps perfeitas, adicione carga com cinto. É um marco para progressão desta fase.', 2],
  ['upper-b', '5',  3, 12, 15, 55,  7, 3, null, null, 3],
  ['upper-b', '9',  3, 15, 20, 20,  7, 3, 'Puxar até a altura dos olhos, abrindo os cotovelos para os lados', null, 4],
  ['upper-b', '10', 3, 10, 12, 30,  8, 2, null, null, 5],
  // Inferior B
  ['lower-b', '19', 4, 8,  10, 20,  8, 2, 'Tronco ereto, joelho da frente não ultrapassa o pé', 'Agachamento Búlgaro: é o exercício unilateral mais efetivo para equilibrar assimetrias. Se houver diferença de força entre os lados, foque no lado mais fraco primeiro.', 1],
  ['lower-b', '15', 3, 5,  6,  100, 8, 2, 'Variante Romeno: joelhos semiflexionados, descida ao longo das pernas', 'Terra Romeno é o principal construtor de posterior de coxa. Sinta o alongamento dos isquiotibiais — se não sentir, ajuste a postura antes de aumentar carga.', 2],
  ['lower-b', '18', 3, 12, 15, 35,  7, 3, null, null, 3],
  ['lower-b', '3',  3, 12, 15, 15,  7, 3, 'Peito identificado como ponto fraco — volume adicional ao final da semana', null, 4],
  ['lower-b', '21', 3, 15, 20, 80,  7, 3, null, null, 5],
]

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...\n')

  // 1. Upsert exercises, capture UUID map
  console.log('→ Exercises...')
  const exerciseIdMap: Record<string, string> = {}
  for (const ex of EXERCISES) {
    const row = await prisma.exercise.upsert({
      where: { name: ex.name },
      create: {
        name: ex.name,
        movement_pattern: ex.movementPattern,
        classification: ex.classification,
        neural_demand: ex.neuralDemand,
      },
      update: {
        movement_pattern: ex.movementPattern,
        classification: ex.classification,
        neural_demand: ex.neuralDemand,
      },
    })
    exerciseIdMap[ex.mockId] = row.id
  }
  console.log(`   ✓ ${EXERCISES.length} exercises`)

  // 2. Delete and re-insert exercise muscles (simpler than upsert on composite key)
  console.log('→ Exercise muscles...')
  await prisma.exerciseMuscle.deleteMany({
    where: { exercise_id: { in: Object.values(exerciseIdMap) } },
  })
  const muscleRows = Object.entries(MUSCLES).flatMap(([mockId, muscles]) =>
    muscles.map((m) => ({
      exercise_id: exerciseIdMap[mockId],
      muscle_group: m.muscleGroup,
      muscle: m.muscle,
      series_factor: m.seriesFactor,
    }))
  )
  await prisma.exerciseMuscle.createMany({ data: muscleRows })
  console.log(`   ✓ ${muscleRows.length} muscle mappings`)

  // 3. Upsert training phases by name (no unique constraint — use findFirst + create/update)
  console.log('→ Training phases...')
  const phaseIdMap: Record<string, string> = {}
  for (const p of PHASES) {
    const phaseData = {
      etapa: p.etapa,
      phase_type: p.phaseType,
      meso_number: p.mesoNumber,
      technique_focus: p.techniqueFocus,
      phase_order: p.phaseOrder,
      duration_weeks: p.durationWeeks,
      target_rir_min: p.targetRirMin,
      target_rir_max: p.targetRirMax,
      volume_pct_tension: p.volumePctTension,
      volume_pct_metabolic: p.volumePctMetabolic,
      progression_rule: p.progressionRule,
      is_current: p.isCurrent,
    }
    const existing = await prisma.trainingPhase.findFirst({ where: { name: p.name } })
    let row
    if (existing) {
      row = await prisma.trainingPhase.update({ where: { id: existing.id }, data: phaseData })
    } else {
      row = await prisma.trainingPhase.create({ data: { name: p.name, ...phaseData } })
    }
    phaseIdMap[p.name] = row.id
  }
  console.log(`   ✓ ${PHASES.length} training phases`)

  // 4. Get the current phase UUID for planned sessions
  const currentPhaseId = phaseIdMap['Acumulação 1']

  // 5. Delete and re-insert planned sessions for Acumulação 1
  console.log('→ Planned sessions...')
  const existingSessions = await prisma.plannedSession.findMany({
    where: { phase_id: currentPhaseId },
  })
  if (existingSessions.length > 0) {
    await prisma.plannedSession.deleteMany({ where: { phase_id: currentPhaseId } })
  }

  const sessionIdMap: Record<string, string> = {}
  for (const s of PLANNED_SESSIONS) {
    const row = await prisma.plannedSession.create({
      data: {
        phase_id: currentPhaseId,
        week_number: 1,
        meso_week: 1,
        session_number: s.sessionNumber,
        status: 'Pendente',
        ai_notes: s.aiNotes,
      },
    })
    sessionIdMap[s.mockId] = row.id
  }
  console.log(`   ✓ ${PLANNED_SESSIONS.length} planned sessions`)

  // 6. Insert planned exercises
  console.log('→ Planned exercises...')
  const peRows = PLANNED_EXERCISES.map(([sessId, exId, sets, rMin, rMax, load, rpe, rir, tech, ai, order]) => ({
    planned_session_id: sessionIdMap[sessId],
    exercise_id: exerciseIdMap[exId as string],
    sets_count: sets as number,
    reps_min: rMin as number,
    reps_max: rMax as number,
    suggested_load_kg: load as number | null,
    target_rpe: rpe as number,
    target_rir: rir as number,
    technique: tech as string | null,
    ai_feedback: ai as string | null,
    sort_order: order as number,
  }))
  await prisma.plannedExercise.createMany({ data: peRows })
  console.log(`   ✓ ${peRows.length} planned exercises`)

  console.log('\n✅ Seed complete!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
