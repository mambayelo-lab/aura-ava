'use client'

import { useEffect, useState, useTransition } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Timeline, Step } from '@/components/interview/timeline'
import { useInterviewCache } from '@/lib/hooks/useInterviewCache'
import { Plus, Trash2, ArrowRight, FileText, CheckCircle2 } from 'lucide-react'
import { calculateStepsStatus } from '@/lib/utils/interview-helpers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type DomainEvent = {
  id: string
  label: string
  description?: string
  order: number
}

type BusinessPolicy = {
  id: string
  label: string
  description?: string
}

type Application = {
  id: string
  name: string
  description?: string
}

type Capability = {
  id: string
  name: string
  description?: string
}

const STEPS: Step[] = [
  { id: 'events', label: 'Événements métier', completed: false },
  { id: 'policies', label: 'Règles métier', completed: false },
  { id: 'applications', label: 'Applications', completed: false },
  { id: 'capabilities', label: 'Capabilities', completed: false },
  { id: 'synthesis', label: 'Synthèse', completed: false },
  { id: 'submit', label: 'Validation', completed: false },
]

export default function TransformingInterviewPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const interviewId = params.id as string
  const mode = searchParams.get('mode')
  const [isPending, startTransition] = useTransition()

  const { interview, loading, updateInterview } = useInterviewCache(interviewId)
  
  const [events, setEvents] = useState<DomainEvent[]>([])
  const [policies, setPolicies] = useState<BusinessPolicy[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [capabilities, setCapabilities] = useState<Capability[]>([])
  const [currentStep, setCurrentStep] = useState<string>('events')
  const [validated, setValidated] = useState<Record<string, boolean>>({})

  // Rediriger vers decision si ce n'est pas le mode transforming
  useEffect(() => {
    if (!loading && interview && mode !== 'agent') {
      // Ne pas rediriger si on est déjà en mode transforming
      const isTransforming = interview.type === 'transformation' || (interview.type as any) === 'transforming' || mode === 'transforming'
      if (!isTransforming) {
        router.push(`/interview/${interviewId}/decision`)
      }
    }
  }, [loading, interview, mode, interviewId, router])

  // Charger les données depuis l'interview
  useEffect(() => {
    if (interview) {
      // Pour le mode transforming, on stocke dans processes[0]
      const processData = interview.processes?.[0] || {}
      setEvents(processData.events || [])
      setPolicies(processData.policies || [])
      setApplications(processData.applications || [])
      setCapabilities(processData.capabilities || [])
    }
  }, [interview])

  const saveProcessData = () => {
    if (!interview) return

    updateInterview(interviewId, {
      processes: [{
        id: interview.processes?.[0]?.id || crypto.randomUUID(),
        name: interview.title || 'Transformation',
        events: events,
        policies: policies,
        applications: applications,
        capabilities: capabilities,
      }]
    })
  }

  // Events
  const handleAddEvent = () => {
    const newEvent: DomainEvent = {
      id: crypto.randomUUID(),
      label: '',
      description: '',
      order: events.length,
    }
    setEvents([...events, newEvent])
  }

  const handleUpdateEvent = (id: string, field: keyof DomainEvent, value: string) => {
    setEvents(events.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  const handleRemoveEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id).map((e, i) => ({ ...e, order: i })))
  }

  // Policies
  const handleAddPolicy = () => {
    const newPolicy: BusinessPolicy = {
      id: crypto.randomUUID(),
      label: '',
      description: '',
    }
    setPolicies([...policies, newPolicy])
  }

  const handleUpdatePolicy = (id: string, field: keyof BusinessPolicy, value: string) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const handleRemovePolicy = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id))
  }

  // Applications
  const handleAddApplication = () => {
    const newApp: Application = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
    }
    setApplications([...applications, newApp])
  }

  const handleUpdateApplication = (id: string, field: keyof Application, value: string) => {
    setApplications(applications.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const handleRemoveApplication = (id: string) => {
    setApplications(applications.filter(a => a.id !== id))
  }

  // Capabilities
  const handleAddCapability = () => {
    const newCap: Capability = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
    }
    setCapabilities([...capabilities, newCap])
  }

  const handleUpdateCapability = (id: string, field: keyof Capability, value: string) => {
    setCapabilities(capabilities.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const handleRemoveCapability = (id: string) => {
    setCapabilities(capabilities.filter(c => c.id !== id))
  }

  const handleValidate = (step: string) => {
    saveProcessData()
    setValidated({ ...validated, [step]: true })
  }

  const handleContinue = (nextStep: string) => {
    saveProcessData()
    if (nextStep === 'synthesis') {
      startTransition(() => {
        router.push(`/interview/${interviewId}/synthesis?mode=transforming`)
      })
    } else if (nextStep === 'submit') {
      startTransition(() => {
        router.push(`/interview/${interviewId}/submit?mode=transforming`)
      })
    } else {
      setCurrentStep(nextStep)
    }
  }

  const currentSteps = calculateStepsStatus(STEPS, interview, currentStep, {
    events: events.length,
    policies: policies.length,
    applications: applications.length,
    capabilities: capabilities.length,
  })

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#fafafa]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
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
            <p className="text-[#666]">Interview non trouvée</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <div className="w-64 border-r border-[#e5e7eb] bg-white">
        <Timeline 
          steps={currentSteps} 
          currentStepId={currentStep}
          onStepClick={(stepId) => {
            if (stepId === 'synthesis') {
              startTransition(() => {
                router.push(`/interview/${interviewId}/synthesis?mode=transforming`)
              })
            } else if (stepId === 'submit') {
              startTransition(() => {
                router.push(`/interview/${interviewId}/submit?mode=transforming`)
              })
            } else {
              setCurrentStep(stepId)
            }
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-[#000]">
                Vibe Transforming - {interview.title}
              </h1>
              <div className="flex gap-3">
                {/* Bouton Visualiser la restitution */}
                <Button
                  variant="outline"
                  onClick={() => router.push(`/interview/${interviewId}/result`)}
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Visualiser la restitution
                </Button>
                {/* Bouton Finaliser l'interview */}
                <Button
                  variant="default"
                  onClick={async () => {
                    saveProcessData()
                    // Vérifier si c'est une interview conversationnelle
                    try {
                      const res = await fetch(`${API_URL}/api/conversational-interview/${interviewId}`)
                      if (res.ok) {
                        router.push(`/interview/conversational/${interviewId}/restitution`)
                      } else {
                        // Si ce n'est pas une interview conversationnelle, rediriger vers la synthèse
                        router.push(`/interview/${interviewId}/synthesis?mode=transforming`)
                      }
                    } catch {
                      // En cas d'erreur, essayer la restitution conversationnelle d'abord
                      router.push(`/interview/conversational/${interviewId}/restitution`)
                    }
                  }}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finaliser l'interview
                </Button>
              </div>
            </div>
            <p className="text-[#666]">
              Capturer le périmètre métier à transformer
            </p>
          </div>

          {/* Step: Events */}
          {currentStep === 'events' && (
            <Card>
              <CardHeader>
                <CardTitle>Événements métier</CardTitle>
                <p className="text-sm text-[#666] mt-2">
                  Décrivez la chaîne d'événements métier qui se produisent dans ce périmètre.
                  Commencez par le premier événement important.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={event.id} className="p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#8b5cf6] text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-semibold text-[#666]">
                            Événement {index + 1}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEvent(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input
                          placeholder="Ex: Commande passée, Facture générée, Paiement reçu..."
                          value={event.label}
                          onChange={(e) => handleUpdateEvent(event.id, 'label', e.target.value)}
                        />
                        <Textarea
                          placeholder="Description (optionnel)"
                          value={event.description || ''}
                          onChange={(e) => handleUpdateEvent(event.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    onClick={handleAddEvent}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter un événement
                  </Button>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="primary"
                    onClick={() => handleValidate('events')}
                    disabled={events.length === 0 || events.some(e => !e.label.trim())}
                  >
                    Valider
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleContinue('policies')}
                    disabled={events.length === 0 || events.some(e => !e.label.trim())}
                  >
                    Continuer →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Policies */}
          {currentStep === 'policies' && (
            <Card>
              <CardHeader>
                <CardTitle>Règles métier (Policies)</CardTitle>
                <p className="text-sm text-[#666] mt-2">
                  Quelles sont les règles que l'entreprise doit absolument respecter dans ce périmètre ?
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {policies.map((policy) => (
                    <div key={policy.id} className="p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[#666]">Règle métier</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePolicy(policy.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input
                          placeholder="Ex: Vérifier seuil de 1000€, Valider le statut du client..."
                          value={policy.label}
                          onChange={(e) => handleUpdatePolicy(policy.id, 'label', e.target.value)}
                        />
                        <Textarea
                          placeholder="Description (optionnel)"
                          value={policy.description || ''}
                          onChange={(e) => handleUpdatePolicy(policy.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    onClick={handleAddPolicy}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une règle métier
                  </Button>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="primary"
                    onClick={() => handleValidate('policies')}
                  >
                    Valider
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleContinue('applications')}
                  >
                    Continuer →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Applications */}
          {currentStep === 'applications' && (
            <Card>
              <CardHeader>
                <CardTitle>Applications</CardTitle>
                <p className="text-sm text-[#666] mt-2">
                  Quels outils ou systèmes sont utilisés dans ce périmètre ?
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[#666]">Application</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveApplication(app.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input
                          placeholder="Ex: SAP ERP, Salesforce, Application métier..."
                          value={app.name}
                          onChange={(e) => handleUpdateApplication(app.id, 'name', e.target.value)}
                        />
                        <Textarea
                          placeholder="Description (optionnel)"
                          value={app.description || ''}
                          onChange={(e) => handleUpdateApplication(app.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    onClick={handleAddApplication}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une application
                  </Button>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="primary"
                    onClick={() => handleValidate('applications')}
                  >
                    Valider
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleContinue('capabilities')}
                  >
                    Continuer →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step: Capabilities */}
          {currentStep === 'capabilities' && (
            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
                <p className="text-sm text-[#666] mt-2">
                  Quelles sont les capacités métier nécessaires pour ce périmètre ?
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {capabilities.map((cap) => (
                    <div key={cap.id} className="p-4 border border-[#e5e7eb] rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[#666]">Capability</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCapability(cap.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input
                          placeholder="Ex: Gérer les commandes, Traiter les paiements..."
                          value={cap.name}
                          onChange={(e) => handleUpdateCapability(cap.id, 'name', e.target.value)}
                        />
                        <Textarea
                          placeholder="Description (optionnel)"
                          value={cap.description || ''}
                          onChange={(e) => handleUpdateCapability(cap.id, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    onClick={handleAddCapability}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une capability
                  </Button>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="primary"
                    onClick={() => handleValidate('capabilities')}
                  >
                    Valider
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleContinue('synthesis')}
                  >
                    Continuer →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

