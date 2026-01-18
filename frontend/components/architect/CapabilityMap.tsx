'use client'

import { useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState
} from 'reactflow'
import 'reactflow/dist/style.css'

import { nodeTypes } from './CustomNodes'
import { getLayoutedElements } from '@/lib/layoutEngine'

export const CapabilityMap = ({ compilation }: { compilation: any }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  useEffect(() => {
    if (!compilation) return
    
    const initialNodes: Node[] = []
    const initialEdges: Edge[] = []
    
    // Domaines
    compilation.domains?.forEach((domain: any, idx: number) => {
      initialNodes.push({
        id: domain.id,
        type: 'domainNode',
        position: { x: 0, y: 0 }, // Sera calculé par dagre
        data: {
          label: domain.name,
          activities_count: domain.activities.length
        }
      })
    })
    
    // Activités L1
    compilation.normalized_activities
      ?.filter((act: any) => act.level === 1)
      .forEach((activity: any) => {
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
        
        // Edge domaine → activité
        const domain = compilation.domains?.find((d: any) => 
          d.activities.includes(activity.id)
        )
        
        if (domain) {
          initialEdges.push({
            id: `edge-${domain.id}-${activity.id}`,
            source: domain.id,
            target: activity.id,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#8b5cf6', strokeWidth: 2 }
          })
        }
      })
    
    // Auto-layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      'TB'
    )
    
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [compilation, setNodes, setEdges])
  
  return (
    <div id="capability-map" style={{ width: '100%', height: '700px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background 
          color="#e0e7ff" 
          gap={20} 
          size={1}
        />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'domainNode') return '#8b5cf6'
            if (node.type === 'activityNode') return '#10b981'
            return '#fbbf24'
          }}
        />
      </ReactFlow>
    </div>
  )
}


