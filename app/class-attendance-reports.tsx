import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, shadows } from '../src/theme';

const BASE_URL = 'http://192.168.1.75:8080';

type ReportItem = {
    className: string;
    section: string;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
};

type DateRangeMode = 'Daily' | 'Weekly' | 'Monthly';

export default function ClassAttendanceReportsScreen() {
    const params = useLocalSearchParams();
    const today = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(String(params.date || today));
    const [dateRangeMode, setDateRangeMode] = useState<DateRangeMode>('Daily');
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [sortBy, setSortBy] = useState('Overall');
    const [showSortModal, setShowSortModal] = useState(false);
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [generatedAt, setGeneratedAt] = useState('');

    const sortOptions = [
        'Overall',
        'Class Name',
        'Attendance % High to Low',
        'Attendance % Low to High',
        'Most Absentees',
    ];

    const formatDate = (inputDate: Date) => inputDate.toISOString().split('T')[0];

    const getDateRange = () => {
        const selected = new Date(date);
        const dates: string[] = [];
        const daysBack = dateRangeMode === 'Weekly' ? 6 : dateRangeMode === 'Monthly' ? 29 : 0;

        for (let i = daysBack; i >= 0; i--) {
            const d = new Date(selected);
            d.setDate(selected.getDate() - i);
            dates.push(formatDate(d));
        }

        return dates;
    };

    const loadClassReport = async () => {
        try {
            setLoading(true);
            setHasLoadedOnce(true);

            const dates = getDateRange();
            const map = new Map<string, ReportItem>();

            for (const reportDate of dates) {
                const response = await fetch(
                    `${BASE_URL}/attendance/dashboard/admin/classes?date=${reportDate}`
                );

                if (!response.ok) {
                    throw new Error('Failed to load class attendance report');
                }

                const data = await response.json();

                if (Array.isArray(data)) {
                    data.forEach((item) => {
                        const key = `${item.className}-${item.section}`;

                        const existing = map.get(key) || {
                            className: item.className,
                            section: item.section,
                            totalRecords: 0,
                            present: 0,
                            absent: 0,
                            late: 0,
                            attendancePercentage: 0,
                        };

                        existing.totalRecords += item.totalRecords || 0;
                        existing.present += item.present || 0;
                        existing.absent += item.absent || 0;
                        existing.late += item.late || 0;
                        existing.attendancePercentage =
                            existing.totalRecords === 0
                                ? 0
                                : ((existing.present + existing.late) / existing.totalRecords) * 100;

                        map.set(key, existing);
                    });
                }
            }

            setReportData(Array.from(map.values()));
            setGeneratedAt(new Date().toLocaleString());
        } catch (error) {
            console.log(error);
            setReportData([]);
            Alert.alert('Error', 'Unable to load class attendance reports');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setClassFilter('');
        setSectionFilter('');
    };

    const filteredReport = useMemo(() => {
        return reportData.filter((item) => {
            const matchesClass =
                !classFilter.trim() ||
                item.className.toLowerCase().includes(classFilter.trim().toLowerCase());

            const matchesSection =
                !sectionFilter.trim() ||
                item.section.toLowerCase().includes(sectionFilter.trim().toLowerCase());

            return matchesClass && matchesSection;
        });
    }, [reportData, classFilter, sectionFilter]);

    const sortedReport = useMemo(() => {
        const data = [...filteredReport];

        if (sortBy === 'Class Name') {
            data.sort((a, b) => `${a.className}-${a.section}`.localeCompare(`${b.className}-${b.section}`));
        } else if (sortBy === 'Attendance % Low to High') {
            data.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
        } else if (sortBy === 'Most Absentees') {
            data.sort((a, b) => b.absent - a.absent);
        } else {
            data.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
        }

        return data;
    }, [filteredReport, sortBy]);

    const summaryStats = useMemo(() => {
        const total = sortedReport.reduce((sum, item) => sum + item.totalRecords, 0);
        const present = sortedReport.reduce((sum, item) => sum + item.present, 0);
        const absent = sortedReport.reduce((sum, item) => sum + item.absent, 0);
        const late = sortedReport.reduce((sum, item) => sum + item.late, 0);
        const percentage = total === 0 ? 0 : ((present + late) / total) * 100;

        return {
            total,
            present,
            absent,
            late,
            classes: sortedReport.length,
            percentage,
        };
    }, [sortedReport]);

    return (
        <ImageBackground
            source={require('../assets/branding/splash-gold.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Class Reports</Text>

                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>Class Attendance Reports</Text>
                    <Text style={styles.heroTitle}>Class and section wise attendance drilldown</Text>
                    <Text style={styles.heroText}>
                        Use date range, class, section and sorting to pull exact class-level attendance reports. Leave class and section blank to view all classes.
                    </Text>

                    {generatedAt ? (
                        <View style={styles.generatedPill}>
                            <Text style={styles.generatedPillText}>Generated: {generatedAt}</Text>
                        </View>
                    ) : (
                        <View style={styles.generatedPill}>
                            <Text style={styles.generatedPillText}>Waiting for report load</Text>
                        </View>
                    )}
                </View>

                <View style={styles.filterCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderTextBox}>
                            <Text style={styles.sectionEyebrow}>Report Filters</Text>
                            <Text style={styles.sectionTitle}>Pull Exact Report</Text>
                        </View>

                        <TouchableOpacity style={styles.clearFilterButton} onPress={clearFilters} activeOpacity={0.85}>
                            <Text style={styles.clearFilterText}>Clear</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Report Date</Text>
                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#6B7280"
                    />

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
                            <TextInput
                                style={styles.input}
                                value={classFilter}
                                onChangeText={setClassFilter}
                                placeholder="All"
                                placeholderTextColor="#6B7280"
                            />
                        </View>

                        <View style={styles.halfInputBox}>
                            <Text style={styles.label}>Section</Text>
                            <TextInput
                                style={styles.input}
                                value={sectionFilter}
                                onChangeText={setSectionFilter}
                                placeholder="All"
                                placeholderTextColor="#6B7280"
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>Sorting</Text>
                    <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)} activeOpacity={0.85}>
                        <Text style={styles.sortButtonText}>Sort By: {sortBy}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loadButton, loading && styles.disabledButton]}
                        onPress={loadClassReport}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.primaryNavy} />
                        ) : (
                            <Text style={styles.loadButtonText}>Load Class Report</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {hasLoadedOnce && !loading && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.sectionEyebrow}>Filtered Summary</Text>
                        <Text style={styles.sectionTitle}>Class Report Summary</Text>

                        <View style={styles.statsGrid}>
                            <StatBox title="Classes" value={summaryStats.classes} color="#2563EB" />
                            <StatBox title="Total" value={summaryStats.total} />
                            <StatBox title="Present" value={summaryStats.present} color={colors.successGreen} />
                            <StatBox title="Absent" value={summaryStats.absent} color="#DC2626" />
                            <StatBox title="Late" value={summaryStats.late} color="#D97706" />
                            <StatBox title="Attendance %" value={Math.round(summaryStats.percentage)} color={colors.successGreen} />
                        </View>
                    </View>
                )}

                {!loading && hasLoadedOnce && reportData.length === 0 && (
                    <View style={styles.noDataCard}>
                        <Text style={styles.noDataTitle}>No Data Found</Text>
                        <Text style={styles.noDataText}>
                            No class attendance report data found for selected date range.
                        </Text>
                    </View>
                )}

                {!loading && hasLoadedOnce && reportData.length > 0 && sortedReport.length === 0 && (
                    <View style={styles.noDataCard}>
                        <Text style={styles.noDataTitle}>No Matching Class / Section</Text>
                        <Text style={styles.noDataText}>
                            Report data was loaded, but no class or section matched your current filters.
                        </Text>
                    </View>
                )}

                {sortedReport.map((item, index) => (
                    <View key={`${item.className}-${item.section}-${index}`} style={styles.reportCard}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardTitleBox}>
                                <Text style={styles.cardTitle}>Class {item.className} - Section {item.section}</Text>
                                <Text style={styles.cardSubtitle}>{dateRangeMode} report ending {date}</Text>
                            </View>

                            <Text style={styles.attendancePercent}>{item.attendancePercentage.toFixed(1)}%</Text>
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
                    </View>
                ))}

                <Modal visible={showSortModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Sort Class Report</Text>

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
            </ScrollView>
        </ImageBackground>
    );
}

function StatBox({ title, value, color = colors.primaryNavy }: { title: string; value: number; color?: string }) {
    return (
        <View style={styles.statBox}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: '#F6E7B0' },
    container: { paddingHorizontal: spacing.screenPadding, paddingTop: 64, paddingBottom: spacing.xxxl },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
    backButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255, 248, 225, 0.18)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center' },
    backButtonText: { fontSize: 38, lineHeight: 40, fontWeight: '900', color: colors.primaryNavy },
    title: { flex: 1, fontSize: 28, fontWeight: '900', color: colors.primaryNavy, textAlign: 'center', paddingHorizontal: spacing.sm },
    headerSpacer: { width: 48, height: 48 },
    heroCard: { backgroundColor: 'rgba(255, 248, 225, 0.52)', borderRadius: 26, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, marginBottom: spacing.xl, ...shadows.medium },
    heroEyebrow: { fontSize: 13, fontWeight: '900', color: colors.premiumGold, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing.xs },
    heroTitle: { fontSize: 25, fontWeight: '900', color: colors.primaryNavy, lineHeight: 31, marginBottom: spacing.sm },
    heroText: { fontSize: 15, fontWeight: '800', color: colors.slateText, lineHeight: 23 },
    generatedPill: { alignSelf: 'flex-start', backgroundColor: colors.primaryNavy, borderRadius: 18, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.lg },
    generatedPillText: { fontSize: 12, fontWeight: '900', color: colors.premiumGold },
    filterCard: { backgroundColor: 'rgba(255, 248, 225, 0.78)', borderRadius: 24, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, marginBottom: spacing.xl, ...shadows.medium },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    sectionHeaderTextBox: { flex: 1, paddingRight: spacing.md },
    sectionEyebrow: { fontSize: 13, fontWeight: '900', color: colors.premiumGold, textTransform: 'uppercase', letterSpacing: 1.2 },
    sectionTitle: { fontSize: 23, fontWeight: '900', color: colors.primaryNavy, marginTop: spacing.xs, marginBottom: spacing.lg },
    label: { fontSize: 16, fontWeight: '800', color: colors.primaryNavy, marginBottom: spacing.sm },
    input: { height: 54, borderRadius: 14, borderWidth: 1.2, borderColor: '#D1D5DB', paddingHorizontal: spacing.md, backgroundColor: '#F9FAFB', fontSize: 16, fontWeight: '700', color: colors.primaryNavy, marginBottom: spacing.md },
    twoColumnRow: { flexDirection: 'row', justifyContent: 'space-between' },
    halfInputBox: { width: '48%' },
    segmentRow: { flexDirection: 'row', backgroundColor: '#FFF8E1', borderRadius: 16, borderWidth: 1, borderColor: colors.cardGoldBorder, padding: 4, marginBottom: spacing.lg },
    segmentButton: { flex: 1, borderRadius: 12, paddingVertical: spacing.sm, alignItems: 'center' },
    segmentButtonActive: { backgroundColor: colors.primaryNavy },
    segmentText: { fontSize: 13, fontWeight: '900', color: colors.primaryNavy },
    segmentTextActive: { color: colors.premiumGold },
    clearFilterButton: { backgroundColor: '#FFF8E1', borderRadius: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    clearFilterText: { fontSize: 12, fontWeight: '900', color: colors.primaryNavy },
    sortButton: { backgroundColor: '#FFF8E1', borderRadius: 14, borderWidth: 1.2, borderColor: colors.cardGoldBorder, paddingVertical: 14, paddingHorizontal: spacing.md, marginBottom: spacing.md },
    sortButtonText: { textAlign: 'center', fontSize: 15, fontWeight: '800', color: colors.primaryNavy },
    loadButton: { height: 56, borderRadius: 16, backgroundColor: colors.premiumGold, alignItems: 'center', justifyContent: 'center', ...shadows.medium },
    disabledButton: { opacity: 0.7 },
    loadButtonText: { fontSize: 17, fontWeight: '900', color: colors.primaryNavy },
    summaryCard: { backgroundColor: 'rgba(255, 248, 225, 0.92)', borderRadius: 24, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, marginBottom: spacing.xl, ...shadows.medium },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
    statBox: { width: '48%', backgroundColor: '#FFF9E8', borderRadius: 16, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingVertical: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
    statTitle: { fontSize: 14, fontWeight: '800', color: colors.slateText },
    statValue: { fontSize: 26, fontWeight: '900', marginTop: spacing.xs },
    reportCard: { backgroundColor: 'rgba(255, 248, 225, 0.92)', borderRadius: 24, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.medium },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    cardTitleBox: { flex: 1, paddingRight: spacing.md },
    cardTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryNavy },
    cardSubtitle: { fontSize: 13, fontWeight: '800', color: colors.slateText, marginTop: spacing.xs },
    attendancePercent: { fontSize: 22, fontWeight: '900', color: colors.successGreen },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
    statusLabel: { fontSize: 14, fontWeight: '900', color: colors.slateText },
    statusBadge: { overflow: 'hidden', borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, fontSize: 12, fontWeight: '900' },
    statusSubmitted: { backgroundColor: '#DCFCE7', color: '#166534' },
    statusPending: { backgroundColor: '#FEF3C7', color: '#92400E' },
    progressBackground: { height: 12, backgroundColor: '#E5E7EB', borderRadius: 20, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.successGreen, borderRadius: 20 },
    noDataCard: { backgroundColor: '#FFF8E1', borderRadius: 22, borderWidth: 1.2, borderColor: colors.cardGoldBorder, padding: spacing.xl, alignItems: 'center', marginBottom: spacing.xl, ...shadows.soft },
    noDataTitle: { fontSize: 22, fontWeight: '900', color: '#92400E', marginBottom: spacing.sm },
    noDataText: { fontSize: 15, fontWeight: '700', textAlign: 'center', color: '#92400E', lineHeight: 22 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.xl },
    modalBox: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl, borderWidth: 1.5, borderColor: colors.cardGoldBorder },
    modalTitle: { fontSize: 24, fontWeight: '900', color: colors.primaryNavy, marginBottom: spacing.lg, textAlign: 'center' },
    optionButton: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    optionText: { fontSize: 16, fontWeight: '800', color: colors.primaryNavy },
    closeButton: { marginTop: spacing.xl, backgroundColor: colors.primaryNavy, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    closeButtonText: { fontSize: 16, fontWeight: '900', color: colors.white },
});
