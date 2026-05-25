import { Href, router } from 'expo-router';
import { getSession, VidyaSetuRole } from '../services/sessionService';

export type SourceRole = 'admin' | 'principal' | 'teacher' | 'student' | 'parent';

export const ROLE_DASHBOARD_PATHS: Record<SourceRole, string> = {
  admin: '/admin-dashboard',
  principal: '/principal-home',
  teacher: '/teacher-dashboard',
  student: '/student-dashboard',
  parent: '/parent-dashboard',
};

export function normalizeSourceRole(value?: string | string[] | null): SourceRole {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = String(raw || getSession()?.role || 'admin').trim().toLowerCase();
  if (normalized === 'principal') return 'principal';
  if (normalized === 'teacher') return 'teacher';
  if (normalized === 'student') return 'student';
  if (normalized === 'parent') return 'parent';
  return 'admin';
}

export function toRoleParam(sourceRole: SourceRole): VidyaSetuRole {
  return sourceRole.toUpperCase() as VidyaSetuRole;
}

export function getDashboardPath(sourceRole?: string | string[] | null) {
  return ROLE_DASHBOARD_PATHS[normalizeSourceRole(sourceRole)];
}

export function getRoleNavigationParams(params: Record<string, any> = {}, fallbackRole?: string | string[] | null) {
  const sourceRole = normalizeSourceRole(params.sourceRole || params.originRole || params.role || fallbackRole);
  const session = getSession();
  return {
    ...params,
    role: String(params.role || toRoleParam(sourceRole)),
    sourceRole,
    originRole: String(params.originRole || sourceRole),
    returnTo: String(params.returnTo || ROLE_DASHBOARD_PATHS[sourceRole]),
    schoolId: String(params.schoolId || session?.schoolId || 'BRK1'),
  };
}

export function goRoleHome(sourceRole?: string | string[] | null, params: Record<string, any> = {}) {
  const normalized = normalizeSourceRole(sourceRole || params.sourceRole || params.originRole || params.role);
  router.replace({ pathname: ROLE_DASHBOARD_PATHS[normalized] as any, params: getRoleNavigationParams(params, normalized) } as Href);
}

export function routeWithSource(pathname: string, params: Record<string, any> = {}) {
  return { pathname: pathname as any, params: getRoleNavigationParams(params) } as Href;
}
