import type { ApiTeamMember } from '@/types/project'

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
