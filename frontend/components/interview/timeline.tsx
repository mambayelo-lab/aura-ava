'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

export type Step = {
  id: string
  label: string
  completed: boolean
  validated?: boolean // Nouvelle propriété pour les étapes validées
}

export type TimelineProps = {
  steps: Step[]
  currentStepId: string
  onStepClick?: (stepId: string) => void
}

export function Timeline({ steps, currentStepId, onStepClick }: TimelineProps) {
  return (
    <nav className="w-64 bg-white border-r border-[#e5e7eb] p-6 min-h-screen">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-[#000]">AURA</h1>
        <p className="text-sm text-[#666]">Architecture Vision Assistant - V3</p>
      </div>
      
      <div className="space-y-1">
        <h2 className="text-xs font-semibold text-[#666] uppercase tracking-wider mb-3">
          Progression
        </h2>
        
        {steps.map((step, index) => {
          const isCurrent = step.id === currentStepId
          
          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg transition-all duration-200",
                "flex items-center gap-3 cursor-pointer",
                isCurrent && "bg-[#f8fafc] border border-[#e5e7eb]",
                !isCurrent && "hover:bg-[#f2f2f2]"
              )}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                ) : isCurrent ? (
                  <Circle className="w-5 h-5 text-[#0f172a] fill-[#0f172a]" />
                ) : (
                  <Circle className="w-5 h-5 text-[#cbd5e1]" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#666]">
                    {index + 1}.
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-[#0f172a]",
                    step.completed && !isCurrent && "text-[#000]",
                    !step.completed && !isCurrent && "text-[#666]"
                  )}>
                    {step.label}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
