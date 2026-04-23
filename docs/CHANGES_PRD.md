# PRD — Sprint de Funcionalidades: Antigravity Fitness

**Versão:** 1.0  
**Data:** 2026-04-22  
**Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Supabase (PostgreSQL) · Prisma 7 · Framer Motion · shadcn/ui

---

## 0. Instruções Gerais para o Desenvolvedor

### Princípios de execução
- Cada feature deve ser implementada, testada visualmente e marcada no Checklist (seção 10) antes de avançar para a próxima.
- Todas as queries a banco de dados devem passar por `lib/db/` — nunca acesse `prisma` diretamente em componentes ou Server Actions.
- Qualquer uso de IA para geração de planos, análises ou recomendações **deve sempre** buscar `v_ai_rules` do banco antes de chamar o modelo. Ver seção de IA abaixo.
- O schema de banco de dados vive em `supabase/restore.sql` (tabelas com SERIAL IDs) — não use `pnpm db:push` destrutivo. Aplique alterações via `supabase/migrations/` como SQL avulso.
- Nunca quebre o tipo `CoachingRule`, `WorkoutSession`, `WorkoutSet` — qualquer extensão deve ser additive.

### Integração com a Base de Conhecimento da IA
Toda funcionalidade que usa um LLM deve:
1. Buscar `SELECT * FROM v_ai_rules` antes de chamar o modelo.
2. Incluir as regras no `system prompt` sob o bloco `## REGRAS DE TREINAMENTO`.
3. Cruzar dados de `v_ai_context` (volume atual por músculo) + `v_exercise_progress` (progressão por exercício) + `body_metrics` (últimos 14 dias) + `clinical_alerts` (alertas ativos).
4. Nunca prescrever exercícios contraindicados em `clinical_alerts` com `status_summary = 'ativo'` e `alert_flag = 'CRITICAL'`.

### Cursor pointer
Adicione `cursor-pointer` a todo elemento clicável que não seja um `<button>` ou `<a>` nativo do shadcn/ui. Crie um utilitário global se necessário:

```css
/* app/globals.css — adicionar */
[role="button"], [data-clickable], .clickable { cursor: pointer; }
```

Para divs/cards clicáveis: sempre adicionar `className="... cursor-pointer"`.

### Botão Voltar — comportamento dinâmico
Nunca use `href` hardcoded em botões de voltar. Use sempre:

```tsx
'use client'
import { useRouter } from 'next/navigation'

const router = useRouter()
const handleBack = () => router.back()
```

Se o componente for Server Component, mova apenas o botão de voltar para um Client Component filho.

---

## 1. Requisitos Transversais (GEN)

### GEN-001 — Cursor pointer em todos os elementos acionáveis

**Arquivos afetados:** `app/globals.css` e todos os componentes com divs clicáveis.

**Implementação:**
1. Auditar todos os arquivos em `components/` e `app/` buscando por `onClick` em elementos não-button.
2. Adicionar `cursor-pointer` em cada ocorrência.
3. Em `app/globals.css`, adicionar a regra global acima como fallback.
4. Verificar: `<div onClick...>`, `<motion.div onClick...>`, `<Link>` (já tem por padrão), cards com hover.

**Critério de aceite:** Ao passar o mouse em qualquer elemento interativo, o cursor vira mão em 100% dos casos.

---

### GEN-002 — Botão Voltar retorna à tela de origem

**Arquivos afetados:** `app/workout/[id]/page.tsx`, qualquer tela com botão voltar.

**Implementação:**
1. Em `app/workout/[id]/page.tsx`, substituir `<Link href="/workout">` no botão ArrowLeft por:
```tsx
'use client'
// Extrair o botão voltar para um componente BackButton client:
// components/back-button.tsx
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ fallback = '/workout' }: { fallback?: string }) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full cursor-pointer"
      onClick={() => {
        if (window.history.length > 1) router.back()
        else router.push(fallback)
      }}
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  )
}
```
2. Usar `<BackButton fallback="/workout" />` em `app/workout/[id]/page.tsx`.
3. Aplicar o mesmo padrão em qualquer outro lugar que tenha botão voltar.

**Critério de aceite:** Acessar `/workout/[id]` vindo do `/history` e clicar em Voltar retorna ao `/history`. Acessar vindo do `/workout` retorna ao `/workout`.

---

### GEN-003 — Usabilidade geral: auditoria e correções

**Problemas identificados no código atual:**

| Problema | Local | Correção |
|----------|-------|----------|
| `input` nativo sem classe focus-ring | `app/plan/page.tsx:224` (ExerciseLibrary) | Substituir por `<Input>` do shadcn/ui |
| Cards clicáveis sem `cursor-pointer` | múltiplos | Adicionar conforme GEN-001 |
| Botão "Add Exercise" em inglês | `app/workout/[id]/page.tsx:177` | Traduzir para "Adicionar Exercício" |
| Nav mobile: "Base IA" não aparece | `components/navigation.tsx` | Adicionar na barra mobile com ícone BookOpen |
| Overflow em telas pequenas | verificar em mobile 375px | Testar e adicionar `overflow-x-hidden` onde necessário |
| Animação de lista sem `layout` prop | várias listas com AnimatePresence | Adicionar `layout` para transições suaves |

**Adicionais a verificar manualmente:**
- Garantir que nenhum elemento fica sobrepostos no mobile (bottom nav deve ter padding `pb-20 md:pb-0`).
- Verificar que o sidebar desktop (`md:pl-64`) é aplicado corretamente em todas as páginas.
- Verificar que `<Toaster />` (sonner) está no root layout e não duplicado.

---

## 2. Dashboard (DASH)

### Nova estrutura de abas do Dashboard

Renomear as abas do dashboard de:
- `Visão Geral | Calendário | Progressão`

Para:
- `Visão Geral | Resumo | Progressão`

A aba **Resumo** substituirá a aba Calendário e conterá os gráficos e stats. A aba **Visão Geral** terá o novo layout com calendário integrado na direita.

---

### DASH-001 — Visão Geral: layout com calendário integrado

**Arquivo:** `app/page.tsx` (aba `overview`)

**Layout alvo:**
```
┌─────────────────────────────────────────────────────┐
│  [← →] Terça, 22 de Abril                           │  ← DayNav (navegação de dias)
│  Treino: Superior A · 4 exercícios · 16 séries      │
├──────────────────────────────────────┬──────────────┤
│  WorkoutCalendar (semana atual)      │  MiniCalendar│
│  (7 dias com status de cada dia)     │  (mês inteiro│
│                                      │  com tooltip)│
├──────────────────────────────────────┴──────────────┤
│  PhaseTransitionAlert (se houver)                   │
└─────────────────────────────────────────────────────┘
```

**Componentes novos a criar:**

#### `components/day-nav.tsx`
- Exibe a data atual com setas `←` `→` para navegar dia a dia.
- Prop: `date: string` (YYYY-MM-DD), `onPrev: () => void`, `onNext: () => void`.
- Exibe: data formatada (ptBR), nome do treino do dia (ou "Descanso"), link para a tela de treino se houver sessão.
- Se houver sessão no dia exibido e ela for clicada → `router.push(/workout/${sessionId})`.
- Estado gerenciado no `app/page.tsx` com `useState<string>(today)`.

#### `components/mini-calendar.tsx`
- Calendário mensal (grid 7×5) com dias do mês atual.
- Cada dia: clicável, muda o `DayNav` para aquele dia.
- Tooltip ao passar o mouse (usar `@radix-ui/react-tooltip` que já vem com shadcn/ui):
  - Data formatada.
  - Grupos musculares do treino planejado (buscar de `plannedSessions` + `plannedExercises` → `exercises` → `exerciseMuscles`).
  - Indicador se treino foi executado (status `'completed'`) ou não.
- Dias com treino: dot indicator colorido por grupo muscular primário.
- Dias de descanso: neutros.
- O calendário fica na **coluna direita** da Visão Geral, no lugar onde estava `PhaseProgress`.

**Remoção da coluna direita:** `PhaseProgress`, `MuscleVolumePanel` e `WeeklyStats` saem da Visão Geral e vão para a nova aba **Resumo** (DASH-002).

**Implementação em `app/page.tsx`:**
```tsx
// Aba 'overview':
const [viewDate, setViewDate] = useState(today)

<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2 space-y-4">
    <DayNav
      date={viewDate}
      onPrev={() => setViewDate(prev => subDays(parseISO(prev), 1))}
      onNext={() => setViewDate(prev => addDays(parseISO(prev), 1))}
    />
    <GlassCard>
      <GlassCardTitle>Esta Semana</GlassCardTitle>
      <WorkoutCalendar onDayClick={(date) => setViewDate(date)} />
    </GlassCard>
    <PhaseTransitionAlert />
  </div>
  <div>
    <MiniCalendar
      selectedDate={viewDate}
      onDayClick={(date) => setViewDate(date)}
    />
  </div>
</div>
```

**`WorkoutCalendar` — adicionar prop `onDayClick`:**
- Ao clicar em qualquer dia que tenha treino → chama `onDayClick(date)` E navega para `/workout/${sessionId}`.
- Ao clicar em dia sem treino → chama `onDayClick(date)` apenas.

**Critério de aceite:**
- [x] Calendário mini está na direita no desktop, abaixo do DayNav no mobile.
- [x] Hover em qualquer dia do mini-calendário exibe tooltip com data e músculos.
- [x] Setas do DayNav mudam a data exibida + o DayNav atualiza o conteúdo.
- [x] Clicar num dia com treino no WorkoutCalendar navega para a tela do treino.
- [x] Clicar em Voltar na tela do treino retorna ao Dashboard (GEN-002).

---

### DASH-002 — Aba Resumo (substitui Calendário)

**Arquivo:** `app/page.tsx` — renomear aba `calendar` para `summary`, valor `'summary'`.

**Conteúdo da aba Resumo (layout simétrico em grid):**
```
┌──────────────────┬──────────────────┐
│  WeeklyStats     │  PhaseProgress   │
├──────────────────┼──────────────────┤
│  VolumeChart     │  MuscleVolume    │
│  (col-span-2)    │  Panel           │
└──────────────────┴──────────────────┘
```

Implementação:
```tsx
<TabsContent value="summary" className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <WeeklyStats />
    <PhaseProgress />
  </div>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="md:col-span-2">
      <GlassCard>
        <GlassCardTitle className="mb-4">Volume Semanal por Músculo</GlassCardTitle>
        <VolumeChart />
      </GlassCard>
    </div>
    <MuscleVolumePanel />
  </div>
</TabsContent>
```

**Critério de aceite:**
- [x] Aba exibida como "Resumo" (não "Calendário").
- [x] Cards distribuídos simetricamente — sem overflow, sem sobreposição.
- [x] Todos os 4 componentes renderizam sem erro.

---

### DASH-003 — Aba Progressão: manter sem alteração

A aba Progressão (`ExerciseProgressionTable` + `ProgressionCharts`) não muda estruturalmente. Apenas garantir que não haja redundância com a futura aba History reformulada (ver HIST-001).

---

## 3. Plan (PLAN)

### PLAN-001 — Programação Semanal no topo

**Arquivo:** `app/plan/page.tsx`, aba `sessions`

**Mudança:** Mover o bloco "Programação Semanal" (`GlassCard delay={0.2}`) para **antes** do bloco "Templates de Sessão".

**Adicionar interatividade na Programação Semanal:**
- Cada dia com sessão: clicável → abre um `Dialog` ou painel lateral com os detalhes da sessão planejada (`PlannedExercise`s).
- No painel de detalhes:
  - Listar exercícios planejados com `sets_count`, `reps_min–reps_max`, `target_rir`, `technique`.
  - Botão "Editar Sessão" → abre formulário de edição (CRUD).
  - Botão "Mover Sessão" → entra em modo de seleção: o usuário clica no dia de destino e a sessão é movida (atualizar `day_of_week` e `planned_date` no banco).

**Drag and Drop entre dias:**
- Instalar: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Os 7 dias da semana são droppable zones (`useDroppable`).
- Cada sessão no grid é draggable (`useDraggable`).
- Ao soltar em outro dia: chamar Server Action `moveSessionAction(sessionId, newDayOfWeek)` que atualiza `planned_sessions.day_of_week`.

**CRUD de sessões:**
- Editar nome, exercícios planejados (add/remove/edit), dia da semana.
- Deletar sessão com confirmação.
- Criar nova sessão (já existe botão "Adicionar Sessão" — implementar o formulário).

**Critério de aceite:**
- [ ] Programação Semanal é o primeiro bloco visível na aba Sessões.
- [ ] Clicar num dia com sessão abre painel com detalhes.
- [ ] Arrastar sessão de um dia para outro atualiza o banco e a UI.
- [ ] CRUD completo funcional (create, read, update, delete de sessões).

---

### PLAN-002 — Templates de Sessão: CRUD completo

**Arquivo:** `app/plan/page.tsx`, componente `SessionPlanCard`  
**Arquivo:** `components/session-plan-card.tsx`

**Adicionar ao SessionPlanCard:**
- Botão "Editar" (ícone Pencil) → abre dialog com formulário de edição.
- Botão "Deletar" (ícone Trash2) → AlertDialog de confirmação → Server Action `deleteSessionTemplateAction`.
- No formulário de edição:
  - Alterar nome da sessão.
  - Adicionar/remover exercícios planejados com `sets_count`, `reps_min`, `reps_max`, `target_rir`, `technique` (select), `sort_order`.
  - Drag to reorder exercícios dentro da sessão (usar `@dnd-kit/sortable`).

**Server Actions necessárias** (`app/plan/actions.ts`):
```ts
updatePlannedSessionAction(id, { name, dayOfWeek })
deletePlannedSessionAction(id)
addPlannedExerciseAction(plannedSessionId, exerciseId, { setsCount, repsMin, repsMax, targetRir, technique })
updatePlannedExerciseAction(id, { setsCount, repsMin, repsMax, targetRir, technique, sortOrder })
deletePlannedExerciseAction(id)
moveSessionAction(sessionId, newDayOfWeek)
```

**Critério de aceite:**
- [ ] Todos os templates têm botão editar e deletar visíveis.
- [ ] Editar e salvar reflete na UI sem refresh.
- [ ] Deletar exibe confirmação antes de executar.
- [ ] Exercícios dentro da sessão podem ser reordenados por drag.

---

### PLAN-003 — Aba Fases: CRUD + Botão Replanejar com IA

**Arquivo:** `app/plan/page.tsx`, aba `phases`

**CRUD de Fases:**
- Botão "Adicionar Fase" (já existe) → formulário com todos os campos de `training_phases`:
  - `name`, `etapa` (1 ou 2), `phase_type` (select com opções do schema), `meso_number`
  - `duration_weeks`, `target_rir_min`, `target_rir_max`
  - `volume_pct_tension`, `volume_pct_metabolic` (sliders 0–100%, somando 100%)
  - `technique_focus` (select: null, Drop Set, Super Set, Falsa Pirâmide)
  - `progression_rule` (textarea)
  - `is_current` (switch — apenas uma fase pode ser current; ao ativar uma, desativa as outras)
- Editar fase existente: ícone Pencil no `PhaseCard`.
- Deletar fase: ícone Trash com confirmação.
- Reordenar fases: drag & drop para alterar `phase_order`.

**Botão "Replanejar com IA":**
- Posição: header da aba Fases, ao lado de "Adicionar Fase".
- Ícone: `Sparkles` (lucide).
- Comportamento:
  1. Clicar → loading state.
  2. Servidor busca: `v_ai_rules`, `v_ai_context`, `v_exercise_progress` (últimas 8 semanas), `body_metrics` (últimos 30 dias), fase atual, todas as sessões planejadas.
  3. Chama LLM (API Route `app/api/ai/replan/route.ts`) com esses dados como contexto.
  4. LLM retorna ajustes sugeridos: quais fases adicionar/modificar, quais exercícios mudar.
  5. Exibe resultado em um Dialog com preview das mudanças.
  6. Usuário clica "Aplicar" (salva no banco) ou "Descartar".
- A IA deve seguir as regras de `v_ai_rules` e os gatilhos de `docs/METHODOLOGY.md`.

**Server Action / API Route:**
```ts
// app/api/ai/replan/route.ts
// POST — recebe contexto, retorna sugestão de replaneamento
```

**Critério de aceite:**
- [x] Aba Nutrição visível e funcional.
- [x] Geração automática/manual integrada ao Supabase.
- [x] Engine Adaptativo v2 implementado (Peso, Macros, Recuperação).
- [ ] CRUD completo de fases funcionando.
- [ ] Apenas uma fase pode ter `is_current = true` simultaneamente.
- [ ] Botão Replanejar chama IA com contexto completo (rules + dados).
- [ ] Preview de mudanças antes de aplicar.

---

### PLAN-004 — Aba Exercícios: ícones, vídeos e CSV import

**Arquivo:** `app/plan/page.tsx`, componente `ExerciseLibrary`

#### 4a. Ícones por grupo muscular

Criar SVG minimalistas (silhueta anatômica destacando o grupo) para os grupos:
- Peitoral, Costas, Ombros, Braços, Membros Inferiores, Core, Costas/Core

**Implementação:**
- Criar `components/muscle-icons/` com um arquivo SVG ou TSX por grupo.
- Usar como ícone no card de cada exercício na biblioteca.
- Exemplo: `components/muscle-icons/chest-icon.tsx`

Alternativa prática (sem SVGs customizados): usar emojis anatômicos ou ícones do `lucide-react` mapeados por grupo até os SVGs serem criados:
```ts
const MUSCLE_ICONS: Record<string, string> = {
  'Peitoral': '🫁',
  'Costas': '🔙',
  'Ombros': '💪',
  'Braços': '💪',
  'Membros Inferiores': '🦵',
  'Core': '⭕',
}
```

#### 4b. Link de vídeo YouTube por exercício

**Schema:** Adicionar coluna `video_url TEXT` na tabela `exercises` (ver DB-001).

**UI:**
- No card do exercício: botão de play (ícone `PlayCircle`) visível se `video_url` preenchido.
- Clicar no botão: abre Dialog com iframe embarcado:
```tsx
const videoId = extractYouTubeId(exercise.videoUrl)
<iframe
  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
  className="w-full aspect-video rounded-xl"
/>
```
- Função `extractYouTubeId(url)`: suporta formatos `youtube.com/watch?v=ID`, `youtu.be/ID`, `youtube.com/embed/ID`.
- Campo editável: no dialog de edição do exercício, input para substituir a URL manualmente.

**Server Action:**
```ts
// app/plan/actions.ts
updateExerciseVideoAction(exerciseId: number, videoUrl: string | null)
```

#### 4c. CSV Import — Seed de exercícios

**Arquivo:** `supabase/seed_exercises.sql`

Gerar SQL a partir de `docs/treinos - Exercicios.csv` com as seguintes regras:
- Para cada `ID Exercício` único: INSERT INTO `exercises` (id, name, movement_pattern, classification, neural_demand).
- Para cada linha do CSV: INSERT INTO `exercise_muscles` (exercise_id, muscle_group, muscle, series_factor).
- Usar `ON CONFLICT DO NOTHING` para ser idempotente.
- Mapear `Fator (Série)` → `series_factor` (já é DECIMAL, valores: 0.5 ou 1.0).
- Mapear `Exigência Neural` → `neural_demand` (INTEGER 1-10).
- Mapear `Classificação` → `classification` (TEXT: 'Composto'/'Isolador').
- Mapear `Padrão de Movimento` → `movement_pattern`.
- Mapear `Grupo` → `muscle_group`.
- Mapear `Músculo` → `muscle`.

O arquivo SQL deve ser executável no Supabase SQL Editor diretamente. Gerar com `INSERT INTO exercises (id, name, ...) VALUES ...` para todos os 117 exercícios únicos do CSV.

**Critério de aceite:**
- [ ] Cada exercício exibe ícone do grupo muscular.
- [ ] Exercícios com vídeo exibem botão de play.
- [ ] Clicar play abre dialog com vídeo embarcado.
- [ ] URL do vídeo pode ser editada manualmente.
- [ ] `seed_exercises.sql` executa sem erro e popula exercícios + músculos.

---

## 4. Workout (WKT)

### WKT-001 — Lista de sessões: layout dois em dois

**Arquivo:** `app/workout/page.tsx`

**Layout atual:** Lista vertical de sessões.  
**Layout novo:** Duas colunas lado a lado.

```
┌─────────────────────────┬──────────────────────────┐
│  PRÓXIMOS TREINOS       │  CONCLUÍDOS RECENTEMENTE  │
├─────────────────────────┼──────────────────────────┤
│  Superior A (amanhã)    │  Superior B (seg)        │
│  Inferior A (qui)       │  Inferior A (sáb)        │
│  Superior B (sex)       │  Superior A (sáb ant.)   │
└─────────────────────────┴──────────────────────────┘
```

**Implementação:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div>
    <h2>Próximos Treinos</h2>
    {upcomingSessions.map(session => <SessionCard key={session.id} session={session} />)}
  </div>
  <div>
    <h2>Concluídos Recentemente</h2>
    {recentCompleted.map(session => <SessionCard key={session.id} session={session} />)}
  </div>
</div>
```

- `upcomingSessions`: sessões com `date >= today` ordenadas por data ASC, limitado a 5.
- `recentCompleted`: sessões com `status === 'completed'` ordenadas por data DESC, limitado a 5.

**Critério de aceite:**
- [ ] Duas colunas visíveis no desktop.
- [ ] No mobile (< 768px): uma coluna, Próximos primeiro, Concluídos abaixo.

---

### WKT-002 — Busca semântica e bilíngue de exercícios

**Arquivo:** `components/add-exercise-modal.tsx`  
**Arquivo:** `lib/db/exercises.ts`

**Problema atual:** busca apenas por nome exato, apenas em português.

**Solução — two-level search:**

**Nível 1: busca no frontend** (já existente, melhorar):
- Buscar pelo nome em PT e EN (adicionar campo `name_en` nos dados — ver DB-001).
- Normalizar acentos antes de comparar: `str.normalize('NFD').replace(/\p{Mn}/gu, '')`.

**Nível 2: fuzzy search com trigrams** (PostgreSQL):
```sql
-- Executar uma vez no Supabase:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops);
```

**Nova função em `lib/db/exercises.ts`:**
```ts
export async function searchExercises(query: string): Promise<Exercise[]> {
  return prisma.$queryRaw<Exercise[]>`
    SELECT id, name, movement_pattern, classification, neural_demand
    FROM exercises
    WHERE
      name ILIKE ${'%' + query + '%'}
      OR name_en ILIKE ${'%' + query + '%'}
      OR similarity(name, ${query}) > 0.25
      OR similarity(name_en, ${query}) > 0.25
    ORDER BY
      GREATEST(similarity(name, ${query}), similarity(name_en, ${query})) DESC,
      name ASC
    LIMIT 30
  `
}
```

**No `AddExerciseModal`:**
- Debounce a busca em 300ms.
- Se `query.length >= 2`: chamar `searchExercisesAction(query)` (Server Action).
- Se `query.length < 2`: mostrar lista local de exercícios do contexto.

**Critério de aceite:**
- [ ] Buscar "bench press" (inglês) retorna "Bench Press".
- [ ] Buscar "supino" retorna Bench Press + variações.
- [ ] Erros de digitação como "suipno" ainda retornam resultados relevantes.
- [ ] Busca com 0 resultados exibe mensagem amigável.

---

### WKT-003 — Tela de treino: botão de iniciar/pausar/encerrar

**Arquivo:** `app/workout/[id]/page.tsx`

**Estado atual:** Só tem "Iniciar Treino" (CTA inicial) e "Concluir Treino" (sticky bottom).  
**Estado novo:** Três estados com botão no header sticky:

| Status | Botão visível | Ação |
|--------|--------------|------|
| `pending` | `▶ Iniciar Treino` | → chama `startWorkout`, salva session no DB, inicia timer |
| `in-progress` | `⏸ Pausar` | → salva timestamp de pausa; timer pausa |
| `in-progress` (pausado) | `▶ Retomar` | → retoma timer |
| `in-progress` | `✓ Encerrar Treino` | → chama `completeWorkout`, marca concluído |

**Timer persistente:** o tempo deve ser salvo no `localStorage` com a key `workout-timer-${sessionId}` junto com o timestamp de início. Na volta à página, calcular o elapsed a partir do timestamp. Exemplo:
```ts
localStorage.setItem(`workout-timer-${sessionId}`, JSON.stringify({ startedAt: Date.now(), pausedAt: null, totalPaused: 0 }))
```

**No header sticky, substituir os botões atuais por:**
```tsx
<WorkoutControls
  status={session.status}
  onStart={handleStart}
  onPause={handlePause}
  onResume={handleResume}
  onComplete={handleComplete}
  elapsed={elapsedTime}
/>
```

Remover o CTA central "Pronto para treinar?" — substituído pelo controle no header.

**Critério de aceite:**
- [ ] Header exibe botão correto para cada estado.
- [ ] Timer não reseta ao sair e voltar da página.
- [ ] Pausar para o timer; retomar continua do ponto correto.

---

### WKT-004 — Persistência de sessão: arquitetura

**Problema:** Se o usuário fechar o browser durante um treino, todos os dados são perdidos (estado só em memória/localStorage).

**Arquitetura recomendada:**

**Fonte de verdade: Supabase.**  
**Cache rápido: localStorage** (para leitura instantânea na abertura).

**Fluxo de escrita:**
1. Usuário altera um campo de série (carga, reps, RPE).
2. State React atualiza imediatamente (otimista).
3. Debounce de 800ms → dispara `upsertWorkoutSetAction` (já existe em `app/actions.ts`).
4. Em paralelo, salva o estado completo da sessão em `localStorage['workout-session-${id}']`.

**Fluxo de leitura (ao abrir a tela):**
1. Verificar se existe sessão ativa no banco para hoje: `SELECT * FROM workout_sessions WHERE date = TODAY AND id = $sessionId`.
2. Se sim: carregar sets do banco (`SELECT * FROM workout_sets WHERE session_id = $id`).
3. Merge com `localStorage` se houver dados mais recentes (comparar `savedAt` dos sets).
4. Popular o estado React com os dados merged.

**Implementação:**

```ts
// lib/db/sessions.ts — nova função
export async function getActiveSession(date: string) {
  const rows = await prisma.$queryRaw`
    SELECT ws.*, array_agg(wset.*) as sets
    FROM workout_sessions ws
    LEFT JOIN workout_sets wset ON wset.session_id = ws.id
    WHERE ws.date = ${date}
    GROUP BY ws.id
  `
  return rows[0] ?? null
}
```

```tsx
// app/workout/[id]/page.tsx — no useEffect de mount:
useEffect(() => {
  const localData = localStorage.getItem(`workout-session-${id}`)
  const localSession = localData ? JSON.parse(localData) : null
  // Merge local com DB data (DB data vem de initialSession prop)
  if (localSession && localSession.updatedAt > initialSession?.updatedAt) {
    // usar local
  }
}, [])
```

**Critério de aceite:**
- [ ] Fechar o browser durante treino e reabrir: todos os sets preenchidos continuam lá.
- [ ] Trocar de aba e voltar: dados intactos.
- [ ] Dados persistem entre dispositivos (via Supabase).

---

### WKT-005 — CRUD de séries e exercícios na tela de treino

**Arquivo:** `components/workout-exercise-card.tsx`

**Adicionar:**
- Botão `+` para adicionar nova série ao exercício.
- Botão `×` para remover série específica (com confirmação discreta — shake animation + confirmar).
- Botão "Remover Exercício" no header do card (com AlertDialog).
- Reordenação de séries por drag handle (opcional — baixa prioridade).

**Server Actions:**
```ts
// app/actions.ts — adicionar:
export async function deleteWorkoutSetAction(setId: string)
export async function addWorkoutSetAction(sessionId: string, exerciseId: string, setNumber: number)
export async function deleteWorkoutExerciseAction(sessionId: string, exerciseId: string)
```

**Critério de aceite:**
- [ ] Adicionar série: nova linha de input aparece com `setNumber` correto.
- [ ] Remover série: desaparece da UI e do banco.
- [ ] Remover exercício: AlertDialog, depois exercício sumido do treino.

---

### WKT-006 — Campos de série: RPE↔RIR, categoria e legenda

**Arquivo:** `components/workout-exercise-card.tsx`

**Campos existentes (manter):** carga (kg), reps, RPE.  
**Adicionar:**
- Campo RIR (exibir ao lado do RPE).
- Lógica de conversão automática: `RIR = 10 - RPE` e `RPE = 10 - RIR`. Ao editar um, o outro atualiza em tempo real.
- Campo "Categoria" (já existe — garantir que `set_type` é salvo corretamente).

**Legenda de categorias:**
- Botão de interrogação `?` no header do card → abre um `Popover` com tabela explicativa:

| Categoria | Descrição |
|-----------|-----------|
| Working Set | Série principal de trabalho com intensidade alvo |
| Top Set | Melhor série da sessão (maior carga ou esforço) |
| Back Off Set | Série de recuo pós-Top Set, carga reduzida |
| Warming Set | Aquecimento, não conta para volume |
| Feeder Set | Série de aproximação, não conta para volume |

**Critério de aceite:**
- [ ] Editar RPE → RIR atualiza automaticamente (vice-versa).
- [ ] Popover de legenda abre e fecha corretamente.
- [ ] Categoria é salva no banco corretamente.

---

### WKT-007 — Marcas anteriores e tonelagem na tela de treino

**Arquivo:** `components/workout-exercise-card.tsx`  
**Arquivo:** `lib/db/sessions.ts`

**O que exibir acima de cada exercício:**
```
┌────────────────────────────────────────┐
│ Último treino: 15/04 · 80kg × 8 reps  │
│ Tonelagem anterior: 1.920kg            │
│ Tonelagem atual: 960kg (↓ 50%)        │
└────────────────────────────────────────┘
```

**Buscar dados:**
- `getLastSessionTonnageForExercise(exerciseId, currentSessionId)` — retorna a última sessão executada (excluindo a sessão atual), com max_load, reps array, tonnage total.
- Calcular tonelagem atual em tempo real (soma dos sets já preenchidos).

**Novo query em `lib/db/sessions.ts`:**
```ts
export async function getLastSessionDataForExercise(exerciseId: string, excludeSessionId: string) {
  const rows = await prisma.$queryRaw`
    SELECT
      s.date,
      MAX(ws.load_kg) as max_load,
      SUM(ws.tonnage) FILTER (WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set')) as last_tonnage,
      ARRAY_AGG(ws.reps ORDER BY ws.set_number) FILTER (WHERE ws.set_type IN ('Working Set','Top Set','Back Off Set')) as reps_array
    FROM workout_sets ws
    JOIN workout_sessions s ON ws.session_id = s.id
    WHERE ws.exercise_id = ${exerciseId}
      AND ws.session_id != ${excludeSessionId}
    GROUP BY s.date
    ORDER BY s.date DESC
    LIMIT 1
  `
  return rows[0] ?? null
}
```

**Critério de aceite:**
- [ ] Bloco de histórico aparece acima das séries de cada exercício.
- [ ] Tonelagem atual é atualizada em tempo real conforme o usuário preenche.
- [ ] Comparação correta com sessão anterior (não com a atual).

---

## 5. History (HIST)

### HIST-001 — Reformulação: foco em histórico detalhado por sessão

**Arquivo:** `app/history/page.tsx`

**Problema:** Aba History atual duplica Progressão (que já está no Dashboard). Deve ser **diferente**: foco em histórico cronológico de sessões individuais com detalhes.

**Nova estrutura da aba History:**

**Removidos** (pois estão no Dashboard > Progressão):
- `ExerciseProgressionTable`
- `ProgressionCharts`

**Novos conteúdos:**

**Aba "Sessões"** (lista cronológica):
- Lista de todas as sessões concluídas, mais recente primeiro.
- Card de cada sessão mostra:
  - Data e nome do treino.
  - Grupos musculares treinados (tags coloridas).
  - Volume total (tonelagem) da sessão.
  - Número de séries efetivas (Working+Top+BackOff com RPE≥7).
  - Tempo de treino (se disponível).
  - Link → vai para `workout/[id]` para ver detalhes completos.

**Aba "PRs"** (recordes por exercício):
- Tabela: Exercício | Carga Máxima | Data | 1RM Epley.
- Filtrável por grupo muscular.
- Ordenável por data ou carga.
- Mostrar evolução do 1RM ao longo do tempo em sparkline (mini gráfico de linha).

**Aba "Análise Semanal"** (análise por semana):
- Picker de semana (setas ← →).
- Para a semana selecionada:
  - Total de treinos realizados vs planejados.
  - Volume por grupo muscular (barras horizontais vs MEV/MRV).
  - Comparação com semana anterior (delta de tonelagem por exercício).
  - Status de progressão: quais exercícios evoluíram / estagnaram / regrediram.

**Stats no topo (manter mas expandir):**
```tsx
[Treinos Totais] [Séries Efetivas] [Tonelagem Total] [Streak Atual]
```

**Critério de aceite:**
- [ ] Sem duplicação com Dashboard > Progressão.
- [ ] Sessão clicável leva aos detalhes (e voltar retorna ao History).
- [ ] PRs mostram evolução histórica por exercício.
- [ ] Análise Semanal compara com semana anterior.

---

## 6. Nova Aba: Medidas (MED)

### MED-001 — Aba Medidas no navegador

**Arquivo:** `components/navigation.tsx`  
**Arquivo:** `app/measures/page.tsx` (criar)

**Adicionar link na navegação:**
- Desktop sidebar: entre "History" e "Base IA".
- Mobile bottom: adicionar como 5º item (ou usar um menu expandido).
- Ícone: `Ruler` (lucide).
- Label: "Medidas".

---

### MED-002 — Página Medidas: formulário de entrada

**Arquivo:** `app/measures/page.tsx`

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  Minhas Medidas                   [+ Registrar]    │
├───────────────────────┬────────────────────────────┤
│  Resumo Atual         │  Histórico (gráfico)       │
│  Peso: 82.5kg         │  [Selector: Peso/Medida]   │
│  BF: 14%              │  [LineChart ao longo tempo] │
│  IMC: 23.5            │                             │
├───────────────────────┴────────────────────────────┤
│  Análise de Proporções                              │
│  (Steve Reeves / Casey Butt)                       │
└────────────────────────────────────────────────────┘
```

**Formulário "Registrar Medidas"** (Dialog):

Campos mapeados para `body_metrics`:
| Campo no form | Coluna DB | Tipo | Obrigatório |
|--------------|-----------|------|-------------|
| Data | `date` | DATE | Sim |
| Peso (kg) | `weight_kg` | DECIMAL(5,2) | Sim |
| Altura (cm) | `height_cm` | DECIMAL(5,1) | Na primeira vez |
| % Gordura | `bf_pct` | DECIMAL(4,1) | Não |
| Horas de sono | `sleep_hours` | DECIMAL(3,1) | Não |
| Cintura (cm) | `waist_cm` | DECIMAL(5,1) | Não |
| Peito (cm) | `chest_cm` | DECIMAL(5,1) | Não |
| Braços (cm) | `arms_cm` | DECIMAL(5,1) | Não |
| Antebraços (cm) | `forearms_cm` | DECIMAL(5,1) | Não |
| Coxas (cm) | `thighs_cm` | DECIMAL(5,1) | Não |
| Panturrilhas (cm) | `calves_cm` | DECIMAL(5,1) | Não |
| Pulso (cm) | `wrist_cm` | DECIMAL(5,1) | Não |
| Tornozelo (cm) | `ankle_cm` | DECIMAL(5,1) | Não |
| Nível de energia | `energy_level` | INTEGER 1-10 | Não |
| Notas de dor | `pain_notes` | TEXT | Não |

> **DB:** Adicionar colunas `wrist_cm` e `ankle_cm` à tabela `body_metrics` (ver DB-002).

**Server Actions** (`app/measures/actions.ts`):
```ts
saveBodyMetricsAction(data: BodyMetricsInput): Promise<BodyMetrics>
getBodyMetricsHistoryAction(limit?: number): Promise<BodyMetrics[]>
```

**Gráficos históricos** (usar `recharts`, já instalado):
- `LineChart` com seletor de métrica (peso, BF%, cintura, braços...).
- Eixo X: datas. Eixo Y: valor da métrica.
- Tooltip com valor exato na data.

**Critério de aceite:**
- [x] Formulário salva no Supabase (tabela `body_metrics`).
- [x] Gráfico exibe histórico correto após salvar.
- [x] Campos opcionais não quebram se vazios.
- [x] `date` tem constraint UNIQUE — ao salvar na mesma data, fazer upsert.

---

### MED-003 — Análise de Proporções Naturais

**Arquivo:** `app/measures/page.tsx` ou `components/body-proportions.tsx`

**Fórmula de referência: Steve Reeves (Natural Proportions)**

Proporções ideais baseadas na circunferência do pulso (wrist_cm):

```ts
// lib/body-proportions.ts
export function calcIdealProportions(wristCm: number) {
  return {
    biceps:       wristCm * 2.52,  // braço flexionado
    neck:         wristCm * 2.52,
    chest:        wristCm * 6.50,
    waist:        wristCm * 4.76,
    hips:         wristCm * 3.33,  // quadril
    thigh:        wristCm * 2.20,  // coxa (mid)
    calf:         wristCm * 1.42,
    forearm:      wristCm * 1.42,
  }
}
```

**Cálculo de limite natural (Casey Butt simplificado):**
```ts
export function calcNaturalBFLimit(wristCm: number, ankleCm: number, heightCm: number): number {
  // Fórmula de Casey Butt para LBM máximo natural
  // LBM (kg) = H × (wrist^0.5 + ankle^0.5) / 22.667
  const H = heightCm / 100
  const lbm = H * (Math.sqrt(wristCm) + Math.sqrt(ankleCm)) / 22.667 * 2.204 * 0.453592
  return lbm
}
```

**UI da análise:**
```
┌──────────────────────────────────────────────────────┐
│  Análise de Proporções                               │
│  Baseado em Steve Reeves + Casey Butt                │
├─────────────┬──────────────┬─────────────────────────┤
│  Medida     │  Atual       │  Ideal (pulso-based)    │
├─────────────┼──────────────┼─────────────────────────┤
│  Braços     │  38cm ✅     │  ~40cm                  │
│  Peito      │  105cm ✅    │  ~105cm                 │
│  Cintura    │  82cm ⚠️     │  ~76cm (muito alta)     │
│  Coxas      │  56cm ✅     │  ~57cm                  │
└─────────────┴──────────────┴─────────────────────────┘
│  LBM Máximo Natural Estimado: ~82kg                  │
│  LBM Atual: 71kg (86% do potencial natural)          │
│                                                      │
│  ⚠️ Possíveis desequilíbrios detectados:            │
│  • Braços podem precisar de mais volume direto       │
│  • Panturrilhas abaixo do proporcional               │
└──────────────────────────────────────────────────────┘
```

**Lógica de alerta:**
- Diferença > 10% abaixo do ideal → `⚠️ Abaixo do proporcional` (pode indicar ponto fraco).
- Diferença > 5% acima do ideal → sem alerta (excesso de músculo não é problema).
- Cintura > 80% do peito → alerta metabólico.

**Critério de aceite:**
- [ ] Tabela de proporções renderiza quando `wrist_cm` e medidas corporais existem.
- [ ] Alertas de possíveis desequilíbrios aparecem corretamente.
- [ ] LBM máximo natural é exibido com % do potencial atingido.
- [ ] Sem dados de pulso/tornozelo: exibir mensagem pedindo para registrar.

---

### MED-004 — Medidas no contexto da IA

As últimas medidas do atleta devem sempre entrar como contexto nas chamadas de IA.

**Em qualquer API Route ou Server Action que chame LLM:**
```ts
const latestMetrics = await prisma.$queryRaw`
  SELECT * FROM body_metrics ORDER BY date DESC LIMIT 1
`
// Incluir no prompt:
// ## MEDIDAS ATUAIS DO ATLETA
// Peso: ${metrics.weight_kg}kg, BF: ${metrics.bf_pct}%, Energia: ${metrics.energy_level}/10
// Sono: ${metrics.sleep_hours}h, Pulso: ${metrics.wrist_cm}cm
```

**Critério de aceite:**
- [x] API de Nutrição utiliza medidas recentes para cálculos.
- [ ] API de Feedback de Treino utiliza medidas (peso/energia) para ajustar intensidade.

---

## 7. Nova Aba: Nutrição (NUT)

### NUT-001 — Aba Nutrição no navegador

**Arquivo:** `components/navigation.tsx`  
**Arquivo:** `app/nutrition/page.tsx` (criar)

- Desktop sidebar: abaixo de "Medidas".
- Ícone: `Utensils` (lucide).
- Label: "Nutrição".

---

### NUT-002 — Página Nutrição: plano gerado por IA

**Arquivo:** `app/nutrition/page.tsx`

**Lógica de geração:**
O plano nutricional é gerado pela IA e **recalculado automaticamente** quando:
1. Uma nova fase começa (`training_phases.is_current` muda).
2. O usuário solicita explicitamente clicando em "Gerar Plano".
3. Mudança significativa de peso (> 2kg desde última geração).

**Armazenamento:**
Criar tabela `nutrition_plans` (ver DB-003) para armazenar o plano gerado.

**Layout da página:**
```
┌─────────────────────────────────────────────┐
│  Plano Nutricional                          │
│  Atualizado em: 15/04/2026 · Fase: Acum. 1 │
│                              [↻ Regenerar]  │
├─────────────┬───────────────────────────────┤
│  METAS      │  DISTRIBUIÇÃO DE MACROS       │
│  Calorias:  │  ██████████ Proteína 35%      │
│  2.850 kcal │  ████████   Carboidrato 45%   │
│             │  ████        Gordura 20%      │
├─────────────┴───────────────────────────────┤
│  OBSERVAÇÕES DA IA                          │
│  [texto gerado pela IA sobre situação atual]│
├─────────────────────────────────────────────┤
│  RECOMENDAÇÕES                              │
│  [lista de recomendações específicas]       │
├─────────────────────────────────────────────┤
│  PLANO SUGERIDO (refeições)                 │
│  ☀️ Café da manhã: ...                     │
│  🏋️ Pré-treino: ...                       │
│  💪 Pós-treino: ...                        │
│  🌙 Jantar: ...                            │
└─────────────────────────────────────────────┘
```

**API Route:** `app/api/ai/nutrition/route.ts`

**Contexto enviado para a IA:**
```ts
const context = {
  athlete: await getLatestBodyMetrics(),
  currentPhase: await getCurrentPhase(),
  weeklyVolume: await getWeeklyVolumeByMuscle(),
  trainingDays: athleteProfile.training_days,
  aiRules: await getAllRules(),   // v_ai_rules
  proportions: calcIdealProportions(metrics.wrist_cm),
  naturalLimitLBM: calcNaturalBFLimit(wrist, ankle, height),
}
```

**Prompt estrutura:**
```
## OBJETIVO
Gerar plano nutricional personalizado para atleta natural em fase [FASE_ATUAL].

## REGRAS DE TREINAMENTO
[v_ai_rules — todas as regras ativas]

## DADOS DO ATLETA
[body_metrics recente]
[fase atual + parâmetros]
[volume semanal por músculo]

## CALCULAR E RETORNAR (JSON):
{
  tdee: number,          // Total Daily Energy Expenditure
  target_calories: number,
  protein_g: number,
  carbs_g: number,
  fat_g: number,
  observations: string,  // situação atual e análise
  recommendations: string[], // lista de recomendações
  meal_plan: {
    meal_name: string,
    timing: string,
    description: string,
    calories_approx: number
  }[]
}
```

**Tabela `nutrition_plans` — campos:**
```
id SERIAL, generated_at TIMESTAMPTZ, phase_id INTEGER,
weight_at_generation DECIMAL, target_calories INTEGER,
protein_g INTEGER, carbs_g INTEGER, fat_g INTEGER,
observations TEXT, recommendations TEXT[], meal_plan JSONB,
model_used TEXT
```

**Critério de aceite:**
- [ ] Página exibe plano existente ou mensagem de "Gerar primeiro plano".
- [ ] Botão "Gerar Plano" / "Regenerar" chama a IA com contexto completo.
- [ ] Loading state durante a geração (skeleton ou spinner).
- [ ] Resultado salvo no banco para não chamar IA desnecessariamente.
- [ ] Macros exibidos com gráfico de pizza ou barras.
- [ ] Plano de refeições exibe horários e descrições.

---

## 8. Banco de Dados: Migrações (DB)

Todos os arquivos de migração ficam em `supabase/migrations/`. Execute no Supabase SQL Editor na ordem abaixo.

---

### DB-001 — Exercícios: `name_en` + `video_url`

**Arquivo:** `supabase/migrations/001_exercises_add_columns.sql`

```sql
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Índice para busca fuzzy em inglês
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm    ON exercises USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_exercises_name_en_trgm ON exercises USING gin(name_en gin_trgm_ops);

-- Popular name_en com os nomes já em inglês do CSV (eles já estão em inglês)
-- Os nomes do CSV são em inglês, então name = name_en para todos os exercícios do CSV:
UPDATE exercises SET name_en = name WHERE name_en IS NULL;
```

---

### DB-002 — Body Metrics: `wrist_cm` + `ankle_cm`

**Arquivo:** `supabase/migrations/002_body_metrics_add_columns.sql`

```sql
ALTER TABLE body_metrics
  ADD COLUMN IF NOT EXISTS wrist_cm  DECIMAL(5,1),
  ADD COLUMN IF NOT EXISTS ankle_cm  DECIMAL(5,1);
```

---

### DB-003 — Tabela `nutrition_plans`

**Arquivo:** `supabase/migrations/003_create_nutrition_plans.sql`

```sql
CREATE TABLE IF NOT EXISTS nutrition_plans (
  id                    SERIAL PRIMARY KEY,
  generated_at          TIMESTAMPTZ DEFAULT NOW(),
  phase_id              INTEGER REFERENCES training_phases(id),
  weight_at_generation  DECIMAL(5,2),
  target_calories       INTEGER,
  protein_g             INTEGER,
  carbs_g               INTEGER,
  fat_g                 INTEGER,
  observations          TEXT,
  recommendations       TEXT[],
  meal_plan             JSONB,
  model_used            TEXT DEFAULT 'claude-sonnet-4-6',
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE nutrition_plans DISABLE ROW LEVEL SECURITY;
```

---

### DB-004 — Seed de exercícios do CSV

**Arquivo:** `supabase/seed_exercises.sql`

Gerar INSERT statements a partir de `docs/treinos - Exercicios.csv`.

**Regras de geração:**
```sql
-- Inserir exercícios únicos (por ID):
INSERT INTO exercises (id, name, name_en, movement_pattern, classification, neural_demand)
VALUES
  (1, 'Bench Press', 'Bench Press', 'Empurrão Horizontal', 'Composto', 4),
  (2, 'Incline Bench Press', 'Incline Bench Press', 'Empurrão Horizontal', 'Composto', 4),
  -- ... todos os 117 exercícios
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  movement_pattern = EXCLUDED.movement_pattern,
  classification = EXCLUDED.classification,
  neural_demand = EXCLUDED.neural_demand;

-- Inserir mapeamentos de músculos:
INSERT INTO exercise_muscles (exercise_id, muscle_group, muscle, series_factor)
VALUES
  (1, 'Peitoral', 'Peitoral Maior', 1.0),
  (1, 'Ombros', 'Deltoide Anterior', 0.5),
  (1, 'Braços', 'Tríceps Braquial', 0.5),
  -- ... todos os 211 registros do CSV
ON CONFLICT (exercise_id, muscle) DO NOTHING;
```

> **Nota:** O CSV tem nomes em inglês — usar como `name` E `name_en`. Quando o sistema tiver traduções PT-BR, atualizar `name` para PT-BR e manter `name_en`.

---

### DB-005 — Atualizar `restore.sql` com novos schemas

Após todas as migrações serem testadas, atualizar `supabase/restore.sql` para incluir:
- As novas colunas de `exercises` e `body_metrics`.
- A tabela `nutrition_plans`.
- O índice `pg_trgm`.

---

## 9. Arquitetura de Persistência de Sessão de Treino

**Decisão:** Supabase como fonte de verdade + `localStorage` como cache de escrita rápida.

### Fluxo completo:

```
Usuário altera set
    │
    ▼
React state (imediato) ──────────────────────┐
    │                                         │
    ▼ debounce 800ms                         │
localStorage.setItem(                        │
  `wkt-${sessionId}`,                       │
  JSON.stringify({ sets, updatedAt })        │
)                                            │
    │                                        │
    ▼ após debounce                          │
upsertWorkoutSetAction({ ... })              │
    │                                        │
    ▼                                        │
Supabase workout_sets                        │
                                             │
Na abertura da tela: ◄──────────────────────┘
  1. fetch DB: getActiveSession(sessionId)
  2. fetch local: localStorage.getItem(...)
  3. merge: usar o mais recente por set (comparar updatedAt)
  4. setState(merged)
```

### Identificação de sessão ativa:
- O `sessionId` no localStorage vive enquanto a sessão não for concluída.
- Ao `completeWorkout`: limpar o item do localStorage.
- Ao navegar para `/workout/[id]`: sempre tentar recuperar estado.

### Tempo de treino:
```ts
// localStorage key: `wkt-timer-${sessionId}`
interface TimerState {
  startedAt: number    // Date.now() quando iniciou
  pausedAt: number | null
  totalPausedMs: number
}
// Ao calcular elapsed: Date.now() - startedAt - totalPausedMs
```

---

## 10. Checklist de Implementação

Use este checklist para rastrear o progresso. Marque cada item conforme concluído.

### Requisitos Transversais
- [] GEN-001: cursor pointer em todos os elementos acionáveis
- [x] GEN-002: `BackButton` component criado e aplicado em todas as telas
- [x] GEN-003: auditoria de usabilidade — todos os itens da tabela corrigidos

### Dashboard
- [x] DASH-001: `DayNav` component criado
- [x] DASH-001: `MiniCalendar` component criado com tooltip de músculos
- [x] DASH-001: layout Visão Geral com calendário na direita
- [x] DASH-001: clicar em treino no WorkoutCalendar navega para `/workout/[id]`
- [x] DASH-002: aba renomeada para "Resumo" com layout simétrico
- [x] DASH-002: `PhaseProgress`, `WeeklyStats`, `VolumeChart`, `MuscleVolumePanel` em grid

### Plan
- [x] PLAN-001: Programação Semanal no topo da aba Sessões
- [ ] PLAN-001: clicar em dia com sessão abre painel de detalhes
- [ ] PLAN-001: drag & drop instalado (`@dnd-kit`) e funcional
- [ ] PLAN-002: botões editar e deletar em `SessionPlanCard`
- [ ] PLAN-002: CRUD completo de sessões e exercícios planejados
- [ ] PLAN-003: CRUD completo de fases
- [ ] PLAN-003: botão "Replanejar com IA" funcional com preview
- [x] PLAN-004: ícones de grupo muscular no card de exercício
- [x] PLAN-004: link de vídeo YouTube embutido por exercício
- [x] PLAN-004: `seed_exercises.sql` gerado e testado

### Workout
- [x] WKT-001: layout duas colunas (próximos / concluídos)
- [x] WKT-002: `pg_trgm` ativado no Supabase
- [x] WKT-002: busca bilíngue e fuzzy funcional
- [ ] WKT-003: `WorkoutControls` component com iniciar/pausar/retomar/encerrar
- [ ] WKT-004: persistência via Supabase + localStorage merge
- [ ] WKT-004: timer persiste ao sair e voltar da página
- [ ] WKT-005: CRUD de séries e exercícios na tela de treino
- [ ] WKT-006: campo RIR com conversão automática RPE↔RIR
- [ ] WKT-006: popover de legenda de categorias
- [ ] WKT-007: bloco de marcas anteriores + tonelagem por exercício

### History
- [ ] HIST-001: aba reformulada — sem duplicação com Dashboard
- [ ] HIST-001: aba "Sessões" com cards detalhados
- [ ] HIST-001: aba "PRs" com tabela filtrável e sparklines
- [ ] HIST-001: aba "Análise Semanal" com picker de semana

### Medidas
- [x] MED-001: link "Medidas" adicionado ao navegador
- [x] MED-002: `app/measures/page.tsx` criado com formulário
- [x] MED-002: gráficos históricos funcionando
- [x] MED-003: análise de proporções (Steve Reeves) implementada
- [x] MED-003: LBM máximo natural calculado e exibido
- [x] MED-004: medidas integradas no contexto de IA
- [x] MED-005: CRUD completo (editar/excluir) com suporte a mudança de data

### Nutrição
- [x] NUT-001: link "Nutrição" adicionado ao navegador
- [x] NUT-002: `app/nutrition/page.tsx` criado
- [x] NUT-002: API Route `/api/ai/nutrition` criada com contexto completo
- [x] NUT-002: plano exibido com macros e refeições

### Banco de Dados
- [x] DB-001: colunas `name_en` e `video_url` na tabela `exercises`
- [x] DB-002: colunas `wrist_cm` e `ankle_cm` na tabela `body_metrics`
- [x] DB-003: tabela `nutrition_plans` criada
- [x] DB-004: `seed_exercises.sql` gerado e executado
- [x] DB-005: `restore.sql` atualizado com todos os schemas novos

### Migração de Dados CSV (MIG)
- [x] MIG-001: Server Action `migrateWorkoutCSVAction` em `app/admin/migrate/actions.ts`
- [x] MIG-001: página admin `/admin/migrate` com botão para executar migração idempotente
- [x] MIG-001: normalização de tipos ("Back-off Set" → "Back Off Set", "Warming Up" → "Warming Set")
- [ ] MIG-001: executar migração no Supabase (acessar `/admin/migrate` e clicar no botão)

### Segurança — UUIDs (SEC)
- [x] SEC-001: todos os PKs do schema verificados — usam UUID (`gen_random_uuid()`) via Prisma
- [x] SEC-001: nenhum SERIAL/integer PK exposto via API (tabelas: training_phases, exercises, planned_sessions, workout_sessions, workout_sets, body_metrics, nutrition_plans, athlete_profile, ai_coaching_rules, clinical_alerts, progress_photos)

### Visual Design — Cores Musculares (VIS)
- [x] VIS-001: sistema de cores semântico — push (rose/orange/amber), pull (blue/sky/indigo), lower push (violet/purple), lower pull (emerald/teal), core (lime)
- [x] VIS-001: `muscleGroupColors` atualizado em `lib/mock-data.ts`
- [x] VIS-001: consistência em todas as telas que usam muscle group badges

### Fotos de Progresso (PHO)
- [x] PHO-001: SQL de migração `supabase/migrations/20260423_progress_photos.sql`
- [x] PHO-001: modelo Prisma `ProgressPhoto` + `lib/db/photos.ts`
- [x] PHO-001: Server Actions em `app/measures/actions.ts` (get/save/delete)
- [x] PHO-001: componente `components/photo-section.tsx` na aba Medidas (upload + grid)
- [x] PHO-001: componente `components/photo-timeline.tsx` na aba Histórico (timeline + comparação)
- [ ] PHO-001: criar bucket `progress-photos` no Supabase Storage (manual, painel Supabase)
- [ ] PHO-001: executar SQL `supabase/migrations/20260423_progress_photos.sql` no Supabase

### Bug Fixes
- [x] FIX-001: objetivo principal na aba Histórico não persistia — `updateAthleteProfile` agora salva `goal` no banco

---

## Apêndice: Referências de Código Existente

| Necessidade | Onde buscar |
|-------------|-------------|
| Padrão de Server Action | `app/actions.ts` |
| Padrão de query raw (array) | `lib/db/coaching-rules.ts` |
| Padrão de DB query | `lib/db/sessions.ts` |
| GlassCard props | `components/glass-card.tsx` |
| Dialog com form | `app/admin/rules/rules-client.tsx` (RuleDialog) |
| AlertDialog | `app/admin/rules/rules-client.tsx` (delete confirm) |
| Framer Motion stagger | `app/history/page.tsx` |
| Tooltip (Radix) | `components/ui/tooltip.tsx` |
| Switch | `components/ui/switch.tsx` |
| Tabs | qualquer page.tsx |
| Metodologia de treino | `docs/METHODOLOGY.md` |
| Regras da IA | `SELECT * FROM v_ai_rules` |

---

## 11. Migração de Dados CSV (MIG)

### MIG-001 — Importar histórico de treinos do CSV para o Supabase

**Arquivo CSV:** `docs/treinos - Treinos.csv`

**Colunas do CSV:**
```
ID Sessao, Data, Exercício, Tipo de Série, # Serie, Carga (kg), Repetições, RIR, RPE, Volume (Tonelagem), Observações
```

**Estratégia:**
1. Agrupar linhas por `Data` → cada data única = uma `WorkoutSession`.
2. Para cada sessão: `INSERT INTO workout_sessions (date, notes) VALUES ($date, null)`.
3. Para cada linha: buscar `exercise_id` em `exercises` por `name = $exercício` (match case-insensitive).
4. Normalizar `Tipo de Série`:
   - `"Back-off Set"` → `"Back Off Set"`
   - `"Warming Up"` → `"Warming Set"`
   - demais: manter como está.
5. `INSERT INTO workout_sets (session_id, exercise_id, set_number, set_type, load_kg, reps, rir, rpe, notes)`.

**Datas no CSV:** 2026-04-07, 2026-04-10, 2026-04-11, 2026-04-13, 2026-04-15, 2026-04-16, 2026-04-18, 2026-04-20.

**Implementação:** Server Action `migrateCSVAction()` ou script SQL avulso em `supabase/migrations/mig_001_csv_treinos.sql`.

**Critério de aceite:**
- [ ] 8 sessões criadas em `workout_sessions`.
- [ ] Todos os sets do CSV criados em `workout_sets` com tipos normalizados.
- [ ] Exercícios sem match no banco logados como warning (não interrompem a migração).
- [ ] Script é idempotente (re-executar não duplica dados).

---

## 12. Segurança — UUIDs (SEC)

### SEC-001 — Garantir que todos os PKs expostos usam UUID

**Contexto:** O schema atual (após `prisma db pull`) já usa UUID (`gen_random_uuid()`) para todos os modelos principais. A PRD antiga referenciava `SERIAL PRIMARY KEY` em alguns specs — essas referências eram intenções futuras que o DB já implementou como UUID.

**Verificações a executar:**
1. Confirmar que nenhuma tabela relevante usa `SERIAL` / `BIGSERIAL` como PK.
2. Se houver tabelas com PKs integer não mapeadas no Prisma (ex: tabelas legadas ou views), documentar e migrar.
3. Garantir que `phase_id` em `nutrition_plans` usa `UUID` (já confirmado no schema).

**Tabelas já confirmadas com UUID:**
- `training_phases`, `exercises`, `exercise_muscles` (composite), `planned_sessions`, `planned_exercises`
- `workout_sessions`, `workout_sets`, `body_metrics`, `nutrition_plans`
- `athlete_profile`, `ai_coaching_rules`, `clinical_alerts`

**Ação necessária:** Verificar via `SELECT * FROM information_schema.columns WHERE column_name = 'id' AND data_type NOT IN ('uuid')` no Supabase SQL Editor. Se houver integer IDs, gerar migração com `ALTER TABLE ... ALTER COLUMN id TYPE UUID USING gen_random_uuid()` (requer recriação de FKs).

**Critério de aceite:**
- [ ] Nenhum endpoint da API retorna IDs numéricos sequenciais (previsíveis).
- [ ] Todas as tabelas acessadas pela app usam UUID como PK.

---

## 13. Cores de Grupos Musculares (VIS)

### VIS-001 — Sistema de cores semântico por função muscular

**Problema:** Cores atuais em `lib/mock-data.ts` usam variações do mesmo espectro (emerald/teal/cyan/sky), tornando difícil identificar grupos visualmente.

**Novo sistema — baseado em função muscular:**

| Grupo | Músculo | Cor Tailwind | Lógica |
|-------|---------|-------------|--------|
| Push horizontal | chest | `bg-rose-500` | Vermelho = push primário |
| Push extensão | triceps | `bg-orange-500` | Laranja = push assistência |
| Push overhead | shoulders | `bg-amber-500` | Âmbar = push vertical |
| Pull composto | back | `bg-blue-600` | Azul = pull primário |
| Pull isolado | biceps | `bg-sky-500` | Azul claro = pull isolado |
| Pull antebraço | forearms | `bg-indigo-500` | Índigo = estabilizadores |
| Lower push | quadriceps | `bg-violet-500` | Roxo = lower push |
| Lower hip hinge | glutes | `bg-purple-600` | Roxo escuro = extensão quadril |
| Lower pull | hamstrings | `bg-emerald-600` | Verde = posterior |
| Lower isolado | calves | `bg-teal-500` | Teal = panturrilha |
| Core | core | `bg-lime-600` | Lima = estabilização |

**Princípio visual:**
- Olhar para vermelho/laranja/âmbar → músculos de empurrão
- Olhar para azul/índigo → músculos de puxada
- Olhar para roxo/violeta → parte inferior anterior
- Olhar para verde/teal → parte inferior posterior
- Lima → core

**Implementação:**
- Atualizar `muscleGroupColors` em `lib/mock-data.ts`.
- Verificar uso em: `app/history/page.tsx`, `components/mini-calendar.tsx`, `components/workout-calendar.tsx`, `app/plan/page.tsx`.

**Critério de aceite:**
- [ ] Nenhum grupo tem a mesma cor de outro grupo funcionalmente distinto.
- [ ] Grupos do mesmo espectro (ex: chest/triceps/shoulders) são visivelmente relacionados mas distintos.
- [ ] Tags de grupos musculares no Histórico usam as novas cores.

---

## 14. Fotos de Progresso (PHO)

### PHO-001 — Registro de fotos de progresso corporal

**Objetivo:** O atleta pode registrar fotos de progresso periodicamente e visualizá-las em uma timeline interativa no Histórico.

#### Banco de Dados

```sql
-- supabase/migrations/mig_002_progress_photos.sql
CREATE TABLE IF NOT EXISTS progress_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE NOT NULL,
  storage_path TEXT NOT NULL,
  angle        TEXT DEFAULT 'Frente',  -- Frente | Costas | Lateral | Outro
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Bucket Storage: 'progress-photos' (configurar no painel Supabase)
-- Policy: public read, sem autenticação por enquanto (app single-user)
```

**Prisma Schema (adicionar ao `prisma/schema.prisma`):**
```prisma
model ProgressPhoto {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date         DateTime @db.Date
  storage_path String
  angle        String   @default("Frente")
  notes        String?
  created_at   DateTime @default(now()) @db.Timestamptz(6)

  @@map("progress_photos")
}
```

#### Upload na aba Medidas

**Arquivo:** `app/measures/measures-client.tsx`

**UI:** Seção "Fotos de Progresso" no final da página:
```
┌─────────────────────────────────────────────┐
│  📸 Fotos de Progresso          [+ Adicionar]│
├────────┬────────┬────────┬──────────────────┤
│ Frente │ Costas │ Lateral│ Mais recentes... │
└────────┴────────┴────────┴──────────────────┘
```

**Componente de upload:**
- Input `type="file"` accept="image/*" (captura câmera em mobile).
- Preview da imagem antes de enviar.
- Select de ângulo: Frente, Costas, Lateral, Outro.
- Campo de data (default = hoje).
- Campo de notas (opcional).
- Upload para Supabase Storage via `supabase.storage.from('progress-photos').upload(path, file)`.
- Salvar registro em `progress_photos` via Server Action.

**Server Actions** (`app/measures/actions.ts`):
```ts
uploadProgressPhotoAction(formData: FormData): Promise<ProgressPhoto>
getProgressPhotosAction(limit?: number): Promise<ProgressPhoto[]>
deleteProgressPhotoAction(id: string): Promise<void>
```

#### Timeline no Histórico

**Arquivo:** `app/history/page.tsx`

**UI:** Nova seção "Linha do Tempo de Progresso" no topo da página (acima do card Perfil do Atleta):

```
┌─────────────────────────────────────────────────┐
│  Linha do Tempo de Progresso                     │
│  ◄ ──────────────────────────────────── ►       │
│  [Apr 7] [Apr 13] [Apr 20] [Hoje]               │
│  ┌──────┬──────┬──────┐                         │
│  │Frente│Costas│Lateral│                        │
│  │ foto │ foto │ foto │                          │
│  └──────┴──────┴──────┘                         │
│  Data: 20 de Abr · Nota: Após 2 semanas          │
└─────────────────────────────────────────────────┘
```

**Comportamento:**
- Scroll horizontal de checkpoints de data.
- Ao selecionar uma data: exibe todas as fotos daquela sessão agrupadas por ângulo.
- Clicar em uma foto: abre lightbox (Dialog) com a foto em tamanho grande.
- Modo comparação: selecionar dois checkpoints → exibe fotos lado a lado (grid 2 colunas, mesmos ângulos emparelhados).

**Critério de aceite:**
- [ ] Upload de foto salva no Storage e registra na tabela `progress_photos`.
- [ ] Fotos aparecem na timeline do Histórico agrupadas por data.
- [ ] Lightbox abre foto em tamanho grande ao clicar.
- [ ] Modo comparação lado a lado funcional para duas datas selecionadas.
- [ ] Deletar foto remove do Storage e do banco.
