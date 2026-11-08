'use client'

import type { ReactNode } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import ProjectManagement from '@/components/project-management'

export function ProjectWorkspaceLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const params = useParams<{ projectId?: string; ticketId?: string }>()
  const router = useRouter()
  return (
    <ProjectManagement
      ticketProjectId={params.ticketId ? params.projectId : undefined}
      showPage={pathname !== '/'}
      onNavigateToBoard={() => router.push('/')}
    >
      {children}
    </ProjectManagement>
  )
}
