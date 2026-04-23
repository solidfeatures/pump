import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export interface CoachingRule {
  id: string
  category: string
  title: string
  rule: string
  source: string | null
  priority: number
  tags: string[] | null
  is_active: boolean
  notes: string | null
  created_at: Date
  updated_at: Date
}

export interface CreateRuleInput {
  category: string
  title: string
  rule: string
  source?: string
  priority?: number
  tags?: string[]
  is_active?: boolean
  notes?: string | null
}

export interface UpdateRuleInput extends CreateRuleInput {
  id: string
}

function tagsToSql(tags: string[]): Prisma.Sql {
  if (tags.length === 0) return Prisma.sql`NULL`
  const escaped = tags.map(t => `'${t.replace(/'/g, "''")}'`).join(', ')
  return Prisma.raw(`ARRAY[${escaped}]::TEXT[]`)
}

export async function getAllRules(): Promise<CoachingRule[]> {
  return prisma.$queryRaw<CoachingRule[]>`
    SELECT id, category, title, rule, source, priority, tags, is_active, notes, created_at, updated_at
    FROM ai_coaching_rules
    ORDER BY priority DESC, category, id
  `
}

export async function createRule(input: CreateRuleInput): Promise<CoachingRule> {
  const tags = tagsToSql(input.tags ?? [])
  const rows = await prisma.$queryRaw<CoachingRule[]>`
    INSERT INTO ai_coaching_rules (category, title, rule, source, priority, tags, is_active, notes)
    VALUES (
      ${input.category},
      ${input.title},
      ${input.rule},
      ${input.source ?? 'Pesquisa pessoal'},
      ${input.priority ?? 5},
      ${tags},
      ${input.is_active ?? true},
      ${input.notes ?? null}
    )
    RETURNING id, category, title, rule, source, priority, tags, is_active, notes, created_at, updated_at
  `
  return rows[0]
}

export async function updateRule(input: UpdateRuleInput): Promise<CoachingRule> {
  const tags = tagsToSql(input.tags ?? [])
  const rows = await prisma.$queryRaw<CoachingRule[]>`
    UPDATE ai_coaching_rules
    SET
      category   = ${input.category},
      title      = ${input.title},
      rule       = ${input.rule},
      source     = ${input.source ?? 'Pesquisa pessoal'},
      priority   = ${input.priority ?? 5},
      tags       = ${tags},
      is_active  = ${input.is_active ?? true},
      notes      = ${input.notes ?? null},
      updated_at = NOW()
    WHERE id = ${input.id}
    RETURNING id, category, title, rule, source, priority, tags, is_active, notes, created_at, updated_at
  `
  return rows[0]
}

export async function toggleRule(id: string, is_active: boolean): Promise<void> {
  await prisma.$executeRaw`
    UPDATE ai_coaching_rules SET is_active = ${is_active}, updated_at = NOW() WHERE id = ${id}
  `
}

export async function deleteRule(id: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM ai_coaching_rules WHERE id = ${id}`
}
