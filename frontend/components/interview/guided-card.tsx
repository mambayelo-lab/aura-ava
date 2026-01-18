'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type GuidedCardProps = {
  icon: React.ReactNode
  label: string
  description?: string
  selected?: boolean
  onClick: () => void
}

export function GuidedCard({
  icon,
  label,
  description,
  selected,
  onClick,
}: GuidedCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer border-2 p-4 transition-all hover:border-blue-500 hover:shadow-md',
        selected && 'border-blue-600 bg-blue-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-2xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-medium text-slate-900">{label}</h3>
          {description && (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          )}
        </div>
        {selected && (
          <Check className="h-5 w-5 flex-shrink-0 text-blue-600" />
        )}
      </div>
    </Card>
  )
}

