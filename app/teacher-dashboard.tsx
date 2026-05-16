import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';
import { API_BASE_URL, DEV_DEFAULTS } from '../src/services/api';



// Temporary test date because your current sample attendance data exists on 2026-04-27.
// For production/current-day data, change this to an empty string: ''
const DEV_TEST_ATTENDANCE_DATE = DEV_DEFAULTS.dashboardDate;

const formatDateForApi = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

type TeacherDashboardStats = {
    teacherId: number | null;
    teacherName: string;
    totalStudents: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
};

const defaultStats: TeacherDashboardStats = {
    teacherId: null,
    teacherName: '',
    totalStudents: 0,
    present: 0,
    absent: 0,
    late: 0,
    attendancePercentage: 0,
};

export default function TeacherDashboard() {
    const params = useLocalSearchParams();

    const teacherId = params.teacherId;
    const teacherName = params.teacherName;
    const role = params.role || 'TEACHER';

    const displayTeacherName = useMemo(() => {
        const name = String(teacherName || '').trim();
        return name.length > 0 ? name : 'Teacher';
    }, [teacherName]);

    const [menuVisible, setMenuVisible] = useState(false);
    const [dashboardStats, setDashboardStats] = useState<TeacherDashboardStats>(defaultStats);
    const [loadingStats, setLoadingStats] = useState(false);
    const [statsError, setStatsError] = useState('');

    const todayDate = useMemo(() => DEV_TEST_ATTENDANCE_DATE || formatDateForApi(new Date()), []);

    useEffect(() => {
        const loadTeacherDashboard = async () => {
            const safeTeacherId = String(teacherId || '').trim();

            if (!safeTeacherId) {
                setDashboardStats(defaultStats);
                setStatsError('Teacher profile not found');
                return;
            }

            setLoadingStats(true);
            setStatsError('');

            try {
                const response = await fetch(
                    `${API_BASE_URL}/attendance/dashboard/teacher?teacherId=${encodeURIComponent(
                        safeTeacherId
                    )}&date=${todayDate}`
                );

                if (!response.ok) {
                    throw new Error('Unable to load teacher dashboard');
                }

                const data = await response.json();

                setDashboardStats({
                    teacherId: data.teacherId ?? null,
                    teacherName: data.teacherName ?? '',
                    totalStudents: Number(data.totalStudents ?? 0),
                    present: Number(data.present ?? 0),
                    absent: Number(data.absent ?? 0),
                    late: Number(data.late ?? 0),
                    attendancePercentage: Number(data.attendancePercentage ?? 0),
                });
            } catch (error) {
                setDashboardStats(defaultStats);
                setStatsError('Live data unavailable');
            } finally {
                setLoadingStats(false);
            }
        };

        loadTeacherDashboard();
    }, [teacherId, todayDate]);

    const todayStats = useMemo(() => {
        const totalMarked =
            dashboardStats.present + dashboardStats.absent + dashboardStats.late;

        return {
            totalStudents: String(dashboardStats.totalStudents || totalMarked || 0),
            present: String(dashboardStats.present || 0),
            absent: String(dashboardStats.absent || 0),
            attendancePercent: `${Math.round(dashboardStats.attendancePercentage || 0)}%`,
        };
    }, [dashboardStats]);

    const goToTakeAttendance = () => {
        setMenuVisible(false);

        router.replace({
            pathname: '/home',
            params: {
                teacherId,
                teacherName,
                role,
            },
        } as any);
    };

    return (
        <ImageBackground
            source={require('../assets/branding/splash-dark.png')}
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
                        onPress={() => setMenuVisible(true)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.circleButtonText}>☰</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Teacher Dashboard</Text>

                    <TouchableOpacity
                        style={styles.headerLogoutButton}
                        onPress={() => router.replace('/login' as any)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.headerLogoutText}>⏻</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.heroSmallText}>Good morning</Text>

                    <Text style={styles.heroName}>{displayTeacherName}</Text>

                    <Text style={styles.heroSubText}>
                        Manage today&apos;s classes, attendance, reports and replacement updates.
                    </Text>
                </View>

                <View style={styles.classesCard}>
                    <Text style={styles.sectionEyebrow}>My Classes</Text>
                    <Text style={styles.sectionTitle}>Today&apos;s Schedule</Text>

                    <ScheduleRow
                        time="09:00 AM"
                        subject="Mathematics"
                        className="Class 8 - A"
                        status="Attendance Done"
                        done
                    />

                    <ScheduleRow
                        time="10:00 AM"
                        subject="Science"
                        className="Class 7 - B"
                        status="Pending"
                    />

                    <ScheduleRow
                        time="11:30 AM"
                        subject="English"
                        className="Class 9 - A"
                        status="Pending"
                    />
                </View>

                <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={goToTakeAttendance}
                    activeOpacity={0.9}
                >
                    <View style={styles.primaryActionTextBox}>
                        <Text style={styles.primaryActionTitle}>Take Attendance</Text>

                        <Text style={styles.primaryActionSubtitle}>
                            Select class, section and subject
                        </Text>
                    </View>

                    <Text style={styles.primaryActionArrow}>›</Text>
                </TouchableOpacity>

                <View style={styles.overviewCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderTextBox}>
                            <Text style={styles.sectionEyebrow}>Today</Text>
                            <Text style={styles.sectionTitle}>Attendance Overview</Text>
                        </View>

                        <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>
                                {loadingStats ? 'Loading' : statsError ? 'Offline' : 'Live'}
                            </Text>
                        </View>
                    </View>

                    {loadingStats ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator />
                            <Text style={styles.loadingText}>Loading live attendance...</Text>
                        </View>
                    ) : (
                        <>
                            {statsError ? (
                                <Text style={styles.errorText}>{statsError}</Text>
                            ) : null}

                            <View style={styles.statsGrid}>
                                <StatCard
                                    emoji="👥"
                                    value={todayStats.totalStudents}
                                    label="Students"
                                />

                                <StatCard
                                    emoji="✅"
                                    value={todayStats.present}
                                    label="Present"
                                />

                                <StatCard
                                    emoji="❌"
                                    value={todayStats.absent}
                                    label="Absent"
                                />

                                <StatCard
                                    emoji="📊"
                                    value={todayStats.attendancePercent}
                                    label="Average"
                                />
                            </View>
                        </>
                    )}
                </View>


            </ScrollView>

            <Modal visible={menuVisible} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.menuScrollContent}
                        >
                            <Text style={styles.menuTitle}>Teacher Menu</Text>

                            <MenuSectionTitle title="Home" />
                            <MenuItem title="Home" onPress={() => setMenuVisible(false)} />

                            <MenuSectionTitle title="Attendance" />
                            <MenuItem title="Take Attendance" onPress={goToTakeAttendance} />
                            <MenuItem
                                title="Date Summary"
                                onPress={() => {
                                    setMenuVisible(false);
                                    router.push({ pathname: '/date-summary', params: { teacherId, teacherName, role } } as any);
                                }}
                            />
                            <MenuItem
                                title="Reports"
                                onPress={() => {
                                    setMenuVisible(false);
                                    router.push({ pathname: '/attendance-report', params: { teacherId, teacherName, role } } as any);
                                }}
                            />

                            <MenuSectionTitle title="Planning" />
                            <MenuItem
                                title="Teacher Leave Planning"
                                onPress={() => {
                                    setMenuVisible(false);
                                    router.push({ pathname: '/teacher-leave-planning', params: { teacherId, teacherName, role } } as any);
                                }}
                            />
                            <MenuItem
                                title="Assigned Replacements"
                                onPress={() => {
                                    setMenuVisible(false);
                                    router.push({ pathname: '/teacher-replacements', params: { teacherId, teacherName, role } } as any);
                                }}
                            />

                            <MenuItem
                                title="Logout"
                                danger
                                onPress={() => {
                                    setMenuVisible(false);
                                    router.replace('/login' as any);
                                }}
                            />
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
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

function ScheduleRow({
                         time,
                         subject,
                         className,
                         status,
                         done = false,
                     }: {
    time: string;
    subject: string;
    className: string;
    status: string;
    done?: boolean;
}) {
    return (
        <View style={styles.scheduleRow}>
            <View style={styles.scheduleTimeBox}>
                <Text style={styles.scheduleTime}>{time}</Text>
            </View>

            <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleSubject}>{subject}</Text>
                <Text style={styles.scheduleClass}>{className}</Text>
            </View>

            <View style={[styles.scheduleStatus, done && styles.scheduleStatusDone]}>
                <Text style={[styles.scheduleStatusText, done && styles.scheduleStatusTextDone]}>
                    {status}
                </Text>
            </View>
        </View>
    );
}

function MenuSectionTitle({ title }: { title: string }) {
    return <Text style={styles.menuSectionTitle}>{title}</Text>;
}

function MenuItem({
                      title,
                      onPress,
                      danger = false,
                  }: {
    title: string;
    onPress: () => void;
    danger?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.menuItem, danger && styles.menuItemDanger]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <Text style={[styles.menuItemText, danger && styles.menuItemTextDanger]}>
                {title}
            </Text>

            <Text style={[styles.menuItemArrow, danger && styles.menuItemTextDanger]}>
                ›
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#061B33',
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
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.28)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    circleButtonText: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.white,
    },

    headerLogoutButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },

    headerLogoutText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '900',
    },

    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 21,
        fontWeight: '900',
        color: colors.white,
        paddingHorizontal: spacing.sm,
    },

    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 34,
        borderWidth: 1.2,
        borderColor: 'rgba(255,255,255,0.25)',
        padding: spacing.xl,
        marginBottom: spacing.xl,
    },

    heroSmallText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.premiumGold,
    },

    heroName: {
        fontSize: 38,
        lineHeight: 44,
        fontWeight: '900',
        color: colors.white,
        marginTop: spacing.sm,
    },

    heroSubText: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.82)',
        marginTop: spacing.md,
    },

    classesCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },

    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        borderRadius: 22,
        padding: spacing.md,
        marginTop: spacing.md,
    },

    scheduleTimeBox: {
        width: 78,
    },

    scheduleTime: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    scheduleInfo: {
        flex: 1,
        paddingHorizontal: spacing.md,
    },

    scheduleSubject: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    scheduleClass: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.slateText,
        marginTop: spacing.xs,
    },

    scheduleStatus: {
        backgroundColor: '#FFF0D1',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: 16,
    },

    scheduleStatusDone: {
        backgroundColor: '#E8F8EF',
    },

    scheduleStatusText: {
        fontSize: 12,
        fontWeight: '900',
        color: '#B36B00',
    },

    scheduleStatusTextDone: {
        color: '#16834A',
    },

    primaryAction: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        ...shadows.medium,
    },

    primaryActionTextBox: {
        flex: 1,
        paddingRight: spacing.md,
    },

    primaryActionTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.white,
    },

    primaryActionSubtitle: {
        fontSize: 15,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.78)',
        marginTop: spacing.sm,
    },

    primaryActionArrow: {
        fontSize: 46,
        fontWeight: '900',
        color: colors.premiumGold,
    },

    overviewCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
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
        borderRadius: 26,
        borderWidth: 1.4,
        borderColor: colors.cardGoldBorder,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        marginBottom: spacing.lg,
    },

    statEmoji: {
        fontSize: 30,
        marginBottom: spacing.sm,
    },

    statValue: {
        fontSize: 30,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    statLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.xs,
    },


    logoutButton: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },

    logoutButtonText: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.premiumGold,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.42)',
        alignItems: 'flex-start',
    },

    menuContainer: {
        width: '82%',
        maxWidth: 360,
        height: '100%',
        backgroundColor: '#FFFDF7',
        borderTopRightRadius: 28,
        borderBottomRightRadius: 28,
        paddingTop: 54,
        paddingHorizontal: 18,
        ...shadows.medium,
    },

    menuScrollContent: {
        paddingBottom: 28,
    },

    menuTitle: {
        color: colors.primaryNavy,
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 18,
    },

    menuSectionTitle: {
        color: colors.deepGold,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 16,
        marginBottom: 8,
    },

    menuItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 15,
        paddingHorizontal: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F0E4C8',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    menuItemDanger: {
        backgroundColor: '#FFF1F0',
        borderColor: '#FFD3CF',
    },

    menuItemText: {
        color: colors.primaryNavy,
        fontSize: 15,
        fontWeight: '900',
    },

    menuItemArrow: {
        color: colors.primaryNavy,
        fontSize: 22,
        fontWeight: '900',
    },

    menuItemTextDanger: {
        color: '#A33A2B',
    },
});
