'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, ChevronLeft, Plus, Trash2, Search, Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 1 | 2 | 3 | 4 | 5

type Activity = {
  id: string
  label: string
  description?: string
  parent_id?: string
  children_ids: string[]
  level: number
  who: string[]
  tools: string[]
  inputs?: string
  outputs?: string
  order: number
  duration_estimate?: string
  frequency?: string
}

type Actor = {
  id: string
  name: string
  type: 'personne' | 'equipe' | 'systeme'
  role?: string
  activities: string[]
}

type ActivityFlow = {
  id: string
  source_activity_id: string
  target_activity_id: string
  type: 'PUIS' | 'EN_PARALLELE' | 'SI_ALORS' | 'BOUCLE'
  condition?: string
}

type PainPoint = {
  id: string
  description: string
  related_activities: string[]
  impact: 'temps_perdu' | 'erreurs' | 'frustration' | 'cout' | 'risque'
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
}

const EXAMPLES = {
  1: {
    perimeter: "Notre processus de vente",
    objective: "Réduire le temps de traitement de 5 jours à 2 jours"
  },
  2: [
    { label: "Recevoir une demande client", description: "Le client nous contacte" },
    { label: "Vérifier la disponibilité", description: "On regarde le stock" },
    { label: "Calculer le prix", description: "On fait le devis" },
  ],
  3: [
    { name: "Conseiller commercial", type: "personne" as const, role: "Traite demandes" },
    { name: "Système CRM", type: "systeme" as const },
  ]
}

export default function TransformingInterviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [perimeter, setPerimeter] = useState('')
  const [objective, setObjective] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [actors, setActors] = useState<Actor[]>([])
  const [flows, setFlows] = useState<ActivityFlow[]>([])
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [showExamples, setShowExamples] = useState(true)

  // Charger l'interview au montage
  useEffect(() => {
    loadInterview()
  }, [id])

  const loadInterview = async () => {
    try {
      const res = await fetch(`${API_URL}/api/transforming-interview/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPerimeter(data.perimeter || '')
        setObjective(data.objective || '')
        setActivities(data.activities || [])
        setActors(data.actors || [])
        setFlows(data.flows || [])
        setPainPoints(data.pain_points || [])
      }
    } catch (err) {
      console.error('Error loading interview:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveInterview = async () => {
    if (saving) return
    setSaving(true)
    try {
      await fetch(`${API_URL}/api/transforming-interview/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perimeter,
          objective,
          activities,
          actors,
          flows,
          pain_points: painPoints
        })
      })
    } catch (err) {
      console.error('Error saving interview:', err)
    } finally {
      setSaving(false)
    }
  }

  // Sauvegarder automatiquement
  useEffect(() => {
    if (!loading) {
      saveInterview()
    }
  }, [perimeter, objective, activities, actors, flows, painPoints])

  const handleNext = () => {
    if (step < 5) {
      saveInterview()
      setStep((step + 1) as Step)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/transforming-interview/${id}/submit`, {
        method: 'POST'
      })
      
      if (res.ok) {
        startTransition(() => {
          router.push(`/architect/transforming/${id}`)
        })
      } else {
        const error = await res.json()
        alert(`Erreur: ${error.detail || 'Impossible de soumettre l\'interview'}`)
      }
    } catch (err) {
      console.error('Error submitting interview:', err)
      alert('Erreur lors de la soumission')
    } finally {
      setSaving(false)
    }
  }

  const addActivity = (parentId?: string) => {
    const level = parentId 
      ? (activities.find(a => a.id === parentId)?.level || 1) + 1
      : 1
    
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      label: '',
      description: '',
      parent_id: parentId,
      children_ids: [],
      level,
      who: [],
      tools: [],
      order: activities.filter(a => !parentId || a.parent_id === parentId).length,
    }
    
    setActivities([...activities, newActivity])
    
    // Mettre à jour le parent
    if (parentId) {
      setActivities(prev => prev.map(a => 
        a.id === parentId 
          ? { ...a, children_ids: [...a.children_ids, newActivity.id] }
          : a
      ))
    }
  }

  const updateActivity = (id: string, field: keyof Activity, value: any) => {
    setActivities(activities.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const removeActivity = (id: string) => {
    const activity = activities.find(a => a.id === id)
    if (!activity) return
    
    // Supprimer les enfants récursivement
    const removeChildren = (parentId: string) => {
      const children = activities.filter(a => a.parent_id === parentId)
      children.forEach(child => {
        removeChildren(child.id)
        setActivities(prev => prev.filter(a => a.id !== child.id))
      })
    }
    removeChildren(id)
    
    // Retirer de la liste
    setActivities(activities.filter(a => a.id !== id))
    
    // Retirer du parent
    if (activity.parent_id) {
      setActivities(prev => prev.map(a => 
        a.id === activity.parent_id 
          ? { ...a, children_ids: a.children_ids.filter(cid => cid !== id) }
          : a
      ))
    }
  }

  const handleDecomposeActivity = async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId)
    if (!activity || !activity.label) return
    
    try {
      const res = await fetch(`${API_URL}/api/transforming-interview/${id}/suggest-decomposition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_label: activity.label })
      })
      
      if (res.ok) {
        const data = await res.json()
        // Créer les sous-activités suggérées
        data.suggestions.forEach((suggestion: string, index: number) => {
          const newActivity: Activity = {
            id: crypto.randomUUID(),
            label: suggestion,
            description: '',
            parent_id: activityId,
            children_ids: [],
            level: activity.level + 1,
            who: [],
            tools: [],
            order: index,
          }
          setActivities(prev => [...prev, newActivity])
          setActivities(prev => prev.map(a => 
            a.id === activityId 
              ? { ...a, children_ids: [...a.children_ids, newActivity.id] }
              : a
          ))
        })
      }
    } catch (err) {
      console.error('Error getting decomposition suggestions:', err)
    }
  }

  const getRootActivities = () => {
    return activities.filter(a => a.level === 1 && !a.parent_id).sort((a, b) => a.order - b.order)
  }

  const getChildActivities = (parentId: string) => {
    return activities.filter(a => a.parent_id === parentId).sort((a, b) => a.order - b.order)
  }

  const addActor = () => {
    setActors([...actors, {
      id: crypto.randomUUID(),
      name: '',
      type: 'personne',
      activities: []
    }])
  }

  const updateActor = (id: string, field: keyof Actor, value: any) => {
    setActors(actors.map(a => a.id === id ? { ...a, [field]: value } : a))
  }

  const removeActor = (id: string) => {
    setActors(actors.filter(a => a.id !== id))
  }

  const addFlow = () => {
    setFlows([...flows, {
      id: crypto.randomUUID(),
      source_activity_id: '',
      target_activity_id: '',
      type: 'PUIS'
    }])
  }

  const updateFlow = (id: string, field: keyof ActivityFlow, value: any) => {
    setFlows(flows.map(f => f.id === id ? { ...f, [field]: value } : f))
  }

  const removeFlow = (id: string) => {
    setFlows(flows.filter(f => f.id !== id))
  }

  const addPainPoint = () => {
    setPainPoints([...painPoints, {
      id: crypto.randomUUID(),
      description: '',
      related_activities: [],
      impact: 'temps_perdu',
      severity: 'MEDIUM'
    }])
  }

  const updatePainPoint = (id: string, field: keyof PainPoint, value: any) => {
    setPainPoints(painPoints.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removePainPoint = (id: string) => {
    setPainPoints(painPoints.filter(p => p.id !== id))
  }

  const isStepValid = (stepNum: Step): boolean => {
    switch (stepNum) {
      case 1: return perimeter.trim().length >= 5 && objective.trim().length >= 5
      case 2: return activities.length > 0 && activities.every(a => a.label.trim().length > 0)
      case 3: return actors.length > 0 && actors.every(a => a.name.trim().length > 0)
      case 4: return true // Optionnel
      case 5: return true // Récapitulatif
      default: return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const progress = (step / 5) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-600">
              Étape {step} sur 5
            </div>
            <div className="text-sm text-gray-500">
              {Math.round(progress)}% complété
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step 1: Périmètre & Objectif */}
        {step === 1 && (
          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">🎯</span>
                Périmètre & Objectif
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Définissez le périmètre à transformer et l'objectif visé
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Périmètre
                  </label>
                  <Input
                    value={perimeter}
                    onChange={(e) => setPerimeter(e.target.value)}
                    placeholder="Ex: Notre processus de vente"
                    className="text-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Objectif
                  </label>
                  <Textarea
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="Ex: Réduire le temps de traitement de 5 jours à 2 jours"
                    rows={4}
                    className="text-lg"
                  />
                </div>
                
                {showExamples && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-900 mb-2">Exemples</div>
                        <div className="text-sm text-amber-800 mb-2">
                          <strong>Périmètre:</strong> {EXAMPLES[1].perimeter}
                        </div>
                        <div className="text-sm text-amber-800">
                          <strong>Objectif:</strong> {EXAMPLES[1].objective}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Activités */}
        {step === 2 && (
          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">📌</span>
                Activités (avec décomposition récursive)
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Listez les activités principales. Vous pouvez les décomposer en sous-activités.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getRootActivities().map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    activities={activities}
                    onUpdate={(field, value) => updateActivity(activity.id, field, value)}
                    onRemove={() => removeActivity(activity.id)}
                    onDecompose={() => handleDecomposeActivity(activity.id)}
                    getChildren={getChildActivities}
                    onAddChild={() => addActivity(activity.id)}
                    onUpdateChild={(childId, field, value) => updateActivity(childId, field, value)}
                    onRemoveChild={(childId) => removeActivity(childId)}
                  />
                ))}
                
                <Button
                  variant="secondary"
                  onClick={() => addActivity()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une activité principale
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Acteurs */}
        {step === 3 && (
          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">👥</span>
                Acteurs
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Qui participe à ces activités ?
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actors.map((actor) => (
                  <div key={actor.id} className="p-4 border-2 border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Acteur</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeActor(actor.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <Input
                        value={actor.name}
                        onChange={(e) => updateActor(actor.id, 'name', e.target.value)}
                        placeholder="Ex: Conseiller commercial"
                      />
                      <Select
                        value={actor.type}
                        onValueChange={(value) => updateActor(actor.id, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personne">Personne</SelectItem>
                          <SelectItem value="equipe">Équipe</SelectItem>
                          <SelectItem value="systeme">Système</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={actor.role || ''}
                        onChange={(e) => updateActor(actor.id, 'role', e.target.value)}
                        placeholder="Rôle (optionnel)"
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="secondary"
                  onClick={addActor}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un acteur
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Flux & Difficultés */}
        {step === 4 && (
          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">🔄</span>
                Flux & Difficultés
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Définissez les flux entre activités et les difficultés rencontrées (optionnel)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Flux */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Flux entre activités</h3>
                  <div className="space-y-4">
                    {flows.map((flow) => (
                      <div key={flow.id} className="p-4 border-2 border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-gray-700">Flux</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFlow(flow.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            value={flow.source_activity_id}
                            onValueChange={(value) => updateFlow(flow.id, 'source_activity_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                              {activities.filter(a => a.level === 1).map(act => (
                                <SelectItem key={act.id} value={act.id}>{act.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={flow.type}
                            onValueChange={(value) => updateFlow(flow.id, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PUIS">PUIS</SelectItem>
                              <SelectItem value="EN_PARALLELE">EN PARALLÈLE</SelectItem>
                              <SelectItem value="SI_ALORS">SI/ALORS</SelectItem>
                              <SelectItem value="BOUCLE">BOUCLE</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={flow.target_activity_id}
                            onValueChange={(value) => updateFlow(flow.id, 'target_activity_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Cible" />
                            </SelectTrigger>
                            <SelectContent>
                              {activities.filter(a => a.level === 1).map(act => (
                                <SelectItem key={act.id} value={act.id}>{act.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {flow.type === 'SI_ALORS' && (
                            <Input
                              value={flow.condition || ''}
                              onChange={(e) => updateFlow(flow.id, 'condition', e.target.value)}
                              placeholder="Condition"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={addFlow}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un flux
                    </Button>
                  </div>
                </div>

                {/* Difficultés */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Difficultés rencontrées</h3>
                  <div className="space-y-4">
                    {painPoints.map((pain) => (
                      <div key={pain.id} className="p-4 border-2 border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-red-900">Difficulté</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePainPoint(pain.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <Textarea
                            value={pain.description}
                            onChange={(e) => updatePainPoint(pain.id, 'description', e.target.value)}
                            placeholder="Ex: Les délais sont trop longs"
                            rows={2}
                          />
                          <div className="grid grid-cols-2 gap-3">
                            <Select
                              value={pain.impact}
                              onValueChange={(value) => updatePainPoint(pain.id, 'impact', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="temps_perdu">Temps perdu</SelectItem>
                                <SelectItem value="erreurs">Erreurs</SelectItem>
                                <SelectItem value="frustration">Frustration</SelectItem>
                                <SelectItem value="cout">Coût</SelectItem>
                                <SelectItem value="risque">Risque</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={pain.severity}
                              onValueChange={(value) => updatePainPoint(pain.id, 'severity', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HIGH">Élevé</SelectItem>
                                <SelectItem value="MEDIUM">Moyen</SelectItem>
                                <SelectItem value="LOW">Faible</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      onClick={addPainPoint}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter une difficulté
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Vision Globale */}
        {step === 5 && (
          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">✨</span>
                Vision Globale
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Récapitulatif complet de votre interview
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Périmètre & Objectif */}
                <div className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 rounded-lg">
                  <div className="text-sm font-semibold text-purple-900 mb-2">🎯 Périmètre</div>
                  <div className="text-lg font-bold text-purple-700 mb-4">{perimeter || 'Non renseigné'}</div>
                  <div className="text-sm font-semibold text-purple-900 mb-2">🎯 Objectif</div>
                  <div className="text-base text-purple-700">{objective || 'Non renseigné'}</div>
                </div>

                {/* Activités */}
                <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
                  <div className="text-sm font-semibold text-gray-900 mb-3">📌 Activités ({activities.length})</div>
                  <div className="space-y-2">
                    {getRootActivities().map((activity) => (
                      <div key={activity.id} className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="font-semibold">{activity.label}</div>
                        {activity.description && (
                          <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                        )}
                        {getChildActivities(activity.id).length > 0 && (
                          <div className="mt-2 ml-4 space-y-1">
                            {getChildActivities(activity.id).map((child) => (
                              <div key={child.id} className="text-sm text-purple-700">
                                ↳ {child.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acteurs */}
                <div className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                  <div className="text-sm font-semibold text-yellow-900 mb-3">👥 Acteurs ({actors.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {actors.map((actor) => (
                      <div key={actor.id} className="px-3 py-2 bg-white rounded-full text-sm font-medium border border-yellow-300">
                        {actor.name} ({actor.type})
                      </div>
                    ))}
                  </div>
                </div>

                {/* Flux */}
                {flows.length > 0 && (
                  <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="text-sm font-semibold text-blue-900 mb-3">🔄 Flux ({flows.length})</div>
                    <div className="space-y-2">
                      {flows.map((flow) => {
                        const source = activities.find(a => a.id === flow.source_activity_id)
                        const target = activities.find(a => a.id === flow.target_activity_id)
                        return (
                          <div key={flow.id} className="text-sm">
                            <span className="font-semibold">{source?.label || '?'}</span>
                            <span className="mx-2">→</span>
                            <span className="font-semibold">{target?.label || '?'}</span>
                            <span className="ml-2 text-gray-600">({flow.type})</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Difficultés */}
                {painPoints.length > 0 && (
                  <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
                    <div className="text-sm font-semibold text-red-900 mb-3">⚠️ Difficultés ({painPoints.length})</div>
                    <div className="space-y-2">
                      {painPoints.map((pain) => (
                        <div key={pain.id} className="p-3 bg-white rounded-lg border border-red-300">
                          <div className="font-semibold text-red-900">{pain.description}</div>
                          <div className="text-xs text-red-700 mt-1">
                            Impact: {pain.impact} | Sévérité: {pain.severity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Précédent
          </Button>

          <div className="flex gap-3">
            {/* Bouton Finaliser l'interview */}
            <Button
              variant="outline"
              onClick={async () => {
                // Vérifier si c'est une interview conversationnelle
                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/conversational-interview/${id}`)
                  if (res.ok) {
                    router.push(`/interview/conversational/${id}/restitution`)
                  } else {
                    // Si ce n'est pas une interview conversationnelle, rediriger vers la restitution conversationnelle quand même
                    router.push(`/interview/conversational/${id}/restitution`)
                  }
                } catch {
                  // En cas d'erreur, essayer la restitution conversationnelle
                  router.push(`/interview/conversational/${id}/restitution`)
                }
              }}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              Finaliser l'interview
            </Button>

            {step === 5 ? (
              <Button
                onClick={handleSubmit}
                disabled={saving || !isStepValid(1) || !isStepValid(2) || !isStepValid(3)}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                {saving ? 'Soumission...' : 'Soumettre à l\'architecte'}
                <Sparkles className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid(step)}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant ActivityCard pour gérer la décomposition récursive
function ActivityCard({
  activity,
  activities,
  onUpdate,
  onRemove,
  onDecompose,
  getChildren,
  onAddChild,
  onUpdateChild,
  onRemoveChild
}: {
  activity: Activity
  activities: Activity[]
  onUpdate: (field: keyof Activity, value: any) => void
  onRemove: () => void
  onDecompose: () => void
  getChildren: (parentId: string) => Activity[]
  onAddChild: () => void
  onUpdateChild: (id: string, field: keyof Activity, value: any) => void
  onRemoveChild: (id: string) => void
}) {
  const children = getChildren(activity.id)
  
  return (
    <div className="p-4 border-2 border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📌</span>
          <span className="text-sm font-semibold text-gray-700">Activité niveau {activity.level}</span>
        </div>
        <div className="flex gap-2">
          {activity.level === 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDecompose}
              className="text-purple-600 hover:text-purple-700"
            >
              <Search className="w-4 h-4 mr-1" />
              Décomposer
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-3">
        <Input
          value={activity.label}
          onChange={(e) => onUpdate('label', e.target.value)}
          placeholder="Ex: Traiter une commande"
        />
        <Textarea
          value={activity.description || ''}
          onChange={(e) => onUpdate('description', e.target.value)}
          placeholder="Description (optionnel)"
          rows={2}
        />
      </div>
      
      {/* Sous-activités */}
      {children.length > 0 && (
        <div className="mt-4 ml-4 space-y-3 border-l-2 border-purple-200 pl-4">
          {children.map((child) => (
            <div key={child.id} className="p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-purple-700">↳ Sous-activité</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveChild(child.id)}
                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <Input
                value={child.label}
                onChange={(e) => onUpdateChild(child.id, 'label', e.target.value)}
                placeholder="Sous-activité"
                className="text-sm"
              />
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddChild}
            className="w-full text-sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            Ajouter sous-activité
          </Button>
        </div>
      )}
      
      {children.length === 0 && activity.level === 1 && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onAddChild}
          className="mt-3 w-full text-sm"
        >
          <Plus className="w-3 h-3 mr-1" />
          Ajouter sous-activité
        </Button>
      )}
    </div>
  )
}

