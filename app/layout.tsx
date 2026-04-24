import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'
import { WorkoutProvider } from '@/lib/workout-context'
import { PreferencesProvider } from '@/lib/preferences-context'
import { getCurrentPhase, getExercises } from '@/lib/db'
import { getPlannedSessionsByPhase } from '@/lib/db/planned'
import { getWorkoutSessionsInRange, buildExercisesFromSets } from '@/lib/db/sessions'


const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Antigravity Fitness',
  description: 'Premium workout tracking for high-performance athletes',
}

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Fetch live data from Supabase — gracefully falls back to mock data if DB not configured
  const [phase, exercises] = await Promise.all([
    getCurrentPhase().catch((e) => {
      console.error('[RootLayout] Error fetching current phase:', e)
      return null
    }),
    getExercises().catch((e) => {
      console.error('[RootLayout] Error fetching exercises:', e)
      return []
    }),
  ])

  let initialPlannedSessions: any[] = []
  let initialPlannedExercises: any[] = []

  if (phase) {
    initialPlannedSessions = await getPlannedSessionsByPhase(phase.id).catch((e) => {
      console.error('[RootLayout] Error fetching planned sessions:', e)
      return []
    })
    initialPlannedExercises = initialPlannedSessions.flatMap(s => s.exercises || [])
  }

  // Load real completed sessions from the last 12 weeks
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 84)
  const rawDbSessions = await getWorkoutSessionsInRange(
    eightWeeksAgo.toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ).catch(() => [])

  // Enrich each session with grouped exercise data + derive session name from matching planned template
  const initialDbSessions = rawDbSessions.map(s => {
    const matchedPlan = initialPlannedSessions.find(ps => ps.plannedDate === s.date)
    return {
      ...s,
      name: matchedPlan?.name ?? undefined,
      status: 'completed' as const,
      exercises: buildExercisesFromSets(s, exercises),
    }
  })

  return (
    <html lang="pt-BR" className="bg-background" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Anti-flash: read theme/locale from localStorage before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('pump-theme')||'dark';
              var l=localStorage.getItem('pump-locale')||'pt';
              document.documentElement.setAttribute('data-theme',t);
              document.documentElement.lang=l==='pt'?'pt-BR':l;
            }catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased ambient-bg min-h-screen overflow-x-hidden`}>
        <WorkoutProvider
          initialPhase={phase}
          initialExercises={exercises}
          initialPlannedSessions={initialPlannedSessions}
          initialPlannedExercises={initialPlannedExercises}
          initialDbSessions={initialDbSessions}
        >
          <PreferencesProvider>
            <Navigation />
            <main className="pb-20 md:pb-0 md:pl-64 overflow-x-hidden">
              {children}
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  backdropFilter: 'blur(16px)',
                  color: 'var(--foreground)',
                },
              }}
            />
          </PreferencesProvider>
        </WorkoutProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
