# PRD — Antigravity Fitness

## Product Vision

Antigravity is a workout tracking app for natural strength athletes following Jayme de Lamadrid's block periodization methodology. It replaces paper logs and spreadsheets with a precision tracking tool that understands the full annual macrocycle, calculates weighted weekly volume per muscle group, evaluates phase transition triggers, and surfaces actionable feedback on progression.

---

## Methodology Reference — Jayme de Lamadrid

### Annual Macrocycle Structure

#### ETAPA 1 — Força e Potência *(preparando o terreno)*

| # | Fase | Duração | RIR | Tensão / Metabólico | Progressão |
|---|------|---------|-----|----------------------|------------|
| 1–2 | **Acumulação** (2 mesos) | 4 sem cada | 2–3 | 40% / 60% | Periodização linear inversa: aumentar séries gradativamente |
| 3 | **Transição** | 4 sem | 2 | 60% / 40% | Manter volume. Progredir via densidade (reduzir descanso) |
| 4–5 | **Intensificação** (1–2 mesos) | 4 sem cada | 0–1 | 70% / 30% | Reduzir volume. Progredir carga nos compostos |
| 6 | **Semana de Teste** | 1 sem | 0 | 100% / 0% | Testar 1RM ou AMRAP nos exercícios principais |

#### ETAPA 2 — Hipertrofia e Resistência *(a construção real)*

| # | Fase | Duração | RIR | Tensão / Metabólico | Técnica / Progressão |
|---|------|---------|-----|----------------------|----------------------|
| 7 | **HR Meso 1** | 4 sem | 0–1 | 40% / 60% | 80% do 1RM. Esquema semanal: 8×2 → 6×3 → 5×4 → 4×5 |
| 8 | **HR Meso 2** | 4 sem | 0–1 | 40% / 60% | Progredir apenas repetições nas Working Sets (+1 rep/semana) |
| 9 | **HR Meso 3** | 4 sem | 0 | 40% / 60% | Introduzir **Drop Sets** |
| 10 | **HR Meso 4** | 4 sem | 0 | 40% / 60% | Periodização ondulante diária + **Super Sets** |
| 11 | **Pico Meso 1** | 4 sem | 0 | 30% / 70% | **Falsa Pirâmide**. Volume brutal, RPE máximo |
| 12 | **Pico Meso 2** | 4 sem | 0 | 30% / 70% | MRV + RPE 10. Adicionar **+1 dia** de frequência |

---

### Training Frequency

- **Base: 3–4 dias/semana** (não treinar dias consecutivos)
- **Frequência 2 por músculo**: quando volume de um grupo muscular específico está alto para uma única sessão → dividir em 2 dias (Upper/Lower ou Full Body)
- **+1 dia** SOMENTE no Pico Meso 2 (ápice do MRV) para suportar volume máximo

---

### Rest Time Table

| Repetições alvo | Descanso recomendado |
|-----------------|----------------------|
| ≥ 10 reps (metabólico) | 1:00 – 1:45 |
| 8–9 reps | 1:45 – 2:15 |
| 6–7 reps | 2:15 – 2:45 |
| 5 reps (séries 1–3) | 2:30 – 3:30 |
| 5 reps (série 4+) | 3:00 – 4:00 |
| < 5 reps (força máxima) | 3:30 – 4:30 |

---

### Volume Calculation Rules

Only **Working Sets, Top Sets, Back Off Sets com RPE ≥ 7** count.
Warm-up Sets e Feeder Sets = volume zero.

**Distribuição por tipo de exercício:**
- **Isolador (monoarticular)**: 100% das séries → músculo primário
- **Composto (multiarticular)**: 100% → músculo primário, **50%** → músculos secundários sinergistas
  - Movimentos de empurrar (Push): volume secundário de ombro → Deltóide Anterior
  - Movimentos de puxar (Pull): volume secundário de ombro → Deltóide Posterior

**Exemplo**: 4 séries de Supino Reto = +4 séries para Peitoral, +2 séries para Tríceps, +2 séries para Deltóide Anterior

**MRV (Máximo Volume Recuperável)**: ~20 séries semanais por grupo muscular. Zona de perigo ≥ 20.

---

### Progression Logic

**Prioridade:**
1. Repetições
2. Peso
3. Volume

**Regra da progressão dupla**: aumentar reps primeiro. Ao superar o teto de reps com a mesma carga, aumentar o peso. Só ajustar volume se não houver progressão em 2 semanas.

| Performance | Fadiga | Ação |
|-------------|--------|------|
| ↓ Regressão | qualquer | Diminuir volume |
| ↔ Estagnado | alta | Diminuir volume (Deload) |
| ↔ Estagnado | baixa | Aumentar +2 séries/semana |
| ↑ Progressão | qualquer | Manter plano |

---

### Phase Transition Triggers

| Trigger | Condição | Ação |
|---------|----------|------|
| **MRV_REACHED** | Volume ≥ 20 séries + tendência ↓ ou ↔ | Deload → Intensificação |
| **NEURAL_PLATEAU** | 2 semanas ↔ + recuperação boa + volume moderado (<15 séries) | Semana de Teste (1RM/AMRAP) → Etapa 2 |
| **TEMPORAL** | Semanas na fase ≥ máximo da fase | Avançar bloco |
| **PEAK_FATIGUE** | MRV + RPE 10 consistente | +1 dia de frequência |

---

### Weekly Metrics (Planilha de Progressão — Jayme de Lamadrid)

| Campo | Cálculo | Importância |
|-------|---------|-------------|
| **Vol. 7d** | Séries efetivas (RPE ≥ 7) últimos 7 dias | Mantém 10–20 séries/semana/músculo |
| **Total Reps** | Soma de reps na última sessão | Base da progressão dupla |
| **Última Carga / Recorde** | Peso máximo recente vs. histórico | Detecta força real |
| **Última Tonelagem / Recorde** | Carga × Reps por sessão | Métrica mais fiel de "trabalho real" |
| **1RM Estimado (Epley)** | `carga × (1 + reps/30)` | Normaliza comparações entre faixas de rep |
| **Progresso** | Tonelagem atual vs. anterior | ↑ Progressão / ↓ Regressão / ↔ Estagnado |
| **Média 4s** | Média das últimas 4 sessões (tonelagem) | Elimina ruído de "dias ruins" |
| **RPE Médio** | Média do RPE das séries efetivas | Verifica se intensidade prescrita está sendo cumprida |

---

## Current State (v0.1 — Frontend Prototype)

- UI completo: dashboard, workout player, plano de treino, histórico + gráficos
- Mock data com macrociclo completo (12 fases) em `lib/mock-data.ts`
- Lógica de periodização em `lib/periodization.ts`
- `WorkoutProvider` persiste em localStorage (`antigravity-sessions-v2`)
- Prisma schema e camada DB (`lib/db/`) prontos — sem leitura/escrita real ainda

---

## Milestone v0.2 — Live Supabase Data

**Meta**: substituir mock data + localStorage por leituras/escritas reais no Supabase.

### O que construir

| Área | Trabalho |
|------|----------|
| **Plan & Phases** | Server Component busca `getCurrentPhase()` + `getPlannedSessionsByPhase()` → passa como props iniciais para `WorkoutProvider` |
| **Exercises** | `getExercises()` substitui lista do `lib/mock-data.ts` |
| **Workout Sessions** | `createWorkoutSession()` ao iniciar treino; ID real substitui ID gerado |
| **Set Persistence** | Cada set salvo → Server Action `upsertWorkoutSet()` |
| **Volume Dashboard** | `getWeeklyVolumeByMuscle()` com pesos `series_factor` — substitui cálculo ingênuo atual |
| **Progression** | `getProgressionForExercise()` + `getLastTwoSessionTonnages()` substituem `generateProgressionData()` |

### Mudança arquitetural no `WorkoutProvider`

1. Aceitar `initialSessions`, `initialPhase`, `initialExercises` como props de um Server Component pai
2. Manter toda a lógica de estado local e atualizações otimistas
3. Triggerar Server Actions para persistência em vez de (apenas) localStorage

---

## Features

### Done
- [x] Dashboard com calendário semanal, gráfico de volume, gráficos de progressão
- [x] Workout player com input de séries (carga, reps, RPE → RIR automático), timer de descanso
- [x] Vista do plano de treino: fases, sessões, exercícios com alvos
- [x] Histórico: sessões concluídas, PRs, progressão por exercício
- [x] Design system glassmorphism + Framer Motion
- [x] Layout responsivo mobile-first (nav inferior mobile, sidebar desktop)
- [x] Prisma schema alinhado ao metodologia (set_category, set_technique, phase_type, etapa, etc.)
- [x] `lib/periodization.ts` — rest time, volume cálculo, progressão, gatilhos de fase
- [x] Macrociclo completo de 12 fases em mock-data
- [x] `lib/db/` com queries Supabase prontas (exercises, phases, sessions, volume)

### Planned
- [ ] Leitura/escrita real no Supabase (v0.2)
- [ ] `ai_feedback` em `PlannedExercise` exibido no workout player como dica de treino
- [ ] Indicadores de progressão na UI: status (↑↓↔), volume semanal por músculo vs. MRV
- [ ] Alerta automático de gatilho de fase (MRV atingido, plateau neural, temporal)
- [ ] UI de gerenciamento de fases: criar/editar fases e sessões
- [ ] Tracking de peso corporal e medidas
- [ ] Multi-usuário / auth (Supabase Auth)

---

## Data Model

```
TrainingPhase (etapa, phase_type, meso_number, technique_focus)
  └─ PlannedSession (semana, data planejada, status)
       └─ PlannedExercise (séries, reps min/max, carga sugerida, RPE/RIR alvo, ai_feedback)
            └─ Exercise (nome, padrão de movimento, classificação, demanda neural)
                 └─ ExerciseMuscle (grupo muscular, series_factor: 1.0 primário / 0.5 secundário)

WorkoutSession (data real)
  └─ WorkoutSet (set_category, set_technique, carga, reps, RPE, RIR, tonelagem, 1RM)
```

`PlannedSession.actual_session_id` → vincula template à `WorkoutSession` real quando concluída.

### Computed fields (calculados no app, nunca armazenados brutos)

| Campo | Fórmula |
|-------|---------|
| `rir` | `10 - rpe` |
| `tonnage` | `load_kg × reps` |
| `one_rm_epley` | `load_kg × (1 + reps / 30)` |
| `weekly_volume[muscle]` | `Σ (working_sets × series_factor)` |
| `rolling_avg_4s` | `mean(last 4 session tonnages)` |

---

## Tech Stack

| Camada | Escolha |
|--------|---------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 + CSS variables |
| Animations | Framer Motion |
| UI Components | shadcn/ui (new-york, neutral) |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| ORM | Prisma 7 |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel |
