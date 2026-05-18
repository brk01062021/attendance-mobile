import { API_BASE_URL } from './api';
import {
    TeacherWorkloadSummary,
    TimetableConflict,
    TimetableEntry,
    TimetableGenerationRequest,
    TimetableGenerationResponse,
} from '../types/timetable';

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

export async function getTimetableConflicts(): Promise<TimetableConflict[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/conflicts`);
    return safeJson<TimetableConflict[]>(response);
}

export async function getTeacherWorkloadSummary(): Promise<TeacherWorkloadSummary[]> {
    const response = await fetch(`${API_BASE_URL}/timetable/workload-summary`);
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
