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
  className?: string | null;
  section?: string | null;
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

export type ParentOtpPayload = {
  schoolId: string;
  studentId: string;
  parentMobile: string;
};

export type ParentActivatePayload = ParentOtpPayload & {
  otp: string;
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
    studentId: role === 'STUDENT' || role === 'PARENT' ? response.studentId || (role === 'STUDENT' ? response.userId : null) : null,
    studentName: response.studentName || (role === 'STUDENT' ? displayName : null),
    className: role === 'STUDENT' || role === 'PARENT' ? response.className || null : null,
    section: role === 'STUDENT' || role === 'PARENT' ? response.section || null : null,
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


export async function requestParentOtp(payload: ParentOtpPayload) {
  const schoolId = normalizeSchoolId(payload.schoolId);
  const response = await api.post('/auth/parent/request-otp', {
    schoolId,
    studentId: payload.studentId.trim(),
    parentMobile: payload.parentMobile.trim(),
  }, {
    headers: { 'X-School-Id': schoolId },
  });
  return response.data as { success: boolean; message: string; maskedMobile?: string };
}

export async function activateParentLogin(payload: ParentActivatePayload) {
  const schoolId = normalizeSchoolId(payload.schoolId);
  const response = await api.post<AuthResponse>('/auth/parent/activate', {
    schoolId,
    studentId: payload.studentId.trim(),
    parentMobile: payload.parentMobile.trim(),
    otp: payload.otp.trim(),
    newPassword: payload.newPassword,
  }, {
    headers: { 'X-School-Id': schoolId },
  });
  return response.data;
}
