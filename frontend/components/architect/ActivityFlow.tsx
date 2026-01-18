'use client'

import { useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'

import { nodeTypes } from './CustomNodes'
import { getLayoutedElements } from '@/lib/layoutEngine'

export const ActivityFlow = ({ compilation }: { compilation: any }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  useEffect(() => {
    if (!compilation) return
    
    const initialNodes: Node[] = []
    const initialEdges: Edge[] = []
    
    // Activités L1 uniquement
    const l1Activities = compilation.normalized_activities?.filter(
      (act: any) => act.level === 1
    ) || []
    
    l1Activities.forEach((activity: any) => {
      initialNodes.push({
        id: activity.id,
        type: 'activityNode',
        position: { x: 0, y: 0 },
        data: {
          normalized_label: activity.normalized_label,
          category: activity.category,
          level: activity.level
        }
      })
    })
    
    // Flux depuis ontology graph
    type EdgeType = 'then' | 'parallel' | 'if'
    const edgeStyles: Record<EdgeType, { stroke: string; strokeWidth: number; animated?: boolean; strokeDasharray?: string }> = {
      then: { stroke: '#10b981', strokeWidth: 3, animated: true },
      parallel: { stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5,5' },
      if: { stroke: '#f59e0b', strokeWidth: 2 }
    }
    
    compilation.ontology_graph?.edges
      ?.filter((edge: any) => ['then', 'parallel', 'if'].includes(edge.type))
      .forEach((edge: any) => {
        const edgeType = edge.type as EdgeType
        const edgeStyle = edgeStyles[edgeType] || {}
        
        initialEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: 'smoothstep',
          label: edge.label,
          markerEnd: { type: MarkerType.ArrowClosed },
          ...edgeStyle
        })
      })
    
    // Layout horizontal
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'LR'
    )
    
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [compilation, setNodes, setEdges])
  
  return (
    <div id="activity-flow" style={{ width: '100%', height: '700px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#dcfce7" gap={20} />
        <Controls />
      </ReactFlow>
    </div>
  )
}


