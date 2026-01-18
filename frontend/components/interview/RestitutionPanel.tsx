'use client'

import { useState } from 'react'
import { Edit2, Plus, X, Check, Activity, FileText, Users, Settings, AlertCircle, Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type RestitutionPanelProps = {
  interview: any
  activities: any[]
  businessObjects: any[]
  actors: any[]
  rules: any[]
  signals: any[]
  painPoints: any[]
  onUpdate: (type: string, id: string, field: string, value: any) => void
  onAdd: (type: string) => void
  onDelete: (type: string, id: string) => void
}

export function RestitutionPanel({
  interview,
  activities,
  businessObjects,
  actors,
  rules,
  signals,
  painPoints,
  onUpdate,
  onAdd,
  onDelete
}: RestitutionPanelProps) {
  const [editing, setEditing] = useState<{ type: string; id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const startEdit = (type: string, id: string, field: string, currentValue: any) => {
    setEditing({ type, id, field })
    setEditValue(currentValue || '')
  }

  const saveEdit = () => {
    if (editing) {
      onUpdate(editing.type, editing.id, editing.field, editValue)
      setEditing(null)
      setEditValue('')
    }
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditValue('')
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {/* Activités */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Activités ({activities.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => onAdd('activity')} className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {activities.map((act) => (
            <div key={act.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {editing?.type === 'activity' && editing.id === act.id && editing.field === 'label' ? (
                    <div className="flex gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm h-7"
                        autoFocus
                      />
                      <Button size="sm" onClick={saveEdit} className="h-7 px-2">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="h-7 px-2">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{act.label}</span>
                      <button
                        onClick={() => startEdit('activity', act.id, 'label', act.label)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  
                  {/* Déclencheur */}
                  {act.trigger_event && (
                    <div className="mt-2 ml-4 text-xs text-gray-600">
                      <span className="font-semibold">🔥 Déclencheur:</span>{' '}
                      {editing?.type === 'activity' && editing.id === act.id && editing.field === 'trigger_event' ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          className="text-xs h-6 mt-1"
                          autoFocus
                        />
                      ) : (
                        <span onClick={() => startEdit('activity', act.id, 'trigger_event', act.trigger_event)}>
                          {act.trigger_event}
                          <Edit2 className="w-3 h-3 inline ml-1 text-gray-400" />
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Objet de sortie */}
                  {act.output_object && (
                    <div className="mt-1 ml-4 text-xs text-gray-600">
                      <span className="font-semibold">✨ Sortie:</span>{' '}
                      {businessObjects.find(o => o.id === act.output_object)?.name || 'N/A'}
                    </div>
                  )}
                  
                  {/* Acteur */}
                  {act.performed_by && (
                    <div className="mt-1 ml-4 text-xs text-gray-600">
                      <span className="font-semibold">👤 Acteur:</span>{' '}
                      {actors.find(a => a.id === act.performed_by)?.name || 'N/A'}
                    </div>
                  )}
                  
                  {/* Sous-activités */}
                  {act.sub_activities && act.sub_activities.length > 0 && (
                    <div className="mt-2 ml-4">
                      <div className="text-xs font-semibold text-gray-700 mb-1">Sous-activités:</div>
                      {act.sub_activities.map((subId: string, idx: number) => {
                        const subAct = activities.find(a => a.id === subId)
                        return subAct ? (
                          <div key={idx} className="text-xs text-gray-600 ml-2">• {subAct.label}</div>
                        ) : null
                      })}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete('activity', act.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Objets métier */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-600" />
            Objets métier ({businessObjects.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => onAdd('business_object')} className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {businessObjects.map((obj) => (
            <div key={obj.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {editing?.type === 'business_object' && editing.id === obj.id && editing.field === 'name' ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      className="text-sm h-7"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{obj.name}</span>
                      <button
                        onClick={() => startEdit('business_object', obj.id, 'name', obj.name)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {obj.attributes && obj.attributes.length > 0 && (
                    <div className="mt-1 text-xs text-gray-600">
                      Attributs: {obj.attributes.join(', ')}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete('business_object', obj.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Acteurs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            Acteurs ({actors.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => onAdd('actor')} className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {actors.map((actor) => (
            <div key={actor.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {editing?.type === 'actor' && editing.id === actor.id && editing.field === 'name' ? (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      className="text-sm h-7"
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{actor.name}</span>
                      <span className="text-xs text-gray-500">({actor.type})</span>
                      <button
                        onClick={() => startEdit('actor', actor.id, 'name', actor.name)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete('actor', actor.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Règles métier */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4 text-orange-600" />
            Règles métier ({rules.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => onAdd('rule')} className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-gray-700 mb-1">
                    {rule.type === 'SI_ALORS' ? 'SI' : 'TANT QUE'}
                  </div>
                  <div className="text-sm">
                    {rule.condition} → {rule.action}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete('rule', rule.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Signaux / Alertes */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-600" />
            Signaux / Alertes ({signals.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => onAdd('signal')} className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {signals.map((signal) => (
            <div key={signal.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{signal.event}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Action: {signal.action}
                    {signal.threshold && ` (Seuil: ${signal.threshold})`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Sévérité: {signal.severity}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete('signal', signal.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Points de friction */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            Points de friction ({painPoints.length})
          </h3>
          <Button size="sm" variant="outline" onClick={() => onAdd('pain_point')} className="h-6 px-2 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Ajouter
          </Button>
        </div>
        <div className="space-y-2">
          {painPoints.map((pain) => (
            <div key={pain.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <div className="text-sm">{pain.description}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Impact: {pain.impact} | Sévérité: {pain.severity}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete('pain_point', pain.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

