'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { FactGraphVisualization } from '@/components/graphs/FactGraphVisualization'
import { ReasoningGraphVisualization } from '@/components/graphs/ReasoningGraphVisualization'
import { CheckCircle2, ArrowLeft, Activity, FileText, Users, Settings, AlertCircle } from 'lucide-react'
import type { CompilationResult } from '@/lib/types/graphs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ConversationalResultPage() {
  const { id } = useParams()
  const router = useRouter()
  const interviewId = id as string
  
  const [interview, setInterview] = useState<any>(null)
  const [result, setResult] = useState<CompilationResult | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const compileInterview = async () => {
    setCompiling(true)
    try {
      const res = await fetch(`${API_URL}/api/conversational-interview/${interviewId}/compile`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
      } else {
        const errorData = await res.json().catch(() => ({ detail: res.statusText }))
        alert(`Erreur de compilation: ${errorData.detail || res.statusText}`)
      }
    } catch (error) {
      console.error('Compilation error:', error)
      alert('Erreur lors de la compilation')
    } finally {
      setCompiling(false)
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Restitution Globale</h1>
          <p className="text-gray-600">Vue d'ensemble complète de votre interview conversationnelle</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Activités</div>
                  <div className="text-3xl font-bold text-blue-600">{interview.activities?.length || 0}</div>
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
                  <div className="text-3xl font-bold text-purple-600">{interview.business_objects?.length || 0}</div>
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
                  <div className="text-3xl font-bold text-green-600">{interview.actors?.length || 0}</div>
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
                  <div className="text-3xl font-bold text-orange-600">{interview.rules?.length || 0}</div>
                </div>
                <Settings className="w-10 h-10 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compilation */}
        {!result && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Compiler l'interview</h3>
                <p className="text-gray-600 mb-6">Générez les graphes sémantiques à partir de votre interview</p>
                <Button
                  onClick={compileInterview}
                  disabled={compiling}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8"
                >
                  {compiling ? 'Compilation en cours...' : 'Compiler l\'interview'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Résultats de compilation */}
        {result && (
          <div className="space-y-8">
            {/* Fact Graph */}
            {result.fact_graph && result.fact_graph.nodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    Graphe de Faits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FactGraphVisualization data={result.fact_graph} />
                </CardContent>
              </Card>
            )}

            {/* Reasoning Graph */}
            {result.reasoning_graph && result.reasoning_graph.nodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    Graphe de Raisonnement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReasoningGraphVisualization data={result.reasoning_graph} />
                </CardContent>
              </Card>
            )}

            {/* Stats de compilation */}
            {result.stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques de compilation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Nœuds totaux</div>
                      <div className="text-2xl font-bold text-blue-600">{result.stats.total_nodes || 0}</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Arêtes totales</div>
                      <div className="text-2xl font-bold text-purple-600">{result.stats.total_edges || 0}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Faits</div>
                      <div className="text-2xl font-bold text-green-600">{result.stats.facts || 0}</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Règles</div>
                      <div className="text-2xl font-bold text-orange-600">{result.stats.rules || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

