'use client'

import { usePermissions } from '../hooks/usePermissions'
import { RoleType } from '../../domain/value-objects/Role'

export interface PermissionGuardProps {
  children: React.ReactNode
  teamId?: string
  resource?: string
  action?: string
  requiredRole?: RoleType
  requireOwner?: boolean
  requireAdmin?: boolean
  requireMember?: boolean
  fallback?: React.ReactNode
  checkFunction?: (permissions: ReturnType<typeof usePermissions>) => boolean
}

export function PermissionGuard({
  children,
  teamId,
  resource,
  action,
  requiredRole,
  requireOwner = false,
  requireAdmin = false,
  requireMember = false,
  fallback,
  checkFunction,
}: PermissionGuardProps) {
  const permissions = usePermissions()

  // Custom permission check
  if (checkFunction) {
    const hasPermission = checkFunction(permissions)
    if (!hasPermission) {
      return fallback ? <>{fallback}</> : null
    }
    return <>{children}</>
  }

  // Team-based checks
  if (teamId) {
    // Check specific role requirement
    if (requiredRole) {
      const hasRole = permissions.hasRole(requiredRole, teamId)
      if (!hasRole) {
        return fallback ? <>{fallback}</> : null
      }
    }

    // Check owner requirement
    if (requireOwner) {
      const isOwner = permissions.isTeamOwner(teamId)
      if (!isOwner) {
        return fallback ? <>{fallback}</> : null
      }
    }

    // Check admin requirement
    if (requireAdmin) {
      const isAdmin = permissions.isTeamAdmin(teamId) || permissions.isTeamOwner(teamId)
      if (!isAdmin) {
        return fallback ? <>{fallback}</> : null
      }
    }

    // Check member requirement
    if (requireMember) {
      const isMember = permissions.isTeamMember(teamId)
      if (!isMember) {
        return fallback ? <>{fallback}</> : null
      }
    }

    // Check resource-action permission
    if (resource && action) {
      const hasPermission = permissions.hasPermission(resource, action, teamId)
      if (!hasPermission) {
        return fallback ? <>{fallback}</> : null
      }
    }
  }

  // All checks passed
  return <>{children}</>
}

// Convenience components for common permission checks

export function OwnerOnly({ 
  teamId, 
  children, 
  fallback 
}: { 
  teamId: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard teamId={teamId} requireOwner fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function AdminOnly({ 
  teamId, 
  children, 
  fallback 
}: { 
  teamId: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard teamId={teamId} requireAdmin fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function MemberOnly({ 
  teamId, 
  children, 
  fallback 
}: { 
  teamId: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard teamId={teamId} requireMember fallback={fallback}>
      {children}
    </PermissionGuard>
  )
}

export function CanManageTeam({ 
  teamId, 
  children, 
  fallback 
}: { 
  teamId: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard 
      teamId={teamId} 
      checkFunction={(p) => p.canManageTeam(teamId)}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function CanEditProject({ 
  teamId,
  projectId, 
  children, 
  fallback 
}: { 
  teamId: string
  projectId: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard 
      teamId={teamId}
      checkFunction={(p) => p.canEditProject(projectId, teamId)}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function CanDeleteProject({ 
  teamId,
  projectId, 
  children, 
  fallback 
}: { 
  teamId: string
  projectId: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard 
      teamId={teamId}
      checkFunction={(p) => p.canDeleteProject(projectId, teamId)}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}

export function HasPermission({ 
  teamId,
  resource,
  action, 
  children, 
  fallback 
}: { 
  teamId: string
  resource: string
  action: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <PermissionGuard 
      teamId={teamId}
      resource={resource}
      action={action}
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}