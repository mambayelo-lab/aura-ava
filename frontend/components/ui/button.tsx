import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'default' | 'destructive' | 'link'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
    
    // Style aura-ava
    const variants: Record<string, string> = {
      primary: "bg-[#0f172a] text-white hover:bg-[#1e293b] focus-visible:ring-[#0f172a]",
      secondary: "bg-white border border-[#ebebeb] text-[#000] hover:bg-[#f2f2f2] hover:border-transparent focus-visible:ring-[#ebebeb]",
      ghost: "text-[#666] hover:bg-[#f2f2f2] focus-visible:ring-[#e5e7eb]",
      outline: "border border-[#e5e7eb] bg-white text-[#000] hover:bg-[#f2f2f2] focus-visible:ring-[#e5e7eb]",
      default: "bg-[#0f172a] text-white hover:bg-[#1e293b] focus-visible:ring-[#0f172a]",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
      link: "text-[#0f172a] underline hover:text-[#1e293b] focus-visible:ring-[#0f172a]"
    }
    
    const sizes = {
      sm: "px-4 py-2 text-xs h-8",
      md: "px-6 py-2.5 text-sm h-10",
      lg: "px-8 py-3 text-base h-12"
    }
    
    return (
      <button
        className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
