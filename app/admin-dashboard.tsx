import { router, useLocalSearchParams } from 'expo-router';
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
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { API_BASE_URL, DEV_DEFAULTS } from '../src/services/api';
import { getRoleGreeting, getSession } from '../src/services/sessionService';
import { colors, shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

const DASHBOARD_TEST_DATE = DEV_DEFAULTS.dashboardDate;
const SHOW_ADVANCED_ANALYTICS = false;

type AdminDashboardStats = {
    attendanceDate: string;
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    lateStudents: number;
    attendancePercentage: number;
};

const defaultAdminStats: AdminDashboardStats = {
    attendanceDate: DASHBOARD_TEST_DATE,
    totalStudents: 17,
    presentStudents: 0,
    absentStudents: 0,
    lateStudents: 0,
    attendancePercentage: 0,
};

type ClassDashboardStats = {
    className: string;
    section: string;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
};

type TeacherWiseDashboardStats = {
    teacherId: number | null;
    teacherName: string;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
};

type SubjectDashboardStats = {
    subjectName: string;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
};

export default function AdminDashboardScreen() {
    const [menuVisible, setMenuVisible] = useState(false);
    const [registerModalVisible, setRegisterModalVisible] = useState(false);
    const [dashboardStats, setDashboardStats] = useState<AdminDashboardStats>(defaultAdminStats);
    const [loadingStats, setLoadingStats] = useState(false);
    const [statsError, setStatsError] = useState('');
    const [classBreakdown, setClassBreakdown] = useState<ClassDashboardStats[]>([]);
    const [teacherBreakdown, setTeacherBreakdown] = useState<TeacherWiseDashboardStats[]>([]);
    const [subjectBreakdown, setSubjectBreakdown] = useState<SubjectDashboardStats[]>([]);
    const [loadingBreakdown, setLoadingBreakdown] = useState(false);
    const [breakdownError, setBreakdownError] = useState('');
    const params = useLocalSearchParams<{ adminName?: string; schoolId?: string }>();
    const session = getSession();
    const schoolId = String(params.schoolId || session?.schoolId || 'BRK1').toUpperCase();
    const schoolName = resolveSchoolName(schoolId, session?.schoolName);

    const adminName = useMemo(() => getRoleGreeting('ADMIN', params.adminName || session?.displayName || 'Admin'), [params.adminName, session?.displayName]);

    useEffect(() => {
        const loadAdminDashboard = async () => {
            setLoadingStats(true);
            setStatsError('');

            try {
                const response = await fetch(
                    `${API_BASE_URL}/attendance/dashboard/admin?date=${DASHBOARD_TEST_DATE}`
                );

                if (!response.ok) {
                    throw new Error('Unable to load admin dashboard');
                }

                const data = await response.json();

                setDashboardStats({
                    attendanceDate: data.attendanceDate ?? DASHBOARD_TEST_DATE,
                    totalStudents: Number(data.totalStudents ?? 0),
                    presentStudents: Number(data.presentStudents ?? 0),
                    absentStudents: Number(data.absentStudents ?? 0),
                    lateStudents: Number(data.lateStudents ?? 0),
                    attendancePercentage: Number(data.attendancePercentage ?? 0),
                });
            } catch (error) {
                setDashboardStats(defaultAdminStats);
                setStatsError('Live data unavailable');
            } finally {
                setLoadingStats(false);
            }
        };

        loadAdminDashboard();
    }, []);


    useEffect(() => {
        const loadAdminAnalyticsBreakdown = async () => {
            setLoadingBreakdown(true);
            setBreakdownError('');

            try {
                const [classesResponse, teachersResponse, subjectsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL}/attendance/dashboard/admin/classes?date=${DASHBOARD_TEST_DATE}`),
                    fetch(`${API_BASE_URL}/attendance/dashboard/admin/teachers?date=${DASHBOARD_TEST_DATE}`),
                    fetch(`${API_BASE_URL}/attendance/dashboard/admin/subjects?date=${DASHBOARD_TEST_DATE}`),
                ]);

                if (!classesResponse.ok || !teachersResponse.ok || !subjectsResponse.ok) {
                    throw new Error('Unable to load analytics breakdown');
                }

                const classesData = await classesResponse.json();
                const teachersData = await teachersResponse.json();
                const subjectsData = await subjectsResponse.json();

                setClassBreakdown(Array.isArray(classesData) ? classesData : []);
                setTeacherBreakdown(Array.isArray(teachersData) ? teachersData : []);
                setSubjectBreakdown(Array.isArray(subjectsData) ? subjectsData : []);
            } catch (error) {
                setClassBreakdown([]);
                setTeacherBreakdown([]);
                setSubjectBreakdown([]);
                setBreakdownError('Analytics data unavailable');
            } finally {
                setLoadingBreakdown(false);
            }
        };

        loadAdminAnalyticsBreakdown();
    }, []);

    const todayStats = useMemo(() => {
        const attendanceTaken =
            Number(dashboardStats.presentStudents || 0) +
            Number(dashboardStats.absentStudents || 0) +
            Number(dashboardStats.lateStudents || 0) > 0;

        return {
            totalStudents: String(dashboardStats.totalStudents || 0),
            present: String(dashboardStats.presentStudents || 0),
            absent: String(dashboardStats.absentStudents || 0),
            late: String(dashboardStats.lateStudents || 0),
            attendanceLabel: attendanceTaken ? 'Attendance Percentage' : 'Attendance Pending',
            attendancePercent: attendanceTaken ? `${Math.round(dashboardStats.attendancePercentage || 0)}%` : '--%',
        };
    }, [dashboardStats]);

    const openRoute = (path: string, params: Record<string, string> = {}) => {
        setMenuVisible(false);
        setRegisterModalVisible(false);

        router.push({
            pathname: path as any,
            params: {
                role: 'ADMIN',
                userId: '1',
                name: 'Admin',
                ...params,
            },
        } as any);
    };

    const goToTakeAttendance = () => {
        setMenuVisible(false);
        setRegisterModalVisible(false);

        router.push({
            pathname: '/home',
            params: {
                role: 'ADMIN',
                userId: '1',
                name: 'Admin',
            },
        } as any);
    };

    const openRegisterChooser = () => {
        setMenuVisible(false);
        setRegisterModalVisible(true);
    };

    const logout = () => {
        setMenuVisible(false);
        setRegisterModalVisible(false);
        router.replace('/login' as any);
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
                <DashboardHeader
                    schoolName={schoolName}
                    workspaceTitle="Admin Operations Workspace"
                    roleLabel="ADMIN"
                    schoolId={schoolId}
                    onMenuPress={() => setMenuVisible(true)}
                    onLogoutPress={logout}
                />

                <View style={styles.heroCard}>
                    <Text style={styles.heroGreetingLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Good Morning 🌞 Admin 👨‍💼</Text>
                </View>

                <View style={styles.overviewCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderTextBox}>
                            <Text style={styles.sectionEyebrow}>Today</Text>
                            <Text style={styles.sectionTitle}>School Overview</Text>
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
                            <Text style={styles.loadingText}>Loading live school overview...</Text>
                        </View>
                    ) : (
                        <>
                            {statsError ? (
                                <Text style={styles.errorText}>{statsError}</Text>
                            ) : null}

                            <View style={styles.statsGrid}>
                                <StatCard emoji="👥" value={todayStats.totalStudents} label="Total" />
                                <StatCard emoji="✅" value={todayStats.present} label="Present" />
                                <StatCard emoji="🚫" value={todayStats.absent} label="Absent" />
                                <StatCard emoji="⏰" value={todayStats.late} label="Late" />
                            </View>

                            <View style={styles.percentageBox}>
                                <Text style={styles.percentageLabel}>{todayStats.attendanceLabel}</Text>
                                <Text style={styles.percentageValue}>{todayStats.attendancePercent}</Text>
                            </View>
                        </>
                    )}
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

                <View style={styles.quickActionsCard}>
                    <Text style={styles.sectionEyebrow}>Quick Actions</Text>
                    <Text style={styles.sectionTitle}>Admin Tools</Text>

                    <View style={styles.quickGrid}>
                        <QuickAction
                            emoji="✅"
                            title="Teacher Replacements"
                            subtitle="Leave replacement flow"
                            onPress={() => openRoute('/admin-teacher-dashboard')}
                        />

                        <QuickAction
                            emoji="🛡️"
                            title="Leave Approvals"
                            subtitle="Approve leave requests"
                            onPress={() => openRoute('/admin-leave-approvals')}
                        />

                        <QuickAction
                            emoji="⚖️"
                            title="Workload Protection"
                            subtitle="Fatigue and overload check"
                            onPress={() => openRoute('/teacher-workload-protection')}
                        />

                        <QuickAction
                            emoji="🚨"
                            title="Student Risk"
                            subtitle="Attendance recovery alerts"
                            onPress={() => openRoute('/student-risk-dashboard')}
                        />

                        <QuickAction
                            emoji="🔒"
                            title="Timetable Operations"
                            subtitle="Lock, export, versions"
                            onPress={() => openRoute('/timetable-operations', { role: 'ADMIN', sourceRole: 'admin' })}
                        />


                        <QuickAction
                            emoji="🔐"
                            title="User Credentials"
                            subtitle="Teacher/student login downloads"
                            onPress={() => openRoute('/user-credentials', { role: 'ADMIN', sourceRole: 'admin' })}
                        />

                        <QuickAction
                            emoji="📝"
                            title="Register Here"
                            subtitle="Teacher, student or parent"
                            onPress={openRegisterChooser}
                        />

                    </View>
                </View>

                <View style={styles.analyticsCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderTextBox}>
                            <Text style={styles.sectionEyebrow}>Analytics</Text>
                            <Text style={styles.sectionTitle}>Attendance Breakdown</Text>
                        </View>

                        <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>
                                {loadingBreakdown ? 'Loading' : breakdownError ? 'Offline' : 'Live'}
                            </Text>
                        </View>
                    </View>

                    {loadingBreakdown ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator />
                            <Text style={styles.loadingText}>Loading class-wise analytics...</Text>
                        </View>
                    ) : (
                        <>
                            {breakdownError ? (
                                <Text style={styles.errorText}>{breakdownError}</Text>
                            ) : null}

                            <TouchableOpacity
                                style={styles.breakdownNavigationCard}
                                onPress={() => openRoute('/class-wise-attendance', { date: DASHBOARD_TEST_DATE })}
                                activeOpacity={0.88}
                            >
                                <View style={styles.breakdownNavigationIconBox}>
                                    <Text style={styles.breakdownNavigationIcon}>🏫</Text>
                                </View>

                                <View style={styles.breakdownNavigationTextBox}>
                                    <Text style={styles.breakdownNavigationTitle}>Class-wise Attendance</Text>
                                    <Text style={styles.breakdownNavigationSubtitle}>
                                        View attendance by class and section
                                    </Text>
                                    <Text style={styles.breakdownNavigationMeta}>
                                        {classBreakdown.length > 0
                                            ? `${classBreakdown.length} class sections available`
                                            : 'Tap to view class attendance'}
                                    </Text>
                                </View>

                                <Text style={styles.breakdownNavigationArrow}>›</Text>
                            </TouchableOpacity>

                            {SHOW_ADVANCED_ANALYTICS ? (
                                <>
                                    <AnalyticsSection title="Teacher-wise Attendance">
                                        {teacherBreakdown.length > 0 ? (
                                            teacherBreakdown.map((item) => (
                                                <AnalyticsRow
                                                    key={`${item.teacherId}-${item.teacherName}`}
                                                    title={item.teacherName || 'Teacher'}
                                                    subtitle={`Total ${item.totalRecords}  •  P ${item.present}  •  A ${item.absent}  •  L ${item.late}`}
                                                    percentage={item.attendancePercentage}
                                                />
                                            ))
                                        ) : (
                                            <Text style={styles.emptyAnalyticsText}>No teacher-wise data available.</Text>
                                        )}
                                    </AnalyticsSection>

                                    <AnalyticsSection title="Subject-wise Attendance">
                                        {subjectBreakdown.length > 0 ? (
                                            subjectBreakdown.map((item) => (
                                                <AnalyticsRow
                                                    key={item.subjectName}
                                                    title={item.subjectName || 'Subject'}
                                                    subtitle={`Total ${item.totalRecords}  •  P ${item.present}  •  A ${item.absent}  •  L ${item.late}`}
                                                    percentage={item.attendancePercentage}
                                                />
                                            ))
                                        ) : (
                                            <Text style={styles.emptyAnalyticsText}>No subject-wise data available.</Text>
                                        )}
                                    </AnalyticsSection>
                                </>
                            ) : null}
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
                            <Text style={styles.menuTitle}>Admin Menu</Text>

                            <MenuSectionTitle title="Home" />

                            <MenuItem
                                title="Home"
                                onPress={() => setMenuVisible(false)}
                            />

                            <MenuItem
                                title="School Intelligence"
                                onPress={() => openRoute('/principal-dashboard')}
                            />

                            <MenuItem
                                title="Operational Analytics"
                                onPress={() => openRoute('/operational-analytics')}
                            />

                            <MenuSectionTitle title="Operations" />

                            <MenuItem
                                title="Take Attendance"
                                onPress={goToTakeAttendance}
                            />

                            <MenuItem
                                title="Admin Reports"
                                onPress={() => openRoute('/attendance-report')}
                            />

                            <MenuItem
                                title="Teacher Reports"
                                onPress={() => openRoute('/attendance-report', { initialView: 'teacherReport', fromAdminMenu: 'true' })}
                            />

                            <MenuItem
                                title="Teacher Leave Planning"
                                onPress={() => openRoute('/admin-leave-approvals')}
                            />

                            <MenuItem
                                title="Teacher Assignments"
                                onPress={() => openRoute('/teacher-assignments')}
                            />

                            <MenuItem
                                title="Fee Reminder"
                                onPress={() => openRoute('/fee-reminders', { role: 'ADMIN', sourceRole: 'admin' })}
                            />

                            <MenuSectionTitle title="Scheduling" />

                            <MenuItem
                                title="Generate Timetable"
                                onPress={() => openRoute('/generate-timetable', { role: 'ADMIN', sourceRole: 'admin' })}
                            />

                            <MenuItem
                                title="Import Existing Timetable"
                                onPress={() =>
                                    openRoute('/import-existing-timetable', {
                                        role: 'ADMIN',
                                        sourceRole: 'admin',
                                    })
                                }
                            />



                            <MenuItem
                                title="Recover Missed Attendance"
                                onPress={() =>
                                    openRoute('/recover-missed-attendance', {
                                        role: 'ADMIN',
                                        sourceRole: 'admin',
                                    })
                                }
                            />

                            <MenuItem
                                title="Timetable Operations"
                                onPress={() =>
                                    openRoute('/timetable-operations', {
                                        role: 'ADMIN',
                                        sourceRole: 'admin',
                                    })
                                }
                            />

                            <MenuSectionTitle title="Management" />


                            <MenuItem
                                title="User Credentials"
                                onPress={() => openRoute('/user-credentials', { role: 'ADMIN', sourceRole: 'admin' })}
                            />

                            <MenuItem
                                title="Register Here"
                                onPress={openRegisterChooser}
                            />

                            <MenuItem
                                title="Workspace Setup"
                                onPress={() => openRoute('/workspace-setup')}
                            />

                            <MenuItem
                                title="Workspace Health"
                                onPress={() => openRoute('/workspace-health', { role: 'ADMIN', sourceRole: 'admin' })}
                            />

                            <MenuItem
                                title="Import School Data"
                                onPress={() => openRoute('/import-school-data')}
                            />

                            <MenuSectionTitle title="Communication" />

                            <MenuItem
                                title="School Activities"
                                onPress={() => openRoute('/activity-feed', { role: 'ADMIN', sourceRole: 'admin' })}
                            />

                            <MenuItem
                                title="Activity Approvals"
                                onPress={() => openRoute('/activity-approvals', { role: 'ADMIN', sourceRole: 'admin' })}
                            />

                            <MenuItem
                                title="Create Activity"
                                onPress={() => openRoute('/create-activity', { role: 'ADMIN', sourceRole: 'admin' })}
                            />

                            <MenuItem
                                title="School Memories"
                                onPress={() => openRoute('/school-memories', { role: 'ADMIN', sourceRole: 'admin' })}
                            />

                            <MenuItem
                                title="Create School Notice"
                                onPress={() => openRoute('/create-school-notice')}
                            />

                            <MenuItem
                                title="Logout"
                                danger
                                onPress={logout}
                            />
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal visible={registerModalVisible} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.registerOverlay}
                    activeOpacity={1}
                    onPress={() => setRegisterModalVisible(false)}
                >
                    <View style={styles.registerChooserCard}>
                        <Text style={styles.registerChooserEyebrow}>Registration</Text>
                        <Text style={styles.registerChooserTitle}>Register Here</Text>
                        <Text style={styles.registerChooserSubtitle}>Select what type of account you want to create.</Text>

                        <RegisterChoice
                            emoji="👨‍🏫"
                            title="Register Teacher"
                            subtitle="Add teacher account and staff details"
                            onPress={() => openRoute('/register-teacher')}
                        />

                        <RegisterChoice
                            emoji="🎒"
                            title="Register Student"
                            subtitle="Add student profile and academic details"
                            onPress={() => openRoute('/register-student')}
                        />

                        <RegisterChoice
                            emoji="👨‍👩‍👧"
                            title="Register Parent"
                            subtitle="Create parent account and link student"
                            onPress={() => openRoute('/register-parent')}
                        />

                        <TouchableOpacity
                            style={styles.registerCancelButton}
                            onPress={() => setRegisterModalVisible(false)}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.registerCancelText}>Cancel</Text>
                        </TouchableOpacity>
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

function QuickAction({
                         emoji,
                         title,
                         subtitle,
                         onPress,
                     }: {
    emoji: string;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={styles.quickCard}
            onPress={onPress}
            activeOpacity={0.88}
        >
            <Text style={styles.quickIcon}>{emoji}</Text>
            <Text style={styles.quickTitle}>{title}</Text>
            <Text style={styles.quickText}>{subtitle}</Text>
        </TouchableOpacity>
    );
}

function AnalyticsSection({
                              title,
                              children,
                          }: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

function AnalyticsRow({
                          title,
                          subtitle,
                          percentage,
                      }: {
    title: string;
    subtitle: string;
    percentage: number;
}) {
    return (
        <View style={styles.analyticsRow}>
            <View style={styles.analyticsRowTextBox}>
                <Text style={styles.analyticsRowTitle}>{title}</Text>
                <Text style={styles.analyticsRowSubtitle}>{subtitle}</Text>
            </View>

            <View style={styles.analyticsPercentPill}>
                <Text style={styles.analyticsPercentText}>{Math.round(percentage || 0)}%</Text>
            </View>
        </View>
    );
}

function RegisterChoice({
                            emoji,
                            title,
                            subtitle,
                            onPress,
                        }: {
    emoji: string;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={styles.registerChoice}
            onPress={onPress}
            activeOpacity={0.88}
        >
            <View style={styles.registerChoiceIconBox}>
                <Text style={styles.registerChoiceIcon}>{emoji}</Text>
            </View>

            <View style={styles.registerChoiceTextBox}>
                <Text style={styles.registerChoiceTitle}>{title}</Text>
                <Text style={styles.registerChoiceSubtitle}>{subtitle}</Text>
            </View>

            <Text style={styles.registerChoiceArrow}>›</Text>
        </TouchableOpacity>
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
        alignSelf: 'center',
        maxWidth: '100%',
        backgroundColor: 'rgba(255,248,225,0.94)',
        borderRadius: 999,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        paddingVertical: 6,
        paddingHorizontal: 14,
        marginBottom: 10,
        ...shadows.medium,
    },

    heroGreetingLine: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
    },

    heroSmallText: {
        fontSize: 15,
        lineHeight: 19,
        fontWeight: '900',
        letterSpacing: 1.2,
        color: '#A06F00',
    },

    heroName: {
        fontSize: 31,
        lineHeight: 37,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.md,
    },

    heroSubText: {
        fontSize: 17,
        lineHeight: 27,
        fontWeight: '700',
        color: 'rgba(6,27,51,0.70)',
        marginTop: spacing.md,
    },

    overviewCard: {
        backgroundColor: 'rgba(255,248,231,0.97)',
        borderRadius: 28,
        borderWidth: 1.3,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.soft,
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
        rowGap: spacing.md,
    },

    statCard: {
        width: '48%',
        backgroundColor: '#FFFDF3',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginBottom: spacing.sm,
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

    percentageBox: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.md,
        marginTop: spacing.xs,
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

    quickActionsCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },

    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: spacing.lg,
    },

    quickCard: {
        width: '48%',
        backgroundColor: '#FFF8E1',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.md,
        minHeight: 132,
        marginBottom: spacing.md,
        justifyContent: 'center',
    },

    quickIcon: {
        fontSize: 28,
        marginBottom: spacing.sm,
    },

    quickTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.xs,
    },

    quickText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.slateText,
        lineHeight: 17,
    },

    breakdownNavigationCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 26,
        borderWidth: 1.4,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },

    breakdownNavigationIconBox: {
        width: 58,
        height: 58,
        borderRadius: 22,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },

    breakdownNavigationIcon: {
        fontSize: 28,
    },

    breakdownNavigationTextBox: {
        flex: 1,
        paddingRight: spacing.md,
    },

    breakdownNavigationTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    breakdownNavigationSubtitle: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.xs,
    },

    breakdownNavigationMeta: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.premiumGold,
        marginTop: spacing.sm,
    },

    breakdownNavigationArrow: {
        fontSize: 42,
        fontWeight: '900',
        color: colors.premiumGold,
    },

    analyticsCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },

    analyticsSection: {
        backgroundColor: '#FFF8E1',
        borderRadius: 24,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },

    analyticsSectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.md,
    },

    analyticsRow: {
        backgroundColor: colors.white,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.42)',
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    analyticsRowTextBox: {
        flex: 1,
        paddingRight: spacing.md,
    },

    analyticsRowTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    analyticsRowSubtitle: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.xs,
    },

    analyticsPercentPill: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minWidth: 64,
        alignItems: 'center',
    },

    analyticsPercentText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.premiumGold,
    },

    emptyAnalyticsText: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.slateText,
        paddingVertical: spacing.sm,
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
        paddingTop: 88,
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
        backgroundColor: '#FFFDF3',
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

    registerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.52)',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },

    registerChooserCard: {
        backgroundColor: colors.white,
        borderRadius: 30,
        borderWidth: 1.4,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        ...shadows.medium,
    },

    registerChooserEyebrow: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
    },

    registerChooserTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.xs,
    },

    registerChooserSubtitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.slateText,
        lineHeight: 21,
        marginTop: spacing.sm,
        marginBottom: spacing.lg,
    },

    registerChoice: {
        backgroundColor: '#FFF8E1',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.md,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },

    registerChoiceIconBox: {
        width: 48,
        height: 48,
        borderRadius: 18,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },

    registerChoiceIcon: {
        fontSize: 24,
    },

    registerChoiceTextBox: {
        flex: 1,
        paddingRight: spacing.sm,
    },

    registerChoiceTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    registerChoiceSubtitle: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.slateText,
        lineHeight: 17,
        marginTop: spacing.xs,
    },

    registerChoiceArrow: {
        fontSize: 34,
        fontWeight: '900',
        color: colors.premiumGold,
    },

    registerCancelButton: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 22,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.sm,
    },

    registerCancelText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.premiumGold,
    },

});
