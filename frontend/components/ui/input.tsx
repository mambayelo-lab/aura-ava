import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-11 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#000] placeholder:text-[#666] focus:outline-none focus:ring-2 focus:ring-[#0f172a] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
