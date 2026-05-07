import React, { useMemo, useState } from 'react';
import {
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

    const todayStats = {
        totalClasses: '4',
        completedAttendance: '2',
        pendingAttendance: '2',
        attendancePercent: '86%',
    };

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
                        style={styles.circleButton}
                        onPress={() => router.push('/teacher-notifications' as any)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.circleButtonText}>🔔</Text>
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
                            <Text style={styles.statusPillText}>Live</Text>
                        </View>
                    </View>

                    <View style={styles.statsGrid}>
                        <StatCard
                            emoji="📚"
                            value={todayStats.totalClasses}
                            label="Classes"
                        />

                        <StatCard
                            emoji="✅"
                            value={todayStats.completedAttendance}
                            label="Completed"
                        />

                        <StatCard
                            emoji="🕒"
                            value={todayStats.pendingAttendance}
                            label="Pending"
                        />

                        <StatCard
                            emoji="📊"
                            value={todayStats.attendancePercent}
                            label="Average"
                        />
                    </View>
                </View>
            </ScrollView>

            <Modal visible={menuVisible} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <Text style={styles.menuTitle}>Teacher Menu</Text>

                        <MenuItem
                            title="Dashboard"
                            onPress={() => setMenuVisible(false)}
                        />

                        <MenuItem
                            title="Take Attendance"
                            onPress={goToTakeAttendance}
                        />

                        <MenuItem
                            title="Date Summary"
                            onPress={() => {
                                setMenuVisible(false);
                                router.push({
                                    pathname: '/date-summary',
                                    params: {
                                        teacherId,
                                        teacherName,
                                        role,
                                    },
                                } as any);
                            }}
                        />

                        <MenuItem
                            title="Reports"
                            onPress={() => {
                                setMenuVisible(false);
                                router.push({
                                    pathname: '/attendance-report',
                                    params: {
                                        teacherId,
                                        teacherName,
                                        role,
                                    },
                                } as any);
                            }}
                        />

                        <MenuItem
                            title="Replacements"
                            onPress={() => {
                                setMenuVisible(false);
                                router.push({
                                    pathname: '/teacher-replacements',
                                    params: {
                                        teacherId,
                                        teacherName,
                                        role,
                                    },
                                } as any);
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

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },

    menuContainer: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: spacing.xl,
    },

    menuTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.lg,
    },

    menuItem: {
        backgroundColor: '#FFF8E1',
        borderRadius: 18,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },

    menuItemDanger: {
        backgroundColor: '#FFE8E8',
    },

    menuItemText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primaryNavy,
    },

    menuItemTextDanger: {
        color: '#B42318',
    },
});