'use server'

import { createRule, updateRule, toggleRule, deleteRule } from '@/lib/db/coaching-rules'
import type { CreateRuleInput, UpdateRuleInput } from '@/lib/db/coaching-rules'

export async function createRuleAction(input: CreateRuleInput) {
  try {
    return await createRule(input)
  } catch (e) {
    console.error('[createRuleAction]', e)
    return null
  }
}

export async function updateRuleAction(input: UpdateRuleInput) {
  try {
    return await updateRule(input)
  } catch (e) {
    console.error('[updateRuleAction]', e)
    return null
  }
}

export async function toggleRuleAction(id: number, is_active: boolean) {
  try {
    await toggleRule(id, is_active)
    return true
  } catch (e) {
    console.error('[toggleRuleAction]', e)
    return false
  }
}

export async function deleteRuleAction(id: number) {
  try {
    await deleteRule(id)
    return true
  } catch (e) {
    console.error('[deleteRuleAction]', e)
    return false
  }
}
