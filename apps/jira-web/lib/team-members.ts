import type { ApiTeamMember } from '@/types/project'

export function getTeamRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    tech_lead: 'Tech Lead',
    developer: 'Developer',
    devops: 'DevOps',
    product_owner: 'Product Owner',
    scrum_master: 'Scrum Master',
    qa: 'QA',
    designer: 'Designer',
    architect: 'Architect',
    member: 'Miembro',
    analyst: 'Analista',
    technician: 'Técnico',
  }
  return labels[role] ?? role.replaceAll('_', ' ')
}

export function getTeamMemberAssigneeId(member: ApiTeamMember): string {
  return member.userId ?? member.id
}

export function isAssignedToTeamMember(
  assigneeId: string | null | undefined,
  member: ApiTeamMember,
): boolean {
  return Boolean(
    assigneeId
    && (assigneeId === member.userId || assigneeId === member.id),
  )
}

export function findTeamMemberByAssigneeId(
  teamMembers: ApiTeamMember[],
  assigneeId: string | null | undefined,
): ApiTeamMember | undefined {
  return teamMembers.find(member => isAssignedToTeamMember(assigneeId, member))
}
