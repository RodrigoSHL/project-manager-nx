import {
  findTeamMemberByAssigneeId,
  getTeamMemberAssigneeId,
  isAssignedToTeamMember,
} from './team-members'
import type { ApiTeamMember } from '@/types/project'

const member: ApiTeamMember = {
  id: 'membership-1',
  userId: 'user-1',
  projectId: 'project-1',
  name: 'Ana García',
  email: 'ana@example.com',
  role: 'developer',
}

describe('team member assignee helpers', () => {
  it('uses the real user id as the canonical assignee id', () => {
    expect(getTeamMemberAssigneeId(member)).toBe('user-1')
  })

  it('falls back to the project membership id for legacy members', () => {
    expect(getTeamMemberAssigneeId({ ...member, userId: null })).toBe('membership-1')
  })

  it('matches tickets stored with either the user id or legacy membership id', () => {
    expect(isAssignedToTeamMember('user-1', member)).toBe(true)
    expect(isAssignedToTeamMember('membership-1', member)).toBe(true)
    expect(findTeamMemberByAssigneeId([member], 'user-1')).toEqual(member)
    expect(findTeamMemberByAssigneeId([member], 'another-user')).toBeUndefined()
  })
})
