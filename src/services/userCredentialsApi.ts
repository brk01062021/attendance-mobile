import { api } from './api';
import { normalizeSchoolId } from './sessionService';

export type CredentialRole = 'TEACHER' | 'STUDENT';

export type UserCredential = {
  role: CredentialRole | string;
  username: string;
  temporaryPassword: string;
  displayName: string;
  linkedReference: string;
  created?: boolean;
  updated?: boolean;
};

export async function fetchUserCredentials(role: CredentialRole, schoolId: string): Promise<UserCredential[]> {
  const safeRole = String(role || 'TEACHER').toUpperCase() === 'STUDENT' ? 'STUDENT' : 'TEACHER';
  const response = await api.get<UserCredential[]>(`/api/user-provisioning/credentials/${safeRole}`, {
    params: { schoolId: normalizeSchoolId(schoolId) },
  });
  return Array.isArray(response.data) ? response.data : [];
}
