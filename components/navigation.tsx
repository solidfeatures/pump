'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Calendar, Dumbbell, BarChart3, Zap, BookOpen,
  Ruler, Utensils, User, MoreHorizontal, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePreferences } from '@/lib/preferences-context'
import { PreferencesPanel } from '@/components/preferences-panel'
import type { TranslationKey } from '@/lib/i18n'
import { useState } from 'react'

const navItems: { href: string; labelKey: TranslationKey; icon: React.ElementType }[] = [
  { href: '/',          labelKey: 'nav.home',      icon: Home },
  { href: '/plan',      labelKey: 'nav.plan',      icon: Calendar },
  { href: '/workout',   labelKey: 'nav.workout',   icon: Dumbbell },
  { href: '/history',   labelKey: 'nav.history',   icon: BarChart3 },
  { href: '/measures',  labelKey: 'nav.measures',  icon: Ruler },
  { href: '/nutrition', labelKey: 'nav.nutrition', icon: Utensils },
  { href: '/profile',   labelKey: 'nav.profile',   icon: User },
]

// 5 primary items shown in bottom bar; the rest go into the "Mais" drawer
const PRIMARY_HREFS = ['/', '/plan', '/workout', '/history', '/profile']
const primaryItems = navItems.filter(i => PRIMARY_HREFS.includes(i.href))
const secondaryItems = [
  ...navItems.filter(i => !PRIMARY_HREFS.includes(i.href)),
  { href: '/admin/rules', labelKey: 'nav.aiBase' as TranslationKey, icon: BookOpen },
]

export function Navigation() {
  const pathname = usePathname()
  const { t } = usePreferences()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col glass border-r border-white/5 z-50">
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -inset-1 bg-primary/20 rounded-xl blur-lg -z-10" />
            </div>
            <div>
              <h1 className="font-semibold text-lg tracking-tight">Antigravity</h1>
              <p className="text-xs text-muted-foreground">Fitness Tracker</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative',
                      active
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-primary rounded-xl"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <item.icon className={cn('w-5 h-5 relative z-10', active && 'text-primary-foreground')} />
                    <span className="relative z-10">{t(item.labelKey)}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Admin link */}
        <div className="px-4 pb-1">
          <Link
            href="/admin/rules"
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative',
              pathname.startsWith('/admin')
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
            )}
          >
            {pathname.startsWith('/admin') && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 bg-primary rounded-xl"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <BookOpen className={cn('w-5 h-5 relative z-10', pathname.startsWith('/admin') && 'text-primary-foreground')} />
            <span className="relative z-10">{t('nav.aiBase')}</span>
          </Link>
        </div>

        <div className="px-4 pb-2">
          <PreferencesPanel inline />
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="glass-subtle rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">{t('phase.current')}</p>
            <p className="font-semibold text-sm">Accumulation 1</p>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '45%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t('phase.week')} 2 {t('phase.of')} 4</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Bar (5 primary items + Mais) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-50 safe-area-pb">
        <ul className="flex items-center justify-around py-2 px-1">
          {primaryItems.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all relative',
                    active ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active-mobile"
                      className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
                </Link>
              </li>
            )
          })}

          {/* Mais button */}
          <li>
            <button
              onClick={() => setDrawerOpen(o => !o)}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all',
                drawerOpen ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {drawerOpen
                ? <X className="w-5 h-5" />
                : <MoreHorizontal className="w-5 h-5" />
              }
              <span className="text-[10px] font-medium">Mais</span>
            </button>
          </li>
        </ul>
      </nav>

      {/* ── Mobile "Mais" Drawer ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setDrawerOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="drawer-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
              className="md:hidden fixed bottom-[4.5rem] left-0 right-0 z-50 glass border-t border-white/10 rounded-t-2xl p-4"
            >
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

              <ul className="grid grid-cols-3 gap-2 mb-4">
                {secondaryItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all text-center',
                          active
                            ? 'bg-primary/20 text-primary'
                            : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-xs font-medium leading-tight">{t(item.labelKey)}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>

              <PreferencesPanel inline />
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  )
}
