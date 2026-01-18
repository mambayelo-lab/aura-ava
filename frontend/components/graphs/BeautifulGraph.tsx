'use client'

import React, { useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'

const nodeColors: Record<string, { bg: string; border: string; text: string }> = {
  decision: { bg: '#3b82f6', border: '#2563eb', text: '#fff' },
  fact: { bg: '#10b981', border: '#059669', text: '#fff' },
  data_object: { bg: '#64748b', border: '#475569', text: '#fff' },
  rule: { bg: '#8b5cf6', border: '#7c3aed', text: '#fff' },
  condition: { bg: '#f59e0b', border: '#d97706', text: '#fff' },
  consequence: { bg: '#06b6d4', border: '#0891b2', text: '#fff' },
  signal: { bg: '#f97316', border: '#ea580c', text: '#fff' },
  pain_point: { bg: '#dc2626', border: '#b91c1c', text: '#fff' },
}

type GraphData = {
  nodes: Array<{
    id: string
    type: string
    label: string
    data?: any
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type: string
  }>
}

type BeautifulGraphProps = {
  data: GraphData
}

export function BeautifulGraph({ data }: BeautifulGraphProps) {
  const { nodes, edges } = useMemo(() => {
    // Convert to React Flow format with better layout
    const flowNodes: Node[] = data.nodes.map((node, index) => {
      const color = nodeColors[node.type as keyof typeof nodeColors] || nodeColors.fact
      
      return {
        id: node.id,
        position: calculatePosition(index, data.nodes.length),
        data: { label: node.label },
        style: {
          background: color.bg,
          color: color.text,
          border: `2px solid ${color.border}`,
          borderRadius: 12,
          padding: '12px 20px',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          minWidth: 150,
        },
      }
    })

    const flowEdges: Edge[] = data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      label: edge.type,
      labelStyle: {
        fontSize: 11,
        fontWeight: 600,
        fill: '#64748b',
        background: '#fff',
        padding: 4,
        borderRadius: 4,
      },
      style: {
        stroke: '#94a3b8',
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#94a3b8',
      },
    }))

    return { nodes: flowNodes, edges: flowEdges }
  }, [data])

  return (
    <div className="w-full h-[600px] border border-[#e5e7eb] rounded-xl overflow-hidden bg-white shadow-sm">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            const nodeData = data.nodes.find(n => n.id === node.id)
            const type = nodeData?.type || 'fact'
            return nodeColors[type as keyof typeof nodeColors]?.bg || '#64748b'
          }}
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </div>
  )
}

// Meilleur algorithme de layout (force-directed simplifié)
function calculatePosition(index: number, total: number) {
  const cols = Math.ceil(Math.sqrt(total))
  const row = Math.floor(index / cols)
  const col = index % cols
  
  return {
    x: col * 250 + Math.random() * 50,
    y: row * 150 + Math.random() * 30,
  }
}

