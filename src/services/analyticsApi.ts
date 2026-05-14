import { API_ENDPOINTS } from './api';

export type AnalyticsSummary = {
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  attendancePercentage: number;
  totalTeacherLeaves: number;
  totalReplacementsAssigned: number;
  totalReplacementsMissing: number;
};

export type AttendanceTrendItem = {
  date: string;
  presentCount: number;
  absentCount: number;
  totalCount: number;
  attendancePercentage: number;
};

export type ClassAttendanceTrendItem = {
  className: string;
  section: string;
  presentCount: number;
  absentCount: number;
  totalCount: number;
  attendancePercentage: number;
};

const getJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API failed: ${response.status}`);
  }

  return response.json();
};

export const fetchAnalyticsSummary = async (
    startDate: string,
    endDate: string
): Promise<AnalyticsSummary> => {
  const url =
      API_ENDPOINTS.analyticsSummary +
      `?startDate=${encodeURIComponent(startDate)}` +
      `&endDate=${encodeURIComponent(endDate)}`;

  return getJson<AnalyticsSummary>(url);
};

export const fetchAttendanceTrend = async (
    startDate: string,
    endDate: string
): Promise<AttendanceTrendItem[]> => {
  const url =
      API_ENDPOINTS.analyticsAttendanceTrend +
      `?startDate=${encodeURIComponent(startDate)}` +
      `&endDate=${encodeURIComponent(endDate)}`;

  return getJson<AttendanceTrendItem[]>(url);
};

export const fetchClassAttendanceTrend = async (
    date: string
): Promise<ClassAttendanceTrendItem[]> => {
  const url =
      API_ENDPOINTS.analyticsClassAttendanceTrend +
      `?date=${encodeURIComponent(date)}`;

  return getJson<ClassAttendanceTrendItem[]>(url);
};
