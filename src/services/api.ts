const BASE_URL = 'http://192.168.1.75:8080';

export const API_ENDPOINTS = {
    loadStudents: `${BASE_URL}/students`,
    submitAttendance: `${BASE_URL}/attendance`,
    dateSummary: `${BASE_URL}/attendance/date-summary`,
    attendanceReport: `${BASE_URL}/attendance/report`,
};