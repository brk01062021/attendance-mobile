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
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, shadows } from '../src/theme';

type AttendanceView = 'TODAY' | 'WEEKLY' | 'MONTHLY';
type MenuView = 'HOME' | 'EXAM_RESULTS' | 'SCHOOL_NOTICES';
type ExamDetailView = 'RECENT' | 'PAST' | null;

const subjectAttendance = {
    TODAY: [
        { subject: 'Telugu', present: 1, absent: 0, status: 'Present' },
        { subject: 'Math', present: 1, absent: 0, status: 'Present' },
        { subject: 'Science', present: 1, absent: 0, status: 'Present' },
        { subject: 'Social', present: 1, absent: 0, status: 'Present' },
        { subject: 'English', present: 0, absent: 1, status: 'Absent' },
    ],
    WEEKLY: [
        { subject: 'Telugu', present: 5, absent: 1, status: '83%' },
        { subject: 'Math', present: 6, absent: 0, status: '100%' },
        { subject: 'Science', present: 5, absent: 1, status: '83%' },
        { subject: 'Social', present: 4, absent: 2, status: '67%' },
        { subject: 'English', present: 5, absent: 1, status: '83%' },
    ],
    MONTHLY: [
        { subject: 'Telugu', present: 22, absent: 2, status: '92%' },
        { subject: 'Math', present: 21, absent: 3, status: '88%' },
        { subject: 'Science', present: 20, absent: 4, status: '83%' },
        { subject: 'Social', present: 23, absent: 1, status: '96%' },
        { subject: 'English', present: 19, absent: 5, status: '79%' },
    ],
};

const examResults = {
    RECENT: {
        title: 'Quarterly Exam',
        percentage: '86%',
        grade: 'A',
        rank: '5',
        subjects: [
            { subject: 'Telugu', marks: '86 / 100', percentage: '86%', grade: 'A' },
            { subject: 'Math', marks: '92 / 100', percentage: '92%', grade: 'A+' },
            { subject: 'Science', marks: '84 / 100', percentage: '84%', grade: 'A' },
            { subject: 'Social', marks: '88 / 100', percentage: '88%', grade: 'A' },
            { subject: 'English', marks: '80 / 100', percentage: '80%', grade: 'A' },
        ],
    },
    PAST: {
        title: 'Past Exam Results',
        percentage: '81%',
        grade: 'A',
        rank: '7',
        subjects: [
            { subject: 'Unit Test 2', marks: '82 / 100', percentage: '82%', grade: 'A' },
            { subject: 'Unit Test 1', marks: '79 / 100', percentage: '79%', grade: 'B+' },
            { subject: 'Monthly Test', marks: '83 / 100', percentage: '83%', grade: 'A' },
        ],
    },
};

const darkBackground = require('../assets/branding/splash-dark.png');
const goldBackground = require('../assets/branding/splash-gold.png');

export default function ParentDashboard() {
    const params = useLocalSearchParams();

    const parentName = String(params.parentName || 'Parent');
    const studentName = String(params.studentName || 'Demo Student');

    const [menuOpen, setMenuOpen] = useState(false);
    const [currentView, setCurrentView] = useState<MenuView>('HOME');
    const [selectedAttendance, setSelectedAttendance] =
        useState<AttendanceView | null>(null);
    const [examDetail, setExamDetail] = useState<ExamDetailView>(null);
    const [contentReady, setContentReady] = useState(true);

    const isHomePage = currentView === 'HOME' && !selectedAttendance;

    const backgroundSource = isHomePage ? darkBackground : goldBackground;

    useEffect(() => {
        if (isHomePage) {
            setContentReady(true);
            return;
        }

        setContentReady(false);
        const task = InteractionManager.runAfterInteractions(() => {
            setContentReady(true);
        });

        return () => task.cancel();
    }, [currentView, examDetail, isHomePage, selectedAttendance]);

    const topCenterTitle = useMemo(() => {
        if (selectedAttendance === 'TODAY') {
            return 'Today Subject-wise Attendance';
        }

        if (selectedAttendance === 'WEEKLY') {
            return 'Weekly Subject-wise Attendance';
        }

        if (selectedAttendance === 'MONTHLY') {
            return 'Monthly Subject-wise Attendance';
        }

        if (examDetail) {
            return examResults[examDetail].title;
        }

        if (currentView === 'EXAM_RESULTS') {
            return 'Exam Results';
        }

        if (currentView === 'SCHOOL_NOTICES') {
            return 'School Notices';
        }

        return '';
    }, [currentView, examDetail, selectedAttendance]);

    const closeMenu = useCallback(() => {
        setMenuOpen(false);
    }, []);

    const openMenu = useCallback(() => {
        setMenuOpen(true);
    }, []);

    const goLogin = useCallback(() => {
        router.replace('/login' as any);
    }, []);

    const goHome = useCallback(() => {
        setCurrentView('HOME');
        setSelectedAttendance(null);
        setExamDetail(null);
        setMenuOpen(false);
    }, []);

    const openAttendance = useCallback((view: AttendanceView) => {
        setCurrentView('HOME');
        setSelectedAttendance(view);
        setExamDetail(null);
    }, []);

    const closeAttendance = useCallback(() => {
        setSelectedAttendance(null);
    }, []);

    const openExamResults = useCallback(() => {
        setSelectedAttendance(null);
        setExamDetail(null);
        setCurrentView('EXAM_RESULTS');
        setMenuOpen(false);
    }, []);

    const openSchoolNotices = useCallback(() => {
        setSelectedAttendance(null);
        setExamDetail(null);
        setCurrentView('SCHOOL_NOTICES');
        setMenuOpen(false);
    }, []);

    const openRecentExam = useCallback(() => {
        setExamDetail('RECENT');
    }, []);

    const openPastExam = useCallback(() => {
        setExamDetail('PAST');
    }, []);

    const closeExamDetail = useCallback(() => {
        setExamDetail(null);
    }, []);

    return (
        <ImageBackground
            source={backgroundSource}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.topRow}>
                    <TouchableOpacity
                        style={styles.circleButton}
                        onPress={openMenu}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.circleButtonText}>☰</Text>
                    </TouchableOpacity>

                    {!isHomePage && (
                        <Text style={styles.topCenterTitle}>{topCenterTitle}</Text>
                    )}

                    <TouchableOpacity style={styles.circleButton} activeOpacity={0.85}>
                        <Text style={styles.alertIcon}>🔔</Text>
                    </TouchableOpacity>
                </View>

                {selectedAttendance ? (
                    contentReady ? (
                        <AttendanceDetail
                            view={selectedAttendance}
                            onBack={closeAttendance}
                        />
                    ) : (
                        <LoadingPanel label="Loading attendance details..." />
                    )
                ) : currentView === 'EXAM_RESULTS' ? (
                    examDetail ? (
                        contentReady ? (
                            <ExamDetailScreen
                                type={examDetail}
                                onBack={closeExamDetail}
                            />
                        ) : (
                            <LoadingPanel label="Loading exam details..." />
                        )
                    ) : (
                        <ExamResultsScreen
                            onOpenRecent={openRecentExam}
                            onOpenPast={openPastExam}
                            onBack={goHome}
                        />
                    )
                ) : currentView === 'SCHOOL_NOTICES' ? (
                    contentReady ? (
                        <SchoolNoticesScreen onBack={goHome} />
                    ) : (
                        <LoadingPanel label="Loading school notices..." />
                    )
                ) : (
                    <HomeScreen
                        parentName={parentName}
                        studentName={studentName}
                        onOpenAttendance={openAttendance}
                        onLogout={goLogin}
                    />
                )}
            </ScrollView>

            <Modal transparent visible={menuOpen} animationType="fade">
                <TouchableOpacity
                    style={styles.menuOverlay}
                    activeOpacity={1}
                    onPress={closeMenu}
                >
                    <View style={styles.menuCard}>
                        <Text style={styles.menuTitle}>Parent Menu</Text>

                        <MenuItem title="🏠 Home" onPress={goHome} />
                        <MenuItem title="📝 Exam Results" onPress={openExamResults} />
                        <MenuItem title="🔔 School Notices" onPress={openSchoolNotices} />
                        <MenuItem title="🚪 Logout" onPress={goLogin} />
                    </View>
                </TouchableOpacity>
            </Modal>
        </ImageBackground>
    );
}

const LoadingPanel = memo(function LoadingPanel({ label }: { label: string }) {
    return (
        <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>{label}</Text>
        </View>
    );
});

const HomeScreen = memo(function HomeScreen({
                                                parentName,
                                                studentName,
                                                onOpenAttendance,
                                                onLogout,
                                            }: {
    parentName: string;
    studentName: string;
    onOpenAttendance: (view: AttendanceView) => void;
    onLogout: () => void;
}) {
    const openToday = useCallback(() => {
        onOpenAttendance('TODAY');
    }, [onOpenAttendance]);

    const openWeekly = useCallback(() => {
        onOpenAttendance('WEEKLY');
    }, [onOpenAttendance]);

    const openMonthly = useCallback(() => {
        onOpenAttendance('MONTHLY');
    }, [onOpenAttendance]);

    return (
        <>
            <View style={styles.greetingBlock}>
                <Text style={styles.homeGreeting}>Good Morning 👋</Text>
                <Text style={styles.homeName}>{parentName}</Text>
            </View>

            <View style={styles.heroCard}>
                <Text style={styles.sectionLabel}>Child</Text>
                <Text style={styles.childName}>{studentName}</Text>
                <Text style={styles.heroText}>Today Attendance: Present</Text>
            </View>

            <Text style={styles.sectionTitle}>Attendance</Text>

            <View style={styles.grid}>
                <AttendanceCard
                    title="Today"
                    value="Present"
                    hint="Tap to view graph"
                    onPress={openToday}
                />
                <AttendanceCard
                    title="Weekly"
                    value="5 / 6 Days"
                    hint="Tap to view graph"
                    onPress={openWeekly}
                />
                <AttendanceCard
                    title="Monthly"
                    value="21 / 24 Days"
                    hint="Tap to view graph"
                    onPress={openMonthly}
                />

                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>% Attendance</Text>
                    <Text style={styles.infoValue}>87.5%</Text>
                </View>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={onLogout}
                activeOpacity={0.9}
            >
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </>
    );
});

const AttendanceDetail = memo(function AttendanceDetail({
                                                            view,
                                                            onBack,
                                                        }: {
    view: AttendanceView;
    onBack: () => void;
}) {
    const data = subjectAttendance[view];

    const maxValue = useMemo(
        () => Math.max(...data.map((item) => item.present + item.absent)),
        [data]
    );

    return (
        <>
            <View style={styles.chartCard}>
                <Text style={styles.cardTitle}>Graphical Representation</Text>

                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={styles.presentDot} />
                        <Text style={styles.legendText}>Present</Text>
                    </View>

                    <View style={styles.legendItem}>
                        <View style={styles.absentDot} />
                        <Text style={styles.legendText}>Absent</Text>
                    </View>
                </View>

                <View style={styles.barChartArea}>
                    {data.map((item) => {
                        const presentHeight = Math.max(
                            item.present === 0 ? 0 : 14,
                            (item.present / maxValue) * 150
                        );

                        const absentHeight = Math.max(
                            item.absent === 0 ? 0 : 14,
                            (item.absent / maxValue) * 150
                        );

                        return (
                            <View key={item.subject} style={styles.barGroup}>
                                <View style={styles.barsWrapper}>
                                    <View
                                        style={[
                                            styles.presentBar,
                                            { height: presentHeight },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.absentBar,
                                            { height: absentHeight },
                                        ]}
                                    />
                                </View>

                                <Text style={styles.barLabel} numberOfLines={2}>
                                    {item.subject}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {data.map((item) => (
                <View key={item.subject} style={styles.subjectRow}>
                    <View>
                        <Text style={styles.subjectName}>{item.subject}</Text>
                        <Text style={styles.subjectSubText}>
                            Present: {item.present} | Absent: {item.absent}
                        </Text>
                    </View>

                    <Text
                        style={[
                            styles.statusText,
                            item.status === 'Absent' && styles.absentText,
                        ]}
                    >
                        {item.status}
                    </Text>
                </View>
            ))}

            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.9}
            >
                <Text style={styles.backButtonText}>Back to Parent Dashboard</Text>
            </TouchableOpacity>
        </>
    );
});

const ExamResultsScreen = memo(function ExamResultsScreen({
                                                              onOpenRecent,
                                                              onOpenPast,
                                                              onBack,
                                                          }: {
    onOpenRecent: () => void;
    onOpenPast: () => void;
    onBack: () => void;
}) {
    return (
        <>
            <TouchableOpacity
                style={styles.card}
                onPress={onOpenRecent}
                activeOpacity={0.85}
            >
                <Text style={styles.cardTitle}>Recent Result</Text>
                <Text style={styles.cardText}>Quarterly Exam: 86%</Text>
                <Text style={styles.cardSubText}>Grade A | Rank 5</Text>
                <Text style={styles.cardHint}>Tap to view subject-wise marks</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.card}
                onPress={onOpenPast}
                activeOpacity={0.85}
            >
                <Text style={styles.cardTitle}>Past Results</Text>
                <Text style={styles.cardText}>Unit Test 2: 82%</Text>
                <Text style={styles.cardText}>Unit Test 1: 79%</Text>
                <Text style={styles.cardHint}>Tap to view past result details</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.9}
            >
                <Text style={styles.backButtonText}>Back to Parent Dashboard</Text>
            </TouchableOpacity>
        </>
    );
});

const ExamDetailScreen = memo(function ExamDetailScreen({
                                                            type,
                                                            onBack,
                                                        }: {
    type: 'RECENT' | 'PAST';
    onBack: () => void;
}) {
    const result = examResults[type];

    return (
        <>
            <View style={styles.resultSummaryCard}>
                <Text style={styles.cardTitle}>{result.title}</Text>
                <View style={styles.resultSummaryGrid}>
                    <SummaryBox title="Percentage" value={result.percentage} />
                    <SummaryBox title="Grade" value={result.grade} />
                    <SummaryBox title="Rank" value={result.rank} />
                </View>
            </View>

            {result.subjects.map((item) => (
                <View key={item.subject} style={styles.subjectRow}>
                    <View>
                        <Text style={styles.subjectName}>{item.subject}</Text>
                        <Text style={styles.subjectSubText}>
                            Marks: {item.marks}
                        </Text>
                    </View>

                    <View style={styles.examRightBlock}>
                        <Text style={styles.statusText}>{item.percentage}</Text>
                        <Text style={styles.gradeText}>Grade {item.grade}</Text>
                    </View>
                </View>
            ))}

            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.9}
            >
                <Text style={styles.backButtonText}>Back to Exam Results</Text>
            </TouchableOpacity>
        </>
    );
});

const SchoolNoticesScreen = memo(function SchoolNoticesScreen({
                                                                  onBack,
                                                              }: {
    onBack: () => void;
}) {
    return (
        <>
            <NoticeCard
                title="Holiday Alert"
                text="School holiday on Friday for local festival."
            />

            <NoticeCard
                title="Fee Notice"
                text="Term fee payment reminder due this month."
            />

            <NoticeCard
                title="Exam Alert"
                text="Half-yearly exam schedule starts next Monday."
            />

            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.9}
            >
                <Text style={styles.backButtonText}>Back to Parent Dashboard</Text>
            </TouchableOpacity>
        </>
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
        <TouchableOpacity
            style={styles.infoCard}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <Text style={styles.infoTitle}>{title}</Text>
            <Text style={styles.infoValue}>{value}</Text>
            <Text style={styles.tapHint}>{hint}</Text>
        </TouchableOpacity>
    );
});

const SummaryBox = memo(function SummaryBox({
                                                title,
                                                value,
                                            }: {
    title: string;
    value: string;
}) {
    return (
        <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>{title}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
        </View>
    );
});

const NoticeCard = memo(function NoticeCard({
                                                title,
                                                text,
                                            }: {
    title: string;
    text: string;
}) {
    return (
        <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>{title}</Text>
            <Text style={styles.noticeText}>{text}</Text>
        </View>
    );
});

const MenuItem = memo(function MenuItem({
                                            title,
                                            onPress,
                                        }: {
    title: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress}>
            <Text style={styles.menuItemText}>{title}</Text>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.primaryNavy,
    },
    container: {
        padding: spacing.screenPadding,
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
    alertIcon: {
        fontSize: 22,
    },
    greetingBlock: {
        marginTop: spacing.md,
        marginBottom: spacing.lg,
        alignSelf: 'flex-start',
    },
    homeGreeting: {
        fontSize: 23,
        fontWeight: '900',
        color: colors.premiumGold,
        textShadowColor: 'rgba(0,0,0,0.45)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    homeName: {
        fontSize: 42,
        lineHeight: 48,
        fontWeight: '900',
        color: colors.white,
        textShadowColor: 'rgba(0,0,0,0.55)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    heroCard: {
        backgroundColor: colors.premiumGold,
        borderRadius: 22,
        borderWidth: 1.6,
        borderColor: colors.white,
        padding: spacing.lg,
        marginBottom: spacing.xl,
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
        marginTop: spacing.md,
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
        backgroundColor: colors.white,
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
        backgroundColor: colors.white,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.xl,
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
        backgroundColor: colors.white,
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
        backgroundColor: colors.white,
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
        borderRadius: 22,
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
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-start',
        paddingTop: 90,
        paddingHorizontal: spacing.screenPadding,
    },
    menuCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        ...shadows.medium,
    },
    menuTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.lg,
    },
    menuItem: {
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardGoldBorder,
    },
    menuItemText: {
        fontSize: 17,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
});
