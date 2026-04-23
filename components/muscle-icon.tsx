import { 
  Dumbbell, 
  ChevronUp, 
  ChevronDown, 
  MoveRight, 
  Target, 
  Zap, 
  Activity,
  User,
  Heart
} from 'lucide-react'
import { MuscleGroup } from '@/lib/types'

export function MuscleIcon({ muscle, className }: { muscle: string | MuscleGroup, className?: string }) {
  const m = muscle.toLowerCase()
  
  if (m.includes('chest') || m.includes('peito')) return <Dumbbell className={className} />
  if (m.includes('back') || m.includes('costas')) return <Activity className={className} />
  if (m.includes('shoulder') || m.includes('ombro')) return <Target className={className} />
  if (m.includes('bicep')) return <Zap className={className} />
  if (m.includes('tricep')) return <Zap className={className} />
  if (m.includes('quad') || m.includes('coxa')) return <ChevronUp className={className} />
  if (m.includes('hamstring') || m.includes('posterior')) return <ChevronDown className={className} />
  if (m.includes('glute')) return <Heart className={className} />
  if (m.includes('calf') || m.includes('panturrilha')) return <MoveRight className={className} />
  if (m.includes('core') || m.includes('abs')) return <User className={className} />
  
  return <Dumbbell className={className} />
}
