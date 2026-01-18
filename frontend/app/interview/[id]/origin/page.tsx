'use client'

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Timeline, Step } from '@/components/interview/timeline'
import { useInterviewCache } from '@/lib/hooks/useInterviewCache'
import { calculateStepsStatus } from '@/lib/utils/interview-helpers'
import type { Fact, FactSourceType } from '@/lib/types/ontology'

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

const SOURCE_TYPES: { value: FactSourceType; label: string; icon: string; description: string }[] = [
  { value: 'system', label: 'Système', icon: '💻', description: 'Données provenant d\'un système informatique' },
  { value: 'manual', label: 'Manuel', icon: '✍️', description: 'Saisie manuelle par un utilisateur' },
  { value: 'unknown', label: 'Inconnu', icon: '❓', description: 'Origine non identifiée' },
]

export default function OriginPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  const [isPending, startTransition] = useTransition()

  const { interview, loading, updateInterview } = useInterviewCache(interviewId)
  const [facts, setFacts] = useState<Fact[]>([])
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (interview) {
      const loadedFacts = interview.decisions?.[0]?.required_facts || []
      setFacts(loadedFacts)
      // Initialiser validated seulement au chargement initial
      const allHaveSource = loadedFacts.length > 0 && loadedFacts.every(f => f.source_type && f.source_type !== 'unknown')
      setValidated(allHaveSource)
    }
  }, [interview])

  const handleSourceChange = (factId: string, sourceType: FactSourceType) => {
    setFacts(facts.map(f => 
      f.id === factId ? { ...f, source_type: sourceType } : f
    ))
  }

  const handleSourceDescriptionChange = (factId: string, description: string) => {
    setFacts(facts.map(f => 
      f.id === factId ? { ...f, description: description } : f
    ))
  }

  const allFactsHaveSource = useMemo(() => {
    return facts.length > 0 && facts.every(f => f.source_type && f.source_type !== 'unknown')
  }, [facts])

  const handleValidate = useCallback(() => {
    if (!interview || !allFactsHaveSource) return

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
  }, [interview, interviewId, facts, allFactsHaveSource, updateInterview])

  const handleContinue = useCallback(() => {
    if (!interview || !allFactsHaveSource) return

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
      router.push(`/interview/${interviewId}/rules`)
    })
  }, [interview, interviewId, facts, allFactsHaveSource, router, updateInterview])

  // Hooks doivent être appelés avant tout return conditionnel
  const currentSteps = useMemo(() => {
    return calculateStepsStatus(STEPS, interview, 'origin')
  }, [interview])

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
        currentStepId="origin"
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
              3. Origine des faits
            </h1>
            <p className="text-[#666] text-base">
              D'où proviennent ces informations factuelles ?
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <div className="space-y-6">
              {facts.length === 0 ? (
                <p className="text-[#666] text-center py-8">
                  Aucun fait à définir. Veuillez d'abord ajouter des faits nécessaires.
                </p>
              ) : (
                <div className="space-y-4">
                  {facts.map((fact) => (
                    <div key={fact.id} className="p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-[#000] mb-1">Fait</p>
                        <p className="text-[#000]">📦 {fact.label}</p>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-[#000] mb-2">
                            Type d'origine
                          </label>
                          <Select
                            value={fact.source_type}
                            onValueChange={(value) => handleSourceChange(fact.id, value as FactSourceType)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner l'origine" />
                            </SelectTrigger>
                            <SelectContent>
                              {SOURCE_TYPES.map((source) => (
                                <SelectItem key={source.value} value={source.value}>
                                  {source.icon} {source.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-[#000] mb-2">
                            Précision sur l'origine (optionnel)
                          </label>
                          <Input
                            placeholder="Ex: Système CRM, Excel partagé, Email..."
                            value={fact.description || ''}
                            onChange={(e) => handleSourceDescriptionChange(fact.id, e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-between pt-6 border-t border-[#e5e7eb]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    startTransition(() => {
                      router.push(`/interview/${interviewId}/facts`)
                    })
                  }}
                >
                  ← Retour
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleValidate}
                    disabled={!allFactsHaveSource || validated || isPending}
                  >
                    {validated ? '✓ Validé' : 'Valider'}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleContinue}
                    disabled={!allFactsHaveSource || isPending}
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

