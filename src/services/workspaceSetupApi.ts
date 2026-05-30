import { api } from './api';
import { getSession, normalizeSchoolId } from './sessionService';

export type WorkspaceStep = {
  key: string;
  label: string;
  completed: boolean;
  requiredBeforeImport: boolean;
};

export type WorkspaceChecklist = {
  schoolId: string;
  schoolName?: string;
  academicYear?: string;
  academicYearStartDate?: string;
  academicYearEndDate?: string;
  workingDays?: string;
  schoolStartTime?: string;
  schoolEndTime?: string;
  periodsPerDay?: number;
  completedSteps: number;
  totalSteps: number;
  progressPercent: number;
  importLocked: boolean;
  importLockMessage: string;
  steps: WorkspaceStep[];
};

type ApiEnvelope<T> = { data: T; message?: string; success?: boolean };

function currentSchoolId() {
  return normalizeSchoolId(getSession()?.schoolId);
}

export async function loadWorkspaceSetup() {
  const schoolId = currentSchoolId();
  const response = await api.get<ApiEnvelope<WorkspaceChecklist>>('/workspace-setup/status', { params: { schoolId } });
  return response.data.data;
}

export async function loadWorkspaceImportLock() {
  const schoolId = currentSchoolId();
  const response = await api.get<ApiEnvelope<WorkspaceChecklist>>('/workspace-setup/import-lock', { params: { schoolId } });
  return response.data.data;
}

export async function saveWorkspaceStep(stepKey: string, body: Record<string, unknown>) {
  const schoolId = currentSchoolId();
  const response = await api.post<ApiEnvelope<WorkspaceChecklist>>(`/workspace-setup/${stepKey}`, { ...body, completed: true }, { params: { schoolId } });
  return response.data.data;
}
