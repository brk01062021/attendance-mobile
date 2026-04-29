const BASE_URL = 'http://192.168.1.75:8080';

export const API_ENDPOINTS = {
    authLogin: `${BASE_URL}/auth/login`,

    loadStudents: `${BASE_URL}/students`,
    submitAttendance: `${BASE_URL}/attendance`,
    dateSummary: `${BASE_URL}/attendance/date-summary`,
    attendanceReport: `${BASE_URL}/attendance/report`,
    teacherDashboard: `${BASE_URL}/attendance/dashboard/teacher`,
    teacherClassDashboard: `${BASE_URL}/attendance/dashboard/teacher/classes`,
    teacherSubjects: `${BASE_URL}/teacher-assignments/subjects`,
    teacherClasses: `${BASE_URL}/teacher-assignments/classes`,
    teacherSections: `${BASE_URL}/teacher-assignments/sections`,
};