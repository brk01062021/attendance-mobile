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
import { router } from 'expo-router';
import { BarChart, LineChart } from 'react-native-chart-kit';

import AnalyticsChartCard from '../components/admin/AnalyticsChartCard';
import AnalyticsKpiCard from '../components/admin/AnalyticsKpiCard';

import { DEV_DEFAULTS } from '../src/services/api';

import {
    fetchAttendanceTrend,
    fetchClassComparison,
    fetchExecutiveAlerts,
    fetchExecutiveOverview,
    fetchPrincipalSummary,
    fetchTeacherWorkload,
    fetchTeacherWorkloadSummary,
    fetchTeacherFatigueAlerts,
} from '../src/services/principalApi';

import type {
    ClassComparison,
    ExecutiveOverview,
    PrincipalSummary,
    RiskAlert,
    TeacherWorkload,
    TeacherWorkloadInsight,
    TeacherFatigueAlert,
    TrendPoint,
} from '../src/types/principal';

const screenWidth = Dimensions.get('window').width;
const chartWidth = Math.max(300, screenWidth - 56);
const DEFAULT_MONTH = DEV_DEFAULTS.analyticsEndDate.slice(0, 7);
const DEFAULT_DATE = DEV_DEFAULTS.dashboardDate;

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
    const [loading, setLoading] = useState(false);

    const monthOptions = useMemo(() => buildMonthOptions(DEFAULT_MONTH), []);

    useEffect(() => {
        loadDashboard();
    }, [selectedMonth]);

    const loadDashboard = async () => {
        setLoading(true);

        try {
            const [summaryData, executiveData, alertsData, trendData, comparisonData, workloadData, dailyWorkloadData, fatigueAlertData] = await Promise.all([
                fetchPrincipalSummary(DEFAULT_DATE),
                fetchExecutiveOverview(selectedMonth),
                fetchExecutiveAlerts(selectedMonth),
                fetchAttendanceTrend(selectedMonth),
                fetchClassComparison(selectedMonth),
                fetchTeacherWorkload(selectedMonth),
                fetchTeacherWorkloadSummary(DEFAULT_DATE),
                fetchTeacherFatigueAlerts(DEFAULT_DATE),
            ]);

            setSummary(summaryData ?? fallbackSummary);
            setExecutive(executiveData ?? fallbackExecutive);
            setRiskAlerts(Array.isArray(alertsData) ? alertsData : []);
            setAttendanceTrend(Array.isArray(trendData) ? trendData : []);
            setClassComparison(Array.isArray(comparisonData) ? comparisonData : []);
            setTeacherWorkload(Array.isArray(workloadData) ? workloadData : []);
            setWorkloadSummary(Array.isArray(dailyWorkloadData) ? dailyWorkloadData : []);
            setFatigueAlerts(Array.isArray(fatigueAlertData) ? fatigueAlertData : []);
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
            source={require('../assets/branding/splash-dark.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.topHeader}>
                    <TouchableOpacity style={styles.circleButton} onPress={() => router.back()} activeOpacity={0.85}>
                        <Text style={styles.circleButtonText}>‹</Text>
                    </TouchableOpacity>

                    <View style={styles.headerTextBox}>
                        <Text style={styles.headerTitle}>School Intelligence</Text>
                        <Text style={styles.headerSubtitle}>Executive risk, workload and comparison center</Text>
                    </View>

                    <TouchableOpacity style={styles.circleButton} onPress={loadDashboard} activeOpacity={0.85}>
                        <Text style={styles.circleButtonText}>↻</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>Day 3 Executive Intelligence</Text>
                    <Text style={styles.heroTitle}>School health, risks and teacher load in one decision screen.</Text>
                    <Text style={styles.heroSubtitle}>
                        Built for principal review: monthly risks, class comparisons, replacement pressure and action-ready alerts.
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

                <View style={styles.kpiGrid}>
                    <AnalyticsKpiCard
                        title="Overall Attendance"
                        value={`${Math.round(executive.overallAttendancePercentage || summary.todayAttendancePercentage)}%`}
                        subtitle="Selected month"
                    />
                    <AnalyticsKpiCard
                        title="Risk Students"
                        value={executive.lowAttendanceRiskStudents || summary.lowAttendanceStudents}
                        subtitle="Below safe threshold"
                    />
                    <AnalyticsKpiCard title="Class Risk" value={executive.classesBelowThreshold} subtitle="Below 75%" />
                    <AnalyticsKpiCard title="Critical Alerts" value={highAlerts + dailyHighFatigue} subtitle="High priority" />
                    <AnalyticsKpiCard
                        title="Teacher Leave Load"
                        value={executive.teachersWithLeaveLoad || summary.teachersOnLeave}
                        subtitle="Needs attention"
                    />
                    <AnalyticsKpiCard
                        title="Replacement Stress"
                        value={executive.replacementStressTeachers || summary.replacementPeriodsToday}
                        subtitle={`Index ${Math.round(executive.replacementStressIndex || 0)}`}
                    />
                    <AnalyticsKpiCard title="Daily Overload" value={uncoveredLoad} subtitle="Teachers ≥ 80 score" />
                    <AnalyticsKpiCard title="Fatigue Alerts" value={fatigueAlerts.length} subtitle="Today workload watch" />
                    <AnalyticsKpiCard title="Top Class" value={executive.topPerformingClass || 'No data'} subtitle="Attendance rank" />
                    <AnalyticsKpiCard title="Weak Section" value={executive.weakestPerformingSection || 'No data'} subtitle="Needs support" />
                </View>


                {fatigueAlerts.length > 0 ? (
                    <View style={styles.actionFocusPanel}>
                        <Text style={styles.focusTitle}>Day 5 Operational Alerts</Text>
                        {fatigueAlerts.slice(0, 3).map((alert) => (
                            <Text key={`${alert.teacherId}-${alert.overloadScore}`} style={styles.focusDescription}>
                                • {alert.teacherName}: {alert.reason} Action: {alert.actionRequired}
                            </Text>
                        ))}
                    </View>
                ) : null}

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
                                    <Text style={styles.actionTitle}>{action.title}</Text>
                                    <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
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
                    </View>
                </View>

                {selectedAction !== 'teacher-workload' ? (
                    <AnalyticsChartCard title="Monthly Attendance Trend">
                        {trendChartData.labels.length > 0 ? (
                            <LineChart
                                data={trendChartData}
                                width={chartWidth}
                                height={220}
                                yAxisSuffix="%"
                                fromZero
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                            />
                        ) : (
                            <Text style={styles.emptyText}>No attendance trend available for this month.</Text>
                        )}
                    </AnalyticsChartCard>
                ) : null}

                {(selectedAction === 'monthly-report' || selectedAction === 'compare-classes') ? (
                    <AnalyticsChartCard title="Class / Section Comparison">
                        {classChartData.labels.length > 0 ? (
                            <BarChart
                                data={classChartData}
                                width={chartWidth}
                                height={230}
                                yAxisLabel=""
                                yAxisSuffix="%"
                                fromZero
                                chartConfig={chartConfig}
                                style={styles.chart}
                                showValuesOnTopOfBars
                            />
                        ) : (
                            <Text style={styles.emptyText}>No class comparison data available.</Text>
                        )}
                    </AnalyticsChartCard>
                ) : null}

                {selectedAction === 'teacher-workload' ? (
                    <View style={styles.focusModuleCard}>
                        <Text style={styles.sectionEyebrow}>Teacher Workload Module</Text>
                        <Text style={styles.sectionTitle}>Teacher Intelligence</Text>
                        <Text style={styles.moduleIntro}>
                            Detailed workload, replacement pressure and priority decisions are shown here only after selecting Teacher Workload.
                        </Text>

                        <AnalyticsChartCard title="Teacher Workload Stress">
                            {workloadChartData.labels.length > 0 ? (
                                <BarChart
                                    data={workloadChartData}
                                    width={chartWidth}
                                    height={230}
                                    yAxisLabel=""
                                    yAxisSuffix=""
                                    fromZero
                                    chartConfig={chartConfig}
                                    style={styles.chart}
                                    showValuesOnTopOfBars
                                />
                            ) : (
                                <Text style={styles.emptyText}>No teacher workload data available.</Text>
                            )}
                        </AnalyticsChartCard>

                        <View style={styles.alertsCardInner}>
                            <View style={styles.sectionHeaderRow}>
                                <View>
                                    <Text style={styles.sectionEyebrow}>Executive Alerts</Text>
                                    <Text style={styles.sectionTitle}>Priority Decisions</Text>
                                </View>
                                <Text style={styles.alertCount}>{riskAlerts.length}</Text>
                            </View>

                            {riskAlerts.length > 0 ? (
                                riskAlerts.map((alert, index) => (
                                    <View key={`${alert.type}-${alert.title}-${index}`} style={styles.alertRow}>
                                        <View style={[styles.alertIconBox, alert.severity === 'HIGH' && styles.alertIconHigh]}>
                                            <Text style={styles.alertIcon}>{alert.severity === 'HIGH' ? '!' : '•'}</Text>
                                        </View>
                                        <View style={styles.alertTextBox}>
                                            <Text style={styles.alertTitle}>{alert.title || alert.type}</Text>
                                            <Text style={styles.alertDescription}>{alert.description}</Text>
                                            <Text style={styles.recommendationText}>{buildRecommendation(alert)}</Text>
                                            <Text style={styles.alertMeta}>
                                                {alert.type} • {alert.severity}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyText}>No major teacher workload alerts for the selected month.</Text>
                            )}
                        </View>

                        <View style={styles.workloadCardInner}>
                            <Text style={styles.sectionEyebrow}>Teacher Intelligence</Text>
                            <Text style={styles.sectionTitle}>Top Workload Attention</Text>
                            {teacherWorkload.slice(0, 5).map((teacher) => (
                                <View key={`${teacher.teacherId}-${teacher.teacherName}`} style={styles.teacherRow}>
                                    <View style={styles.teacherMainText}>
                                        <Text style={styles.teacherName}>{teacher.teacherName || 'Teacher'}</Text>
                                        <Text style={styles.teacherMeta}>
                                            Scheduled {teacher.scheduledPeriods} • Replacement {teacher.replacementPeriods} • Leave{' '}
                                            {teacher.plannedLeaves + teacher.unplannedLeaves}
                                        </Text>
                                    </View>
                                    <View style={styles.scoreBox}>
                                        <Text style={styles.scoreText}>{Math.round(teacher.workloadScore)}</Text>
                                        <Text style={styles.scoreMeta}>{teacher.riskLevel}</Text>
                                    </View>
                                </View>
                            ))}
                            {teacherWorkload.length === 0 ? <Text style={styles.emptyText}>No workload records found.</Text> : null}
                        </View>
                    </View>
                ) : null}
            </ScrollView>
        </ImageBackground>
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
        paddingTop: 54,
        paddingBottom: 36,
    },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    circleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.32)',
    },
    circleButtonText: {
        color: '#FFFFFF',
        fontSize: 25,
        fontWeight: '800',
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
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: 28,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.24)',
        marginBottom: 16,
    },
    heroEyebrow: {
        color: '#F7D782',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    heroTitle: {
        color: '#FFFFFF',
        fontSize: 23,
        fontWeight: '900',
        lineHeight: 30,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
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
        marginBottom: 14,
    },
    actionSectionTitle: {
        color: '#14345A',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 2,
    },
    tapBadge: {
        backgroundColor: '#14345A',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
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
        minHeight: 132,
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
        marginBottom: 10,
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
        lineHeight: 19,
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
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        paddingVertical: 22,
    },
});
