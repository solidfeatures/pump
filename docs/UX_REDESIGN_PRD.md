# UX Redesign — Progressive Disclosure & Modern Layout (PRD v1)

## 1. Objetivo

Reorganizar a disposição de elementos, tabs e hierarquia visual das páginas para:
- Responder a pergunta dominante de cada página em **3 segundos** sem scroll
- Construir um **funil casual → nerd** via tabs (Tab 1 = resumo/ação, Tab 2 = operacional, Tab 3 = análise profunda)
- Tornar a primeira impressão de cada página acionável e celebratória, não informativa-pesada
- Eliminar duplicação (ex: dados de atleta aparecendo em History)

Não é redesign visual (cores/tipografia). É redesign de **hierarquia de informação** e **arquitetura de abas**.

---

## 2. Personas

| Persona | Intent | O que precisa ver primeiro |
|---|---|---|
| **Casual ("Preguiçoso")** | "O que eu faço agora?" | 1 CTA grande, 4 números simples, sem decisões |
| **Intermediário ("Engajado")** | "Estou progredindo?" | Listas de sessões, trends curtos, volume atual |
| **Nerd ("Educador Físico")** | "Quero entender cada número" | Tabelas densas, fórmulas, comparações multi-fase, export |

Todo padrão de tab deve servir os 3 em ordem decrescente de visibilidade.

---

## 3. Princípios de Design

1. **Inverted pyramid** — informação mais importante primeiro
2. **Progressive disclosure** — complexidade revelada sob demanda
3. **Jobs-to-be-done** — cada página responde a UMA pergunta dominante
4. **Celebration moments** — streaks/PRs antes de dados brutos
5. **Smart defaults** — IA sugere, usuário confirma
6. **Contextual empty states** — empty sempre com próximo passo sugerido

---

## 4. Padrão Transversal: A Regra das 3 Camadas

Toda página com tabs segue:

```
Tab 1 "HOJE/AGORA"       → Hero + QuickStats + 1 insight IA
Tab 2 "LISTA/SEMANA"     → Operacional (listar, filtrar, planejar)
Tab 3 "ANÁLISE/AVANÇADO" → Tabelas, métricas derivadas, export
```

### Componentes Transversais Novos

| Componente | Propósito | Onde usa |
|---|---|---|
| `<HeroCard>` | Primeira view de Tab 1: título + CTA único grande + insight IA em 1 linha | Dashboard, Workout, Plan, Nutrition |
| `<QuickStatsRow>` | 4 tiles padrão: Streak · Consistência · Volume · PR | Dashboard, History |
| `<EmptyStateGuide>` | Empty state com ícone + frase + próximo passo | Todas as páginas |
| `<InsightBanner>` | Banner horizontal fino com 1 insight da IA + CTA | Dashboard, Plan, Nutrition |

---

## 5. Especificação por Página

### 5.1 Dashboard (`/`)

**Pergunta dominante:** "Onde estou? O que vem a seguir?"

**Problema atual:** Tab 1 ("Visão Geral") é navegação de calendário, não resumo. Métricas-chave estão na Tab 2.

**Nova estrutura de tabs:**

| # | Tab | Conteúdo | Persona |
|---|---|---|---|
| 1 | **Hoje** | HeroCard (treino de hoje ou "descanso") · QuickStatsRow (4 tiles) · PhaseTransitionAlert se aplicável · InsightBanner | Casual |
| 2 | **Esta Semana** | WeeklyStats · PhaseProgress · VolumeChart · MuscleVolumePanel · Próximas sessões | Intermediário |
| 3 | **Progressão** | ExerciseProgressionTable · ProgressionCharts · 1RM trend · Comparação entre fases | Nerd |
| 4 | **Calendário** | Full month/year WorkoutCalendar | Utilitário |

### 5.2 Workout (`/workout`)

**Pergunta dominante:** "O que eu treino hoje?"

**Problema atual:** Lista plana sem hierarquia. Today's workout tem mesmo peso visual de "concluídos".

**Nova estrutura (sem tabs — página de ação):**

```
┌── HeroCard (ocupa 60% do viewport) ─────────────────────┐
│  HOJE · Upper A                                          │
│  45min estimado · 4 exercícios · Peito Costas Ombros     │
│  Última vez: Supino 85kg×10 (RPE 8) ↑3%                  │
│  [ ▶ INICIAR TREINO ]   (botão gigante full-width)       │
└──────────────────────────────────────────────────────────┘

── Próximos 3 treinos ──  (grid 3 colunas)
── Últimos treinos ──     (expansível, default collapsed)
```

Se não há treino hoje: hero mostra "Hoje é descanso" com opção "Ver plano semanal" OU "Adicionar treino".

### 5.3 Plan (`/plan`)

**Pergunta dominante:** "Qual é minha estratégia?"

**Problema atual:** Tab "Sessões" mistura operacional (semana atual) com estratégico (templates). "Exercícios" é biblioteca, não parte do plano.

**Nova estrutura:**

| # | Tab | Conteúdo | Persona |
|---|---|---|---|
| 1 | **Semana** | Volume atual vs alvo por músculo (barras) · WeeklyDaySelector · WeekPlanStatus · "Planejar Semana com IA" | Casual/Int |
| 2 | **Macrociclo** | Timeline horizontal de fases · Current phase big card · Próxima fase preview · Templates de sessão · "Gerar Plano com IA" | Int/Nerd |
| 3 | **Biblioteca** | Filtros músculo/equipamento/classificação · Exercise search · Video previews · Favorites | Utilitário |

### 5.4 History (`/history`)

**Pergunta dominante:** "Como estou progredindo ao longo do tempo?"

**Problema atual:** Sobrecarregado com dados de Profile (Perfil do Atleta & Metas, Estratégia Nutricional). Lack de narrativa emocional.

**Nova estrutura:**

| # | Tab | Conteúdo | Persona |
|---|---|---|---|
| 1 | **Conquistas** | 🔥 Streak days (grande) · 🏆 Último PR · 📸 Photo timeline resumo · Peso delta 30d · Volume total acumulado · Badges | Casual |
| 2 | **Treinos** | Lista completa sessões concluídas · Filtros (fase, data, músculo) · Link para detalhe | Intermediário |
| 3 | **Análise** | Weekly volume analysis · Phase comparison · Exercise progression detalhada · Export CSV | Nerd |

**Remoção:** Card "Perfil do Atleta & Metas" inteiro → movido para `/profile`.

### 5.5 Measures (`/measures`)

**Pergunta dominante:** "Como meu corpo está mudando?"

**Nova estrutura:**

| # | Tab | Conteúdo | Persona |
|---|---|---|---|
| 1 | **Progresso** | Peso+BF trend chart 90d · Delta 30d (número grande) · Progress photos em destaque · CTA "Adicionar Medição" | Casual |
| 2 | **Registros** | Histórico tabular · Edit/delete · Trend charts expansíveis | Intermediário |
| 3 | **Análise Corporal** | McCallum · Reeves · FFMI/LBM limit · Simetria esquerda-direita · Todas as razões biomecânicas | Nerd |

### 5.6 Nutrition (`/nutrition`)

**Pergunta dominante:** "O que devo comer?"

**Nova estrutura:**

| # | Tab | Conteúdo | Persona |
|---|---|---|---|
| 1 | **Hoje** | 3 números gigantes (kcal/P/C/F) · Próxima refeição sugerida · CTA "Atualizar plano baseado em peso atual" | Casual |
| 2 | **Plano** | Refeições detalhadas · Horários · Items por refeição · AI logic expansível | Intermediário |
| 3 | **Histórico** | Planos anteriores · Compare entre fases · Variety tracker | Nerd |

### 5.7 Profile (`/profile`)

**Pergunta dominante:** "Quem sou eu (nesse app)?"

**Problema atual:** Tudo num formulário único e longo.

**Nova estrutura:**

| # | Tab | Conteúdo |
|---|---|---|
| 1 | **Perfil** | Athlete Summary card (migrado de /history) · Nome, idade, gênero, experiência · Objetivo · WeeklyDaySelector |
| 2 | **Automação IA** | AiSettingsPanel (3 toggles) · Log de execuções recentes ("última vez que a IA rodou X") |
| 3 | **Dados & Conta** | Lesões · Limitações · Export de dados · Danger zone |

---

## 6. Checkpoints

Cada checkpoint é **independentemente deployável**. Commit ao fim de cada.

### CHK-1 — Componentes Transversais (foundation)
- [ ] Criar `components/hero-card.tsx` com props `title`, `subtitle`, `insight?`, `cta` (button config), `variant` ('primary'|'muted'|'warning')
- [ ] Criar `components/quick-stats-row.tsx` com array de 4 stats `{icon, label, value, delta?}`
- [ ] Criar `components/empty-state-guide.tsx` com `icon`, `title`, `description`, `action?`
- [ ] Criar `components/insight-banner.tsx` com `text`, `cta?`
- [ ] Build passa sem erros

### CHK-2 — Workout Page (quick win — sem tabs)
- [ ] `/workout` vira página de ação: Hero gigante + próximos + últimos (collapsed)
- [ ] Hero usa `<HeroCard>` com info do treino de hoje (nome, duração estimada, músculos, última performance)
- [ ] Estado "sem treino hoje" → hero muda para "Hoje é descanso" + CTA "Ver plano semanal"
- [ ] Próximos treinos: grid horizontal 3 cols
- [ ] Últimos treinos: accordion expansível default-collapsed

### CHK-3 — Profile: 3 Tabs + Migração Athlete Summary
- [ ] Profile vira 3 tabs: Perfil · Automação IA · Dados & Conta
- [ ] Tab "Perfil" hospeda o card "Perfil do Atleta & Metas" (migrado de /history)
- [ ] Tab "Automação IA" isola AiSettingsPanel + log de runs recentes (se tivermos `weekly_plan_logs`)
- [ ] Tab "Dados & Conta" isola lesões, limitações, danger zone placeholder
- [ ] Nenhum dado perdido durante migração

### CHK-4 — History: Tab "Conquistas" + Remoção Athlete Summary
- [ ] Remover card "Perfil do Atleta & Metas" (agora vive em /profile)
- [ ] Reordenar tabs: Conquistas · Treinos · Análise
- [ ] Criar tab "Conquistas": streak (usar sessions concluídas consecutivas), último PR, photo timeline preview (4 fotos), delta de peso 30d, volume total acumulado
- [ ] Tab "Treinos" = lista atual de sessões concluídas com filtros
- [ ] Tab "Análise" = weekly volume + phase comparison + export CSV

### CHK-5 — Dashboard: Reorg de Tabs
- [ ] Reordenar tabs: Hoje · Esta Semana · Progressão · Calendário
- [ ] Tab "Hoje": HeroCard (treino de hoje) + QuickStatsRow + PhaseTransitionAlert + InsightBanner
- [ ] Tab "Esta Semana" = conteúdo atual de "Resumo" + próximas sessões
- [ ] Tab "Progressão" = ExerciseProgressionTable + ProgressionCharts (inalterado)
- [ ] Tab "Calendário" = WorkoutCalendar full
- [ ] DayNav e MiniCalendar desaparecem da Tab 1 (movem para Tab "Calendário" ou ficam como mini-widget)

### CHK-6 — Plan: Rename de Tabs e Seção de Biblioteca
- [ ] Renomear "Sessões" → "Semana"; "Fases" → "Macrociclo"; "Exercícios" → "Biblioteca"
- [ ] Tab "Semana" fica como está (já tem WeeklyDaySelector + WeekPlanStatus)
- [ ] Tab "Macrociclo": timeline horizontal de fases (componente novo), current phase big card, templates de sessão
- [ ] Tab "Biblioteca" = exercise library com filtros (músculo, equipamento, classificação)

### CHK-7 — Measures: Reorg de Tabs + Análise Corporal Separada
- [ ] Tabs: Progresso · Registros · Análise Corporal
- [ ] Tab "Progresso": peso+BF trend 90d + delta 30d + progress photos + CTA adicionar
- [ ] Tab "Registros": histórico tabular atual + edit/delete
- [ ] Tab "Análise Corporal": McCallum + Reeves + FFMI + simetria (código já existe em `lib/body-proportions.ts`)

### CHK-8 — Nutrition: Tab "Hoje" com Macros em Destaque
- [ ] Tab "Hoje": 3 números gigantes (kcal/P/C/F) + próxima refeição + CTA "Atualizar plano"
- [ ] Tab "Plano": refeições detalhadas atuais
- [ ] Tab "Histórico": planos anteriores

---

## 7. Critérios de Aceite

Para cada checkpoint:
- [ ] `pnpm build` passa sem erros de tipo
- [ ] Página funciona em mobile (viewport 375px) sem scroll horizontal
- [ ] Tab 1 entrega o valor principal sem scroll em desktop (viewport 1280×720)
- [ ] Empty states guiam para próximo passo (nunca vazio + mudo)
- [ ] Nenhum dado/funcionalidade existente é perdido

---

## 8. Fora de Escopo (v1)

- Animações de transição entre tabs
- Novos dados/gráficos (reuso só de existentes)
- Redesign visual (cores, tipografia, espaçamentos)
- Mobile-specific UX novos (só garantir que não quebre)
- Gamification real (badges, XP, levels) — só placeholder na tab "Conquistas"
- Notificações push
- Comparação entre usuários / social

---

## 9. Ordem de Execução Recomendada

```
CHK-1 (foundation)  →  CHK-2 (workout, quick win visível)
                    →  CHK-3 (profile, unlocks CHK-4)
                    →  CHK-4 (history, usa migração)
                    →  CHK-5 (dashboard, big bet)
                    →  CHK-6 (plan)
                    →  CHK-7 (measures)
                    →  CHK-8 (nutrition)
```

CHK-1 é pré-requisito para todos. CHK-3 precisa vir antes de CHK-4 (migração).

---

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Perder funcionalidade ao reorganizar | Commit por checkpoint, revisão manual pós-checkpoint |
| Nerd sente que "perdeu" densidade | Tab 3 de cada página concentra todos os dados antigos |
| Mobile quebra em alguns checkpoints | Testar viewport 375px ao final de cada CHK |
| Componentes novos inconsistentes visualmente | CHK-1 estabelece padrão, todos os CHKs subsequentes reutilizam |
