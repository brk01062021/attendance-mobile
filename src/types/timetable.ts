export type TimetableGenerationMode = 'ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'CUSTOM';

export type TeacherPoolSource = 'AUTO_DEFAULT_POOL' | 'EXCEL_CLASS_POOL' | 'MANUAL_TEACHER_IDS';

export type ClassTeacherPool = {
    poolId: string;
    poolName: string;
    className: string;
    teacherIds: number[];
    teacherNames?: string[];
};

export type TimetableGenerationRequest = {
    academicYear: string;
    generationMode: TimetableGenerationMode;
    classNames: string[];
    sections: string[];
    teacherIds: number[];
    teacherPoolSource?: TeacherPoolSource;
    autoLoadSectionsEnabled?: boolean;
    autoDefaultTeacherPoolEnabled?: boolean;
    selectedTeacherPools?: ClassTeacherPool[];
    equalDistributionEnabled: boolean;
    workloadBalancingEnabled: boolean;
    fixedLabPeriodsEnabled: boolean;
    avoidTeacherGapsEnabled: boolean;
    sameTeacherContinuityEnabled: boolean;
    preventConsecutiveLabsEnabled: boolean;
    conflictFreeGenerationEnabled?: boolean;
    academicRulesEngineEnabled?: boolean;
    academicRules?: AcademicRule[];
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


export type TimetableClassSectionReview = {
    className: string;
    section: string;
    label: string;
    totalPeriods?: number;
    conflictCount?: number;
    entries: TimetableEntry[];
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
    classSectionReviews?: TimetableClassSectionReview[];
    academicRulesSummary?: AcademicRulesSummary;
};

export type AcademicSubjectType = 'THEORY' | 'LAB' | 'SPORTS' | 'ACTIVITY';
export type AcademicRulePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type AcademicRule = {
    ruleId: string;
    className: string;
    subjectName: string;
    subjectType: AcademicSubjectType;
    weeklyPeriods: number;
    fixedPeriodRequired?: boolean;
    preferredPeriodNumber?: number | null;
    sameTeacherContinuityRequired?: boolean;
    priority?: AcademicRulePriority;
};

export type AcademicRulesSummary = {
    totalRules: number;
    totalWeeklyPeriodsRequired: number;
    availableWeeklySlots: number;
    theoryPeriods: number;
    labPeriods: number;
    sportsPeriods: number;
    activityPeriods: number;
    valid: boolean;
    warnings: string[];
};
