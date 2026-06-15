import {
    AcademicRule,
    AcademicRulesSummary,
    PrincipalTimetableIntelligence,
    TeacherWorkloadSummary,
    TimetableBatchSummary,
    TimetableClassSectionReview,
    TimetableConflict,
    TimetableEntry,
    TimetableExportResponse,
    TimetableGenerationRequest,
    TimetableGenerationResponse,
    TimetableLiveResponse,
    TimetableManualEditRequest,
    TimetablePublishAudit,
    TimetablePublishResponse,
    TimetableRepairResult,
} from '../types/timetable';
import { API_BASE_URL } from './api';

async function safeJson<T>(response: Response): Promise<T> {
    if (!response.ok) {
        throw new Error(`Timetable API failed with status ${response.status}`);
    }
    return response.json();
}

export async function generateTimetable(
    request: TimetableGenerationRequest
): Promise<TimetableGenerationResponse> {
    const response = await fetch(`${API_BASE_URL}/timetable/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    return safeJson<TimetableGenerationResponse>(response);
}

export async function getClassTimetable(className: string, section: string): Promise<TimetableEntry[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/class/${className}/${section}`);
    return safeJson<TimetableEntry[]>(response);
}

export async function getTeacherTimetable(teacherId: number): Promise<TimetableEntry[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/teacher/${teacherId}`);
    return safeJson<TimetableEntry[]>(response);
}

export async function getTimetableReview(generatedBatchId: string): Promise<TimetableClassSectionReview[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/review/${encodeURIComponent(generatedBatchId)}`);
    const data = await safeJson<TimetableGenerationResponse | TimetableClassSectionReview[]>(response);
    if (Array.isArray(data)) {
        return data;
    }
    return data.classSectionReviews || [];
}

export async function getTimetableConflicts(generatedBatchId?: string): Promise<TimetableConflict[]> {
    const url = generatedBatchId && generatedBatchId !== 'DEMO'
        ? `${API_BASE_URL}/timetable/conflicts/${encodeURIComponent(generatedBatchId)}`
        : `${API_BASE_URL}/timetable/conflicts`;
    const response = await fetch(url);
    return safeJson<TimetableConflict[]>(response);
}

export async function getTeacherWorkloadSummary(generatedBatchId?: string): Promise<TeacherWorkloadSummary[]> {
    const url = generatedBatchId && generatedBatchId !== 'DEMO'
        ? `${API_BASE_URL}/timetable/workload-analysis/${encodeURIComponent(generatedBatchId)}`
        : `${API_BASE_URL}/timetable/workload-summary`;
    const response = await fetch(url);
    return safeJson<TeacherWorkloadSummary[]>(response);
}

export async function publishTimetable(generatedBatchId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/timetable/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedBatchId }),
    });
    return safeJson<{ success: boolean; message: string }>(response);
}


export async function getDefaultAcademicRules(request: Partial<TimetableGenerationRequest>): Promise<AcademicRule[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/academic-rules/defaults`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    return safeJson<AcademicRule[]>(response);
}

export async function validateAcademicRules(request: Partial<TimetableGenerationRequest>): Promise<AcademicRulesSummary> {
    const response = await fetch(`${API_BASE_URL}/timetable/academic-rules/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    return safeJson<AcademicRulesSummary>(response);
}


export async function repairTimetable(generatedBatchId: string): Promise<TimetableRepairResult> {
    const response = await fetch(`${API_BASE_URL}/timetable/repair/${encodeURIComponent(generatedBatchId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    return safeJson<TimetableRepairResult>(response);
}

export async function manualEditTimetableEntry(
    generatedBatchId: string,
    request: TimetableManualEditRequest
): Promise<TimetableGenerationResponse> {
    const response = await fetch(`${API_BASE_URL}/timetable/manual-edit/${encodeURIComponent(generatedBatchId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    return safeJson<TimetableGenerationResponse>(response);
}

export async function publishGeneratedTimetable(generatedBatchId: string): Promise<TimetablePublishResponse> {
    const response = await fetch(`${API_BASE_URL}/timetable/publish/${encodeURIComponent(generatedBatchId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    return safeJson<TimetablePublishResponse>(response);
}

export async function exportGeneratedTimetable(generatedBatchId: string, format: 'PDF' | 'EXCEL'): Promise<TimetableExportResponse> {
    const response = await fetch(`${API_BASE_URL}/timetable/export/${encodeURIComponent(generatedBatchId)}?format=${format}`);
    return safeJson<TimetableExportResponse>(response);
}

export async function getPrincipalTimetableIntelligence(generatedBatchId: string): Promise<PrincipalTimetableIntelligence> {
    const response = await fetch(`${API_BASE_URL}/timetable/principal-intelligence/${encodeURIComponent(generatedBatchId)}`);
    return safeJson<PrincipalTimetableIntelligence>(response);
}

export async function getTimetablePublishHistory(generatedBatchId: string): Promise<TimetablePublishAudit[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/publish-history/${encodeURIComponent(generatedBatchId)}`);
    return safeJson<TimetablePublishAudit[]>(response);
}

export async function getLatestPublishedTimetable(): Promise<TimetablePublishAudit> {
    const response = await fetch(`${API_BASE_URL}/timetable/latest-published`);
    return safeJson<TimetablePublishAudit>(response);
}

export async function getActivePublishedTimetableForRole(role: 'TEACHER' | 'STUDENT' | 'PARENT', params: { schoolId?: string; teacherId?: number; teacherName?: string; className?: string; section?: string } = {}): Promise<TimetableLiveResponse> {
    const query = new URLSearchParams();
    if (params.schoolId) query.set('schoolId', params.schoolId);
    if (params.teacherId) query.set('teacherId', String(params.teacherId));
    if (params.teacherName) query.set('teacherName', params.teacherName);
    if (params.className) query.set('className', params.className);
    if (params.section) query.set('section', params.section);
    const path = role === 'TEACHER' ? '/timetable/live/teacher' : role === 'PARENT' ? '/timetable/live/parent' : '/timetable/live/student';
    const response = await fetch(`${API_BASE_URL}${path}?${query.toString()}`, {
        headers: params.schoolId ? { 'X-School-Id': params.schoolId } : undefined,
    });
    return safeJson<TimetableLiveResponse>(response);
}

export async function getTimetableBatches(): Promise<TimetableBatchSummary[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/batches`);
    return safeJson<TimetableBatchSummary[]>(response);
}
