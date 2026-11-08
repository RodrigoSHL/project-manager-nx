'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import type { ApiProject } from '@/types/project'

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  activeView: string
  onViewChange: (view: string) => void
  currentProject: string
  onProjectChange: (projectId: string) => void
  onWorkspaceChange?: () => void
  projects?: ApiProject[]
  loadingProjects?: boolean
}

export function MobileSidebar({ open, onClose, onViewChange, onProjectChange, onWorkspaceChange, ...props }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent side="left" className="w-64 gap-0 p-0 [&>button:last-child]:hidden">
        <SheetTitle className="sr-only">Menú de FlowBoard</SheetTitle>
        <AppSidebar
          {...props}
          collapsed={false}
          onToggle={onClose}
          toggleLabel="Cerrar menú"
          onViewChange={view => { onViewChange(view); onClose() }}
          onProjectChange={id => { onProjectChange(id); onClose() }}
          onWorkspaceChange={() => { onWorkspaceChange?.(); onClose() }}
        />
      </SheetContent>
    </Sheet>
  )
}
