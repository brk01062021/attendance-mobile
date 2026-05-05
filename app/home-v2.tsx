import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ImageBackground,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '../src/services/api';
import { colors } from '../src/theme';

type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

type AdminDashboard = {
    attendanceDate: string;
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    lateStudents: number;
    attendancePercentage: number;
};

export default function HomeV2Screen() {
    const { role, teacherId, teacherName } = useLocalSearchParams();

    const userRole = String(role || 'TEACHER').toUpperCase() as UserRole;
    const isAdmin = userRole === 'ADMIN';
    const isTeacher = userRole === 'TEACHER';
    const isParent = userRole === 'PARENT';
    const isStudent = userRole === 'STUDENT';

    const today = new Date().toISOString().split('T')[0];

    const [loading, setLoading] = useState(false);
    const [adminDashboard, setAdminDashboard] = useState<AdminDashboard>({
        attendanceDate: today,
        totalStudents: 0,
        presentStudents: 0,
        absentStudents: 0,
        lateStudents: 0,
        attendancePercentage: 0,
    });

    const displayName = useMemo(() => {
        if (isAdmin) return 'Principal';
        if (isTeacher) return String(teacherName || 'Teacher');
        if (isParent) return 'Parent';
        if (isStudent) return 'Student';
        return 'User';
    }, [isAdmin, isTeacher, isParent, isStudent, teacherName]);

    useEffect(() => {
        if (isAdmin) {
            loadAdminDashboard();
        }
    }, [isAdmin]);

    const loadAdminDashboard = async () => {
        try {
            setLoading(true);

            const response = await fetch(`${API_ENDPOINTS.adminDashboard}?date=${today}`);
            const data = await response.json();

            setAdminDashboard({
                attendanceDate: data.attendanceDate || today,
                totalStudents: data.totalStudents || data.totalRecords || 0,
                presentStudents: data.presentStudents || data.present || 0,
                absentStudents: data.absentStudents || data.absent || 0,
                lateStudents: data.lateStudents || data.late || 0,
                attendancePercentage: data.attendancePercentage || 0,
            });
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load admin dashboard');
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        router.replace('/login' as any);
    };

    const goToAdminStudentDashboard = () => {
        router.push({
            pathname: '/home',
            params: {
                role: 'ADMIN',
                principalName: 'Principal',
            },
        } as any);
    };

    const goToTeacherLoadStudents = () => {
        router.push({
            pathname: '/home',
            params: {
                role: 'TEACHER',
                teacherId,
                teacherName,
            },
        } as any);
    };

    const goToTeacherDashboard = () => {
        router.push({
            pathname: '/teacher-dashboard',
            params: {
                role: userRole,
                teacherId,
                teacherName,
            },
        } as any);
    };

    const goToDateSummary = () => {
        router.push({
            pathname: '/date-summary',
            params: {
                role: userRole,
                teacherId,
                teacherName,
            },
        } as any);
    };

    const goToAttendanceReport = () => {
        router.push({
            pathname: '/attendance-report',
            params: {
                role: userRole,
                teacherId,
                teacherName,
            },
        } as any);
    };

    const openComingSoon = (title: string) => {
        Alert.alert('Coming Soon', `${title} screen will be connected next.`);
    };

    const adminTiles = [
        {
            icon: '🎓',
            title: 'Student Dashboard',
            subtitle: 'View all students, attendance alerts and reports',
            onPress: goToAdminStudentDashboard,
        },
        {
            icon: '✅',
            title: 'Take Attendance',
            subtitle: 'Principal class attendance flow',
            onPress: () => openComingSoon('Principal Take Attendance'),
        },
        {
            icon: '👨‍🏫',
            title: 'Teacher Dashboard',
            subtitle: 'Teachers, schedules and leaves',
            onPress: () => router.push('/admin-teacher-dashboard' as any),
        },
        {
            icon: '🗓️',
            title: 'Leave Planning',
            subtitle: 'Plan and assign replacements',
            onPress: () => router.push('/teacher-leave-planning' as any),
        },
        {
            icon: '👨‍👩‍👧',
            title: 'Parent Dashboard',
            subtitle: 'Parent-linked student view',
            onPress: () => openComingSoon('Parent Dashboard'),
        },
        {
            icon: '📊',
            title: 'Attendance Report',
            subtitle: 'School-wide reports',
            onPress: goToAttendanceReport,
        },
        {
            icon: '📥',
            title: 'Import School Data',
            subtitle: 'Students, parents and teachers',
            onPress: () => openComingSoon('Import School Data'),
        },
        {
            icon: '📚',
            title: 'Teacher Assignments',
            subtitle: 'Class, section and subject mapping',
            onPress: () => openComingSoon('Teacher Assignments'),
        },
    ];

    const teacherTiles = [
        {
            icon: '✅',
            title: 'Take Attendance',
            subtitle: 'Submit class attendance',
            onPress: goToTeacherLoadStudents,
        },
        {
            icon: '📊',
            title: 'Dashboard',
            subtitle: 'Today and class-wise view',
            onPress: goToTeacherDashboard,
        },
        {
            icon: '📅',
            title: 'Date Summary',
            subtitle: 'View date-wise summary',
            onPress: goToDateSummary,
        },
        {
            icon: '📄',
            title: 'Reports',
            subtitle: 'Attendance reports',
            onPress: goToAttendanceReport,
        },
    ];

    const readonlyTiles = [
        {
            icon: '📈',
            title: isParent ? 'Child Attendance' : 'My Attendance',
            subtitle: 'Read-only attendance summary',
            onPress: () => openComingSoon(isParent ? 'Child Attendance' : 'My Attendance'),
        },
        {
            icon: '📢',
            title: 'Notifications',
            subtitle: 'School updates and alerts',
            onPress: () => openComingSoon('Notifications'),
        },
        {
            icon: '🧾',
            title: 'Results',
            subtitle: 'Exam result updates',
            onPress: () => openComingSoon('Results'),
        },
        {
            icon: '🏫',
            title: 'Events',
            subtitle: 'School events and holidays',
            onPress: () => openComingSoon('Events'),
        },
    ];

    const tiles = isAdmin ? adminTiles : isTeacher ? teacherTiles : readonlyTiles;

    return (
        <ImageBackground
            source={require('../assets/branding/splash-dark.png')}
            style={styles.screen}
            resizeMode="cover"
            blurRadius={2}
        >
            <View style={styles.pageOverlay}>
                <View style={styles.hero}>
                    <View style={styles.topRow}>
                        <TouchableOpacity style={styles.roundButton}>
                            <Text style={styles.roundButtonText}>☰</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.roundButton}>
                            <Text style={styles.roundButtonText}>🔔</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.goodMorning}>Good Morning 👋</Text>
                    <Text style={styles.name}>{displayName}</Text>
                </View>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {loading ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color={colors.premiumGold} />
                            <Text style={styles.loadingText}>Loading dashboard...</Text>
                        </View>
                    ) : (
                        <>
                            {isAdmin && (
                                <View style={styles.overviewCard}>
                                    <Text style={styles.sectionTitle}>Today&apos;s Overview</Text>

                                    <View style={styles.statsGrid}>
                                        <StatCard icon="👥" label="Total" value={String(adminDashboard.totalStudents)} />
                                        <StatCard icon="✅" label="Present" value={String(adminDashboard.presentStudents)} />
                                        <StatCard icon="🚫" label="Absent" value={String(adminDashboard.absentStudents)} />
                                        <StatCard icon="⏰" label="Late" value={String(adminDashboard.lateStudents)} />
                                    </View>

                                    <View style={styles.percentageBox}>
                                        <Text style={styles.percentageLabel}>Attendance Percentage</Text>
                                        <Text style={styles.percentageValue}>
                                            {adminDashboard.attendancePercentage.toFixed(2)}%
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {isTeacher && (
                                <View style={styles.overviewCard}>
                                    <Text style={styles.sectionTitle}>Teacher Workspace</Text>

                                    <View style={styles.statsGrid}>
                                        <StatCard icon="📚" label="Classes" value="4" />
                                        <StatCard icon="🕒" label="Periods Left" value="2" />
                                        <StatCard icon="✅" label="Attendance" value="86%" />
                                        <StatCard icon="🗓️" label="Leaves" value="0" />
                                    </View>

                                    <View style={styles.percentageBox}>
                                        <Text style={styles.percentageLabel}>Attendance Percentage</Text>
                                        <Text style={styles.percentageValue}>86%</Text>
                                    </View>
                                </View>
                            )}

                            {(isParent || isStudent) && (
                                <View style={styles.overviewCard}>
                                    <Text style={styles.sectionTitle}>Read Only Access</Text>

                                    <View style={styles.readonlyBanner}>
                                        <Text style={styles.readonlyIcon}>🔒</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.readonlyTitle}>View Access</Text>
                                            <Text style={styles.readonlyText}>
                                                Attendance, results, events and notifications.
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            )}

                            <Text style={styles.quickActionTitle}>Quick Actions</Text>

                            <View style={styles.tileGrid}>
                                {tiles.map((item) => (
                                    <TouchableOpacity
                                        key={item.title}
                                        style={styles.actionTile}
                                        activeOpacity={0.88}
                                        onPress={item.onPress}
                                    >
                                        <Text style={styles.tileIcon}>{item.icon}</Text>
                                        <Text style={styles.tileTitle}>{item.title}</Text>
                                        <Text style={styles.tileSubtitle}>{item.subtitle}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </ScrollView>

                <View style={styles.bottomTabs}>
                    <Tab icon="🏠" label="Home" active />
                    <Tab icon="✅" label="Attendance" />
                    <Tab icon="📊" label="Reports" />
                    <Tab icon="⚙️" label="Settings" />
                </View>
            </View>
        </ImageBackground>
    );
}

function StatCard({
                      icon,
                      label,
                      value,
                  }: {
    icon: string;
    label: string;
    value: string;
}) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function Tab({
                 icon,
                 label,
                 active,
             }: {
    icon: string;
    label: string;
    active?: boolean;
}) {
    return (
        <TouchableOpacity style={[styles.tabItem, active && styles.activeTab]}>
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    pageOverlay: {
        flex: 1,
        backgroundColor: 'rgba(4, 18, 38, 0.70)',
    },
    hero: {
        height: 260,
        paddingTop: 58,
        paddingHorizontal: 24,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    roundButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(4, 18, 38, 0.72)',
        borderWidth: 1,
        borderColor: '#D8B84A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundButtonText: {
        fontSize: 22,
        color: '#D8B84A',
        fontWeight: '900',
    },
    goodMorning: {
        fontSize: 18,
        color: '#D8B84A',
        fontWeight: '800',
    },
    name: {
        fontSize: 38,
        color: '#FFFFFF',
        fontWeight: '900',
        marginTop: 2,
    },
    content: {
        flex: 1,
        marginTop: -42,
    },
    contentContainer: {
        paddingHorizontal: 18,
        paddingBottom: 118,
    },
    loadingBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#041226',
        fontWeight: '700',
    },
    overviewCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: 24,
        padding: 16,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#041226',
        marginBottom: 14,
        marginTop: 4,
    },
    quickActionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#D8B84A',
        marginBottom: 14,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statCard: {
        width: '47.8%',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#D8B84A',
        paddingVertical: 15,
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    statValue: {
        fontSize: 25,
        fontWeight: '900',
        color: '#041226',
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '800',
        color: '#5D6675',
        marginTop: 4,
    },
    percentageBox: {
        marginTop: 14,
        backgroundColor: '#041226',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    percentageLabel: {
        fontSize: 14,
        color: '#D8B84A',
        fontWeight: '900',
    },
    percentageValue: {
        fontSize: 30,
        color: '#FFFFFF',
        fontWeight: '900',
        marginTop: 4,
    },
    readonlyBanner: {
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center',
        backgroundColor: '#041226',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    readonlyIcon: {
        fontSize: 34,
    },
    readonlyTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#D8B84A',
    },
    readonlyText: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginTop: 4,
        lineHeight: 20,
    },
    tileGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    actionTile: {
        width: '48%',
        minHeight: 140,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: '#D8B84A',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 5 },
        elevation: 3,
    },
    tileIcon: {
        fontSize: 30,
        marginBottom: 10,
    },
    tileTitle: {
        fontSize: 16,
        color: '#041226',
        fontWeight: '900',
        marginBottom: 6,
    },
    tileSubtitle: {
        fontSize: 12.5,
        color: '#5D6675',
        fontWeight: '700',
        lineHeight: 18,
    },
    logoutButton: {
        marginTop: 24,
        backgroundColor: '#041226',
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    logoutText: {
        color: '#D8B84A',
        fontSize: 17,
        fontWeight: '900',
    },
    bottomTabs: {
        position: 'absolute',
        left: 18,
        right: 18,
        bottom: 22,
        height: 74,
        borderRadius: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    tabItem: {
        width: 76,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 24,
    },
    activeTab: {
        backgroundColor: '#041226',
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    tabIcon: {
        fontSize: 21,
    },
    tabText: {
        fontSize: 11.5,
        fontWeight: '800',
        color: '#5D6675',
        marginTop: 3,
    },
    activeTabText: {
        color: '#D8B84A',
    },
});