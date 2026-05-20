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

export type TimetableRepairResult = {
    batchId: string;
    conflictsBefore: number;
    conflictsAfter: number;
    repairedItems: number;
    publishReady: boolean;
    actions: string[];
    timetable?: TimetableGenerationResponse;
};

export type TimetableManualEditRequest = {
    entryId: string;
    subjectName?: string;
    teacherId?: number;
    teacherName?: string;
    dayOfWeek?: string;
    periodNumber?: number;
    roomNumber?: string;
    startTime?: string;
    endTime?: string;
};

export type TimetablePublishResponse = {
    success: boolean;
    batchId: string;
    status: 'PUBLISHED' | 'BLOCKED_BY_CONFLICTS';
    message: string;
    publishedEntries: number;
    remainingConflicts: number;
    publishedAt?: string;
    approvedBy?: string;
    notificationMessage?: string;
};

export type TimetablePublishAudit = {
    auditId: string;
    batchId: string;
    status: 'PUBLISHED' | 'BLOCKED_BY_CONFLICTS' | 'NOT_PUBLISHED';
    publishedAt?: string | null;
    approvedBy?: string | null;
    publishedEntries: number;
    remainingConflicts: number;
    classSections: number;
    message: string;
};

export type TimetableExportResponse = {
    batchId: string;
    format: 'PDF' | 'EXCEL';
    fileName: string;
    contentType: string;
    content: string;
};

export type PrincipalTimetableIntelligence = {
    batchId: string;
    totalEntries: number;
    classSections: number;
    conflicts: number;
    highRiskConflicts: number;
    overloadRiskTeachers: number;
    publishReadinessScore: number;
    readinessStatus: 'READY_TO_PUBLISH' | 'REVIEW_RECOMMENDED' | 'NEEDS_REPAIR';
    insights: string[];
    topWorkloadRisks: TeacherWorkloadSummary[];
};


export type TimetableBatchSummary = {
    batchId: string;
    status: 'GENERATED_READY' | 'REVIEW_REQUIRED' | 'PUBLISHED' | 'DEMO_READY' | string;
    totalEntries: number;
    classSections: number;
    conflicts: number;
    overloadRiskTeachers: number;
    completionPercentage: number;
    lastPublishedAt?: string | null;
    approvedBy?: string | null;
    message: string;
};

export type TimetableLiveResponse = {
    batchId: string;
    role: string;
    visibilityScope: string;
    published: boolean;
    locked: boolean;
    message: string;
    entries: TimetableEntry[];
};

export type TimetableBinaryExportResponse = {
    batchId: string;
    format: 'PDF' | 'EXCEL';
    fileName: string;
    contentType: string;
    base64Content: string;
    byteSize: number;
    message: string;
};

export type TimetableVersion = {
    versionNumber: number;
    batchId: string;
    createdAt: string;
    createdBy: string;
    changeType: string;
    entriesCount: number;
    notes: string;
};

export type TimetableNotification = {
    notificationId: string;
    batchId: string;
    audience: string;
    title: string;
    message: string;
    createdAt: string;
};

export type TimetableArchiveSummary = {
    batchId: string;
    archivedAt: string;
    archivedBy: string;
    entriesCount: number;
    status: string;
    message: string;
};

export type TimetableOperationsStatus = {
    batchId: string;
    latestPublished: boolean;
    locked: boolean;
    versions: number;
    notifications: number;
    archived: boolean;
    entries: number;
    conflicts: number;
};

export type TimetableRolloutReadiness = {
    batchId: string;
    readyForRollout: boolean;
    locked: boolean;
    latestPublished: boolean;
    totalEntries: number;
    teacherVisibleEntries: number;
    studentParentVisibleEntries: number;
    conflicts: number;
    notifications: number;
    versions: number;
    readinessScore: number;
    blockers: string[];
    checks: string[];
};
