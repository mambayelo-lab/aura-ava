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
import type { PainPoint, PainPointType } from '@/lib/types/ontology'

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

export default function PainPointsPage() {
  const router = useRouter()
  const params = useParams()
  const interviewId = params.id as string
  const [isPending, startTransition] = useTransition()

  const { interview, loading, updateInterview } = useInterviewCache(interviewId)
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [newPainPoint, setNewPainPoint] = useState({
    type: 'slow' as PainPointType,
    description: '',
    impact: '',
    criticality: 'medium' as 'low' | 'medium' | 'high',
  })
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    if (interview) {
      setPainPoints(interview.decisions?.[0]?.pain_points || [])
      setValidated((interview.decisions?.[0]?.pain_points?.length || 0) > 0)
    }
  }, [interview])

  const handleAddPainPoint = () => {
    if (!newPainPoint.description.trim() || !newPainPoint.impact.trim()) return

    const painPoint: PainPoint = {
      id: crypto.randomUUID(),
      type: newPainPoint.type,
      description: newPainPoint.description.trim(),
      impact: newPainPoint.impact.trim(),
      criticality: newPainPoint.criticality,
    }

    setPainPoints([...painPoints, painPoint])
    setNewPainPoint({
      type: 'slow',
      description: '',
      impact: '',
      criticality: 'medium',
    })
  }

  const handleRemovePainPoint = (painPointId: string) => {
    setPainPoints(painPoints.filter((p) => p.id !== painPointId))
  }

  const handleValidate = useCallback(() => {
    if (!interview) return

    // Mise à jour immédiate (non-bloquante)
    updateInterview(interviewId, {
      decisions: [
        {
          ...interview.decisions[0],
          pain_points: painPoints,
        },
      ],
    })
    setValidated(true)
  }, [interview, interviewId, painPoints, updateInterview])

  const handleContinue = useCallback(() => {
    if (!interview) return

    // Sauvegarder en arrière-plan (non-bloquant)
    updateInterview(interviewId, {
      decisions: [
        {
          ...interview.decisions[0],
          pain_points: painPoints,
        },
      ],
    })

    // Navigation immédiate
    startTransition(() => {
      router.push(`/interview/${interviewId}/synthesis`)
    })
  }, [interview, interviewId, painPoints, router, updateInterview])

  // Hooks doivent être appelés avant tout return conditionnel
  const currentSteps = useMemo(() => {
    return calculateStepsStatus(STEPS, interview, 'pain-points', { painPoints: painPoints.length })
  }, [interview, painPoints])

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
        currentStepId="pain-points"
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
              6. Ce qui ne va pas
            </h1>
            <p className="text-[#666] text-base">
              Quels sont les problèmes actuels liés à cette décision ?
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">

            <div className="space-y-4 mb-6">
              {painPoints.map((painPoint) => (
                <div key={painPoint.id} className="p-4 border border-[#e5e7eb] rounded-lg">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#000]">
                        {painPoint.type === 'slow' && '🐌'}
                        {painPoint.type === 'error' && '❌'}
                        {painPoint.type === 'manual' && '✋'}
                        {painPoint.type === 'risky' && '⚠️'}
                        {painPoint.type === 'unclear' && '❓'}
                        {' '}
                        {painPoint.description}
                      </p>
                      <p className="text-sm text-[#666]">
                        Impact: {painPoint.impact} | Criticité: {painPoint.criticality}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemovePainPoint(painPoint.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 space-y-4 rounded-lg border border-[#e5e7eb] p-4">
            <Select
              value={newPainPoint.type}
              onValueChange={(value) => setNewPainPoint({ ...newPainPoint, type: value as PainPointType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Type de problème" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">🐌 Lent</SelectItem>
                <SelectItem value="error">❌ Erreurs</SelectItem>
                <SelectItem value="manual">✋ Manuel</SelectItem>
                <SelectItem value="risky">⚠️ Risqué</SelectItem>
                <SelectItem value="unclear">❓ Imprécis</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Description du problème"
              value={newPainPoint.description}
              onChange={(e) => setNewPainPoint({ ...newPainPoint, description: e.target.value })}
              rows={2}
            />
            <Textarea
              placeholder="Impact (conséquences)"
              value={newPainPoint.impact}
              onChange={(e) => setNewPainPoint({ ...newPainPoint, impact: e.target.value })}
              rows={2}
            />
            <Select
              value={newPainPoint.criticality}
              onValueChange={(value) => setNewPainPoint({ ...newPainPoint, criticality: value as 'low' | 'medium' | 'high' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Criticité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Faible</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="high">Élevée</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddPainPoint} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter le problème
            </Button>
          </div>

            {/* Buttons */}
            <div className="flex justify-between pt-6 border-t border-[#e5e7eb]">
              <Button
                variant="secondary"
                onClick={() => {
                  startTransition(() => {
                    router.push(`/interview/${interviewId}/signals`)
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

