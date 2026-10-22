import { AlertCircle, CheckCircle, Circle, Clock, TestTube, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ProjectStatus } from "@/types/project"

const statusConfig = {
  [ProjectStatus.PLANNING]: {
    icon: Circle,
    color: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-400/20 dark:bg-slate-400/10 dark:text-slate-300",
    iconColor: "text-slate-500 dark:text-slate-400",
  },
  [ProjectStatus.DEVELOPMENT]: {
    icon: Circle,
    color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  [ProjectStatus.TESTING]: {
    icon: TestTube,
    color: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  [ProjectStatus.STAGING]: {
    icon: Clock,
    color: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
    iconColor: "text-amber-700 dark:text-amber-400",
  },
  [ProjectStatus.PRODUCTION]: {
    icon: CheckCircle,
    color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  [ProjectStatus.MAINTENANCE]: {
    icon: Wrench,
    color: "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-400/20 dark:bg-orange-400/10 dark:text-orange-300",
    iconColor: "text-orange-700 dark:text-orange-400",
  },
  [ProjectStatus.DEPRECATED]: {
    icon: AlertCircle,
    color: "border-border bg-muted text-muted-foreground",
    iconColor: "text-muted-foreground",
  },
}

function getStatusConfig(status: string) {
  return statusConfig[status as ProjectStatus] ?? statusConfig[ProjectStatus.PLANNING]
}

export function ProjectStatusIcon({ status }: { status: string }) {
  const { icon: Icon, iconColor } = getStatusConfig(status)
  return <Icon className={cn("size-3 shrink-0", iconColor)} aria-hidden="true" />
}

export function ProjectStatusBadge({ status, showIcon = false, className }: {
  status: string
  showIcon?: boolean
  className?: string
}) {
  const { icon: Icon, color } = getStatusConfig(status)
  return (
    <Badge variant="outline" className={cn("rounded-full", color, className)}>
      {showIcon && <Icon className="size-3" aria-hidden="true" />}
      {status}
    </Badge>
  )
}
