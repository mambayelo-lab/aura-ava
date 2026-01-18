'use client'

import { useEffect, useState, useTransition, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Timeline, Step } from '@/components/interview/timeline'
import { FactGraphVisualization } from '@/components/graphs/FactGraphVisualization'
import { ReasoningGraphVisualization } from '@/components/graphs/ReasoningGraphVisualization'
import { useInterviewCache } from '@/lib/hooks/useInterviewCache'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { calculateStepsStatus } from '@/lib/utils/interview-helpers'
import type { CompilationResult } from '@/lib/types/graphs'

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ResultPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const interviewId = id as string
  const [isPending, startTransition] = useTransition()

  const { interview, loading } = useInterviewCache(interviewId)
  const [result, setResult] = useState<CompilationResult | null>(null)
  const [compiling, setCompiling] = useState(false)
  const [loadingResult, setLoadingResult] = useState(true)
  const [isDecisionInterview, setIsDecisionInterview] = useState(false)

  useEffect(() => {
    // Vérifier si des données de compilation sont passées dans l'URL
    const compilationParam = searchParams.get('compilation')
    if (compilationParam) {
      try {
        const compilationData = JSON.parse(decodeURIComponent(compilationParam))
        // Convertir le format decision-interview en format CompilationResult
        const convertedResult: CompilationResult = {
          interview_id: interviewId,
          fact_graph: compilationData.fact_graph || { nodes: [], edges: [] },
          reasoning_graph: compilationData.reasoning_graph || { nodes: [], edges: [] },
          validation: {
            valid: true,
            issues: []
          },
          stats: compilationData.stats || {
            total_nodes: 0,
            total_edges: 0,
            facts: compilationData.stats?.facts_count || 0,
            rules: compilationData.stats?.rules_count || 0,
            signals: compilationData.stats?.signals_count || 0,
            pain_points: 0
          }
        }
        setResult(convertedResult)
        setIsDecisionInterview(true)
        setLoadingResult(false)
        return
      } catch (err) {
        console.error('Error parsing compilation data from URL:', err)
      }
    }
    
    // Sinon, charger depuis l'API
    loadResult()
  }, [interviewId, searchParams])

  const loadResult = async () => {
    setLoadingResult(true)
    try {
      // Essayer d'abord l'API decision-interview
      let res = await fetch(`${API_URL}/api/decision-interview/${interviewId}`)
      if (res.ok) {
        const interviewData = await res.json()
        if (interviewData.status === 'submitted' || interviewData.submitted_at) {
          // L'interview est soumise, récupérer la compilation
          res = await fetch(`${API_URL}/api/decision-interview/${interviewId}/submit`, {
            method: 'POST'
          })
          if (res.ok) {
            const submitData = await res.json()
            const convertedResult: CompilationResult = {
              interview_id: interviewId,
              fact_graph: submitData.compilation.fact_graph || { nodes: [], edges: [] },
              reasoning_graph: submitData.compilation.reasoning_graph || { nodes: [], edges: [] },
              validation: {
                valid: true,
                issues: []
              },
              stats: submitData.compilation.stats || {
                total_nodes: 0,
                total_edges: 0,
                facts: submitData.compilation.stats?.facts_count || 0,
                rules: submitData.compilation.stats?.rules_count || 0,
                signals: submitData.compilation.stats?.signals_count || 0,
                pain_points: 0
              }
            }
            setResult(convertedResult)
            setIsDecisionInterview(true)
            setLoadingResult(false)
            return
          }
        }
      }
      
      // Fallback sur l'ancienne API compilation
      res = await fetch(`${API_URL}/api/compilation/${interviewId}`)
      if (res.ok) {
        const data = await res.json()
        setResult(data)
        setIsDecisionInterview(false)
      }
    } catch (err) {
      // Ignorer les erreurs - le résultat n'existe peut-être pas encore
      console.log('Compilation result not found, will compile on demand')
    } finally {
      setLoadingResult(false)
    }
  }

  const compile = async () => {
    setCompiling(true)
    try {
      // Essayer d'abord l'API decision-interview
      let res = await fetch(`${API_URL}/api/decision-interview/${interviewId}/submit`, {
        method: 'POST'
      })
      
      if (res.ok) {
        const submitData = await res.json()
        const convertedResult: CompilationResult = {
          interview_id: interviewId,
          fact_graph: submitData.compilation.fact_graph || { nodes: [], edges: [] },
          reasoning_graph: submitData.compilation.reasoning_graph || { nodes: [], edges: [] },
          validation: {
            valid: true,
            issues: []
          },
          stats: submitData.compilation.stats || {
            total_nodes: 0,
            total_edges: 0,
            facts: submitData.compilation.stats?.facts_count || 0,
            rules: submitData.compilation.stats?.rules_count || 0,
            signals: submitData.compilation.stats?.signals_count || 0,
            pain_points: 0
          }
        }
        setResult(convertedResult)
        setIsDecisionInterview(true)
      } else {
        // Essayer l'API conversationnelle
        res = await fetch(`${API_URL}/api/conversational-interview/${interviewId}/compile`, {
          method: 'POST'
        })
        if (res.ok) {
          const data = await res.json()
          setResult(data)
          setIsDecisionInterview(false)
        } else {
          // Fallback sur l'ancienne API
          res = await fetch(`${API_URL}/api/compilation/${interviewId}`, {
            method: 'POST'
          })
          if (res.ok) {
            const data = await res.json()
            setResult(data)
            setIsDecisionInterview(false)
          } else {
            console.error('Compilation failed:', res.statusText)
            alert(`Erreur de compilation: ${res.statusText}. Vérifiez que l'interview existe.`)
          }
        }
      }
    } catch (err) {
      console.error('Compilation error:', err)
    } finally {
      setCompiling(false)
    }
  }

  // Hooks doivent être appelés avant tout return conditionnel
  const currentSteps = useMemo(() => {
    return calculateStepsStatus(STEPS, interview, 'submit')
  }, [interview])

  if (loading || loadingResult) {
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

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="max-w-md w-full">
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-center">
                  Compilation non effectuée
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-6">
                  Lancez la compilation pour générer les graphes sémantiques.
                </p>
                <Button
                  onClick={compile}
                  disabled={compiling}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                >
                  {compiling ? 'Compilation en cours...' : '🚀 Compiler l\'interview'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Résultat de compilation
            </h1>
            <p className="text-gray-600 text-lg">
              Graphes sémantiques générés par AVA Compiler
            </p>
          </div>

          {/* Validation Status */}
          <Card className="mb-8 border-2 border-green-200 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {result.validation.valid ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
                    <div>
                      <h3 className="font-semibold text-[#000]">Compilation réussie</h3>
                      <p className="text-sm text-[#666]">Les graphes sont valides et exploitables</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-[#f59e0b]" />
                    <div>
                      <h3 className="font-semibold text-[#000]">Compilation avec avertissements</h3>
                      <p className="text-sm text-[#666]">{result.validation.issues.length} problème(s) détecté(s)</p>
                    </div>
                  </>
                )}
              </div>

              {result.validation.issues.length > 0 && (
                <div className="space-y-2">
                  {result.validation.issues.map((issue: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#fef3c7] border border-[#f59e0b] rounded-lg text-sm text-[#92400e]"
                    >
                      {issue.message}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {result.stats.facts}
                </div>
                <div className="text-sm font-semibold text-gray-700">Faits</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-purple-200 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">
                  {result.stats.rules}
                </div>
                <div className="text-sm font-semibold text-gray-700">Règles</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-orange-200 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {result.stats.signals}
                </div>
                <div className="text-sm font-semibold text-gray-700">Signaux</div>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-red-200 shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {result.stats.pain_points || 0}
                </div>
                <div className="text-sm font-semibold text-gray-700">Points de friction</div>
              </CardContent>
            </Card>
          </div>

          {/* Graphs */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Fact Graph */}
            <Card className="border-2 border-blue-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <span className="text-2xl">📊</span>
                  Graphe de Faits
                </CardTitle>
                <div className="space-y-2 text-sm mt-2">
                  <div className="flex justify-between">
                    <span className="text-[#666]">Nœuds:</span>
                    <span className="font-semibold text-[#000]">{result.fact_graph.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Relations:</span>
                    <span className="font-semibold text-[#000]">{result.fact_graph.edges.length}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FactGraphVisualization data={result.fact_graph} />
              </CardContent>
            </Card>

            {/* Reasoning Graph */}
            <Card className="border-2 border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <span className="text-2xl">⚖️</span>
                  Graphe de Raisonnement
                </CardTitle>
                <div className="space-y-2 text-sm mt-2">
                  <div className="flex justify-between">
                    <span className="text-[#666]">Nœuds:</span>
                    <span className="font-semibold text-[#000]">{result.reasoning_graph.nodes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">Relations:</span>
                    <span className="font-semibold text-[#000]">{result.reasoning_graph.edges.length}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ReasoningGraphVisualization data={result.reasoning_graph} />
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={compile}
              disabled={compiling}
              variant="secondary"
            >
              {compiling ? 'Compilation...' : '🔄 Recompiler'}
            </Button>
            <Button
              onClick={() => {
                startTransition(() => {
                  router.push(`/interview/${interviewId}/mapping`)
                })
              }}
              variant="secondary"
            >
              🗺️ Mapping →
            </Button>
            <Button
              onClick={() => {
                startTransition(() => {
                  router.push(`/interview/${interviewId}/facts-resolution`)
                })
              }}
              variant="secondary"
            >
              🔍 Résolution des faits →
            </Button>
            <Button
              onClick={() => {
                startTransition(() => {
                  router.push(`/ops/${interviewId}`)
                })
              }}
              variant="primary"
            >
              📊 Dashboard Opérationnel →
            </Button>
            <Button
              onClick={() => {
                startTransition(() => {
                  router.push(`/interview/${interviewId}/synthesis`)
                })
              }}
              variant="secondary"
            >
              Voir la synthèse →
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

