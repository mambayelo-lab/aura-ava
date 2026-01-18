'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, MessageCircle, TrendingUp } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Alert = {
  id: string
  label: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
  reason: string
}

export default function OpsDashboardPage() {
  const { id } = useParams()
  const interviewId = id as string
  
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState<string | null>(null)
  const [questionType, setQuestionType] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load active alerts
    fetch(`${API_URL}/api/ops/alerts/${interviewId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setAlerts(data?.alerts || []))
      .catch(() => setAlerts([]))
    
    // Load stats
    fetch(`${API_URL}/api/ops/stats/${interviewId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => setStats(null))
  }, [interviewId])

  const handleAsk = async () => {
    if (!question.trim()) return
    
    setLoading(true)
    setAnswer(null)
    setQuestionType(null)
    
    try {
      const res = await fetch(`${API_URL}/api/ops/ask/${interviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      if (res.ok) {
        const data = await res.json()
        setAnswer(data.answer)
        setQuestionType(data.type)
      }
    } catch (err) {
      console.error('Error asking question:', err)
      setAnswer("Erreur lors de la recherche. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#000] mb-2">
            Dashboard Opérationnel
          </h1>
          <p className="text-[#666]">
            Suivi en temps réel • Réponses déterministes
          </p>
        </div>

        {/* Alerts */}
        {alerts.length === 0 ? (
          <Card className="mb-6">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-[#22c55e]">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Aucune alerte active</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {alerts.map(alert => {
              const severity = alert.severity?.toUpperCase() || 'MEDIUM'
              const isHigh = severity === 'HIGH' || severity === 'CRITICAL'
              const isMedium = severity === 'MEDIUM'
              
              return (
                <Card 
                  key={alert.id} 
                  className={`border-l-4 ${
                    isHigh ? 'border-[#ef4444] bg-[#fee2e2]' :
                    isMedium ? 'border-[#f59e0b] bg-[#fef3c7]' :
                    'border-[#3b82f6] bg-[#dbeafe]'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                        isHigh ? 'text-[#ef4444]' :
                        isMedium ? 'text-[#f59e0b]' :
                        'text-[#3b82f6]'
                      }`} />
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1 text-[#000]">
                          {alert.label}
                        </div>
                        <div className="text-xs text-[#666]">
                          {alert.reason}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Q&A Interface */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Poser une question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !loading) handleAsk()
                  }}
                  placeholder="Ex: Quel est le montant de la commande ?"
                  className="w-full"
                />
                <div className="mt-2 text-xs text-[#666]">
                  💡 Questions supportées : faits, règles, alertes, statut
                </div>
              </div>
              
              <Button
                onClick={handleAsk}
                disabled={!question.trim() || loading}
                variant="primary"
                className="w-full"
              >
                {loading ? 'Recherche...' : '🔍 Obtenir la réponse'}
              </Button>
            </div>

            {answer && (
              <div className="mt-6 p-4 bg-[#dcfce7] border border-[#22c55e] rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#22c55e] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    A
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-[#000] mb-1">
                      Réponse déterministe
                    </div>
                    <div className="text-sm text-[#000] whitespace-pre-line">
                      {answer}
                    </div>
                    {questionType && (
                      <div className="mt-2 text-xs text-[#666]">
                        Type: {questionType}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KPIs */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Indicateurs clés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[#dbeafe] rounded-lg">
                  <div className="text-2xl font-bold text-[#3b82f6] mb-1">
                    {stats.facts_count || 0}
                  </div>
                  <div className="text-sm text-[#666]">Faits disponibles</div>
                </div>
                <div className="p-4 bg-[#f3e8ff] rounded-lg">
                  <div className="text-2xl font-bold text-[#8b5cf6] mb-1">
                    {stats.rules_count || 0}
                  </div>
                  <div className="text-sm text-[#666]">Règles actives</div>
                </div>
                <div className="p-4 bg-[#fef3c7] rounded-lg">
                  <div className="text-2xl font-bold text-[#f59e0b] mb-1">
                    {stats.alerts_count || 0}
                  </div>
                  <div className="text-sm text-[#666]">Alertes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

