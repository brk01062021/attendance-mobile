import {
    TimetableArchiveSummary,
    TimetableBinaryExportResponse,
    TimetableLiveResponse,
    TimetableManualEditRequest,
    TimetableNotification,
    TimetableOperationsStatus,
    TimetablePublishResponse,
    TimetableRolloutReadiness,
    TimetableVersion,
} from '../types/timetable';
import { API_BASE_URL } from './api';

async function safeJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new Error(`Timetable operations API failed with status ${response.status}`);
    }
    return response.json();
}

export async function getLiveTimetable(params: {
    batchId?: string;
    role?: 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'STUDENT' | 'PARENT' | string;
    teacherId?: number;
    className?: string;
    section?: string;
}): Promise<TimetableLiveResponse> {
    const query = new URLSearchParams();

    if (params.batchId) query.append('batchId', params.batchId);
    if (params.role) query.append('role', params.role);
    if (params.teacherId) query.append('teacherId', String(params.teacherId));
    if (params.className) query.append('className', params.className);
    if (params.section) query.append('section', params.section);

    const response = await fetch(`${API_BASE_URL}/timetable/operations/live?${query.toString()}`);
    return safeJson<TimetableLiveResponse>(response);
}

export async function getTimetableOperationsStatus(batchId: string): Promise<TimetableOperationsStatus> {
    const response = await fetch(`${API_BASE_URL}/timetable/operations/status/${encodeURIComponent(batchId)}`);
    return safeJson<TimetableOperationsStatus>(response);
}

export async function getTimetableRolloutReadiness(batchId: string): Promise<TimetableRolloutReadiness> {
    const response = await fetch(`${API_BASE_URL}/timetable/operations/rollout-readiness/${encodeURIComponent(batchId)}`);
    return safeJson<TimetableRolloutReadiness>(response);
}

export async function publishLockTimetable(
    batchId: string,
    role = 'ADMIN',
    approvedBy = 'Admin'
): Promise<TimetablePublishResponse> {
    const response = await fetch(
        `${API_BASE_URL}/timetable/operations/publish-lock/${encodeURIComponent(batchId)}?role=${encodeURIComponent(role)}&approvedBy=${encodeURIComponent(approvedBy)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }
    );

    return safeJson<TimetablePublishResponse>(response);
}

export async function exportTimetableBinary(
    batchId: string,
    format: 'PDF' | 'EXCEL'
): Promise<TimetableBinaryExportResponse> {
    const response = await fetch(`${API_BASE_URL}/timetable/operations/export/${encodeURIComponent(batchId)}?format=${format}`);
    return safeJson<TimetableBinaryExportResponse>(response);
}

export async function swapTimetableEntry(
    batchId: string,
    request: TimetableManualEditRequest,
    role = 'ADMIN'
): Promise<unknown> {
    const response = await fetch(
        `${API_BASE_URL}/timetable/operations/swap/${encodeURIComponent(batchId)}?role=${encodeURIComponent(role)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        }
    );

    return safeJson<unknown>(response);
}

export async function getTimetableVersions(batchId: string): Promise<TimetableVersion[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/operations/versions/${encodeURIComponent(batchId)}`);
    return safeJson<TimetableVersion[]>(response);
}

export async function rollbackTimetableVersion(
    batchId: string,
    versionNumber: number,
    role = 'ADMIN'
): Promise<TimetableVersion> {
    const response = await fetch(
        `${API_BASE_URL}/timetable/operations/rollback/${encodeURIComponent(batchId)}/${versionNumber}?role=${encodeURIComponent(role)}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        }
    );

    return safeJson<TimetableVersion>(response);
}

export async function getTimetableNotifications(batchId: string): Promise<TimetableNotification[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/operations/notifications/${encodeURIComponent(batchId)}`);
    return safeJson<TimetableNotification[]>(response);
}

export async function getTimetableArchives(): Promise<TimetableArchiveSummary[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/operations/archives`);
    return safeJson<TimetableArchiveSummary[]>(response);
}