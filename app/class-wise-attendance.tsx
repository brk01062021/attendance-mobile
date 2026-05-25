import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL, DEV_DEFAULTS } from '../src/services/api';
import { colors, shadows, spacing } from '../src/theme';

const DEFAULT_TEST_DATE = DEV_DEFAULTS.dashboardDate;

type ClassDashboardStats = {
    className: string;
    section: string;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
};

export default function ClassWiseAttendanceScreen() {
    const params = useLocalSearchParams();

    const selectedDate = useMemo(() => {
        const date = String(params.date || '').trim();
        return date.length > 0 ? date : DEFAULT_TEST_DATE;
    }, [params.date]);

    const [classBreakdown, setClassBreakdown] = useState<ClassDashboardStats[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadClassWiseAttendance = async () => {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(
                    `${API_BASE_URL}/attendance/dashboard/admin/classes?date=${selectedDate}`
                );

                if (!response.ok) {
                    throw new Error('Unable to load class-wise attendance');
                }

                const data = await response.json();
                setClassBreakdown(Array.isArray(data) ? data : []);
            } catch (err) {
                setClassBreakdown([]);
                setError('Class-wise attendance unavailable');
            } finally {
                setLoading(false);
            }
        };

        loadClassWiseAttendance();
    }, [selectedDate]);

    const summary = useMemo(() => {
        const totalRecords = classBreakdown.reduce((sum, item) => sum + Number(item.totalRecords || 0), 0);
        const present = classBreakdown.reduce((sum, item) => sum + Number(item.present || 0), 0);
        const absent = classBreakdown.reduce((sum, item) => sum + Number(item.absent || 0), 0);
        const late = classBreakdown.reduce((sum, item) => sum + Number(item.late || 0), 0);
        const percentage = totalRecords === 0 ? 0 : ((present + late) / totalRecords) * 100;

        return {
            totalRecords,
            present,
            absent,
            late,
            percentage: Math.round(percentage),
        };
    }, [classBreakdown]);

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
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        style={styles.circleButton}
                        onPress={() => router.back()}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.circleButtonText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Class-wise Attendance</Text>

                    <View style={styles.circleButtonPlaceholder} />
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>Analytics</Text>
                    <Text style={styles.heroTitle}>Class Attendance Breakdown</Text>
                    <Text style={styles.heroSubText}>
                        Review attendance performance by class and section for {selectedDate}.
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderTextBox}>
                            <Text style={styles.sectionEyebrow}>Today</Text>
                            <Text style={styles.sectionTitle}>Overall Class Summary</Text>
                        </View>

                        <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>{loading ? 'Loading' : error ? 'Offline' : 'Live'}</Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator />
                            <Text style={styles.loadingText}>Loading class-wise attendance...</Text>
                        </View>
                    ) : (
                        <>
                            {error ? <Text style={styles.errorText}>{error}</Text> : null}

                            <View style={styles.statsGrid}>
                                <StatCard emoji="👥" value={String(summary.totalRecords)} label="Records" />
                                <StatCard emoji="✅" value={String(summary.present)} label="Present" />
                                <StatCard emoji="🚫" value={String(summary.absent)} label="Absent" />
                                <StatCard emoji="⏰" value={String(summary.late)} label="Late" />
                            </View>

                            <View style={styles.percentageBox}>
                                <Text style={styles.percentageLabel}>Attendance Percentage</Text>
                                <Text style={styles.percentageValue}>{summary.percentage}%</Text>
                            </View>
                        </>
                    )}
                </View>

                <View style={styles.listCard}>
                    <Text style={styles.sectionEyebrow}>Classes</Text>
                    <Text style={styles.sectionTitle}>Class-wise Details</Text>

                    {classBreakdown.length > 0 ? (
                        classBreakdown.map((item) => (
                            <ClassAttendanceRow
                                key={`${item.className}-${item.section}`}
                                item={item}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No class-wise attendance data available.</Text>
                    )}
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

function StatCard({
                      emoji,
                      value,
                      label,
                  }: {
    emoji: string;
    value: string;
    label: string;
}) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{emoji}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function ClassAttendanceRow({ item }: { item: ClassDashboardStats }) {
    const percentage = Math.round(Number(item.attendancePercentage || 0));

    return (
        <View style={styles.classRow}>
            <View style={styles.classRowTop}>
                <View style={styles.classBadge}>
                    <Text style={styles.classBadgeText}>{item.className}-{item.section}</Text>
                </View>

                <View style={styles.percentPill}>
                    <Text style={styles.percentText}>{percentage}%</Text>
                </View>
            </View>

            <Text style={styles.classTitle}>Class {item.className} - Section {item.section}</Text>

            <View style={styles.classStatsRow}>
                <MiniStat label="Total" value={item.totalRecords} />
                <MiniStat label="Present" value={item.present} />
                <MiniStat label="Absent" value={item.absent} />
                <MiniStat label="Late" value={item.late} />
            </View>
        </View>
    );
}

function MiniStat({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.miniStat}>
            <Text style={styles.miniStatValue}>{Number(value || 0)}</Text>
            <Text style={styles.miniStatLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#F6E7B5',
    },

    container: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 72,
        paddingBottom: 140,
    },

    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },

    circleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.72)',
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },

    circleButtonPlaceholder: {
        width: 40,
        height: 40,
    },

    circleButtonText: {
        fontSize: 38,
        lineHeight: 42,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 21,
        fontWeight: '900',
        color: colors.primaryNavy,
        paddingHorizontal: spacing.sm,
    },

    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.86)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },

    heroEyebrow: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    heroTitle: {
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.sm,
    },

    heroSubText: {
        fontSize: 15,
        lineHeight: 23,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.md,
    },

    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 34,
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
        fontSize: 14,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    sectionTitle: {
        fontSize: 23,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.xs,
    },

    statusPill: {
        backgroundColor: '#E8F8EF',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 20,
    },

    statusPillText: {
        fontSize: 14,
        fontWeight: '900',
        color: '#16834A',
    },

    loadingBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
    },

    loadingText: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.md,
    },

    errorText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#B42318',
        marginBottom: spacing.md,
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    statCard: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: 20,
        borderWidth: 1.4,
        borderColor: colors.cardGoldBorder,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        marginBottom: spacing.lg,
    },

    statEmoji: {
        fontSize: 21,
        marginBottom: spacing.sm,
    },

    statValue: {
        fontSize: 21,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    statLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.slateText,
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

    listCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        ...shadows.medium,
    },

    classRow: {
        backgroundColor: '#FFF8E1',
        borderRadius: 24,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginTop: spacing.lg,
    },

    classRowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },

    classBadge: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 18,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },

    classBadgeText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.premiumGold,
    },

    percentPill: {
        backgroundColor: '#E8F8EF',
        borderRadius: 18,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },

    percentText: {
        fontSize: 15,
        fontWeight: '900',
        color: '#16834A',
    },

    classTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.md,
    },

    classStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    miniStat: {
        width: '23%',
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.38)',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },

    miniStatValue: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    miniStatLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.xs,
    },

    emptyText: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.lg,
    },
});
