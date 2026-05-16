export type PrincipalSummary = {
    totalStudents: number;
    totalTeachers: number;
    todayAttendancePercentage: number;
    studentsAbsentToday: number;
    teachersOnLeave: number;
    replacementPeriodsToday: number;
    lowAttendanceStudents: number;
    pendingTeacherAttendance: number;
};

export type ExecutiveOverview = {
    overallAttendancePercentage: number;
    lowAttendanceRiskStudents: number;
    classesBelowThreshold: number;
    teachersWithLeaveLoad: number;
    replacementStressTeachers: number;
    academicRiskAlerts: number;
    topPerformingClass: string;
    weakestPerformingSection: string;
    replacementStressIndex: number;
};

export type RiskAlert = {
    type: string;
    title: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
    score?: number;
};

export type TrendPoint = {
    label: string;
    presentCount: number;
    absentCount: number;
    totalCount: number;
    attendancePercentage: number;
};

export type ClassComparison = {
    className: string;
    section: string;
    presentCount: number;
    absentCount: number;
    totalMarked: number;
    attendancePercentage: number;
};

export type TeacherWorkload = {
    teacherId: number;
    teacherName: string;
    scheduledPeriods: number;
    replacementPeriods: number;
    plannedLeaves: number;
    unplannedLeaves: number;
    workloadScore: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | string;
};


export type TeacherWorkloadInsight = {
    teacherId: number;
    teacherName: string;
    date: string;
    scheduledPeriods: number;
    replacementPeriods: number;
    totalPeriods: number;
    consecutivePeriods: number;
    freePeriodGaps: number;
    overloadScore: number;
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | string;
    recommendation: string;
};

export type TeacherFatigueAlert = {
    teacherId: number;
    teacherName: string;
    date: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW' | string;
    overloadScore: number;
    reason: string;
    actionRequired: string;
};
