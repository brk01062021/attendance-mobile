export type TeacherLeaveRequest = {
    teacherId: number;
    teacherName?: string;
    fromDate: string;
    toDate: string;
    leaveType: 'PLANNED_LEAVE' | 'UNPLANNED_LEAVE';
    reason?: string;
};

export type ReplacementRecommendation = {
    scheduleId: number;
    teacherId: number;
    teacherName: string;
    className: string;
    section: string;
    subjectName: string;
    scheduleDate: string;
    periodTime: string;
    replacementTeacherId?: number | null;
    replacementTeacherName?: string | null;
    matchType: string;
    confidenceScore: number;
    dailyWorkload: number;
    overloaded: boolean;
};

export type TeacherWorkloadProtection = {
    teacherId: number;
    teacherName: string;
    scheduledPeriods: number;
    replacementPeriods: number;
    fatigueScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recommendation: string;
};

export type StudentRisk = {
    studentId: number;
    studentName: string;
    className: string;
    section: string;
    totalClasses: number;
    absentCount: number;
    attendancePercentage: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    actionRequired: string;
};
