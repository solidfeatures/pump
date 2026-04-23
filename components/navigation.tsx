'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Calendar, Dumbbell, BarChart3, Zap, BookOpen, Ruler, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/plan', label: 'Plano', icon: Calendar },
  { href: '/workout', label: 'Treino', icon: Dumbbell },
  { href: '/history', label: 'Histórico', icon: BarChart3 },
  { href: '/measures', label: 'Medidas', icon: Ruler },
  { href: '/nutrition', label: 'Nutrição', icon: Utensils },
]

export function Navigation() {
  const pathname = usePathname()
  
  return (
    <>
      {/* Desktop Sidebar */}
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
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all relative",
                      isActive 
                        ? "text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-primary rounded-xl"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <item.icon className={cn("w-5 h-5 relative z-10", isActive && "text-primary-foreground")} />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        
        {/* Admin link — desktop only */}
        <div className="px-4 pb-2">
          <Link
            href="/admin/rules"
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all relative",
              pathname.startsWith('/admin')
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
          >
            {pathname.startsWith('/admin') && (
              <motion.div
                layoutId="nav-active"
                className="absolute inset-0 bg-primary rounded-xl"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <BookOpen className={cn("w-5 h-5 relative z-10", pathname.startsWith('/admin') && "text-primary-foreground")} />
            <span className="relative z-10">Base IA</span>
          </Link>
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="glass-subtle rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">Current Phase</p>
            <p className="font-semibold text-sm">Accumulation 1</p>
            <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '45%' }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Week 2 of 4</p>
          </div>
        </div>
      </aside>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-50 safe-area-pb">
        <ul className="flex items-center justify-around py-2">
          {[...navItems, { href: '/admin/rules', label: 'Base IA', icon: BookOpen }].map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative",
                    isActive 
                      ? "text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-mobile"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
