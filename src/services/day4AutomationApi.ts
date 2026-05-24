import type { ReplacementRecommendation, StudentRisk, TeacherLeaveRequest, TeacherWorkloadProtection } from '../types/day4Automation';
import { api } from './api';

export async function previewLeaveReplacements(payload: TeacherLeaveRequest) {
    const response = await api.post<ReplacementRecommendation[]>('/teacher-leave/preview-replacements', payload);
    return response.data;
}

export async function submitTeacherLeave(payload: TeacherLeaveRequest) {
    const response = await api.post('/teacher-leave/submit', payload);
    return response.data;
}

export async function submitTeacherLeaveEnquiry(payload: TeacherLeaveRequest) {
    const response = await api.post('/teacher-leave/enquiry', payload);
    return response.data;
}

export async function getPendingLeaveApprovals(fromDate: string, toDate: string) {
    const response = await api.get('/teacher-leave/admin/pending', { params: { fromDate, toDate } });
    return response.data;
}

export async function approveTeacherLeave(scheduleId: number, replacementTeacherId?: number | null, replacementTeacherName?: string | null) {
    const response = await api.post('/teacher-leave/admin/approve', null, {
        params: { scheduleId, replacementTeacherId, replacementTeacherName },
    });
    return response.data;
}

export async function getReplacementLoadSummary(fromDate: string, toDate: string) {
    const response = await api.get<TeacherWorkloadProtection[]>('/teacher-replacements/load-summary', { params: { fromDate, toDate } });
    return response.data;
}

export async function getStudentAttendanceRisk(fromDate: string, toDate: string, className?: string, section?: string) {
    const response = await api.get<StudentRisk[]>('/student-risk/attendance', { params: { fromDate, toDate, className, section } });
    return response.data;
}

export async function getPendingLeaveEnquiries(fromDate: string, toDate: string) {
    const response = await api.get('/teacher-leave/admin/enquiries', { params: { fromDate, toDate } });
    return response.data;
}

export async function approveTeacherLeaveEnquiry(enquiryId: number, adminRemarks?: string) {
    const response = await api.post(`/teacher-leave/admin/enquiries/${enquiryId}/approve`, null, { params: { adminRemarks } });
    return response.data;
}

export async function rejectTeacherLeaveEnquiry(enquiryId: number, adminRemarks?: string) {
    const response = await api.post(`/teacher-leave/admin/enquiries/${enquiryId}/reject`, null, { params: { adminRemarks } });
    return response.data;
}

export async function getTeacherLeaveEnquiryHistory(teacherId: number) {
    const response = await api.get(`/teacher-leave/enquiry/history/${teacherId}`);
    return response.data;
}

export async function getUnreadNotificationCount(userId: number, role: string) {
    const response = await api.get('/notifications/unread-count', { params: { userId, role } });
    return response.data;
}
