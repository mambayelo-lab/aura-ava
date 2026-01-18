'use client'

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Timeline, Step } from '@/components/interview/timeline'
import { RuleEditor } from '@/components/interview/rule-editor'
import { useInterviewCache } from '@/lib/hooks/useInterviewCache'
import { calculateStepsStatus } from '@/lib/utils/interview-helpers'
import { CheckCircle2 } from 'lucide-react'
import type { Rule } from '@/lib/types/ontology'

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

export default function RulesPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  const [isPending, startTransition] = useTransition()

  const { interview, loading, updateInterview } = useInterviewCache(interviewId)
  const [rules, setRules] = useState<Rule[]>([])
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (interview) {
      setRules(interview.decisions?.[0]?.rules || [])
      setValidated(interview.decisions?.[0]?.rules?.length > 0 || false)
    }
  }, [interview])

  const handleRulesChange = useCallback((newRules: Rule[]) => {
    setRules(newRules)
    setValidated(false) // Reset validation when rules change
  }, [])

  const handleValidate = useCallback(async () => {
    if (!interview || rules.length === 0) return

    // Mise à jour immédiate (non-bloquante)
    updateInterview(interviewId, {
      decisions: [
        {
          ...interview.decisions[0],
          rules: rules,
        },
      ],
    })
    setValidated(true)
  }, [interview, interviewId, rules, updateInterview])

  const handleContinue = useCallback(() => {
    if (!interview) return

    // Sauvegarder en arrière-plan (non-bloquant)
    updateInterview(interviewId, {
      decisions: [
        {
          ...interview.decisions[0],
          rules: rules,
        },
      ],
    })

    // Navigation immédiate
    startTransition(() => {
      router.push(`/interview/${interviewId}/signals`)
    })
  }, [interview, interviewId, rules, router, updateInterview])

  // Hooks doivent être appelés avant tout return conditionnel
  const currentSteps = useMemo(() => {
    return calculateStepsStatus(STEPS, interview, 'rules', { rules: rules.length })
  }, [interview, rules])

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
        currentStepId="rules"
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
              4. Règles métier
            </h1>
            <p className="text-[#666] text-base">
              Quelles règles métier guident cette décision ?
            </p>
          </div>

          {/* Résumé si validé */}
          {validated && rules.length > 0 && (
            <div className="mb-6 p-4 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                <span className="text-sm font-semibold text-[#000]">
                  {rules.length} règle{rules.length > 1 ? 's' : ''} métier définie{rules.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {rules.slice(0, 3).map((rule) => (
                  <div key={rule.id} className="text-sm text-[#666]">
                    <span className="font-medium">
                      {rule.type === 'if_then' ? 'SI' : 'TANT QUE'}:
                    </span>{' '}
                    {rule.condition}
                    {' → '}
                    <span className="font-medium">ALORS:</span> {rule.consequence}
                  </div>
                ))}
                {rules.length > 3 && (
                  <div className="text-sm text-[#666]">
                    ... et {rules.length - 3} autre{rules.length - 3 > 1 ? 's' : ''} règle{rules.length - 3 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <RuleEditor value={rules} onChange={handleRulesChange} />

            {/* Buttons */}
            <div className="flex justify-between pt-6 border-t border-[#e5e7eb]">
              <Button
                variant="secondary"
                onClick={() => {
                  startTransition(() => {
                    router.push(`/interview/${interviewId}/origin`)
                  })
                }}
              >
                ← Retour
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleValidate}
                  disabled={rules.length === 0 || validated || isPending}
                >
                  {validated ? '✓ Validé' : 'Valider'}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleContinue}
                  disabled={isPending}
                >
                  {isPending ? 'Chargement...' : 'Continuer →'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

