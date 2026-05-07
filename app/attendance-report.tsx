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

    const sortOptions = [
        'Class Name',
        'Least Weekly Attendance',
        'Highest Weekly Attendance',
        'Least Monthly Attendance',
        'Highest Monthly Attendance',
        'Overall',
    ];

    const formatDate = (inputDate: Date) => {
        return inputDate.toISOString().split('T')[0];
    };

    const getDateRange = () => {
        const selected = new Date(date);
        const dates: string[] = [];

        let daysBack = 0;

        if (sortBy.includes('Weekly')) {
            daysBack = 6;
        } else if (sortBy.includes('Monthly')) {
            daysBack = 29;
        }

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
                                : ((existing.present + existing.late) /
                                    existing.totalRecords) *
                                100;

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
            Alert.alert(
                'Teacher Report',
                'Teacher attendance reports will be connected next.'
            );
            return;
        }

        loadAdminReport();
    };

    const goBackToTeacherDashboard = () => {
        router.replace({
            pathname: '/teacher-dashboard',
            params: {
                teacherId,
                teacherName,
                role: userRole,
            },
        } as any);
    };

    const sortedReport = useMemo(() => {
        const data = [...reportData];

        if (sortBy === 'Class Name') {
            data.sort((a, b) =>
                `${a.className}-${a.section}`.localeCompare(
                    `${b.className}-${b.section}`
                )
            );
        } else if (
            sortBy === 'Least Weekly Attendance' ||
            sortBy === 'Least Monthly Attendance'
        ) {
            data.sort(
                (a, b) => a.attendancePercentage - b.attendancePercentage
            );
        } else {
            data.sort(
                (a, b) => b.attendancePercentage - a.attendancePercentage
            );
        }

        return data;
    }, [reportData, sortBy]);

    return (
        <ImageBackground
            source={require('../assets/branding/splash-gold.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={goBackToTeacherDashboard}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>
                        {isAdmin
                            ? 'Admin Reports'
                            : 'Attendance Reports'}
                    </Text>

                    <View style={styles.headerSpacer} />
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

                    {isAdmin && (
                        <TouchableOpacity
                            style={styles.sortButton}
                            onPress={() => setShowSortModal(true)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.sortButtonText}>
                                Sort By: {sortBy}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.loadButton,
                            loading && styles.disabledButton,
                        ]}
                        onPress={handleLoadReport}
                        disabled={loading}
                        activeOpacity={0.9}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.primaryNavy} />
                        ) : (
                            <Text style={styles.loadButtonText}>
                                Load Attendance Report
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {!loading && hasLoadedOnce && reportData.length === 0 && (
                    <View style={styles.noDataCard}>
                        <Text style={styles.noDataTitle}>No Data Found</Text>

                        <Text style={styles.noDataText}>
                            No attendance report data found for selected date.
                        </Text>
                    </View>
                )}

                {!loading &&
                    sortedReport.map((item, index) => (
                        <View key={index} style={styles.reportCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>
                                    Class {item.className} - Section{' '}
                                    {item.section}
                                </Text>

                                <Text style={styles.attendancePercent}>
                                    {item.attendancePercentage.toFixed(1)}%
                                </Text>
                            </View>

                            <View style={styles.statsGrid}>
                                <StatBox title="Total" value={item.totalRecords} />
                                <StatBox
                                    title="Present"
                                    value={item.present}
                                    color={colors.successGreen}
                                />
                                <StatBox
                                    title="Absent"
                                    value={item.absent}
                                    color="#DC2626"
                                />
                                <StatBox
                                    title="Late"
                                    value={item.late}
                                    color="#D97706"
                                />
                            </View>

                            <View style={styles.progressBackground}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${Math.min(
                                                item.attendancePercentage,
                                                100
                                            )}%`,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    ))}

                <Modal visible={showSortModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>
                                Sort Attendance Report
                            </Text>

                            {sortOptions.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={styles.optionButton}
                                    onPress={() => {
                                        setSortBy(option);
                                        setShowSortModal(false);
                                    }}
                                >
                                    <Text style={styles.optionText}>
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowSortModal(false)}
                            >
                                <Text style={styles.closeButtonText}>
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </ImageBackground>
    );
}

function StatBox({
                     title,
                     value,
                     color = colors.primaryNavy,
                 }: {
    title: string;
    value: number;
    color?: string;
}) {
    return (
        <View style={styles.statBox}>
            <Text style={styles.statTitle}>{title}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
        </View>
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
        backgroundColor: 'rgba(255,255,255,0.42)',
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

    headerSpacer: {
        width: 48,
    },

    filterCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
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

    sortButton: {
        backgroundColor: '#FFF8E1',
        borderRadius: 14,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        paddingVertical: 14,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },

    sortButtonText: {
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '800',
        color: colors.primaryNavy,
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
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.lg,
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