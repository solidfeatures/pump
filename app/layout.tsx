import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from 'sonner'
import { Navigation } from '@/components/navigation'
import { WorkoutProvider } from '@/lib/workout-context'
import { getCurrentPhase, getExercises } from '@/lib/db'
import { getPlannedSessionsByPhase } from '@/lib/db/planned'


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

  const fs = require('fs')
  fs.appendFileSync('debug_layout.log', `[V2 - ${new Date().toISOString()}] Phase: ${phase?.name} (${phase?.id}), Sessions: ${initialPlannedSessions.length}\n`)

  console.log('[RootLayout] Loaded data:', { 
    phase: phase?.name, 
    sessionsCount: initialPlannedSessions.length,
    exercisesCount: exercises.length 
  })

  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased ambient-bg min-h-screen overflow-x-hidden`}>
        <WorkoutProvider 
          initialPhase={phase} 
          initialExercises={exercises}
          initialPlannedSessions={initialPlannedSessions}
          initialPlannedExercises={initialPlannedExercises}
        >
          <Navigation />
          <main className="pb-20 md:pb-0 md:pl-64 overflow-x-hidden">
            {children}
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'oklch(0.16 0.005 285 / 0.9)',
                border: '1px solid oklch(1 0 0 / 0.1)',
                backdropFilter: 'blur(16px)',
                color: 'oklch(0.98 0 0)',
              },
            }}
          />
        </WorkoutProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
