'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, Check, Edit2, Plus, ArrowRight, Loader2, CheckCircle2, Info, AlertCircle, Clock, Activity, FileText, Users, Settings, X } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Message = {
  role: 'assistant' | 'user'
  content: string
  timestamp: string
}

type Activity = {
  id: string
  label: string
  validated: boolean
  trigger_event?: string
  trigger_actor?: string
  trigger_actor_type?: string
  trigger_system?: string
  output_object?: string
  output_system?: string
  performed_by?: string
  performed_by_type?: string
}

type BusinessObject = {
  id: string
  name: string
  attributes: string[]
  created_by_activity?: string
  source_system?: string
}

type Phase = 'discovery' | 'deep_dive' | 'consolidation' | 'completed'

const DEEP_DIVE_SEQUENCE = [
  'trigger',
  'output', 
  'attributes',
  'actor',
  'rules',
  'signals',
  'pain_points'
]

export default function ConversationalInterviewPage() {
  const { id } = useParams()
  const router = useRouter()
  
  const [interview, setInterview] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('discovery')
  const [activities, setActivities] = useState<Activity[]>([])
  const [businessObjects, setBusinessObjects] = useState<BusinessObject[]>([])
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [currentQuestionKey, setCurrentQuestionKey] = useState<string | null>(null)
  const [initialMessageValidated, setInitialMessageValidated] = useState(false)
  const [activityInputs, setActivityInputs] = useState<string[]>(['', '', '', ''])
  
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  useEffect(() => {
    if (id) {
      loadInterview()
    }
  }, [id])
  
  useEffect(() => {
    if (!loading) {
      textareaRef.current?.focus()
    }
  }, [loading, messages])
  
  const loadInterview = async () => {
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/${id}`)
      if (res.ok) {
        const data = await res.json()
        setInterview(data)
        const validMessages = (data.messages || []).filter(
          (msg: any) => msg && msg.role && msg.content
        )
        setMessages(validMessages)
        setPhase(data.current_phase || 'discovery')
        setActivities(data.activities || [])
        setBusinessObjects(data.business_objects || [])
        setCurrentActivityIndex(data.current_activity_index || 0)
        setCurrentQuestionIndex(data.current_question_index || 0)
      }
    } catch (error) {
      console.error('Failed to load interview:', error)
    }
  }
  
  const handleSendMessage = async () => {
    if (!userInput.trim() || loading) return
    
    setLoading(true)
    
    try {
      if (phase === 'discovery') {
        const res = await fetch(`${API_URL}/api/conversational-interview/${id}/analyze-initial`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userInput })
        })
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: 'Erreur serveur' }))
          const errorMessage = errorData.detail || res.statusText
          
          // Détecter les erreurs d'authentification API
          if (errorMessage.includes('ANTHROPIC_API_KEY') || errorMessage.includes('authentication') || errorMessage.includes('invalid x-api-key') || errorMessage.includes('Service AI non disponible')) {
            const configMessage = `🔑 Configuration de la clé API requise\n\n` +
              `L'application fonctionne actuellement en MODE DÉVELOPPEMENT avec des réponses mockées.\n\n` +
              `Pour utiliser l'API Anthropic réelle :\n\n` +
              `📋 Instructions :\n` +
              `1. Exécutez le script de configuration :\n` +
              `   .\\setup-api-key.ps1\n\n` +
              `2. Ou modifiez manuellement backend/.env avec votre clé API\n\n` +
              `3. Redémarrez le serveur backend\n\n` +
              `Obtenez votre clé sur : https://console.anthropic.com/\n\n` +
              `Note : L'application continue de fonctionner en mode développement même sans clé API.`
            
            // En mode développement, on continue avec des réponses mockées
            // On affiche juste un avertissement informatif
            console.warn("Mode développement actif - Réponses mockées utilisées")
            
            // Ne pas bloquer l'application, juste informer
            if (res.status === 503) {
              // Service non disponible - on peut continuer en mode mock
              alert(configMessage)
            } else {
              alert(configMessage)
            }
          } else {
            alert(`Erreur: ${errorMessage}`)
          }
          
          // Ne pas throw si c'est juste une erreur d'API key en mode dev
          if (res.status === 503 && errorMessage.includes('ANTHROPIC_API_KEY')) {
            // Continuer avec des réponses mockées
            return
          }
          
          throw new Error(errorMessage)
        }
        
        const data = await res.json()
        
        setMessages(prev => [
          ...prev,
          { role: 'user' as const, content: userInput, timestamp: new Date().toISOString() }
        ])
        
        if (data.message && data.message.role && data.message.content) {
          setMessages(prev => [...prev, data.message])
        }
        
        if (data.activities && Array.isArray(data.activities)) {
          setActivities(data.activities)
          await loadInterview()
        }
        
      } else if (phase === 'deep_dive') {
        const res = await fetch(`${API_URL}/api/conversational-interview/${id}/answer-deep-dive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: userInput })
        })
        
        const data = await res.json()
        
        // Ne pas ajouter le message utilisateur ici - il est déjà ajouté par le backend
        // Éviter la duplication
        
        // Stocker les données extraites pour validation
        if (data.extracted_data) {
          setExtractedData(data.extracted_data)
          setCurrentQuestionKey(data.current_question_key)
        }
        
        if (data.message && data.message.role && data.message.content) {
          setMessages(prev => [...prev, data.message])
        }
        setPhase(data.phase)
        
        if (data.interview) {
          setInterview(data.interview)
          setActivities(data.interview.activities || [])
          setBusinessObjects(data.interview.business_objects || [])
        } else {
          await loadInterview()
        }
      }
      
      setUserInput('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleValidateActivity = async (activityId: string) => {
    try {
      await fetch(`${API_URL}/api/conversational-interview/${id}/validate-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId })
      })
      
      setActivities(prev => prev.map(act => 
        act.id === activityId ? { ...act, validated: true } : act
      ))
    } catch (error) {
      console.error('Failed to validate:', error)
    }
  }
  
  const handleValidateAllActivities = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/${id}/validate-all-activities`, {
        method: 'POST'
      })
      const data = await res.json()
      setMessages(prev => {
        if (data.message && data.message.role && data.message.content) {
          return [...prev, data.message]
        }
        return prev
      })
      setPhase('deep_dive')
      await loadInterview()
    } catch (error) {
      console.error('Failed to validate all:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpdateActivity = async (activityId: string, field: string, value: string) => {
    setActivities(prev => prev.map(act => 
      act.id === activityId ? { ...act, [field]: value } : act
    ))
    
    try {
      await fetch(`${API_URL}/api/conversational-interview/${id}/update-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: activityId,
          updates: { [field]: value }
        })
      })
      await loadInterview()
    } catch (error) {
      console.error('Failed to update activity:', error)
      await loadInterview()
    }
  }
  
  const handleAddActivity = async () => {
    const label = prompt("Label de la nouvelle activité :")
    if (!label) return
    
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/${id}/add-activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      })
      
      if (res.ok) {
        await loadInterview()
      }
    } catch (error) {
      console.error('Failed to add activity:', error)
    }
  }
  
  const handleValidateExtractedData = async () => {
    if (!extractedData || !currentQuestionKey) return
    
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/${id}/validate-extracted-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_key: currentQuestionKey,
          extracted_data: extractedData
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setExtractedData(null)
        setCurrentQuestionKey(null)
        setPhase(data.phase)
        if (data.interview) {
          setInterview(data.interview)
          setActivities(data.interview.activities || [])
          setBusinessObjects(data.interview.business_objects || [])
        } else {
          await loadInterview()
        }
        if (data.message && data.message.role && data.message.content) {
          setMessages(prev => [...prev, data.message])
        }
      }
    } catch (error) {
      console.error('Failed to validate extracted data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSkipExtractedData = async () => {
    // Passer à la question suivante sans valider
    setExtractedData(null)
    setCurrentQuestionKey(null)
    await loadInterview()
  }
  
  const handleFinishInterview = async () => {
    if (!confirm("Terminer l'interview ? Vous pourrez toujours la modifier ensuite.")) return
    
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/${id}/finish`, {
        method: 'POST'
      })
      if (res.ok) {
        await loadInterview()
        setPhase('completed')
        // Rediriger vers la page de restitution de l'atelier (données collectées)
        router.push(`/interview/conversational/${id}/restitution`)
      }
    } catch (error) {
      console.error('Failed to finish interview:', error)
      alert('Erreur lors de la finalisation de l\'interview')
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpdateNotes = async (notes: string) => {
    try {
      await fetch(`${API_URL}/api/conversational-interview/${id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      })
    } catch (error) {
      console.error('Failed to update notes:', error)
    }
  }
  
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/${id}/submit`, {
        method: 'POST'
      })
      if (res.ok) {
        // Rediriger vers la page de résultat
        router.push(`/interview/${id}/result`)
      }
    } catch (error) {
      console.error('Failed to submit:', error)
      alert('Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }
  
  const handleViewGlobalRestitution = () => {
    // Rediriger vers la page de restitution de l'atelier (données collectées)
    router.push(`/interview/conversational/${id}/restitution`)
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }
  
  const allActivitiesValidated = activities.length > 0 && activities.every(act => act.validated)
  
  if (!interview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
  
  // Calculer la progression
  const getProgress = () => {
    if (phase === 'discovery') {
      return activities.length > 0 ? (activities.filter(a => a.validated).length / activities.length) * 50 : 0
    } else if (phase === 'deep_dive') {
      const totalQuestions = activities.length * 7
      const completedQuestions = (interview.current_activity_index || 0) * 7 + (interview.current_question_index || 0)
      return 50 + (completedQuestions / totalQuestions) * 40
    } else if (phase === 'consolidation') {
      return 90
    }
    return 100
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex h-screen">
        {/* SIDEBAR LEFT: Timeline & Restitution Progressive */}
        <div className="w-80 bg-white border-r-2 border-gray-200 flex flex-col">
          {/* Header Sidebar */}
          <div className="p-4 border-b-2 border-gray-200">
            <h2 className="font-bold text-lg text-gray-900 mb-2">📊 Restitution</h2>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {Math.round(getProgress())}% complété
            </div>
          </div>
          
          {/* Timeline */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Phase Discovery */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${phase === 'discovery' ? 'bg-blue-600' : 'bg-green-600'}`} />
                  <span className="text-sm font-semibold text-gray-900">1. Découverte</span>
                </div>
                {activities.length > 0 && (
                  <div className="ml-5 space-y-2">
                    {activities.map((act, idx) => (
                      <div key={act.id} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 ${act.validated ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={act.validated ? 'text-gray-900' : 'text-gray-500'}>
                          {act.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Phase Deep Dive */}
              {phase !== 'discovery' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${phase === 'deep_dive' ? 'bg-purple-600' : 'bg-green-600'}`} />
                    <span className="text-sm font-semibold text-gray-900">2. Approfondissement</span>
                  </div>
                  {activities.length > 0 && interview?.current_activity_index !== undefined && (
                    <div className="ml-5 space-y-2">
                      {activities.slice(0, interview.current_activity_index + 1).map((act, idx) => (
                        <div key={act.id} className="text-sm">
                          <div className="font-medium text-gray-900 mb-1">{act.label}</div>
                          {act.trigger_event && (
                            <div className="text-xs text-gray-600 ml-4">🔥 {act.trigger_event}</div>
                          )}
                          {act.output_object && (
                            <div className="text-xs text-gray-600 ml-4">
                              ✨ {businessObjects.find(o => o.id === act.output_object)?.name || 'Objet'}
                            </div>
                          )}
                          {act.performed_by && (
                            <div className="text-xs text-gray-600 ml-4">
                              👤 {interview.actors?.find((a: any) => a.id === act.performed_by)?.name || 'Acteur'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Phase Consolidation */}
              {phase === 'consolidation' && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <span className="text-sm font-semibold text-gray-900">3. Consolidation</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="mt-6 pt-6 border-t-2 border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">Activités</span>
                  </div>
                  <span className="font-bold text-gray-900">{activities.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-700">Objets métier</span>
                  </div>
                  <span className="font-bold text-gray-900">{businessObjects.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-gray-700">Acteurs</span>
                  </div>
                  <span className="font-bold text-gray-900">{interview.actors?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-orange-600" />
                    <span className="text-gray-700">Règles</span>
                  </div>
                  <span className="font-bold text-gray-900">{interview.rules?.length || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Bouton Visualiser restitution globale */}
            {(phase === 'consolidation' || phase === 'completed') && (
              <div className="p-4 border-t-2 border-gray-200">
                <Button
                  onClick={handleViewGlobalRestitution}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Visualiser la restitution globale
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* MAIN CONTENT: Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b-2 border-gray-200 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">💬</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interview Conversationnelle</h1>
                <p className="text-gray-600 text-sm">Assistant AURA - Votre consultant digital</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                phase === 'discovery' ? 'bg-blue-100 text-blue-700' :
                phase === 'deep_dive' ? 'bg-purple-100 text-purple-700' :
                phase === 'consolidation' ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {phase === 'discovery' && '1️⃣ Découverte'}
                {phase === 'deep_dive' && '2️⃣ Approfondissement'}
                {phase === 'consolidation' && '3️⃣ Consolidation'}
                {phase === 'completed' && '✅ Terminé'}
              </div>
            </div>
          </div>
          
          {/* Chat Area */}
          {phase !== 'consolidation' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                {/* MESSAGES - AFFICHÉS EN PREMIER */}
                {messages
                  .filter((msg): msg is Message => msg != null && msg.role != null && msg.content != null)
                  .map((msg, idx, filteredMessages) => {
                    // Trouver le dernier message assistant dans la liste filtrée
                    const lastAssistantIdx = filteredMessages.map((m, i) => ({ msg: m, idx: i }))
                      .filter(({ msg }) => msg.role === 'assistant')
                      .pop()?.idx
                    const isLastAssistantMessage = msg.role === 'assistant' && idx === lastAssistantIdx
                    const showReformulationAfter = isLastAssistantMessage && phase === 'deep_dive' && extractedData && currentQuestionKey
                    
                    return (
                      <div key={idx}>
                        <div
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] p-4 rounded-2xl shadow-md ${
                            msg.role === 'user' 
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm' 
                              : 'bg-white text-gray-900 border-2 border-gray-100 rounded-tl-sm'
                          }`}>
                            <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</div>
                            <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                              {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        </div>
                        
                        {/* REFORMULATION ET VALIDATION - AFFICHÉE JUSTE APRÈS LA DERNIÈRE QUESTION */}
                        {showReformulationAfter && (
                          <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 shadow-xl">
                            <div className="flex items-center gap-3 mb-4">
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                              <div className="font-bold text-green-900">
                                ✨ Reformulation avec concepts métier
                              </div>
                            </div>
                            
                            {/* Reformulation principale */}
                            {extractedData.reformulated_text && (
                              <div className="mb-4 p-3 bg-white border-2 border-green-300 rounded-lg">
                                <label className="text-xs font-semibold text-gray-700 mb-2 block">
                                  {currentQuestionKey === 'trigger' && '🔥 Déclencheur reformulé :'}
                                  {currentQuestionKey === 'output' && '✨ Produit/Objet reformulé :'}
                                  {currentQuestionKey === 'attributes' && '📋 Attributs reformulés :'}
                                  {currentQuestionKey === 'actor' && '👤 Acteur reformulé :'}
                                  {currentQuestionKey === 'rules' && '⚖️ Règle métier reformulée :'}
                                  {currentQuestionKey === 'signals' && '🚨 Signal reformulé :'}
                                  {currentQuestionKey === 'pain_points' && '⚠️ Point de friction reformulé :'}
                                </label>
                                <Input 
                                  value={extractedData.reformulated_text || ''} 
                                  onChange={(e) => setExtractedData({...extractedData, reformulated_text: e.target.value})} 
                                  className="mt-1 border-2 border-green-300 focus:border-green-500 bg-white"
                                  placeholder="Reformulation avec concepts métier..."
                                />
                              </div>
                            )}
                            
                            <div className="space-y-3 mb-4">
                              {currentQuestionKey === 'trigger' && (
                                <>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Déclencheur</label>
                                    <Input 
                                      value={extractedData.trigger_event || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, trigger_event: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500" 
                                      placeholder="Saisissez le déclencheur"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Acteur déclencheur</label>
                                    <Input 
                                      value={extractedData.trigger_actor || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, trigger_actor: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez l'acteur déclencheur"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Système</label>
                                    <Input 
                                      value={extractedData.trigger_system || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, trigger_system: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez le système"
                                    />
                                  </div>
                                </>
                              )}
                              {currentQuestionKey === 'output' && (
                                <>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Objet métier (inféré depuis la reformulation)</label>
                                    <Input 
                                      value={extractedData.business_object || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, business_object: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Objet métier inféré..."
                                      readOnly
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Système</label>
                                    <Input 
                                      value={extractedData.output_system || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, output_system: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez le système"
                                    />
                                  </div>
                                </>
                              )}
                              {currentQuestionKey === 'actor' && (
                                <>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Nom (acteur ou système)</label>
                                    <Input 
                                      value={extractedData.name || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, name: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez le nom de l'acteur ou du système"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Type</label>
                                    <Select
                                      value={extractedData.type || 'personne'}
                                      onValueChange={(value) => setExtractedData({...extractedData, type: value})}
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
                                  </div>
                                </>
                              )}
                              {currentQuestionKey === 'rules' && (
                                <>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Condition</label>
                                    <Input 
                                      value={extractedData.condition || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, condition: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez la condition"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Action</label>
                                    <Input 
                                      value={extractedData.action || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, action: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez l'action"
                                    />
                                  </div>
                                </>
                              )}
                              {currentQuestionKey === 'signals' && (
                                <>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Événement</label>
                                    <Input 
                                      value={extractedData.event || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, event: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez l'événement"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Action</label>
                                    <Input 
                                      value={extractedData.action || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, action: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez l'action"
                                    />
                                  </div>
                                </>
                              )}
                              {currentQuestionKey === 'pain_points' && (
                                <>
                                  <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1 block">Description</label>
                                    <Input 
                                      value={extractedData.description || ''} 
                                      onChange={(e) => setExtractedData({...extractedData, description: e.target.value})} 
                                      className="mt-1 border-2 border-gray-200 focus:border-green-500"
                                      placeholder="Saisissez la description"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={handleValidateExtractedData}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                              >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                Valider et continuer
                              </Button>
                              <Button
                                onClick={handleSkipExtractedData}
                                variant="outline"
                                disabled={loading}
                                className="flex-1"
                              >
                                Ignorer
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                
                {/* MESSAGE INITIAL AVEC BOUTON VALIDATION */}
                {phase === 'discovery' && !initialMessageValidated && messages.length === 1 && messages[0]?.role === 'assistant' && messages[0]?.content.includes('Est-ce que cela vous convient?') && (
                  <div className="flex justify-start">
                    <div className="max-w-[75%] p-4 rounded-2xl shadow-md bg-white text-gray-900 border-2 border-gray-100">
                      <div className="whitespace-pre-wrap leading-relaxed text-sm mb-4">{messages[0].content}</div>
                      <Button
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_URL}/api/conversational-interview/${id}/validate-initial-message`, {
                              method: 'POST'
                            })
                            if (res.ok) {
                              const data = await res.json()
                              setInitialMessageValidated(true)
                              if (data.message) {
                                setMessages(prev => [...prev, data.message])
                              }
                            }
                          } catch (error) {
                            console.error('Failed to validate initial message:', error)
                          }
                        }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Oui, cela me convient
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* SAISIE MANUELLE DES ACTIVITÉS */}
                {phase === 'discovery' && initialMessageValidated && activities.length === 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <div className="font-bold text-blue-900">📝 Saisissez vos activités dans l'ordre</div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {activityInputs.map((input, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <Input
                            value={input}
                            onChange={(e) => {
                              const newInputs = [...activityInputs]
                              newInputs[idx] = e.target.value
                              setActivityInputs(newInputs)
                            }}
                            placeholder={
                              idx === 0 ? "Ex: Recevoir demande client" :
                              idx === 1 ? "Ex: Vérifier disponibilité stock" :
                              idx === 2 ? "Ex: Créer devis client" :
                              "Ex: Valider commande"
                            }
                            className="flex-1 border-2 border-blue-200 focus:border-blue-500 bg-white text-sm placeholder:text-gray-400"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setActivityInputs([...activityInputs, ''])}
                        variant="outline"
                        className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter une activité
                      </Button>
                      <Button
                        onClick={async () => {
                          const validActivities = activityInputs.filter(a => a.trim())
                          if (validActivities.length === 0) {
                            alert('Veuillez saisir au moins une activité')
                            return
                          }
                          
                          setLoading(true)
                          try {
                            const res = await fetch(`${API_URL}/api/conversational-interview/${id}/submit-activities`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ activities: validActivities })
                            })
                            
                            if (!res.ok) {
                              const errorData = await res.json().catch(() => ({ detail: res.statusText }))
                              throw new Error(errorData.detail || `Erreur ${res.status}`)
                            }
                            
                            const data = await res.json()
                            setPhase('deep_dive')
                            setActivities(data.activities || [])
                            if (data.message) {
                              setMessages(prev => [...prev, data.message])
                            }
                            await loadInterview()
                          } catch (error) {
                            console.error('Failed to submit activities:', error)
                            const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la soumission des activités'
                            alert(`Erreur: ${errorMessage}\n\nVérifiez que le serveur backend est démarré sur ${API_URL}`)
                          } finally {
                            setLoading(false)
                          }
                        }}
                        disabled={loading || activityInputs.filter(a => a.trim()).length === 0}
                        className="ml-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Valider les activités
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* REFORMULATIONS DISCOVERY */}
                {phase === 'discovery' && activities.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-purple-600" />
                      <div className="font-bold text-purple-900">🎯 Activités identifiées</div>
                    </div>
                    
                    <div className="space-y-3">
                      {activities.map((act, idx) => (
                        <div key={act.id} className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <Input
                            value={act.label}
                            onChange={(e) => handleUpdateActivity(act.id, 'label', e.target.value)}
                            className="flex-1 border-2 border-purple-200 focus:border-purple-500 bg-white text-sm"
                          />
                          <Button
                            size="sm"
                            variant={act.validated ? "secondary" : "default"}
                            onClick={() => handleValidateActivity(act.id)}
                            className={act.validated ? "bg-green-100 text-green-700 hover:bg-green-200" : "text-xs px-3"}
                          >
                            {act.validated ? <Check className="w-3 h-3" /> : "Valider"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (confirm(`Supprimer l'activité "${act.label}" ?`)) {
                                try {
                                  await fetch(`${API_URL}/api/conversational-interview/${id}/activity/${act.id}`, {
                                    method: 'DELETE'
                                  })
                                  await loadInterview()
                                } catch (error) {
                                  console.error('Failed to delete:', error)
                                }
                              }
                            }}
                            className="text-xs px-3"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {allActivitiesValidated && (
                      <Button
                        onClick={handleValidateAllActivities}
                        disabled={loading}
                        className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 text-sm"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Tout est OK, continuer
                      </Button>
                    )}
                  </div>
                )}
                
                {/* REFORMULATIONS DEEP DIVE */}
                {phase === 'deep_dive' && interview?.current_activity_index !== undefined && interview.current_activity_index < activities.length && !extractedData && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Info className="w-5 h-5 text-amber-600" />
                      <div className="font-bold text-amber-900">
                        🔍 {activities[interview.current_activity_index]?.label}
                      </div>
                      <div className="ml-auto text-xs text-amber-600 font-semibold">
                        Question {interview.current_question_index + 1}/7
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Question 1: Trigger */}
                      {interview.current_question_index >= 0 && activities[interview.current_activity_index]?.trigger_event && (
                        <div className="p-3 bg-white rounded-lg border-2 border-amber-200">
                          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                            🔥 Déclencheur
                          </div>
                          <div className="space-y-2">
                            <Input
                              value={activities[interview.current_activity_index].trigger_event || ''}
                              onChange={(e) => handleUpdateActivity(
                                activities[interview.current_activity_index].id,
                                'trigger_event',
                                e.target.value
                              )}
                              placeholder="Événement"
                              className="border-amber-200 text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                value={activities[interview.current_activity_index].trigger_actor || ''}
                                onChange={(e) => handleUpdateActivity(
                                  activities[interview.current_activity_index].id,
                                  'trigger_actor',
                                  e.target.value
                                )}
                                placeholder="Acteur"
                                className="border-amber-200 text-sm"
                              />
                              <Input
                                value={activities[interview.current_activity_index].trigger_system || ''}
                                onChange={(e) => handleUpdateActivity(
                                  activities[interview.current_activity_index].id,
                                  'trigger_system',
                                  e.target.value
                                )}
                                placeholder="Système"
                                className="border-amber-200 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Question 2: Output */}
                      {interview.current_question_index >= 1 && activities[interview.current_activity_index]?.output_object && (
                        <div className="p-3 bg-white rounded-lg border-2 border-amber-200">
                          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                            ✨ Produit
                          </div>
                          <div className="space-y-2">
                            <Input
                              value={businessObjects.find(o => o.id === activities[interview.current_activity_index].output_object)?.name || ''}
                              placeholder="Objet métier"
                              className="border-amber-200 text-sm"
                              disabled
                            />
                            <Input
                              value={activities[interview.current_activity_index].output_system || ''}
                              onChange={(e) => handleUpdateActivity(
                                activities[interview.current_activity_index].id,
                                'output_system',
                                e.target.value
                              )}
                              placeholder="Système"
                              className="border-amber-200 text-sm"
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Question 3: Attributes */}
                      {interview.current_question_index >= 2 && activities[interview.current_activity_index]?.output_object && (
                        <div className="p-3 bg-white rounded-lg border-2 border-amber-200">
                          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                            📋 Attributs
                          </div>
                          {businessObjects.find(o => o.id === activities[interview.current_activity_index].output_object)?.attributes && businessObjects.find(o => o.id === activities[interview.current_activity_index].output_object)!.attributes.length > 0 && (
                            <div className="space-y-2">
                              {businessObjects.find(o => o.id === activities[interview.current_activity_index].output_object)!.attributes.map((attr, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-amber-600 text-xs">•</span>
                                  <Input
                                    value={attr}
                                    className="flex-1 border-amber-200 text-sm"
                                    disabled
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Question 4: Actor */}
                      {interview.current_question_index >= 3 && activities[interview.current_activity_index]?.performed_by && (
                        <div className="p-3 bg-white rounded-lg border-2 border-amber-200">
                          <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                            👤 Qui réalise
                          </div>
                          <div className="flex gap-2">
                            <Input
                              value={interview.actors?.find((a: any) => a.id === activities[interview.current_activity_index].performed_by)?.name || ''}
                              placeholder="Acteur"
                              className="flex-1 border-amber-200 text-sm"
                              disabled
                            />
                            <div className="w-28">
                              <Select
                                value={activities[interview.current_activity_index].performed_by_type || 'personne'}
                                onValueChange={(value) => handleUpdateActivity(
                                  activities[interview.current_activity_index].id,
                                  'performed_by_type',
                                  value
                                )}
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
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-md">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span className="text-gray-600 text-sm">Analyse en cours...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
              
              {/* Input zone */}
              <div className="border-t-2 border-gray-200 p-4 bg-white">
                <div className="flex gap-3">
                  <Textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Votre réponse..."
                    rows={2}
                    className="flex-1 resize-none border-2 border-gray-200 focus:border-blue-500 text-sm"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Appuyez sur Entrée pour envoyer • Maj+Entrée pour nouvelle ligne
                </div>
                
                {/* Bouton Finaliser l'interview - Toujours visible */}
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleFinishInterview}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Finaliser l'interview
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* PHASE 3: CONSOLIDATION - Vue de synthèse complète */
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <Card className="p-6 border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <div className="flex items-center gap-4 mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">📊 Synthèse de votre processus</h2>
                    <p className="text-gray-600">Vérifiez et modifiez avant de soumettre aux architectes</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                    <div className="text-2xl font-bold text-green-600">{interview.activities?.length || 0}</div>
                    <div className="text-xs text-gray-600">Activités</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">{interview.business_objects?.length || 0}</div>
                    <div className="text-xs text-gray-600">Objets métier</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">{interview.actors?.length || 0}</div>
                    <div className="text-xs text-gray-600">Acteurs</div>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-orange-200">
                    <div className="text-2xl font-bold text-orange-600">{interview.rules?.length || 0}</div>
                    <div className="text-xs text-gray-600">Règles</div>
                  </div>
                </div>
                
                {/* Timeline visuelle */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline processus</h3>
                  <div className="flex items-center gap-3 overflow-x-auto pb-4">
                    {activities.map((act, idx) => (
                      <div key={act.id} className="flex items-center gap-3">
                        <div className="min-w-[180px] p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg">
                          <div className="font-semibold text-sm mb-1">{act.label}</div>
                          {act.trigger_event && (
                            <div className="text-xs opacity-90">🔥 {act.trigger_event}</div>
                          )}
                          {act.performed_by && (
                            <div className="text-xs opacity-90">👤 {interview.actors?.find((a: any) => a.id === act.performed_by)?.name || act.performed_by}</div>
                          )}
                        </div>
                        {idx < activities.length - 1 && (
                          <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Objets métier */}
                {businessObjects.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">📦 Objets Métier</h3>
                    <div className="space-y-3">
                      {businessObjects.map((obj) => (
                        <div key={obj.id} className="p-3 bg-white rounded-lg border-2 border-gray-200">
                          <div className="font-semibold text-gray-900 mb-1">{obj.name}</div>
                          {obj.attributes.length > 0 && (
                            <div className="text-xs text-gray-600">
                              Attributs : {obj.attributes.join(', ')}
                            </div>
                          )}
                          {obj.source_system && (
                            <div className="text-xs text-gray-600 mt-1">
                              Système : {obj.source_system}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAddActivity}
                    variant="outline"
                    className="border-2 border-green-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter activité
                  </Button>
                  
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="ml-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-6"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ArrowRight className="w-5 h-5 mr-2" />}
                    Valider et envoyer aux architectes
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
        
        {/* SIDEBAR RIGHT: Restitution en temps réel */}
        <div className="w-80 bg-white border-l-2 border-gray-200 flex flex-col">
          {/* Header Sidebar Right */}
          <div className="p-4 border-b-2 border-gray-200">
            <h2 className="font-bold text-lg text-gray-900 mb-2">🔄 Restitution en temps réel</h2>
          </div>
          
          {/* Contenu de restitution */}
          <div className="flex-1 overflow-y-auto p-4">
            {phase === 'discovery' && activities.length > 0 && (
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">Macro-activités identifiées</div>
                {activities.map((act, idx) => (
                  <div key={act.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-sm text-gray-900">{act.label}</span>
                    </div>
                    {act.validated && (
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Validée
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {phase === 'deep_dive' && interview?.current_activity_index !== undefined && interview.current_activity_index < activities.length && (
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">Processus en cours</div>
                
                {/* Activité actuelle */}
                <div className="p-4 bg-purple-50 border-2 border-purple-300 rounded-lg">
                  <div className="text-xs font-semibold text-purple-700 mb-2">Activité en cours</div>
                  <div className="font-bold text-sm text-gray-900 mb-3">
                    {activities[interview.current_activity_index]?.label}
                  </div>
                  
                  {/* Question actuelle */}
                  <div className="text-xs text-gray-600 mb-2">
                    Question {interview.current_question_index + 1}/7
                  </div>
                  
                  {/* Détails capturés */}
                  <div className="space-y-2 mt-3">
                    {activities[interview.current_activity_index]?.trigger_event && (
                      <div className="text-xs bg-white p-2 rounded border border-purple-200">
                        <span className="font-semibold text-purple-700">🔥 Déclencheur:</span>{' '}
                        {activities[interview.current_activity_index].trigger_event}
                        {activities[interview.current_activity_index].trigger_actor && ` par ${activities[interview.current_activity_index].trigger_actor}`}
                        {activities[interview.current_activity_index].trigger_system && ` (${activities[interview.current_activity_index].trigger_system})`}
                      </div>
                    )}
                    
                    {activities[interview.current_activity_index]?.output_object && (
                      <div className="text-xs bg-white p-2 rounded border border-purple-200">
                        <span className="font-semibold text-purple-700">✨ Produit:</span>{' '}
                        {businessObjects.find(o => o.id === activities[interview.current_activity_index].output_object)?.name || 'N/A'}
                        {activities[interview.current_activity_index].output_system && ` (${activities[interview.current_activity_index].output_system})`}
                      </div>
                    )}
                    
                    {activities[interview.current_activity_index]?.performed_by && (
                      <div className="text-xs bg-white p-2 rounded border border-purple-200">
                        <span className="font-semibold text-purple-700">👤 Acteur:</span>{' '}
                        {interview.actors?.find((a: any) => a.id === activities[interview.current_activity_index].performed_by)?.name || 'N/A'}
                      </div>
                    )}
                    {/* Afficher les règles métier */}
                    {interview.rules?.filter((r: any) => r.applies_to_activity === activities[interview.current_activity_index]?.id).map((rule: any) => (
                      <div key={rule.id} className="text-xs bg-white p-2 rounded border border-purple-200">
                        <span className="font-semibold text-purple-700">⚖️ Règle:</span>{' '}
                        {rule.condition} → {rule.action}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Activités suivantes */}
                {activities.length > interview.current_activity_index + 1 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Activités suivantes</div>
                    <div className="space-y-2">
                      {activities.slice(interview.current_activity_index + 1, interview.current_activity_index + 4).map((act, idx) => (
                        <div key={act.id} className="p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                          {interview.current_activity_index + idx + 2}. {act.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {phase === 'consolidation' && (
              <div className="space-y-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">Synthèse complète</div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs font-semibold text-green-700 mb-3">Vue d'ensemble</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activités:</span>
                      <span className="font-bold text-gray-900">{activities.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Objets métier:</span>
                      <span className="font-bold text-gray-900">{businessObjects.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Acteurs:</span>
                      <span className="font-bold text-gray-900">{interview.actors?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Règles:</span>
                      <span className="font-bold text-gray-900">{interview.rules?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {phase === 'discovery' && activities.length === 0 && !initialMessageValidated && (
              <div className="text-center text-gray-500 text-sm py-8">
                La restitution apparaîtra ici une fois les activités saisies
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
