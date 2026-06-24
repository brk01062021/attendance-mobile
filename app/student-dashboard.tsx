import { router, useLocalSearchParams } from 'expo-router';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
    ImageBackground,
    InteractionManager,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { api } from '../src/services/api';
import { getSession, normalizeSchoolId } from '../src/services/sessionService';
import { colors, shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

type AttendanceView = 'TODAY' | 'WEEKLY' | 'MONTHLY';
type MenuView = 'HOME' | 'EXAM_RESULTS' | 'SCHOOL_NOTICES';
type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Not marked';

type StudentProfile = {
    studentId: string;
    studentName: string;
    className: string | null;
    section: string | null;
};

type AttendanceSummary = {
    todayStatus: AttendanceStatus;
    weeklyPresent: number;
    weeklyTotal: number;
    monthlyPresent: number;
    monthlyTotal: number;
    percentage: number | null;
    records: AttendanceRecord[];
};

type AttendanceRecord = {
    date: string;
    subject?: string | null;
    status: AttendanceStatus;
};

type SchoolNotice = {
    id: string;
    title: string;
    message: string;
};

const darkBackground = require('../assets/branding/splash-dark.png');
const goldBackground = require('../assets/branding/splash-gold.png');

const EMPTY_ATTENDANCE: AttendanceSummary = {
    todayStatus: 'Not marked',
    weeklyPresent: 0,
    weeklyTotal: 0,
    monthlyPresent: 0,
    monthlyTotal: 0,
    percentage: null,
    records: [],
};

function asArray(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.records)) return value.records;
    if (Array.isArray(value?.content)) return value.content;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.notices)) return value.notices;
    if (Array.isArray(value?.results)) return value.results;
    return [];
}

function normalizeStatus(value: any): AttendanceStatus {
    const status = String(value || '').trim().toUpperCase();
    if (status === 'PRESENT' || status === 'P') return 'Present';
    if (status === 'ABSENT' || status === 'A') return 'Absent';
    if (status === 'LATE' || status === 'L') return 'Late';
    return 'Not marked';
}

function attendanceDate(record: any): string {
    return String(record?.date || record?.attendanceDate || record?.markedDate || record?.day || '').slice(0, 10);
}

function isSameDay(left: Date, right: Date) {
    return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function toDateOnly(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function buildAttendanceSummary(records: AttendanceRecord[]): AttendanceSummary {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const todayRecord = records.find((record) => {
        if (!record.date) return false;
        const recordDate = new Date(record.date);
        return !Number.isNaN(recordDate.getTime()) && isSameDay(recordDate, today);
    });

    const weekly = records.filter((record) => {
        const recordDate = new Date(record.date);
        return !Number.isNaN(recordDate.getTime()) && recordDate >= startOfWeek && recordDate <= today;
    });

    const monthly = records.filter((record) => {
        const recordDate = new Date(record.date);
        return !Number.isNaN(recordDate.getTime()) && recordDate.getFullYear() === today.getFullYear() && recordDate.getMonth() === today.getMonth();
    });

    const presentLike = (record: AttendanceRecord) => record.status === 'Present' || record.status === 'Late';
    const monthlyPresent = monthly.filter(presentLike).length;
    const monthlyTotal = monthly.length;

    return {
        todayStatus: todayRecord?.status || 'Not marked',
        weeklyPresent: weekly.filter(presentLike).length,
        weeklyTotal: weekly.length,
        monthlyPresent,
        monthlyTotal,
        percentage: monthlyTotal > 0 ? Number(((monthlyPresent / monthlyTotal) * 100).toFixed(1)) : null,
        records,
    };
}

async function loadStudentProfile(params: Record<string, any>, schoolId: string): Promise<StudentProfile> {
    const session = getSession();
    const studentId = String(params.studentId || session?.studentId || session?.userId || '').trim();
    const fallbackName = String(params.studentName || session?.studentName || session?.displayName || 'Student');
    const fallbackClassName = String(params.className || session?.className || '').trim() || null;
    const fallbackSection = String(params.section || session?.section || '').trim() || null;

    const fallback: StudentProfile = {
        studentId: studentId || String(session?.userId || '1'),
        studentName: fallbackName,
        className: fallbackClassName,
        section: fallbackSection,
    };

    if (!studentId && !fallbackName) return fallback;

    const queries = [studentId, fallbackName].filter(Boolean);
    for (const query of queries) {
        try {
            const response = await api.get('/students/search', { params: { query, schoolId } });
            const match = asArray(response.data).find((item: any) => {
                const candidateId = String(item?.studentId || item?.admissionNo || item?.rollNumber || item?.username || item?.id || '');
                const candidateName = String(item?.studentName || item?.name || item?.fullName || '');
                return candidateId === studentId || candidateName.toLowerCase() === fallbackName.toLowerCase();
            }) || asArray(response.data)[0];

            if (match) {
                return {
                    studentId: String(match.studentId || match.admissionNo || match.rollNumber || match.username || match.id || fallback.studentId),
                    studentName: String(match.studentName || match.name || match.fullName || fallback.studentName),
                    className: String(match.className || match.class_name || match.classGrade || match.grade || fallback.className || '').trim() || null,
                    section: String(match.section || match.sectionName || match.classSection || fallback.section || '').trim() || null,
                };
            }
        } catch {
            // Keep fallback if student search is unavailable.
        }
    }

    return fallback;
}

async function loadAttendance(studentId: string): Promise<AttendanceSummary> {
    if (!studentId) return EMPTY_ATTENDANCE;
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 45);
    try {
        const response = await api.get('/attendance/student-report', {
            params: { studentId, fromDate: toDateOnly(start), toDate: toDateOnly(today), rangeType: 'CUSTOM' },
        });
        const records = asArray(response.data).map((item: any): AttendanceRecord => ({
            date: attendanceDate(item),
            subject: item?.subject || item?.subjectName || null,
            status: normalizeStatus(item?.status || item?.attendanceStatus || item?.presentStatus),
        })).filter((item) => Boolean(item.date));

        return buildAttendanceSummary(records);
    } catch {
        return EMPTY_ATTENDANCE;
    }
}

async function loadSchoolNotices(schoolId: string): Promise<SchoolNotice[]> {
    try {
        const response = await api.get('/school-notices', { params: { schoolId, targetRole: 'STUDENT', activeOnly: true } });
        return asArray(response.data).map((item: any, index: number): SchoolNotice => ({
            id: String(item.id || item.noticeId || `${index}`),
            title: String(item.title || item.noticeTitle || 'School Notice'),
            message: String(item.message || item.description || item.content || ''),
        })).filter((item) => item.message.trim().length > 0);
    } catch {
        return [];
    }
}

export default function StudentDashboard() {
    const rawParams = useLocalSearchParams();
    const params = rawParams as Record<string, any>;
    const session = getSession();
    const schoolId = normalizeSchoolId(String(params.schoolId || session?.schoolId || ''));
    const schoolName = resolveSchoolName(schoolId, session?.schoolName);

    const [studentProfile, setStudentProfile] = useState<StudentProfile>({
        studentId: String(params.studentId || session?.studentId || session?.userId || '1'),
        studentName: String(params.studentName || session?.studentName || session?.displayName || 'Student'),
        className: String(params.className || session?.className || '').trim() || null,
        section: String(params.section || session?.section || '').trim() || null,
    });
    const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>(EMPTY_ATTENDANCE);
    const [notices, setNotices] = useState<SchoolNotice[]>([]);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [currentView, setCurrentView] = useState<MenuView>('HOME');
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceView | null>(null);
    const [contentReady, setContentReady] = useState(true);

    const isHomePage = currentView === 'HOME' && !selectedAttendance;
    const backgroundSource = isHomePage ? darkBackground : goldBackground;

    useEffect(() => {
        let mounted = true;
        const loadDashboard = async () => {
            setDashboardLoading(true);
            const profile = await loadStudentProfile(params, schoolId);
            const [attendance, schoolNotices] = await Promise.all([
                loadAttendance(profile.studentId),
                loadSchoolNotices(schoolId),
            ]);
            if (!mounted) return;
            setStudentProfile(profile);
            setAttendanceSummary(attendance);
            setNotices(schoolNotices);
            setDashboardLoading(false);
        };
        loadDashboard();
        return () => { mounted = false; };
    }, [schoolId]);

    useEffect(() => {
        if (isHomePage) {
            setContentReady(true);
            return;
        }
        setContentReady(false);
        const task = InteractionManager.runAfterInteractions(() => setContentReady(true));
        return () => task.cancel();
    }, [currentView, isHomePage, selectedAttendance]);

    const topCenterTitle = useMemo(() => {
        if (selectedAttendance === 'TODAY') return 'Today Attendance';
        if (selectedAttendance === 'WEEKLY') return 'Weekly Attendance';
        if (selectedAttendance === 'MONTHLY') return 'Monthly Attendance';
        if (currentView === 'EXAM_RESULTS') return 'Exam Results';
        if (currentView === 'SCHOOL_NOTICES') return 'School Notices';
        return 'Student Dashboard';
    }, [currentView, selectedAttendance]);

    const closeMenu = useCallback(() => setMenuOpen(false), []);
    const goLogin = useCallback(() => {
        setMenuOpen(false);
        router.replace('/login' as any);
    }, []);

    const goHome = useCallback(() => {
        setCurrentView('HOME');
        setSelectedAttendance(null);
        setMenuOpen(false);
    }, []);

    const openAttendance = useCallback((view: AttendanceView) => {
        setCurrentView('HOME');
        setSelectedAttendance(view);
        setMenuOpen(false);
    }, []);

    const openExamResults = useCallback(() => {
        setSelectedAttendance(null);
        setCurrentView('EXAM_RESULTS');
        setMenuOpen(false);
    }, []);

    const openSchoolNotices = useCallback(() => {
        setSelectedAttendance(null);
        setCurrentView('SCHOOL_NOTICES');
        setMenuOpen(false);
    }, []);

    const openTimetable = useCallback(() => {
        setMenuOpen(false);
        router.push({
            pathname: '/timetable-live',
            params: {
                role: 'STUDENT',
                className: studentProfile.className || '',
                section: studentProfile.section || '',
                sourceRole: 'student',
                schoolId,
            },
        } as any);
    }, [schoolId, studentProfile.className, studentProfile.section]);

    const openRouteAndClose = useCallback((route: string) => {
        setMenuOpen(false);
        router.push(route as any);
    }, []);

    const handleWorkflowBack = useCallback(() => {
        if (selectedAttendance) {
            setSelectedAttendance(null);
            return;
        }
        goHome();
    }, [goHome, selectedAttendance]);

    return (
        <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                {isHomePage ? (
                    <DashboardHeader
                        schoolName={schoolName}
                        workspaceTitle="Student Academic Workspace"
                        roleLabel="STUDENT"
                        schoolId={schoolId}
                        onMenuPress={() => setMenuOpen(true)}
                        onLogoutPress={goLogin}
                    />
                ) : (
                    <MobileWorkflowHeader
                        title={topCenterTitle}
                        eyebrow="STUDENT"
                        subtitle={`${schoolName} • ${schoolId}`}
                        onBackPress={handleWorkflowBack}
                        onHomePress={goHome}
                    />
                )}

                {selectedAttendance ? (
                    contentReady ? <AttendanceDetail view={selectedAttendance} summary={attendanceSummary} /> : <LoadingPanel label="Loading attendance details..." />
                ) : currentView === 'EXAM_RESULTS' ? (
                    contentReady ? <ExamResultsScreen /> : <LoadingPanel label="Loading exam results..." />
                ) : currentView === 'SCHOOL_NOTICES' ? (
                    contentReady ? <SchoolNoticesScreen notices={notices} /> : <LoadingPanel label="Loading school notices..." />
                ) : (
                    <HomeScreen
                        studentName={studentProfile.studentName}
                        className={studentProfile.className}
                        section={studentProfile.section}
                        summary={attendanceSummary}
                        loading={dashboardLoading}
                        onOpenAttendance={openAttendance}
                    />
                )}
            </ScrollView>

            <Modal transparent visible={menuOpen} animationType="slide" onRequestClose={closeMenu}>
                <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu}>
                    <View style={styles.menuCard}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuScrollContent}>
                            <Text style={styles.menuTitle}>Student Menu</Text>

                            <MenuSectionTitle title="Home" />
                            <MenuItem title="Home" onPress={goHome} />

                            <MenuSectionTitle title="Academics" />
                            <MenuItem title="My Timetable" onPress={openTimetable} />
                            <MenuItem title="Exam Results" onPress={openExamResults} />
                            <MenuItem title="School Notices" onPress={openSchoolNotices} />
                            <MenuItem title="School Activities" onPress={() => openRouteAndClose('/activity-feed')} />
                            <MenuItem title="School Memories" onPress={() => openRouteAndClose('/school-memories')} />

                            <MenuSectionTitle title="Account" />
                            <MenuItem title="Logout" danger onPress={goLogin} />
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </ImageBackground>
    );
}

const HomeScreen = memo(function HomeScreen({
    studentName,
    className,
    section,
    summary,
    loading,
    onOpenAttendance,
}: {
    studentName: string;
    className: string | null;
    section: string | null;
    summary: AttendanceSummary;
    loading: boolean;
    onOpenAttendance: (view: AttendanceView) => void;
}) {
    const classLine = className && section ? `Class ${className} • Section ${section}` : 'Class and section not assigned';
    const percentageText = summary.percentage === null ? 'No data' : `${summary.percentage}%`;

    return (
        <>
            <View style={styles.greetingBlock}>
                <Text style={styles.homeGreetingLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>Good Morning 🌞 {studentName}</Text>
            </View>

            <View style={styles.heroCard}>
                <Text style={styles.sectionLabel}>Student</Text>
                <Text style={styles.childName}>{studentName}</Text>
                <Text style={styles.heroText}>{classLine}</Text>
                <Text style={styles.heroText}>Today Attendance: {loading ? 'Loading...' : summary.todayStatus}</Text>
            </View>

            <Text style={styles.sectionTitle}>Attendance</Text>

            <View style={styles.grid}>
                <AttendanceCard title="Today" value={loading ? 'Loading...' : summary.todayStatus} hint="Tap to view details" onPress={() => onOpenAttendance('TODAY')} />
                <AttendanceCard title="Weekly" value={summary.weeklyTotal > 0 ? `${summary.weeklyPresent} / ${summary.weeklyTotal} Days` : 'No data'} hint="Tap to view details" onPress={() => onOpenAttendance('WEEKLY')} />
                <AttendanceCard title="Monthly" value={summary.monthlyTotal > 0 ? `${summary.monthlyPresent} / ${summary.monthlyTotal} Days` : 'No data'} hint="Tap to view details" onPress={() => onOpenAttendance('MONTHLY')} />

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>% Attendance</Text>
                    <Text style={styles.infoValue}>{percentageText}</Text>
                </View>
            </View>
        </>
    );
});

const AttendanceDetail = memo(function AttendanceDetail({ view, summary }: { view: AttendanceView; summary: AttendanceSummary }) {
    const today = new Date();
    const filtered = useMemo(() => {
        if (view === 'TODAY') {
            return summary.records.filter((record) => {
                const recordDate = new Date(record.date);
                return !Number.isNaN(recordDate.getTime()) && isSameDay(recordDate, today);
            });
        }
        if (view === 'WEEKLY') {
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay() + 1);
            start.setHours(0, 0, 0, 0);
            return summary.records.filter((record) => {
                const recordDate = new Date(record.date);
                return !Number.isNaN(recordDate.getTime()) && recordDate >= start && recordDate <= today;
            });
        }
        return summary.records.filter((record) => {
            const recordDate = new Date(record.date);
            return !Number.isNaN(recordDate.getTime()) && recordDate.getFullYear() === today.getFullYear() && recordDate.getMonth() === today.getMonth();
        });
    }, [summary.records, view]);

    if (filtered.length === 0) {
        return <EmptyCard title="No attendance data" message="Attendance has not been marked for this period yet." />;
    }

    return (
        <>
            {filtered.map((item, index) => (
                <View key={`${item.date}-${index}`} style={styles.subjectRow}>
                    <View>
                        <Text style={styles.subjectName}>{item.subject || item.date}</Text>
                        <Text style={styles.subjectSubText}>{item.subject ? item.date : 'Attendance record'}</Text>
                    </View>
                    <Text style={[styles.statusText, item.status === 'Absent' && styles.absentText]}>{item.status}</Text>
                </View>
            ))}
        </>
    );
});

const ExamResultsScreen = memo(function ExamResultsScreen() {
    return <EmptyCard title="No exam results published yet" message="Published exam results will appear here after the school releases marks for this student." />;
});

const SchoolNoticesScreen = memo(function SchoolNoticesScreen({ notices }: { notices: SchoolNotice[] }) {
    if (notices.length === 0) {
        return <EmptyCard title="No active notices available" message="School notices published for students will appear here." />;
    }

    return (
        <>
            {notices.map((notice) => <NoticeCard key={notice.id} title={notice.title} text={notice.message} />)}
        </>
    );
});

const EmptyCard = memo(function EmptyCard({ title, message }: { title: string; message: string }) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardText}>{message}</Text>
        </View>
    );
});

const LoadingPanel = memo(function LoadingPanel({ label }: { label: string }) {
    return (
        <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>{label}</Text>
        </View>
    );
});

const AttendanceCard = memo(function AttendanceCard({
    title,
    value,
    hint,
    onPress,
}: {
    title: string;
    value: string;
    hint: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.infoCard} onPress={onPress} activeOpacity={0.86}>
            <Text style={styles.infoTitle}>{title}</Text>
            <Text style={styles.infoValue}>{value}</Text>
            <Text style={styles.tapHint}>{hint}</Text>
        </TouchableOpacity>
    );
});

const NoticeCard = memo(function NoticeCard({ title, text }: { title: string; text: string }) {
    return (
        <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{title}</Text>
            <Text style={styles.noticeText}>{text}</Text>
        </View>
    );
});

const MenuSectionTitle = memo(function MenuSectionTitle({ title }: { title: string }) {
    return <Text style={styles.menuSectionTitle}>{title}</Text>;
});

const MenuItem = memo(function MenuItem({ title, onPress, danger }: { title: string; onPress: () => void; danger?: boolean }) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.86}>
            <Text style={[styles.menuItemText, danger && styles.menuItemDanger]}>{title}</Text>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.primaryNavy,
    },
    container: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 72,
        paddingBottom: spacing.xxxl,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.xl,
        marginBottom: spacing.md,
    },
    topCenterTitle: {
        flex: 1,
        fontSize: 18,
        lineHeight: 22,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
        marginHorizontal: spacing.sm,
    },
    homeTopTitle: {
        color: colors.premiumGold,
    },
    circleButton: {
        width: 49,
        height: 49,
        borderRadius: 24.5,
        borderWidth: 1.4,
        borderColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(6, 27, 51, 0.72)',
    },
    circleButtonText: {
        fontSize: 23,
        fontWeight: '900',
        color: colors.premiumGold,
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
    alertIcon: {
        fontSize: 22,
    },
    greetingBlock: {
        marginTop: spacing.sm,
        marginBottom: 10,
        alignSelf: 'center',
        maxWidth: '100%',
        backgroundColor: 'rgba(255,248,225,0.94)',
        borderRadius: 999,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        paddingVertical: 6,
        paddingHorizontal: 14,
        ...shadows.medium,
    },
    homeGreetingLine: {
        fontSize: 14,
        lineHeight: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
    },

    homeGreeting: {
        fontSize: 15,
        lineHeight: 19,
        fontWeight: '900',
        letterSpacing: 1.2,
        color: '#A06F00',
    },
    homeName: {
        fontSize: 31,
        lineHeight: 37,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.md,
    },
    heroCard: {
        backgroundColor: 'rgba(255,248,225,0.94)',
        borderRadius: 24,
        borderWidth: 1.4,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.medium,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.primaryNavy,
        opacity: 0.8,
    },
    childName: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: 4,
    },
    heroText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.sm,
    },
    sectionTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.premiumGold,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    infoCard: {
        width: '48%',
        backgroundColor: colors.softCream,
        borderRadius: 16,
        borderWidth: 1.6,
        borderColor: colors.premiumGold,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        minHeight: 100,
        ...shadows.soft,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.slateText,
    },
    infoValue: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: 6,
    },
    tapHint: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: 6,
    },
    logoutButton: {
        height: 54,
        borderRadius: 17,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xxxl,
        ...shadows.medium,
    },
    logoutButtonText: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    loadingCard: {
        backgroundColor: '#FFFDF3',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginTop: spacing.lg,
        ...shadows.soft,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
    },
    chartCard: {
        backgroundColor: '#FFFDF3',
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.medium,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    presentDot: {
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: colors.premiumGold,
    },
    absentDot: {
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: colors.primaryNavy,
    },
    legendText: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.slateText,
    },
    barChartArea: {
        height: 225,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    barGroup: {
        width: '18%',
        alignItems: 'center',
    },
    barsWrapper: {
        height: 160,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 5,
    },
    presentBar: {
        width: 16,
        borderTopLeftRadius: 9,
        borderTopRightRadius: 9,
        backgroundColor: colors.premiumGold,
    },
    absentBar: {
        width: 16,
        borderTopLeftRadius: 9,
        borderTopRightRadius: 9,
        backgroundColor: colors.primaryNavy,
    },
    barLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
        marginTop: spacing.sm,
    },
    subjectRow: {
        backgroundColor: colors.white,
        borderRadius: 18,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...shadows.soft,
    },
    subjectName: {
        fontSize: 21,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    subjectSubText: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: 4,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.successGreen,
    },
    absentText: {
        color: '#DC2626',
    },
    card: {
        backgroundColor: '#FFFDF3',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    cardTitle: {
        fontSize: 23,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.sm,
    },
    cardText: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.darkText,
        marginTop: 4,
    },
    cardSubText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: 4,
    },
    cardHint: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.premiumGold,
        marginTop: spacing.md,
    },
    resultSummaryCard: {
        backgroundColor: '#FFFDF3',
        borderRadius: 22,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    resultSummaryGrid: {
        flexDirection: 'row',
        gap: 10,
        marginTop: spacing.md,
    },
    summaryBox: {
        flex: 1,
        backgroundColor: colors.softCream,
        borderRadius: 14,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.md,
        alignItems: 'center',
    },
    summaryTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: colors.slateText,
    },
    summaryValue: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: 4,
    },
    examRightBlock: {
        alignItems: 'flex-end',
    },
    gradeText: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.slateText,
        marginTop: 4,
    },
    noticeCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 24,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        ...shadows.soft,
    },
    noticeTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    noticeText: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.sm,
        lineHeight: 25,
    },
    backButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
        ...shadows.medium,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.42)',
        alignItems: 'flex-start',
    },

    menuCard: {
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
});