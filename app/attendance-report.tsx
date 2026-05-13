import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ImageBackground,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import AnalyticsChartCard from '../components/admin/AnalyticsChartCard';
import AnalyticsKpiCard from '../components/admin/AnalyticsKpiCard';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, shadows } from '../src/theme';
import {
    fetchAnalyticsSummary,
    fetchAttendanceTrend,
    fetchClassAttendanceTrend,
    AnalyticsSummary,
    AttendanceTrendItem,
    ClassAttendanceTrendItem,
} from '../src/services/analyticsApi';

const BASE_URL = 'http://192.168.1.75:8080';

const screenWidth = Dimensions.get('window').width - 90;

const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,

    color: (opacity = 1) => `rgba(20, 52, 90, ${opacity})`,

    labelColor: (opacity = 1) =>
        `rgba(20, 52, 90, ${opacity})`,

    propsForDots: {
        r: '4',
        strokeWidth: '2',
        stroke: '#C9A227',
    },
};

type ReportItem = {
    className: string;
    section: string;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
};

type StudentSearchItem = {
    studentId: number;
    studentName: string;
    admissionNumber?: string | null;
    rollNumber?: string | null;
    className: string;
    section: string;
};

type StudentDailyAttendanceRecord = {
    date: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'NOT_MARKED' | string;
    subjectName?: string;
    teacherName?: string;
};

type StudentAttendanceReport = {
    studentId: number;
    studentName: string;
    admissionNumber?: string | null;
    rollNumber?: string | null;
    className: string;
    section: string;
    fromDate: string;
    toDate: string;
    rangeType: DateRangeMode;
    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendancePercentage: number;
    dailyRecords: StudentDailyAttendanceRecord[];
};

type ReplacementPeriod = {
    id: number;
    scheduleDate: string;
    className: string;
    section: string;
    subjectName: string;
    startTime: string;
    endTime: string;
    teacherId: number;
    teacherName: string;
    leaveType: 'PLANNED' | 'UNPLANNED';
    replacementTeacherId?: number | null;
    replacementTeacherName?: string | null;
    status: 'ASSIGNED' | 'MISSING';
};

type ReportView =
    | 'overview'
    | 'classReports'
    | 'studentReport'
    | 'teacherReport'
    | 'analyticsReport'
    | 'presentReport'
    | 'absentReport'
    | 'lateReport'
    | 'pendingReport'
    | 'leavePeriodsReport'
    | 'plannedLeaveReport'
    | 'unplannedLeaveReport'
    | 'assignedReplacementReport'
    | 'missingReplacementReport';

type DateRangeMode = 'Daily' | 'Weekly' | 'Monthly';

type SortOption =
    | 'Overall'
    | 'Class Name'
    | 'Attendance % High to Low'
    | 'Attendance % Low to High'
    | 'Most Absentees';

type ReplacementTab = 'Best Match' | 'Same Class' | 'Others';

type TeacherCoverageStats = {
    totalPeriods: number;
    leavePeriods: number;
    planned: number;
    unplanned: number;
    assigned: number;
    missing: number;
    coverage: number;
};

type ReplacementTeacherOption = {
    id: number;
    name: string;
    group: ReplacementTab;
    className: string;
    section: string;
    subjectName: string;
    workload: number;
    lastClassEnded?: string;
    nextClass?: string;
};


type TeacherSearchItem = {
    teacherId: number;
    teacherName: string;
    employeeId?: string | null;
};

type TeacherInsightSummary = {
    teacherId: number;
    teacherName: string;
    classesHandled: string[];
    sectionsHandled: string[];
    subjectsHandled: string[];
    totalLeaves: number;
    plannedLeaves: number;
    unplannedLeaves: number;
    replacementAssignments: number;
    attendanceSubmissions: number;
    examResultSubmissions: number;
};

type TeacherHistoryType = 'attendance' | 'exam' | 'leave' | 'replacement';

type TeacherHistoryRecord = {
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    status?: string;
};


type TeacherReportTab = 'overview' | 'replacementCoverage';

type TeacherMonthlyOverview = {
    month: string;
    totalTeachers: number;
    totalTeachersInLeave: number;
    totalPlannedLeaves: number;
    totalUnplannedLeaves: number;
};

type TeacherMonthlyLeaveRow = {
    teacherId: number;
    teacherName: string;
    totalLeaves: number;
    plannedLeaves: number;
    unplannedLeaves: number;
    subjectsHandled?: string[];
    classesHandled?: string[];
};

type TeacherMonthlyReplacementRow = {
    teacherId: number;
    teacherName: string;
    totalReplacementPeriods: number;
    classesCovered: number;
    subjectsCovered: number;
    totalMinutes: number;
    hours: number;
};

const emptyTeacherCoverageStats: TeacherCoverageStats = {
    totalPeriods: 0,
    leavePeriods: 0,
    planned: 0,
    unplanned: 0,
    assigned: 0,
    missing: 0,
    coverage: 0,
};

const quickNavTabs: { label: string; value: ReportView; emoji: string }[] = [
    { label: 'Overview', value: 'overview', emoji: '📊' },
    { label: 'Analytics', value: 'analyticsReport', emoji: '📈' },
    { label: 'Class Reports', value: 'classReports', emoji: '🏫' },
    { label: 'Student Report', value: 'studentReport', emoji: '🎓' },
    { label: 'Teacher Report', value: 'teacherReport', emoji: '👨‍🏫' },
];

const sortOptions: SortOption[] = [
    'Overall',
    'Class Name',
    'Attendance % High to Low',
    'Attendance % Low to High',
    'Most Absentees',
];

const teacherAbsenceData = [
    {
        teacher: 'Prof BABA',
        leaves: 3,
        planned: 2,
        unplanned: 1,
        assigned: 2,
        missing: 1,
        coverage: 67,
    },
    {
        teacher: 'Prof Krishna',
        leaves: 1,
        planned: 1,
        unplanned: 0,
        assigned: 1,
        missing: 0,
        coverage: 100,
    },
];

const replacementOptionsData: ReplacementTeacherOption[] = [
    {
        id: 102,
        name: 'Shani',
        group: 'Best Match' as ReplacementTab,
        className: '8',
        section: 'A',
        subjectName: 'Social',
        workload: 2,
    },
    {
        id: 104,
        name: 'Saraswati',
        group: 'Same Class' as ReplacementTab,
        className: '8',
        section: 'B',
        subjectName: 'Social',
        workload: 1,
    },
    {
        id: 101,
        name: 'Indra',
        group: 'Others' as ReplacementTab,
        className: '9',
        section: 'A',
        subjectName: 'Maths',
        workload: 1,
    },
    {
        id: 103,
        name: 'Chandra',
        group: 'Others' as ReplacementTab,
        className: '7',
        section: 'B',
        subjectName: 'Science',
        workload: 3,
    },
];



export default function AttendanceReportScreen() {
    const { teacherId, teacherName, role } = useLocalSearchParams();

    const userRole = String(role || 'ADMIN').toUpperCase();
    const isAdmin = userRole === 'ADMIN';
    const today = useMemo(() => formatDate(new Date()), []);
    const currentAcademicMonth = useMemo(() => formatMonthValue(new Date()), []);

    const [activeView, setActiveView] = useState<ReportView>('overview');
    const [selectedAcademicMonth, setSelectedAcademicMonth] = useState(currentAcademicMonth);
    const [showAcademicMonthModal, setShowAcademicMonthModal] = useState(false);
    const [overviewDate, setOverviewDate] = useState(today);
    const [reportDate, setReportDate] = useState(today);
    const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('Daily');
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('Overall');

    const [overviewData, setOverviewData] = useState<ReportItem[]>([]);
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedOverview, setHasLoadedOverview] = useState(false);
    const [hasLoadedDrilldown, setHasLoadedDrilldown] = useState(false);
    const [generatedAt, setGeneratedAt] = useState('');

    const [datePickerTarget, setDatePickerTarget] = useState<'overview' | 'drilldown' | null>(null);
    const [dropdownTarget, setDropdownTarget] = useState<'class' | 'section' | null>(null);
    const [showSortModal, setShowSortModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
    const [selectedReplacementPeriod, setSelectedReplacementPeriod] = useState<ReplacementPeriod | null>(null);
    const [showAssignReplacementModal, setShowAssignReplacementModal] = useState(false);
    const [activeReplacementTab, setActiveReplacementTab] = useState<ReplacementTab>('Best Match');
    const [selectedReplacementTeacherId, setSelectedReplacementTeacherId] = useState<number | null>(null);
    const [teacherCoverageStats, setTeacherCoverageStats] = useState<TeacherCoverageStats>(emptyTeacherCoverageStats);
    const [replacementPeriods, setReplacementPeriods] = useState<ReplacementPeriod[]>([]);
    const [replacementOptions, setReplacementOptions] = useState<ReplacementTeacherOption[]>(replacementOptionsData);

    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentOptions, setStudentOptions] = useState<StudentSearchItem[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentSearchItem | null>(null);
    const [studentSearchLoading, setStudentSearchLoading] = useState(false);
    const [studentReport, setStudentReport] = useState<StudentAttendanceReport | null>(null);
    const [studentReportLoading, setStudentReportLoading] = useState(false);
    const [hasLoadedStudentReport, setHasLoadedStudentReport] = useState(false);

    const [availableClassOptions, setAvailableClassOptions] = useState<string[]>([]);
    const [availableSectionOptions, setAvailableSectionOptions] = useState<string[]>([]);

    const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
    const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendItem[]>([]);
    const [classAttendanceTrend, setClassAttendanceTrend] = useState<ClassAttendanceTrendItem[]>([]);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    const goBack = () => {
        if (activeView !== 'overview') {
            setActiveView('overview');
            return;
        }

        if (isAdmin) {
            router.replace({ pathname: '/admin-dashboard', params: { role: 'ADMIN' } } as any);
            return;
        }

        router.replace({
            pathname: '/teacher-dashboard',
            params: { teacherId, teacherName, role: userRole },
        } as any);
    };

    const getDateRange = () => {
        const selected = parseLocalDate(reportDate);
        const dates: string[] = [];
        const daysBack = dateRangeMode === 'Weekly' ? 6 : dateRangeMode === 'Monthly' ? 29 : 0;

        for (let i = daysBack; i >= 0; i--) {
            const d = new Date(selected);
            d.setDate(selected.getDate() - i);
            dates.push(formatDate(d));
        }

        return dates;
    };

    const getReportDateBounds = () => {
        const dates = getDateRange();
        return {
            fromDate: dates[0] || reportDate,
            toDate: dates[dates.length - 1] || reportDate,
        };
    };

    const loadAvailableClasses = async () => {
        try {
            const response = await fetch(`${BASE_URL}/students/classes`);

            if (!response.ok) {
                throw new Error('Failed to load classes');
            }

            const data = await response.json();
            const classes = Array.isArray(data)
                ? data.map((item) => String(item || '')).filter(Boolean)
                : [];

            setAvailableClassOptions(classes);
        } catch (error) {
            console.log(error);
            setAvailableClassOptions([]);
        }
    };

    const loadAvailableSections = async (selectedClass: string) => {
        if (!selectedClass.trim()) {
            setAvailableSectionOptions([]);
            return;
        }

        try {
            const response = await fetch(
                `${BASE_URL}/students/sections?className=${encodeURIComponent(selectedClass)}`
            );

            if (!response.ok) {
                throw new Error('Failed to load sections');
            }

            const data = await response.json();
            const sections = Array.isArray(data)
                ? data.map((item) => String(item || '')).filter(Boolean)
                : [];

            setAvailableSectionOptions(sections);
        } catch (error) {
            console.log(error);
            setAvailableSectionOptions([]);
        }
    };

    useEffect(() => {
        loadAvailableClasses();
    }, []);

    const searchStudentsForReport = async () => {
        if (!classFilter.trim() || !sectionFilter.trim()) {
            Alert.alert('Select Class and Section', 'Please select class and section before searching students.');
            return;
        }

        try {
            setStudentSearchLoading(true);
            setSelectedStudent(null);
            setStudentReport(null);
            setHasLoadedStudentReport(false);

            const url = `${BASE_URL}/students/search?className=${encodeURIComponent(classFilter)}&section=${encodeURIComponent(sectionFilter)}&query=${encodeURIComponent(studentSearchQuery.trim())}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to search students');
            }

            const data = await response.json();
            setStudentOptions(Array.isArray(data) ? data.map(mapStudentSearchItem) : []);
        } catch (error) {
            console.log(error);
            setStudentOptions([]);
            Alert.alert('Error', 'Unable to search students. Please verify backend is running.');
        } finally {
            setStudentSearchLoading(false);
        }
    };

    const loadSingleStudentReport = async () => {
        if (!selectedStudent) {
            Alert.alert('Select Student', 'Please select one student before loading the report.');
            return;
        }

        const { fromDate, toDate } = getReportDateBounds();

        try {
            setStudentReportLoading(true);
            setHasLoadedStudentReport(true);

            const url = `${BASE_URL}/attendance/student-report?studentId=${selectedStudent.studentId}&fromDate=${fromDate}&toDate=${toDate}&rangeType=${encodeURIComponent(dateRangeMode)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to load student report');
            }

            const data = await response.json();
            setStudentReport({
                studentId: Number(data.studentId || selectedStudent.studentId),
                studentName: String(data.studentName || selectedStudent.studentName || ''),
                admissionNumber: data.admissionNumber ?? selectedStudent.admissionNumber ?? null,
                rollNumber: data.rollNumber ?? selectedStudent.rollNumber ?? null,
                className: String(data.className || selectedStudent.className || ''),
                section: String(data.section || selectedStudent.section || ''),
                fromDate: String(data.fromDate || fromDate),
                toDate: String(data.toDate || toDate),
                rangeType: String(data.rangeType || dateRangeMode) as DateRangeMode,
                totalWorkingDays: Number(data.totalWorkingDays || 0),
                presentDays: Number(data.presentDays || 0),
                absentDays: Number(data.absentDays || 0),
                lateDays: Number(data.lateDays || 0),
                attendancePercentage: Number(data.attendancePercentage || 0),
                dailyRecords: Array.isArray(data.dailyRecords) ? data.dailyRecords : [],
            });
            setGeneratedAt(new Date().toLocaleString());
        } catch (error) {
            console.log(error);
            setStudentReport(null);
            Alert.alert('Error', 'Unable to load selected student attendance report.');
        } finally {
            setStudentReportLoading(false);
        }
    };

    const fetchReportsForDates = async (dates: string[]) => {
        const map = new Map<string, ReportItem>();

        for (const currentDate of dates) {
            const response = await fetch(`${BASE_URL}/attendance/dashboard/admin/classes?date=${currentDate}`);

            if (!response.ok) {
                throw new Error('Failed to load report');
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                data.forEach((item) => {
                    const key = `${item.className}-${item.section}`;
                    const existing = map.get(key) || {
                        className: String(item.className || ''),
                        section: String(item.section || ''),
                        totalRecords: 0,
                        present: 0,
                        absent: 0,
                        late: 0,
                        attendancePercentage: 0,
                    };

                    existing.totalRecords += Number(item.totalRecords || 0);
                    existing.present += Number(item.present || 0);
                    existing.absent += Number(item.absent || 0);
                    existing.late += Number(item.late || 0);
                    existing.attendancePercentage =
                        existing.totalRecords === 0
                            ? 0
                            : ((existing.present + existing.late) / existing.totalRecords) * 100;

                    map.set(key, existing);
                });
            }
        }

        return Array.from(map.values());
    };


    const fetchTeacherCoverageStats = async (selectedDate: string): Promise<TeacherCoverageStats> => {
        const response = await fetch(`${BASE_URL}/teacher-schedules/reports/dashboard?date=${selectedDate}`);

        if (!response.ok) {
            throw new Error('Failed to load teacher replacement dashboard');
        }

        const data = await response.json();

        return {
            totalPeriods: Number(data.totalPeriods || 0),
            leavePeriods: Number(data.leavePeriods || 0),
            planned: Number(data.plannedLeavePeriods || 0),
            unplanned: Number(data.unplannedLeavePeriods || 0),
            assigned: Number(data.assignedReplacements || 0),
            missing: Number(data.missingReplacements || 0),
            coverage: Number(data.coveragePercentage || 0),
        };
    };

    const fetchReplacementDetails = async (fromDate: string, toDate: string): Promise<ReplacementPeriod[]> => {
        const response = await fetch(
            `${BASE_URL}/teacher-schedules/reports/replacement-details?fromDate=${fromDate}&toDate=${toDate}`
        );

        if (!response.ok) {
            throw new Error('Failed to load teacher replacement details');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            return [];
        }

        return data.map((item) => {
            const status = String(item.status || '');
            const replacementTeacherId = item.replacementTeacherId == null ? null : Number(item.replacementTeacherId);
            const replacementTeacherName =
                item.replacementTeacherName && item.replacementTeacherName !== 'No replacement assigned'
                    ? String(item.replacementTeacherName)
                    : null;

            return {
                id: Number(item.scheduleId || item.id || 0),
                scheduleDate: String(item.date || item.scheduleDate || ''),
                className: String(item.className || ''),
                section: String(item.section || ''),
                subjectName: String(item.subjectName || ''),
                startTime: String(item.startTime || ''),
                endTime: String(item.endTime || ''),
                teacherId: Number(item.teacherId || 0),
                teacherName: String(item.teacherName || ''),
                leaveType: status === 'UNPLANNED_LEAVE' ? 'UNPLANNED' : 'PLANNED',
                replacementTeacherId,
                replacementTeacherName,
                status: replacementTeacherId ? 'ASSIGNED' : 'MISSING',
            } as ReplacementPeriod;
        });
    };

    const fetchReplacementOptions = async (scheduleId: number): Promise<ReplacementTeacherOption[]> => {
        const response = await fetch(`${BASE_URL}/teacher-schedules/available-replacements?scheduleId=${scheduleId}`);

        if (!response.ok) {
            throw new Error('Failed to load replacement options');
        }

        const data = await response.json();

        const mapTeacher = (teacher: any, group: ReplacementTab): ReplacementTeacherOption => ({
            id: Number(teacher.teacherId || teacher.id || 0),
            name: String(teacher.teacherName || teacher.name || ''),
            group,
            className: String(teacher.className || ''),
            section: String(teacher.section || ''),
            subjectName: String(teacher.subjectName || ''),
            workload: Number(teacher.dailyWorkload || teacher.workload || 0),
            lastClassEnded: teacher.lastClassEnded ? String(teacher.lastClassEnded) : undefined,
            nextClass: teacher.nextClass ? String(teacher.nextClass) : undefined,
        });

        return [
            ...(Array.isArray(data.bestMatch) ? data.bestMatch.map((teacher: any) => mapTeacher(teacher, 'Best Match')) : []),
            ...(Array.isArray(data.sameClass) ? data.sameClass.map((teacher: any) => mapTeacher(teacher, 'Same Class')) : []),
            ...(Array.isArray(data.others) ? data.others.map((teacher: any) => mapTeacher(teacher, 'Others')) : []),
        ];
    };

    const loadOverviewReport = async () => {
        if (!isAdmin) {
            Alert.alert('Teacher Report', 'Teacher attendance reports will be connected next.');
            return;
        }

        try {
            setLoading(true);
            setHasLoadedOverview(true);

            let attendanceData: ReportItem[] = [];
            let coverageStats = emptyTeacherCoverageStats;
            let replacementDetails: ReplacementPeriod[] = [];

            try {
                attendanceData = await fetchReportsForDates([overviewDate]);
            } catch (error) {
                console.log('Attendance report API failed', error);
            }

            try {
                coverageStats = await fetchTeacherCoverageStats(overviewDate);
            } catch (error) {
                console.log('Teacher coverage API failed', error);
            }

            try {
                replacementDetails = await fetchReplacementDetails(overviewDate, overviewDate);
            } catch (error) {
                console.log('Replacement details API failed', error);
            }

            setOverviewData(attendanceData);
            setReportData(attendanceData);
            setTeacherCoverageStats(coverageStats);
            setReplacementPeriods(replacementDetails);
            setReportDate(overviewDate);
            setDateRangeMode('Daily');
            setGeneratedAt(new Date().toLocaleString());
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load report. Please verify backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const loadDrilldownReport = async () => {
        try {
            setLoading(true);
            setHasLoadedDrilldown(true);

            const dates = getDateRange();
            const fromDate = dates[0] || reportDate;
            const toDate = dates[dates.length - 1] || reportDate;

            const [attendanceData, replacementDetails] = await Promise.all([
                fetchReportsForDates(dates),
                fetchReplacementDetails(fromDate, toDate),
            ]);

            setReportData(attendanceData);
            setReplacementPeriods(replacementDetails);
            setGeneratedAt(new Date().toLocaleString());
        } catch (error) {
            console.log(error);
            setReportData([]);
            setReplacementPeriods([]);
            Alert.alert('Error', 'Unable to load report');
        } finally {
            setLoading(false);
        }
    };


    const loadLiveAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            setHasLoadedOverview(true);

            const selected = parseLocalDate(overviewDate);
            const start = new Date(selected);
            start.setDate(selected.getDate() - 6);
            const startDate = formatDate(start);
            const endDate = overviewDate;

            const [summary, trend, classTrend] = await Promise.all([
                fetchAnalyticsSummary(startDate, endDate),
                fetchAttendanceTrend(startDate, endDate),
                fetchClassAttendanceTrend(overviewDate),
            ]);

            setAnalyticsSummary(summary);
            setAttendanceTrend(trend);
            setClassAttendanceTrend(classTrend);
            setGeneratedAt(new Date().toLocaleString());

            await loadOverviewReport();
        } catch (error) {
            console.log(error);
            Alert.alert('Analytics Error', 'Unable to load live analytics. Please verify backend is running.');
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const overviewStats = useMemo(() => buildSummaryStats(overviewData), [overviewData]);


    const reportClassOptions = useMemo(() => {
        return Array.from(new Set(reportData.map((item) => item.className).filter(Boolean))).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );
    }, [reportData]);

    const reportSectionOptions = useMemo(() => {
        const source = classFilter.trim()
            ? reportData.filter((item) => item.className.toLowerCase() === classFilter.trim().toLowerCase())
            : reportData;

        return Array.from(new Set(source.map((item) => item.section).filter(Boolean))).sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true })
        );
    }, [reportData, classFilter]);

    const shouldUseLiveClassSectionOptions = activeView === 'studentReport' || activeView === 'classReports';

    const classOptions = shouldUseLiveClassSectionOptions ? availableClassOptions : reportClassOptions;
    const sectionOptions = shouldUseLiveClassSectionOptions ? availableSectionOptions : reportSectionOptions;

    const filteredReport = useMemo(() => {
        return reportData.filter((item) => {
            const matchesClass =
                !classFilter.trim() ||
                item.className.toLowerCase() === classFilter.trim().toLowerCase();

            const matchesSection =
                !sectionFilter.trim() ||
                item.section.toLowerCase() === sectionFilter.trim().toLowerCase();

            return matchesClass && matchesSection;
        });
    }, [reportData, classFilter, sectionFilter]);

    const sortedReport = useMemo(() => {
        const data = [...filteredReport];

        if (sortBy === 'Class Name') {
            data.sort((a, b) =>
                `${a.className}-${a.section}`.localeCompare(`${b.className}-${b.section}`, undefined, { numeric: true })
            );
        } else if (sortBy === 'Attendance % Low to High') {
            data.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
        } else if (sortBy === 'Most Absentees') {
            data.sort((a, b) => b.absent - a.absent);
        } else {
            data.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
        }

        return data;
    }, [filteredReport, sortBy]);

    const screenTitle = useMemo(() => {
        if (activeView === 'overview') return 'Admin Reports';
        if (activeView === 'classReports') return 'Class Attendance Reports';
        if (activeView === 'studentReport') return 'Student Attendance Report';
        if (activeView === 'teacherReport') return 'Teacher Report';
        if (activeView === 'analyticsReport') return 'Analytics';
        if (activeView === 'presentReport') return 'Present Students Report';
        if (activeView === 'absentReport') return 'Absentee Report';
        if (activeView === 'lateReport') return 'Late Students Report';
        if (activeView === 'pendingReport') return 'Pending Attendance Report';
        if (activeView === 'leavePeriodsReport') return 'Leave Periods Report';
        if (activeView === 'plannedLeaveReport') return 'Planned Leave Report';
        if (activeView === 'unplannedLeaveReport') return 'Unplanned Leave Report';
        if (activeView === 'assignedReplacementReport') return 'Assigned Replacement Report';
        if (activeView === 'missingReplacementReport') return 'Missing Replacement Report';
        return 'Admin Reports';
    }, [activeView]);

    const heroTitle = isReplacementDrilldownView(activeView)
        ? getReplacementReportTitle(activeView)
        : activeView === 'overview'
            ? 'Simple school overview summary'
            : activeView === 'analyticsReport'
                ? 'School analytics and visual insights'
                : activeView === 'teacherReport'
                    ? 'Teacher replacement and coverage report'
                    : activeView === 'studentReport'
                        ? 'Student attendance report'
                        : 'Detailed class and section attendance report';

    const heroDescription = isReplacementDrilldownView(activeView)
        ? 'Review leave period details with class, section, subject, teacher on leave, replacement assignment and action for missing replacement.'
        : activeView === 'overview'
            ? 'Select report date, load report, and review only school attendance summary plus teacher replacement coverage summary.'
            : activeView === 'analyticsReport'
                ? 'View school attendance trends, replacement coverage, leave split and visual performance insights.'
                : activeView === 'teacherReport'
                    ? 'Review teacher leave periods, planned and unplanned absences, assigned replacements, missing coverage and coverage percentage.'
                    : activeView === 'studentReport'
                        ? 'Review student attendance insights using date range, class and section filters.'
                        : 'Class and section-wise attendance report. Leave class and section empty to show the whole school.';

    const openReportPage = (view: ReportView) => {
        if (view === 'overview') {
            setActiveView('overview');
            return;
        }

        setActiveView(view);
        setReportDate(overviewDate);
        setDateRangeMode('Daily');
        setClassFilter('');
        setSectionFilter('');
        setSortBy('Overall');
        setDropdownTarget(null);
        setHasLoadedDrilldown(false);
        setReportData(overviewData);
        setStudentSearchQuery('');
        setStudentOptions([]);
        setSelectedStudent(null);
        setStudentReport(null);
        setHasLoadedStudentReport(false);

        if (view === 'studentReport' || view === 'classReports') {
            setAvailableSectionOptions([]);
            loadAvailableClasses();
        }
    };

    const clearDrilldownFilters = () => {
        setReportDate(today);
        setDateRangeMode('Daily');
        setClassFilter('');
        setSectionFilter('');
        setSortBy('Overall');
        setDropdownTarget(null);
        setStudentSearchQuery('');
        setStudentOptions([]);
        setSelectedStudent(null);
        setStudentReport(null);
        setHasLoadedStudentReport(false);
        if (activeView === 'studentReport' || activeView === 'classReports') {
            setAvailableSectionOptions([]);
            loadAvailableClasses();
        }
    };

    const selectClass = (selectedClass: string) => {
        setClassFilter(selectedClass);
        setSectionFilter('');
        setDropdownTarget(null);
        setStudentSearchQuery('');
        setStudentOptions([]);
        setSelectedStudent(null);
        setStudentReport(null);
        setHasLoadedStudentReport(false);

        if (activeView === 'studentReport' || activeView === 'classReports') {
            loadAvailableSections(selectedClass);
        }
    };

    const selectSection = (selectedSection: string) => {
        setSectionFilter(selectedSection);
        setDropdownTarget(null);
        setStudentSearchQuery('');
        setStudentOptions([]);
        setSelectedStudent(null);
        setStudentReport(null);
        setHasLoadedStudentReport(false);
    };

    const openDetailModal = (item: ReportItem) => {
        setSelectedReport(item);
        setShowDetailModal(true);
    };

    const handleExportAction = (action: string) => {
        setShowExportModal(false);
        Alert.alert(action, `${action} wiring will be connected in the next phase.`);
    };

    const openAssignReplacementModal = async (item: ReplacementPeriod) => {
        setSelectedReplacementPeriod(item);
        setActiveReplacementTab('Best Match');
        setSelectedReplacementTeacherId(null);
        setReplacementOptions(replacementOptionsData);
        setShowAssignReplacementModal(true);

        try {
            const liveOptions = await fetchReplacementOptions(item.id);
            setReplacementOptions(liveOptions.length > 0 ? liveOptions : replacementOptionsData);
        } catch (error) {
            console.log(error);
            Alert.alert('Replacement Options', 'Unable to load live options. Showing fallback options.');
        }
    };

    const closeAssignReplacementModal = () => {
        setShowAssignReplacementModal(false);
        setSelectedReplacementPeriod(null);
        setSelectedReplacementTeacherId(null);
        setReplacementOptions(replacementOptionsData);
    };

    const saveReplacementAssignment = async () => {
        if (!selectedReplacementTeacherId || !selectedReplacementPeriod) {
            Alert.alert('Select Replacement', 'Please select a replacement teacher before saving.');
            return;
        }

        const selectedTeacher = replacementOptions.find((teacher) => teacher.id === selectedReplacementTeacherId);

        try {
            const response = await fetch(
                `${BASE_URL}/teacher-schedules/${selectedReplacementPeriod.id}/assign-replacement?replacementTeacherId=${selectedReplacementTeacherId}`,
                { method: 'PUT' }
            );

            if (!response.ok) {
                throw new Error('Failed to assign replacement');
            }

            const [coverageStats, replacementDetails] = await Promise.all([
                fetchTeacherCoverageStats(overviewDate),
                fetchReplacementDetails(overviewDate, overviewDate),
            ]);

            setTeacherCoverageStats(coverageStats);
            setReplacementPeriods(replacementDetails);
            setShowAssignReplacementModal(false);
            setSelectedReplacementPeriod(null);
            setSelectedReplacementTeacherId(null);
            setReplacementOptions(replacementOptionsData);
            setGeneratedAt(new Date().toLocaleString());

            Alert.alert('Replacement Assigned', `${selectedTeacher?.name || 'Replacement teacher'} assigned successfully.`);
            setActiveView('overview');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to assign replacement. Please try again.');
        }
    };

    return (
        <ImageBackground
            source={require('../assets/branding/splash-gold.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.85}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>{screenTitle}</Text>

                    <TouchableOpacity
                        style={styles.homeButton}
                        onPress={() => router.replace({ pathname: '/admin-dashboard', params: { role: 'ADMIN' } } as any)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.homeButtonText}>⌂</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>VidyaSetu Reports Center</Text>
                    <Text style={styles.heroTitle}>{heroTitle}</Text>
                    <Text style={styles.heroText}>{heroDescription}</Text>

                    {activeView === 'teacherReport' ? (
                        <TouchableOpacity style={styles.generatedPill} onPress={() => setShowAcademicMonthModal(true)} activeOpacity={0.85}>
                            <Text style={styles.generatedPillText}>{formatMonthLabel(selectedAcademicMonth)} ▾</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.generatedPill}>
                            <Text style={styles.generatedPillText}>
                                {generatedAt ? `Generated: ${generatedAt}` : 'Default date is today'}
                            </Text>
                        </View>
                    )}
                </View>

                {!isReplacementDrilldownView(activeView) && activeView !== 'teacherReport' && (
                    <View style={styles.quickNavCard}>
                        <Text style={styles.quickNavEyebrow}>Quick Navigation</Text>
                        <Text style={styles.quickNavTitle}>Report Sections</Text>

                        <View style={styles.quickNavRow}>
                            {quickNavTabs.map((tab) => {
                                const selected = activeView === tab.value;
                                return (
                                    <TouchableOpacity
                                        key={tab.value}
                                        style={[styles.quickNavButton, selected && styles.quickNavButtonActive]}
                                        onPress={() => openReportPage(tab.value)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.quickNavEmoji}>{tab.emoji}</Text>
                                        <Text style={[styles.quickNavText, selected && styles.quickNavTextActive]} numberOfLines={2}>
                                            {tab.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                {activeView === 'overview' ? (
                    <OverviewContent
                        overviewDate={overviewDate}
                        setDatePickerTarget={setDatePickerTarget}
                        loading={loading}
                        hasLoadedOverview={hasLoadedOverview}
                        overviewData={overviewData}
                        overviewStats={overviewStats}
                        teacherCoverageStats={teacherCoverageStats}
                        loadOverviewReport={loadOverviewReport}
                        openReportPage={openReportPage}
                    />
                ) : activeView === 'analyticsReport' ? (
                    <AnalyticsReportContent
                        overviewDate={overviewDate}
                        setDatePickerTarget={setDatePickerTarget}
                        loading={loading || analyticsLoading}
                        hasLoadedOverview={hasLoadedOverview}
                        overviewData={overviewData}
                        teacherCoverageStats={teacherCoverageStats}
                        loadOverviewReport={loadLiveAnalytics}
                        analyticsSummary={analyticsSummary}
                        attendanceTrend={attendanceTrend}
                        classAttendanceTrend={classAttendanceTrend}
                        analyticsLoading={analyticsLoading}
                    />
                ) : isReplacementDrilldownView(activeView) ? (
                    <ReplacementDrilldownContent
                        activeView={activeView}
                        reportDate={overviewDate}
                        replacementPeriods={replacementPeriods}
                        onExport={() => setShowExportModal(true)}
                        onAssignReplacement={openAssignReplacementModal}
                    />
                ) : activeView === 'teacherReport' ? (
                    <TeacherReportContent
                        selectedMonth={selectedAcademicMonth}
                        onSelectMonth={() => setShowAcademicMonthModal(true)}
                        onExport={() => setShowExportModal(true)}
                    />
                ) : activeView === 'studentReport' ? (
                    <StudentReportContent
                        reportDate={reportDate}
                        setDatePickerTarget={setDatePickerTarget}
                        dateRangeMode={dateRangeMode}
                        setDateRangeMode={setDateRangeMode}
                        classFilter={classFilter}
                        sectionFilter={sectionFilter}
                        studentSearchQuery={studentSearchQuery}
                        setStudentSearchQuery={setStudentSearchQuery}
                        studentOptions={studentOptions}
                        selectedStudent={selectedStudent}
                        setSelectedStudent={setSelectedStudent}
                        studentSearchLoading={studentSearchLoading}
                        studentReportLoading={studentReportLoading}
                        hasLoadedStudentReport={hasLoadedStudentReport}
                        studentReport={studentReport}
                        clearDrilldownFilters={clearDrilldownFilters}
                        openClassDropdown={() => setDropdownTarget('class')}
                        openSectionDropdown={() => setDropdownTarget('section')}
                        searchStudentsForReport={searchStudentsForReport}
                        loadSingleStudentReport={loadSingleStudentReport}
                        onExport={() => setShowExportModal(true)}
                    />
                ) : (
                    <ReportContent
                        activeView={activeView}
                        reportDate={reportDate}
                        setDatePickerTarget={setDatePickerTarget}
                        dateRangeMode={dateRangeMode}
                        setDateRangeMode={setDateRangeMode}
                        classFilter={classFilter}
                        sectionFilter={sectionFilter}
                        sortedReport={sortedReport}
                        reportData={reportData}
                        loading={loading}
                        hasLoadedDrilldown={hasLoadedDrilldown}
                        sortBy={sortBy}
                        clearDrilldownFilters={clearDrilldownFilters}
                        loadDrilldownReport={loadDrilldownReport}
                        openDetailModal={openDetailModal}
                        openClassDropdown={() => setDropdownTarget('class')}
                        openSectionDropdown={() => setDropdownTarget('section')}
                        openSortModal={() => setShowSortModal(true)}
                        onExport={() => setShowExportModal(true)}
                    />
                )}

                <CalendarModal
                    visible={datePickerTarget !== null}
                    selectedDate={datePickerTarget === 'overview' ? overviewDate : reportDate}
                    onSelect={(selectedDate) => {
                        if (datePickerTarget === 'overview') {
                            setOverviewDate(selectedDate);
                        } else {
                            setReportDate(selectedDate);
                        }
                        setDatePickerTarget(null);
                    }}
                    onClose={() => setDatePickerTarget(null)}
                />

                <DropdownModal
                    visible={dropdownTarget === 'class'}
                    title="Select Class"
                    options={classOptions}
                    allLabel="All Classes"
                    emptyText={activeView === 'studentReport' || activeView === 'classReports' ? 'No classes found. Please verify backend class data exists.' : 'Load report once to see available classes.'}
                    onSelect={selectClass}
                    onSelectAll={() => selectClass('')}
                    onClose={() => setDropdownTarget(null)}
                />

                <DropdownModal
                    visible={dropdownTarget === 'section'}
                    title="Select Section"
                    options={sectionOptions}
                    allLabel="All Sections"
                    emptyText={classFilter ? 'No sections found for selected class.' : activeView === 'studentReport' || activeView === 'classReports' ? 'Select a class first.' : 'Load report once to see available sections.'}
                    onSelect={selectSection}
                    onSelectAll={() => selectSection('')}
                    onClose={() => setDropdownTarget(null)}
                />

                <Modal visible={showSortModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Sort Report</Text>

                            {sortOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.optionButton}
                                    onPress={() => {
                                        setSortBy(option);
                                        setShowSortModal(false);
                                    }}
                                >
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSortModal(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal visible={showExportModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Export / Share Report</Text>

                            <View style={styles.exportGrid}>
                                <ExportOption emoji="📄" title="Export PDF" onPress={() => handleExportAction('Export PDF')} />
                                <ExportOption emoji="📊" title="Export Excel" onPress={() => handleExportAction('Export Excel')} />
                                <ExportOption emoji="📤" title="Share Report" onPress={() => handleExportAction('Share Report')} />
                            </View>

                            <TouchableOpacity style={styles.closeButton} onPress={() => setShowExportModal(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Modal visible={showDetailModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Class Report Details</Text>

                            {selectedReport && (
                                <>
                                    <Text style={styles.drillTitle}>
                                        Class {selectedReport.className} - Section {selectedReport.section}
                                    </Text>

                                    <View style={styles.statsGrid}>
                                        <StatBox title="Total" value={selectedReport.totalRecords} />
                                        <StatBox title="Present" value={selectedReport.present} color={colors.successGreen} />
                                        <StatBox title="Absent" value={selectedReport.absent} color="#DC2626" />
                                        <StatBox title="Late" value={selectedReport.late} color="#D97706" />
                                    </View>

                                    <View style={styles.percentageBox}>
                                        <Text style={styles.percentageLabel}>Attendance %</Text>
                                        <Text style={styles.percentageValue}>
                                            {Math.round(selectedReport.attendancePercentage)}%
                                        </Text>
                                        <Text style={styles.percentageSubText}>
                                            Student-level list API can be connected under this drilldown next.
                                        </Text>
                                    </View>
                                </>
                            )}

                            <TouchableOpacity style={styles.closeButton} onPress={() => setShowDetailModal(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <AcademicMonthModal
                    visible={showAcademicMonthModal}
                    selectedMonth={selectedAcademicMonth}
                    onSelect={(month) => {
                        setSelectedAcademicMonth(month);
                        setShowAcademicMonthModal(false);
                    }}
                    onClose={() => setShowAcademicMonthModal(false)}
                />

                <AssignReplacementModal
                    visible={showAssignReplacementModal}
                    period={selectedReplacementPeriod}
                    activeTab={activeReplacementTab}
                    selectedTeacherId={selectedReplacementTeacherId}
                    options={replacementOptions}
                    onChangeTab={setActiveReplacementTab}
                    onSelectTeacher={setSelectedReplacementTeacherId}
                    onClose={closeAssignReplacementModal}
                    onSave={saveReplacementAssignment}
                />
            </ScrollView>
        </ImageBackground>
    );
}

function OverviewContent({
                             overviewDate,
                             setDatePickerTarget,
                             loading,
                             hasLoadedOverview,
                             overviewData,
                             overviewStats,
                             teacherCoverageStats,
                             loadOverviewReport,
                             openReportPage,
                         }: {
    overviewDate: string;
    setDatePickerTarget: (target: 'overview' | 'drilldown' | null) => void;
    loading: boolean;
    hasLoadedOverview: boolean;
    overviewData: ReportItem[];
    overviewStats: ReturnType<typeof buildSummaryStats>;
    teacherCoverageStats: TeacherCoverageStats;
    loadOverviewReport: () => void;
    openReportPage: (view: ReportView) => void;
}) {
    return (
        <>
            <View style={styles.filterCard}>
                <Text style={styles.sectionEyebrow}>Overview Filter</Text>
                <Text style={styles.sectionTitle}>Report Date</Text>

                <DatePickerField value={overviewDate} onPress={() => setDatePickerTarget('overview')} />

                <TouchableOpacity
                    style={[styles.loadButton, loading && styles.disabledButton]}
                    onPress={loadOverviewReport}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.primaryNavy} />
                    ) : (
                        <Text style={styles.loadButtonText}>Load Attendance Report</Text>
                    )}
                </TouchableOpacity>
            </View>

            {hasLoadedOverview &&
                !loading &&
                overviewData.length === 0 &&
                teacherCoverageStats.totalPeriods === 0 &&
                teacherCoverageStats.leavePeriods === 0 && <NoDataCard />}

            {hasLoadedOverview && !loading && (overviewData.length > 0 || teacherCoverageStats.totalPeriods > 0 || teacherCoverageStats.leavePeriods > 0) && (
                <>
                    <View style={styles.summaryCard}>
                        <Text style={styles.sectionEyebrow}>Summary</Text>
                        <Text style={styles.sectionTitle}>School Attendance Summary</Text>

                        <View style={styles.statsGrid}>
                            <StatBox title="Total" value={overviewStats.total} />
                            <StatBox title="Present" value={overviewStats.present} color={colors.successGreen} onPress={() => openReportPage('presentReport')} />
                            <StatBox title="Absent" value={overviewStats.absent} color="#DC2626" onPress={() => openReportPage('absentReport')} />
                            <StatBox title="Late" value={overviewStats.late} color="#D97706" onPress={() => openReportPage('lateReport')} />
                            <StatBox title="Classes Covered" value={overviewStats.classesCovered} color="#2563EB" onPress={() => openReportPage('classReports')} />
                            <StatBox title="Pending" value={overviewStats.pendingAttendance} color="#92400E" onPress={() => openReportPage('pendingReport')} />
                        </View>

                        <View style={styles.percentageBox}>
                            <Text style={styles.percentageLabel}>Attendance %</Text>
                            <Text style={styles.percentageValue}>{Math.round(overviewStats.percentage)}%</Text>
                            <Text style={styles.percentageSubText}>
                                Based on present + late records for selected report date.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.summaryCard}>
                        <Text style={styles.sectionEyebrow}>Replacement</Text>
                        <Text style={styles.sectionTitle}>Teacher Replacement Coverage Summary</Text>

                        <View style={styles.statsGrid}>
                            <StatBox title="Total Periods" value={teacherCoverageStats.totalPeriods} />
                            <StatBox title="Leave Periods" value={teacherCoverageStats.leavePeriods} color="#92400E" onPress={() => openReportPage('leavePeriodsReport')} />
                            <StatBox title="Planned" value={teacherCoverageStats.planned} color="#2563EB" onPress={() => openReportPage('plannedLeaveReport')} />
                            <StatBox title="Unplanned" value={teacherCoverageStats.unplanned} color="#D97706" onPress={() => openReportPage('unplannedLeaveReport')} />
                            <StatBox title="Assigned" value={teacherCoverageStats.assigned} color={colors.successGreen} onPress={() => openReportPage('assignedReplacementReport')} />
                            <StatBox title="Missing" value={teacherCoverageStats.missing} color="#DC2626" onPress={() => openReportPage('missingReplacementReport')} />
                        </View>

                        <View style={styles.percentageBox}>
                            <Text style={styles.percentageLabel}>Coverage %</Text>
                            <Text style={styles.percentageValue}>{Math.round(teacherCoverageStats.coverage)}%</Text>
                            <Text style={styles.percentageSubText}>
                                Based on assigned replacement periods for selected report date.
                            </Text>
                        </View>
                    </View>
                </>
            )}
        </>
    );
}

function AnalyticsReportContent({
                                    overviewDate,
                                    setDatePickerTarget,
                                    loading,
                                    hasLoadedOverview,
                                    overviewData,
                                    teacherCoverageStats,
                                    loadOverviewReport,
                                    analyticsSummary,
                                    attendanceTrend,
                                    classAttendanceTrend,
                                    analyticsLoading,
                                }: {
    overviewDate: string;
    setDatePickerTarget: (target: 'overview' | 'drilldown' | null) => void;
    loading: boolean;
    hasLoadedOverview: boolean;
    overviewData: ReportItem[];
    teacherCoverageStats: TeacherCoverageStats;
    loadOverviewReport: () => void;
    analyticsSummary: AnalyticsSummary | null;
    attendanceTrend: AttendanceTrendItem[];
    classAttendanceTrend: ClassAttendanceTrendItem[];
    analyticsLoading: boolean;
}) {
    const attendanceChartData = {
        labels: attendanceTrend.length > 0
            ? attendanceTrend.slice(-7).map((item) => item.date.split('-')[2])
            : ['No Data'],
        datasets: [
            {
                data: attendanceTrend.length > 0
                    ? attendanceTrend.slice(-7).map((item) =>
                        Math.max(0, Math.round(Number(item.attendancePercentage || 0)))
                    )
                    : [0],
            },
        ],
    };

    const attendanceTrendLabel =
        attendanceTrend.length > 0
            ? `Daily Attendance Trend (${attendanceTrend[0].date.slice(0, 7)})`
            : 'School Attendance Trend';

    const classComparisonData = {
        labels: classAttendanceTrend.length > 0
            ? classAttendanceTrend.slice(0, 6).map((item) => `${item.className}${item.section}`)
            : ['No Data'],

        datasets: [
            {
                data: classAttendanceTrend.length > 0
                    ? classAttendanceTrend.slice(0, 6).map((item) =>
                        Math.max(0, Math.round(Number(item.attendancePercentage || 0)))
                    )
                    : [0],
            },
        ],
    };

    const averageAttendance = Math.round(Number(analyticsSummary?.attendancePercentage || 0));

    const hasAnalyticsData =
        Number(analyticsSummary?.totalPresent || 0) > 0 ||
        Number(analyticsSummary?.totalAbsent || 0) > 0 ||
        attendanceTrend.some((item) => Number(item.totalCount || 0) > 0) ||
        classAttendanceTrend.some((item) => Number(item.totalCount || 0) > 0);

    return (
        <>
            <View style={styles.filterCard}>
                <Text style={styles.sectionEyebrow}>Analytics Filter</Text>
                <Text style={styles.sectionTitle}>Report Date</Text>

                <DatePickerField value={overviewDate} onPress={() => setDatePickerTarget('overview')} />

                <TouchableOpacity
                    style={[styles.loadButton, (loading || analyticsLoading) && styles.disabledButton]}
                    onPress={loadOverviewReport}
                    disabled={loading || analyticsLoading}
                    activeOpacity={0.9}
                >
                    {loading || analyticsLoading ? (
                        <ActivityIndicator color={colors.primaryNavy} />
                    ) : (
                        <Text style={styles.loadButtonText}>Load Analytics</Text>
                    )}
                </TouchableOpacity>
            </View>

            {!loading && !analyticsLoading && !hasLoadedOverview && (
                <View style={styles.noDataCard}>
                    <Text style={styles.noDataTitle}>Load Analytics</Text>
                    <Text style={styles.noDataText}>Select a report date and tap Load Analytics to view visual insights.</Text>
                </View>
            )}

            {!loading && !analyticsLoading && hasLoadedOverview && (
                <>
                    <View style={styles.kpiGrid}>
                        <AnalyticsKpiCard
                            title="Attendance Avg"
                            value={`${averageAttendance}%`}
                        />

                        <AnalyticsKpiCard
                            title="Present"
                            value={`${analyticsSummary?.totalPresent || 0}`}
                        />

                        <AnalyticsKpiCard
                            title="Absent"
                            value={`${analyticsSummary?.totalAbsent || 0}`}
                        />

                        <AnalyticsKpiCard
                            title="Students"
                            value={`${analyticsSummary?.totalStudents || 0}`}
                        />
                    </View>

                    {hasAnalyticsData ? (
                        <>
                            <AnalyticsChartCard title={attendanceTrendLabel}>
                                <LineChart
                                    data={attendanceChartData}
                                    width={screenWidth - 10}
                                    height={210}
                                    yAxisSuffix="%"
                                    chartConfig={chartConfig}
                                    withInnerLines
                                    bezier
                                    style={{ borderRadius: 16 }}
                                />
                            </AnalyticsChartCard>

                            <AnalyticsChartCard title="Class Attendance Comparison">
                                <BarChart
                                    data={classComparisonData}
                                    width={screenWidth}
                                    height={210}
                                    yAxisSuffix="%"
                                    yAxisLabel=""
                                    chartConfig={chartConfig}
                                    withInnerLines
                                    fromZero
                                    showValuesOnTopOfBars
                                    style={{
                                        borderRadius: 16,
                                    }}
                                />
                            </AnalyticsChartCard>
                        </>
                    ) : (
                        <View style={styles.noDataCard}>
                            <Text style={styles.noDataTitle}>No Analytics Available</Text>
                            <Text style={styles.noDataText}>
                                No attendance data found for the selected date.
                            </Text>
                        </View>
                    )}
                </>
            )}
        </>
    );
}

function StudentReportContent({
                                  reportDate,
                                  setDatePickerTarget,
                                  dateRangeMode,
                                  setDateRangeMode,
                                  classFilter,
                                  sectionFilter,
                                  studentSearchQuery,
                                  setStudentSearchQuery,
                                  studentOptions,
                                  selectedStudent,
                                  setSelectedStudent,
                                  studentSearchLoading,
                                  studentReportLoading,
                                  hasLoadedStudentReport,
                                  studentReport,
                                  clearDrilldownFilters,
                                  openClassDropdown,
                                  openSectionDropdown,
                                  searchStudentsForReport,
                                  loadSingleStudentReport,
                                  onExport,
                              }: {
    reportDate: string;
    setDatePickerTarget: (target: 'overview' | 'drilldown' | null) => void;
    dateRangeMode: DateRangeMode;
    setDateRangeMode: (mode: DateRangeMode) => void;
    classFilter: string;
    sectionFilter: string;
    studentSearchQuery: string;
    setStudentSearchQuery: (value: string) => void;
    studentOptions: StudentSearchItem[];
    selectedStudent: StudentSearchItem | null;
    setSelectedStudent: (student: StudentSearchItem | null) => void;
    studentSearchLoading: boolean;
    studentReportLoading: boolean;
    hasLoadedStudentReport: boolean;
    studentReport: StudentAttendanceReport | null;
    clearDrilldownFilters: () => void;
    openClassDropdown: () => void;
    openSectionDropdown: () => void;
    searchStudentsForReport: () => void;
    loadSingleStudentReport: () => void;
    onExport: () => void;
}) {
    const canSearchStudents = !!classFilter.trim() && !!sectionFilter.trim();
    const canLoadReport = !!selectedStudent && !studentReportLoading;

    return (
        <>
            <View style={styles.filterCard}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderTextBox}>
                        <Text style={styles.sectionEyebrow}>Report Filters</Text>
                        <Text style={styles.sectionTitle}>Single Student Attendance</Text>
                    </View>
                    <TouchableOpacity style={styles.clearFilterButton} onPress={clearDrilldownFilters} activeOpacity={0.85}>
                        <Text style={styles.clearFilterText}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Date</Text>
                <DatePickerField value={reportDate} onPress={() => setDatePickerTarget('drilldown')} />

                <Text style={styles.label}>Date Range</Text>
                <View style={styles.segmentRow}>
                    {(['Daily', 'Weekly', 'Monthly'] as DateRangeMode[]).map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.segmentButton, dateRangeMode === mode && styles.segmentButtonActive]}
                            onPress={() => setDateRangeMode(mode)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.segmentText, dateRangeMode === mode && styles.segmentTextActive]}>{mode}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.twoColumnRow}>
                    <View style={styles.halfInputBox}>
                        <Text style={styles.label}>Class</Text>
                        <DropdownField value={classFilter || 'Select Class'} onPress={openClassDropdown} />
                    </View>

                    <View style={styles.halfInputBox}>
                        <Text style={styles.label}>Section</Text>
                        <DropdownField value={sectionFilter || 'Select Section'} onPress={openSectionDropdown} />
                    </View>
                </View>

                <Text style={styles.label}>Student Search</Text>
                <View style={[styles.searchInputRow, !canSearchStudents && styles.disabledSearchBox]}>
                    <TextInput
                        style={styles.searchInput}
                        value={studentSearchQuery}
                        onChangeText={setStudentSearchQuery}
                        placeholder={canSearchStudents ? 'Search by name / admission no / roll no' : 'Select class and section first'}
                        placeholderTextColor="#6B7280"
                        editable={canSearchStudents && !studentSearchLoading}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={[styles.searchButton, (!canSearchStudents || studentSearchLoading) && styles.disabledButton]}
                        onPress={searchStudentsForReport}
                        disabled={!canSearchStudents || studentSearchLoading}
                        activeOpacity={0.85}
                    >
                        {studentSearchLoading ? (
                            <ActivityIndicator color={colors.primaryNavy} />
                        ) : (
                            <Text style={styles.searchButtonText}>Search</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {studentOptions.length > 0 && (
                    <View style={styles.studentOptionsBox}>
                        {studentOptions.map((student) => {
                            const selected = selectedStudent?.studentId === student.studentId;
                            return (
                                <TouchableOpacity
                                    key={student.studentId}
                                    style={[styles.studentOptionCard, selected && styles.studentOptionCardSelected]}
                                    onPress={() => setSelectedStudent(student)}
                                    activeOpacity={0.88}
                                >
                                    <Text style={styles.studentOptionName}>{student.studentName}</Text>
                                    <Text style={styles.studentOptionMeta}>
                                        {formatStudentMeta(student)} • Class {student.className}-{student.section}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {selectedStudent && (
                    <View style={styles.selectedStudentCard}>
                        <Text style={styles.selectedStudentLabel}>Selected Student</Text>
                        <Text style={styles.selectedStudentName}>{selectedStudent.studentName}</Text>
                        <Text style={styles.selectedStudentMeta}>{formatStudentMeta(selectedStudent)}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.loadButton, !canLoadReport && styles.disabledButton]}
                    onPress={loadSingleStudentReport}
                    disabled={!canLoadReport}
                    activeOpacity={0.9}
                >
                    {studentReportLoading ? (
                        <ActivityIndicator color={colors.primaryNavy} />
                    ) : (
                        <Text style={styles.loadButtonText}>Load Student Report</Text>
                    )}
                </TouchableOpacity>
            </View>

            {!studentReportLoading && hasLoadedStudentReport && !studentReport && <NoDataCard />}

            {!studentReportLoading && studentReport && (
                <View style={styles.reportSectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderTextBox}>
                            <Text style={styles.sectionEyebrow}>Results</Text>
                            <Text style={styles.sectionTitle}>Student Attendance Report</Text>
                        </View>
                        <TouchableOpacity style={styles.exportSmallButton} onPress={onExport} activeOpacity={0.85}>
                            <Text style={styles.exportSmallButtonText}>Export / Share</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.selectedStudentCard}>
                        <Text style={styles.selectedStudentLabel}>Student</Text>
                        <Text style={styles.selectedStudentName}>{studentReport.studentName}</Text>
                        <Text style={styles.selectedStudentMeta}>
                            {formatStudentMeta(studentReport)} • Class {studentReport.className}-{studentReport.section}
                        </Text>
                        <Text style={styles.selectedStudentMeta}>
                            {studentReport.rangeType}: {studentReport.fromDate} to {studentReport.toDate}
                        </Text>
                    </View>

                    <View style={styles.statsGrid}>
                        <StatBox title="Working Days" value={studentReport.totalWorkingDays} />
                        <StatBox title="Present" value={studentReport.presentDays} color={colors.successGreen} />
                        <StatBox title="Absent" value={studentReport.absentDays} color="#DC2626" />
                        <StatBox title="Late" value={studentReport.lateDays} color="#D97706" />
                    </View>

                    <View style={styles.percentageBox}>
                        <Text style={styles.percentageLabel}>Attendance %</Text>
                        <Text style={styles.percentageValue}>{Math.round(studentReport.attendancePercentage)}%</Text>
                        <Text style={styles.percentageSubText}>Based on present + late records in selected date range.</Text>
                    </View>

                    <Text style={styles.resultsCountText}>
                        Daily breakdown • {studentReport.dailyRecords.length} day{studentReport.dailyRecords.length === 1 ? '' : 's'}
                    </Text>

                    {studentReport.dailyRecords.map((record) => (
                        <StudentDailyRecordCard key={`${record.date}-${record.status}`} record={record} />
                    ))}
                </View>
            )}
        </>
    );
}

function StudentDailyRecordCard({ record }: { record: StudentDailyAttendanceRecord }) {
    const color = getStudentStatusColor(record.status);

    return (
        <View style={styles.studentDailyCard}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle}>{record.date}</Text>
                    <Text style={styles.cardSubtitle}>
                        {record.subjectName ? `${record.subjectName}${record.teacherName ? ` • ${record.teacherName}` : ''}` : 'Attendance status'}
                    </Text>
                </View>
                <Text style={[styles.studentStatusBadge, { color }]}>{formatStudentStatus(record.status)}</Text>
            </View>
        </View>
    );
}

function ReportContent({
                           activeView,
                           reportDate,
                           setDatePickerTarget,
                           dateRangeMode,
                           setDateRangeMode,
                           classFilter,
                           sectionFilter,
                           sortedReport,
                           reportData,
                           loading,
                           hasLoadedDrilldown,
                           sortBy,
                           clearDrilldownFilters,
                           loadDrilldownReport,
                           openDetailModal,
                           openClassDropdown,
                           openSectionDropdown,
                           openSortModal,
                           onExport,
                       }: {
    activeView: ReportView;
    reportDate: string;
    setDatePickerTarget: (target: 'overview' | 'drilldown' | null) => void;
    dateRangeMode: DateRangeMode;
    setDateRangeMode: (mode: DateRangeMode) => void;
    classFilter: string;
    sectionFilter: string;
    sortedReport: ReportItem[];
    reportData: ReportItem[];
    loading: boolean;
    hasLoadedDrilldown: boolean;
    sortBy: SortOption;
    clearDrilldownFilters: () => void;
    loadDrilldownReport: () => void;
    openDetailModal: (item: ReportItem) => void;
    openClassDropdown: () => void;
    openSectionDropdown: () => void;
    openSortModal: () => void;
    onExport: () => void;
}) {
    const title = getReportTitle(activeView);

    return (
        <>
            <View style={styles.filterCard}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderTextBox}>
                        <Text style={styles.sectionEyebrow}>Report Filters</Text>
                        <Text style={styles.sectionTitle}>Class / Section Search</Text>
                    </View>
                    <TouchableOpacity style={styles.clearFilterButton} onPress={clearDrilldownFilters} activeOpacity={0.85}>
                        <Text style={styles.clearFilterText}>Clear</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Date</Text>
                <DatePickerField value={reportDate} onPress={() => setDatePickerTarget('drilldown')} />

                <Text style={styles.label}>Date Range</Text>
                <View style={styles.segmentRow}>
                    {(['Daily', 'Weekly', 'Monthly'] as DateRangeMode[]).map((mode) => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.segmentButton, dateRangeMode === mode && styles.segmentButtonActive]}
                            onPress={() => setDateRangeMode(mode)}
                            activeOpacity={0.85}
                        >
                            <Text style={[styles.segmentText, dateRangeMode === mode && styles.segmentTextActive]}>
                                {mode}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.twoColumnRow}>
                    <View style={styles.halfInputBox}>
                        <Text style={styles.label}>Class</Text>
                        <DropdownField value={classFilter || 'All Classes'} onPress={openClassDropdown} />
                    </View>

                    <View style={styles.halfInputBox}>
                        <Text style={styles.label}>Section</Text>
                        <DropdownField value={sectionFilter || 'All Sections'} onPress={openSectionDropdown} />
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.loadButton, loading && styles.disabledButton]}
                    onPress={loadDrilldownReport}
                    disabled={loading}
                    activeOpacity={0.9}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.primaryNavy} />
                    ) : (
                        <Text style={styles.loadButtonText}>Load Report</Text>
                    )}
                </TouchableOpacity>
            </View>

            {!loading && hasLoadedDrilldown && reportData.length === 0 && <NoDataCard />}

            {!loading && reportData.length > 0 && sortedReport.length === 0 && (
                <View style={styles.noDataCard}>
                    <Text style={styles.noDataTitle}>No Matching Filters</Text>
                    <Text style={styles.noDataText}>
                        Data was loaded, but no class or section matched your current inputs.
                    </Text>
                </View>
            )}

            {!loading && sortedReport.length > 0 && (
                <View style={styles.reportSectionCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderTextBox}>
                            <Text style={styles.sectionEyebrow}>Results</Text>
                            <Text style={styles.sectionTitle}>{title}</Text>
                        </View>
                        <TouchableOpacity style={styles.exportSmallButton} onPress={onExport} activeOpacity={0.85}>
                            <Text style={styles.exportSmallButtonText}>Export / Share</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.resultsToolbarRow}>
                        <Text style={styles.resultsCountText}>
                            Showing {sortedReport.length} class-section result{sortedReport.length === 1 ? '' : 's'} for selected filters.
                        </Text>

                        <TouchableOpacity style={styles.sortSmallButton} onPress={openSortModal} activeOpacity={0.85}>
                            <Text style={styles.sortSmallButtonText}>Sort: {sortBy}</Text>
                        </TouchableOpacity>
                    </View>

                    {sortedReport.map((item, index) => (
                        <ReportResultCard
                            key={`${activeView}-${item.className}-${item.section}-${index}`}
                            item={item}
                            view={activeView}
                            onPress={() => openDetailModal(item)}
                        />
                    ))}
                </View>
            )}
        </>
    );
}


function ReplacementDrilldownContent({
                                         activeView,
                                         reportDate,
                                         replacementPeriods,
                                         onExport,
                                         onAssignReplacement,
                                     }: {
    activeView: ReportView;
    reportDate: string;
    replacementPeriods: ReplacementPeriod[];
    onExport: () => void;
    onAssignReplacement: (item: ReplacementPeriod) => void;
}) {
    const title = getReplacementReportTitle(activeView);
    const data = getReplacementReportData(activeView, replacementPeriods);

    return (
        <View style={styles.reportSectionCard}>
            <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderTextBox}>
                    <Text style={styles.sectionEyebrow}>Replacement Drilldown</Text>
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>
                <TouchableOpacity style={styles.exportSmallButton} onPress={onExport} activeOpacity={0.85}>
                    <Text style={styles.exportSmallButtonText}>Export / Share</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.resultsCountText}>
                Date: {reportDate} • Showing {data.length} period{data.length === 1 ? '' : 's'}
            </Text>

            {data.length === 0 ? (
                <View style={styles.noDataCard}>
                    <Text style={styles.noDataTitle}>No Periods Found</Text>
                    <Text style={styles.noDataText}>No matching teacher replacement periods found for this report.</Text>
                </View>
            ) : (
                data.map((item) => (
                    <ReplacementPeriodCard
                        key={`${item.id}-${item.className}-${item.section}`}
                        item={item}
                        showAssignButton={activeView === 'missingReplacementReport'}
                        onAssignReplacement={onAssignReplacement}
                    />
                ))
            )}
        </View>
    );
}

function ReplacementPeriodCard({
                                   item,
                                   showAssignButton,
                                   onAssignReplacement,
                               }: {
    item: ReplacementPeriod;
    showAssignButton: boolean;
    onAssignReplacement: (item: ReplacementPeriod) => void;
}) {
    const assigned = item.status === 'ASSIGNED' && !!item.replacementTeacherName;

    return (
        <View style={styles.replacementCard}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle}>
                        Class {item.className} - Section {item.section}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                        {item.subjectName} • {item.startTime} - {item.endTime}
                    </Text>
                </View>

                <Text style={[styles.replacementStatusBadge, assigned ? styles.replacementAssigned : styles.replacementMissing]}>
                    {assigned ? 'Assigned' : 'Missing'}
                </Text>
            </View>

            <View style={styles.detailList}>
                <DetailRow label="Date" value={item.scheduleDate} />
                <DetailRow label="Teacher on Leave" value={item.teacherName} />
                <DetailRow label="Leave Type" value={item.leaveType === 'PLANNED' ? 'Planned' : 'Unplanned'} />
                <DetailRow label="Replacement Teacher" value={item.replacementTeacherName || 'Not Assigned'} />
            </View>

            {showAssignButton && !assigned && (
                <TouchableOpacity
                    style={styles.assignButton}
                    activeOpacity={0.88}
                    onPress={() => onAssignReplacement(item)}
                >
                    <Text style={styles.assignButtonText}>Assign Replacement</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}


function AssignReplacementModal({
                                    visible,
                                    period,
                                    activeTab,
                                    selectedTeacherId,
                                    options,
                                    onChangeTab,
                                    onSelectTeacher,
                                    onClose,
                                    onSave,
                                }: {
    visible: boolean;
    period: ReplacementPeriod | null;
    activeTab: ReplacementTab;
    selectedTeacherId: number | null;
    options: ReplacementTeacherOption[];
    onChangeTab: (tab: ReplacementTab) => void;
    onSelectTeacher: (id: number | null) => void;
    onClose: () => void;
    onSave: () => void | Promise<void>;
}) {
    const filteredOptions = options.filter((teacher) => teacher.group === activeTab);

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.assignModalBox}>
                    <Text style={styles.assignModalTitle}>Replacement Options</Text>

                    {period && (
                        <View style={styles.assignScheduleCard}>
                            <Text style={styles.assignScheduleTeacher}>{period.teacherName}</Text>
                            <Text style={styles.assignScheduleText}>Subject: {period.subjectName}</Text>
                            <Text style={styles.assignScheduleText}>Time: {period.startTime} - {period.endTime}</Text>
                            <Text style={styles.assignScheduleText}>Class: {period.className} - Section {period.section}</Text>
                        </View>
                    )}

                    <View style={styles.replacementTabRow}>
                        {(['Best Match', 'Same Class', 'Others'] as ReplacementTab[]).map((tab) => {
                            const selected = activeTab === tab;
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    style={[styles.replacementTabButton, selected && styles.replacementTabButtonActive]}
                                    onPress={() => {
                                        onChangeTab(tab);
                                        onSelectTeacher(null);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Text style={[styles.replacementTabText, selected && styles.replacementTabTextActive]}>
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <ScrollView style={styles.replacementOptionsList} showsVerticalScrollIndicator={false}>
                        {filteredOptions.map((teacher) => {
                            const selected = selectedTeacherId === teacher.id;
                            return (
                                <TouchableOpacity
                                    key={teacher.id}
                                    style={[styles.replacementOptionCard, selected && styles.replacementOptionCardSelected]}
                                    onPress={() => onSelectTeacher(teacher.id)}
                                    activeOpacity={0.88}
                                >
                                    <Text style={styles.replacementOptionName}>{teacher.name}</Text>
                                    <Text style={styles.replacementOptionGroup}>{teacher.group.toUpperCase().replace(' ', '_')}</Text>
                                    <Text style={styles.replacementOptionText}>Class: {teacher.className} - Section {teacher.section}</Text>
                                    <Text style={styles.replacementOptionText}>Subject: {teacher.subjectName}</Text>
                                    <Text style={styles.replacementOptionText}>Workload: {teacher.workload}</Text>
                                    {teacher.lastClassEnded && (
                                        <Text style={styles.replacementOptionText}>Last class: {teacher.lastClassEnded}</Text>
                                    )}
                                    {teacher.nextClass && (
                                        <Text style={styles.replacementOptionText}>Next class: {teacher.nextClass}</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}

                        <TouchableOpacity
                            style={[styles.noReplacementButton, selectedTeacherId === null && styles.noReplacementButtonSelected]}
                            onPress={() => onSelectTeacher(null)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.noReplacementText}>No Replacement</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.assignModalActions}>
                        <TouchableOpacity style={styles.assignCancelButton} onPress={onClose} activeOpacity={0.85}>
                            <Text style={styles.assignCancelText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.assignSaveButton} onPress={onSave} activeOpacity={0.85}>
                            <Text style={styles.assignSaveText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}


function TeacherReportContent({
                                  selectedMonth,
                                  onSelectMonth,
                                  onExport,
                              }: {
    selectedMonth: string;
    onSelectMonth: () => void;
    onExport: () => void;
}) {
    const [activeTeacherReportTab, setActiveTeacherReportTab] = useState<TeacherReportTab>('overview');
    const [monthlyOverview, setMonthlyOverview] = useState<TeacherMonthlyOverview>({
        month: selectedMonth,
        totalTeachers: 0,
        totalTeachersInLeave: 0,
        totalPlannedLeaves: 0,
        totalUnplannedLeaves: 0,
    });
    const [leaveRows, setLeaveRows] = useState<TeacherMonthlyLeaveRow[]>([]);
    const [replacementRows, setReplacementRows] = useState<TeacherMonthlyReplacementRow[]>([]);
    const [monthlyLoading, setMonthlyLoading] = useState(false);
    const [showLeaveList, setShowLeaveList] = useState(false);

    const loadMonthlyTeacherReports = async () => {
        try {
            setMonthlyLoading(true);
            const [overviewResponse, leavesResponse, replacementResponse] = await Promise.all([
                fetch(`${BASE_URL}/admin/reports/teacher-monthly-overview?month=${encodeURIComponent(selectedMonth)}`),
                fetch(`${BASE_URL}/admin/reports/teacher-monthly-leaves?month=${encodeURIComponent(selectedMonth)}`),
                fetch(`${BASE_URL}/admin/reports/teacher-monthly-replacement-coverage?month=${encodeURIComponent(selectedMonth)}`),
            ]);

            if (!overviewResponse.ok || !leavesResponse.ok || !replacementResponse.ok) {
                throw new Error('Monthly teacher report API failed');
            }

            const overviewData = await overviewResponse.json();
            const leavesData = await leavesResponse.json();
            const replacementData = await replacementResponse.json();

            setMonthlyOverview({
                month: String(overviewData.month || selectedMonth),
                totalTeachers: Number(overviewData.totalTeachers || 0),
                totalTeachersInLeave: Number(overviewData.totalTeachersInLeave || 0),
                totalPlannedLeaves: Number(overviewData.totalPlannedLeaves || 0),
                totalUnplannedLeaves: Number(overviewData.totalUnplannedLeaves || 0),
            });

            setLeaveRows(Array.isArray(leavesData) ? leavesData.map(mapMonthlyLeaveRow) : []);
            setReplacementRows(Array.isArray(replacementData) ? replacementData.map(mapMonthlyReplacementRow) : []);
        } catch (error) {
            console.log(error);
            setMonthlyOverview({
                month: selectedMonth,
                totalTeachers: 0,
                totalTeachersInLeave: 0,
                totalPlannedLeaves: 0,
                totalUnplannedLeaves: 0,
            });
            setLeaveRows([]);
            setReplacementRows([]);
            Alert.alert('Teacher Report', 'Unable to load monthly teacher report. Please verify backend is running.');
        } finally {
            setMonthlyLoading(false);
        }
    };

    useEffect(() => {
        setShowLeaveList(false);
        loadMonthlyTeacherReports();
    }, [selectedMonth]);

    return (
        <>
            <View style={styles.quickNavCard}>
                <Text style={styles.quickNavEyebrow}>Quick Navigation</Text>
                <Text style={styles.quickNavTitle}>Teacher Report Sections</Text>

                <View style={styles.quickNavRow}>
                    <TouchableOpacity
                        style={[styles.quickNavButton, activeTeacherReportTab === 'overview' && styles.quickNavButtonActive]}
                        onPress={() => setActiveTeacherReportTab('overview')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.quickNavEmoji}>📊</Text>
                        <Text style={[styles.quickNavText, activeTeacherReportTab === 'overview' && styles.quickNavTextActive]}>Overview</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickNavButton, activeTeacherReportTab === 'replacementCoverage' && styles.quickNavButtonActive]}
                        onPress={() => setActiveTeacherReportTab('replacementCoverage')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.quickNavEmoji}>🔁</Text>
                        <Text style={[styles.quickNavText, activeTeacherReportTab === 'replacementCoverage' && styles.quickNavTextActive]} numberOfLines={2}>
                            Replacement Coverage
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.reportSectionCard}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderTextBox}>
                        <Text style={styles.sectionEyebrow}>Academic Month</Text>
                        <Text style={styles.sectionTitle}>{formatMonthLabel(selectedMonth)}</Text>
                    </View>
                    <TouchableOpacity style={styles.exportSmallButton} onPress={onSelectMonth} activeOpacity={0.85}>
                        <Text style={styles.exportSmallButtonText}>Change Month</Text>
                    </TouchableOpacity>
                </View>

                {monthlyLoading ? (
                    <ActivityIndicator color={colors.primaryNavy} />
                ) : activeTeacherReportTab === 'overview' ? (
                    <>
                        <View style={styles.statsGrid}>
                            <StatBox title="Total Teachers" value={monthlyOverview.totalTeachers} />
                            <StatBox title="Teachers in Leave" value={monthlyOverview.totalTeachersInLeave} color="#92400E" onPress={() => setShowLeaveList(true)} />
                            <StatBox title="Total Planned" value={monthlyOverview.totalPlannedLeaves} color="#2563EB" />
                            <StatBox title="Total Unplanned" value={monthlyOverview.totalUnplannedLeaves} color="#D97706" />
                        </View>

                        {showLeaveList && (
                            <View style={styles.teacherHistoryCard}>
                                <View style={styles.sectionHeaderRow}>
                                    <View style={styles.sectionHeaderTextBox}>
                                        <Text style={styles.sectionEyebrow}>Teachers in Leave</Text>
                                        <Text style={styles.sectionTitle}>{formatMonthLabel(selectedMonth)}</Text>
                                    </View>
                                </View>

                                {leaveRows.length === 0 ? (
                                    <View style={styles.noDataCard}>
                                        <Text style={styles.noDataTitle}>No Teachers in Leave</Text>
                                        <Text style={styles.noDataText}>No planned or unplanned leave records found for this month.</Text>
                                    </View>
                                ) : (
                                    leaveRows.map((row) => <TeacherMonthlyLeaveCard key={row.teacherId} row={row} />)
                                )}
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionHeaderTextBox}>
                                <Text style={styles.sectionEyebrow}>Replacement Coverage</Text>
                                <Text style={styles.sectionTitle}>Monthly Replacement Workload</Text>
                            </View>
                            <TouchableOpacity style={styles.exportSmallButton} onPress={onExport} activeOpacity={0.85}>
                                <Text style={styles.exportSmallButtonText}>Export / Share</Text>
                            </TouchableOpacity>
                        </View>

                        {replacementRows.length === 0 ? (
                            <View style={styles.noDataCard}>
                                <Text style={styles.noDataTitle}>No Replacement Coverage</Text>
                                <Text style={styles.noDataText}>No replacement assignment records found for this month.</Text>
                            </View>
                        ) : (
                            replacementRows.map((row) => <TeacherMonthlyReplacementCard key={row.teacherId} row={row} />)
                        )}
                    </>
                )}
            </View>
        </>
    );
}

function TeacherMonthlyLeaveCard({ row }: { row: TeacherMonthlyLeaveRow }) {
    return (
        <View style={styles.teacherCard}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle}>{row.teacherName}</Text>
                    <Text style={styles.cardSubtitle}>Teacher ID {row.teacherId}</Text>
                </View>
                <Text style={styles.attendancePercent}>{row.totalLeaves}</Text>
            </View>
            <View style={styles.statsGrid}>
                <StatBox title="Total Leaves" value={row.totalLeaves} />
                <StatBox title="Planned" value={row.plannedLeaves} color="#2563EB" />
                <StatBox title="Unplanned" value={row.unplannedLeaves} color="#D97706" />
            </View>
            <Text style={styles.teacherHistoryMeta}>Classes: {(row.classesHandled || []).join(', ') || 'Not available'}</Text>
            <Text style={styles.teacherHistoryMeta}>Subjects: {(row.subjectsHandled || []).join(', ') || 'Not available'}</Text>
        </View>
    );
}

function TeacherMonthlyReplacementCard({ row }: { row: TeacherMonthlyReplacementRow }) {
    return (
        <View style={styles.teacherCard}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle}>{row.teacherName}</Text>
                    <Text style={styles.cardSubtitle}>Teacher ID {row.teacherId}</Text>
                </View>
                <Text style={styles.attendancePercent}>{row.totalReplacementPeriods}</Text>
            </View>
            <View style={styles.statsGrid}>
                <StatBox title="Periods" value={row.totalReplacementPeriods} color={colors.successGreen} />
                <StatBox title="Classes" value={row.classesCovered} color="#2563EB" />
                <StatBox title="Subjects" value={row.subjectsCovered} color="#92400E" />
                <StatBox title="Minutes" value={row.totalMinutes} color="#D97706" />
            </View>
            <Text style={styles.teacherHistoryMeta}>Total Hours: {row.hours}</Text>
        </View>
    );
}

function TeacherChipSection({ title, values }: { title: string; values: string[] }) {
    const displayValues = values && values.length > 0 ? values : ['Not available'];

    return (
        <View style={styles.teacherChipSection}>
            <Text style={styles.teacherChipTitle}>{title}</Text>
            <View style={styles.teacherChipRow}>
                {displayValues.map((value, index) => (
                    <View key={`${title}-${value}-${index}`} style={styles.teacherChip}>
                        <Text style={styles.teacherChipText}>{value}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function TeacherActionButton({ title, emoji, onPress }: { title: string; emoji: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.teacherActionButton} onPress={onPress} activeOpacity={0.88}>
            <Text style={styles.teacherActionEmoji}>{emoji}</Text>
            <Text style={styles.teacherActionText}>{title}</Text>
        </TouchableOpacity>
    );
}

function TeacherHistoryRow({ row }: { row: TeacherHistoryRecord }) {
    return (
        <View style={styles.teacherHistoryRow}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle}>{row.title}</Text>
                    <Text style={styles.cardSubtitle}>{row.subtitle}</Text>
                </View>
                {row.status && <Text style={styles.teacherHistoryStatus}>{row.status}</Text>}
            </View>
            <Text style={styles.teacherHistoryMeta}>{row.meta}</Text>
        </View>
    );
}

function ReportResultCard({ item, view, onPress }: { item: ReportItem; view: ReportView; onPress: () => void }) {
    const metric = getMainMetric(item, view);

    return (
        <TouchableOpacity style={styles.reportCard} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleBox}>
                    <Text style={styles.cardTitle}>Class {item.className} - Section {item.section}</Text>
                    <Text style={styles.cardSubtitle}>Tap to open class-section details</Text>
                </View>
                <View style={styles.metricPill}>
                    <Text style={styles.metricPillLabel}>{metric.label}</Text>
                    <Text style={[styles.metricPillValue, { color: metric.color }]}>
                        {view === 'classReports' ? `${item.attendancePercentage.toFixed(1)}%` : metric.value}
                    </Text>
                </View>
            </View>

            <View style={styles.statsGrid}>
                <StatBox title="Total" value={item.totalRecords} />
                <StatBox title="Present" value={item.present} color={colors.successGreen} />
                <StatBox title="Absent" value={item.absent} color="#DC2626" />
                <StatBox title="Late" value={item.late} color="#D97706" />
            </View>

            <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={[styles.statusBadge, item.totalRecords > 0 ? styles.statusSubmitted : styles.statusPending]}>
                    {item.totalRecords > 0 ? 'Submitted' : 'Pending'}
                </Text>
            </View>

            <View style={styles.progressBackground}>
                <View style={[styles.progressFill, { width: `${Math.min(item.attendancePercentage, 100)}%` }]} />
            </View>
        </TouchableOpacity>
    );
}

function StatBox({
                     title,
                     value,
                     color = colors.primaryNavy,
                     onPress,
                 }: {
    title: string;
    value: number;
    color?: string;
    onPress?: () => void;
}) {
    const content = (
        <View style={[styles.statBox, onPress && styles.clickableStatBox]}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            {onPress && <Text style={styles.tapHint}>Tap to view</Text>}
        </View>
    );

    if (!onPress) return content;

    return (
        <TouchableOpacity style={styles.statTouchable} onPress={onPress} activeOpacity={0.88}>
            {content}
        </TouchableOpacity>
    );
}

function DatePickerField({ value, onPress }: { value: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.datePickerField} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.datePickerText}>{value}</Text>
            <Text style={styles.datePickerIcon}>📅</Text>
        </TouchableOpacity>
    );
}

function DropdownField({ value, onPress }: { value: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.dropdownField} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.dropdownText} numberOfLines={1}>
                {value}
            </Text>
            <Text style={styles.dropdownIcon}>⌄</Text>
        </TouchableOpacity>
    );
}

function NoDataCard() {
    return (
        <View style={styles.noDataCard}>
            <Text style={styles.noDataTitle}>No Data Found</Text>
            <Text style={styles.noDataText}>
                No attendance report data found for selected date. Try another date or confirm backend attendance data exists.
            </Text>
        </View>
    );
}

function ExportOption({ emoji, title, onPress }: { emoji: string; title: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.exportOption} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.exportEmoji}>{emoji}</Text>
            <Text style={styles.exportTitle}>{title}</Text>
        </TouchableOpacity>
    );
}

function DropdownModal({
                           visible,
                           title,
                           options,
                           allLabel,
                           emptyText,
                           onSelect,
                           onSelectAll,
                           onClose,
                       }: {
    visible: boolean;
    title: string;
    options: string[];
    allLabel: string;
    emptyText: string;
    onSelect: (value: string) => void;
    onSelectAll: () => void;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>{title}</Text>

                    <TouchableOpacity style={styles.optionButton} onPress={onSelectAll} activeOpacity={0.85}>
                        <Text style={styles.optionText}>{allLabel}</Text>
                    </TouchableOpacity>

                    {options.length === 0 ? (
                        <Text style={styles.dropdownEmptyText}>{emptyText}</Text>
                    ) : (
                        options.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.optionButton}
                                onPress={() => onSelect(option)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))
                    )}

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function AcademicMonthModal({
                                visible,
                                selectedMonth,
                                onSelect,
                                onClose,
                            }: {
    visible: boolean;
    selectedMonth: string;
    onSelect: (month: string) => void;
    onClose: () => void;
}) {
    const months = getAcademicMonthOptions();

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Select Academic Month</Text>

                    {months.map((month) => {
                        const selected = month.value === selectedMonth;
                        return (
                            <TouchableOpacity
                                key={month.value}
                                style={[styles.optionButton, selected && styles.studentOptionCardSelected]}
                                onPress={() => onSelect(month.value)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.optionText}>{month.label}</Text>
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function CalendarModal({
                           visible,
                           selectedDate,
                           onSelect,
                           onClose,
                       }: {
    visible: boolean;
    selectedDate: string;
    onSelect: (date: string) => void;
    onClose: () => void;
}) {
    const [visibleMonth, setVisibleMonth] = useState(selectedDate);
    const monthDate = parseLocalDate(visibleMonth);
    const monthTitle = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    const days = getMonthDays(visibleMonth);
    const selected = parseLocalDate(selectedDate);

    const chooseDay = (day: number) => {
        const current = parseLocalDate(visibleMonth);
        const selectedDay = new Date(current.getFullYear(), current.getMonth(), day);
        onSelect(formatDate(selectedDay));
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onShow={() => setVisibleMonth(selectedDate)}>
            <View style={styles.modalOverlay}>
                <View style={styles.calendarBox}>
                    <Text style={styles.modalTitle}>Select Report Date</Text>

                    <View style={styles.calendarHeaderRow}>
                        <TouchableOpacity
                            style={styles.calendarArrowButton}
                            onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.calendarArrowText}>‹</Text>
                        </TouchableOpacity>

                        <Text style={styles.calendarMonthTitle}>{monthTitle}</Text>

                        <TouchableOpacity
                            style={styles.calendarArrowButton}
                            onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.calendarArrowText}>›</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.weekRow}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <Text key={day} style={styles.weekText}>
                                {day}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.daysGrid}>
                        {days.map((day, index) => {
                            const isSelected =
                                !!day &&
                                day === selected.getDate() &&
                                monthDate.getMonth() === selected.getMonth() &&
                                monthDate.getFullYear() === selected.getFullYear();

                            if (!day) {
                                return <View key={`empty-${index}`} style={styles.dayButton} />;
                            }

                            return (
                                <TouchableOpacity
                                    key={`${monthTitle}-${day}`}
                                    style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                                    onPress={() => chooseDay(day)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{day}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

function formatDate(inputDate: Date) {
    return inputDate.toISOString().split('T')[0];
}

function parseLocalDate(value: string) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function getMonthDays(selectedDate: string) {
    const base = parseLocalDate(selectedDate);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Array<number | null> = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        days.push(day);
    }

    return days;
}

function addMonths(dateValue: string, months: number) {
    const date = parseLocalDate(dateValue);
    date.setMonth(date.getMonth() + months);
    return formatDate(date);
}

function buildSummaryStats(data: ReportItem[]) {
    const total = data.reduce((sum, item) => sum + item.totalRecords, 0);
    const present = data.reduce((sum, item) => sum + item.present, 0);
    const absent = data.reduce((sum, item) => sum + item.absent, 0);
    const late = data.reduce((sum, item) => sum + item.late, 0);
    const percentage = total === 0 ? 0 : ((present + late) / total) * 100;
    const classesCovered = data.filter((item) => item.totalRecords > 0).length;
    const pendingAttendance = data.filter((item) => item.totalRecords === 0).length;

    return { total, present, absent, late, percentage, classesCovered, pendingAttendance };
}

function getReportTitle(view: ReportView) {
    if (view === 'presentReport') return 'Present Students Report';
    if (view === 'absentReport') return 'Absentee Report';
    if (view === 'lateReport') return 'Late Students Report';
    if (view === 'pendingReport') return 'Pending Attendance Report';
    if (view === 'studentReport') return 'Student Attendance Report';
    return 'Class Attendance Reports';
}

function getMainMetric(item: ReportItem, view: ReportView) {
    if (view === 'presentReport' || view === 'studentReport') {
        return { label: 'Present', value: item.present, color: colors.successGreen };
    }

    if (view === 'absentReport') {
        return { label: 'Absent', value: item.absent, color: '#DC2626' };
    }

    if (view === 'lateReport') {
        return { label: 'Late', value: item.late, color: '#D97706' };
    }

    if (view === 'pendingReport') {
        return { label: 'Pending', value: item.totalRecords === 0 ? 1 : 0, color: '#92400E' };
    }

    return { label: 'Attendance', value: Math.round(item.attendancePercentage), color: colors.successGreen };
}


function isReplacementDrilldownView(view: ReportView) {
    return (
        view === 'leavePeriodsReport' ||
        view === 'plannedLeaveReport' ||
        view === 'unplannedLeaveReport' ||
        view === 'assignedReplacementReport' ||
        view === 'missingReplacementReport'
    );
}

function getReplacementReportTitle(view: ReportView) {
    if (view === 'plannedLeaveReport') return 'Planned Leave Periods';
    if (view === 'unplannedLeaveReport') return 'Unplanned Leave Periods';
    if (view === 'assignedReplacementReport') return 'Assigned Replacement Periods';
    if (view === 'missingReplacementReport') return 'Missing Replacement Periods';
    return 'Leave Periods Report';
}

function getReplacementReportData(view: ReportView, periods: ReplacementPeriod[]) {
    if (view === 'plannedLeaveReport') {
        return periods.filter((item) => item.leaveType === 'PLANNED');
    }

    if (view === 'unplannedLeaveReport') {
        return periods.filter((item) => item.leaveType === 'UNPLANNED');
    }

    if (view === 'assignedReplacementReport') {
        return periods.filter((item) => item.status === 'ASSIGNED' && !!item.replacementTeacherName);
    }

    if (view === 'missingReplacementReport') {
        return periods.filter((item) => item.status === 'MISSING' || !item.replacementTeacherName);
    }

    return periods;
}

function mapStudentSearchItem(item: any): StudentSearchItem {
    return {
        studentId: Number(item.studentId || item.id || 0),
        studentName: String(item.studentName || item.name || ''),
        admissionNumber: item.admissionNumber ? String(item.admissionNumber) : null,
        rollNumber: item.rollNumber ? String(item.rollNumber) : null,
        className: String(item.className || ''),
        section: String(item.section || ''),
    };
}

function formatStudentMeta(student: Pick<StudentSearchItem, 'admissionNumber' | 'rollNumber'>) {
    const admission = student.admissionNumber ? `ADM ${student.admissionNumber}` : 'ADM -';
    const roll = student.rollNumber ? `Roll ${student.rollNumber}` : 'Roll -';
    return `${admission} • ${roll}`;
}

function formatStudentStatus(status: string) {
    if (status === 'NOT_MARKED') return 'Not Marked';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}

function getStudentStatusColor(status: string) {
    if (status === 'PRESENT') return colors.successGreen;
    if (status === 'ABSENT') return '#DC2626';
    if (status === 'LATE') return '#D97706';
    return '#6B7280';
}


function mapMonthlyLeaveRow(item: any): TeacherMonthlyLeaveRow {
    return {
        teacherId: Number(item.teacherId || 0),
        teacherName: String(item.teacherName || 'Teacher'),
        totalLeaves: Number(item.totalLeaves || item.leaves || 0),
        plannedLeaves: Number(item.plannedLeaves || item.planned || 0),
        unplannedLeaves: Number(item.unplannedLeaves || item.unplanned || 0),
        subjectsHandled: Array.isArray(item.subjectsHandled) ? item.subjectsHandled.map(String) : [],
        classesHandled: Array.isArray(item.classesHandled) ? item.classesHandled.map(String) : [],
    };
}

function mapMonthlyReplacementRow(item: any): TeacherMonthlyReplacementRow {
    return {
        teacherId: Number(item.teacherId || 0),
        teacherName: String(item.teacherName || 'Teacher'),
        totalReplacementPeriods: Number(item.totalReplacementPeriods || item.periods || 0),
        classesCovered: Number(item.classesCovered || item.classes || 0),
        subjectsCovered: Number(item.subjectsCovered || item.subjects || 0),
        totalMinutes: Number(item.totalMinutes || 0),
        hours: Number(item.hours || 0),
    };
}

function formatMonthValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function formatMonthLabel(value: string) {
    const [yearText, monthText] = value.split('-');
    const year = Number(yearText);
    const month = Number(monthText);

    if (!year || !month) {
        return value;
    }

    return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
}

function getAcademicMonthOptions() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const academicStartYear = now.getMonth() + 1 >= 6 ? currentYear : currentYear - 1;
    const months = [];

    for (let index = 0; index < 12; index++) {
        const date = new Date(academicStartYear, 5 + index, 1);
        months.push({
            value: formatMonthValue(date),
            label: formatMonthLabel(formatMonthValue(date)),
        });
    }

    return months;
}

function mapTeacherSearchItem(item: any): TeacherSearchItem {
    return {
        teacherId: Number(item.teacherId || item.id || 0),
        teacherName: String(item.teacherName || item.name || ''),
        employeeId: item.employeeId ? String(item.employeeId) : null,
    };
}

function mapTeacherInsightSummary(item: any, fallbackTeacher: TeacherSearchItem): TeacherInsightSummary {
    return {
        teacherId: Number(item.teacherId || fallbackTeacher.teacherId || 0),
        teacherName: String(item.teacherName || fallbackTeacher.teacherName || ''),
        classesHandled: normalizeStringArray(item.classesHandled || item.classNames || item.classes),
        sectionsHandled: normalizeStringArray(item.sectionsHandled || item.sections),
        subjectsHandled: normalizeStringArray(item.subjectsHandled || item.subjectNames || item.subjects),
        totalLeaves: Number(item.totalLeaves || 0),
        plannedLeaves: Number(item.plannedLeaves || 0),
        unplannedLeaves: Number(item.unplannedLeaves || 0),
        replacementAssignments: Number(item.replacementAssignments || 0),
        attendanceSubmissions: Number(item.attendanceSubmissions || 0),
        examResultSubmissions: Number(item.examResultSubmissions || 0),
    };
}

function buildFallbackTeacherInsight(teacher: TeacherSearchItem): TeacherInsightSummary {
    return {
        teacherId: teacher.teacherId,
        teacherName: teacher.teacherName,
        classesHandled: [],
        sectionsHandled: [],
        subjectsHandled: [],
        totalLeaves: 0,
        plannedLeaves: 0,
        unplannedLeaves: 0,
        replacementAssignments: 0,
        attendanceSubmissions: 0,
        examResultSubmissions: 0,
    };
}

function normalizeStringArray(value: any): string[] {
    if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
}

function getTeacherHistoryTitle(type: TeacherHistoryType) {
    if (type === 'attendance') return 'Attendance Submission History';
    if (type === 'exam') return 'Exam Result Submission History';
    if (type === 'leave') return 'Leave History';
    return 'Replacement History';
}

function mapTeacherHistoryRecord(item: any, index: number, type: TeacherHistoryType): TeacherHistoryRecord {
    if (type === 'attendance') {
        return {
            id: `attendance-${index}-${item.attendanceDate || item.date || ''}`,
            title: String(item.attendanceDate || item.date || 'Attendance Submission'),
            subtitle: `Class ${item.className || '-'}-${item.section || '-'} • ${item.subjectName || 'Subject -'}`,
            meta: `Submitted: ${item.submittedTime || item.time || '-'} • Present ${Number(item.presentStudents || item.present || 0)} • Absent ${Number(item.absentStudents || item.absent || 0)}`,
            status: `${Number(item.totalStudents || item.totalRecords || 0)} students`,
        };
    }

    if (type === 'exam') {
        return {
            id: `exam-${index}-${item.examDate || item.date || ''}`,
            title: String(item.examName || item.examType || 'Exam Result'),
            subtitle: `Class ${item.className || '-'}-${item.section || '-'} • ${item.subjectName || 'Subject -'}`,
            meta: `Exam Date: ${item.examDate || item.date || '-'} • Results submitted: ${Number(item.totalResultsSubmitted || item.totalSubmitted || 0)}`,
            status: 'Exam',
        };
    }

    if (type === 'leave') {
        return {
            id: `leave-${index}-${item.leaveDate || item.scheduleDate || item.date || ''}`,
            title: String(item.leaveDate || item.scheduleDate || item.date || 'Leave Date'),
            subtitle: String(item.reason || item.subjectName || 'Teacher leave period'),
            meta: `Type: ${formatTeacherLeaveType(item.leaveType || item.status)} • Status: ${item.status || '-'}`,
            status: formatTeacherLeaveType(item.leaveType || item.status),
        };
    }

    return {
        id: `replacement-${index}-${item.id || item.scheduleId || ''}`,
        title: String(item.replacementDate || item.scheduleDate || item.date || 'Replacement Assignment'),
        subtitle: `Class ${item.className || '-'}-${item.section || '-'} • ${item.subjectName || 'Subject -'}`,
        meta: `Time: ${item.startTime || '-'} - ${item.endTime || '-'} • Replaced: ${item.replacedTeacherName || item.teacherName || '-'}`,
        status: 'Replacement',
    };
}

function formatTeacherLeaveType(value: any) {
    const text = String(value || '').replace('_', ' ').toLowerCase();

    if (!text) return '-';

    return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 8,
    },


    background: {
        flex: 1,
        backgroundColor: '#F6E7B0',
    },
    container: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 64,
        paddingBottom: spacing.xxxl,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },
    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 38,
        lineHeight: 40,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    title: {
        flex: 1,
        fontSize: 26,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
        paddingHorizontal: spacing.sm,
    },
    homeButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    homeButtonText: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    heroCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.52)',
        borderRadius: 26,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },
    heroEyebrow: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: spacing.xs,
    },
    heroTitle: {
        fontSize: 25,
        fontWeight: '900',
        color: colors.primaryNavy,
        lineHeight: 31,
        marginBottom: spacing.sm,
    },
    heroText: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.slateText,
        lineHeight: 23,
    },
    generatedPill: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primaryNavy,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        marginTop: spacing.lg,
    },
    generatedPillText: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.premiumGold,
    },
    quickNavCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.88)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: 18,
        marginBottom: 18,
        ...shadows.medium,
    },
    quickNavEyebrow: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginBottom: spacing.sm,
    },
    quickNavTitle: {
        fontSize: 21,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 14,
    },
    quickNavRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    quickNavButton: {
        width: '31%',
        minHeight: 82,
        backgroundColor: '#FFF9E8',
        borderRadius: 18,
        borderWidth: 1.3,
        borderColor: colors.cardGoldBorder,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    quickNavButtonActive: {
        backgroundColor: colors.primaryNavy,
        borderColor: colors.premiumGold,
    },
    quickNavEmoji: {
        fontSize: 22,
        marginBottom: 6,
    },
    quickNavText: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
        lineHeight: 15,
    },
    quickNavTextActive: {
        color: colors.premiumGold,
    },
    filterCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.88)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    sectionHeaderTextBox: {
        flex: 1,
        paddingRight: spacing.md,
    },
    sectionEyebrow: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    sectionTitle: {
        fontSize: 23,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primaryNavy,
        marginBottom: spacing.sm,
    },
    datePickerField: {
        height: 58,
        borderRadius: 16,
        borderWidth: 1.2,
        borderColor: '#D1D5DB',
        paddingHorizontal: spacing.md,
        backgroundColor: '#F9FAFB',
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    datePickerText: {
        fontSize: 17,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    datePickerIcon: {
        fontSize: 23,
    },
    dropdownField: {
        height: 58,
        borderRadius: 16,
        borderWidth: 1.2,
        borderColor: '#D1D5DB',
        paddingHorizontal: spacing.md,
        backgroundColor: '#F9FAFB',
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    dropdownText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
        paddingRight: spacing.sm,
    },
    dropdownIcon: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.premiumGold,
    },
    twoColumnRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInputBox: {
        width: '48%',
    },
    segmentRow: {
        flexDirection: 'row',
        backgroundColor: '#FFF8E1',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        padding: 4,
        marginBottom: spacing.lg,
    },
    segmentButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    segmentButtonActive: {
        backgroundColor: colors.primaryNavy,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    segmentTextActive: {
        color: colors.premiumGold,
    },
    clearFilterButton: {
        backgroundColor: '#FFF8E1',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    clearFilterText: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    loadButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        ...shadows.medium,
    },
    disabledButton: {
        opacity: 0.7,
    },
    loadButtonText: {
        fontSize: 17,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    summaryCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.92)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        ...shadows.medium,
    },
    reportSectionCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.92)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    statTouchable: {
        width: '48%',
        marginBottom: spacing.md,
    },
    statBox: {
        width: '48%',
        backgroundColor: '#FFF9E8',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    clickableStatBox: {
        width: '100%',
        marginBottom: 0,
        borderColor: colors.premiumGold,
        backgroundColor: '#FFF5D6',
    },
    statTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.slateText,
    },
    statValue: {
        fontSize: 26,
        fontWeight: '900',
        marginTop: spacing.xs,
    },
    tapHint: {
        fontSize: 11,
        fontWeight: '900',
        color: colors.premiumGold,
        marginTop: spacing.xs,
    },
    percentageBox: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },
    percentageLabel: {
        color: colors.premiumGold,
        fontSize: 18,
        fontWeight: '900',
        marginBottom: spacing.sm,
    },
    percentageValue: {
        color: colors.white,
        fontSize: 38,
        fontWeight: '900',
    },
    percentageSubText: {
        color: '#E5E7EB',
        fontSize: 13,
        fontWeight: '700',
        marginTop: spacing.sm,
        lineHeight: 20,
    },
    noDataCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        alignItems: 'center',
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    noDataTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#92400E',
        marginBottom: spacing.sm,
    },
    noDataText: {
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        color: '#92400E',
        lineHeight: 22,
    },
    resultsToolbarRow: {
        marginBottom: spacing.lg,
    },
    resultsCountText: {
        fontSize: 15,
        lineHeight: 23,
        fontWeight: '800',
        color: colors.slateText,
        marginBottom: spacing.md,
    },
    sortSmallButton: {
        alignSelf: 'flex-start',
        backgroundColor: colors.primaryNavy,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    sortSmallButtonText: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.premiumGold,
    },
    reportCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    teacherCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    cardTitleBox: {
        flex: 1,
        paddingRight: spacing.md,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    cardSubtitle: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.xs,
    },
    attendancePercent: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.successGreen,
    },
    metricPill: {
        minWidth: 88,
        backgroundColor: colors.primaryNavy,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    metricPillLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: colors.premiumGold,
    },
    metricPillValue: {
        fontSize: 20,
        fontWeight: '900',
        marginTop: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.slateText,
    },
    statusBadge: {
        overflow: 'hidden',
        borderRadius: 14,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        fontSize: 12,
        fontWeight: '900',
    },
    statusSubmitted: {
        backgroundColor: '#DCFCE7',
        color: '#166534',
    },
    statusPending: {
        backgroundColor: '#FEF3C7',
        color: '#92400E',
    },
    progressBackground: {
        height: 12,
        backgroundColor: '#E5E7EB',
        borderRadius: 20,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.successGreen,
        borderRadius: 20,
    },
    exportSmallButton: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 14,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
    },
    exportSmallButtonText: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.premiumGold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalBox: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: spacing.xl,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        maxHeight: '82%',
    },
    calendarBox: {
        backgroundColor: colors.white,
        borderRadius: 26,
        padding: spacing.xl,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    drillTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    optionButton: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primaryNavy,
    },
    dropdownEmptyText: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.slateText,
        textAlign: 'center',
        lineHeight: 22,
        paddingVertical: spacing.lg,
    },
    exportGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    exportOption: {
        width: '31%',
        backgroundColor: colors.primaryNavy,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exportEmoji: {
        fontSize: 28,
        marginBottom: spacing.sm,
    },
    exportTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.premiumGold,
        textAlign: 'center',
    },
    calendarHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    calendarArrowButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.primaryNavy,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
    },
    calendarArrowText: {
        fontSize: 30,
        lineHeight: 32,
        fontWeight: '900',
        color: colors.premiumGold,
    },
    calendarMonthTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 19,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: spacing.sm,
    },
    weekText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 11,
        fontWeight: '900',
        color: colors.slateText,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayButton: {
        width: '14.285%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        marginVertical: 2,
    },
    dayButtonSelected: {
        backgroundColor: colors.primaryNavy,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
    },
    dayText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    dayTextSelected: {
        color: colors.premiumGold,
    },
    assignModalBox: {
        backgroundColor: colors.white,
        borderRadius: 26,
        padding: spacing.xl,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        maxHeight: '90%',
    },
    assignModalTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.lg,
    },
    assignScheduleCard: {
        backgroundColor: '#FFFDF2',
        borderRadius: 18,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    assignScheduleTeacher: {
        fontSize: 23,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.sm,
    },
    assignScheduleText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primaryNavy,
        marginBottom: 4,
    },
    replacementTabRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
    },
    replacementTabButton: {
        width: '31%',
        minHeight: 70,
        borderRadius: 16,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        backgroundColor: '#FFFDF2',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xs,
    },
    replacementTabButtonActive: {
        backgroundColor: colors.primaryNavy,
    },
    replacementTabText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
    },
    replacementTabTextActive: {
        color: colors.premiumGold,
    },
    replacementOptionsList: {
        maxHeight: 310,
    },
    replacementOptionCard: {
        backgroundColor: '#FFFDF2',
        borderRadius: 18,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    replacementOptionCardSelected: {
        backgroundColor: '#FFF5D6',
        borderColor: colors.premiumGold,
        borderWidth: 2,
    },
    replacementOptionName: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.xs,
    },
    replacementOptionGroup: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.slateText,
        marginBottom: spacing.sm,
        letterSpacing: 1,
    },
    replacementOptionText: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.primaryNavy,
        marginBottom: 3,
    },
    noReplacementButton: {
        backgroundColor: '#FFFDF2',
        borderRadius: 18,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    noReplacementButtonSelected: {
        backgroundColor: '#FFF8E1',
    },
    noReplacementText: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    assignModalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.md,
    },
    assignCancelButton: {
        width: '48%',
        height: 56,
        borderRadius: 16,
        backgroundColor: '#6B7280',
        alignItems: 'center',
        justifyContent: 'center',
    },
    assignCancelText: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.white,
    },
    assignSaveButton: {
        width: '48%',
        height: 56,
        borderRadius: 16,
        backgroundColor: '#86EFAC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    assignSaveText: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.white,
    },
    replacementCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    replacementStatusBadge: {
        overflow: 'hidden',
        borderRadius: 14,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        fontSize: 12,
        fontWeight: '900',
    },
    replacementAssigned: {
        backgroundColor: '#DCFCE7',
        color: '#166534',
    },
    replacementMissing: {
        backgroundColor: '#FEE2E2',
        color: '#B91C1C',
    },
    detailList: {
        backgroundColor: '#FFFDF2',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EADFAE',
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    detailRow: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#EFE3B8',
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    assignButton: {
        height: 52,
        borderRadius: 16,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        ...shadows.soft,
    },
    assignButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    searchInputRow: {
        minHeight: 58,
        borderRadius: 16,
        borderWidth: 1.2,
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
    },
    disabledSearchBox: {
        opacity: 0.68,
    },
    searchInput: {
        flex: 1,
        minHeight: 58,
        paddingHorizontal: spacing.md,
        fontSize: 15,
        fontWeight: '800',
        color: colors.primaryNavy,
    },
    searchButton: {
        minWidth: 94,
        height: 58,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
    },
    searchButtonText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    studentOptionsBox: {
        backgroundColor: '#FFFDF2',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#EADFAE',
        padding: spacing.sm,
        marginBottom: spacing.md,
    },
    studentOptionCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EADFAE',
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    studentOptionCardSelected: {
        borderColor: colors.premiumGold,
        backgroundColor: '#FFF3C4',
    },
    studentOptionName: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 3,
    },
    studentOptionMeta: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.slateText,
    },
    selectedStudentCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 18,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    selectedStudentLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    selectedStudentName: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 4,
    },
    selectedStudentMeta: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.slateText,
        lineHeight: 19,
    },
    studentDailyCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#EADFAE',
        padding: spacing.md,
        marginTop: spacing.md,
    },
    studentStatusBadge: {
        overflow: 'hidden',
        borderRadius: 14,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        fontSize: 13,
        fontWeight: '900',
        backgroundColor: '#FFFDF2',
        borderWidth: 1,
        borderColor: '#EADFAE',
    },
    closeButton: {
        marginTop: spacing.xl,
        backgroundColor: colors.primaryNavy,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.white,
    },

    teacherInsightDivider: {
        height: 1,
        backgroundColor: 'rgba(11, 31, 58, 0.16)',
        marginVertical: spacing.xl,
    },
    teacherInsightCard: {
        marginTop: spacing.lg,
        backgroundColor: 'rgba(255, 253, 242, 0.92)',
        borderRadius: 24,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#EADFAE',
        ...shadows.medium,
    },
    teacherChipSection: {
        marginTop: spacing.md,
    },
    teacherChipTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.xs,
    },
    teacherChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    teacherChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        backgroundColor: '#FFF7D6',
        borderWidth: 1,
        borderColor: '#E6C85C',
    },
    teacherChipText: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    teacherActionTitle: {
        marginTop: spacing.xl,
        marginBottom: spacing.md,
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    teacherActionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
    },
    teacherActionButton: {
        width: '47%',
        minHeight: 92,
        borderRadius: 20,
        padding: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B1F3A',
        borderWidth: 1,
        borderColor: '#D6B84A',
        ...shadows.medium,
    },
    teacherActionEmoji: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    teacherActionText: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.white,
        textAlign: 'center',
    },
    teacherHistoryCard: {
        marginTop: spacing.xl,
        backgroundColor: 'rgba(255, 253, 242, 0.92)',
        borderRadius: 24,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: '#EADFAE',
        ...shadows.medium,
    },
    teacherHistoryRow: {
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: 18,
        backgroundColor: '#FFFDF2',
        borderWidth: 1,
        borderColor: '#EADFAE',
    },
    teacherHistoryStatus: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.primaryNavy,
        backgroundColor: '#FFF7D6',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        overflow: 'hidden',
    },
    teacherHistoryMeta: {
        marginTop: spacing.sm,
        fontSize: 13,
        fontWeight: '700',
        color: '#4B5563',
    },

});
