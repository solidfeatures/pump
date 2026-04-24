import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return <div className={cn('rounded-xl bg-white/5 animate-pulse', className)} />
}

export function SkeletonPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Title */}
      <div className="space-y-2 mb-8">
        <Bone className="h-8 w-48" />
        <Bone className="h-4 w-72" />
      </div>

      {/* Tabs */}
      <Bone className="h-10 w-80" />

      {/* Cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <Bone key={i} className="h-24" />
        ))}
      </div>

      {/* Hero card */}
      <Bone className="h-44" />

      {/* Secondary card */}
      <Bone className="h-32" />

      {/* Wide card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Bone className="h-48" />
        <Bone className="h-48" />
      </div>
    </div>
  )
}
