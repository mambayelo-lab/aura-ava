import * as React from "react"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[120px] w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#000] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-colors ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
