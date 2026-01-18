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

type ReasoningGraphData = {
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
  rule: {
    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#1a202c',
    border: '3px solid #ed8936',
    icon: '⚖️',
    width: 200,
  },
  condition: {
    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    color: '#1a202c',
    border: '3px solid #4299e1',
    icon: '❓',
    width: 180,
  },
  consequence: {
    background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    color: '#1a202c',
    border: '3px solid #f6ad55',
    icon: '✅',
    width: 180,
  },
  signal: {
    background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    color: '#1a202c',
    border: '3px solid #fc8181',
    icon: '🚨',
    width: 160,
  },
  pain_point: {
    background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    color: '#1a202c',
    border: '3px solid #9f7aea',
    icon: '⚠️',
    width: 160,
  },
}

export function ReasoningGraphVisualization({ data }: { data: ReasoningGraphData }) {
  const { nodes, edges } = useMemo(() => {
    const nodesByType = data.nodes.reduce((acc, node) => {
      const type = node.type || 'rule'
      if (!acc[type]) acc[type] = []
      acc[type].push(node)
      return acc
    }, {} as Record<string, typeof data.nodes>)

    const flowNodes: Node[] = []
    let yOffset = 0

    // Conditions à gauche
    if (nodesByType.condition) {
      nodesByType.condition.forEach((node, i) => {
        const style = NODE_STYLES.condition
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: 0, y: yOffset + i * 120 },
          data: {
            label: (
              <div className="text-center">
                <div className="text-xl mb-2">{style.icon}</div>
                <div className="font-semibold text-xs leading-tight">
                  {node.label}
                </div>
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
          sourcePosition: Position.Right,
        })
      })
    }

    // Rules au centre
    if (nodesByType.rule) {
      nodesByType.rule.forEach((node, i) => {
        const style = NODE_STYLES.rule
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: 300, y: yOffset + i * 120 },
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
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        })
      })
    }

    // Consequences à droite
    if (nodesByType.consequence) {
      nodesByType.consequence.forEach((node, i) => {
        const style = NODE_STYLES.consequence
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: 600, y: yOffset + i * 120 },
          data: {
            label: (
              <div className="text-center">
                <div className="text-xl mb-2">{style.icon}</div>
                <div className="font-semibold text-xs leading-tight">
                  {node.label}
                </div>
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
          targetPosition: Position.Left,
        })
      })
      yOffset += nodesByType.consequence.length * 120
    }

    // Signals en bas
    if (nodesByType.signal) {
      const signalCount = nodesByType.signal.length
      const startX = 300 - ((signalCount - 1) * 180) / 2

      nodesByType.signal.forEach((node, i) => {
        const style = NODE_STYLES.signal
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: startX + i * 180, y: yOffset + 50 },
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

    // Pain points en bas
    if (nodesByType.pain_point) {
      const painCount = nodesByType.pain_point.length
      const startX = 300 - ((painCount - 1) * 180) / 2

      nodesByType.pain_point.forEach((node, i) => {
        const style = NODE_STYLES.pain_point
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: { x: startX + i * 180, y: yOffset + 150 },
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

    const flowEdges: Edge[] = data.edges.map((edge) => {
      const edgeType = edge.type || edge.label || ''
      
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        animated: edgeType.toLowerCase().includes('if') || edgeType.toLowerCase().includes('then'),
        label: edge.label || edge.type,
        labelStyle: {
          fontSize: 11,
          fontWeight: 700,
          fill: '#2d3748',
          background: '#ffffff',
          padding: '4px 8px',
          borderRadius: 6,
          border: '2px solid #edf2f7',
        },
        style: {
          stroke: edgeType.toLowerCase().includes('if') ? '#4299e1' : 
                  edgeType.toLowerCase().includes('then') ? '#48bb78' : '#cbd5e0',
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeType.toLowerCase().includes('if') ? '#4299e1' : 
                 edgeType.toLowerCase().includes('then') ? '#48bb78' : '#cbd5e0',
          width: 22,
          height: 22,
        },
      }
    })

    return { nodes: flowNodes, edges: flowEdges }
  }, [data])

  return (
    <div className="w-full h-[600px] border-2 border-[#e5e7eb] rounded-2xl overflow-hidden bg-gradient-to-br from-[#faf5ff] to-[#fce7f3] shadow-xl">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#e9d5ff" 
          gap={20} 
          size={1.5}
          variant="dots" 
        />
        <Controls className="bg-white rounded-lg shadow-lg" />
        <MiniMap
          nodeColor={(node) => {
            const style = node.style as any
            return style?.background || '#a855f7'
          }}
          maskColor="rgba(0,0,0,0.05)"
          className="bg-white rounded-lg shadow-lg"
        />
      </ReactFlow>
    </div>
  )
}

