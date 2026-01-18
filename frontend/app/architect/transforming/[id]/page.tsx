'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, AlertCircle, Download, FileText, Sparkles } from 'lucide-react'
import { CapabilityMap } from '@/components/architect/CapabilityMap'
import { ActivityFlow } from '@/components/architect/ActivityFlow'
import { DecompositionTree } from '@/components/architect/DecompositionTree'
import { exportReactFlowToPng } from '@/lib/exportUtils'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Compilation = {
  ontology_graph: any
  normalized_activities: Array<{
    id: string
    original_label: string
    normalized_label: string
    verb: string
    entity: string
    category: string
    level: number
  }>
  hierarchy: any
  domains: Array<{
    id: string
    name: string
    activities: string[]
    description?: string
  }>
  stats: {
    activities_count: number
    activities_l1: number
    activities_l2: number
    actors_count: number
    pain_points_count: number
    domains_count: number
    max_depth: number
    flows_explicit: number
    flows_implicit: number
  }
}

type Architectures = {
  capability_map: string
  activity_flow: string
  actor_matrix: string
  decomposition_tree: string
  compilation: Compilation
}

export default function ArchitectWorkspacePage() {
  const { id } = useParams()
  const router = useRouter()
  const interviewId = id as string
  
  const [compilation, setCompilation] = useState<Compilation | null>(null)
  const [architectures, setArchitectures] = useState<Architectures | null>(null)
  const [activeTab, setActiveTab] = useState<'normalization' | 'ontology' | 'architectures' | 'synthesis'>('normalization')
  const [loading, setLoading] = useState(false)
  const [compiling, setCompiling] = useState(false)

  useEffect(() => {
    loadCompilation()
  }, [interviewId])

  const loadCompilation = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/architect/compile/${interviewId}`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setCompilation(data)
      }
    } catch (err) {
      console.error('Error loading compilation:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCompile = async () => {
    setCompiling(true)
    try {
      await loadCompilation()
    } finally {
      setCompiling(false)
    }
  }

  const handleGenerateArchitectures = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/architect/generate-architecture/${interviewId}`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setArchitectures(data)
        setCompilation(data.compilation)
      }
    } catch (err) {
      console.error('Error generating architectures:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading && !compilation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!compilation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-8">
        <Card className="border-2 border-purple-200 shadow-xl max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Compilation nécessaire</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Compilez l'interview pour générer l'ontologie et les architectures
            </p>
            <Button
              onClick={handleCompile}
              disabled={compiling}
              className="bg-purple-600 hover:bg-purple-700 w-full"
            >
              {compiling ? 'Compilation...' : '🚀 Compiler l\'interview'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Workspace Architecte
              </h1>
              <p className="text-gray-600 text-lg">
                Normalisation sémantique et génération d'architectures
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCompile}
                disabled={compiling}
                variant="secondary"
              >
                {compiling ? 'Compilation...' : '🔄 Recompiler'}
              </Button>
              {!architectures && (
                <Button
                  onClick={handleGenerateArchitectures}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Génération...' : '📐 Générer architectures'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="normalization">Normalisation</TabsTrigger>
            <TabsTrigger value="ontology">Ontologie</TabsTrigger>
            <TabsTrigger value="architectures">Architectures</TabsTrigger>
            <TabsTrigger value="synthesis">Synthèse</TabsTrigger>
          </TabsList>

          {/* Tab: Normalisation */}
          <TabsContent value="normalization">
            <Card className="border-2 border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Normalisation Sémantique</CardTitle>
                <p className="text-gray-600 mt-2">
                  Vocabulaire terrain → Concepts ontologiques
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-4 font-semibold text-gray-900">Label original</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Label normalisé</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Verbe</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Entité</th>
                        <th className="text-left p-4 font-semibold text-gray-900">Catégorie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compilation.normalized_activities.map((activity) => (
                        <tr key={activity.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{activity.original_label}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-purple-700">{activity.normalized_label}</div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                              {activity.verb}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                              {activity.entity}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm">
                              {activity.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Ontologie */}
          <TabsContent value="ontology">
            <Card className="border-2 border-purple-200 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Graphe Ontologique</CardTitle>
                <p className="text-gray-600 mt-2">
                  Visualisation de l'ontologie business compilée
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="text-center text-gray-500">
                    <p className="mb-4">Visualisation du graphe ontologique</p>
                    <p className="text-sm">
                      {compilation.ontology_graph.nodes.length} nœuds • {compilation.ontology_graph.edges.length} relations
                    </p>
                  </div>
                  {/* TODO: Intégrer BeautifulGraph ou React Flow */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Architectures */}
          <TabsContent value="architectures">
            {!architectures ? (
              <Card className="border-2 border-purple-200 shadow-xl">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-600 mb-6">
                    Générez les schémas d'architecture pour visualiser les diagrammes
                  </p>
                  <Button
                    onClick={handleGenerateArchitectures}
                    disabled={loading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? 'Génération...' : '📐 Générer architectures'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Capability Map */}
                <Card className="border-2 border-purple-200 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">📊 Cartographie des Capabilities</CardTitle>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => exportReactFlowToPng('capability-map', 'capability-map.png')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger PNG
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CapabilityMap compilation={compilation} />
                  </CardContent>
                </Card>

                {/* Activity Flow */}
                <Card className="border-2 border-purple-200 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">🔄 Flux d'Activités</CardTitle>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => exportReactFlowToPng('activity-flow', 'activity-flow.png')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger PNG
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ActivityFlow compilation={compilation} />
                  </CardContent>
                </Card>

                {/* Actor Matrix */}
                <Card className="border-2 border-purple-200 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">👥 Matrice RACI</CardTitle>
                      <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <div className="prose max-w-none">
                        <pre className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
                          {architectures.actor_matrix}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Decomposition Tree */}
                <Card className="border-2 border-purple-200 shadow-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">🌳 Arbre de Décomposition</CardTitle>
                      <Button variant="secondary" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DecompositionTree hierarchy={compilation.hierarchy} />
                  </CardContent>
                </Card>

                {/* Export Blueprint */}
                <Card className="border-2 border-green-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl">📄 Export Blueprint</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="bg-green-600 hover:bg-green-700 w-full">
                      <FileText className="w-4 h-4 mr-2" />
                      Exporter Blueprint PDF
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab: Synthèse */}
          <TabsContent value="synthesis">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Stats */}
              <Card className="border-2 border-purple-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Statistiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700">Activités normalisées</span>
                      <span className="text-2xl font-bold text-purple-600">{compilation.stats.activities_count}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">Domaines détectés</span>
                      <span className="text-2xl font-bold text-blue-600">{compilation.stats.domains_count}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700">Flux identifiés</span>
                      <span className="text-2xl font-bold text-green-600">
                        {compilation.stats.flows_explicit + compilation.stats.flows_implicit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-gray-700">Profondeur max</span>
                      <span className="text-2xl font-bold text-orange-600">{compilation.stats.max_depth} niveaux</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Domaines */}
              <Card className="border-2 border-purple-200 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Domaines Métier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {compilation.domains.map((domain) => (
                      <div key={domain.id} className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                        <div className="font-semibold text-purple-900 mb-1">{domain.name}</div>
                        {domain.description && (
                          <div className="text-sm text-purple-700">{domain.description}</div>
                        )}
                        <div className="text-xs text-purple-600 mt-2">
                          {domain.activities.length} activité(s)
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


