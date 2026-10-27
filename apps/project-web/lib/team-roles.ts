import { Code, Crown, UserRound } from "lucide-react"
import type { DirectoryRole } from "@/components/people-directory-table"

export const TEAM_ROLES = [
  { value: "tech_lead", label: "Tech Lead" },
  { value: "developer", label: "Developer" },
  { value: "devops", label: "DevOps" },
  { value: "product_owner", label: "Product Owner" },
  { value: "scrum_master", label: "Scrum Master" },
  { value: "qa", label: "QA" },
  { value: "designer", label: "Designer" },
  { value: "architect", label: "Architect" },
  { value: "member", label: "Miembro" },
  { value: "analyst", label: "Analista" },
  { value: "technician", label: "Técnico" },
]

export const teamRoleConfig: Record<string, DirectoryRole> = Object.fromEntries(TEAM_ROLES.map(role => [role.value, {
  label: role.label,
  icon: role.value === "tech_lead" || role.value === "product_owner" ? Crown : role.value === "member" ? UserRound : Code,
  color: role.value === "member"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
    : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300",
}]))
