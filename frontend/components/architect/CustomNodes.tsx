'use client'

import { Handle, Position } from 'reactflow'

export const DomainNode = ({ data }: any) => (
  <div className="
    px-6 py-4 rounded-xl
    bg-gradient-to-br from-purple-500 to-indigo-600
    text-white shadow-2xl
    border-2 border-purple-300
    min-w-[220px]
    hover:scale-105 transition-transform
  ">
    <Handle type="target" position={Position.Top} className="w-3 h-3" />
    
    <div className="flex items-center gap-3 mb-2">
      <div className="text-2xl">🏢</div>
      <div className="font-bold text-lg">{data.label}</div>
    </div>
    
    <div className="text-sm opacity-90">
      {data.activities_count} capabilities
    </div>
    
    <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
  </div>
)

export const ActivityNode = ({ data }: any) => {
  const levelColors = {
    1: 'from-green-400 to-emerald-500',
    2: 'from-blue-400 to-cyan-500',
    3: 'from-pink-400 to-rose-500'
  }
  
  return (
    <div className={`
      px-5 py-3 rounded-lg
      bg-gradient-to-br ${levelColors[data.level as keyof typeof levelColors] || 'from-gray-400 to-gray-500'}
      text-white shadow-xl
      border border-white/30
      min-w-[180px]
      hover:shadow-2xl transition-all
    `}>
      <Handle type="target" position={Position.Left} className="w-2 h-2" />
      
      <div className="font-semibold text-sm mb-1">
        {data.normalized_label}
      </div>
      
      <div className="text-xs opacity-80 flex items-center gap-2">
        <span className="px-2 py-0.5 bg-white/20 rounded">
          {data.category}
        </span>
        <span>L{data.level}</span>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-2 h-2" />
    </div>
  )
}

export const ActorNode = ({ data }: any) => {
  const icon = data.type === 'personne' ? '👤' : 
               data.type === 'equipe' ? '👥' : '💻'
  
  return (
    <div className="
      px-4 py-3 rounded-lg
      bg-gradient-to-br from-amber-300 to-yellow-400
      text-gray-900 shadow-xl
      border-2 border-amber-500
      min-w-[150px]
    ">
      <Handle type="source" position={Position.Bottom} className="w-2 h-2" />
      
      <div className="flex items-center gap-2">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="font-bold text-sm">{data.name}</div>
          {data.role && (
            <div className="text-xs opacity-70">{data.role}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export const PainPointNode = ({ data }: any) => {
  const severityColors = {
    HIGH: 'from-red-500 to-rose-600',
    MEDIUM: 'from-orange-400 to-amber-500',
    LOW: 'from-yellow-300 to-yellow-400'
  }
  
  return (
    <div className={`
      px-4 py-3 rounded-lg
      bg-gradient-to-br ${severityColors[data.severity as keyof typeof severityColors]}
      text-white shadow-xl
      border-2 border-red-300
      max-w-[200px]
    `}>
      <div className="flex items-start gap-2">
        <div className="text-xl">⚠️</div>
        <div className="text-sm font-medium">
          {data.description}
        </div>
      </div>
    </div>
  )
}

export const nodeTypes = {
  domainNode: DomainNode,
  activityNode: ActivityNode,
  actorNode: ActorNode,
  painPointNode: PainPointNode
}


