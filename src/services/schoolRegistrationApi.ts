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
    registrationDate?: string | null;
    submittedAt?: string | null;
    approvedAt?: string | null;
    pilotActivatedAt?: string | null;
    activatedAt?: string | null;
    submittedBy?: string | null;
    approvedBy?: string | null;
    pilotEnabledBy?: string | null;
    activatedBy?: string | null;
    credentialsIssuedBy?: string | null;
    credentialsIssuedAt?: string | null;
    statusHistory?: string | null;
};

export type OnboardingReviewItem = OnboardingStatusResponse & {
    contactPerson?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    expectedStudents?: number | null;
    expectedTeachers?: number | null;
    city?: string | null;
    state?: string | null;
    updatedAt?: string | null;
    rejectedAt?: string | null;
    reviewNotes?: string | null;
};

export type ActivationCredential = {
    role: string;
    username: string;
    initialPassword: string;
    displayName: string;
    created: boolean;
};

export type ActivationPackage = {
    referenceId: string;
    schoolId: string;
    schoolName: string;
    status: OnboardingStatus;
    registrationDate?: string | null;
    activatedAt?: string | null;
    credentialsIssuedAt?: string | null;
    message: string;
    nextStep: string;
    loginEnabled: boolean;
    credentials: ActivationCredential[];
    statusSummary: OnboardingStatusResponse;
};

export function onboardingStatusLabel(status: string) {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (value) => value.toUpperCase());
}

export async function getOnboardingStatus(referenceId: string) {
    const response = await api.get<OnboardingStatusResponse>('/school-registration/status', { params: { referenceId } });
    return response.data;
}

export async function getOnboardingStatusBySchoolId(schoolId: string) {
    const response = await api.get<OnboardingStatusResponse>('/school-registration/status/by-school-id', { params: { schoolId } });
    return response.data;
}

export async function getOnboardingReviewQueue() {
    const response = await api.get<OnboardingReviewItem[]>('/school-registration/review-queue');
    return response.data;
}

export function normalizeOnboardingText(value?: string | null) {
    return (value || '')
        .replace(/Admin\/Principal must review/g, 'VidyaSetu onboarding team will review')
        .replace(/registration submitted for Admin\/Principal review/gi, 'Registration submitted for VidyaSetu onboarding team review')
        .replace(/ADMIN_PRINCIPAL/g, 'VidyaSetu Onboarding Team')
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n');
}

export function statusTimeline(status?: string | null) {
    const order = ['PENDING', 'APPROVED', 'PILOT', 'ACTIVE'];
    const currentIndex = Math.max(0, order.indexOf(status || 'PENDING'));
    return [
        { key: 'PENDING', label: 'Submitted', done: currentIndex >= 0 },
        { key: 'APPROVED', label: 'Approved', done: currentIndex >= 1 },
        { key: 'PILOT', label: 'Pilot', done: currentIndex >= 2 },
        { key: 'ACTIVE', label: 'Active', done: currentIndex >= 3 },
    ];
}

export async function updateOnboardingStatus(referenceId: string, status: OnboardingStatus, reviewNotes?: string) {
    const response = await api.post<OnboardingStatusResponse>(`/school-registration/review/${referenceId}/status`, { status, reviewNotes });
    return response.data;
}

export async function runOnboardingAction(referenceId: string, action: 'approve' | 'reject' | 'mark-pilot' | 'activate', reviewNotes?: string) {
    const response = await api.post<OnboardingStatusResponse>(`/school-registration/review/${referenceId}/${action}`, { reviewNotes });
    return response.data;
}

export async function generateActivationPackage(referenceId: string) {
    const response = await api.post<ActivationPackage>(`/school-registration/activation-package/${referenceId}/generate`);
    return response.data;
}

export async function getActivationPackage(referenceId: string) {
    const response = await api.get<ActivationPackage>(`/school-registration/activation-package/${referenceId}`);
    return response.data;
}
