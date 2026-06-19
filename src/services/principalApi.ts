import type {
    ClassComparison,
    ExecutiveOverview,
    PrincipalSummary,
    RiskAlert,
    TeacherFatigueAlert,
    TeacherWorkload,
    TeacherWorkloadInsight,
    TrendPoint,
} from '../types/principal';
import { API_BASE_URL, DEV_DEFAULTS } from './api';
import { getSession, normalizeSchoolId } from './sessionService';

type ApiEnvelope<T> = { success?: boolean; message?: string; data?: T } | T;

function unwrap<T>(payload: ApiEnvelope<T>): T {
    if (payload && typeof payload === 'object' && 'data' in (payload as { data?: T })) {
        const data = (payload as { data?: T }).data;
        if (data !== undefined && data !== null) return data;
    }
    return payload as T;
}

function getTenantHeaders() {
    const session = getSession();
    const schoolId = normalizeSchoolId(session?.schoolId || 'TST2');
    return {
        'Content-Type': 'application/json',
        'X-School-Id': schoolId,
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    };
}

function buildUrl(path: string, query: Record<string, string | number | undefined | null> = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') params.set(key, String(value));
    });
    return `${API_BASE_URL}${path}${params.toString() ? `?${params.toString()}` : ''}`;
}

async function getJson<T>(url: string, fallback: T): Promise<T> {
    try {
        const response = await fetch(url, { headers: getTenantHeaders() });
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        const payload = await response.json();
        return unwrap<T>(payload);
    } catch (error) {
        console.log('Principal API unavailable:', url, error);
        return fallback;
    }
}

export async function fetchPrincipalSummary(date = DEV_DEFAULTS.dashboardDate): Promise<PrincipalSummary> {
    return getJson<PrincipalSummary>(buildUrl('/principal/dashboard/summary', { date }), {
        totalStudents: 0,
        totalTeachers: 0,
        todayAttendancePercentage: 0,
        studentsAbsentToday: 0,
        teachersOnLeave: 0,
        replacementPeriodsToday: 0,
        lowAttendanceStudents: 0,
        pendingTeacherAttendance: 0,
    });
}

export async function fetchExecutiveOverview(month: string): Promise<ExecutiveOverview> {
    return getJson<ExecutiveOverview>(buildUrl('/principal/dashboard/executive-overview', { month }), {
        overallAttendancePercentage: 0,
        lowAttendanceRiskStudents: 0,
        classesBelowThreshold: 0,
        teachersWithLeaveLoad: 0,
        replacementStressTeachers: 0,
        academicRiskAlerts: 0,
        topPerformingClass: 'No data',
        weakestPerformingSection: 'No data',
        replacementStressIndex: 0,
    });
}

export async function fetchExecutiveAlerts(month: string): Promise<RiskAlert[]> {
    return getJson<RiskAlert[]>(buildUrl('/principal/dashboard/executive-alerts', { month }), []);
}

export async function fetchAttendanceTrend(month: string): Promise<TrendPoint[]> {
    return getJson<TrendPoint[]>(buildUrl('/analytics/attendance-trends', { month }), []);
}

export async function fetchClassComparison(month: string): Promise<ClassComparison[]> {
    return getJson<ClassComparison[]>(buildUrl('/principal/dashboard/class-comparison', { month }), []);
}

export async function fetchTeacherWorkload(month: string): Promise<TeacherWorkload[]> {
    return getJson<TeacherWorkload[]>(buildUrl('/principal/dashboard/teacher-workload', { month }), []);
}


export async function fetchTeacherWorkloadSummary(date = DEV_DEFAULTS.dashboardDate): Promise<TeacherWorkloadInsight[]> {
    return getJson<TeacherWorkloadInsight[]>(buildUrl('/teacher-workload/summary', { date }), []);
}

export async function fetchTeacherFatigueAlerts(date = DEV_DEFAULTS.dashboardDate): Promise<TeacherFatigueAlert[]> {
    return getJson<TeacherFatigueAlert[]>(buildUrl('/teacher-workload/fatigue-alerts', { date }), []);
}


export type SchoolIntelligenceSnapshot = {
    activationStatus: string;
    readinessPercent: number;
    importCommitted: boolean;
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    attendancePercentage: number;
    totalTeachers: number;
    timetableLive: boolean;
    timetableStatus: string;
    timetableBatchId: string;
    totalClasses: number;
    totalSections: number;
    totalPeriodAllocations: number;
    publishedActivities: number;
    pendingActivities: number;
    latestWorkbookRows: number;
    workbookStatus: string;
    alerts: Array<{ tone: 'success' | 'warning' | 'danger'; title: string; message: string }>;
};

type ActivationSummary = {
    activationStatus?: string;
    readinessPercent?: number;
    importCommitted?: boolean;
};

type TimetableImportStatus = {
    status?: string;
    label?: string;
    importBatchId?: string;
    publishedBatchId?: string;
    activeBatchId?: string;
    totalClasses?: number;
    totalSections?: number;
    totalTeachers?: number;
    totalPeriodAllocations?: number;
};

type AdminAttendanceSummary = {
    totalStudents?: number;
    presentCount?: number;
    absentCount?: number;
    attendancePercentage?: number;
    percentage?: number;
};

type ImportWorkbookHistoryItem = {
    status?: string;
    totalRows?: number;
    rows?: number;
};

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function numeric(value: unknown, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function isPublishedTimetable(status?: TimetableImportStatus | null) {
    const state = String(status?.status || status?.label || '').toUpperCase();
    return state.includes('PUBLISHED') || state.includes('AVAILABLE') || numeric(status?.totalPeriodAllocations) > 0;
}

async function getJsonOrNull<T>(path: string, query: Record<string, string | number | undefined | null> = {}): Promise<T | null> {
    try {
        return await getJson<T>(buildUrl(path, query), null as T);
    } catch {
        return null;
    }
}

function asArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value && typeof value === 'object') {
        const anyValue = value as { content?: T[]; activities?: T[]; data?: T[] };
        return anyValue.content || anyValue.activities || anyValue.data || [];
    }
    return [];
}

export async function fetchSchoolIntelligenceSnapshot(date = todayIso()): Promise<SchoolIntelligenceSnapshot> {
    const session = getSession();
    const schoolId = normalizeSchoolId(session?.schoolId || 'TST2');

    const [activation, timetable, adminAttendance, principalSummaryData, workbookHistoryData, feedData, pendingData] = await Promise.all([
        getJsonOrNull<ActivationSummary>('/workspace-activation/summary', { schoolId }),
        getJsonOrNull<TimetableImportStatus>('/timetable/import-existing/status', { schoolId }),
        getJsonOrNull<AdminAttendanceSummary>('/attendance/dashboard/admin', { date }),
        getJsonOrNull<PrincipalSummary>('/principal/dashboard/summary', { date }),
        getJsonOrNull<ImportWorkbookHistoryItem[]>('/imports/workbooks/history', { schoolId }),
        getJsonOrNull<unknown>('/api/feed', { page: 0, size: 20 }),
        getJsonOrNull<unknown>('/api/activities/pending', { schoolId }),
    ]);

    const workbookHistory = Array.isArray(workbookHistoryData) ? workbookHistoryData : [];
    const latestCommittedWorkbook = workbookHistory.find((item) => String(item.status || '').toUpperCase().includes('COMMITTED'));
    const attendanceTotal = numeric(adminAttendance?.totalStudents || principalSummaryData?.totalStudents);
    const attendancePresent = numeric(adminAttendance?.presentCount || (principalSummaryData as any)?.presentStudents);
    const attendanceAbsent = numeric(adminAttendance?.absentCount || principalSummaryData?.studentsAbsentToday);
    const attendancePercentage = numeric(adminAttendance?.attendancePercentage ?? adminAttendance?.percentage ?? principalSummaryData?.todayAttendancePercentage);
    const totalTeachers = numeric(principalSummaryData?.totalTeachers || timetable?.totalTeachers);
    const totalPeriodAllocations = numeric(timetable?.totalPeriodAllocations);
    const timetableLive = isPublishedTimetable(timetable);
    const readinessPercent = numeric(activation?.readinessPercent);
    const pendingActivities = asArray<unknown>(pendingData).length;
    const publishedActivities = asArray<unknown>(feedData).length;

    const alerts: SchoolIntelligenceSnapshot['alerts'] = [];
    alerts.push(timetableLive
        ? { tone: 'success', title: 'Timetable ready', message: `${totalPeriodAllocations} active period allocations are available for school operations.` }
        : { tone: 'danger', title: 'Timetable not visible', message: 'Publish or refresh the active timetable before attendance rollout.' });
    alerts.push(pendingActivities > 0
        ? { tone: 'warning', title: 'Activity approvals pending', message: `${pendingActivities} teacher-submitted activity request(s) need review.` }
        : { tone: 'success', title: 'Activity approvals clear', message: 'No activity approval backlog is currently visible.' });
    alerts.push(readinessPercent >= 100
        ? { tone: 'success', title: 'Workspace ready', message: 'Workspace setup and workbook commit readiness are complete.' }
        : { tone: 'warning', title: 'Workspace readiness review', message: 'Complete remaining workspace readiness gates before production onboarding.' });

    return {
        activationStatus: activation?.activationStatus || 'ACTIVE',
        readinessPercent,
        importCommitted: Boolean(activation?.importCommitted || latestCommittedWorkbook),
        totalStudents: attendanceTotal,
        presentStudents: attendancePresent,
        absentStudents: attendanceAbsent,
        attendancePercentage,
        totalTeachers,
        timetableLive,
        timetableStatus: timetableLive ? 'LIVE' : 'NO',
        timetableBatchId: timetable?.publishedBatchId || timetable?.activeBatchId || timetable?.importBatchId || '',
        totalClasses: numeric(timetable?.totalClasses),
        totalSections: numeric(timetable?.totalSections),
        totalPeriodAllocations,
        publishedActivities,
        pendingActivities,
        latestWorkbookRows: numeric(latestCommittedWorkbook?.totalRows || latestCommittedWorkbook?.rows),
        workbookStatus: activation?.importCommitted || latestCommittedWorkbook ? 'OK' : 'WAIT',
        alerts,
    };
}
