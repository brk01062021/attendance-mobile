import { api } from './api';

export type SchoolIdAvailabilityResponse = {
    schoolId: string;
    available: boolean;
    status: string;
    message: string;
};

export type SchoolRegistrationPayload = {
    schoolName: string;
    requestedSchoolId: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail?: string;
    city?: string;
    state?: string;
    expectedStudents?: number | null;
    expectedTeachers?: number | null;
    notes?: string;
};

export type PilotDemoPayload = {
    schoolName: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail?: string;
    preferredRole?: string;
    city?: string;
    state?: string;
    expectedStudents?: number | null;
    notes?: string;
};

export type OnboardingStatus = 'RESERVED' | 'PENDING' | 'APPROVED' | 'PILOT' | 'ACTIVE' | 'REJECTED';

export type RegistrationResponse = {
    referenceId: string;
    schoolId?: string | null;
    schoolName: string;
    status: string;
    message: string;
    nextStep: string;
};

export function normalizeRequestedSchoolId(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

export async function checkSchoolId(schoolId: string) {
    const response = await api.get<SchoolIdAvailabilityResponse>('/school-registration/school-id/check', {
        params: { schoolId },
    });
    return response.data;
}

export async function registerSchool(payload: SchoolRegistrationPayload) {
    const response = await api.post<RegistrationResponse>('/school-registration/register', payload);
    return response.data;
}

export async function requestPilotDemo(payload: PilotDemoPayload) {
    const response = await api.post<RegistrationResponse>('/school-registration/pilot-demo/request', payload);
    return response.data;
}


export type OnboardingStatusResponse = {
    referenceId: string;
    schoolId?: string | null;
    schoolName: string;
    requestType: string;
    status: OnboardingStatus;
    message: string;
    nextStep: string;
    loginEnabled: boolean;
    importEnabled: boolean;
};

export type OnboardingReviewItem = {
    referenceId: string;
    schoolId?: string | null;
    schoolName: string;
    requestType: string;
    status: OnboardingStatus;
    contactPerson?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    expectedStudents?: number | null;
    expectedTeachers?: number | null;
    city?: string | null;
    state?: string | null;
    submittedAt?: string | null;
    updatedAt?: string | null;
    approvedAt?: string | null;
    pilotActivatedAt?: string | null;
    activatedAt?: string | null;
    rejectedAt?: string | null;
    reviewNotes?: string | null;
    statusHistory?: string | null;
};

export function onboardingStatusLabel(status: string) {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (value) => value.toUpperCase());
}

export async function getOnboardingStatus(referenceId: string) {
    const response = await api.get<OnboardingStatusResponse>('/school-registration/status', { params: { referenceId } });
    return response.data;
}

export async function getOnboardingReviewQueue() {
    const response = await api.get<OnboardingReviewItem[]>('/school-registration/review-queue');
    return response.data;
}

export function normalizeOnboardingText(value?: string | null) {
    return (value || '').replace(/\\n/g, '\n');
}

export async function updateOnboardingStatus(referenceId: string, status: OnboardingStatus, reviewNotes?: string) {
    const response = await api.post<OnboardingStatusResponse>(`/school-registration/review/${referenceId}/status`, { status, reviewNotes });
    return response.data;
}

export async function runOnboardingAction(referenceId: string, action: 'approve' | 'reject' | 'mark-pilot' | 'activate', reviewNotes?: string) {
    const response = await api.post<OnboardingStatusResponse>(`/school-registration/review/${referenceId}/${action}`, { reviewNotes });
    return response.data;
}
