'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export const DecompositionTree = ({ hierarchy }: { hierarchy: any }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  
  useEffect(() => {
    if (!svgRef.current || !hierarchy?.tree) return
    
    const width = 1400
    const height = 900
    
    // Clear
    d3.select(svgRef.current).selectAll('*').remove()
    
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
    
    const g = svg.append('g')
      .attr('transform', 'translate(120, 50)')
    
    // Tree layout
    const treeLayout = d3.tree()
      .size([height - 150, width - 300])
    
    // Prendre premier root
    const treeValues = Object.values(hierarchy.tree)
    if (!treeValues || treeValues.length === 0) return
    
    const firstRoot = treeValues[0] as any
    if (!firstRoot || !firstRoot.activity) return
    
    // Adapter la structure pour d3.hierarchy
    const rootData = {
      ...firstRoot,
      children: firstRoot.children || []
    }
    
    const root = d3.hierarchy(rootData, (d: any) => d.children)
    const treeData = treeLayout(root)
    
    // Links avec courbes
    const linkGenerator = d3.linkHorizontal<any, any>()
      .x((d: any) => d.y)
      .y((d: any) => d.x)
    
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', (d: any) => {
        const level = (d.target as any).depth
        if (level === 1) return '#8b5cf6'
        if (level === 2) return '#3b82f6'
        return '#06b6d4'
      })
      .attr('stroke-width', 3)
      .attr('opacity', 0.6)
      .attr('d', linkGenerator)
    
    // Nodes
    const node = g.selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.y}, ${d.x})`)
    
    // Rectangles arrondis
    node.append('rect')
      .attr('x', -10)
      .attr('y', -18)
      .attr('width', (d: any) => (d.data.activity?.label?.length || 20) * 7 + 30)
      .attr('height', 36)
      .attr('rx', 8)
      .attr('fill', (d: any) => {
        const level = d.depth
        if (level === 0) return '#8b5cf6'
        if (level === 1) return '#3b82f6'
        if (level === 2) return '#06b6d4'
        return '#14b8a6'
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
    
    // Labels
    node.append('text')
      .attr('dy', '0.35em')
      .attr('x', 10)
      .text((d: any) => d.data.activity?.label || '')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('fill', '#fff')
    
    // Badges niveau
    node.append('circle')
      .attr('cx', -10)
      .attr('cy', 0)
      .attr('r', 12)
      .attr('fill', '#fff')
      .attr('opacity', 0.9)
    
    node.append('text')
      .attr('x', -10)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .text((d: any) => `L${d.data.activity?.level || d.depth}`)
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('fill', '#1f2937')
      .style('text-anchor', 'middle')
    
  }, [hierarchy])
  
  return (
    <div className="w-full overflow-auto bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl p-8">
      <svg ref={svgRef} />
    </div>
  )
}

