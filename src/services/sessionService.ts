export type VidyaSetuRole = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'PARENT' | 'STUDENT';

export type VidyaSetuSession = {
  role: VidyaSetuRole;
  userId: string;
  displayName: string;
  schoolId: string;
  schoolName: string;
  token?: string;
};

let activeSession: VidyaSetuSession | null = null;

export function normalizeSchoolId(value?: string) {
  const schoolId = (value || 'DEMO').trim().toUpperCase();
  return /^[A-Z0-9]{4}$/.test(schoolId) ? schoolId : 'DEMO';
}

export function saveSession(session: VidyaSetuSession) {
  activeSession = { ...session, schoolId: normalizeSchoolId(session.schoolId) };
  return activeSession;
}

export function getSession() { return activeSession; }

export function clearSession() { activeSession = null; }

export function getRoleGreeting(role: VidyaSetuRole, displayName?: string) {
  const fallback = role === 'ADMIN' ? 'Admin' : role === 'PRINCIPAL' ? 'Principal' : displayName || 'User';
  return displayName?.trim() || fallback;
}
