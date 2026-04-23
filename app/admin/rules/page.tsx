import { getAllRules } from '@/lib/db/coaching-rules'
import { RulesClient } from './rules-client'

export const dynamic = 'force-dynamic'

export default async function AdminRulesPage() {
  const rules = await getAllRules().catch(() => [])
  return (
    <div className="min-h-screen p-4 md:p-8">
      <RulesClient initialRules={rules} />
    </div>
  )
}
