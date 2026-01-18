'use client'

import * as React from "react"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

// Fonction helper pour extraire les données des enfants
function extractSelectData(children: React.ReactNode): {
  placeholder?: string
  options: Array<{ value: string; label: string }>
} {
  let placeholder: string | undefined
  const options: Array<{ value: string; label: string }> = []

  const traverse = (node: React.ReactNode): void => {
    if (!node) return

    if (React.isValidElement(node)) {
      const displayName = (node.type as any)?.displayName

      if (displayName === 'SelectValue' && node.props.placeholder) {
        placeholder = node.props.placeholder
      }

      if (displayName === 'SelectItem' && node.props.value) {
        // Extraire le texte des enfants (gérer les icônes et les espaces)
        const extractText = (children: React.ReactNode): string[] => {
          const parts: string[] = []
          
          if (typeof children === 'string' || typeof children === 'number') {
            const text = String(children).trim()
            if (text) parts.push(text)
          } else if (Array.isArray(children)) {
            children.forEach(child => {
              parts.push(...extractText(child))
            })
          } else if (React.isValidElement(children)) {
            if (children.props?.children) {
              parts.push(...extractText(children.props.children))
            }
          }
          
          return parts
        }
        
        const parts = extractText(node.props.children)
        // Joindre les parties avec un espace et nettoyer
        let label = parts.filter(p => p && p.trim()).join(' ').trim()
        // Nettoyer les virgules et espaces multiples en début
        label = label.replace(/^[,,\s]+/, '').trim()
        
        options.push({
          value: node.props.value,
          label: label || String(node.props.value || '')
        })
      }

      if (node.props.children) {
        React.Children.forEach(node.props.children, traverse)
      }
    } else if (Array.isArray(node)) {
      node.forEach(traverse)
    }
  }

  React.Children.forEach(children, traverse)

  return { placeholder, options }
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const { placeholder, options } = React.useMemo(
    () => extractSelectData(children),
    [children]
  )

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onValueChange?.(e.target.value)
  }

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      className="flex h-11 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#000] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
    >
      {placeholder && !value && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
Select.displayName = "Select"

// SelectTrigger - wrapper virtuel pour compatibilité API
const SelectTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
SelectTrigger.displayName = "SelectTrigger"

// SelectValue - composant virtuel pour compatibilité API
const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return null
}
SelectValue.displayName = "SelectValue"

// SelectContent - wrapper virtuel pour compatibilité API
const SelectContent = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}
SelectContent.displayName = "SelectContent"

// SelectItem - composant virtuel pour compatibilité API
const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => {
  return null
}
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }

