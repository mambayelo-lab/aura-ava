'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, MessageSquare, Loader2, Calendar, ArrowRight, Sparkles } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type InterviewSummary = {
  id: string
  perimeter: string
  mode: 'transformation' | 'decision'
  status: 'draft' | 'completed' | 'submitted'
  current_phase: 'discovery' | 'deep_dive' | 'consolidation' | 'completed'
  created_at: string
  activities_count: number
}

export default function ConversationalInterviewListPage() {
  const router = useRouter()
  const [interviews, setInterviews] = useState<InterviewSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadInterviews()
  }, [])

  const loadInterviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/`)
      if (res.ok) {
        const data = await res.json()
        setInterviews(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Failed to load interviews:', error)
      setInterviews([])
    }
  }

  const handleCreateNew = async (mode: 'transformation' | 'decision' = 'transformation') => {
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      })

      if (res.ok) {
        const data = await res.json()
        router.push(`/interview/conversational/${data.id}`)
      } else {
        console.error('Failed to create interview')
        alert('Erreur lors de la création de l\'interview')
      }
    } catch (error) {
      console.error('Error creating interview:', error)
      alert('Erreur de connexion au serveur')
    } finally {
      setCreating(false)
    }
  }

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'discovery': return '1️⃣ Découverte'
      case 'deep_dive': return '2️⃣ Approfondissement'
      case 'consolidation': return '3️⃣ Consolidation'
      case 'completed': return '✅ Terminé'
      default: return phase
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'discovery': return 'bg-blue-100 text-blue-700'
      case 'deep_dive': return 'bg-purple-100 text-purple-700'
      case 'consolidation': return 'bg-green-100 text-green-700'
      case 'completed': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">💬</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview Conversationnelle</h1>
              <p className="text-gray-600">Assistant AURA - Votre consultant digital</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Nouvelle interview Transformation */}
          <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer hover:shadow-xl group">
            <CardContent 
              className="p-8"
              onClick={() => handleCreateNew('transformation')}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Nouvelle Transformation
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Capturer un processus métier existant avec l'assistant AURA
                  </p>
                  <div className="flex items-center gap-2 text-purple-600 font-semibold">
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Création...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Commencer</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nouvelle interview Décision */}
          <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer hover:shadow-xl group">
            <CardContent 
              className="p-8"
              onClick={() => handleCreateNew('decision')}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Nouvelle Décision
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Éclairer une décision métier récurrente avec l'assistant AURA
                  </p>
                  <div className="flex items-center gap-2 text-blue-600 font-semibold">
                    {creating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Création...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Commencer</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interviews existantes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Interviews existantes ({interviews.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <div className="text-lg mb-2">Aucune interview pour le moment</div>
                <div className="text-sm">Créez votre première interview ci-dessus</div>
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all cursor-pointer"
                    onClick={() => router.push(`/interview/conversational/${interview.id}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${
                        interview.mode === 'decision' 
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                          : 'bg-gradient-to-br from-purple-500 to-purple-600'
                      }`}>
                        {interview.mode === 'decision' ? (
                          <MessageSquare className="w-6 h-6" />
                        ) : (
                          <Sparkles className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {interview.perimeter || `Interview ${interview.mode === 'decision' ? 'Décision' : 'Transformation'}`}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getPhaseColor(interview.current_phase)}`}>
                            {getPhaseLabel(interview.current_phase)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(interview.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          <div>
                            {interview.activities_count} activité{interview.activities_count > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">
                      Ouvrir →
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

