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

            const response = await fetch(
                `${API_ENDPOINTS.adminDashboard}?date=${today}`
            );
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

    const goTo = (path: string) => {
        router.push(path as any);
    };

    const openComingSoon = (title: string) => {
        Alert.alert('Coming Soon', `${title} screen will be connected next.`);
    };

    const adminTiles = [
        {
            icon: '🎓',
            title: 'Student Dashboard',
            subtitle: 'Attendance and student alerts',
            onPress: () => goTo('/home'),
        },
        {
            icon: '👨‍🏫',
            title: 'Teacher Dashboard',
            subtitle: 'Teachers, schedules and leaves',
            onPress: () => goTo('/admin-teacher-dashboard'),
        },
        {
            icon: '🗓️',
            title: 'Leave Planning',
            subtitle: 'Plan and assign replacements',
            onPress: () => goTo('/teacher-leave-planning'),
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
            onPress: () => goTo('/attendance-report'),
        },
        {
            icon: '📥',
            title: 'Import School Data',
            subtitle: 'Students, parents and teachers',
            onPress: () => openComingSoon('Import School Data'),
        },
        {
            icon: '➕',
            title: 'Register Teacher',
            subtitle: 'Create teacher account',
            onPress: () => openComingSoon('Register Teacher'),
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
            onPress: () => goTo('/attendance'),
        },
        {
            icon: '📊',
            title: 'Dashboard',
            subtitle: 'Today and class-wise view',
            onPress: () => goTo('/teacher-dashboard'),
        },
        {
            icon: '📅',
            title: 'Date Summary',
            subtitle: 'View date-wise summary',
            onPress: () => goTo('/date-summary'),
        },
        {
            icon: '📄',
            title: 'Reports',
            subtitle: 'Attendance reports',
            onPress: () => goTo('/attendance-report'),
        },
    ];

    const readonlyTiles = [
        {
            icon: '📈',
            title: isParent ? 'Child Attendance' : 'My Attendance',
            subtitle: 'Read-only attendance summary',
            onPress: () =>
                openComingSoon(
                    isParent ? 'Child Attendance' : 'My Attendance'
                ),
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

    const tiles = isAdmin
        ? adminTiles
        : isTeacher
            ? teacherTiles
            : readonlyTiles;

    return (
        <View style={styles.screen}>
            <ImageBackground
                source={require('../assets/branding/splash-bg.png')}
                style={styles.hero}
                resizeMode="cover"
                blurRadius={6}
            >
                <View style={styles.heroOverlay}>
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
            </ImageBackground>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator
                            size="large"
                            color={colors.premiumGold}
                        />
                        <Text style={styles.loadingText}>
                            Loading dashboard...
                        </Text>
                    </View>
                ) : (
                    <>
                        {(isAdmin || isTeacher) && (
                            <View style={styles.overviewCard}>
                                <Text style={styles.sectionTitle}>
                                    Today&apos;s Overview
                                </Text>

                                <View style={styles.statsGrid}>
                                    <StatCard
                                        icon="👥"
                                        label="Total"
                                        value={String(
                                            isAdmin
                                                ? adminDashboard.totalStudents
                                                : 4
                                        )}
                                    />
                                    <StatCard
                                        icon="✅"
                                        label="Present"
                                        value={String(
                                            isAdmin
                                                ? adminDashboard.presentStudents
                                                : '86%'
                                        )}
                                    />
                                    <StatCard
                                        icon="🚫"
                                        label="Absent"
                                        value={String(
                                            isAdmin
                                                ? adminDashboard.absentStudents
                                                : 0
                                        )}
                                    />
                                    <StatCard
                                        icon="⏰"
                                        label="Late"
                                        value={String(
                                            isAdmin
                                                ? adminDashboard.lateStudents
                                                : 2
                                        )}
                                    />
                                </View>

                                <View style={styles.percentageBox}>
                                    <Text style={styles.percentageLabel}>
                                        Attendance Percentage
                                    </Text>
                                    <Text style={styles.percentageValue}>
                                        {isAdmin
                                            ? `${adminDashboard.attendancePercentage.toFixed(
                                                2
                                            )}%`
                                            : '86%'}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {(isParent || isStudent) && (
                            <View style={styles.overviewCard}>
                                <Text style={styles.sectionTitle}>
                                    Read Only Access
                                </Text>

                                <View style={styles.readonlyBanner}>
                                    <Text style={styles.readonlyIcon}>🔒</Text>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.readonlyTitle}>
                                            View Access
                                        </Text>
                                        <Text style={styles.readonlyText}>
                                            Attendance, results, events and
                                            notifications.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <Text style={styles.quickActionTitle}>
                            Quick Actions
                        </Text>

                        <View style={styles.tileGrid}>
                            {tiles.map((item) => (
                                <TouchableOpacity
                                    key={item.title}
                                    style={styles.actionTile}
                                    activeOpacity={0.88}
                                    onPress={item.onPress}
                                >
                                    <Text style={styles.tileIcon}>
                                        {item.icon}
                                    </Text>
                                    <Text style={styles.tileTitle}>
                                        {item.title}
                                    </Text>
                                    <Text style={styles.tileSubtitle}>
                                        {item.subtitle}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={logout}
                        >
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
        <TouchableOpacity
            style={[styles.tabItem, active && styles.activeTab]}
        >
            <Text style={styles.tabIcon}>{icon}</Text>
            <Text
                style={[styles.tabText, active && styles.activeTabText]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFF8DF',
    },

    hero: {
        height: 260,
        backgroundColor: colors.primaryNavy,
    },

    heroOverlay: {
        flex: 1,
        paddingTop: 58,
        paddingHorizontal: 24,
        backgroundColor: 'rgba(212, 175, 55, 0.82)',
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
        backgroundColor: 'rgba(255,255,255,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    roundButtonText: {
        fontSize: 22,
        color: '#111827',
        fontWeight: '900',
    },

    goodMorning: {
        fontSize: 18,
        color: colors.primaryNavy,
        fontWeight: '700',
    },

    name: {
        fontSize: 38,
        color: colors.primaryNavy,
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
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        marginTop: 10,
    },

    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '700',
    },

    overviewCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 14,
        marginTop: 4,
    },

    quickActionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
        marginBottom: 14,
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    statCard: {
        width: '47.8%',
        backgroundColor: '#FFFDF7',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F2D887',
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
        color: '#111827',
    },

    statLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
        marginTop: 4,
    },

    percentageBox: {
        marginTop: 14,
        backgroundColor: '#FFF6CC',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E9C84A',
    },

    percentageLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '800',
    },

    percentageValue: {
        fontSize: 30,
        color: '#8A610D',
        fontWeight: '900',
        marginTop: 4,
    },

    readonlyBanner: {
        flexDirection: 'row',
        gap: 14,
        alignItems: 'center',
        backgroundColor: '#FFF6CC',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E9C84A',
    },

    readonlyIcon: {
        fontSize: 34,
    },

    readonlyTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#111827',
    },

    readonlyText: {
        fontSize: 14,
        color: '#6B7280',
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
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0D58A',
        shadowColor: '#000',
        shadowOpacity: 0.08,
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
        color: '#111827',
        fontWeight: '900',
        marginBottom: 6,
    },

    tileSubtitle: {
        fontSize: 12.5,
        color: '#6B7280',
        fontWeight: '600',
        lineHeight: 18,
    },

    logoutButton: {
        marginTop: 24,
        backgroundColor: '#FEE2E2',
        borderRadius: 18,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },

    logoutText: {
        color: '#DC2626',
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
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOpacity: 0.16,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F1E0A5',
    },

    tabItem: {
        width: 76,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 24,
    },

    activeTab: {
        backgroundColor: '#FFF3C4',
    },

    tabIcon: {
        fontSize: 21,
    },

    tabText: {
        fontSize: 11.5,
        fontWeight: '800',
        color: '#6B7280',
        marginTop: 3,
    },

    activeTabText: {
        color: '#8A610D',
    },
});