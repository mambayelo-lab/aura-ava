'use client'

import React, { useMemo } from 'react'
import ReactFlow, {
  Node as FlowNode,
  Edge as FlowEdge,
  Background,
  Controls,
  MiniMap,
} from 'reactflow'
import 'reactflow/dist/style.css'

type GraphData = {
  nodes: Array<{
    id: string
    type: string
    label: string
    data: any
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    type: string
  }>
}

type GraphVisualizationProps = {
  data: GraphData
  title: string
}

const nodeColors: Record<string, string> = {
  decision: '#2563eb',
  fact: '#16a34a',
  data_object: '#64748b',
  rule: '#9333ea',
  condition: '#f59e0b',
  consequence: '#06b6d4',
  signal: '#f97316',
  pain_point: '#dc2626',
}

export function GraphVisualization({ data, title }: GraphVisualizationProps) {
  const { nodes, edges } = useMemo(() => {
    // Simple hierarchical layout: decision at top, then facts, then data objects
    const nodeMap = new Map<string, { node: typeof data.nodes[0], level: number }>()
    
    // Find decision node (root)
    const decisionNode = data.nodes.find(n => n.type === 'decision')
    if (decisionNode) {
      nodeMap.set(decisionNode.id, { node: decisionNode, level: 0 })
    }

    // Assign levels based on edges
    const assignLevel = (nodeId: string, level: number) => {
      if (nodeMap.has(nodeId)) {
        const existing = nodeMap.get(nodeId)!
        if (level > existing.level) {
          nodeMap.set(nodeId, { node: existing.node, level })
        }
        return
      }
      const node = data.nodes.find(n => n.id === nodeId)
      if (node) {
        nodeMap.set(nodeId, { node, level })
        // Recursively assign levels to targets
        data.edges
          .filter(e => e.source === nodeId)
          .forEach(e => assignLevel(e.target, level + 1))
      }
    }

    // Start from decision
    if (decisionNode) {
      data.edges
        .filter(e => e.source === decisionNode.id)
        .forEach(e => assignLevel(e.target, 1))
    }

    // Assign remaining nodes
    data.nodes.forEach(node => {
      if (!nodeMap.has(node.id)) {
        // Try to infer level from edges
        const incomingEdges = data.edges.filter(e => e.target === node.id)
        if (incomingEdges.length > 0) {
          const maxSourceLevel = Math.max(
            ...incomingEdges.map(e => nodeMap.get(e.source)?.level ?? 0)
          )
          nodeMap.set(node.id, { node, level: maxSourceLevel + 1 })
        } else {
          nodeMap.set(node.id, { node, level: 2 })
        }
      }
    })

    // Group nodes by level
    const levels: typeof data.nodes[][] = []
    nodeMap.forEach(({ node, level }) => {
      if (!levels[level]) levels[level] = []
      levels[level].push(node)
    })

    // Position nodes
    const flowNodes: FlowNode[] = []
    levels.forEach((levelNodes, levelIndex) => {
      const y = levelIndex * 200 + 50
      const spacing = 300
      const startX = (levelNodes.length - 1) * spacing / -2
      
      levelNodes.forEach((node, index) => {
        flowNodes.push({
          id: node.id,
          type: 'default',
          position: {
            x: startX + index * spacing,
            y: y,
          },
          data: {
            label: node.label || node.id,
          },
          style: {
            background: nodeColors[node.type] || '#64748b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '500',
            minWidth: '120px',
            textAlign: 'center',
          },
        })
      })
    })

    const flowEdges: FlowEdge[] = data.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      label: edge.type,
      labelStyle: { fontSize: '10px', fill: '#64748b', fontWeight: '500' },
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: {
        type: 'arrowclosed',
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
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeColor={(node) => node.style?.background as string}
          nodeStrokeWidth={3}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  )
}

