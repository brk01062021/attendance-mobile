import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';

import { DEV_DEFAULTS } from '../src/services/api';

import {
    fetchAttendanceTrend,
    fetchClassComparison,
    fetchExecutiveAlerts,
    fetchExecutiveOverview,
    fetchPrincipalSummary,
    fetchSchoolIntelligenceSnapshot,
    fetchTeacherFatigueAlerts,
    fetchTeacherWorkload,
    fetchTeacherWorkloadSummary,
} from '../src/services/principalApi';

import type { SchoolIntelligenceSnapshot } from '../src/services/principalApi';

import type {
    ClassComparison,
    ExecutiveOverview,
    PrincipalSummary,
    RiskAlert,
    TeacherFatigueAlert,
    TeacherWorkload,
    TeacherWorkloadInsight,
    TrendPoint,
} from '../src/types/principal';

const screenWidth = Dimensions.get('window').width;
const chartWidth = Math.max(300, screenWidth - 56);
const DEFAULT_MONTH = DEV_DEFAULTS.analyticsEndDate.slice(0, 7);
const DEFAULT_DATE = new Date().toISOString().slice(0, 10);

type PrincipalActionKey =
    | 'monthly-report'
    | 'risk-students'
    | 'compare-classes'
    | 'teacher-workload'
    | 'replacement-analytics'
    | 'academic-insights';

type PrincipalAction = {
    key: PrincipalActionKey;
    icon: string;
    title: string;
    subtitle: string;
    badge: string;
    accent: 'blue' | 'red' | 'amber' | 'green';
    focusTitle: string;
    focusDescription: string;
};

const fallbackSummary: PrincipalSummary = {
    totalStudents: 0,
    totalTeachers: 0,
    todayAttendancePercentage: 0,
    studentsAbsentToday: 0,
    teachersOnLeave: 0,
    replacementPeriodsToday: 0,
    lowAttendanceStudents: 0,
    pendingTeacherAttendance: 0,
};

const fallbackExecutive: ExecutiveOverview = {
    overallAttendancePercentage: 0,
    lowAttendanceRiskStudents: 0,
    classesBelowThreshold: 0,
    teachersWithLeaveLoad: 0,
    replacementStressTeachers: 0,
    academicRiskAlerts: 0,
    topPerformingClass: 'No data',
    weakestPerformingSection: 'No data',
    replacementStressIndex: 0,
};

export default function PrincipalDashboardScreen() {
    const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);
    const [selectedAction, setSelectedAction] = useState<PrincipalActionKey>('monthly-report');
    const [summary, setSummary] = useState<PrincipalSummary>(fallbackSummary);
    const [executive, setExecutive] = useState<ExecutiveOverview>(fallbackExecutive);
    const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
    const [attendanceTrend, setAttendanceTrend] = useState<TrendPoint[]>([]);
    const [classComparison, setClassComparison] = useState<ClassComparison[]>([]);
    const [teacherWorkload, setTeacherWorkload] = useState<TeacherWorkload[]>([]);
    const [workloadSummary, setWorkloadSummary] = useState<TeacherWorkloadInsight[]>([]);
    const [fatigueAlerts, setFatigueAlerts] = useState<TeacherFatigueAlert[]>([]);
    const [schoolIntelligence, setSchoolIntelligence] = useState<SchoolIntelligenceSnapshot | null>(null);
    const [loading, setLoading] = useState(false);

    const monthOptions = useMemo(() => buildMonthOptions(DEFAULT_MONTH), []);

    useEffect(() => {
        loadDashboard();
    }, [selectedMonth]);

    const loadDashboard = async () => {
        setLoading(true);

        try {
            const [summaryData, executiveData, alertsData, trendData, comparisonData, workloadData, dailyWorkloadData, fatigueAlertData, intelligenceData] = await Promise.all([
                fetchPrincipalSummary(DEFAULT_DATE),
                fetchExecutiveOverview(selectedMonth),
                fetchExecutiveAlerts(selectedMonth),
                fetchAttendanceTrend(selectedMonth),
                fetchClassComparison(selectedMonth),
                fetchTeacherWorkload(selectedMonth),
                fetchTeacherWorkloadSummary(DEFAULT_DATE),
                fetchTeacherFatigueAlerts(DEFAULT_DATE),
                fetchSchoolIntelligenceSnapshot(DEFAULT_DATE),
            ]);

            setSummary(summaryData ?? fallbackSummary);
            setExecutive(executiveData ?? fallbackExecutive);
            setRiskAlerts(Array.isArray(alertsData) ? alertsData : []);
            setAttendanceTrend(Array.isArray(trendData) ? trendData : []);
            setClassComparison(Array.isArray(comparisonData) ? comparisonData : []);
            setTeacherWorkload(Array.isArray(workloadData) ? workloadData : []);
            setWorkloadSummary(Array.isArray(dailyWorkloadData) ? dailyWorkloadData : []);
            setFatigueAlerts(Array.isArray(fatigueAlertData) ? fatigueAlertData : []);
            setSchoolIntelligence(intelligenceData ?? null);
        } finally {
            setLoading(false);
        }
    };

    const highAlerts = riskAlerts.filter((alert) => alert.severity === 'HIGH').length;
    const mediumAlerts = riskAlerts.filter((alert) => alert.severity === 'MEDIUM').length;
    const overloadedTeachers = teacherWorkload.filter((teacher) => String(teacher.riskLevel).toUpperCase() === 'HIGH').length;
    const replacementTeachers = teacherWorkload.filter((teacher) => Number(teacher.replacementPeriods ?? 0) > 0).length;
    const dailyHighFatigue = fatigueAlerts.filter((alert) => String(alert.severity).toUpperCase() === 'HIGH').length;
    const uncoveredLoad = workloadSummary.filter((teacher) => Number(teacher.overloadScore ?? 0) >= 80).length;
    const replacementCoveragePercent = summary.replacementPeriodsToday > 0
        ? Math.max(0, Math.min(100, 100 - Math.round((executive.replacementStressTeachers / Math.max(summary.replacementPeriodsToday, 1)) * 100)))
        : 100;
    const schoolHealthScore = calculateSchoolHealthScore({
        attendancePercentage: executive.overallAttendancePercentage || summary.todayAttendancePercentage,
        replacementCoveragePercent,
        highAlerts: highAlerts + dailyHighFatigue,
        overloadedTeachers: uncoveredLoad,
        riskStudents: executive.lowAttendanceRiskStudents || summary.lowAttendanceStudents,
    });
    const operationalAlerts = buildOperationalAlerts({
        summary,
        executive,
        highAlerts,
        dailyHighFatigue,
        fatigueAlerts,
        workloadSummary,
        replacementCoveragePercent,
    });

    const principalActions = useMemo<PrincipalAction[]>(
        () => [
            {
                key: 'monthly-report',
                icon: '📊',
                title: 'Monthly Report',
                subtitle: 'School summary',
                badge: selectedMonth,
                accent: 'blue',
                focusTitle: 'Monthly executive report selected',
                focusDescription: 'Use this view to review attendance, risks, class comparison, teacher load and replacement pressure for the selected academic month.',
            },
            {
                key: 'risk-students',
                icon: '⚠️',
                title: 'Risk Students',
                subtitle: 'Below threshold',
                badge: `${executive.lowAttendanceRiskStudents || summary.lowAttendanceStudents || 0}`,
                accent: 'red',
                focusTitle: 'Risk student review selected',
                focusDescription: 'Prioritize students below safe attendance or academic thresholds. This action will later open the full risk-student drilldown screen.',
            },
            {
                key: 'compare-classes',
                icon: '📈',
                title: 'Compare Classes',
                subtitle: 'Class / section trend',
                badge: `${classComparison.length || 0}`,
                accent: 'green',
                focusTitle: 'Class comparison selected',
                focusDescription: 'Review top and weak sections using the class comparison chart below. This is where principal can compare multiple classes and sections.',
            },
            {
                key: 'teacher-workload',
                icon: '🧑‍🏫',
                title: 'Teacher Workload',
                subtitle: 'Overload signals',
                badge: `${overloadedTeachers}`,
                accent: 'amber',
                focusTitle: 'Teacher workload selected',
                focusDescription: 'Review high-load teachers, scheduled periods, leave pressure and replacement burden before approving new leave or timetable changes.',
            },
            {
                key: 'replacement-analytics',
                icon: '🔁',
                title: 'Replacements',
                subtitle: 'Coverage stress',
                badge: `${replacementTeachers || executive.replacementStressTeachers || 0}`,
                accent: 'amber',
                focusTitle: 'Replacement analytics selected',
                focusDescription: 'Track replacement dependency, coverage stress and teachers repeatedly used as substitutes for the selected month.',
            },
            {
                key: 'academic-insights',
                icon: '🧠',
                title: 'Academic Insights',
                subtitle: 'Priority decisions',
                badge: `${highAlerts + mediumAlerts}`,
                accent: 'blue',
                focusTitle: 'Academic insights selected',
                focusDescription: 'Use executive alerts and trends to identify classes, sections, teachers and students needing principal action.',
            },
        ],
        [
            selectedMonth,
            executive.lowAttendanceRiskStudents,
            executive.replacementStressTeachers,
            summary.lowAttendanceStudents,
            classComparison.length,
            overloadedTeachers,
            replacementTeachers,
            highAlerts,
            mediumAlerts,
        ]
    );

    const activeAction = principalActions.find((action) => action.key === selectedAction) ?? principalActions[0];

    const trendChartData = useMemo(() => {
        const validTrend = attendanceTrend.filter((item) => Number(item.totalCount ?? 0) > 0 || Number(item.attendancePercentage ?? 0) > 0);
        const compactTrend = validTrend.filter((_, index) => index % 3 === 0).slice(0, 10);
        return {
            labels: compactTrend.map((item) => formatTrendLabel(item.label)),
            datasets: [{ data: compactTrend.map((item) => clampPercent(Number(item.attendancePercentage ?? 0))) }],
        };
    }, [attendanceTrend]);

    const classChartData = useMemo(() => {
        const topClasses = [...classComparison]
            .filter((item) => Number(item.totalMarked ?? 0) > 0 || Number(item.attendancePercentage ?? 0) > 0)
            .sort((a, b) => Number(b.attendancePercentage ?? 0) - Number(a.attendancePercentage ?? 0))
            .slice(0, 6);
        return {
            labels: topClasses.map((item) => `${item.className}${item.section}`),
            datasets: [{ data: topClasses.map((item) => clampPercent(Number(item.attendancePercentage ?? 0))) }],
        };
    }, [classComparison]);

    const workloadChartData = useMemo(() => {
        const topTeachers = [...teacherWorkload]
            .sort((a, b) => Number(b.workloadScore ?? 0) - Number(a.workloadScore ?? 0))
            .slice(0, 5);
        return {
            labels: topTeachers.map((item) => compactName(item.teacherName)),
            datasets: [{ data: topTeachers.map((item) => Math.max(0, Number(item.workloadScore ?? 0))) }],
        };
    }, [teacherWorkload]);

    return (
        <ImageBackground
            source={require('../assets/branding/splash-gold.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <MobileWorkflowHeader
                    title="School Intelligence"
                    eyebrow="SCHOOL INTELLIGENCE"
                    subtitle="Executive risk, workload and comparison center"
                    rightAction="refresh"
                    onRightPress={loadDashboard}
                />

                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>School Intelligence</Text>
                    <Text style={styles.heroTitle}>School health, attendance risk and teacher workload in one operational screen.</Text>
                    <Text style={styles.heroSubtitle}>
                        Use this screen for daily Principal review: attendance, workload, risk alerts and drilldown decisions.
                    </Text>
                </View>

                <View style={styles.monthCard}>
                    <Text style={styles.sectionEyebrow}>Academic Month</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthRow}>
                        {monthOptions.map((month) => (
                            <TouchableOpacity
                                key={month}
                                style={[styles.monthPill, selectedMonth === month && styles.monthPillActive]}
                                onPress={() => setSelectedMonth(month)}
                                activeOpacity={0.85}
                            >
                                <Text style={[styles.monthPillText, selectedMonth === month && styles.monthPillTextActive]}>
                                    {month}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {loading ? (
                    <View style={styles.loadingCard}>
                        <ActivityIndicator />
                        <Text style={styles.loadingText}>Loading executive intelligence...</Text>
                    </View>
                ) : null}

                {schoolIntelligence ? <SchoolIntelligenceLiveCard snapshot={schoolIntelligence} /> : null}

                <View style={styles.actionCard}>
                    <View style={styles.sectionHeaderRowCompact}>
                        <View>
                            <Text style={styles.sectionEyebrow}>Principal Quick Actions</Text>
                            <Text style={styles.actionSectionTitle}>Tap an action to focus the dashboard</Text>
                        </View>
                        <View style={styles.tapBadge}>
                            <Text style={styles.tapBadgeText}>LIVE</Text>
                        </View>
                    </View>

                    <View style={styles.actionGrid}>
                        {principalActions.map((action) => {
                            const isActive = selectedAction === action.key;
                            return (
                                <TouchableOpacity
                                    key={action.key}
                                    style={[
                                        styles.actionTile,
                                        getActionTileStyle(action.accent),
                                        isActive && styles.actionTileActive,
                                    ]}
                                    activeOpacity={0.82}
                                    onPress={() => setSelectedAction(action.key)}
                                >
                                    <View style={styles.actionTopRow}>
                                        <Text style={styles.actionIcon}>{action.icon}</Text>
                                        <View style={[styles.actionBadge, getActionBadgeStyle(action.accent)]}>
                                            <Text style={styles.actionBadgeText}>{action.badge}</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.actionTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>{action.title}</Text>
                                    <Text style={styles.actionSubtitle} numberOfLines={2}>{action.subtitle}</Text>
                                    <View style={styles.actionFooterRow}>
                                        <Text style={styles.actionViewText}>{isActive ? 'Selected' : 'View'}</Text>
                                        <Text style={styles.actionArrow}>›</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={styles.actionFocusPanel}>
                        <Text style={styles.focusTitle}>{activeAction.focusTitle}</Text>
                        <Text style={styles.focusDescription}>{activeAction.focusDescription}</Text>
                        <TouchableOpacity
                            style={styles.drilldownButton}
                            onPress={() => openPrincipalDrilldown(activeAction.key)}
                            activeOpacity={0.88}
                        >
                            <Text style={styles.drilldownButtonText}>Open Drilldown</Text>
                            <Text style={styles.drilldownButtonArrow}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </ImageBackground>
    );
}



function SchoolIntelligenceLiveCard({ snapshot }: { snapshot: SchoolIntelligenceSnapshot }) {
    const metrics = [
        { label: 'Workspace', value: snapshot.activationStatus || 'ACTIVE', helper: `Readiness ${Math.round(snapshot.readinessPercent || 0)}%` },
        { label: 'Students', value: snapshot.totalStudents || '—', helper: `Present ${snapshot.presentStudents || 0} • Absent ${snapshot.absentStudents || 0}` },
        { label: 'Teachers', value: snapshot.totalTeachers || '—', helper: 'From principal summary or active timetable' },
        { label: 'Timetable', value: snapshot.timetableLive ? 'LIVE' : 'NO', helper: `${snapshot.totalPeriodAllocations || 0} period allocations` },
        { label: 'Batch', value: snapshot.timetableBatchId || '—', helper: `${snapshot.totalClasses || 0} classes / ${snapshot.totalSections || 0} sections` },
        { label: 'Activities', value: snapshot.publishedActivities || 0, helper: `${snapshot.pendingActivities || 0} pending approvals` },
        { label: 'Workbook', value: snapshot.workbookStatus || 'WAIT', helper: snapshot.latestWorkbookRows ? `${snapshot.latestWorkbookRows} committed rows` : 'Commit gate' },
        { label: 'Attendance', value: `${Math.round(snapshot.attendancePercentage || 0)}%`, helper: 'Whole-school current day signal' },
    ];

    return (
        <View style={styles.liveIntelligenceCard}>
            <View style={styles.liveHeaderRow}>
                <View style={styles.liveHeaderTextWrap}>
                    <Text style={styles.sectionEyebrow}>Live School Intelligence</Text>
                    <Text style={styles.sectionTitle}>Principal/Admin Command Center</Text>
                </View>
                <View style={styles.liveBadgeSafe}><Text style={styles.liveBadgeSafeText}>LIVE</Text></View>
            </View>
            <Text style={styles.liveIntro}>Same operational data used by the web command center.</Text>
            <View style={styles.liveMetricGrid}>
                {metrics.map((metric) => (
                    <View key={metric.label} style={styles.liveMetricTile}>
                        <Text style={styles.liveMetricLabel}>{metric.label}</Text>
                        <Text style={styles.liveMetricValue} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>{metric.value}</Text>
                        <Text style={styles.liveMetricHelper}>{metric.helper}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.liveAlertsBox}>
                <Text style={styles.liveAlertsTitle}>Operational Alerts</Text>
                {snapshot.alerts.slice(0, 3).map((alert) => (
                    <View key={alert.title} style={styles.liveAlertRow}>
                        <Text style={styles.liveAlertPill}>{alert.tone === 'success' ? 'HEALTHY' : alert.tone === 'warning' ? 'REVIEW' : 'ACTION'}</Text>
                        <View style={styles.liveAlertTextWrap}>
                            <Text style={styles.liveAlertTitle}>{alert.title}</Text>
                            <Text style={styles.liveAlertMessage}>{alert.message}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
}

type SchoolHealthInput = {
    attendancePercentage: number;
    replacementCoveragePercent: number;
    highAlerts: number;
    overloadedTeachers: number;
    riskStudents: number;
};

function calculateSchoolHealthScore(input: SchoolHealthInput) {
    const attendanceScore = Math.max(0, Math.min(100, Number(input.attendancePercentage || 0)));
    const coverageScore = Math.max(0, Math.min(100, Number(input.replacementCoveragePercent || 0)));
    const alertPenalty = Math.min(18, Number(input.highAlerts || 0) * 4);
    const overloadPenalty = Math.min(16, Number(input.overloadedTeachers || 0) * 3);
    const studentRiskPenalty = Math.min(18, Number(input.riskStudents || 0) * 1.5);
    return Math.max(0, Math.min(100, Math.round((attendanceScore * 0.45) + (coverageScore * 0.35) + 20 - alertPenalty - overloadPenalty - studentRiskPenalty)));
}

function getHealthLabel(score: number) {
    if (score >= 85) return 'Healthy Operations';
    if (score >= 70) return 'Stable With Watch Areas';
    if (score >= 55) return 'Needs Principal Review';
    return 'Critical Attention Needed';
}

type OperationalAlert = {
    icon: string;
    title: string;
    description: string;
    action: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
};

function buildOperationalAlerts({
                                    summary,
                                    executive,
                                    highAlerts,
                                    dailyHighFatigue,
                                    fatigueAlerts,
                                    workloadSummary,
                                    replacementCoveragePercent,
                                }: {
    summary: PrincipalSummary;
    executive: ExecutiveOverview;
    highAlerts: number;
    dailyHighFatigue: number;
    fatigueAlerts: TeacherFatigueAlert[];
    workloadSummary: TeacherWorkloadInsight[];
    replacementCoveragePercent: number;
}): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];
    const riskStudents = executive.lowAttendanceRiskStudents || summary.lowAttendanceStudents || 0;
    const overloadTeachers = workloadSummary.filter((teacher) => Number(teacher.overloadScore ?? 0) >= 80).length;

    if (summary.pendingTeacherAttendance > 0) {
        alerts.push({
            icon: '📝',
            title: 'Pending Attendance Submission',
            description: `${summary.pendingTeacherAttendance} teacher attendance submissions need follow-up.`,
            action: 'Action: open Admin Reports and follow up with pending teachers.',
            severity: 'MEDIUM',
        });
    }

    if (replacementCoveragePercent < 80 || executive.replacementStressTeachers > 0) {
        alerts.push({
            icon: '🔁',
            title: 'Replacement Coverage Pressure',
            description: `${executive.replacementStressTeachers || 0} teachers are showing replacement stress.`,
            action: 'Action: review replacement coverage before approving more leave.',
            severity: replacementCoveragePercent < 65 ? 'HIGH' : 'MEDIUM',
        });
    }

    if (overloadTeachers > 0 || dailyHighFatigue > 0) {
        alerts.push({
            icon: '⚖️',
            title: 'Teacher Fatigue Risk',
            description: `${Math.max(overloadTeachers, dailyHighFatigue)} teacher(s) have high workload or fatigue signals today.`,
            action: 'Action: avoid assigning extra periods to high-fatigue teachers.',
            severity: 'HIGH',
        });
    }

    if (riskStudents > 0) {
        alerts.push({
            icon: '🚨',
            title: 'Student Attendance Risk',
            description: `${riskStudents} student(s) are below safe attendance threshold.`,
            action: 'Action: ask class teachers to start parent follow-up.',
            severity: riskStudents > 10 ? 'HIGH' : 'MEDIUM',
        });
    }

    if (highAlerts > 0) {
        alerts.push({
            icon: '📌',
            title: 'Executive Alerts Need Review',
            description: `${highAlerts} high-priority executive alert(s) were found for the selected month.`,
            action: 'Action: review the selected action focus panel and monthly alerts.',
            severity: 'HIGH',
        });
    }

    if (alerts.length === 0 && fatigueAlerts.length > 0) {
        alerts.push({
            icon: '👀',
            title: 'Workload Watch Active',
            description: `${fatigueAlerts.length} teacher workload watch item(s) found.`,
            action: 'Action: monitor today before assigning replacements.',
            severity: 'LOW',
        });
    }

    return alerts.slice(0, 5);
}

function openPrincipalDrilldown(key: PrincipalActionKey) {
    switch (key) {
        case 'risk-students':
            router.push('/student-risk-dashboard' as any);
            break;
        case 'compare-classes':
            router.push('/class-wise-attendance' as any);
            break;
        case 'teacher-workload':
            router.push('/teacher-workload-protection' as any);
            break;
        case 'replacement-analytics':
            router.push('/admin-teacher-dashboard' as any);
            break;
        case 'monthly-report':
        case 'academic-insights':
        default:
            router.push('/attendance-report' as any);
            break;
    }
}

function HealthMetric({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.healthMetricCard}>
            <Text style={styles.healthMetricValue}>{value}</Text>
            <Text style={styles.healthMetricLabel}>{label}</Text>
        </View>
    );
}


function getActionTileStyle(accent: PrincipalAction['accent']) {
    switch (accent) {
        case 'red':
            return styles.actionTileRed;
        case 'amber':
            return styles.actionTileAmber;
        case 'green':
            return styles.actionTileGreen;
        case 'blue':
        default:
            return styles.actionTileBlue;
    }
}

function getActionBadgeStyle(accent: PrincipalAction['accent']) {
    switch (accent) {
        case 'red':
            return styles.actionBadgeRed;
        case 'amber':
            return styles.actionBadgeAmber;
        case 'green':
            return styles.actionBadgeGreen;
        case 'blue':
        default:
            return styles.actionBadgeBlue;
    }
}

function buildMonthOptions(defaultMonth: string) {
    const [year, month] = defaultMonth.split('-').map(Number);
    const base = new Date(year, month - 1, 1);

    return [0, -1, -2, -3, -4, -5].map((offset) => {
        const date = new Date(base);
        date.setMonth(base.getMonth() + offset);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
}

function compactName(name: string) {
    const parts = String(name || 'Teacher').trim().split(/\s+/);
    return parts.length > 1 ? `${parts[0]} ${parts[1][0]}` : parts[0].slice(0, 6);
}

function formatTrendLabel(label: string) {
    const safeLabel = String(label || '');
    return safeLabel.includes('-') ? safeLabel.slice(5) : safeLabel.slice(0, 5);
}

function clampPercent(value: number) {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.max(0, Math.min(100, value));
}


function buildRecommendation(alert: RiskAlert) {
    const type = String(alert.type || '').toUpperCase();
    if (type.includes('TEACHER') || type.includes('WORKLOAD')) {
        return 'Recommended: review timetable load and avoid assigning additional replacement periods.';
    }
    if (type.includes('ATTENDANCE') || type.includes('STUDENT')) {
        return 'Recommended: schedule class teacher follow-up and parent visibility for repeated absence.';
    }
    if (type.includes('REPLACEMENT')) {
        return 'Recommended: distribute replacement periods across more eligible teachers.';
    }
    return 'Recommended: principal review required before next weekly planning cycle.';
}

const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(20, 52, 90, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
    propsForDots: {
        r: '5',
        strokeWidth: '2',
        stroke: '#D6A84F',
    },
    propsForBackgroundLines: {
        strokeDasharray: '4 6',
    },
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        paddingHorizontal: 18,
        paddingTop: 72,
        paddingBottom: 44,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    circleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.78)',
    },
    circleButtonText: {
        color: '#FFFFFF',
        fontSize: 28,
        lineHeight: 30,
        marginTop: -2,
        fontWeight: '900',
    },
    headerTextBox: {
        flex: 1,
        marginHorizontal: 14,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 3,
        textAlign: 'center',
    },
    heroCard: {
        backgroundColor: 'rgba(255,248,225,0.94)',
        borderRadius: 28,
        padding: 20,
        borderWidth: 1.4,
        borderColor: 'rgba(216, 181, 72, 0.55)',
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 14,
        elevation: 5,
    },
    heroEyebrow: {
        color: '#A06F00',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    heroTitle: {
        color: '#061B33',
        fontSize: 23,
        fontWeight: '900',
        lineHeight: 29,
    },
    heroSubtitle: {
        color: 'rgba(6,27,51,0.70)',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 21,
        marginTop: 10,
    },
    monthCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 16,
    },
    monthRow: {
        paddingTop: 10,
        gap: 10,
    },
    monthPill: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: '#FFF7E6',
        borderWidth: 1,
        borderColor: '#F1D48A',
        marginRight: 10,
    },
    monthPillActive: {
        backgroundColor: '#14345A',
        borderColor: '#14345A',
    },
    monthPillText: {
        color: '#92400E',
        fontSize: 13,
        fontWeight: '900',
    },
    monthPillTextActive: {
        color: '#FFFFFF',
    },
    loadingCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        marginBottom: 16,
    },
    loadingText: {
        marginTop: 8,
        color: '#14345A',
        fontWeight: '700',
    },
    liveIntelligenceCard: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 28,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#F1D48A',
    },
    liveHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        rowGap: 8,
        marginBottom: 8,
    },
    liveHeaderTextWrap: {
        flex: 1,
        minWidth: 210,
        paddingRight: 8,
    },
    liveBadgeSafe: {
        backgroundColor: '#14345A',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        alignSelf: 'flex-start',
    },
    liveBadgeSafeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    liveIntro: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '800',
        lineHeight: 18,
        marginBottom: 12,
    },
    liveMetricGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    liveMetricTile: {
        width: '48%',
        minHeight: 98,
        borderRadius: 18,
        padding: 12,
        marginBottom: 10,
        backgroundColor: '#08131F',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.35)',
    },
    liveMetricLabel: {
        color: '#D4AF37',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1.1,
        textTransform: 'uppercase',
    },
    liveMetricValue: {
        color: '#FFF8DB',
        fontSize: 22,
        fontWeight: '900',
        lineHeight: 27,
        marginTop: 6,
    },
    liveMetricHelper: {
        color: 'rgba(248,243,223,0.72)',
        fontSize: 10,
        fontWeight: '800',
        lineHeight: 14,
        marginTop: 4,
    },
    liveAlertsBox: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1D48A',
        backgroundColor: '#FFF7E6',
        padding: 12,
        marginTop: 4,
    },
    liveAlertsTitle: {
        color: '#14345A',
        fontSize: 14,
        fontWeight: '900',
        marginBottom: 8,
    },
    liveAlertRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 7,
        borderTopWidth: 1,
        borderTopColor: 'rgba(212,175,55,0.28)',
    },
    liveAlertPill: {
        overflow: 'hidden',
        borderRadius: 999,
        backgroundColor: '#166534',
        color: '#FFFFFF',
        fontSize: 8,
        fontWeight: '900',
        paddingHorizontal: 7,
        paddingVertical: 4,
        minWidth: 54,
        textAlign: 'center',
    },
    liveAlertTextWrap: {
        flex: 1,
    },
    liveAlertTitle: {
        color: '#14345A',
        fontSize: 12,
        fontWeight: '900',
    },
    liveAlertMessage: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '700',
        lineHeight: 15,
        marginTop: 2,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    actionCard: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 28,
        padding: 16,
        marginBottom: 18,
    },
    sectionHeaderRowCompact: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 14,
        rowGap: 8,
        columnGap: 8,
    },
    actionSectionTitle: {
        color: '#14345A',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 2,
        maxWidth: 245,
        lineHeight: 23,
    },
    tapBadge: {
        backgroundColor: '#14345A',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        alignSelf: 'flex-start',
        marginLeft: 8,
    },
    tapBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionTile: {
        width: '48%',
        minHeight: 146,
        borderRadius: 22,
        padding: 13,
        marginBottom: 12,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    actionTileActive: {
        borderColor: '#14345A',
        backgroundColor: '#FFFFFF',
        transform: [{ scale: 1.01 }],
    },
    actionTileBlue: {
        borderColor: '#BFDBFE',
    },
    actionTileRed: {
        borderColor: '#FECACA',
    },
    actionTileAmber: {
        borderColor: '#FDE68A',
    },
    actionTileGreen: {
        borderColor: '#BBF7D0',
    },
    actionTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 6,
        minHeight: 34,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionBadge: {
        minWidth: 34,
        maxWidth: 76,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 5,
        alignItems: 'center',
    },
    actionBadgeBlue: {
        backgroundColor: '#14345A',
    },
    actionBadgeRed: {
        backgroundColor: '#B91C1C',
    },
    actionBadgeAmber: {
        backgroundColor: '#92400E',
    },
    actionBadgeGreen: {
        backgroundColor: '#166534',
    },
    actionBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '900',
    },
    actionTitle: {
        color: '#14345A',
        fontSize: 15,
        fontWeight: '900',
        lineHeight: 20,
        flexShrink: 1,
        includeFontPadding: false,
    },
    actionSubtitle: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '800',
        marginTop: 4,
        lineHeight: 15,
    },
    actionFooterRow: {
        marginTop: 'auto',
        paddingTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    actionViewText: {
        color: '#92400E',
        fontSize: 11,
        fontWeight: '900',
    },
    actionArrow: {
        color: '#14345A',
        fontSize: 20,
        fontWeight: '900',
    },
    actionFocusPanel: {
        marginTop: 2,
        backgroundColor: '#FFF7E6',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F1D48A',
    },
    focusTitle: {
        color: '#14345A',
        fontSize: 14,
        fontWeight: '900',
    },
    focusDescription: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 17,
        marginTop: 5,
    },
    focusModuleCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 28,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: 'rgba(241,212,138,0.75)',
    },
    moduleIntro: {
        color: '#475569',
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 18,
        marginTop: 6,
        marginBottom: 14,
    },
    alertsCardInner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    workloadCardInner: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    chart: {
        borderRadius: 18,
    },
    alertsCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 26,
        padding: 18,
        marginTop: 2,
        marginBottom: 18,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    sectionEyebrow: {
        color: '#92400E',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    sectionTitle: {
        color: '#14345A',
        fontSize: 20,
        fontWeight: '900',
        marginTop: 2,
    },
    alertCount: {
        minWidth: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#14345A',
        color: '#FFFFFF',
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 16,
        fontWeight: '900',
        overflow: 'hidden',
        paddingTop: 7,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginBottom: 10,
    },
    alertIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#92400E',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    alertIconHigh: {
        backgroundColor: '#B91C1C',
    },
    alertIcon: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    alertTextBox: {
        flex: 1,
    },
    alertTitle: {
        color: '#14345A',
        fontSize: 15,
        fontWeight: '900',
    },
    alertDescription: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
        marginTop: 3,
    },
    recommendationText: {
        color: '#14345A',
        fontSize: 12,
        fontWeight: '800',
        lineHeight: 17,
        marginTop: 8,
    },
    alertMeta: {
        color: '#92400E',
        fontSize: 11,
        fontWeight: '900',
        marginTop: 6,
    },
    workloadCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 26,
        padding: 18,
    },
    teacherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        padding: 14,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    teacherMainText: {
        flex: 1,
        marginRight: 12,
    },
    teacherName: {
        color: '#14345A',
        fontSize: 15,
        fontWeight: '900',
    },
    teacherMeta: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '700',
        marginTop: 4,
        lineHeight: 17,
    },
    scoreBox: {
        minWidth: 58,
        borderRadius: 16,
        backgroundColor: '#14345A',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    scoreText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },
    scoreMeta: {
        color: '#F7D782',
        fontSize: 10,
        fontWeight: '900',
        marginTop: 2,
    },
    healthCard: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 28,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(241,212,138,0.75)',
    },
    healthHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    healthScoreCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#14345A',
        borderWidth: 2,
        borderColor: '#D6A84F',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    healthScoreValue: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '900',
    },
    healthScoreLabel: {
        color: '#F7D782',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    healthTextBox: {
        flex: 1,
    },
    healthTitle: {
        color: '#14345A',
        fontSize: 21,
        fontWeight: '900',
        marginTop: 3,
    },
    healthSubtitle: {
        color: '#475569',
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 19,
        marginTop: 6,
    },
    healthMetricGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 16,
    },
    healthMetricCard: {
        width: '48%',
        backgroundColor: '#FFF7E6',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F1D48A',
        padding: 13,
        marginBottom: 10,
    },
    healthMetricValue: {
        color: '#14345A',
        fontSize: 22,
        fontWeight: '900',
    },
    healthMetricLabel: {
        color: '#92400E',
        fontSize: 11,
        fontWeight: '900',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    operationalAlertsCard: {
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 28,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(241,212,138,0.75)',
    },
    operationalAlertRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginBottom: 10,
    },
    operationalAlertIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#92400E',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    operationalAlertHigh: {
        backgroundColor: '#B91C1C',
    },
    operationalAlertIcon: {
        fontSize: 17,
    },
    drilldownButton: {
        backgroundColor: '#14345A',
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    drilldownButtonText: {
        color: '#F7D782',
        fontSize: 13,
        fontWeight: '900',
    },
    drilldownButtonArrow: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
    },
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        paddingVertical: 22,
    },
});
