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
import { API_BASE_URL, DEV_DEFAULTS } from '../src/services/api';

const screenWidth = Dimensions.get('window').width;
const chartWidth = Math.max(300, screenWidth - 56);
const DEFAULT_MONTH = DEV_DEFAULTS.analyticsEndDate.slice(0, 7);
const DEFAULT_DATE = DEV_DEFAULTS.dashboardDate;

type PrincipalSummary = {
    totalStudents: number;
    totalTeachers: number;
    todayAttendancePercentage: number;
    studentsAbsentToday: number;
    teachersOnLeave: number;
    replacementPeriodsToday: number;
    lowAttendanceStudents: number;
    pendingTeacherAttendance: number;
};

type RiskAlert = {
    type: string;
    title: string;
    description: string;
    severity: string;
    score?: number;
};

type TrendPoint = {
    label: string;
    presentCount: number;
    absentCount: number;
    totalCount: number;
    attendancePercentage: number;
};

type ClassComparison = {
    className: string;
    section: string;
    presentCount: number;
    absentCount: number;
    totalMarked: number;
    attendancePercentage: number;
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

export default function PrincipalDashboardScreen() {
    const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH);
    const [summary, setSummary] = useState<PrincipalSummary>(fallbackSummary);
    const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
    const [attendanceTrend, setAttendanceTrend] = useState<TrendPoint[]>([]);
    const [classComparison, setClassComparison] = useState<ClassComparison[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');

    const monthOptions = useMemo(() => buildMonthOptions(DEFAULT_MONTH), []);

    useEffect(() => {
        loadDashboard();
    }, [selectedMonth]);

    const loadDashboard = async () => {
        setLoading(true);
        setErrorText('');

        try {
            const startDate = `${selectedMonth}-01`;
            const endDate = getMonthEndDate(selectedMonth);

            const [summaryResponse, alertsResponse, trendResponse, comparisonResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/principal/dashboard/summary?date=${DEFAULT_DATE}`),
                fetch(`${API_BASE_URL}/principal/dashboard/risk-alerts?month=${selectedMonth}`),
                fetch(`${API_BASE_URL}/analytics/attendance/monthly?month=${selectedMonth}`),
                fetch(`${API_BASE_URL}/principal/dashboard/class-comparison?month=${selectedMonth}`),
            ]);

            if (!summaryResponse.ok || !alertsResponse.ok || !trendResponse.ok || !comparisonResponse.ok) {
                throw new Error('Unable to load principal intelligence dashboard');
            }

            const summaryData = await summaryResponse.json();
            const alertsData = await alertsResponse.json();
            const trendData = await trendResponse.json();
            const comparisonData = await comparisonResponse.json();

            setSummary({
                totalStudents: Number(summaryData.totalStudents ?? 0),
                totalTeachers: Number(summaryData.totalTeachers ?? 0),
                todayAttendancePercentage: Number(summaryData.todayAttendancePercentage ?? 0),
                studentsAbsentToday: Number(summaryData.studentsAbsentToday ?? 0),
                teachersOnLeave: Number(summaryData.teachersOnLeave ?? 0),
                replacementPeriodsToday: Number(summaryData.replacementPeriodsToday ?? 0),
                lowAttendanceStudents: Number(summaryData.lowAttendanceStudents ?? 0),
                pendingTeacherAttendance: Number(summaryData.pendingTeacherAttendance ?? 0),
            });
            setRiskAlerts(Array.isArray(alertsData) ? alertsData : []);
            setAttendanceTrend(Array.isArray(trendData) ? trendData : []);
            setClassComparison(Array.isArray(comparisonData) ? comparisonData : []);
        } catch (error) {
            setSummary(fallbackSummary);
            setRiskAlerts([]);
            setAttendanceTrend([]);
            setClassComparison([]);
            setErrorText('Live principal dashboard data unavailable. Please confirm backend is running.');
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
                        <Text style={styles.headerSubtitle}>Principal-level analytics and risk alerts</Text>
                    </View>

                    <TouchableOpacity style={styles.circleButton} onPress={loadDashboard} activeOpacity={0.85}>
                        <Text style={styles.circleButtonText}>↻</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>VidyaSetu Premium Intelligence</Text>
                    <Text style={styles.heroTitle}>One place for school health, teacher workload and student risk.</Text>
                    <Text style={styles.heroSubtitle}>Principal-level KPIs, attendance trends, class comparisons and risk detection.</Text>
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
                        <Text style={styles.loadingText}>Loading principal intelligence...</Text>
                    </View>
                ) : null}

                {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

                <View style={styles.kpiGrid}>
                    <AnalyticsKpiCard title="Total Students" value={summary.totalStudents} subtitle="School strength" />
                    <AnalyticsKpiCard title="Total Teachers" value={summary.totalTeachers} subtitle="Active faculty" />
                    <AnalyticsKpiCard title="Today Attendance" value={`${Math.round(summary.todayAttendancePercentage)}%`} subtitle="Live school health" />
                    <AnalyticsKpiCard title="Absent Today" value={summary.studentsAbsentToday} subtitle="Students absent" />
                    <AnalyticsKpiCard title="Teachers Leave" value={summary.teachersOnLeave} subtitle="Today" />
                    <AnalyticsKpiCard title="Replacements" value={summary.replacementPeriodsToday} subtitle="Today periods" />
                    <AnalyticsKpiCard title="Low Attendance" value={summary.lowAttendanceStudents} subtitle="Below 60% month" />
                    <AnalyticsKpiCard title="Pending Marking" value={summary.pendingTeacherAttendance} subtitle="Teacher attendance" />
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

                <View style={styles.alertsCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View>
                            <Text style={styles.sectionEyebrow}>Risk Detection</Text>
                            <Text style={styles.sectionTitle}>Priority Alerts</Text>
                        </View>
                        <Text style={styles.alertCount}>{riskAlerts.length}</Text>
                    </View>

                    {riskAlerts.length > 0 ? (
                        riskAlerts.map((alert, index) => (
                            <View key={`${alert.type}-${alert.title}-${index}`} style={styles.alertRow}>
                                <View style={styles.alertIconBox}>
                                    <Text style={styles.alertIcon}>{alert.severity === 'HIGH' ? '!' : '•'}</Text>
                                </View>
                                <View style={styles.alertTextBox}>
                                    <Text style={styles.alertTitle}>{alert.title || alert.type}</Text>
                                    <Text style={styles.alertDescription}>{alert.description}</Text>
                                    <Text style={styles.alertMeta}>{alert.type} • {alert.severity}</Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No major risk alerts for the selected month.</Text>
                    )}
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

function buildMonthOptions(defaultMonth: string) {
    const [year, month] = defaultMonth.split('-').map(Number);
    const base = new Date(year, month - 1, 1);
    return [0, -1, -2, -3].map((offset) => {
        const date = new Date(base);
        date.setMonth(base.getMonth() + offset);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    });
}

function getMonthEndDate(month: string) {
    const [year, monthNumber] = month.split('-').map(Number);
    const end = new Date(year, monthNumber, 0);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
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
    errorText: {
        backgroundColor: '#FEF2F2',
        color: '#B91C1C',
        padding: 12,
        borderRadius: 16,
        fontWeight: '700',
        marginBottom: 14,
    },
    kpiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    chart: {
        borderRadius: 18,
    },
    alertsCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 26,
        padding: 18,
        marginTop: 2,
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
    emptyText: {
        color: '#64748B',
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
        paddingVertical: 22,
    },
});
