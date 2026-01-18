'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'
import type { Rule, RuleType } from '@/lib/types/ontology'

type RuleEditorProps = {
  value: Rule[]
  onChange: (rules: Rule[]) => void
}

export function RuleEditor({ value, onChange }: RuleEditorProps) {
  const addRule = (type: RuleType) => {
    const newRule: Rule = {
      id: crypto.randomUUID(),
      type,
      condition: '',
      consequence: ''
    }
    onChange([...value, newRule])
  }

  const updateRule = (id: string, field: 'condition' | 'consequence', val: string) => {
    onChange(
      value.map(r => r.id === id ? { ...r, [field]: val } : r)
    )
  }

  const removeRule = (id: string) => {
    onChange(value.filter(r => r.id !== id))
  }

  const getRuleLabel = (type: RuleType) => {
    switch (type) {
      case 'if_then': return { if: 'SI', then: 'ALORS' }
      case 'while': return { if: 'TANT QUE', then: 'FAIRE' }
      default: return { if: 'SI', then: 'ALORS' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Règles existantes */}
      {value.map((rule) => {
        const labels = getRuleLabel(rule.type)
        
        return (
          <div key={rule.id} className="p-6 border border-[#e5e7eb] rounded-xl bg-white relative">
            <button
              onClick={() => removeRule(rule.id)}
              className="absolute top-4 right-4 text-[#666] hover:text-[#000] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4 pr-8">
              {/* Type badge */}
              <div className="inline-block px-3 py-1 bg-[#f8fafc] text-[#0f172a] text-xs font-semibold rounded-full border border-[#e5e7eb]">
                {rule.type === 'if_then' && 'SI... ALORS...'}
                {rule.type === 'while' && 'TANT QUE...'}
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-semibold text-[#000] mb-2">
                  {labels.if}
                </label>
                <Textarea
                  value={rule.condition}
                  onChange={(e) => updateRule(rule.id, 'condition', e.target.value)}
                  placeholder="le montant dépasse 1000€"
                  rows={2}
                  className="w-full"
                />
                <p className="text-xs text-[#666] mt-1">
                  💡 Décrivez la condition en langage naturel
                </p>
              </div>

              {/* Conséquence */}
              <div>
                <label className="block text-sm font-semibold text-[#000] mb-2">
                  {labels.then}
                </label>
                <Textarea
                  value={rule.consequence}
                  onChange={(e) => updateRule(rule.id, 'consequence', e.target.value)}
                  placeholder="validation hiérarchique requise"
                  rows={2}
                  className="w-full"
                />
                <p className="text-xs text-[#666] mt-1">
                  💡 Décrivez l'action ou la conséquence
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {/* Boutons d'ajout */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={() => addRule('if_then')}
          variant="secondary"
          className="flex-1"
        >
          + SI... ALORS...
        </Button>
        <Button
          type="button"
          onClick={() => addRule('while')}
          variant="secondary"
          className="flex-1"
        >
          + TANT QUE...
        </Button>
      </div>
    </div>
  )
}

