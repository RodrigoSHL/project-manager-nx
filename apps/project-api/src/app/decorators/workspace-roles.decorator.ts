import { SetMetadata } from '@nestjs/common';

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export const WORKSPACE_ROLES_KEY = 'workspaceRoles';

/**
 * Declare the minimum workspace role required to access a route.
 * The guard reads workspaceId from req.params.workspaceId or req.body.workspaceId.
 *
 * Usage:
 *   @WorkspaceRoles('ADMIN')
 *   @UseGuards(WorkspaceRolesGuard)
 *   createProject(@Param('workspaceId') workspaceId: string) {}
 */
export const WorkspaceRoles = (...roles: WorkspaceRole[]) =>
  SetMetadata(WORKSPACE_ROLES_KEY, roles);
