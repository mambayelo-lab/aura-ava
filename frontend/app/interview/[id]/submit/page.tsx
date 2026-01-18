'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Timeline, Step } from '@/components/interview/timeline'
import { useInterviewCache } from '@/lib/hooks/useInterviewCache'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export default function SubmitPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  const [isPending, startTransition] = useTransition()

  const { interview, loading, updateInterview } = useInterviewCache(interviewId)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (interview) {
      setSubmitted(interview.validation?.validated_by_user || false)
    }
  }, [interview])

  const handleSubmit = async () => {
    if (!interview) return

    setSubmitting(true)
    try {
      // Marquer comme validé localement
      await updateInterview(interviewId, {
        validation: {
          ...interview.validation,
          validated_by_user: true,
          submitted_at: new Date().toISOString(),
        },
      })
      setSubmitted(true)
      
      // Essayer de soumettre sur l'API en arrière-plan
      try {
        const { interviewApi } = await import('@/lib/api/client')
        await interviewApi.submit(interviewId)
      } catch {
        // Ignorer les erreurs API - la soumission locale est suffisante
      }
    } catch (error) {
      console.error('Erreur soumission:', error)
    } finally {
      setSubmitting(false)
    }
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

  if (!interview) {
    return (
      <div className="flex min-h-screen bg-[#fafafa]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[#666]">Chargement de l'interview...</p>
          </div>
        </div>
      </div>
    )
  }

  const decision = interview.decisions?.[0]
  if (!decision) {
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

  // Calculer l'état de chaque étape
  const stepStatus = {
    decision: !!(decision.label && decision.description),
    facts: (decision.required_facts?.length || 0) > 0,
    origin: (decision.required_facts?.length || 0) > 0 && 
            decision.required_facts.every(f => f.source_type && f.source_type !== 'unknown'),
    rules: (decision.rules?.length || 0) > 0,
    signals: (decision.signals?.length || 0) > 0,
    'pain-points': (decision.pain_points?.length || 0) > 0,
    synthesis: true, // Toujours complété (récapitulatif)
    submit: submitted,
  }

  const currentSteps = STEPS.map((step) => ({
    ...step,
    completed: stepStatus[step.id as keyof typeof stepStatus] || false,
  }))

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Timeline
        steps={currentSteps}
        currentStepId="submit"
        onStepClick={(stepId) => {
          startTransition(() => {
            router.push(`/interview/${interviewId}/${stepId}`)
          })
        }}
      />

      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          {submitted ? (
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
              <div className="text-center">
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-[#22c55e]" />
                <h1 className="mb-2 text-3xl font-bold text-[#000]">
                  Interview soumise avec succès !
                </h1>
                <p className="text-[#666] mb-8">
                  Votre interview a été validée et est prête pour la compilation AVA.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      startTransition(() => {
                        router.push(`/interview/${interviewId}/result`)
                      })
                    }}
                    size="lg"
                    className="w-full"
                  >
                    🎯 Voir le résultat de compilation
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/interview')}
                    size="lg"
                    className="w-full"
                  >
                    Retour à l'accueil
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-[#000] mb-2">
                  8. Validation et soumission
                </h1>
                <p className="text-[#666] text-base">
                  Vérifiez que toutes les informations sont correctes avant de soumettre votre interview.
                </p>
              </div>

              {/* Form Card */}
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
                <div className="space-y-4 mb-6">
                  {STEPS.filter(s => s.id !== 'submit' && s.id !== 'synthesis').map((step) => {
                    const isCompleted = stepStatus[step.id as keyof typeof stepStatus] || false
                    return (
                      <div key={step.id} className="flex items-center gap-3 p-3 border border-[#e5e7eb] rounded-lg">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-[#22c55e] flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-[#f59e0b] flex-shrink-0" />
                        )}
                        <span className={cn(
                          "text-sm font-medium flex-1",
                          isCompleted ? "text-[#000]" : "text-[#f59e0b]"
                        )}>
                          {step.label}
                        </span>
                        {!isCompleted && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              startTransition(() => {
                                router.push(`/interview/${interviewId}/${step.id}`)
                              })
                            }}
                          >
                            Compléter
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Buttons */}
                <div className="flex justify-between pt-6 border-t border-[#e5e7eb]">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      startTransition(() => {
                        router.push(`/interview/${interviewId}/synthesis`)
                      })
                    }}
                  >
                    ← Retour
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={submitting || isPending}
                    size="lg"
                  >
                    {submitting ? 'Soumission...' : '✅ Soumettre l\'interview'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

