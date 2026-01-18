'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  PlusCircle, 
  Brain,
  RefreshCw,
  Calendar,
  ArrowRight,
  BarChart3,
  Trash2,
  TrendingUp,
  Layers
} from 'lucide-react'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type InterviewSummary = {
  id: string
  name: string
  type?: 'decision' | 'transforming'
  compiled_at?: string
  status?: string
}

export default function ArchitectDashboard() {
  const router = useRouter()
  const [interviews, setInterviews] = useState<InterviewSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load conversational interviews
    Promise.all([
      fetch(`${API_URL}/api/conversational-interview/`).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${API_URL}/api/interview/`).then(r => r.ok ? r.json() : []).catch(() => [])
    ]).then(([conversationalData, legacyData]) => {
      const summaries: InterviewSummary[] = []
      
      // Add conversational interviews
      if (Array.isArray(conversationalData)) {
        conversationalData.forEach((i: any) => {
          summaries.push({
            id: i.id,
            name: i.perimeter || 'Interview conversationnelle',
            type: i.mode === 'decision' ? 'decision' : 'transforming',
            compiled_at: i.updated_at,
            status: i.status || 'draft'
          })
        })
      }
      
      // Add legacy interviews (if any)
      if (Array.isArray(legacyData)) {
        legacyData.forEach((i: any) => {
          summaries.push({
            id: i.id,
            name: i.title || i.decisions?.[0]?.label || 'Interview sans nom',
            type: i.type === 'decision' ? 'decision' : 'transforming',
            compiled_at: i.updated_at,
            status: i.validation?.validated_by_user ? 'validated' : 'draft'
          })
        })
      }
      
      setInterviews(summaries)
    }).catch(() => setInterviews([]))
  }, [])

  const handleCreateInterview = async (type: 'decision' | 'transforming') => {
    setLoading(true)
    
    try {
      // Utiliser l'API conversational-interview pour les deux modes
      const mode = type === 'decision' ? 'decision' : 'transformation'
      const res = await fetch(`${API_URL}/api/conversational-interview/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode })
      })
      
      if (res.ok) {
        const data = await res.json()
        router.push(`/interview/conversational/${data.id}`)
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error('Failed to create interview:', errorData)
        alert('Erreur lors de la création de l\'interview')
      }
    } catch (error) {
      console.error('Error creating interview:', error)
      alert('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteInterview = async (interviewId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Empêcher le clic sur la ligne
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette interview ?')) return
    
    try {
      // Essayer de supprimer via l'API conversational-interview
      const res = await fetch(`${API_URL}/api/conversational-interview/${interviewId}`, {
        method: 'DELETE'
      })
      
      if (res.ok || res.status === 404) {
        // Recharger la liste
        setInterviews(prev => prev.filter(i => i.id !== interviewId))
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Error deleting interview:', error)
      // Même en cas d'erreur, retirer de la liste locale
      setInterviews(prev => prev.filter(i => i.id !== interviewId))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fafafa] to-[#f2f2f2]">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#000] mb-2">
            Dashboard Architecte
          </h1>
          <p className="text-[#666] text-lg">
            Pilotez vos interviews décisionnelles et transformations
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Launch Decision Interview - Conversationnelle avec LLM */}
          <Card className="border-2 border-[#0ea5e9] hover:border-[#0284c7] transition-all cursor-pointer hover:shadow-xl group bg-white">
            <CardContent 
              className="p-8"
              onClick={() => !loading && handleCreateInterview('decision')}
            >
              <div className="flex items-start gap-5">
                {/* Logo moderne et sobre pour Decision/BI */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all group-hover:scale-105">
                    <div className="relative">
                      <Brain className="w-10 h-10 text-white" strokeWidth={2} />
                      <TrendingUp className="w-5 h-5 text-white absolute -bottom-1 -right-1 bg-[#0284c7] rounded-full p-0.5" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#0f172a] mb-2">
                    Initiative d'analyse décisionnelle / BI
                  </h3>
                  <p className="text-[#64748b] mb-4 text-sm leading-relaxed">
                    Interview conversationnelle guidée par IA pour structurer vos décisions métier et besoins en Business Intelligence
                  </p>
                  <div className="flex items-center gap-2 text-[#0ea5e9] font-semibold text-sm">
                    <PlusCircle className="w-4 h-4" />
                    <span>Nouvelle initiative</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Launch Transforming Interview - Conversationnelle avec LLM */}
          <Card className="border-2 border-[#8b5cf6] hover:border-[#7c3aed] transition-all cursor-pointer hover:shadow-xl group bg-white">
            <CardContent 
              className="p-8"
              onClick={() => !loading && handleCreateInterview('transforming')}
            >
              <div className="flex items-start gap-5">
                {/* Logo moderne et sobre pour Transforming */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all group-hover:scale-105">
                    <div className="relative">
                      <Layers className="w-10 h-10 text-white" strokeWidth={2} />
                      <RefreshCw className="w-5 h-5 text-white absolute -bottom-1 -right-1 bg-[#7c3aed] rounded-full p-0.5" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#0f172a] mb-2">
                    Interview - Initiative de transformation
                  </h3>
                  <p className="text-[#64748b] mb-4 text-sm leading-relaxed">
                    Interview conversationnelle guidée par IA pour capturer et transformer votre processus métier
                  </p>
                  <div className="flex items-center gap-2 text-[#8b5cf6] font-semibold text-sm">
                    <PlusCircle className="w-4 h-4" />
                    <span>Nouvelle initiative</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#666] mb-1">Total interviews</div>
                  <div className="text-3xl font-bold text-[#000]">
                    {interviews.length}
                  </div>
                </div>
                <BarChart3 className="w-10 h-10 text-[#0ea5e9]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#666] mb-1">Décisionnelles</div>
                  <div className="text-3xl font-bold text-[#0ea5e9]">
                    {interviews.filter(i => i.type === 'decision').length || 0}
                  </div>
                </div>
                <Brain className="w-10 h-10 text-[#0ea5e9]" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#666] mb-1">Transformations</div>
                  <div className="text-3xl font-bold text-[#8b5cf6]">
                    {interviews.filter(i => i.type === 'transforming').length || 0}
                  </div>
                </div>
                <Layers className="w-10 h-10 text-[#8b5cf6]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interviews List */}
        <Card>
          <CardHeader>
            <CardTitle>Interviews récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {interviews.length === 0 ? (
              <div className="text-center py-12 text-[#666]">
                <div className="text-4xl mb-4">📋</div>
                <div className="text-lg mb-2">Aucune interview pour le moment</div>
                <div className="text-sm">Créez votre première interview ci-dessus</div>
              </div>
            ) : (
              <div className="space-y-3">
                {interviews.map(interview => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-4 bg-[#fafafa] hover:bg-[#f2f2f2] rounded-lg border border-[#e5e7eb] transition-all cursor-pointer"
                    onClick={() => {
                      // Vérifier si c'est une interview conversationnelle en vérifiant si elle existe dans l'API
                      fetch(`${API_URL}/api/conversational-interview/${interview.id}`)
                        .then(r => {
                          if (r.ok) {
                            router.push(`/interview/conversational/${interview.id}/result`)
                          } else {
                            router.push(`/interview/${interview.id}/result`)
                          }
                        })
                        .catch(() => {
                          // En cas d'erreur, essayer la route conversationnelle d'abord
                          router.push(`/interview/conversational/${interview.id}/result`)
                        })
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${
                        interview.type === 'decision' 
                          ? 'bg-gradient-to-br from-[#0ea5e9] to-[#0284c7]' 
                          : 'bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed]'
                      }`}>
                        {interview.type === 'decision' ? (
                          <Brain className="w-6 h-6" strokeWidth={2} />
                        ) : (
                          <Layers className="w-6 h-6" strokeWidth={2} />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[#000]">
                          {interview.name}
                        </div>
                        <div className="text-sm text-[#666] flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {interview.compiled_at ? new Date(interview.compiled_at).toLocaleDateString() : 'Non compilé'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => handleDeleteInterview(interview.id, e)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="secondary" size="sm">
                        Voir →
                      </Button>
                    </div>
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
