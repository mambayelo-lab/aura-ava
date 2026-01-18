'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle, XCircle, Database, PlusCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type MatchedFact = {
  label: string
  status: 'matched' | 'similar'
  confidence: number
  source?: any
  similar_to?: string
}

export default function FactResolutionPage() {
  const { id } = useParams()
  const router = useRouter()
  const interviewId = id as string
  
  const [requiredFacts, setRequiredFacts] = useState<string[]>([])
  const [matched, setMatched] = useState<MatchedFact[]>([])
  const [gaps, setGaps] = useState<string[]>([])
  const [coverage, setCoverage] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load required facts from compilation result
    fetch(`${API_URL}/api/compilation/${interviewId}`)
      .then(r => {
        if (r.ok) {
          return r.json()
        }
        return null
      })
      .then(data => {
        if (data) {
          // Extraire les faits du Fact Graph
          const facts = data.fact_graph?.nodes
            ?.filter((n: any) => n.type === 'fact')
            .map((n: any) => n.label) || []
          setRequiredFacts(facts)
        }
      })
      .catch(() => {
        // Ignore errors
      })
  }, [interviewId])

  const handleResolve = async () => {
    if (requiredFacts.length === 0) return
    
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/facts/resolve/${interviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ required_facts: requiredFacts })
      })
      if (res.ok) {
        const data = await res.json()
        setMatched(data.matched || [])
        setGaps(data.gaps || [])
        setCoverage(data.coverage || 0)
      }
    } catch (err) {
      console.error('Error resolving facts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEnrich = async (factLabel: string) => {
    try {
      const res = await fetch(`${API_URL}/api/facts/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fact_label: factLabel,
          source_info: {
            system: "Manual Entry",
            type: "manual",
            status: "pending_validation"
          }
        })
      })
      if (res.ok) {
        // Reload resolution
        handleResolve()
      }
    } catch (err) {
      console.error('Error enriching inventory:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#000] mb-2">
            Résolution des faits
          </h1>
          <p className="text-[#666]">
            Lier les faits de votre décision aux sources connues de l'Inventory
          </p>
        </div>

        {/* Coverage Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#3b82f6] mb-1">
                {requiredFacts.length}
              </div>
              <div className="text-sm text-[#666]">Faits requis</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#22c55e] mb-1">
                {matched.length}
              </div>
              <div className="text-sm text-[#666]">Faits trouvés</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-[#ef4444] mb-1">
                {gaps.length}
              </div>
              <div className="text-sm text-[#666]">Gaps</div>
            </CardContent>
          </Card>
        </div>

        {/* Resolve Button */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-[#000] mb-1">
                  Résoudre les faits
                </h3>
                <p className="text-sm text-[#666]">
                  Rechercher les faits dans l'Inventory existant
                </p>
              </div>
              <Button 
                onClick={handleResolve} 
                disabled={loading || requiredFacts.length === 0}
                variant="primary"
              >
                {loading ? 'Résolution...' : '🔍 Résoudre'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {matched.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                Faits trouvés ({matched.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matched.map((fact, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-[#dcfce7] border border-[#22c55e] rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-[#000]">
                        {fact.label}
                      </div>
                      {fact.status === 'similar' && (
                        <div className="text-sm text-[#666] mt-1">
                          Similaire à : {fact.similar_to}
                        </div>
                      )}
                      {fact.source && (
                        <div className="text-sm text-[#666] mt-1">
                          Source : {fact.source.system || 'Unknown'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-semibold text-[#22c55e]">
                        {Math.round(fact.confidence * 100)}% match
                      </div>
                      <Database className="w-5 h-5 text-[#22c55e]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gaps */}
        {gaps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#f59e0b]" />
                Faits manquants ({gaps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gaps.map((gap, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-[#fef3c7] border border-[#f59e0b] rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-[#000]">{gap}</div>
                      <div className="text-sm text-[#666] mt-1">
                        Absent de l'Inventory - Enrichissement nécessaire
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEnrich(gap)}
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Enrichir
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {requiredFacts.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-[#f59e0b] mx-auto mb-4" />
              <p className="text-[#666]">Aucun fait requis trouvé dans la compilation.</p>
              <p className="text-sm text-[#666] mt-2">
                Compilez d'abord l'interview pour identifier les faits nécessaires.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="secondary"
            onClick={() => router.push(`/interview/${interviewId}/result`)}
          >
            ← Retour
          </Button>
          <Button
            onClick={() => router.push(`/architect`)}
            disabled={coverage < 0.8}
            variant="primary"
          >
            Continuer (couverture: {Math.round(coverage * 100)}%) →
          </Button>
        </div>
      </div>
    </div>
  )
}

