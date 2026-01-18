'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Activity, FileText, Users, Settings, AlertCircle, Flame, Sparkles, User, Scale, Bell, Edit2, ArrowRight, Check, X, Plus } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function RestitutionPage() {
  const { id } = useParams()
  const router = useRouter()
  const interviewId = id as string
  
  const [interview, setInterview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<any>(null)

  useEffect(() => {
    loadInterview()
  }, [interviewId])

  const loadInterview = async () => {
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/${interviewId}`)
      if (res.ok) {
        const data = await res.json()
        setInterview(data)
      }
    } catch (error) {
      console.error('Failed to load interview:', error)
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (activity: any) => {
    if (!activity) return
    const currentRules = (interview?.rules || []).filter((r: any) => r.applies_to_activity === activity.id)
    const currentSignals = (interview?.signals || []).filter((s: any) => s.applies_to_activity === activity.id)
    const currentBusinessObjects = interview?.business_objects || []
    const currentActors = interview?.actors || []
    
    setEditFormData({
      ...activity,
      rules: currentRules,
      signals: currentSignals,
      outputObject: currentBusinessObjects.find((o: any) => o.id === activity.output_object),
      performedBy: currentActors.find((a: any) => a.id === activity.performed_by)
    })
    setEditingActivity(activity.id)
  }

  const closeEditModal = () => {
    setEditingActivity(null)
    setEditFormData(null)
  }

  const handleSaveActivity = async () => {
    if (!editFormData || !editingActivity) return
    
    try {
      const updates: any = {
        label: editFormData.label,
        description: editFormData.description,
        trigger_event: editFormData.trigger_event,
        trigger_actor: editFormData.trigger_actor,
        trigger_actor_type: editFormData.trigger_actor_type,
        trigger_system: editFormData.trigger_system,
        output_object: editFormData.output_object,
        output_system: editFormData.output_system,
        performed_by: editFormData.performed_by,
        performed_by_type: editFormData.performed_by_type
      }
      
      await fetch(`${API_URL}/api/conversational-interview/${interviewId}/update-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: editingActivity, updates })
      })
      
      await loadInterview()
      closeEditModal()
    } catch (error) {
      console.error('Failed to update:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  const handleAddRule = () => {
    if (!editFormData) return
    const newRule = {
      id: `rule_${Date.now()}`,
      condition: '',
      action: '',
      type: 'SI_ALORS' as const,
      applies_to_activity: editingActivity
    }
    setEditFormData({
      ...editFormData,
      rules: [...(editFormData.rules || []), newRule]
    })
  }

  const handleAddSignal = () => {
    if (!editFormData) return
    const newSignal = {
      id: `signal_${Date.now()}`,
      event: '',
      action: '',
      severity: 'MEDIUM' as const,
      applies_to_activity: editingActivity
    }
    setEditFormData({
      ...editFormData,
      signals: [...(editFormData.signals || []), newSignal]
    })
  }

  const handleSaveRule = async (rule: any) => {
    try {
      // Vérifier si la règle existe déjà dans l'interview
      const existingRule = rules.find((r: any) => r.id === rule.id)
      
      if (!existingRule || rule.id.includes('_') && rule.id.split('_').length > 2) {
        // Nouvelle règle - créer
        await fetch(`${API_URL}/api/conversational-interview/${interviewId}/add-rule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_id: editingActivity,
            condition: rule.condition,
            action: rule.action,
            type: rule.type
          })
        })
      } else {
        // Règle existante - mettre à jour
        await fetch(`${API_URL}/api/conversational-interview/${interviewId}/update-rule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rule_id: rule.id, updates: rule })
        })
      }
      await loadInterview()
      if (editingActivity) {
        const updatedAct = activities.find((a: any) => a.id === editingActivity)
        if (updatedAct) {
          openEditModal(updatedAct)
        }
      }
    } catch (error) {
      console.error('Failed to save rule:', error)
      alert('Erreur lors de la sauvegarde de la règle')
    }
  }

  const handleSaveSignal = async (signal: any) => {
    try {
      // Vérifier si le signal existe déjà dans l'interview
      const existingSignal = signals.find((s: any) => s.id === signal.id)
      
      if (!existingSignal || (signal.id.includes('_') && signal.id.split('_').length > 2)) {
        // Nouveau signal - créer
        await fetch(`${API_URL}/api/conversational-interview/${interviewId}/add-signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_id: editingActivity,
            event: signal.event,
            action: signal.action,
            severity: signal.severity
          })
        })
      } else {
        // Signal existant - mettre à jour
        await fetch(`${API_URL}/api/conversational-interview/${interviewId}/update-signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signal_id: signal.id, updates: signal })
        })
      }
      await loadInterview()
      if (editingActivity) {
        const updatedAct = activities.find((a: any) => a.id === editingActivity)
        if (updatedAct) {
          openEditModal(updatedAct)
        }
      }
    } catch (error) {
      console.error('Failed to save signal:', error)
      alert('Erreur lors de la sauvegarde du signal')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Supprimer cette règle ?')) return
    try {
      await fetch(`${API_URL}/api/conversational-interview/${interviewId}/delete-rule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_id: ruleId })
      })
      await loadInterview()
      if (editingActivity) {
        const updatedAct = (interview?.activities || []).find((a: any) => a.id === editingActivity)
        if (updatedAct) {
          openEditModal(updatedAct)
        }
      }
    } catch (error) {
      console.error('Failed to delete rule:', error)
      alert('Erreur lors de la suppression de la règle')
    }
  }

  const handleDeleteSignal = async (signalId: string) => {
    if (!confirm('Supprimer ce signal ?')) return
    try {
      await fetch(`${API_URL}/api/conversational-interview/${interviewId}/delete-signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: signalId })
      })
      await loadInterview()
      if (editingActivity) {
        const updatedAct = (interview?.activities || []).find((a: any) => a.id === editingActivity)
        if (updatedAct) {
          openEditModal(updatedAct)
        }
      }
    } catch (error) {
      console.error('Failed to delete signal:', error)
      alert('Erreur lors de la suppression du signal')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#fafafa] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="flex min-h-screen bg-[#fafafa] items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Interview non trouvée</h2>
            <p className="text-gray-600 mb-4">L'interview demandée n'existe pas ou a été supprimée.</p>
            <Button onClick={() => router.push('/interview/conversational')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const activities = interview.activities || []
  const businessObjects = interview.business_objects || []
  const actors = interview.actors || []
  const rules = interview.rules || []
  const signals = interview.signals || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push(`/interview/conversational/${interviewId}`)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'interview
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Restitution de l'Atelier</h1>
          <p className="text-gray-600">Vue d'ensemble complète de ce qui a été collecté</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Activités</div>
                  <div className="text-3xl font-bold text-blue-600">{activities.length}</div>
                </div>
                <Activity className="w-10 h-10 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Objets métier</div>
                  <div className="text-3xl font-bold text-purple-600">{businessObjects.length}</div>
                </div>
                <FileText className="w-10 h-10 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Acteurs</div>
                  <div className="text-3xl font-bold text-green-600">{actors.length}</div>
                </div>
                <Users className="w-10 h-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Règles</div>
                  <div className="text-3xl font-bold text-orange-600">{rules.length}</div>
                </div>
                <Settings className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TIMELINE - Restitution Graphique Compacte */}
        {activities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Timeline du Processus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((act: any, idx: number) => {
                  const triggerActor = act.trigger_actor
                  const performedBy = actors.find((a: any) => a.id === act.performed_by)
                  const outputObj = businessObjects.find((o: any) => o.id === act.output_object)
                  const activityRules = rules.filter((r: any) => r.applies_to_activity === act.id)
                  const activitySignals = signals.filter((s: any) => s.applies_to_activity === act.id)
                  
                  return (
                    <div key={act.id} className="relative">
                      {/* Encadré Activité Compact */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{act.label}</h3>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 flex-wrap">
                                {/* Déclencheur - avec libellé et picto */}
                                {act.trigger_event && (
                                  <span className="flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    <span className="font-semibold">Déclencheur:</span> {act.trigger_event}
                                    {act.trigger_actor && ` par ${act.trigger_actor}`}
                                    {act.trigger_system && ` (${act.trigger_system})`}
                                  </span>
                                )}
                                {/* Acteur réalisateur - avec libellé et picto */}
                                {performedBy && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3 text-green-500" />
                                    <span className="font-semibold">Réalisé par:</span> {performedBy.name}
                                  </span>
                                )}
                                {/* Produit/Objet - avec libellé et picto */}
                                {outputObj && (
                                  <span className="flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-purple-500" />
                                    <span className="font-semibold">Produit:</span> {outputObj.name}
                                    {act.output_system && ` (${act.output_system})`}
                                  </span>
                                )}
                                {/* Règles métier - avec libellé et picto */}
                                {activityRules.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Scale className="w-3 h-3 text-orange-500" />
                                    <span className="font-semibold">Règles:</span> {activityRules.length} règle{activityRules.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {/* Signaux - avec libellé et picto */}
                                {activitySignals.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Bell className="w-3 h-3 text-yellow-500" />
                                    <span className="font-semibold">Signaux:</span> {activitySignals.length} signal{activitySignals.length > 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(act)}
                            className="ml-3 flex-shrink-0"
                          >
                            <Edit2 className="w-4 h-4 mr-1" />
                            Modifier
                          </Button>
                        </div>
                      </div>

                      {/* Flèche vers activité suivante */}
                      {idx < activities.length - 1 && (
                        <div className="flex justify-center my-2">
                          <ArrowRight className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal d'édition complète */}
        {editingActivity && editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">Modifier l'activité</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeEditModal}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Nom de l'activité */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l'activité</label>
                  <Input
                    value={editFormData.label || ''}
                    onChange={(e) => setEditFormData({...editFormData, label: e.target.value})}
                    placeholder="Ex: Recevoir commande client"
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <Textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    placeholder="Description de l'activité..."
                    rows={3}
                    className="w-full"
                  />
                </div>

                {/* Déclencheur - Section avec libellé et picto */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Flame className="w-5 h-5 text-orange-500" />
                    🔥 Déclencheur
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Événement déclencheur</label>
                      <Input
                        value={editFormData.trigger_event || ''}
                        onChange={(e) => setEditFormData({...editFormData, trigger_event: e.target.value})}
                        placeholder="Ex: Email client"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Acteur déclencheur</label>
                      <Input
                        value={editFormData.trigger_actor || ''}
                        onChange={(e) => setEditFormData({...editFormData, trigger_actor: e.target.value})}
                        placeholder="Ex: Client"
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {/* Système déclencheur */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Système déclencheur</label>
                    <Input
                      value={editFormData.trigger_system || ''}
                      onChange={(e) => setEditFormData({...editFormData, trigger_system: e.target.value})}
                      placeholder="Ex: Messagerie, CRM, ERP..."
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Réalisé par - Section avec libellé et picto */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-green-500" />
                    👤 Réalisé par
                  </h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Acteur réalisateur</label>
                    <select
                      value={editFormData.performed_by || ''}
                      onChange={(e) => setEditFormData({...editFormData, performed_by: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Sélectionner un acteur</option>
                      {actors.map((actor: any) => (
                        <option key={actor.id} value={actor.id}>{actor.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Produit/Objet - Section avec libellé et picto */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    ✨ Produit/Objet
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Objet/Événement produit</label>
                      <select
                        value={editFormData.output_object || ''}
                        onChange={(e) => setEditFormData({...editFormData, output_object: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Sélectionner un objet métier</option>
                        {businessObjects.map((obj: any) => (
                          <option key={obj.id} value={obj.id}>{obj.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Système de sortie</label>
                      <Input
                        value={editFormData.output_system || ''}
                        onChange={(e) => setEditFormData({...editFormData, output_system: e.target.value})}
                        placeholder="Ex: CRM, ERP, Excel..."
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Règles métier */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-orange-500" />
                      Règles métier
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddRule}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une règle
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(editFormData.rules || []).map((rule: any, ruleIdx: number) => (
                      <div key={rule.id || ruleIdx} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Condition</label>
                            <Input
                              value={rule.condition || ''}
                              onChange={(e) => {
                                const newRules = [...(editFormData.rules || [])]
                                newRules[ruleIdx] = {...rule, condition: e.target.value}
                                setEditFormData({...editFormData, rules: newRules})
                              }}
                              placeholder="Ex: montant > 5000€"
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Action</label>
                            <Input
                              value={rule.action || ''}
                              onChange={(e) => {
                                const newRules = [...(editFormData.rules || [])]
                                newRules[ruleIdx] = {...rule, action: e.target.value}
                                setEditFormData({...editFormData, rules: newRules})
                              }}
                              placeholder="Ex: validation manager requise"
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <select
                            value={rule.type || 'SI_ALORS'}
                            onChange={(e) => {
                              const newRules = [...(editFormData.rules || [])]
                              newRules[ruleIdx] = {...rule, type: e.target.value}
                              setEditFormData({...editFormData, rules: newRules})
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="SI_ALORS">SI...ALORS</option>
                            <option value="TANT_QUE">TANT QUE</option>
                          </select>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveRule(rule)}
                              className="h-7 text-xs"
                            >
                              <Check className="w-3 h-3 text-green-600 mr-1" />
                              Sauvegarder
                            </Button>
                            {rules.find((r: any) => r.id === rule.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="h-7 text-xs text-red-600"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signaux d'alerte */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Bell className="w-5 h-5 text-yellow-500" />
                      Signaux d'alerte
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddSignal}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un signal
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(editFormData.signals || []).map((signal: any, signalIdx: number) => (
                      <div key={signal.id || signalIdx} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Événement</label>
                            <Input
                              value={signal.event || ''}
                              onChange={(e) => {
                                const newSignals = [...(editFormData.signals || [])]
                                newSignals[signalIdx] = {...signal, event: e.target.value}
                                setEditFormData({...editFormData, signals: newSignals})
                              }}
                              placeholder="Ex: Budget dépassé de 10%"
                              className="w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">Action</label>
                            <Input
                              value={signal.action || ''}
                              onChange={(e) => {
                                const newSignals = [...(editFormData.signals || [])]
                                newSignals[signalIdx] = {...signal, action: e.target.value}
                                setEditFormData({...editFormData, signals: newSignals})
                              }}
                              placeholder="Ex: Alerter manager financier"
                              className="w-full text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <select
                            value={signal.severity || 'MEDIUM'}
                            onChange={(e) => {
                              const newSignals = [...(editFormData.signals || [])]
                              newSignals[signalIdx] = {...signal, severity: e.target.value}
                              setEditFormData({...editFormData, signals: newSignals})
                            }}
                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="LOW">Faible</option>
                            <option value="MEDIUM">Moyen</option>
                            <option value="HIGH">Élevé</option>
                          </select>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveSignal(signal)}
                              className="h-7 text-xs"
                            >
                              <Check className="w-3 h-3 text-green-600 mr-1" />
                              Sauvegarder
                            </Button>
                            {signals.find((s: any) => s.id === signal.id) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteSignal(signal.id)}
                                className="h-7 text-xs text-red-600"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Supprimer
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer avec boutons */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={closeEditModal}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveActivity}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Sauvegarder l'activité
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notes aux architectes */}
        {interview.notes_to_architects && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Note à transmettre aux architectes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{interview.notes_to_architects}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={() => router.push(`/interview/conversational/${interviewId}/result`)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
          >
            Compiler pour l'architecte
          </Button>
        </div>
      </div>
    </div>
  )
}
