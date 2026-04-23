# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # Start dev server at localhost:3000
pnpm build          # Production build
pnpm lint           # Run ESLint
pnpm db:generate    # Regenerate Prisma client after schema changes
pnpm db:push        # Push schema to DB without migration file (dev only)
pnpm db:migrate     # Apply pending migrations (production)
pnpm db:studio      # Open Prisma Studio
```

## 🛑 AI SAFETY & DATABASE GOVERNANCE

- **CRITICAL**: NEVER run `npx prisma db push` or `pnpm db:push` without explicit user permission. This command can be destructive to non-Prisma managed objects (views, triggers).
- **PREFERRED WORKFLOW**: Always use `npx prisma migrate dev --create-only` for schema changes. This generates a SQL file for review before any execution.
- **PROTECTION**: The database has a `SERIAL` integer identity system and custom `VIEW`s. Any schema change must preserve these structures.
- **ALERTS**: If a task requires database manipulation, clearly alert the user and ask for permission before proceeding with any modifying command.

No test suite is configured.

## Methodology

The app follows **Jayme de Lamadrid's block periodization** from *Musculação para Naturais*. All business rules live in `lib/periodization.ts`. Full technical spec: `docs/METHODOLOGY.md`. Summary spec: `docs/PRD.md`. Key rules:

- **Volume** counts only `Working Set / Top Set / Back Off Set` with RPE ≥ 7
- **Compound exercises**: primary muscle = 100% of sets counted (`series_factor 1.0`), secondary = 50% (`0.5`)
- **Isolation exercises**: primary muscle only = 100%
- **Push movements**: secondary shoulder volume → Deltóide Anterior; **Pull** → Deltóide Posterior
- **MRV** = 20 sets/week per muscle group (danger zone). MEV = 10 sets/week.
- **Progression priority**: 1. Reps → 2. Weight → 3. Volume (double progression)
- **Rest time** is inversely proportional to reps (table in `lib/periodization.ts:getRestTimeRange`)
- **Training frequency**: 3–4 days/week base. +1 day only at Hipertrofia Pico Meso 2

## AI Knowledge Base

The `ai_coaching_rules` table (Supabase) is the dynamic rule store for the AI planner. The athlete adds/updates rules manually via Supabase Table Editor. The view `v_ai_rules` returns all active rules ordered by priority. The AI **must always** cross-reference `v_ai_rules` + `v_ai_context` + `v_exercise_progress` + `body_metrics` before prescribing any session. Full integration spec: `docs/METHODOLOGY.md` section 12.

SQL to create the table + initial seed: `supabase/add_knowledge_base.sql`.

## Database Setup (Supabase + Prisma 7)

Copy `.env.example` → `.env.local` and fill in both connection strings:

- `DATABASE_URL` — pooler URL (port 6543, pgbouncer) — used by `PrismaClient` at runtime
- `DIRECT_URL` — direct URL (port 5432) — used by Prisma Migrate via `prisma.config.ts`

**Prisma 7**: connection URLs are NOT in `prisma/schema.prisma`. They live in `prisma.config.ts` (migrate) and are passed to `PrismaPg` adapter in `lib/prisma.ts` (runtime). After any schema change: `pnpm db:generate`.

**Deployment (Vercel)**: The `package.json` includes `postinstall: prisma generate` and `build: prisma generate && next build` to ensure the client is available in the serverless environment. Ensure `DATABASE_URL` and `DIRECT_URL` are set in Vercel project settings.

## Architecture

**Antigravity** is a Next.js 16 (App Router) workout tracking app. The UI is fully built; the DB layer (`lib/db/`) is ready but not yet wired into the UI — the app still runs on mock data + localStorage.

### State Management

`lib/workout-context.tsx` (`WorkoutProvider`) wraps the entire app. On first load it calls `generateInitialSessions()` from `lib/mock-data.ts` (4-day Upper/Lower split, Acumulação 1 as current phase), syncs to/from `localStorage` under key `antigravity-sessions-v2`.

### Key Files

| File | Purpose |
|---|---|
| `lib/periodization.ts` | All methodology business logic: rest time, volume calculation, progression status, phase transition triggers |
| `lib/mock-data.ts` | Full 12-phase macrocycle, 4-day training split, exercise muscle mappings with `series_factor` |
| `lib/types.ts` | TypeScript types: `SetCategory`, `SetTechnique`, `PhaseType`, `ProgressionStatus`, `PhaseTransitionTrigger` |
| `lib/prisma.ts` | Singleton `PrismaClient` with `PrismaPg` adapter |
| `lib/db/exercises.ts` | `getExercises`, `getExerciseById` |
| `lib/db/phases.ts` | `getCurrentPhase`, `getAllPhases`, `getPlannedSessionsByPhase` |
| `lib/db/sessions.ts` | `getWorkoutSessionsInRange`, `upsertWorkoutSet`, `getProgressionForExercise` |
| `lib/db/volume.ts` | `getWeeklyVolumeByMuscle` (series_factor weighted), `getSessionTonnages`, `getLastTwoSessionTonnages` |

### Data Model

```
TrainingPhase (etapa 1|2, phase_type, meso_number, technique_focus)
  └─ PlannedSession → PlannedExercise → Exercise → ExerciseMuscle (series_factor)

WorkoutSession
  └─ WorkoutSet (set_category, set_technique, load_kg, reps, rpe, rir, tonnage, one_rm_epley)
```

### Routes

| Route | Purpose |
|---|---|
| `/` | Dashboard (calendar, volume by muscle, progressions) |
| `/workout` | Session list |
| `/workout/[id]` | Live workout player |
| `/plan` | Phase and session management |
| `/history` | Completed sessions, PRs, charts |

### UI Conventions

- **GlassCard** (`components/glass-card.tsx`) is the primary container — use for all card surfaces
- Tailwind CSS 4 + CSS variables. Glassmorphism via `backdrop-blur` + semi-transparent bg
- Framer Motion: staggered `delay` props pattern throughout
- Icons: `lucide-react`. Charts: `recharts`. Toasts: `sonner`
- shadcn/ui in `components/ui/` (style: `new-york`, base: `neutral`)
- Path alias `@/*` = repo root

### Config Notes

- `next.config.mjs`: `ignoreBuildErrors: true` and image optimization disabled — temporary
- `tsconfig.json`: ES6 target, strict mode
