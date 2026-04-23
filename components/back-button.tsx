'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ fallback = '/' }: { fallback?: string }) {
  const router = useRouter()
  
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full cursor-pointer"
      onClick={() => {
        // Check if there is history to go back to
        if (typeof window !== 'undefined' && window.history.length > 1) {
          router.back()
        } else {
          router.push(fallback)
        }
      }}
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  )
}
