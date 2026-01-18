'use client'

import { useState, useEffect, useTransition } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, ChevronLeft, Sparkles, Lightbulb, Plus, Trash2, CheckCircle2, FileText } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

type InfoRequirement = {
  id: string
  label: string
  source: 'manuel' | 'erp' | 'crm' | 'excel' | 'api' | 'database'
}

type BusinessRule = {
  id: string
  type: 'SI_ALORS' | 'TANT_QUE'
  condition: string
  consequence: string
}

type AlertSignal = {
  id: string
  event: string
  action: string
  severity?: 'HIGH' | 'MEDIUM' | 'LOW'
}

const EXAMPLES = {
  1: [
    "Valider ou rejeter une commande client",
    "Approuver un budget de projet",
    "Autoriser une dépense exceptionnelle",
    "Décider d'un recrutement",
    "Choisir un fournisseur"
  ],
  2: [
    "Cette décision impacte directement la trésorerie de l'entreprise",
    "Contraintes réglementaires strictes à respecter",
    "Délai de réponse court (24h maximum)",
    "Impact sur plusieurs départements",
    "Enjeu stratégique pour l'entreprise"
  ],
  4: {
    SI_ALORS: [
      { condition: "montant > 10 000€", consequence: "validation du directeur requise" },
      { condition: "client nouveau", consequence: "vérification des références obligatoire" },
      { condition: "stock disponible", consequence: "confirmer la livraison sous 48h" }
    ],
    TANT_QUE: [
      { condition: "budget non validé", consequence: "bloquer les dépenses" },
      { condition: "documentation incomplète", consequence: "suspendre le processus" },
      { condition: "approbation en attente", consequence: "mettre en pause la commande" }
    ]
  },
  5: [
    { event: "délai dépassé de 2 jours", action: "alerter le manager" },
    { event: "montant supérieur à 50 000€", action: "notifier la direction" },
    { event: "stock en rupture", action: "contacter l'approvisionnement" },
    { event: "réclamation client", action: "escalader au service qualité" }
  ]
}

export default function DecisionInterviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [decision, setDecision] = useState('')
  const [context, setContext] = useState('')
  const [infos, setInfos] = useState<InfoRequirement[]>([])
  const [rules, setRules] = useState<BusinessRule[]>([])
  const [signals, setSignals] = useState<AlertSignal[]>([])
  const [risks, setRisks] = useState('')
  const [showExamples, setShowExamples] = useState(true)

  // Charger l'interview au montage
  useEffect(() => {
    loadInterview()
  }, [id])

  const loadInterview = async () => {
    try {
      const res = await fetch(`${API_URL}/api/decision-interview/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDecision(data.decision || '')
        setContext(data.context || '')
        setInfos(data.infos || [])
        setRules(data.rules || [])
        setSignals(data.signals || [])
        setRisks(data.risks || '')
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
      await fetch(`${API_URL}/api/decision-interview/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          context,
          infos,
          rules,
          signals,
          risks
        })
      })
    } catch (err) {
      console.error('Error saving interview:', err)
    } finally {
      setSaving(false)
    }
  }

  // Sauvegarder automatiquement à chaque changement d'étape
  useEffect(() => {
    if (!loading) {
      saveInterview()
    }
  }, [decision, context, infos, rules, signals, risks])

  const handleNext = () => {
    if (step < 7) {
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
      const res = await fetch(`${API_URL}/api/decision-interview/${id}/submit`, {
        method: 'POST'
      })
      
      if (res.ok) {
        const data = await res.json()
        startTransition(() => {
          router.push(`/interview/${id}/result?compilation=${encodeURIComponent(JSON.stringify(data.compilation))}`)
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

  const addInfo = () => {
    setInfos([...infos, {
      id: crypto.randomUUID(),
      label: '',
      source: 'manuel'
    }])
  }

  const updateInfo = (id: string, field: keyof InfoRequirement, value: any) => {
    setInfos(infos.map(info => info.id === id ? { ...info, [field]: value } : info))
  }

  const removeInfo = (id: string) => {
    setInfos(infos.filter(info => info.id !== id))
  }

  const addRule = (type: 'SI_ALORS' | 'TANT_QUE') => {
    setRules([...rules, {
      id: crypto.randomUUID(),
      type,
      condition: '',
      consequence: ''
    }])
  }

  const updateRule = (id: string, field: keyof BusinessRule, value: any) => {
    setRules(rules.map(rule => rule.id === id ? { ...rule, [field]: value } : rule))
  }

  const removeRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id))
  }

  const addSignal = () => {
    const newSignal: AlertSignal = {
      id: crypto.randomUUID(),
      event: '',
      action: '',
      severity: 'MEDIUM'
    }
    setSignals([...signals, newSignal])
  }

  const updateSignal = (id: string, field: keyof AlertSignal, value: any) => {
    setSignals(prevSignals => 
      prevSignals.map(signal => 
        signal.id === id ? { ...signal, [field]: value } : signal
      )
    )
  }

  const removeSignal = (id: string) => {
    setSignals(signals.filter(signal => signal.id !== id))
  }

  const detectSeverity = (event: string, action: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
    const highKeywords = ['urgent', 'critique', 'bloquant', 'immédiat', 'urgence']
    const lowKeywords = ['information', 'noter', 'suivre']
    
    const text = `${event} ${action}`.toLowerCase()
    
    if (highKeywords.some(kw => text.includes(kw))) return 'HIGH'
    if (lowKeywords.some(kw => text.includes(kw))) return 'LOW'
    return 'MEDIUM'
  }

  const isStepValid = (stepNum: Step): boolean => {
    switch (stepNum) {
      case 1: return decision.trim().length >= 10
      case 2: return context.trim().length >= 10
      case 3: return infos.length > 0 && infos.every(i => i.label.trim().length > 0)
      case 4: return rules.length > 0 && rules.every(r => r.condition.trim().length > 0 && r.consequence.trim().length > 0)
      case 5: return signals.length > 0 && signals.every(s => s.event.trim().length > 0 && s.action.trim().length > 0)
      case 6: return true // Optionnel
      case 7: return true // Récapitulatif
      default: return false
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const progress = (step / 7) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-600">
              Étape {step} sur 7
            </div>
            <div className="text-sm text-gray-500">
              {Math.round(progress)}% complété
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step 1: La Décision */}
        {step === 1 && (
          <Card className="border-2 border-blue-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">🎯</span>
                Quelle décision devez-vous prendre ?
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Décrivez clairement la décision que vous devez prendre
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="Ex: Valider ou rejeter une commande client supérieure à 10 000€"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              />
              
              {showExamples && (
                <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-amber-900 mb-2">Exemples inspirants</div>
                      <ul className="space-y-1">
                        {EXAMPLES[1].map((ex, i) => (
                          <li key={i} className="text-sm text-amber-800">• {ex}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {decision.trim().length >= 10 && (
                <div className="mt-4 flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Décision enregistrée</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Le Contexte */}
        {step === 2 && (
          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">🧭</span>
                Dans quel contexte cette décision se pose ?
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Décrivez le contexte, les enjeux et les contraintes
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ex: Cette décision impacte directement la trésorerie et nécessite une validation rapide"
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg"
              />
              
              {showExamples && (
                <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-amber-900 mb-2">Exemples inspirants</div>
                      <ul className="space-y-1">
                        {EXAMPLES[2].map((ex, i) => (
                          <li key={i} className="text-sm text-amber-800">• {ex}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Les Informations */}
        {step === 3 && (
          <Card className="border-2 border-cyan-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">📊</span>
                Quelles informations vous permettent de décider ?
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Liste les informations nécessaires et leur source
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {infos.map((info) => (
                  <div key={info.id} className="p-4 border-2 border-gray-200 rounded-lg flex gap-4">
                    <div className="flex-1">
                      <Input
                        value={info.label}
                        onChange={(e) => updateInfo(info.id, 'label', e.target.value)}
                        placeholder="Ex: Montant de la commande"
                        className="mb-3"
                      />
                      <Select
                        value={info.source}
                        onValueChange={(value) => updateInfo(info.id, 'source', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manuel">Manuel</SelectItem>
                          <SelectItem value="erp">ERP</SelectItem>
                          <SelectItem value="crm">CRM</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="database">Base de données</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeInfo(info.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  variant="secondary"
                  onClick={addInfo}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une information
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Les Règles */}
        {step === 4 && (
          <Card className="border-2 border-amber-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">⚖️</span>
                Quelles règles guident votre décision ?
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Définissez les règles métier structurées
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 border-2 border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                        {rule.type === 'SI_ALORS' ? 'SI... ALORS...' : 'TANT QUE... ALORS...'}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRule(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {rule.type === 'SI_ALORS' ? 'SI' : 'TANT QUE'}
                        </label>
                        <Input
                          value={rule.condition}
                          onChange={(e) => updateRule(rule.id, 'condition', e.target.value)}
                          placeholder={rule.type === 'SI_ALORS' ? 'Ex: montant > 10 000€' : 'Ex: budget non validé'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">ALORS</label>
                        <Input
                          value={rule.consequence}
                          onChange={(e) => updateRule(rule.id, 'consequence', e.target.value)}
                          placeholder={rule.type === 'SI_ALORS' ? 'Ex: validation du directeur requise' : 'Ex: bloquer les dépenses'}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => addRule('SI_ALORS')}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    + SI/ALORS
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => addRule('TANT_QUE')}
                    className="flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    + TANT QUE
                  </Button>
                </div>
                
                {showExamples && (
                  <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-900 mb-2">Exemples SI/ALORS</div>
                        <ul className="space-y-1 mb-4">
                          {EXAMPLES[4].SI_ALORS.map((ex, i) => (
                            <li key={i} className="text-sm text-amber-800">• SI {ex.condition} ALORS {ex.consequence}</li>
                          ))}
                        </ul>
                        <div className="text-sm font-semibold text-amber-900 mb-2">Exemples TANT QUE</div>
                        <ul className="space-y-1">
                          {EXAMPLES[4].TANT_QUE.map((ex, i) => (
                            <li key={i} className="text-sm text-amber-800">• TANT QUE {ex.condition} ALORS {ex.consequence}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Les Signaux */}
        {step === 5 && (
          <Card className="border-2 border-red-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">🚨</span>
                Quand devez-vous réagir rapidement ?
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Définissez les signaux d'alerte et les actions à prendre
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {signals.map((signal) => {
                  const severity = signal.severity || detectSeverity(signal.event, signal.action)
                  return (
                    <div key={signal.id} className="p-4 border-2 border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                          severity === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {severity}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSignal(signal.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">QUAND</label>
                          <Input
                            value={signal.event}
                            onChange={(e) => {
                              const newEvent = e.target.value
                              setSignals(prevSignals => 
                                prevSignals.map(s => {
                                  if (s.id === signal.id) {
                                    const newSeverity = detectSeverity(newEvent, s.action)
                                    return { ...s, event: newEvent, severity: newSeverity }
                                  }
                                  return s
                                })
                              )
                            }}
                            placeholder="Ex: délai dépassé de 2 jours"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">ALORS</label>
                          <Input
                            value={signal.action}
                            onChange={(e) => {
                              const newAction = e.target.value
                              setSignals(prevSignals => 
                                prevSignals.map(s => {
                                  if (s.id === signal.id) {
                                    const newSeverity = detectSeverity(s.event, newAction)
                                    return { ...s, action: newAction, severity: newSeverity }
                                  }
                                  return s
                                })
                              )
                            }}
                            placeholder="Ex: alerter le manager"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                <Button
                  variant="secondary"
                  onClick={addSignal}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un signal
                </Button>
                
                {showExamples && (
                  <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-900 mb-2">Exemples</div>
                        <ul className="space-y-1">
                          {EXAMPLES[5].map((ex, i) => (
                            <li key={i} className="text-sm text-amber-800">• QUAND {ex.event} ALORS {ex.action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 6: Les Risques */}
        {step === 6 && (
          <Card className="border-2 border-gray-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">⚠️</span>
                Qu'est-ce qui pourrait mal se passer ?
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Optionnel mais aide à anticiper les risques
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={risks}
                onChange={(e) => setRisks(e.target.value)}
                placeholder="Ex: Risque de surcoût, délai non respecté, impact sur la qualité..."
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gray-500 focus:outline-none text-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Step 7: La Vision */}
        {step === 7 && (
          <Card className="border-2 border-green-200 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <span className="text-4xl">✨</span>
                Voici le sens que nous avons construit
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Récapitulatif complet de votre interview
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Décision */}
                <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <div className="text-sm font-semibold text-blue-900 mb-2">🎯 Décision</div>
                  <div className="text-lg font-bold text-blue-700">{decision || 'Non renseigné'}</div>
                </div>

                {/* Contexte */}
                <div className="p-6 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <div className="text-sm font-semibold text-purple-900 mb-2">🧭 Contexte</div>
                  <div className="text-base text-purple-700">{context || 'Non renseigné'}</div>
                </div>

                {/* Informations */}
                <div className="p-6 bg-cyan-50 border-2 border-cyan-200 rounded-lg">
                  <div className="text-sm font-semibold text-cyan-900 mb-3">📊 Informations ({infos.length})</div>
                  <div className="space-y-2">
                    {infos.length > 0 ? infos.map((info) => (
                      <div key={info.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <span className="font-medium">{info.label}</span>
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{info.source}</span>
                      </div>
                    )) : <div className="text-gray-500">Aucune information</div>}
                  </div>
                </div>

                {/* Règles */}
                <div className="p-6 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <div className="text-sm font-semibold text-amber-900 mb-3">⚖️ Règles ({rules.length})</div>
                  <div className="space-y-2">
                    {rules.length > 0 ? rules.map((rule) => (
                      <div key={rule.id} className="p-3 bg-white rounded-lg">
                        <div className="text-xs font-semibold text-amber-700 mb-1">{rule.type}</div>
                        <div className="text-sm">
                          <strong>{rule.type === 'SI_ALORS' ? 'SI' : 'TANT QUE'}</strong> {rule.condition} <strong>ALORS</strong> {rule.consequence}
                        </div>
                      </div>
                    )) : <div className="text-gray-500">Aucune règle</div>}
                  </div>
                </div>

                {/* Signaux */}
                <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="text-sm font-semibold text-red-900 mb-3">🚨 Signaux ({signals.length})</div>
                  <div className="space-y-2">
                    {signals.length > 0 ? signals.map((signal) => (
                      <div key={signal.id} className="p-3 bg-white rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-xs font-semibold text-red-700">QUAND {signal.event}</div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            signal.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                            signal.severity === 'MEDIUM' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {signal.severity}
                          </div>
                        </div>
                        <div className="text-sm"><strong>ALORS</strong> {signal.action}</div>
                      </div>
                    )) : <div className="text-gray-500">Aucun signal</div>}
                  </div>
                </div>

                {/* Risques */}
                {risks && (
                  <div className="p-6 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <div className="text-sm font-semibold text-gray-900 mb-2">⚠️ Risques</div>
                    <div className="text-base text-gray-700">{risks}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 gap-4">
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
            {/* Bouton Visualiser la restitution */}
            <Button
              variant="outline"
              onClick={() => router.push(`/interview/${id}/result`)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Visualiser la restitution
            </Button>

            {/* Bouton Finaliser l'interview */}
            <Button
              variant="outline"
              onClick={async () => {
                // Vérifier si c'est une interview conversationnelle
                try {
                  const res = await fetch(`${API_URL}/api/conversational-interview/${id}`)
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

            {/* Bouton Finaliser et Compiler */}
            {step === 7 ? (
              <Button
                onClick={handleSubmit}
                disabled={saving || !isStepValid(1) || !isStepValid(2) || !isStepValid(3) || !isStepValid(4) || !isStepValid(5)}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                {saving ? 'Compilation...' : 'Finaliser et Compiler'}
                <Sparkles className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!isStepValid(step)}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
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
