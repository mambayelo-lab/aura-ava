'use client'

import { useState, useEffect, useTransition, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Timeline, Step } from '@/components/interview/timeline'
import { useInterviewCache } from '@/lib/hooks/useInterviewCache'
import { calculateStepsStatus } from '@/lib/utils/interview-helpers'
import { Plus, X } from 'lucide-react'
import type { Signal, SignalSeverity, SignalContext } from '@/lib/types/ontology'

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

export default function SignalsPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  const [isPending, startTransition] = useTransition()

  const { interview, loading, updateInterview } = useInterviewCache(interviewId)
  const [signals, setSignals] = useState<Signal[]>([])
  const [newSignal, setNewSignal] = useState({
    label: '',
    description: '',
    condition: '',
    severity: 'medium' as SignalSeverity,
    context: 'decision' as SignalContext,
  })
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (interview) {
      setSignals(interview.decisions?.[0]?.signals || [])
      setValidated((interview.decisions?.[0]?.signals?.length || 0) > 0)
    }
  }, [interview])

  const handleAddSignal = () => {
    if (!newSignal.label.trim() || !newSignal.condition.trim()) return

    const signal: Signal = {
      id: crypto.randomUUID(),
      label: newSignal.label.trim(),
      description: newSignal.description.trim(),
      condition: newSignal.condition.trim(),
      severity: newSignal.severity,
      context: newSignal.context,
      related_decision_id: interview?.decisions?.[0]?.id,
    }

    setSignals([...signals, signal])
    setNewSignal({
      label: '',
      description: '',
      condition: '',
      severity: 'medium',
      context: 'decision',
    })
  }

  const handleRemoveSignal = (signalId: string) => {
    setSignals(signals.filter((s) => s.id !== signalId))
  }

  const handleValidate = useCallback(() => {
    if (!interview) return

    // Mise à jour immédiate (non-bloquante)
    updateInterview(interviewId, {
      decisions: [
        {
          ...interview.decisions[0],
          signals: signals,
        },
      ],
    })
    setValidated(true)
  }, [interview, interviewId, signals, updateInterview])

  const handleContinue = useCallback(() => {
    if (!interview) return

    // Sauvegarder en arrière-plan (non-bloquant)
    updateInterview(interviewId, {
      decisions: [
        {
          ...interview.decisions[0],
          signals: signals,
        },
      ],
    })

    // Navigation immédiate
    startTransition(() => {
      router.push(`/interview/${interviewId}/pain-points`)
    })
  }, [interview, interviewId, signals, router, updateInterview])

  // Hooks doivent être appelés avant tout return conditionnel
  const currentSteps = useMemo(() => {
    return calculateStepsStatus(STEPS, interview, 'signals', { signals: signals.length })
  }, [interview, signals])

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
        currentStepId="signals"
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
              5. Signaux d'alerte
            </h1>
            <p className="text-[#666] text-base">
              Quels signaux doivent vous alerter dans le contexte de cette décision ?
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">

            <div className="space-y-4 mb-6">
              {signals.map((signal) => (
                <div key={signal.id} className="p-4 border border-[#e5e7eb] rounded-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#000]">🚨 {signal.label}</p>
                      <p className="text-sm text-[#666]">
                        {signal.severity} - {signal.context}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSignal(signal.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {signal.description && (
                    <p className="mb-2 text-sm text-[#000]">{signal.description}</p>
                  )}
                  <p className="text-sm text-[#666]">
                    <strong>Condition:</strong> {signal.condition}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-6 space-y-4 rounded-lg border border-[#e5e7eb] p-4">
            <Input
              placeholder="Label du signal (ex: Délai dépassé)"
              value={newSignal.label}
              onChange={(e) => setNewSignal({ ...newSignal, label: e.target.value })}
            />
            <Textarea
              placeholder="Description (optionnel)"
              value={newSignal.description}
              onChange={(e) => setNewSignal({ ...newSignal, description: e.target.value })}
              rows={2}
            />
            <Textarea
              placeholder="Condition d'alerte (ex: Délai > 7 jours)"
              value={newSignal.condition}
              onChange={(e) => setNewSignal({ ...newSignal, condition: e.target.value })}
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={newSignal.severity}
                onValueChange={(value) => setNewSignal({ ...newSignal, severity: value as SignalSeverity })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newSignal.context}
                onValueChange={(value) => setNewSignal({ ...newSignal, context: value as SignalContext })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Contexte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">Opérationnel</SelectItem>
                  <SelectItem value="decision">Décision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddSignal} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter le signal
            </Button>
          </div>

            {/* Buttons */}
            <div className="flex justify-between pt-6 border-t border-[#e5e7eb]">
              <Button
                variant="secondary"
                onClick={() => {
                  startTransition(() => {
                    router.push(`/interview/${interviewId}/rules`)
                  })
                }}
              >
                ← Retour
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleValidate}
                  disabled={validated || isPending}
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

