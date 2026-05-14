/**
 * VidyaSetu frontend API/environment constants.
 *
 * Day 1 Step 5 goal:
 * - keep backend URL in one place
 * - avoid duplicate hardcoded localhost/LAN URLs across screens
 * - make future pilot-school environment switching safer
 *
 * For local Expo testing, update DEFAULT_API_BASE_URL here if your machine IP changes.
 */
export const DEFAULT_API_BASE_URL = 'http://192.168.1.75:8080';

export const API_BASE_URL = DEFAULT_API_BASE_URL;

export const DEV_DEFAULTS = {
    dashboardDate: '2026-04-27',
    teacherId: '1',
    studentId: '2',
};

export const API_ENDPOINTS = {
    authLogin: `${API_BASE_URL}/auth/login`,

    loadStudents: `${API_BASE_URL}/students`,
    submitAttendance: `${API_BASE_URL}/attendance`,
    dateSummary: `${API_BASE_URL}/attendance/date-summary`,
    attendanceReport: `${API_BASE_URL}/attendance/report`,
    studentReport: `${API_BASE_URL}/attendance/student-report`,

    students: `${API_BASE_URL}/students`,
    studentClasses: `${API_BASE_URL}/students/classes`,
    studentSections: `${API_BASE_URL}/students/sections`,
    studentSearch: `${API_BASE_URL}/students/search`,

    adminDashboard: `${API_BASE_URL}/attendance/dashboard/admin`,
    adminDashboardClasses: `${API_BASE_URL}/attendance/dashboard/admin/classes`,
    adminDashboardTeachers: `${API_BASE_URL}/attendance/dashboard/admin/teachers`,
    adminDashboardSubjects: `${API_BASE_URL}/attendance/dashboard/admin/subjects`,
    adminStudentDashboard: `${API_BASE_URL}/attendance/dashboard/admin/students`,

    teacherDashboard: `${API_BASE_URL}/attendance/dashboard/teacher`,
    teacherClassDashboard: `${API_BASE_URL}/attendance/dashboard/teacher/classes`,
    teacherSchedules: `${API_BASE_URL}/teacher-schedules`,
    availableReplacementTeachers: `${API_BASE_URL}/teacher-schedules/available-replacements`,
    autoAssignBestMatches: `${API_BASE_URL}/teacher-schedules/auto-assign-best`,
    bulkAssignReplacement: `${API_BASE_URL}/teacher-schedules/bulk-assign-replacement`,
    replacementDashboard: `${API_BASE_URL}/teacher-schedules/reports/dashboard`,
    replacementDetails: `${API_BASE_URL}/teacher-schedules/reports/replacement-details`,

    teacherSubjects: `${API_BASE_URL}/teacher-assignments/subjects`,
    teacherClasses: `${API_BASE_URL}/teacher-assignments/classes`,
    teacherSections: `${API_BASE_URL}/teacher-assignments/sections`,

    analyticsSummary: `${API_BASE_URL}/analytics/summary`,
    analyticsAttendanceTrend: `${API_BASE_URL}/analytics/attendance-trend`,
    analyticsAttendanceMonthly: `${API_BASE_URL}/analytics/attendance/monthly`,
    analyticsClassAttendanceTrend: `${API_BASE_URL}/analytics/class-attendance-trend`,
    analyticsClassComparisonMonthly: `${API_BASE_URL}/analytics/class-comparison/monthly`,
    analyticsSectionComparison: `${API_BASE_URL}/analytics/section-comparison`,

    teacherMonthlyOverview: `${API_BASE_URL}/admin/reports/teacher-monthly-overview`,
    teacherMonthlyLeaves: `${API_BASE_URL}/admin/reports/teacher-monthly-leaves`,
    teacherMonthlyReplacementCoverage: `${API_BASE_URL}/admin/reports/teacher-monthly-replacement-coverage`,

    schoolNotices: `${API_BASE_URL}/school-notices`,
    notifications: `${API_BASE_URL}/notifications`,
};
