'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Database } from 'lucide-react'
import { BeautifulGraph } from '@/components/graphs/BeautifulGraph'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type MappingProposal = {
  field: string
  ontology_attribute: string
  confidence: number
  sample_value?: string
  source_name: string
  status?: string
}

export default function MappingPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const interviewId = id as string
  const mode = searchParams.get('mode') || 'decision' // 'decision' or 'transforming'
  
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>("")
  const [proposals, setProposals] = useState<MappingProposal[]>([])
  const [matched, setMatched] = useState<any[]>([])
  const [gaps, setGaps] = useState<string[]>([])
  const [coverage, setCoverage] = useState(0)
  const [graphData, setGraphData] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Load datasets
    fetch(`${API_URL}/api/mapping/datasets`)
      .then(r => {
        if (!r.ok) {
          throw new Error('Failed to fetch datasets')
        }
        return r.json()
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDatasets(data)
        } else {
          setDatasets([])
        }
      })
      .catch(() => setDatasets([]))
    
    // Load graph data
    const graphUrl = mode === 'decision' 
      ? `${API_URL}/api/compilation/${interviewId}`
      : `${API_URL}/api/ontology/${interviewId}`
    
    fetch(graphUrl)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const graph = mode === 'decision' ? data.fact_graph : data
          setGraphData(graph)
        }
      })
      .catch(() => {})
    
    // Load stats
    fetch(`${API_URL}/api/mapping/stats/${interviewId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => setStats(null))
  }, [interviewId, mode])

  const handleResolveInventory = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/api/mapping/resolve/${interviewId}?mode=${mode}`,
        { method: 'POST' }
      )
      if (res.ok) {
        const data = await res.json()
        setMatched(data.matched || [])
        setGaps(data.gaps || [])
        setCoverage(data.coverage || 0)
      }
    } catch (err) {
      console.error('Error resolving inventory:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMapToDataset = async () => {
    if (!selectedDataset) return
    
    setLoading(true)
    try {
      const res = await fetch(
        `${API_URL}/api/mapping/dataset-mapping/${interviewId}?dataset_id=${selectedDataset}&mode=${mode}`,
        { method: 'POST' }
      )
      if (res.ok) {
        const data = await res.json()
        setProposals(data.proposals || [])
      }
    } catch (err) {
      console.error('Error mapping to dataset:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDecision = async (proposal: MappingProposal, decision: 'accept' | 'reject') => {
    try {
      await fetch(`${API_URL}/api/mapping/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interview_id: interviewId,
          dataset_id: selectedDataset,
          field: proposal.field,
          ontology_attribute: proposal.ontology_attribute,
          decision
        })
      })
      
      // Update proposal status locally
      setProposals(prev => prev.map(p => 
        p.field === proposal.field && p.ontology_attribute === proposal.ontology_attribute
          ? { ...p, status: decision === 'accept' ? 'accepted' : 'rejected' }
          : p
      ))
      
      // Reload stats
      const statsRes = await fetch(`${API_URL}/api/mapping/stats/${interviewId}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (err) {
      console.error('Error recording decision:', err)
    }
  }

  const handleBuildFacts = async () => {
    if (!selectedDataset) return
    
    try {
      const res = await fetch(
        `${API_URL}/api/mapping/facts/build/${interviewId}?dataset_id=${selectedDataset}`,
        { method: 'POST' }
      )
      if (res.ok) {
        const data = await res.json()
        alert(`✅ ${data.facts_count} facts construits avec succès !`)
        
        // Reload stats
        const statsRes = await fetch(`${API_URL}/api/mapping/stats/${interviewId}`)
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      }
    } catch (err) {
      console.error('Error building facts:', err)
      alert('Erreur lors de la construction des facts')
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-[#000]">
              Mapping {mode === 'decision' ? 'Décisionnel' : 'Transforming'}
            </h1>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              mode === 'decision' 
                ? 'bg-[#dbeafe] text-[#1e40af]' 
                : 'bg-[#f3e8ff] text-[#6b21a8]'
            }`}>
              {mode === 'decision' ? '🎯 Décisionnel' : '🔄 Transforming'}
            </div>
          </div>
          <p className="text-[#666]">
            {mode === 'decision' 
              ? 'Lier les faits requis aux sources de données'
              : 'Lier les concepts métier aux sources de données'}
          </p>
        </div>

        {/* Graph Visualization */}
        {graphData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {mode === 'decision' ? 'Fact Graph' : 'Ontology Graph'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BeautifulGraph data={graphData} />
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#3b82f6] mb-1">{stats.total_proposals || 0}</div>
                <div className="text-sm text-[#666]">Propositions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#22c55e] mb-1">{stats.accepted || 0}</div>
                <div className="text-sm text-[#666]">Acceptées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#ef4444] mb-1">{stats.rejected || 0}</div>
                <div className="text-sm text-[#666]">Rejetées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[#8b5cf6] mb-1">{stats.facts_count || 0}</div>
                <div className="text-sm text-[#666]">Facts</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Strategy Tabs */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strategy 1: Inventory matching */}
              <div className="p-4 border-2 border-[#3b82f6] bg-[#dbeafe] rounded-lg">
                <h3 className="font-semibold text-[#000] mb-2">
                  📚 Inventory Matching
                </h3>
                <p className="text-sm text-[#666] mb-4">
                  Rechercher dans le catalogue de faits connus
                </p>
                <Button
                  onClick={handleResolveInventory}
                  disabled={loading}
                  variant="primary"
                  className="w-full"
                >
                  Résoudre via Inventory
                </Button>
              </div>

              {/* Strategy 2: Dataset mapping */}
              <div className="p-4 border-2 border-[#22c55e] bg-[#dcfce7] rounded-lg">
                <h3 className="font-semibold text-[#000] mb-2">
                  🗄️ Dataset Mapping
                </h3>
                <p className="text-sm text-[#666] mb-4">
                  Mapper vers un dataset spécifique
                </p>
                <Select
                  value={selectedDataset}
                  onValueChange={setSelectedDataset}
                >
                  <SelectTrigger className="mb-2">
                    <SelectValue placeholder="Sélectionner un dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {!Array.isArray(datasets) || datasets.length === 0 ? (
                      <SelectItem value="" disabled>Aucun dataset disponible</SelectItem>
                    ) : (
                      datasets.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleMapToDataset}
                  disabled={!selectedDataset || loading}
                  variant="primary"
                  className="w-full"
                >
                  Proposer mappings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Results */}
        {matched.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                Trouvés dans l'Inventory ({matched.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matched.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#dcfce7] border border-[#22c55e] rounded-lg">
                    <div>
                      <div className="font-semibold text-[#000]">{m.label}</div>
                      {m.source && (
                        <div className="text-sm text-[#666]">
                          Source: {m.source.system || 'Unknown'}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-[#22c55e]">
                        {Math.round(m.confidence * 100)}%
                      </div>
                      <Database className="w-5 h-5 text-[#22c55e]" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dataset Proposals */}
        {proposals.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Propositions de mapping - {selectedDataset}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Visual Flow */}
              <div className="mb-6 p-6 bg-gradient-to-r from-[#dbeafe] to-[#dcfce7] rounded-lg border border-[#e5e7eb]">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-[#666] mb-2">SOURCE</div>
                    <div className="p-4 bg-white border-2 border-[#3b82f6] rounded-lg shadow-sm">
                      <Database className="w-6 h-6 mx-auto mb-2 text-[#3b82f6]" />
                      <div className="font-semibold text-sm">{selectedDataset}</div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-8 h-8 text-[#666]" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-[#666] mb-2">
                      {mode === 'decision' ? 'FAITS' : 'ONTOLOGIE'}
                    </div>
                    <div className="p-4 bg-white border-2 border-[#22c55e] rounded-lg shadow-sm">
                      <div className="font-semibold text-sm">
                        {mode === 'decision' ? 'Decision Facts' : 'Business Concepts'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mapping Table */}
              <div className="space-y-2">
                {proposals
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((p, i) => {
                    const isAccepted = p.status === 'accepted'
                    const isRejected = p.status === 'rejected'
                    
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-4 p-4 bg-white border border-[#e5e7eb] rounded-lg hover:shadow-md transition-shadow ${
                          isAccepted ? 'bg-[#dcfce7]' : isRejected ? 'bg-[#fee2e2]' : ''
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <code className="text-xs bg-[#dbeafe] px-2 py-1 rounded text-[#000]">
                            {p.field}
                          </code>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#666] flex-shrink-0" />
                        <div className="flex-1 font-semibold text-sm text-[#000]">
                          {p.ontology_attribute}
                        </div>
                        <div className="w-32">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-[#e5e7eb] rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-[#3b82f6] to-[#22c55e] h-2 rounded-full"
                                style={{ width: `${p.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold w-10 text-right text-[#666]">
                              {Math.round(p.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDecision(p, 'accept')}
                            disabled={isAccepted}
                            className={`p-2 rounded-lg transition-colors ${
                              isAccepted 
                                ? 'bg-[#22c55e] text-white cursor-not-allowed' 
                                : 'text-[#22c55e] hover:bg-[#dcfce7]'
                            }`}
                            title="Accepter"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDecision(p, 'reject')}
                            disabled={isRejected}
                            className={`p-2 rounded-lg transition-colors ${
                              isRejected 
                                ? 'bg-[#ef4444] text-white cursor-not-allowed' 
                                : 'text-[#ef4444] hover:bg-[#fee2e2]'
                            }`}
                            title="Rejeter"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleBuildFacts}
                  variant="primary"
                  disabled={!selectedDataset}
                >
                  Construire les facts
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gaps */}
        {gaps.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#f59e0b]">
                <AlertCircle className="w-5 h-5" />
                Gaps identifiés ({gaps.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {gaps.map((gap, i) => (
                  <div key={i} className="p-3 bg-[#fef3c7] border border-[#f59e0b] rounded-lg">
                    <div className="font-semibold text-[#000]">{gap}</div>
                    <div className="text-sm text-[#666]">
                      Non trouvé dans l'Inventory - Enrichissement nécessaire
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {proposals.length === 0 && selectedDataset && !loading && (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-[#f59e0b] mx-auto mb-4" />
              <p className="text-[#666]">Aucune proposition de mapping disponible.</p>
              <p className="text-sm text-[#666] mt-2">
                Cliquez sur "Générer les propositions" pour créer des mappings automatiques.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="secondary"
            onClick={() => router.push(
              mode === 'decision' 
                ? `/interview/${interviewId}/result` 
                : `/interview/${interviewId}`
            )}
          >
            ← Retour
          </Button>
          <Button 
            onClick={() => router.push('/architect')}
            variant="primary"
          >
            Dashboard Architecte →
          </Button>
        </div>
      </div>
    </div>
  )
}

