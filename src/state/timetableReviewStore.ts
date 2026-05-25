import { CLASS_OPTIONS, DEFAULT_CLASS_TEACHER_POOLS } from '../data/timetableDefaults';
import { TimetableEntry, TimetableGenerationRequest, TimetableGenerationResponse } from '../types/timetable';

export type TimetableClassSection = {
    className: string;
    section: string;
    label: string;
};

export type TimetableReviewSnapshot = {
    request: TimetableGenerationRequest;
    response: TimetableGenerationResponse;
    classSections: TimetableClassSection[];
    entries: TimetableEntry[];
    savedAt: string;
};

let latestSnapshot: TimetableReviewSnapshot | null = null;

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const subjects = ['Maths', 'Science', 'English', 'Social', 'Telugu', 'Sports'];
const rooms = ['Room A', 'Room B', 'Room C', 'Lab', 'Library', 'Ground'];

export function buildClassSections(classNames: string[], sections: string[]): TimetableClassSection[] {
    return classNames.flatMap(className => {
        const optionSections = CLASS_OPTIONS.find(option => option.className === className)?.sections || sections;
        const resolvedSections = sections.length ? sections.filter(section => optionSections.includes(section)) : optionSections;
        const safeSections = resolvedSections.length ? resolvedSections : optionSections;
        return safeSections.map(section => ({ className, section, label: `${className}-${section}` }));
    });
}

export function buildDemoTimetableEntries(classSections: TimetableClassSection[]): TimetableEntry[] {
    return classSections.flatMap((classSection, classSectionIndex) => {
        const pool = DEFAULT_CLASS_TEACHER_POOLS.find(item => item.className === classSection.className);
        const teacherNames = pool?.teacherNames?.length ? pool.teacherNames : ['Ravi Kumar', 'Anitha Reddy', 'Suresh Babu', 'Mary Thomas'];
        return days.flatMap((day, dayIndex) => [1, 2, 3, 4, 5, 6].map(period => {
            const subjectIndex = (period + dayIndex + classSectionIndex) % subjects.length;
            const teacherIndex = (period + dayIndex) % teacherNames.length;
            const isSports = subjects[subjectIndex] === 'Sports';
            const isLab = subjects[subjectIndex] === 'Science' && period % 2 === 0;
            return {
                id: `${classSection.className}-${classSection.section}-${day}-${period}`,
                className: classSection.className,
                section: classSection.section,
                subjectName: subjects[subjectIndex],
                teacherName: teacherNames[teacherIndex],
                dayOfWeek: day,
                periodNumber: period,
                roomNumber: isSports ? 'Ground' : isLab ? 'Science Lab' : `${rooms[classSectionIndex % rooms.length]} ${classSection.className}${classSection.section}`,
                isSports,
                isLab,
                conflict: classSectionIndex === 0 && day === 'WEDNESDAY' && period === 3,
            } satisfies TimetableEntry;
        }));
    });
}

export function saveTimetableReviewSnapshot(request: TimetableGenerationRequest, response: TimetableGenerationResponse): TimetableReviewSnapshot {
    const classSections = buildClassSections(request.classNames, request.sections);
    const usableEntries = response.entries?.length ? response.entries : buildDemoTimetableEntries(classSections);
    latestSnapshot = {
        request,
        response: { ...response, entries: usableEntries },
        classSections,
        entries: usableEntries,
        savedAt: new Date().toISOString(),
    };
    return latestSnapshot;
}

export function getTimetableReviewSnapshot(): TimetableReviewSnapshot | null {
    return latestSnapshot;
}

export function createFallbackTimetableSnapshot(): TimetableReviewSnapshot {
    const classNames = ['1', '2'];
    const sections = ['A', 'B'];
    const classSections = buildClassSections(classNames, sections);
    const request: TimetableGenerationRequest = {
        academicYear: '2026-2027',
        generationMode: 'ANNUAL',
        classNames,
        sections,
        teacherIds: DEFAULT_CLASS_TEACHER_POOLS.filter(pool => classNames.includes(pool.className)).flatMap(pool => pool.teacherIds),
        teacherPoolSource: 'AUTO_DEFAULT_POOL',
        autoLoadSectionsEnabled: true,
        autoDefaultTeacherPoolEnabled: true,
        selectedTeacherPools: DEFAULT_CLASS_TEACHER_POOLS.filter(pool => classNames.includes(pool.className)),
        equalDistributionEnabled: true,
        workloadBalancingEnabled: true,
        fixedLabPeriodsEnabled: true,
        avoidTeacherGapsEnabled: true,
        sameTeacherContinuityEnabled: true,
        preventConsecutiveLabsEnabled: true,
    };
    const entries = buildDemoTimetableEntries(classSections);
    return {
        request,
        response: {
            generatedBatchId: 'TT-FALLBACK',
            completionPercentage: 94,
            totalClassesScheduled: classSections.length,
            totalEntries: entries.length,
            conflictsDetected: 1,
            overloadRiskTeachers: 1,
            entries,
            conflicts: [],
            workloadSummary: [],
        },
        classSections,
        entries,
        savedAt: new Date().toISOString(),
    };
}
