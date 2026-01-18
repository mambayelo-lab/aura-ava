import * as React from "react"
import { useFormContext, Controller, FormProvider } from "react-hook-form"

// Contexte pour passer fieldState.error à FormMessage
const FormMessageContext = React.createContext<{ error?: { message?: string } } | null>(null)

// Form - wrapper simple qui accepte {...form} de react-hook-form
export interface FormProps {
  children: React.ReactNode
  [key: string]: any // Accepte toutes les props de react-hook-form
}

const Form = ({ children, ...formProps }: FormProps) => {
  return (
    <FormProvider {...formProps}>
      {children}
    </FormProvider>
  )
}
Form.displayName = "Form"

// FormField - wrapper autour de Controller de react-hook-form
export interface FormFieldProps {
  control?: any
  name: string
  render: (props: { field: any; fieldState: any; formState: any }) => React.ReactNode
}

const FormField = ({ control, name, render }: FormFieldProps) => {
  const formContext = useFormContext()
  const actualControl = control || formContext?.control

  if (!actualControl) {
    console.warn(`FormField: control not found for field "${name}"`)
    return null
  }

  return (
    <Controller
      control={actualControl}
      name={name}
      render={(props) => (
        <FormMessageContext.Provider value={{ error: props.fieldState.error }}>
          {render(props)}
        </FormMessageContext.Provider>
      )}
    />
  )
}
FormField.displayName = "FormField"

// FormItem - simple div wrapper
const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`space-y-2 ${className}`} {...props} />
  )
)
FormItem.displayName = "FormItem"

// FormLabel - simple label
const FormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = "", ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    />
  )
)
FormLabel.displayName = "FormLabel"

// FormControl - simple div wrapper
const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={className} {...props} />
  )
)
FormControl.displayName = "FormControl"

// FormMessage - affiche les erreurs depuis react-hook-form
// Utilise le contexte local pour récupérer fieldState.error depuis FormField
const FormMessage = ({ children }: { children?: React.ReactNode }) => {
  const context = React.useContext(FormMessageContext)
  const formContext = useFormContext()
  
  // Priorité 1: erreur depuis le contexte local (fieldState)
  if (context?.error?.message) {
    return (
      <p className="text-sm font-medium text-red-600 mt-1">
        {String(context.error.message)}
      </p>
    )
  }
  
  // Priorité 2: children si fourni
  if (children) {
    return (
      <p className="text-sm font-medium text-red-600 mt-1">
        {children}
      </p>
    )
  }
  
  return null
}
FormMessage.displayName = "FormMessage"

export { Form, FormField, FormItem, FormLabel, FormControl, FormMessage }

