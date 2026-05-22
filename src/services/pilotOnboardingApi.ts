import API_ENDPOINTS, { DEV_DEFAULTS } from '../constants/apiConfig';
import { api } from './api';

export type PilotOnboardingStep = {
    key: string;
    title: string;
    owner: string;
    status: string;
    priority: string;
    detail: string;
};

export type PilotOnboardingSummary = {
    schoolId: number;
    schoolName: string;
    targetStudents: number;
    targetTeachers: number;
    targetAdmins: number;
    targetPrincipals: number;
    readinessStatus: string;
    plannedPilotStartDate: string;
    steps: PilotOnboardingStep[];
};

export const pilotOnboardingFallback: PilotOnboardingSummary = {
    schoolId: DEV_DEFAULTS.schoolId,
    schoolName: 'VidyaSetu Pilot School',
    targetStudents: 700,
    targetTeachers: 40,
    targetAdmins: 1,
    targetPrincipals: 1,
    readinessStatus: 'LOCAL_FALLBACK',
    plannedPilotStartDate: 'After 14-day validation',
    steps: [
        {
            key: 'TENANT_SETUP',
            title: 'Create pilot tenant and verify school_id isolation',
            owner: 'Admin',
            status: 'READY_FOR_VALIDATION',
            priority: 'P0',
            detail: 'Confirm API responses are tenant-scoped before real school data is enabled.',
        },
        {
            key: 'MASTER_IMPORT',
            title: 'Validate pilot Excel onboarding workbook',
            owner: 'Admin',
            status: 'IN_PROGRESS',
            priority: 'P0',
            detail: 'Use one workbook for 700 students, 30–40 teachers, parent links, subjects, and teacher pools.',
        },
        {
            key: 'GO_LIVE_SIGNOFF',
            title: 'Principal/Admin signoff before parent/student rollout',
            owner: 'School Head',
            status: 'PENDING',
            priority: 'P0',
            detail: 'Mobile stays daily-first; web remains bulk/admin-first for pilot support.',
        },
    ],
};

export async function getPilotOnboardingSummary(schoolId: number = DEV_DEFAULTS.schoolId): Promise<PilotOnboardingSummary> {
    const response = await api.get<PilotOnboardingSummary>(API_ENDPOINTS.pilotOnboardingSummary, { params: { schoolId } });
    return response.data;
}
