import { API_BASE_URL, DEV_DEFAULTS } from './api';
import type {
    ClassComparison,
    ExecutiveOverview,
    PrincipalSummary,
    RiskAlert,
    TeacherWorkload,
    TeacherWorkloadInsight,
    TeacherFatigueAlert,
    TrendPoint,
} from '../types/principal';

async function getJson<T>(url: string, fallback: T): Promise<T> {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.log('Principal API unavailable:', url, error);
        return fallback;
    }
}

export async function fetchPrincipalSummary(date = DEV_DEFAULTS.dashboardDate): Promise<PrincipalSummary> {
    return getJson<PrincipalSummary>(`${API_BASE_URL}/principal/dashboard/summary?date=${date}`, {
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
    return getJson<ExecutiveOverview>(`${API_BASE_URL}/principal/dashboard/executive-overview?month=${month}`, {
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
    return getJson<RiskAlert[]>(`${API_BASE_URL}/principal/dashboard/executive-alerts?month=${month}`, []);
}

export async function fetchAttendanceTrend(month: string): Promise<TrendPoint[]> {
    return getJson<TrendPoint[]>(`${API_BASE_URL}/analytics/attendance/monthly?month=${month}`, []);
}

export async function fetchClassComparison(month: string): Promise<ClassComparison[]> {
    return getJson<ClassComparison[]>(`${API_BASE_URL}/principal/dashboard/class-comparison?month=${month}`, []);
}

export async function fetchTeacherWorkload(month: string): Promise<TeacherWorkload[]> {
    return getJson<TeacherWorkload[]>(`${API_BASE_URL}/principal/dashboard/teacher-workload?month=${month}`, []);
}


export async function fetchTeacherWorkloadSummary(date = DEV_DEFAULTS.dashboardDate): Promise<TeacherWorkloadInsight[]> {
    return getJson<TeacherWorkloadInsight[]>(`${API_BASE_URL}/teacher-workload/summary?date=${date}`, []);
}

export async function fetchTeacherFatigueAlerts(date = DEV_DEFAULTS.dashboardDate): Promise<TeacherFatigueAlert[]> {
    return getJson<TeacherFatigueAlert[]>(`${API_BASE_URL}/teacher-workload/fatigue-alerts?date=${date}`, []);
}
