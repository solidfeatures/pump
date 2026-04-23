'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function BackButton({ fallback = '/workout' }: { fallback?: string }) {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full cursor-pointer"
      onClick={() => {
        if (window.history.length > 1) {
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
