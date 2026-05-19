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
import DashboardIntelligencePanel from '../components/dashboard/DashboardIntelligencePanel';
import { colors, shadows, spacing } from '../src/theme';
import { API_BASE_URL, DEV_DEFAULTS } from '../src/services/api';

type PrincipalStats = {
    attendanceDate: string;
    totalStudents: number;
    presentStudents: number;
    absentStudents: number;
    lateStudents: number;
    attendancePercentage: number;
};

const DASHBOARD_DATE = DEV_DEFAULTS.dashboardDate;

const fallbackStats: PrincipalStats = {
    attendanceDate: DASHBOARD_DATE,
    totalStudents: 0,
    presentStudents: 0,
    absentStudents: 0,
    lateStudents: 0,
    attendancePercentage: 0,
};

export default function PrincipalHomeScreen() {
    const params = useLocalSearchParams();
    const principalName = String(params.principalName || params.name || 'Principal');

    const [menuVisible, setMenuVisible] = useState(false);
    const [registerModalVisible, setRegisterModalVisible] = useState(false);
    const [stats, setStats] = useState<PrincipalStats>(fallbackStats);
    const [loading, setLoading] = useState(false);
    const [errorText, setErrorText] = useState('');

    useEffect(() => {
        const loadPrincipalHome = async () => {
            setLoading(true);
            setErrorText('');

            try {
                const response = await fetch(
                    `${API_BASE_URL}/attendance/dashboard/admin?date=${DASHBOARD_DATE}`
                );

                if (!response.ok) {
                    throw new Error('Unable to load principal home');
                }

                const data = await response.json();
                setStats({
                    attendanceDate: data.attendanceDate ?? DASHBOARD_DATE,
                    totalStudents: Number(data.totalStudents ?? 0),
                    presentStudents: Number(data.presentStudents ?? 0),
                    absentStudents: Number(data.absentStudents ?? 0),
                    lateStudents: Number(data.lateStudents ?? 0),
                    attendancePercentage: Number(data.attendancePercentage ?? 0),
                });
            } catch (error) {
                setStats(fallbackStats);
                setErrorText('Live data unavailable');
            } finally {
                setLoading(false);
            }
        };

        loadPrincipalHome();
    }, []);

    const todayStats = useMemo(
        () => ({
            totalStudents: String(stats.totalStudents || 0),
            present: String(stats.presentStudents || 0),
            absent: String(stats.absentStudents || 0),
            late: String(stats.lateStudents || 0),
            attendancePercent: `${Math.round(stats.attendancePercentage || 0)}%`,
        }),
        [stats]
    );

    const principalParams = {
        role: 'PRINCIPAL',
        userId: String(params.userId || '1'),
        name: principalName,
        principalName,
    };

    const openRoute = (path: string, extraParams: Record<string, string> = {}) => {
        setMenuVisible(false);
        setRegisterModalVisible(false);

        router.push({
            pathname: path as any,
            params: {
                ...principalParams,
                ...extraParams,
            },
        } as any);
    };

    const goToTakeAttendance = () => {
        openRoute('/home');
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
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        style={styles.circleButton}
                        onPress={() => setMenuVisible(true)}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.circleButtonText}>☰</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Principal Home</Text>

                    <TouchableOpacity
                        style={styles.headerLogoutButton}
                        onPress={logout}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.headerLogoutText}>⏻</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.heroSmallText}>Good morning</Text>

                    <Text style={styles.heroName}>{principalName}</Text>

                    <Text style={styles.heroSubText}>
                        Monitor school operations, attendance, reports, teacher
                        workload, replacements and notices.
                    </Text>
                </View>

                <DashboardIntelligencePanel role="PRINCIPAL" />

                <View style={styles.overviewCard}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={styles.sectionHeaderTextBox}>
                            <Text style={styles.sectionEyebrow}>Today</Text>

                            <Text style={styles.sectionTitle}>
                                Principal Overview
                            </Text>
                        </View>

                        <View style={styles.statusPill}>
                            <Text style={styles.statusPillText}>
                                {loading
                                    ? 'Loading'
                                    : errorText
                                        ? 'Offline'
                                        : 'Live'}
                            </Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator />

                            <Text style={styles.loadingText}>
                                Loading principal overview...
                            </Text>
                        </View>
                    ) : (
                        <>
                            {errorText ? (
                                <Text style={styles.errorText}>{errorText}</Text>
                            ) : null}

                            <View style={styles.statsGrid}>
                                <StatCard
                                    emoji="👥"
                                    value={todayStats.totalStudents}
                                    label="Total"
                                />

                                <StatCard
                                    emoji="✅"
                                    value={todayStats.present}
                                    label="Present"
                                />

                                <StatCard
                                    emoji="🚫"
                                    value={todayStats.absent}
                                    label="Absent"
                                />

                                <StatCard
                                    emoji="⏰"
                                    value={todayStats.late}
                                    label="Late"
                                />
                            </View>

                            <View style={styles.percentageBox}>
                                <Text style={styles.percentageLabel}>
                                    Attendance Percentage
                                </Text>

                                <Text style={styles.percentageValue}>
                                    {todayStats.attendancePercent}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={() => openRoute('/principal-dashboard')}
                    activeOpacity={0.9}
                >
                    <View style={styles.primaryActionTextBox}>
                        <Text style={styles.primaryActionTitle}>
                            School Intelligence
                        </Text>

                        <Text style={styles.primaryActionSubtitle}>
                            Open executive intelligence dashboard
                        </Text>
                    </View>

                    <Text style={styles.primaryActionArrow}>›</Text>
                </TouchableOpacity>

                <View style={styles.quickActionsCard}>
                    <Text style={styles.sectionEyebrow}>Quick Actions</Text>

                    <Text style={styles.sectionTitle}>Principal Tools</Text>

                    <View style={styles.quickGrid}>
                        <QuickAction
                            emoji="🧠"
                            title="School Intelligence"
                            subtitle="Executive dashboard"
                            onPress={() =>
                                openRoute('/principal-dashboard')
                            }
                        />

                        <QuickAction
                            emoji="📊"
                            title="Attendance Reports"
                            subtitle="Daily and monthly reports"
                            onPress={() =>
                                openRoute('/attendance-report')
                            }
                        />

                        <QuickAction
                            emoji="👨‍🏫"
                            title="Teacher Reports"
                            subtitle="Teacher insight search"
                            onPress={() =>
                                openRoute('/attendance-report', {
                                    initialView: 'teacherReport',
                                    fromPrincipalMenu: 'true',
                                })
                            }
                        />

                        <QuickAction
                            emoji="🗓️"
                            title="Teacher Leave Planning"
                            subtitle="Leave and replacements"
                            onPress={() =>
                                openRoute('/teacher-leave-planning')
                            }
                        />

                        <QuickAction
                            emoji="📣"
                            title="Create School Notice"
                            subtitle="Announcements"
                            onPress={() =>
                                openRoute('/create-school-notice')
                            }
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
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.menuScrollContent}
                        >
                            <Text style={styles.menuTitle}>
                                Principal Menu
                            </Text>

                            <MenuSectionTitle title="Home" />

                            <MenuItem
                                title="Home"
                                onPress={() => setMenuVisible(false)}
                            />

                            <MenuItem
                                title="School Intelligence"
                                onPress={() =>
                                    openRoute('/principal-dashboard')
                                }
                            />

                            <MenuSectionTitle title="Operations" />

                            <MenuItem
                                title="Take Attendance"
                                onPress={goToTakeAttendance}
                            />

                            <MenuItem
                                title="Attendance Reports"
                                onPress={() =>
                                    openRoute('/attendance-report')
                                }
                            />

                            <MenuItem
                                title="Teacher Reports"
                                onPress={() =>
                                    openRoute('/attendance-report', {
                                        initialView: 'teacherReport',
                                        fromPrincipalMenu: 'true',
                                    })
                                }
                            />

                            <MenuItem
                                title="Teacher Leave Planning"
                                onPress={() =>
                                    openRoute('/teacher-leave-planning')
                                }
                            />

                            <MenuItem
                                title="Teacher Assignments"
                                onPress={() =>
                                    openRoute('/teacher-assignments')
                                }
                            />

                            <MenuSectionTitle title="Scheduling" />

                            <MenuItem
                                title="Generate Timetable"
                                onPress={() =>
                                    openRoute('/generate-timetable', {
                                        role: 'PRINCIPAL',
                                        sourceRole: 'principal',
                                    })
                                }
                            />

                            <MenuItem
                                title="Timetable Batch Center"
                                onPress={() =>
                                    openRoute('/timetable-batch-center', {
                                        role: 'PRINCIPAL',
                                        sourceRole: 'principal',
                                    })
                                }
                            />

                            <MenuItem
                                title="Timetable Review"
                                onPress={() =>
                                    openRoute('/timetable-review', {
                                        role: 'PRINCIPAL',
                                        sourceRole: 'principal',
                                    })
                                }
                            />

                            <MenuItem
                                title="Timetable Conflicts"
                                onPress={() =>
                                    openRoute('/timetable-conflicts', {
                                        role: 'PRINCIPAL',
                                        sourceRole: 'principal',
                                    })
                                }
                            />

                            <MenuItem
                                title="Teacher Workload Dashboard"
                                onPress={() =>
                                    openRoute('/teacher-workload-dashboard', {
                                        role: 'PRINCIPAL',
                                        sourceRole: 'principal',
                                    })
                                }
                            />

                            <MenuSectionTitle title="Management" />

                            <MenuItem
                                title="Register Here"
                                onPress={openRegisterChooser}
                            />

                            <MenuItem
                                title="Import School Data"
                                onPress={() =>
                                    openRoute('/import-school-data')
                                }
                            />

                            <MenuSectionTitle title="Communication" />

                            <MenuItem
                                title="Create School Notice"
                                onPress={() =>
                                    openRoute('/create-school-notice')
                                }
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

            <Modal
                visible={registerModalVisible}
                transparent
                animationType="fade"
            >
                <TouchableOpacity
                    style={styles.registerOverlay}
                    activeOpacity={1}
                    onPress={() => setRegisterModalVisible(false)}
                >
                    <View style={styles.registerChooserCard}>
                        <Text style={styles.registerChooserEyebrow}>
                            Registration
                        </Text>

                        <Text style={styles.registerChooserTitle}>
                            Register Here
                        </Text>

                        <Text style={styles.registerChooserSubtitle}>
                            Select what type of account you want to create.
                        </Text>

                        <RegisterChoice
                            emoji="👨‍🏫"
                            title="Register Teacher"
                            subtitle="Add teacher account and staff details"
                            onPress={() =>
                                openRoute('/register-teacher')
                            }
                        />

                        <RegisterChoice
                            emoji="🎒"
                            title="Register Student"
                            subtitle="Add student profile and academic details"
                            onPress={() =>
                                openRoute('/register-student')
                            }
                        />

                        <RegisterChoice
                            emoji="👨‍👩‍👧"
                            title="Register Parent"
                            subtitle="Create parent account and link student"
                            onPress={() =>
                                openRoute('/register-parent')
                            }
                        />

                        <TouchableOpacity
                            style={styles.registerCancelButton}
                            onPress={() =>
                                setRegisterModalVisible(false)
                            }
                            activeOpacity={0.85}
                        >
                            <Text style={styles.registerCancelText}>
                                Cancel
                            </Text>
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
            style={styles.quickAction}
            onPress={onPress}
            activeOpacity={0.88}
        >
            <Text style={styles.quickEmoji}>{emoji}</Text>

            <Text style={styles.quickTitle}>{title}</Text>

            <Text style={styles.quickSubtitle}>{subtitle}</Text>
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
            style={[
                styles.menuItem,
                danger && styles.menuItemDanger,
            ]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <Text
                style={[
                    styles.menuItemText,
                    danger && styles.menuItemTextDanger,
                ]}
            >
                {title}
            </Text>

            <Text
                style={[
                    styles.menuItemArrow,
                    danger && styles.menuItemTextDanger,
                ]}
            >
                ›
            </Text>
        </TouchableOpacity>
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
            <Text style={styles.registerChoiceEmoji}>{emoji}</Text>

            <View style={styles.registerChoiceTextBox}>
                <Text style={styles.registerChoiceTitle}>{title}</Text>

                <Text style={styles.registerChoiceSubtitle}>
                    {subtitle}
                </Text>
            </View>

            <Text style={styles.registerChoiceArrow}>›</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.primaryNavy,
    },

    container: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 54,
        paddingBottom: 34,
    },

    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },

    circleButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },

    circleButtonText: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
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
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.4,
    },

    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.13)',
        borderRadius: 28,
        padding: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        marginBottom: 18,
    },

    heroSmallText: {
        color: '#D8E6F7',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 6,
    },

    heroName: {
        color: colors.premiumGold,
        fontSize: 34,
        lineHeight: 39,
        fontWeight: '900',
        marginBottom: 10,
    },

    heroSubText: {
        color: '#F7FAFF',
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '600',
    },

    overviewCard: {
        backgroundColor: 'rgba(255,253,247,0.97)',
        borderRadius: 28,
        padding: 18,
        marginBottom: 16,
        ...shadows.medium,
    },

    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },

    sectionHeaderTextBox: {
        flex: 1,
        paddingRight: 10,
    },

    sectionEyebrow: {
        color: colors.deepGold,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    sectionTitle: {
        color: colors.primaryNavy,
        fontSize: 22,
        fontWeight: '900',
        marginTop: 4,
    },

    statusPill: {
        backgroundColor: '#FFF4D6',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: '#F1D38A',
    },

    statusPillText: {
        color: colors.primaryNavy,
        fontSize: 12,
        fontWeight: '900',
    },

    loadingBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 22,
    },

    loadingText: {
        color: colors.mutedText,
        fontWeight: '700',
        marginTop: 8,
    },

    errorText: {
        color: '#A33A2B',
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 10,
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    statCard: {
        width: '47%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F0E4C8',
    },

    statEmoji: {
        fontSize: 24,
        marginBottom: 8,
    },

    statValue: {
        color: colors.primaryNavy,
        fontSize: 24,
        fontWeight: '900',
    },

    statLabel: {
        color: colors.mutedText,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },

    percentageBox: {
        marginTop: 12,
        borderRadius: 22,
        backgroundColor: '#FFF8E7',
        borderWidth: 1,
        borderColor: '#F1D38A',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    percentageLabel: {
        color: colors.primaryNavy,
        fontSize: 14,
        fontWeight: '800',
    },

    percentageValue: {
        color: colors.deepGold,
        fontSize: 26,
        fontWeight: '900',
    },

    primaryAction: {
        backgroundColor: colors.premiumGold,
        borderRadius: 24,
        padding: 18,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...shadows.medium,
    },

    primaryActionTextBox: {
        flex: 1,
        paddingRight: 12,
    },

    primaryActionTitle: {
        color: colors.primaryNavy,
        fontSize: 20,
        fontWeight: '900',
    },

    primaryActionSubtitle: {
        color: '#4B3A12',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 4,
    },

    primaryActionArrow: {
        color: colors.primaryNavy,
        fontSize: 38,
        fontWeight: '900',
    },

    quickActionsCard: {
        backgroundColor: 'rgba(255,253,247,0.97)',
        borderRadius: 28,
        padding: 18,
        marginBottom: 18,
        ...shadows.medium,
    },

    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 14,
    },

    quickAction: {
        width: '47%',
        minHeight: 132,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F0E4C8',
        justifyContent: 'space-between',
    },

    quickEmoji: {
        fontSize: 25,
    },

    quickTitle: {
        color: colors.primaryNavy,
        fontSize: 15,
        fontWeight: '900',
        marginTop: 8,
    },

    quickSubtitle: {
        color: colors.mutedText,
        fontSize: 12,
        fontWeight: '700',
        lineHeight: 17,
        marginTop: 4,
    },

    logoutButton: {
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 26,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },

    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
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

    registerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.46)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },

    registerChooserCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#FFFDF7',
        borderRadius: 28,
        padding: 20,
        ...shadows.medium,
    },

    registerChooserEyebrow: {
        color: colors.deepGold,
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    registerChooserTitle: {
        color: colors.primaryNavy,
        fontSize: 25,
        fontWeight: '900',
        marginTop: 4,
    },

    registerChooserSubtitle: {
        color: colors.mutedText,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '700',
        marginTop: 6,
        marginBottom: 14,
    },

    registerChoice: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F0E4C8',
        padding: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },

    registerChoiceEmoji: {
        fontSize: 26,
        marginRight: 12,
    },

    registerChoiceTextBox: {
        flex: 1,
    },

    registerChoiceTitle: {
        color: colors.primaryNavy,
        fontSize: 16,
        fontWeight: '900',
    },

    registerChoiceSubtitle: {
        color: colors.mutedText,
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '700',
        marginTop: 3,
    },

    registerChoiceArrow: {
        color: colors.primaryNavy,
        fontSize: 26,
        fontWeight: '900',
    },

    registerCancelButton: {
        marginTop: 4,
        borderRadius: 16,
        paddingVertical: 13,
        alignItems: 'center',
        backgroundColor: '#F3EEE2',
    },

    registerCancelText: {
        color: colors.primaryNavy,
        fontSize: 15,
        fontWeight: '900',
    },
});
