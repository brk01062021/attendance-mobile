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

type ReportView = 'overview' | 'studentInsights' | 'teacherReports' | 'coverageWorkload';
type TrendMode = 'Weekly' | 'Monthly';

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

const coverageData = [
    {
        teacher: 'Prof Krishna',
        periods: 8,
        hours: 6,
        classes: 4,
    },
    {
        teacher: 'Prof Rama',
        periods: 5,
        hours: 4,
        classes: 3,
    },
];

const weeklyTrendData = [
    { teacher: 'Krishna', col1: 2, col2: 4, col3: 8, total: 14 },
    { teacher: 'Rama', col1: 1, col2: 3, col3: 5, total: 9 },
];

const monthlyTrendData = [
    { teacher: 'Krishna', col1: 8, col2: 12, col3: 15, total: 35 },
    { teacher: 'Rama', col1: 5, col2: 9, col3: 11, total: 25 },
];

export default function AttendanceReportScreen() {
    const { teacherId, teacherName, role } = useLocalSearchParams();

    const userRole = String(role || 'ADMIN').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    const [date, setDate] = useState('2026-04-27');
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [sortBy, setSortBy] = useState('Overall');
    const [showSortModal, setShowSortModal] = useState(false);
    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [activeView, setActiveView] = useState<ReportView>('overview');
    const [trendMode, setTrendMode] = useState<TrendMode>('Weekly');

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
        const daysBack = sortBy.includes('Weekly') ? 6 : sortBy.includes('Monthly') ? 29 : 0;

        for (let i = daysBack; i >= 0; i--) {
            const d = new Date(selected);
            d.setDate(selected.getDate() - i);
            dates.push(formatDate(d));
        }

        return dates;
    };

    const loadAdminReport = async () => {
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
                    throw new Error('Failed to load report');
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
        } catch (error) {
            console.log(error);
            setReportData([]);
            Alert.alert('Error', 'Unable to load attendance report');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadReport = () => {
        if (!isAdmin) {
            Alert.alert('Teacher Report', 'Teacher attendance reports will be connected next.');
            return;
        }

        loadAdminReport();
    };

    const goBack = () => {
        if (isAdmin) {
            router.replace({ pathname: '/admin-dashboard', params: { role: 'ADMIN' } } as any);
            return;
        }

        router.replace({
            pathname: '/teacher-dashboard',
            params: { teacherId, teacherName, role: userRole },
        } as any);
    };

    const sortedReport = useMemo(() => {
        const data = [...reportData];

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
    }, [reportData, sortBy]);

    const summaryStats = useMemo(() => {
        const total = reportData.reduce((sum, item) => sum + item.totalRecords, 0);
        const present = reportData.reduce((sum, item) => sum + item.present, 0);
        const absent = reportData.reduce((sum, item) => sum + item.absent, 0);
        const late = reportData.reduce((sum, item) => sum + item.late, 0);
        const percentage = total === 0 ? 0 : ((present + late) / total) * 100;

        return { total, present, absent, late, percentage };
    }, [reportData]);

    const canShowReportActions = hasLoadedOnce && !loading;
    const trendData = trendMode === 'Weekly' ? weeklyTrendData : monthlyTrendData;
    const trendHeaders = trendMode === 'Weekly'
        ? ['Teacher', 'Week 1', 'Week 2', 'Week 3', 'Total']
        : ['Teacher', 'Jan', 'Feb', 'Mar', 'Total'];

    const selectMenu = (view: ReportView) => {
        setActiveView(view);
        setShowMenuModal(false);
    };

    const handleExportAction = (action: string) => {
        setShowExportModal(false);
        Alert.alert(action, `${action} wiring will be connected in the next phase.`);
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

                    <Text style={styles.title}>{isAdmin ? 'Admin Reports' : 'Attendance Reports'}</Text>

                    <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => setShowMenuModal(true)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.menuButtonText}>☰</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.filterCard}>
                    <Text style={styles.label}>Report Date</Text>

                    <TextInput
                        style={styles.input}
                        value={date}
                        onChangeText={setDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#6B7280"
                    />

                    <TouchableOpacity
                        style={[styles.loadButton, loading && styles.disabledButton]}
                        onPress={handleLoadReport}
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

                {canShowReportActions && (
                    <>
                        <View style={styles.summaryCard}>
                            <View style={styles.sectionHeaderRow}>
                                <View style={styles.sectionHeaderTextBox}>
                                    <Text style={styles.sectionEyebrow}>Summary Cards</Text>
                                    <Text style={styles.sectionTitle}>School Attendance Summary</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.exportSmallButton}
                                    onPress={() => setShowExportModal(true)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.exportSmallButtonText}>Export / Share</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.statsGrid}>
                                <StatBox title="Total" value={summaryStats.total} />
                                <StatBox title="Present" value={summaryStats.present} color={colors.successGreen} />
                                <StatBox title="Absent" value={summaryStats.absent} color="#DC2626" />
                                <StatBox title="Late" value={summaryStats.late} color="#D97706" />
                            </View>

                            <View style={styles.percentageBox}>
                                <Text style={styles.percentageLabel}>Attendance Percentage</Text>
                                <Text style={styles.percentageValue}>{Math.round(summaryStats.percentage)}%</Text>
                            </View>
                        </View>

                        <View style={styles.sortCard}>
                            <Text style={styles.sectionEyebrow}>Sorting</Text>
                            <Text style={styles.sectionTitle}>Report Sorting</Text>
                            <TouchableOpacity
                                style={styles.sortButton}
                                onPress={() => setShowSortModal(true)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.sortButtonText}>Sort By: {sortBy}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {!loading && hasLoadedOnce && reportData.length === 0 && (
                    <View style={styles.noDataCard}>
                        <Text style={styles.noDataTitle}>No Data Found</Text>
                        <Text style={styles.noDataText}>No attendance report data found for selected date.</Text>
                    </View>
                )}

                {activeView === 'overview' && canShowReportActions && sortedReport.map((item, index) => (
                    <View key={index} style={styles.reportCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Class {item.className} - Section {item.section}</Text>
                            <Text style={styles.attendancePercent}>{item.attendancePercentage.toFixed(1)}%</Text>
                        </View>

                        <View style={styles.statsGrid}>
                            <StatBox title="Total" value={item.totalRecords} />
                            <StatBox title="Present" value={item.present} color={colors.successGreen} />
                            <StatBox title="Absent" value={item.absent} color="#DC2626" />
                            <StatBox title="Late" value={item.late} color="#D97706" />
                        </View>

                        <View style={styles.progressBackground}>
                            <View style={[styles.progressFill, { width: `${Math.min(item.attendancePercentage, 100)}%` }]} />
                        </View>
                    </View>
                ))}

                {activeView === 'studentInsights' && canShowReportActions && (
                    <ReportSection
                        eyebrow="Student Attendance Insights"
                        title="Student-Level Reports"
                        description="Student-wise reporting for total days, present days, absent days, late days and attendance percentage."
                        onExport={() => setShowExportModal(true)}
                    >
                        <InfoList
                            rows={[
                                ['Student Name', 'Available in detailed report'],
                                ['Class / Section', 'Filter-ready'],
                                ['Attendance %', 'Student-wise tracking'],
                                ['Chronic Absentees', 'Next reporting phase'],
                            ]}
                        />
                    </ReportSection>
                )}

                {activeView === 'teacherReports' && canShowReportActions && (
                    <ReportSection
                        eyebrow="Teacher-Level Reports"
                        title="Teacher Absence / Replacement"
                        description="Tracks teacher leave impact and whether replacement coverage was assigned."
                        onExport={() => setShowExportModal(true)}
                    >
                        {teacherAbsenceData.map((item) => (
                            <TeacherAbsenceCard key={item.teacher} item={item} />
                        ))}
                    </ReportSection>
                )}

                {activeView === 'coverageWorkload' && canShowReportActions && (
                    <ReportSection
                        eyebrow="Coverage Workload"
                        title="Replacement Coverage Workload"
                        description="Shows which teachers handled extra replacement periods for fair workload planning."
                        onExport={() => setShowExportModal(true)}
                    >
                        {coverageData.map((item) => (
                            <CoverageCard key={item.teacher} item={item} />
                        ))}

                        <View style={styles.trendHeaderRow}>
                            <View>
                                <Text style={styles.subSectionEyebrow}>Teacher Trend</Text>
                                <Text style={styles.subSectionTitle}>{trendMode} Coverage Trend</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.trendSortButton}
                                onPress={() => setTrendMode(trendMode === 'Weekly' ? 'Monthly' : 'Weekly')}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.trendSortText}>{trendMode}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.trendTable}>
                            <View style={styles.trendTableHeader}>
                                {trendHeaders.map((header) => (
                                    <Text key={header} style={styles.trendHeaderText}>{header}</Text>
                                ))}
                            </View>

                            {trendData.map((row) => (
                                <View key={row.teacher} style={styles.trendTableRow}>
                                    <Text style={styles.trendCellTeacher}>{row.teacher}</Text>
                                    <Text style={styles.trendCell}>{row.col1}</Text>
                                    <Text style={styles.trendCell}>{row.col2}</Text>
                                    <Text style={styles.trendCell}>{row.col3}</Text>
                                    <Text style={styles.trendCellTotal}>{row.total}</Text>
                                </View>
                            ))}
                        </View>
                    </ReportSection>
                )}

                <Modal visible={showSortModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Sort Attendance Report</Text>

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

                <Modal visible={showMenuModal} transparent animationType="slide">
                    <TouchableOpacity
                        style={styles.modalOverlayBottom}
                        activeOpacity={1}
                        onPress={() => setShowMenuModal(false)}
                    >
                        <View style={styles.menuContainer}>
                            <Text style={styles.modalTitle}>Admin Reports Menu</Text>

                            <MenuOption title="Class Attendance Summary" onPress={() => selectMenu('overview')} />
                            <MenuOption title="Student Attendance Insights" onPress={() => selectMenu('studentInsights')} />
                            <MenuOption title="Teacher-Level Reports" onPress={() => selectMenu('teacherReports')} />
                            <MenuOption title="Coverage Workload + Trend" onPress={() => selectMenu('coverageWorkload')} />

                            <TouchableOpacity style={styles.closeButton} onPress={() => setShowMenuModal(false)}>
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
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
            </ScrollView>
        </ImageBackground>
    );
}

function ReportSection({
                           eyebrow,
                           title,
                           description,
                           children,
                           onExport,
                       }: {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
    onExport: () => void;
}) {
    return (
        <View style={styles.reportSectionCard}>
            <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderTextBox}>
                    <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>
                <TouchableOpacity style={styles.exportSmallButton} onPress={onExport} activeOpacity={0.85}>
                    <Text style={styles.exportSmallButtonText}>Export / Share</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.sectionDescription}>{description}</Text>
            {children}
        </View>
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

function InfoList({ rows }: { rows: string[][] }) {
    return (
        <View style={styles.infoList}>
            {rows.map(([title, subtitle]) => (
                <View key={title} style={styles.infoRow}>
                    <Text style={styles.infoTitle}>{title}</Text>
                    <Text style={styles.infoSubtitle}>{subtitle}</Text>
                </View>
            ))}
        </View>
    );
}

function TeacherAbsenceCard({ item }: { item: typeof teacherAbsenceData[number] }) {
    return (
        <View style={styles.teacherCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.teacher}</Text>
                <Text style={styles.attendancePercent}>{item.coverage}%</Text>
            </View>
            <View style={styles.statsGrid}>
                <StatBox title="Leaves" value={item.leaves} />
                <StatBox title="Planned" value={item.planned} />
                <StatBox title="Unplanned" value={item.unplanned} />
                <StatBox title="Assigned" value={item.assigned} />
                <StatBox title="Missing" value={item.missing} color="#DC2626" />
                <StatBox title="Coverage" value={item.coverage} color={colors.successGreen} />
            </View>
        </View>
    );
}

function CoverageCard({ item }: { item: typeof coverageData[number] }) {
    return (
        <View style={styles.teacherCard}>
            <Text style={styles.cardTitle}>{item.teacher}</Text>
            <View style={styles.statsGrid}>
                <StatBox title="Periods" value={item.periods} />
                <StatBox title="Hours" value={item.hours} />
                <StatBox title="Classes" value={item.classes} />
            </View>
        </View>
    );
}

function MenuOption({ title, onPress }: { title: string; onPress: () => void }) {
    return (
        <TouchableOpacity style={styles.menuOption} onPress={onPress} activeOpacity={0.85}>
            <Text style={styles.menuOptionText}>{title}</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
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
        fontSize: 28,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
        paddingHorizontal: spacing.sm,
    },
    menuButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuButtonText: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    filterCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.35)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },
    label: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primaryNavy,
        marginBottom: spacing.sm,
    },
    input: {
        height: 54,
        borderRadius: 14,
        borderWidth: 1.2,
        borderColor: '#D1D5DB',
        paddingHorizontal: spacing.md,
        backgroundColor: '#F9FAFB',
        fontSize: 16,
        fontWeight: '700',
        color: colors.primaryNavy,
        marginBottom: spacing.md,
    },
    loadButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
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
    sortCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.92)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.lg,
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
    },
    sectionDescription: {
        fontSize: 15,
        lineHeight: 23,
        fontWeight: '800',
        color: colors.slateText,
        marginBottom: spacing.lg,
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
    sortButton: {
        backgroundColor: '#FFF8E1',
        borderRadius: 14,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
        marginTop: spacing.md,
    },
    sortButtonText: {
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '800',
        color: colors.primaryNavy,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
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
    percentageBox: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginTop: spacing.sm,
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
    noDataCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        alignItems: 'center',
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
    reportCard: {
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    cardTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
        paddingRight: spacing.md,
    },
    attendancePercent: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.successGreen,
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
    infoList: {
        backgroundColor: '#FFF9E8',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        overflow: 'hidden',
    },
    infoRow: {
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#EADFAE',
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.xs,
    },
    infoSubtitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.slateText,
    },
    teacherCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
    },
    trendHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    subSectionEyebrow: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    subSectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.xs,
    },
    trendSortButton: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    trendSortText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.premiumGold,
    },
    trendTable: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
    },
    trendTableHeader: {
        backgroundColor: colors.primaryNavy,
        flexDirection: 'row',
        paddingVertical: spacing.md,
    },
    trendHeaderText: {
        flex: 1,
        textAlign: 'center',
        color: colors.premiumGold,
        fontSize: 12,
        fontWeight: '900',
    },
    trendTableRow: {
        flexDirection: 'row',
        backgroundColor: '#FFF9E8',
        borderBottomWidth: 1,
        borderBottomColor: '#EADFAE',
        paddingVertical: spacing.md,
    },
    trendCellTeacher: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    trendCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    trendCellTotal: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '900',
        color: colors.successGreen,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.xl,
    },
    modalOverlayBottom: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalBox: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: spacing.xl,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
    },
    menuContainer: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
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
    menuOption: {
        backgroundColor: '#FFF8E1',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    menuOptionText: {
        fontSize: 17,
        fontWeight: '900',
        color: colors.primaryNavy,
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
});
