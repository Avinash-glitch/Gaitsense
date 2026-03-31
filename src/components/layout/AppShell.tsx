import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-14">
      <div className="fade-in">{children}</div>
    </div>
  )
}
