import axios from 'axios';

export const API_BASE_URL = 'http://192.168.1.75:8080';

export const DEV_DEFAULTS = {
    adminId: 1,
    teacherId: 1,
    schoolId: 1,
    className: '10',
    section: 'A',
    dashboardDate: '2026-04-27',
    analyticsStartDate: '2026-05-01',
    analyticsEndDate: '2026-05-31',
};

export const API_ENDPOINTS = {
    authLogin: `${API_BASE_URL}/auth/login`,

    loadStudents: `${API_BASE_URL}/students`,
    submitAttendance: `${API_BASE_URL}/attendance`,
    dateSummary: `${API_BASE_URL}/attendance/date-summary`,
    attendanceReport: `${API_BASE_URL}/attendance/report`,
    studentAttendanceReport: `${API_BASE_URL}/attendance/student-report`,

    adminDashboard: `${API_BASE_URL}/attendance/dashboard/admin`,
    adminStudentDashboard: `${API_BASE_URL}/attendance/dashboard/admin/students`,

    teacherDashboard: `${API_BASE_URL}/attendance/dashboard/teacher`,
    teacherClassDashboard: `${API_BASE_URL}/attendance/dashboard/teacher/classes`,

    teacherSchedules: `${API_BASE_URL}/teacher-schedules`,
    availableReplacementTeachers: `${API_BASE_URL}/teacher-schedules/available-replacements`,
    autoAssignBestMatches: `${API_BASE_URL}/teacher-schedules/auto-assign-best`,
    bulkAssignReplacement: `${API_BASE_URL}/teacher-schedules/bulk-assign-replacement`,

    teacherSubjects: `${API_BASE_URL}/teacher-assignments/subjects`,
    teacherClasses: `${API_BASE_URL}/teacher-assignments/classes`,
    teacherSections: `${API_BASE_URL}/teacher-assignments/sections`,

    analyticsSummary: `${API_BASE_URL}/analytics/summary`,
    attendanceTrends: `${API_BASE_URL}/analytics/attendance-trends`,
    classAttendanceComparison: `${API_BASE_URL}/analytics/class-attendance-comparison`,
    sectionAnalytics: `${API_BASE_URL}/analytics/section-analytics`,
    teacherReplacementTrend: `${API_BASE_URL}/analytics/teacher-replacement-trend`,

    principalDashboardSummary: `${API_BASE_URL}/principal/dashboard/summary`,
    principalRiskAlerts: `${API_BASE_URL}/principal/dashboard/risk-alerts`,
    principalClassComparison: `${API_BASE_URL}/principal/dashboard/class-comparison`,
    principalExecutiveOverview: `${API_BASE_URL}/principal/dashboard/executive-overview`,
    principalTeacherWorkload: `${API_BASE_URL}/principal/dashboard/teacher-workload`,
    principalExecutiveAlerts: `${API_BASE_URL}/principal/dashboard/executive-alerts`,

    analyticsAttendanceTrend: `${API_BASE_URL}/analytics/attendance-trends`,
    analyticsClassAttendanceTrend: `${API_BASE_URL}/analytics/class-attendance-comparison`,

    teacherMonthlyOverview: `${API_BASE_URL}/admin/reports/teacher-monthly-overview`,
    teacherMonthlyLeaves: `${API_BASE_URL}/admin/reports/teacher-monthly-leaves`,
    teacherMonthlyReplacementCoverage: `${API_BASE_URL}/admin/reports/teacher-monthly-replacement-coverage`,

    teacherInsight: `${API_BASE_URL}/admin/reports/teacher-insight`,
    teacherSearch: `${API_BASE_URL}/admin/reports/teachers/search`,
    teacherAttendanceHistory: `${API_BASE_URL}/admin/reports/teacher`,
    teacherLeaveHistory: `${API_BASE_URL}/admin/reports/teacher`,
    teacherReplacementHistory: `${API_BASE_URL}/admin/reports/teacher`,
    teacherExamHistory: `${API_BASE_URL}/admin/reports/teacher`,

    studentSearch: `${API_BASE_URL}/students/search`,

    schoolNotices: `${API_BASE_URL}/school-notices`,
    notifications: `${API_BASE_URL}/notifications`,

    teacherLeavePreview: `${API_BASE_URL}/teacher-leave/preview-replacements`,
    teacherLeaveSubmit: `${API_BASE_URL}/teacher-leave/submit`,
    teacherLeavePending: `${API_BASE_URL}/teacher-leave/admin/pending`,
    teacherLeaveApprove: `${API_BASE_URL}/teacher-leave/admin/approve`,
    replacementLoadSummary: `${API_BASE_URL}/teacher-replacements/load-summary`,
    studentAttendanceRisk: `${API_BASE_URL}/student-risk/attendance`,
};

export const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    async (config: any) => {
        return config;
    },
    (error: any) => Promise.reject(error)
);

api.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
        console.log('API Error:', error?.response?.data || error.message);
        return Promise.reject(error);
    }
);

export default API_ENDPOINTS;
