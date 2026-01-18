import { ReactNode } from 'react'

export default function InterviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-[#000]">
            AURA - Interview Aide à la Décision
          </h1>
          <p className="text-sm text-[#666]">
            Architecture Vision Assistant - V3
          </p>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

