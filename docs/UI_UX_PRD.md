# PRD — Plano de Melhorias UI/UX · Antigravity Fitness

**Origem:** Relatório de análise UI/UX (abril 2026)  
**Status:** Em andamento

---

## Critérios de Prioridade

| Tier | Critério |
|---|---|
| P0 | Bug que quebra funcionalidade central |
| P1 | Problema de usabilidade severo (impede fluxo) |
| P2 | Problema de usabilidade moderado (atrapalha, mas não bloqueia) |
| P3 | Melhoria visual / polimento |

---

## Checklist de Implementação

### P0 — Bugs Críticos

- [ ] **B1** · Plan → Semana: sessões mostram "0 exercícios" — exercise matching case-insensitive + template-first (AI route)  
- [ ] **B2** · Plan → "Distribuição de Volume" mostra "Nenhum plano configurado" mesmo com plano ativo  
- [x] **B3** · History → Aba "Treinos": apenas 2 de 8 itens visíveis (overflow/render bug)  
- [x] **B4** · Home "Esta Semana": conteúdo aparece abaixo do viewport sem indicador de scroll  
- [x] **B5** · Workout → accordion "Últimos Treinos" expande para fora do viewport sem auto-scroll  

### P1 — Usabilidade Severa

- [x] **U1** · Responsividade mobile: sidebar fixa colapsa layout em 375px — hamburger menu + single-column layout  
- [x] **U2** · Idioma inconsistente: `FRIDAY`, menu items em inglês, `STREAK`, `BODY FAT`, `Split` — padronizar para português  
- [x] **U3** · Workout player: título da sessão ausente no header — mostrar nome da sessão  
- [x] **U4** · Home "Hoje" dia de descanso: não mostra próximo treino programado nem atalho para o plano  
- [x] **U5** · Nutrition: texto invisível durante carregamento (branco sobre branco) — adicionar skeleton loader  

### P2 — Usabilidade Moderada

- [x] **U6** · Termos técnicos sem explicação (MEV, MRV, RIR, RPE, mesociclo): adicionar tooltips contextuais  
- [x] **U7** · Menu "AI Base" sem subtítulo ou ícone claro — adicionar descrição "Base de Conhecimento da IA"  
- [x] **U8** · Nutrition: identidade visual neon/gamer destoa do design system — alinhar ao glassmorphism do app  
- [x] **U9** · Workout list: cards sem nome de sessão — exibir nome (ex.: "Upper A", "Lower B")  
- [x] **U10** · Profile: `<title>` da aba do browser mostra URL em vez do nome da app  
- [ ] **U11** · Sidebar: indicador de fase coberto pelo avatar do usuário — reposicionar  
- [x] **U12** · AI Base: categorias de filtro cortadas horizontalmente — scroll indicator ou wrap  

### P3 — Polimento Visual

- [x] **V1** · Sistema tipográfico: padronizar escala (headings, labels, captions, units)  
- [x] **V2** · Sistema de botões: CTA primário único (verde existente) — remover botão escuro da Nutrition  
- [x] **V3** · Contraste da tag "CRESCER SECO" e badges de cores claras — atingir WCAG AA  
- [x] **V4** · Hierarquia inconsistente de ALL CAPS vs. title case nos labels  
- [x] **V5** · Skeleton loaders genéricos para todas as telas com fetch async  

---

## Escopo Detalhado por Item

### B1 · Sessões "0 exercícios" no Plan
**Causa raiz:** Exercise name matching no AI route usava `findMany({ name: { in: [...] } })` — case-sensitive, sem fallback. Nomes ligeiramente divergentes são silenciosamente ignorados.  
**Solução:** Template-first lookup (nomes exatos que a IA recebeu) + fallback `{ equals: name, mode: 'insensitive' }`. Prompt reforçado para usar nomes exatos dos templates.  
**Status:** Implementado em `app/api/ai/weekly-plan/route.ts`.

### B2 · "Distribuição de Volume" vazia
**Causa raiz:** `getPlannedSessionsByPhase` carregava TODAS as `PlannedSession` (templates + instâncias AI), incluindo sessões com `exercises: []`. O componente de volume tenta calcular sobre `activePlannedEx` que fica vazio se as sessões AI não tiverem exercícios.  
**Solução:** Filtrar para `is_template: true` em `getPlannedSessionsByPhase` (já implementado). Verificar componente `MuscleVolumePanel`/`VolumeChart` para garantir que calcula sobre template exercises.

### B3 · History "Treinos" mostra apenas 2 de 8
**Causa raiz:** A ser investigado — provável `max-height` fixo ou `overflow: hidden` no container pai.  
**Solução:** Inspecionar estilos do `TabsContent` e do container da lista.

### B4 · "Esta Semana" abaixo do viewport
**Causa raiz:** O `TabsContent` monta com `opacity: 0` (animação Framer Motion) e os componentes internos têm `margin-top` que empurra o conteúdo para baixo do `TabsList`.  
**Solução:** Adicionar `scroll-mt` ou scroll automático ao mudar de aba; ou garantir que o primeiro card visível seja renderizado no topo do `TabsContent`.

### B5 · Accordion "Últimos Treinos" fora do viewport
**Causa raiz:** A expansão não dispara `scrollIntoView`.  
**Solução:** `useRef` no accordion + `ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })` após expandir.

### U1 · Responsividade Mobile
**Abordagem:**
- Sidebar: visível apenas em `md:` (≥768px). Em mobile: `fixed bottom-0` tab bar com 5 ícones principais.
- Layout: `md:pl-64` para conteúdo já está no `main`; remover o padding em mobile.
- Cards: `grid-cols-1` em mobile, `sm:grid-cols-2`, `md:grid-cols-4` progressivo.
- Navigation component: hamburger + drawer em mobile.

### U2 · Idioma
**Abordagem:**
- Substituir `STREAK` → `SEQUÊNCIA`, `BODY FAT` → `GORDURA CORPORAL`, `FRIDAY` → nome do dia em ptBR via `date-fns/ptBR` (já importado — verificar se locale está sendo aplicado corretamente).
- Menu lateral: `Plan` → `Plano`, `Workout` → `Treino`, `History` → `Histórico`, `Measures` → `Medidas`, `Nutrition` → `Nutrição`, `Profile` → `Perfil`.
- `Split` → `Divisão de treino` ou manter como termo técnico com tooltip.

### U3 · Título da sessão no Workout player
**Solução:** No header do `app/workout/[id]/page.tsx`, exibir `session.name` antes das métricas.

### U4 · Próximo treino no dia de descanso
**Solução:** Na Home, quando `todayWorkout` é nulo, buscar o próximo `session` futuro com status `pending` e exibir um card secundário "Próximo treino: [nome] — [dia]".

### U8 · Nutrition visual
**Solução:** Substituir tipografia neon/gamer pelo padrão `GlassCard` + `GlassCardTitle`. Remover gradientes coloridos do título. Manter conteúdo, apenas alinhar estilo.

---

## Ordem de Implementação

```
Sprint 1 (agora): B3, B4, B5, U2, U3 — bugs visuais rápidos
Sprint 2:         U1 (mobile) — maior esforço estrutural
Sprint 3:         U4, U5, U8, U9 — melhorias de fluxo
Sprint 4:         U6, U7, U10, U11, U12 — polish
Sprint 5:         V1–V5 — design system
```
