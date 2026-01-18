'use client'

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Timeline, Step } from '@/components/interview/timeline'
import { useInterviewCache } from '@/lib/hooks/useInterviewCache'
import { calculateStepsStatus } from '@/lib/utils/interview-helpers'
import { Plus, X } from 'lucide-react'
import type { Fact } from '@/lib/types/ontology'

const STEPS: Step[] = [
  { id: 'decision', label: 'Décision à éclairer', completed: false, validated: false },
  { id: 'facts', label: 'Faits nécessaires', completed: false, validated: false },
  { id: 'origin', label: 'Origine des faits', completed: false, validated: false },
  { id: 'rules', label: 'Règles métier', completed: false, validated: false },
  { id: 'signals', label: 'Signaux d\'alerte', completed: false, validated: false },
  { id: 'pain-points', label: 'Ce qui ne va pas', completed: false, validated: false },
  { id: 'synthesis', label: 'Synthèse', completed: false, validated: false },
  { id: 'submit', label: 'Validation', completed: false, validated: false },
]

export default function FactsPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  const [isPending, startTransition] = useTransition()

  const { interview, loading, updateInterview } = useInterviewCache(interviewId)
  const [facts, setFacts] = useState<Fact[]>([])
  const [newFactLabel, setNewFactLabel] = useState('')
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (interview) {
      setFacts(interview.decisions?.[0]?.required_facts || [])
      setValidated((interview.decisions?.[0]?.required_facts?.length || 0) > 0)
    }
  }, [interview])

  const handleAddFact = () => {
    if (!newFactLabel.trim()) return

    const newFact: Fact = {
      id: crypto.randomUUID(),
      label: newFactLabel.trim(),
      source_type: 'unknown',
      description: '',
    }

    setFacts([...facts, newFact])
    setNewFactLabel('')
  }

  const handleRemoveFact = (factId: string) => {
    setFacts(facts.filter((f) => f.id !== factId))
  }

  const handleValidate = useCallback(() => {
    if (!interview || facts.length === 0) return

    // Mise à jour immédiate (non-bloquante)
    updateInterview(interviewId, {
      decisions: [
        {
          ...interview.decisions[0],
          required_facts: facts,
        },
      ],
    })
    setValidated(true)
  }, [interview, interviewId, facts, updateInterview])

  const handleContinue = useCallback(() => {
    if (!interview || facts.length === 0) return

    // Sauvegarder en arrière-plan (non-bloquant)
    updateInterview(interviewId, {
      decisions: [
        {
          ...interview.decisions[0],
          required_facts: facts,
        },
      ],
    })

    // Navigation immédiate
    startTransition(() => {
      router.push(`/interview/${interviewId}/origin`)
    })
  }, [interview, interviewId, facts, router, updateInterview])

  // Hooks doivent être appelés avant tout return conditionnel
  const currentSteps = useMemo(() => {
    return calculateStepsStatus(STEPS, interview, 'facts', { facts: facts.length })
  }, [interview, facts])

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#fafafa]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f172a] mx-auto mb-4"></div>
            <p className="text-[#666]">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Timeline
        steps={currentSteps}
        currentStepId="facts"
        onStepClick={(stepId) => {
          startTransition(() => {
            router.push(`/interview/${interviewId}/${stepId}`)
          })
        }}
      />

      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#000] mb-2">
              2. Faits nécessaires
            </h1>
            <p className="text-[#666] text-base">
              De quelles informations factuelles avez-vous besoin pour prendre cette décision ?
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <div className="space-y-6">
              <div className="space-y-3">
                {facts.map((fact) => (
                  <div key={fact.id} className="flex items-center gap-3 p-3 border border-[#e5e7eb] rounded-lg">
                    <span className="flex-1 text-[#000]">📦 {fact.label}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFact(fact.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Chiffre d'affaires prévisionnel"
                  value={newFactLabel}
                  onChange={(e) => setNewFactLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddFact()}
                />
                <Button onClick={handleAddFact} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Buttons */}
              <div className="flex justify-between pt-6 border-t border-[#e5e7eb]">
                <Button
                  variant="secondary"
                  onClick={() => {
                    startTransition(() => {
                      router.push(`/interview/${interviewId}/decision`)
                    })
                  }}
                >
                  ← Retour
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleValidate}
                    disabled={facts.length === 0 || validated || isPending}
                  >
                    {validated ? '✓ Validé' : 'Valider'}
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={handleContinue} 
                    disabled={facts.length === 0 || isPending}
                  >
                    {isPending ? 'Chargement...' : 'Continuer →'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

