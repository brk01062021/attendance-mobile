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
} from '../src/services/principalApi';

import type {
    ClassComparison,
    ExecutiveOverview,
    PrincipalSummary,
    RiskAlert,
    TeacherWorkload,
    TrendPoint,
} from '../src/types/principal';

const screenWidth = Dimensions.get('window').width;
const chartWidth = Math.max(300, screenWidth - 56);
const DEFAULT_MONTH = DEV_DEFAULTS.analyticsEndDate.slice(0, 7);
const DEFAULT_DATE = DEV_DEFAULTS.dashboardDate;

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
    const [summary, setSummary] = useState<PrincipalSummary>(fallbackSummary);
    const [executive, setExecutive] = useState<ExecutiveOverview>(fallbackExecutive);
    const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
    const [attendanceTrend, setAttendanceTrend] = useState<TrendPoint[]>([]);
    const [classComparison, setClassComparison] = useState<ClassComparison[]>([]);
    const [teacherWorkload, setTeacherWorkload] = useState<TeacherWorkload[]>([]);
    const [loading, setLoading] = useState(false);

    const monthOptions = useMemo(() => buildMonthOptions(DEFAULT_MONTH), []);

    useEffect(() => {
        loadDashboard();
    }, [selectedMonth]);

    const loadDashboard = async () => {
        setLoading(true);

        try {
            const [summaryData, executiveData, alertsData, trendData, comparisonData, workloadData] = await Promise.all([
                fetchPrincipalSummary(DEFAULT_DATE),
                fetchExecutiveOverview(selectedMonth),
                fetchExecutiveAlerts(selectedMonth),
                fetchAttendanceTrend(selectedMonth),
                fetchClassComparison(selectedMonth),
                fetchTeacherWorkload(selectedMonth),
            ]);

            setSummary(summaryData ?? fallbackSummary);
            setExecutive(executiveData ?? fallbackExecutive);
            setRiskAlerts(Array.isArray(alertsData) ? alertsData : []);
            setAttendanceTrend(Array.isArray(trendData) ? trendData : []);
            setClassComparison(Array.isArray(comparisonData) ? comparisonData : []);
            setTeacherWorkload(Array.isArray(workloadData) ? workloadData : []);
        } finally {
            setLoading(false);
        }
    };

    const trendChartData = useMemo(() => {
        const compactTrend = attendanceTrend.filter((_, index) => index % 3 === 0).slice(0, 10);
        return {
            labels: compactTrend.map((item) => String(item.label ?? '').slice(5)),
            datasets: [{ data: compactTrend.map((item) => Number(item.attendancePercentage ?? 0)) }],
        };
    }, [attendanceTrend]);

    const classChartData = useMemo(() => {
        const topClasses = [...classComparison]
            .sort((a, b) => Number(b.attendancePercentage ?? 0) - Number(a.attendancePercentage ?? 0))
            .slice(0, 6);
        return {
            labels: topClasses.map((item) => `${item.className}${item.section}`),
            datasets: [{ data: topClasses.map((item) => Number(item.attendancePercentage ?? 0)) }],
        };
    }, [classComparison]);

    const workloadChartData = useMemo(() => {
        const topTeachers = [...teacherWorkload].slice(0, 6);
        return {
            labels: topTeachers.map((item) => compactName(item.teacherName)),
            datasets: [{ data: topTeachers.map((item) => Number(item.workloadScore ?? 0)) }],
        };
    }, [teacherWorkload]);

    const criticalAlerts = riskAlerts.filter((alert) => alert.severity === 'HIGH').length;

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
                    <AnalyticsKpiCard title="Critical Alerts" value={criticalAlerts} subtitle="High priority" />
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
                    <AnalyticsKpiCard title="Top Class" value={executive.topPerformingClass || 'No data'} subtitle="Attendance rank" />
                    <AnalyticsKpiCard title="Weak Section" value={executive.weakestPerformingSection || 'No data'} subtitle="Needs support" />
                </View>

                <View style={styles.actionCard}>
                    <Text style={styles.sectionEyebrow}>Principal Quick Actions</Text>
                    <View style={styles.actionGrid}>
                        {['Monthly Report', 'Risk Students', 'Compare Classes', 'Teacher Workload', 'Replacement Analytics', 'Academic Insights'].map((item) => (
                            <TouchableOpacity key={item} style={styles.actionPill} activeOpacity={0.86}>
                                <Text style={styles.actionText}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

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

                <View style={styles.alertsCard}>
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
                                    <Text style={styles.alertMeta}>
                                        {alert.type} • {alert.severity}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No major executive alerts for the selected month.</Text>
                    )}
                </View>

                <View style={styles.workloadCard}>
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
            </ScrollView>
        </ImageBackground>
    );
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
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 18,
    },
    actionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 12,
    },
    actionPill: {
        backgroundColor: '#FFF7E6',
        borderColor: '#F1D48A',
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 9,
        marginRight: 8,
        marginBottom: 8,
    },
    actionText: {
        color: '#92400E',
        fontSize: 12,
        fontWeight: '900',
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
