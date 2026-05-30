import { resolveSchoolName } from '../utils/schoolUtils';
import { api } from './api';
import { normalizeSchoolId, VidyaSetuRole, VidyaSetuSession } from './sessionService';

export type LoginPayload = {
  username: string;
  password: string;
  role: VidyaSetuRole;
  schoolId: string;
};

export type AuthResponse = {
  token: string;
  userId?: number | string;
  schoolId?: number | string;
  externalSchoolId?: string;
  schoolCode?: string;
  teacherId?: number | string | null;
  teacherName?: string | null;
  studentId?: number | string | null;
  studentName?: string | null;
  displayName?: string | null;
  schoolName?: string | null;
  role: VidyaSetuRole | string;
  forcePasswordChange?: boolean;
};

export type ChangePasswordPayload = {
  username: string;
  schoolId: string;
  currentPassword: string;
  newPassword: string;
};

function normalizeRole(value?: string, fallback: VidyaSetuRole = 'ADMIN'): VidyaSetuRole {
  const role = String(value || '').toUpperCase();
  if (role === 'ADMIN' || role === 'PRINCIPAL' || role === 'TEACHER' || role === 'PARENT' || role === 'STUDENT') return role;
  return fallback;
}

function authSchoolId(response: AuthResponse, requestedSchoolId?: string) {
  return normalizeSchoolId(response.externalSchoolId || response.schoolCode || String(response.schoolId || requestedSchoolId || 'BRK1'));
}

export function authResponseToSession(response: AuthResponse, requestedRole: VidyaSetuRole, username: string, requestedSchoolId: string): VidyaSetuSession {
  const role = normalizeRole(String(response.role || requestedRole), requestedRole);
  const schoolId = authSchoolId(response, requestedSchoolId);
  const displayName = String(response.displayName || response.teacherName || response.studentName || username || role);

  return {
    role,
    userId: String(response.userId || '1'),
    username: username.trim(),
    displayName,
    schoolId,
    schoolName: response.schoolName || resolveSchoolName(schoolId),
    token: response.token,
    teacherId: role === 'TEACHER' ? response.teacherId || response.userId || '1' : null,
    studentId: role === 'STUDENT' ? response.studentId || response.userId || '1' : null,
    forcePasswordChange: Boolean(response.forcePasswordChange),
  };
}

export async function loginWithTenant(payload: LoginPayload) {
  const response = await api.post<AuthResponse>('/auth/login', {
    username: payload.username.trim(),
    password: payload.password,
    role: payload.role,
    schoolId: normalizeSchoolId(payload.schoolId),
  });
  return response.data;
}

export async function changeTemporaryPassword(payload: ChangePasswordPayload) {
  const response = await api.post<AuthResponse>('/auth/change-password', {
    username: payload.username.trim(),
    schoolId: normalizeSchoolId(payload.schoolId),
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
  });
  return response.data;
}
