'use client'

import { useCallback, useMemo } from 'react'
import { useAuth } from './useAuth'
import { RoleType } from '../../domain/value-objects/Role'
import { PermissionService } from '../../domain/services/PermissionService'
import { AuthorizationService } from '../../application/services/AuthorizationService'

export interface PermissionCheck {
  hasPermission: (resource: string, action: string, teamId?: string) => boolean
  hasRole: (role: RoleType, teamId: string) => boolean
  canAccessTeam: (teamId: string) => boolean
  isTeamOwner: (teamId: string) => boolean
  isTeamAdmin: (teamId: string) => boolean
  isTeamMember: (teamId: string) => boolean
  canManageTeam: (teamId: string) => boolean
  canManageUsers: (teamId: string) => boolean
  canViewReports: (teamId: string) => boolean
  canEditProject: (projectId: string, teamId: string) => boolean
  canDeleteProject: (projectId: string, teamId: string) => boolean
  getAccessibleTeams: () => string[]
  getHighestRole: (teamId: string) => RoleType | null
}

export function usePermissions(): PermissionCheck {
  const { user } = useAuth()
  const permissionService = useMemo(() => new PermissionService(), [])
  const authorizationService = useMemo(() => new AuthorizationService(), [])

  const hasPermission = useCallback(
    (resource: string, action: string, teamId?: string): boolean => {
      if (!user || !teamId) return false
      
      try {
        return authorizationService.hasPermission(
          user.getId(),
          teamId,
          resource,
          action
        )
      } catch (error) {
        console.error('Permission check error:', error)
        return false
      }
    },
    [user, authorizationService]
  )

  const hasRole = useCallback(
    (role: RoleType, teamId: string): boolean => {
      if (!user) return false
      return user.hasRoleInTeam(teamId, role)
    },
    [user]
  )

  const canAccessTeam = useCallback(
    (teamId: string): boolean => {
      if (!user) return false
      return user.canAccessTeam(teamId)
    },
    [user]
  )

  const isTeamOwner = useCallback(
    (teamId: string): boolean => {
      if (!user) return false
      return user.isTeamOwner(teamId)
    },
    [user]
  )

  const isTeamAdmin = useCallback(
    (teamId: string): boolean => {
      if (!user) return false
      return user.isTeamAdmin(teamId)
    },
    [user]
  )

  const isTeamMember = useCallback(
    (teamId: string): boolean => {
      if (!user) return false
      return user.isTeamMember(teamId)
    },
    [user]
  )

  const canManageTeam = useCallback(
    (teamId: string): boolean => {
      if (!user) return false
      
      const role = user.getRoleInTeam(teamId)
      if (!role) return false
      
      // Only owners and admins can manage teams
      return role.getValue() === RoleType.OWNER || role.getValue() === RoleType.ADMIN
    },
    [user]
  )

  const canManageUsers = useCallback(
    (teamId: string): boolean => {
      if (!user) return false
      
      const role = user.getRoleInTeam(teamId)
      if (!role) return false
      
      // Only owners and admins can manage users
      return role.getValue() === RoleType.OWNER || role.getValue() === RoleType.ADMIN
    },
    [user]
  )

  const canViewReports = useCallback(
    (teamId: string): boolean => {
      if (!user) return false
      
      // All team members can view reports
      return user.isTeamMember(teamId)
    },
    [user]
  )

  const canEditProject = useCallback(
    (projectId: string, teamId: string): boolean => {
      if (!user) return false
      
      const role = user.getRoleInTeam(teamId)
      if (!role) return false
      
      // Owners and admins can always edit
      if (role.getValue() === RoleType.OWNER || role.getValue() === RoleType.ADMIN) {
        return true
      }
      
      // Members need specific permission
      return hasPermission('project', 'edit', teamId)
    },
    [user, hasPermission]
  )

  const canDeleteProject = useCallback(
    (projectId: string, teamId: string): boolean => {
      if (!user) return false
      
      const role = user.getRoleInTeam(teamId)
      if (!role) return false
      
      // Only owners and admins can delete projects
      return role.getValue() === RoleType.OWNER || role.getValue() === RoleType.ADMIN
    },
    [user]
  )

  const getAccessibleTeams = useCallback((): string[] => {
    if (!user) return []
    
    const teams: string[] = []
    const roles = user.getAllRoles()
    
    for (const [teamId, role] of roles) {
      if (!user.isLocked()) {
        teams.push(teamId)
      }
    }
    
    return teams
  }, [user])

  const getHighestRole = useCallback(
    (teamId: string): RoleType | null => {
      if (!user) return null
      
      const role = user.getRoleInTeam(teamId)
      return role ? role.getValue() : null
    },
    [user]
  )

  return {
    hasPermission,
    hasRole,
    canAccessTeam,
    isTeamOwner,
    isTeamAdmin,
    isTeamMember,
    canManageTeam,
    canManageUsers,
    canViewReports,
    canEditProject,
    canDeleteProject,
    getAccessibleTeams,
    getHighestRole,
  }
}