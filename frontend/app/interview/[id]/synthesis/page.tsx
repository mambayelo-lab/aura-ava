'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Timeline, Step } from '@/components/interview/timeline'
import { useInterviewCache } from '@/lib/hooks/useInterviewCache'

const STEPS: Step[] = [
  { id: 'decision', label: 'Décision à éclairer', completed: false },
  { id: 'facts', label: 'Faits nécessaires', completed: false },
  { id: 'origin', label: 'Origine des faits', completed: false },
  { id: 'rules', label: 'Règles métier', completed: false },
  { id: 'signals', label: 'Signaux d\'alerte', completed: false },
  { id: 'pain-points', label: 'Ce qui ne va pas', completed: false },
  { id: 'synthesis', label: 'Synthèse', completed: false },
  { id: 'submit', label: 'Validation', completed: false },
]

export default function SynthesisPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  const [isPending, startTransition] = useTransition()

  const { interview, loading } = useInterviewCache(interviewId)

  const handleContinue = () => {
    startTransition(() => {
      router.push(`/interview/${interviewId}/submit`)
    })
  }

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

  if (!interview || !interview.decisions?.[0]) {
    return (
      <div className="flex min-h-screen bg-[#fafafa]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-[#666] mb-4">Aucune décision trouvée dans cette interview.</p>
            <Button onClick={() => router.push(`/interview/${interviewId}/decision`)}>
              Créer une décision
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const decision = interview.decisions[0]

  const currentSteps = STEPS.map((step) => {
    if (step.id === 'decision') {
      const hasDecision = decision.label && decision.description
      return { ...step, completed: !!hasDecision }
    }
    if (step.id === 'facts') {
      const hasFacts = (decision.required_facts?.length || 0) > 0
      return { ...step, completed: hasFacts }
    }
    if (step.id === 'origin') {
      const facts = decision.required_facts || []
      const allHaveSource = facts.length > 0 && facts.every(f => f.source_type && f.source_type !== 'unknown')
      return { ...step, completed: allHaveSource }
    }
    if (step.id === 'rules') {
      const hasRules = (decision.rules?.length || 0) > 0
      return { ...step, completed: hasRules }
    }
    if (step.id === 'signals') {
      const hasSignals = (decision.signals?.length || 0) > 0
      return { ...step, completed: hasSignals }
    }
    if (step.id === 'pain-points') {
      const hasPainPoints = (decision.pain_points?.length || 0) > 0
      return { ...step, completed: hasPainPoints }
    }
    if (step.id === 'synthesis') {
      return { ...step, completed: true }
    }
    return step
  })

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Timeline
        steps={currentSteps}
        currentStepId="synthesis"
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
              7. Synthèse
            </h1>
            <p className="text-[#666] text-base">
              Récapitulatif de votre interview
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">

            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-lg font-semibold text-[#000]">
                  📋 Décision
                </h3>
                <div className="p-4 border border-[#e5e7eb] rounded-lg">
                  <p className="font-medium text-[#000]">{decision.label}</p>
                  <p className="mt-2 text-sm text-[#666]">{decision.description}</p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-[#000]">
                  📦 Faits nécessaires ({(decision.required_facts?.length || 0)})
                </h3>
                <div className="space-y-2">
                  {(decision.required_facts || []).map((fact) => (
                    <div key={fact.id} className="p-3 border border-[#e5e7eb] rounded-lg">
                      <p className="text-sm text-[#000]">{fact.label}</p>
                      <p className="text-xs text-[#666]">Origine: {fact.source_type}{fact.description ? ` - ${fact.description}` : ''}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-[#000]">
                  📜 Règles métier ({(decision.rules?.length || 0)})
                </h3>
                <div className="space-y-2">
                  {(decision.rules || []).map((rule) => (
                    <div key={rule.id} className="p-3 border border-[#e5e7eb] rounded-lg">
                      <p className="text-sm text-[#000]">
                        <strong>Si:</strong> {rule.condition}
                      </p>
                      <p className="text-sm text-[#666]">
                        <strong>Alors:</strong> {rule.consequence}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-[#000]">
                  🚨 Signaux d'alerte ({(decision.signals?.length || 0)})
                </h3>
                <div className="space-y-2">
                  {(decision.signals || []).map((signal) => (
                    <div key={signal.id} className="p-3 border border-[#e5e7eb] rounded-lg">
                      <p className="text-sm font-medium text-[#000]">{signal.label}</p>
                      <p className="text-xs text-[#666]">
                        {signal.severity} - {signal.context}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-lg font-semibold text-[#000]">
                  ⚠️ Problèmes identifiés ({(decision.pain_points?.length || 0)})
                </h3>
                <div className="space-y-2">
                  {(decision.pain_points || []).map((painPoint) => (
                    <div key={painPoint.id} className="p-3 border border-[#e5e7eb] rounded-lg">
                      <p className="text-sm text-[#000]">{painPoint.description}</p>
                      <p className="text-xs text-[#666]">
                        Impact: {painPoint.impact} | Criticité: {painPoint.criticality}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Buttons */}
            <div className="flex justify-between pt-6 border-t border-[#e5e7eb]">
              <Button
                variant="secondary"
                onClick={() => {
                  startTransition(() => {
                    router.push(`/interview/${interviewId}/pain-points`)
                  })
                }}
              >
                ← Retour
              </Button>
              <Button
                variant="primary"
                onClick={handleContinue}
                disabled={isPending}
                size="lg"
              >
                {isPending ? 'Chargement...' : 'Valider et soumettre →'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

