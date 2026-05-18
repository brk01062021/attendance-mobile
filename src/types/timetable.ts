export type TimetableGenerationMode = 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'CUSTOM';

export type TimetableGenerationRequest = {
    academicYear: string;
    generationMode: TimetableGenerationMode;
    classNames: string[];
    sections: string[];
    teacherIds: number[];
    equalDistributionEnabled: boolean;
    workloadBalancingEnabled: boolean;
    fixedLabPeriodsEnabled: boolean;
    avoidTeacherGapsEnabled: boolean;
    sameTeacherContinuityEnabled: boolean;
    preventConsecutiveLabsEnabled: boolean;
};

export type TimetableEntry = {
    id: number | string;
    className: string;
    section: string;
    subjectName: string;
    teacherId?: number;
    teacherName: string;
    dayOfWeek: string;
    periodNumber: number;
    roomNumber?: string;
    startTime?: string;
    endTime?: string;
    isLab?: boolean;
    isSports?: boolean;
    conflict?: boolean;
};

export type TimetableConflict = {
    id: number | string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    type: 'TEACHER_OVERLAP' | 'CLASS_OVERLAP' | 'SUBJECT_OVERLOAD' | 'TEACHER_GAP' | 'UNASSIGNED_PERIOD';
    title: string;
    description: string;
    className?: string;
    section?: string;
    teacherName?: string;
    dayOfWeek?: string;
    periodNumber?: number;
};

export type TeacherWorkloadSummary = {
    teacherId: number;
    teacherName: string;
    weeklyPeriods: number;
    replacementLoad: number;
    continuousPeriodRisk: number;
    freeGapCount: number;
    overloadRiskScore: number;
    status: 'Balanced' | 'Watch' | 'Overload';
};

export type TimetableGenerationResponse = {
    generatedBatchId: string;
    completionPercentage: number;
    totalClassesScheduled: number;
    totalEntries: number;
    conflictsDetected: number;
    overloadRiskTeachers: number;
    entries: TimetableEntry[];
    conflicts: TimetableConflict[];
    workloadSummary: TeacherWorkloadSummary[];
};
