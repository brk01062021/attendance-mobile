export type VidyaSetuRole = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'PARENT' | 'STUDENT';

export type VidyaSetuSession = {
  role: VidyaSetuRole;
  userId: string;
  displayName: string;
  schoolId: string;
  schoolName: string;
  token?: string;
  username?: string;
  forcePasswordChange?: boolean;
  teacherId?: string | number | null;
  studentId?: string | number | null;
};

let activeSession: VidyaSetuSession | null = null;

export function normalizeSchoolId(value?: string) {
  const schoolId = (value || '').trim().toUpperCase();
  return /^[A-Z0-9]{4}$/.test(schoolId) ? schoolId : 'BRK1';
}

export function saveSession(session: VidyaSetuSession) {
  activeSession = { ...session, schoolId: normalizeSchoolId(session.schoolId), forcePasswordChange: Boolean(session.forcePasswordChange) };
  return activeSession;
}

export function getSession() { return activeSession; }

export function clearSession() { activeSession = null; }

export function getRoleGreeting(role: VidyaSetuRole, displayName?: string) {
  const fallback = role === 'ADMIN' ? 'Admin' : role === 'PRINCIPAL' ? 'Principal' : role === 'TEACHER' ? 'Teacher' : role === 'STUDENT' ? 'Student' : displayName || 'User';
  return displayName?.trim() || fallback;
}
