'use client'

import { useState, useRef, useEffect } from 'react'
import { Palette, X, Moon, Sun, Sword } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/lib/preferences-context'
import type { Theme, Locale } from '@/lib/i18n'

const THEMES: { value: Theme; icon: React.ElementType; label: string; desc: string; preview: string[] }[] = [
  {
    value: 'dark',
    icon: Moon,
    label: 'Escuro',
    desc: 'Glassmorphism',
    preview: ['bg-zinc-900', 'bg-emerald-500', 'bg-zinc-700'],
  },
  {
    value: 'light',
    icon: Sun,
    label: 'Claro',
    desc: 'Minimalista',
    preview: ['bg-gray-100', 'bg-emerald-600', 'bg-gray-300'],
  },
  {
    value: 'rpg',
    icon: Sword,
    label: 'Épico',
    desc: 'Gamificado',
    preview: ['bg-amber-950', 'bg-amber-400', 'bg-amber-800'],
  },
]

const LANGS: { value: Locale; flag: string; label: string }[] = [
  { value: 'pt', flag: '🇧🇷', label: 'PT' },
  { value: 'en', flag: '🇺🇸', label: 'EN' },
  { value: 'es', flag: '🇪🇸', label: 'ES' },
]

interface PreferencesPanelProps {
  /** Rendered inside the sidebar — triggers are injected by Navigation */
  inline?: boolean
}

export function PreferencesPanel({ inline }: PreferencesPanelProps) {
  const { theme, setTheme, locale, setLocale, t } = usePreferences()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync translated labels for themes after locale change
  const themeLabels: Record<Theme, { label: string; desc: string }> = {
    dark:  { label: t('theme.dark'),  desc: t('theme.dark.desc') },
    light: { label: t('theme.light'), desc: t('theme.light.desc') },
    rpg:   { label: t('theme.rpg'),   desc: t('theme.rpg.desc') },
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const trigger = (
    <button
      onClick={() => setOpen(o => !o)}
      aria-label="Preferences"
      className={cn(
        'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full',
        'text-muted-foreground hover:text-foreground hover:bg-white/5',
        open && 'bg-white/5 text-foreground'
      )}
    >
      <Palette className="w-4 h-4 shrink-0" />
      <span className="truncate">{t('prefs.title')}</span>
      <span className="ml-auto text-xs opacity-60 uppercase">{locale}</span>
    </button>
  )

  const panel = (
    <div
      className={cn(
        'absolute left-0 bottom-full mb-2 w-72 z-[200]',
        'rounded-2xl border shadow-2xl overflow-hidden',
        'bg-[var(--popover)] border-[var(--border)]',
        // RPG glow
        'data-[theme=rpg]:shadow-amber-900/50',
      )}
      ref={panelRef}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <span className="text-sm font-semibold">{t('prefs.title')}</span>
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Language */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
            {t('prefs.language')}
          </p>
          <div className="flex gap-2">
            {LANGS.map(lang => (
              <button
                key={lang.value}
                onClick={() => setLocale(lang.value)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all',
                  locale === lang.value
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                    : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-white/5 text-muted-foreground hover:text-foreground'
                )}
              >
                <span className="text-lg leading-none">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
            {t('prefs.theme')}
          </p>
          <div className="flex flex-col gap-2">
            {THEMES.map(th => {
              const Icon = th.icon
              const active = theme === th.value
              return (
                <button
                  key={th.value}
                  onClick={() => setTheme(th.value)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                    active
                      ? 'bg-[var(--primary)]/15 border-[var(--primary)]/50 text-foreground'
                      : 'border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-white/5 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {/* Color swatches preview */}
                  <div className="flex gap-1 shrink-0">
                    {th.preview.map((cls, i) => (
                      <div key={i} className={cn('w-4 h-4 rounded-full', cls)} />
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">
                      {themeLabels[th.value].label}
                    </p>
                    <p className="text-xs opacity-60">{themeLabels[th.value].desc}</p>
                  </div>
                  <Icon className={cn('w-4 h-4 shrink-0', active && 'text-[var(--primary)]')} />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  if (inline) {
    return (
      <div className="relative">
        {trigger}
        {open && panel}
      </div>
    )
  }

  // Floating mode for mobile
  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Preferences"
        className={cn(
          'fixed bottom-20 right-4 z-[150] w-11 h-11 rounded-xl shadow-lg',
          'flex items-center justify-center transition-all',
          'bg-[var(--card)] border border-[var(--border)]',
          'hover:border-[var(--primary)]/50 hover:scale-105 active:scale-95',
          open && 'border-[var(--primary)]/50 bg-[var(--primary)]/10'
        )}
      >
        <Palette className="w-5 h-5 text-[var(--primary)]" />
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-4 z-[200]"
          ref={panelRef}
        >
          <div
            className={cn(
              'w-72 rounded-2xl border shadow-2xl overflow-hidden',
              'bg-[var(--popover)] border-[var(--border)]',
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <span className="text-sm font-semibold">{t('prefs.title')}</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
                  {t('prefs.language')}
                </p>
                <div className="flex gap-2">
                  {LANGS.map(lang => (
                    <button
                      key={lang.value}
                      onClick={() => setLocale(lang.value)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all',
                        locale === lang.value
                          ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                          : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-white/5 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <span className="text-lg leading-none">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
                  {t('prefs.theme')}
                </p>
                <div className="flex flex-col gap-2">
                  {THEMES.map(th => {
                    const Icon = th.icon
                    const active = theme === th.value
                    return (
                      <button
                        key={th.value}
                        onClick={() => setTheme(th.value)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all',
                          active
                            ? 'bg-[var(--primary)]/15 border-[var(--primary)]/50 text-foreground'
                            : 'border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-white/5 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <div className="flex gap-1 shrink-0">
                          {th.preview.map((cls, i) => (
                            <div key={i} className={cn('w-4 h-4 rounded-full', cls)} />
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {themeLabels[th.value].label}
                          </p>
                          <p className="text-xs opacity-60">{themeLabels[th.value].desc}</p>
                        </div>
                        <Icon className={cn('w-4 h-4 shrink-0', active && 'text-[var(--primary)]')} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
