'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, BookOpen, Search, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { CoachingRule, CreateRuleInput } from '@/lib/db/coaching-rules'
import { createRuleAction, updateRuleAction, toggleRuleAction, deleteRuleAction, resetRulesToDefaultAction } from './actions'

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'periodization',     label: 'Periodização',     color: 'bg-purple-500/15 text-purple-300 border-purple-500/25' },
  { value: 'triggers',          label: 'Gatilhos',         color: 'bg-red-500/15 text-red-300 border-red-500/25' },
  { value: 'volume',            label: 'Volume',           color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  { value: 'progression',       label: 'Progressão',       color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  { value: 'recovery',          label: 'Recuperação',      color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  { value: 'frequency',         label: 'Frequência',       color: 'bg-orange-500/15 text-orange-300 border-orange-500/25' },
  { value: 'technique',         label: 'Técnica',          color: 'bg-pink-500/15 text-pink-300 border-pink-500/25' },
  { value: 'weak_points',       label: 'Pontos Fracos',    color: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25' },
  { value: 'nutrition_context', label: 'Nutrição',         color: 'bg-teal-500/15 text-teal-300 border-teal-500/25' },
  { value: 'experience_level',  label: 'Nível/Experiência', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25' },
  { value: 'personal',          label: 'Pessoal',          color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25' },
]

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]))

function priorityColor(p: number) {
  if (p >= 9) return 'text-red-400'
  if (p >= 7) return 'text-amber-400'
  if (p >= 4) return 'text-blue-400'
  return 'text-muted-foreground'
}

function priorityLabel(p: number) {
  if (p >= 9) return 'Crítico'
  if (p >= 7) return 'Importante'
  if (p >= 4) return 'Diretriz'
  return 'Sugestão'
}

// ── Default form state ────────────────────────────────────────────────────────

interface FormState {
  category: string
  title: string
  rule: string
  source: string
  priority: number
  tags: string
  is_active: boolean
  notes: string
}

const EMPTY_FORM: FormState = {
  category: 'volume',
  title: '',
  rule: '',
  source: 'Jayme de Lamadrid — Musculação para Naturais',
  priority: 5,
  tags: '',
  is_active: true,
  notes: '',
}

function ruleToForm(r: CoachingRule): FormState {
  return {
    category: r.category,
    title: r.title,
    rule: r.rule,
    source: r.source ?? '',
    priority: r.priority,
    tags: (r.tags ?? []).join(', '),
    is_active: r.is_active,
    notes: r.notes ?? '',
  }
}

function formToInput(f: FormState): CreateRuleInput {
  return {
    category: f.category,
    title: f.title.trim(),
    rule: f.rule.trim(),
    source: f.source.trim() || 'Pesquisa pessoal',
    priority: f.priority,
    tags: f.tags.split(',').map(t => t.trim()).filter(Boolean),
    is_active: f.is_active,
    notes: f.notes.trim() || null,
  }
}

// ── Rule Card ─────────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  onEdit,
  onDelete,
  onToggle,
  isPending,
}: {
  rule: CoachingRule
  onEdit: (r: CoachingRule) => void
  onDelete: (r: CoachingRule) => void
  onToggle: (r: CoachingRule) => void
  isPending: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const cat = CATEGORY_MAP[rule.category]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'glass rounded-xl p-4 border border-white/5 transition-opacity',
        !rule.is_active && 'opacity-40'
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Category + title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {cat && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded border', cat.color)}>
                {cat.label}
              </span>
            )}
            <span className={cn('text-[10px] font-mono font-bold', priorityColor(rule.priority))}>
              P{rule.priority} · {priorityLabel(rule.priority)}
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug">{rule.title}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={rule.is_active}
            onCheckedChange={() => onToggle(rule)}
            disabled={isPending}
            className="data-[state=checked]:bg-primary"
          />
          <Button
            size="icon"
            variant="ghost"
            className="w-7 h-7 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(rule)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="w-7 h-7 text-muted-foreground hover:text-red-400"
            onClick={() => onDelete(rule)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Rule text (collapsible) */}
      <div className="mt-2">
        <p className={cn('text-xs text-muted-foreground leading-relaxed', !expanded && 'line-clamp-2')}>
          {rule.rule}
        </p>
        {rule.rule.length > 140 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary mt-1 transition-colors"
          >
            {expanded ? <><ChevronUp className="w-3 h-3" /> Recolher</> : <><ChevronDown className="w-3 h-3" /> Ver completo</>}
          </button>
        )}
      </div>

      {/* Notes (if any) */}
      {rule.notes && (
        <p className="mt-2 text-[11px] text-amber-300/70 italic leading-snug">{rule.notes}</p>
      )}

      {/* Tags + source */}
      {((rule.tags?.length ?? 0) > 0 || rule.source) && (
        <div className="flex items-center gap-2 flex-wrap mt-3 pt-2 border-t border-white/5">
          {rule.tags?.map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">
              {tag}
            </span>
          ))}
          {rule.source && (
            <span className="text-[10px] text-muted-foreground/50 ml-auto shrink-0 truncate max-w-[180px]">
              {rule.source}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ── Rule Dialog (Add / Edit) ──────────────────────────────────────────────────

function RuleDialog({
  open,
  rule,
  onClose,
  onSave,
  isPending,
}: {
  open: boolean
  rule: CoachingRule | null
  onClose: () => void
  onSave: (f: FormState) => void
  isPending: boolean
}) {
  const [form, setForm] = useState<FormState>(rule ? ruleToForm(rule) : EMPTY_FORM)

  // Sync form when rule changes (open different rule)
  useEffect(() => {
    setForm(rule ? ruleToForm(rule) : EMPTY_FORM)
  }, [rule])

  const set = (key: keyof FormState) => (value: string | number | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const valid = form.category && form.title.trim() && form.rule.trim()

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Category + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={set('category')}>
                <SelectTrigger className="glass border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value} className="text-sm">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Prioridade: <span className={cn('font-bold', priorityColor(form.priority))}>
                  {form.priority} · {priorityLabel(form.priority)}
                </span>
              </Label>
              <div className="flex items-center gap-3 h-9">
                <span className="text-xs text-muted-foreground">1</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.priority}
                  onChange={e => set('priority')(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <span className="text-xs text-muted-foreground">10</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">Título</Label>
            <Input
              value={form.title}
              onChange={e => set('title')(e.target.value)}
              placeholder="Nome curto e descritivo da regra"
              className="glass border-white/10 text-sm"
            />
          </div>

          {/* Rule text */}
          <div className="space-y-1.5">
            <Label className="text-xs">Regra / Princípio</Label>
            <Textarea
              value={form.rule}
              onChange={e => set('rule')(e.target.value)}
              placeholder="Descreva a regra completa em linguagem natural. Seja específico — este texto é o que a IA irá ler e aplicar."
              className="glass border-white/10 text-sm min-h-[120px] resize-y"
            />
          </div>

          {/* Tags + Source row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tags <span className="text-muted-foreground">(separadas por vírgula)</span></Label>
              <Input
                value={form.tags}
                onChange={e => set('tags')(e.target.value)}
                placeholder="compound, acumulação, quadríceps"
                className="glass border-white/10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Fonte</Label>
              <Input
                value={form.source}
                onChange={e => set('source')(e.target.value)}
                placeholder="Livro, artigo, pesquisa pessoal..."
                className="glass border-white/10 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notas pessoais <span className="text-muted-foreground">(opcional)</span></Label>
            <Textarea
              value={form.notes}
              onChange={e => set('notes')(e.target.value)}
              placeholder="Exceções descobertas na prática, contexto adicional..."
              className="glass border-white/10 text-sm min-h-[72px] resize-y"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 pt-1">
            <Switch
              checked={form.is_active}
              onCheckedChange={v => set('is_active')(v)}
              className="data-[state=checked]:bg-primary"
            />
            <Label className="text-xs cursor-pointer" onClick={() => set('is_active')(!form.is_active)}>
              {form.is_active ? 'Regra ativa — a IA irá usar' : 'Regra inativa — ignorada pela IA'}
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isPending} className="text-sm">
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!valid || isPending}
            className="text-sm"
          >
            {isPending ? 'Salvando...' : 'Salvar Regra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function RulesClient({ initialRules }: { initialRules: CoachingRule[] }) {
  const [rules, setRules] = useState<CoachingRule[]>(initialRules)
  const [activeCategory, setActiveCategory] = useState('todas')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CoachingRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<CoachingRule | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return rules.filter(r => {
      const matchCat = activeCategory === 'todas' || r.category === activeCategory
      const matchSearch = !q || r.title.toLowerCase().includes(q) || r.rule.toLowerCase().includes(q) || (r.tags ?? []).some(t => t.toLowerCase().includes(q))
      return matchCat && matchSearch
    })
  }, [rules, activeCategory, search])

  const counts = useMemo(() => {
    const map: Record<string, number> = { todas: rules.length }
    for (const r of rules) map[r.category] = (map[r.category] ?? 0) + 1
    return map
  }, [rules])

  const activeCount = filtered.filter(r => r.is_active).length

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openAdd() {
    setEditingRule(null)
    setDialogOpen(true)
  }

  function openEdit(rule: CoachingRule) {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  function closeDialog() {
    setDialogOpen(false)
    setEditingRule(null)
  }

  function handleSave(form: FormState) {
    const input = formToInput(form)
    startTransition(async () => {
      if (editingRule) {
        const updated = await updateRuleAction({ ...input, id: editingRule.id })
        if (updated) setRules(prev => prev.map(r => r.id === updated.id ? updated : r))
      } else {
        const created = await createRuleAction(input)
        if (created) setRules(prev => [created, ...prev])
      }
      closeDialog()
    })
  }

  function handleToggle(rule: CoachingRule) {
    const next = !rule.is_active
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: next } : r))
    startTransition(async () => {
      const ok = await toggleRuleAction(rule.id, next)
      if (!ok) setRules(prev => prev.map(r => r.id === rule.id ? { ...r, is_active: rule.is_active } : r))
    })
  }

  function handleDelete() {
    if (!deletingRule) return
    const id = deletingRule.id
    setDeletingRule(null)
    setRules(prev => prev.filter(r => r.id !== id))
    startTransition(async () => {
      const ok = await deleteRuleAction(id)
      if (!ok) setRules(prev => {
        if (prev.find(r => r.id === id)) return prev
        return prev
      })
    })
  }

  function handleReset() {
    setResetConfirmOpen(false)
    startTransition(async () => {
      const result = await resetRulesToDefaultAction()
      if (result) {
        // Reload page to reflect fresh rules from DB
        window.location.reload()
      }
    })
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">Base de Conhecimento da IA</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {rules.length} regras · {activeCount} ativas na view atual
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setResetConfirmOpen(true)}
            disabled={isPending}
            className="border-white/10 text-muted-foreground hover:text-amber-400 hover:border-amber-400/30"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Restaurar Padrões
          </Button>
          <Button onClick={openAdd} size="sm" className="shrink-0">
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título, conteúdo ou tag..."
          className="glass border-white/10 pl-9 text-sm"
        />
      </div>

      {/* Category tabs — scrollable with fade indicator */}
      <div className="relative mb-4">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory('todas')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
            activeCategory === 'todas'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/10'
          )}
        >
          Todas {counts.todas ? `(${counts.todas})` : ''}
        </button>
        {CATEGORIES.map(cat => {
          const count = counts[cat.value] ?? 0
          if (count === 0) return null
          const isActive = activeCategory === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                isActive
                  ? cn('border', cat.color)
                  : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/10'
              )}
            >
              {cat.label} ({count})
            </button>
          )
        })}
        </div>
        {/* Right fade — signals more scrollable content */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-background to-transparent" />
      </div>

      {/* Rules list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground text-sm"
            >
              {search ? 'Nenhuma regra encontrada para esta busca.' : 'Nenhuma regra nesta categoria.'}
            </motion.div>
          ) : (
            filtered.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onEdit={openEdit}
                onDelete={setDeletingRule}
                onToggle={handleToggle}
                isPending={isPending}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Add / Edit Dialog */}
      <RuleDialog
        open={dialogOpen}
        rule={editingRule}
        onClose={closeDialog}
        onSave={handleSave}
        isPending={isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRule} onOpenChange={v => !v && setDeletingRule(null)}>
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar regra?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deletingRule?.title}&rdquo; será removida permanentemente da base de conhecimento.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500/80 hover:bg-red-500 text-white border-0"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset to Defaults Confirmation */}
      <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar todas as regras para o padrão?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Esta ação irá <strong>apagar todas as regras atuais</strong> (incluindo qualquer customização pessoal)
                e reinstalar as <strong>regras padrão do Método Lamadrid</strong>.
              </span>
              <span className="block text-amber-400/80">
                Regras pessoais adicionadas por você serão perdidas. Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass border-white/10" disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isPending}
              className="bg-amber-500/80 hover:bg-amber-500 text-white border-0"
            >
              {isPending ? 'Restaurando...' : 'Sim, restaurar padrões'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
