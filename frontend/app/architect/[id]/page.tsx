'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GraphVisualization } from '@/components/graphs/GraphVisualization'
import { CheckCircle2, AlertCircle, ArrowLeft, FileText, Network } from 'lucide-react'
import type { CompilationResult } from '@/lib/types/graphs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ArchitectInterviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const interviewId = id as string

  const [compilation, setCompilation] = useState<CompilationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'overview' | 'fact-graph' | 'reasoning-graph' | 'mapping'>('overview')

  useEffect(() => {
    loadCompilation()
  }, [interviewId])

  const loadCompilation = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/compilation/${interviewId}`)
      if (res.ok) {
        const data = await res.json()
        setCompilation(data)
      } else if (res.status === 404) {
        // Try to compile
        const compileRes = await fetch(`${API_URL}/api/compilation/${interviewId}`, {
          method: 'POST'
        })
        if (compileRes.ok) {
          const compiledData = await compileRes.json()
          setCompilation(compiledData)
        }
      }
    } catch (err) {
      console.error('Error loading compilation:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f172a] mx-auto mb-4"></div>
          <p className="text-[#666]">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!compilation) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-8 text-center">
            <AlertCircle className="h-12 w-12 text-[#f59e0b] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#000] mb-4">
              Compilation non trouvée
            </h2>
            <p className="text-[#666] mb-6">
              Cette interview n'a pas encore été compilée.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push(`/interview/${interviewId}/result`)}
            >
              Compiler maintenant
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/architect')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-[#000]">
                  Interview #{interviewId.slice(0, 8)}
                </h1>
                <p className="text-sm text-[#666]">
                  Visualisation et mapping des graphes
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push(`/interview/${interviewId}/result`)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Vue interview
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-[#e5e7eb]">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'overview'
                ? 'border-[#0f172a] text-[#000]'
                : 'border-transparent text-[#666] hover:text-[#000]'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveView('fact-graph')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'fact-graph'
                ? 'border-[#0f172a] text-[#000]'
                : 'border-transparent text-[#666] hover:text-[#000]'
            }`}
          >
            Graphe de Faits
          </button>
          <button
            onClick={() => setActiveView('reasoning-graph')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'reasoning-graph'
                ? 'border-[#0f172a] text-[#000]'
                : 'border-transparent text-[#666] hover:text-[#000]'
            }`}
          >
            Graphe de Raisonnement
          </button>
          <button
            onClick={() => setActiveView('mapping')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'mapping'
                ? 'border-[#0f172a] text-[#000]'
                : 'border-transparent text-[#666] hover:text-[#000]'
            }`}
          >
            Mapping
          </button>
        </div>

        {/* Content */}
        {activeView === 'overview' && (
          <OverviewView compilation={compilation} />
        )}
        {activeView === 'fact-graph' && (
          <GraphView graph={compilation.fact_graph} title="Graphe de Faits" />
        )}
        {activeView === 'reasoning-graph' && (
          <GraphView graph={compilation.reasoning_graph} title="Graphe de Raisonnement" />
        )}
        {activeView === 'mapping' && (
          <MappingView compilation={compilation} interviewId={interviewId} />
        )}
      </div>
    </div>
  )
}

function OverviewView({ compilation }: { compilation: CompilationResult }) {
  return (
    <div className="space-y-6">
      {/* Validation Status */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
        <div className="flex items-center gap-3 mb-4">
          {compilation.validation.valid ? (
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
                <p className="text-sm text-[#666]">{compilation.validation.issues.length} problème(s) détecté(s)</p>
              </div>
            </>
          )}
        </div>

        {compilation.validation.issues.length > 0 && (
          <div className="space-y-2">
            {compilation.validation.issues.map((issue, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#fef3c7] border border-[#f59e0b] rounded-lg text-sm text-[#92400e]"
              >
                {issue.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 text-center">
          <div className="text-3xl font-bold text-[#3b82f6] mb-1">
            {compilation.stats.facts}
          </div>
          <div className="text-sm text-[#666]">Faits</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 text-center">
          <div className="text-3xl font-bold text-[#8b5cf6] mb-1">
            {compilation.stats.rules}
          </div>
          <div className="text-sm text-[#666]">Règles</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 text-center">
          <div className="text-3xl font-bold text-[#f59e0b] mb-1">
            {compilation.stats.signals}
          </div>
          <div className="text-sm text-[#666]">Signaux</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 text-center">
          <div className="text-3xl font-bold text-[#ef4444] mb-1">
            {compilation.stats.pain_points}
          </div>
          <div className="text-sm text-[#666]">Points de friction</div>
        </div>
      </div>

      {/* Graphs Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
          <h3 className="text-lg font-semibold text-[#000] mb-4 flex items-center gap-2">
            <Network className="h-5 w-5 text-[#3b82f6]" />
            Graphe de Faits
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#666]">Nœuds:</span>
              <span className="font-semibold text-[#000]">{compilation.fact_graph.nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">Relations:</span>
              <span className="font-semibold text-[#000]">{compilation.fact_graph.edges.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
          <h3 className="text-lg font-semibold text-[#000] mb-4 flex items-center gap-2">
            <Network className="h-5 w-5 text-[#8b5cf6]" />
            Graphe de Raisonnement
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#666]">Nœuds:</span>
              <span className="font-semibold text-[#000]">{compilation.reasoning_graph.nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666]">Relations:</span>
              <span className="font-semibold text-[#000]">{compilation.reasoning_graph.edges.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GraphView({ graph, title }: { graph: CompilationResult['fact_graph'], title: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
      <h2 className="text-xl font-bold text-[#000] mb-6">{title}</h2>
      
      {/* Graph Visualization */}
      <div className="mb-6">
        <GraphVisualization
          data={graph}
          title={title}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-[#fafafa] rounded-lg">
          <div className="text-sm text-[#666] mb-1">Nœuds</div>
          <div className="text-lg font-bold text-[#000]">{graph.nodes.length}</div>
        </div>
        <div className="p-4 bg-[#fafafa] rounded-lg">
          <div className="text-sm text-[#666] mb-1">Relations</div>
          <div className="text-lg font-bold text-[#000]">{graph.edges.length}</div>
        </div>
      </div>

      {/* Nodes List */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[#666] uppercase tracking-wider mb-3">
          Nœuds ({graph.nodes.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {graph.nodes.map((node) => (
            <div
              key={node.id}
              className="p-3 border border-[#e5e7eb] rounded-lg flex items-center gap-3"
            >
              <div className={`w-3 h-3 rounded-full ${
                node.type === 'decision' ? 'bg-[#3b82f6]' :
                node.type === 'fact' ? 'bg-[#22c55e]' :
                node.type === 'rule' ? 'bg-[#8b5cf6]' :
                node.type === 'signal' ? 'bg-[#f59e0b]' :
                node.type === 'pain_point' ? 'bg-[#ef4444]' :
                'bg-[#cbd5e1]'
              }`}></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#000]">{node.label}</div>
                <div className="text-xs text-[#666]">{node.type}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edges List */}
      <div>
        <h3 className="text-sm font-semibold text-[#666] uppercase tracking-wider mb-3">
          Relations ({graph.edges.length})
        </h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {graph.edges.map((edge) => {
            const sourceNode = graph.nodes.find(n => n.id === edge.source)
            const targetNode = graph.nodes.find(n => n.id === edge.target)
            return (
              <div
                key={edge.id}
                className="p-3 border border-[#e5e7eb] rounded-lg"
              >
                <div className="text-sm text-[#000]">
                  <span className="font-medium">{sourceNode?.label || edge.source}</span>
                  <span className="mx-2 text-[#666]">→</span>
                  <span className="font-medium">{targetNode?.label || edge.target}</span>
                </div>
                <div className="text-xs text-[#666] mt-1">{edge.type}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MappingView({ compilation, interviewId }: { compilation: CompilationResult, interviewId: string }) {
  const [mappings, setMappings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Record<string, boolean>>({})

  const factNodes = useMemo(() => {
    return compilation.fact_graph.nodes.filter(n => n.type === 'fact')
  }, [compilation])

  useEffect(() => {
    loadMappings()
  }, [interviewId])

  const loadMappings = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/mapping/${interviewId}`)
      if (res.ok) {
        const data = await res.json()
        setMappings(data.mappings || {})
      }
    } catch (err) {
      console.error('Error loading mappings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleMappingChange = (factId: string, dataObjectId: string) => {
    setMappings(prev => ({ ...prev, [factId]: dataObjectId }))
  }

  const saveMapping = async (factId: string) => {
    setSaving(prev => ({ ...prev, [factId]: true }))
    try {
      const res = await fetch(`${API_URL}/api/mapping/${interviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings })
      })
      if (res.ok) {
        // Success
      }
    } catch (err) {
      console.error('Error saving mapping:', err)
    } finally {
      setSaving(prev => ({ ...prev, [factId]: false }))
    }
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
      <h2 className="text-xl font-bold text-[#000] mb-6">Mapping Faits → Objets de données</h2>
      
      <div className="space-y-4">
        {factNodes.map((factNode) => {
          const factData = factNode.data
          const currentMapping = mappings[factNode.id] || ''

          return (
            <div
              key={factNode.id}
              className="p-4 border border-[#e5e7eb] rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-[#000] mb-1">
                    📦 {factNode.label}
                  </h3>
                  <p className="text-sm text-[#666]">
                    Type: {factData.source_type} | Origine: {factData.description || 'Non définie'}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-semibold text-[#000] mb-2">
                  Mapper vers un objet de données
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="ID de l'objet de données (ex: data_object_123)"
                    value={currentMapping}
                    onChange={(e) => handleMappingChange(factNode.id, e.target.value)}
                    className="flex-1"
                  />
                  {currentMapping && (
                    <Button
                      variant="outline"
                      onClick={() => saveMapping(factNode.id)}
                      disabled={saving[factNode.id]}
                    >
                      {saving[factNode.id] ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-[#666] mt-2">
                  💡 Mappez ce fait vers un objet de données existant dans votre architecture
                </p>
              </div>
            </div>
          )
        })}

        {factNodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#666]">Aucun fait à mapper</p>
          </div>
        )}
      </div>
    </div>
  )
}

