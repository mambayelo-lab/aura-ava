'use client'

import React, { useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'

type FactGraphData = {
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
    label?: string
  }>
}

const NODE_STYLES = {
  decision: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: '3px solid #5a67d8',
    icon: '🎯',
    width: 200,
  },
  fact: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#ffffff',
    border: '3px solid #e53e3e',
    icon: '📊',
    width: 180,
  },
  data_object: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#ffffff',
    border: '3px solid #3182ce',
    icon: '🗄️',
    width: 160,
  },
  actor: {
    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#1a202c',
    border: '3px solid #38b2ac',
    icon: '👤',
    width: 140,
  },
}

export function FactGraphVisualization({ data }: { data: FactGraphData }) {
  const { nodes, edges } = useMemo(() => {
    // Layout hiérarchique automatique
    const nodesByType = data.nodes.reduce((acc, node) => {
      const type = node.type || 'fact'
      if (!acc[type]) acc[type] = []
      acc[type].push(node)
      return acc
    }, {} as Record<string, typeof data.nodes>)

    let yOffset = 0
    const flowNodes: Node[] = []

    // Decision en haut
    if (nodesByType.decision) {
      nodesByType.decision.forEach((node, i) => {
        const style = NODE_STYLES.decision
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: 400, y: yOffset },
          data: {
            label: (
              <div className="text-center">
                <div className="text-2xl mb-2">{style.icon}</div>
                <div className="font-bold text-sm">{node.label}</div>
              </div>
            ),
          },
          style: {
            background: style.background,
            color: style.color,
            border: style.border,
            borderRadius: 16,
            padding: '20px 24px',
            width: style.width,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            fontWeight: 600,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })
      })
      yOffset += 120
    }

    // Facts au milieu
    if (nodesByType.fact) {
      const factCount = nodesByType.fact.length
      const startX = 400 - ((factCount - 1) * 220) / 2

      nodesByType.fact.forEach((node, i) => {
        const style = NODE_STYLES.fact
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: startX + i * 220, y: yOffset },
          data: {
            label: (
              <div className="text-center">
                <div className="text-xl mb-1">{style.icon}</div>
                <div className="font-semibold text-xs">{node.label}</div>
              </div>
            ),
          },
          style: {
            background: style.background,
            color: style.color,
            border: style.border,
            borderRadius: 14,
            padding: '16px 20px',
            width: style.width,
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            fontWeight: 600,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })
      })
      yOffset += 120
    }

    // Data objects en bas
    if (nodesByType.data_object) {
      const dataCount = nodesByType.data_object.length
      const startX = 400 - ((dataCount - 1) * 200) / 2

      nodesByType.data_object.forEach((node, i) => {
        const style = NODE_STYLES.data_object
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: startX + i * 200, y: yOffset },
          data: {
            label: (
              <div className="text-center">
                <div className="text-lg mb-1">{style.icon}</div>
                <div className="font-semibold text-xs">{node.label}</div>
              </div>
            ),
          },
          style: {
            background: style.background,
            color: style.color,
            border: style.border,
            borderRadius: 12,
            padding: '14px 18px',
            width: style.width,
            boxShadow: '0 6px 15px rgba(0,0,0,0.12)',
            fontWeight: 600,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        })
      })
    }

    // Actors à droite
    if (nodesByType.actor) {
      nodesByType.actor.forEach((node, i) => {
        const style = NODE_STYLES.actor
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: 900, y: 120 + i * 100 },
          data: {
            label: (
              <div className="text-center">
                <div className="text-lg mb-1">{style.icon}</div>
                <div className="font-semibold text-xs">{node.label}</div>
              </div>
            ),
          },
          style: {
            background: style.background,
            color: style.color,
            border: style.border,
            borderRadius: 12,
            padding: '14px 18px',
            width: style.width,
            boxShadow: '0 6px 15px rgba(0,0,0,0.12)',
            fontWeight: 600,
          },
        })
      })
    }

    // Edges avec style moderne
    const flowEdges: Edge[] = data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: true,
      label: edge.label || edge.type,
      labelStyle: {
        fontSize: 11,
        fontWeight: 700,
        fill: '#4a5568',
        background: '#ffffff',
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid #e2e8f0',
      },
      style: {
        stroke: '#cbd5e0',
        strokeWidth: 3,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#cbd5e0',
        width: 20,
        height: 20,
      },
    }))

    return { nodes: flowNodes, edges: flowEdges }
  }, [data])

  return (
    <div className="w-full h-[600px] border-2 border-[#e5e7eb] rounded-2xl overflow-hidden bg-gradient-to-br from-[#fafafa] to-[#f2f2f2] shadow-xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#e2e8f0" 
          gap={20} 
          size={1.5}
          variant="dots" 
        />
        <Controls className="bg-white rounded-lg shadow-lg" />
        <MiniMap
          nodeColor={(node) => {
            const style = node.style as any
            return style?.background || '#64748b'
          }}
          maskColor="rgba(0,0,0,0.05)"
          className="bg-white rounded-lg shadow-lg"
        />
      </ReactFlow>
    </div>
  )
}

