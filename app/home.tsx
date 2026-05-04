import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Alert,
    ScrollView,
    ImageBackground,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '../src/services/api';
import { colors, spacing, shadows } from '../src/theme';

type AdminStudentAttendance = {
    studentId: number;
    studentName: string;
    className: string;
    section: string;
    subjectName: string;
    status: string;
    attendanceDate: string;
    alertReason?: string;
};

export default function HomeScreen() {
    const { teacherId, teacherName, role } = useLocalSearchParams();

    const userRole = String(role || 'TEACHER').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    const [subject, setSubject] = useState('');
    const [className, setClassName] = useState('');
    const [section, setSection] = useState('');

    const [subjects, setSubjects] = useState<string[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [sections, setSections] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);

    const [showMenuModal, setShowMenuModal] = useState(false);
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const [attendanceDate, setAttendanceDate] = useState(todayString);
    const [selectedAdminDate, setSelectedAdminDate] = useState(todayString);
    const [showAdminDateModal, setShowAdminDateModal] = useState(false);
    const [dashboardLoaded, setDashboardLoaded] = useState(false);

    const [adminClassName, setAdminClassName] = useState('');
    const [adminSection, setAdminSection] = useState('');
    const [adminSubject, setAdminSubject] = useState('');

    const [showAdminClassModal, setShowAdminClassModal] = useState(false);
    const [showAdminSectionModal, setShowAdminSectionModal] = useState(false);
    const [showAdminSubjectModal, setShowAdminSubjectModal] = useState(false);

    const adminClassOptions = ['All', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    const adminSectionOptions = ['All', 'A', 'B', 'C', 'D'];
    const adminSubjectOptions = ['All', 'English', 'Hindi', 'Telugu', 'Math', 'Maths', 'Science', 'Social'];

    const [adminStudentAttendance, setAdminStudentAttendance] = useState<AdminStudentAttendance[]>([]);

    const [adminDashboard, setAdminDashboard] = useState({
        attendanceDate: '',
        totalStudents: 0,
        presentStudents: 0,
        absentStudents: 0,
        lateStudents: 0,
        attendancePercentage: 0,
    });

    const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
    const [calendarYear, setCalendarYear] = useState(today.getFullYear());

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    useEffect(() => {
        if (!isAdmin) {
            loadSubjects();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (!isAdmin && subject) {
            loadClasses();
            setClassName('');
            setSection('');
            setSections([]);
        }
    }, [subject]);

    useEffect(() => {
        if (!isAdmin && subject && className) {
            loadSections();
            setSection('');
        }
    }, [className]);

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const getCalendarDays = () => {
        const firstDay = new Date(calendarYear, calendarMonth, 1);
        const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
        const startDay = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const previousMonthLastDay = new Date(calendarYear, calendarMonth, 0).getDate();

        const days: {
            day: number;
            date: string;
            currentMonth: boolean;
        }[] = [];

        for (let i = startDay - 1; i >= 0; i--) {
            const day = previousMonthLastDay - i;
            const date = new Date(calendarYear, calendarMonth - 1, day);

            days.push({
                day,
                date: formatDate(date),
                currentMonth: false,
            });
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(calendarYear, calendarMonth, day);

            days.push({
                day,
                date: formatDate(date),
                currentMonth: true,
            });
        }

        const nextDays = 42 - days.length;

        for (let day = 1; day <= nextDays; day++) {
            const date = new Date(calendarYear, calendarMonth + 1, day);

            days.push({
                day,
                date: formatDate(date),
                currentMonth: false,
            });
        }

        return days;
    };

    const goToPreviousMonth = () => {
        if (calendarMonth === 0) {
            setCalendarMonth(11);
            setCalendarYear(calendarYear - 1);
        } else {
            setCalendarMonth(calendarMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (calendarMonth === 11) {
            setCalendarMonth(0);
            setCalendarYear(calendarYear + 1);
        } else {
            setCalendarMonth(calendarMonth + 1);
        }
    };

    const openAdminDateModal = () => {
        const currentDate = new Date(attendanceDate);

        setSelectedAdminDate(attendanceDate);
        setCalendarMonth(currentDate.getMonth());
        setCalendarYear(currentDate.getFullYear());
        setShowAdminDateModal(true);
    };

    const confirmAdminDate = () => {
        setAttendanceDate(selectedAdminDate);
        setShowAdminDateModal(false);
        loadAdminDashboard(selectedAdminDate);
    };

    const getAdminStudentAttendanceUrl = (date: string) => {
        const params = new URLSearchParams();

        if (date) params.append('date', date);
        if (adminClassName) params.append('className', adminClassName);
        if (adminSection) params.append('section', adminSection);
        if (adminSubject) params.append('subjectName', adminSubject);

        return `${API_ENDPOINTS.adminStudentDashboard}?${params.toString()}`;
    };

    const getAdminStudentAttendanceUrlWithoutDate = () => {
        const params = new URLSearchParams();

        if (adminClassName) params.append('className', adminClassName);
        if (adminSection) params.append('section', adminSection);
        if (adminSubject) params.append('subjectName', adminSubject);

        return `${API_ENDPOINTS.adminStudentDashboard}?${params.toString()}`;
    };

    const loadAdminDashboard = async (date: string) => {
        try {
            setLoading(true);

            const dashboardResponse = await fetch(
                `${API_ENDPOINTS.adminDashboard}?date=${date}`
            );

            await dashboardResponse.json();

            const studentResponse = await fetch(getAdminStudentAttendanceUrl(date));
            const studentData = await studentResponse.json();
            const safeStudentData = Array.isArray(studentData) ? studentData : [];

            const filteredTotal = safeStudentData.length;

            const filteredPresent = safeStudentData.filter(
                (item: AdminStudentAttendance) => item.status === 'PRESENT'
            ).length;

            const filteredAbsent = safeStudentData.filter(
                (item: AdminStudentAttendance) => item.status === 'ABSENT'
            ).length;

            const filteredLate = safeStudentData.filter(
                (item: AdminStudentAttendance) => item.status === 'LATE'
            ).length;

            const filteredAttended = filteredPresent + filteredLate;

            const filteredPercentage =
                filteredTotal === 0 ? 0 : (filteredAttended / filteredTotal) * 100;

            setAdminDashboard({
                attendanceDate: date,
                totalStudents: filteredTotal,
                presentStudents: filteredPresent,
                absentStudents: filteredAbsent,
                lateStudents: filteredLate,
                attendancePercentage: filteredPercentage,
            });

            const selectedDateObj = new Date(date);
            const fiveDaysAgo = new Date(selectedDateObj);
            fiveDaysAgo.setDate(selectedDateObj.getDate() - 4);

            const allRecordsResponse = await fetch(getAdminStudentAttendanceUrlWithoutDate());
            const allRecordsData = await allRecordsResponse.json();
            const safeAllRecordsData = Array.isArray(allRecordsData) ? allRecordsData : [];

            const absentStudents = safeStudentData
                .filter((item: AdminStudentAttendance) => item.status === 'ABSENT')
                .map((item: AdminStudentAttendance) => ({
                    ...item,
                    alertReason: 'Absent on selected date',
                }));

            const lastFiveDaysLateRecords = safeAllRecordsData.filter((item: AdminStudentAttendance) => {
                const itemDate = new Date(item.attendanceDate);

                return (
                    item.status === 'LATE' &&
                    itemDate >= fiveDaysAgo &&
                    itemDate <= selectedDateObj
                );
            });

            const lateCountMap: Record<number, number> = {};

            lastFiveDaysLateRecords.forEach((item: AdminStudentAttendance) => {
                lateCountMap[item.studentId] = (lateCountMap[item.studentId] || 0) + 1;
            });

            const repeatedLateStudents = lastFiveDaysLateRecords
                .filter((item: AdminStudentAttendance) => lateCountMap[item.studentId] >= 2)
                .map((item: AdminStudentAttendance) => ({
                    ...item,
                    alertReason: `Late ${lateCountMap[item.studentId]} times in last 5 days`,
                }));

            const attentionNeededStudents = [
                ...absentStudents,
                ...repeatedLateStudents,
            ].filter((item, index, self) =>
                    index === self.findIndex(
                        (s) => s.studentId === item.studentId && s.alertReason === item.alertReason
                    )
            );

            setAdminStudentAttendance(attentionNeededStudents);
            setDashboardLoaded(true);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load admin student dashboard');
        } finally {
            setLoading(false);
        }
    };

    const loadSubjects = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_ENDPOINTS.teacherSubjects}?teacherId=${teacherId}`
            );

            const data = await response.json();
            setSubjects(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load subjects');
            setSubjects([]);
        } finally {
            setLoading(false);
        }
    };

    const loadClasses = async () => {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.teacherClasses}?teacherId=${teacherId}&subjectName=${subject}`
            );

            const data = await response.json();
            setClasses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load classes');
            setClasses([]);
        }
    };

    const loadSections = async () => {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.teacherSections}?teacherId=${teacherId}&subjectName=${subject}&className=${className}`
            );

            const data = await response.json();
            setSections(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load sections');
            setSections([]);
        }
    };

    const handleLoadStudents = () => {
        if (!subject || !className || !section) {
            Alert.alert('Validation', 'Please select Subject, Class and Section');
            return;
        }

        router.push({
            pathname: '/attendance',
            params: {
                teacherId,
                teacherName,
                subject,
                className,
                section,
                role: userRole,
            },
        } as any);
    };

    const navigateToTeacherDashboard = () => {
        setShowMenuModal(false);

        router.push({
            pathname: '/teacher-dashboard',
            params: {
                teacherId,
                teacherName,
                role: userRole,
            },
        } as any);
    };

    const navigateToDateSummary = () => {
        setShowMenuModal(false);

        router.push({
            pathname: '/date-summary',
            params: {
                teacherId,
                teacherName,
                role: userRole,
            },
        } as any);
    };

    const navigateToAttendanceReport = () => {
        setShowMenuModal(false);

        router.push({
            pathname: '/attendance-report',
            params: {
                teacherId,
                teacherName,
                role: userRole,
            },
        } as any);
    };

    const navigateToAdminTeacherDashboard = () => {
        setShowMenuModal(false);
        router.push('/admin-teacher-dashboard' as any);
    };

    const navigateToTeacherLeavePlanning = () => {
        setShowMenuModal(false);
        router.push('/teacher-leave-planning' as any);
    };

    const navigateToAdminParentDashboard = () => {
        setShowMenuModal(false);
        router.push('/admin-parent-dashboard' as any);
    };

    const navigateToImportSchoolData = () => {
        setShowMenuModal(false);
        router.push('/import-school-data' as any);
    };

    const navigateToRegisterTeacher = () => {
        setShowMenuModal(false);
        router.push('/register-teacher' as any);
    };

    const navigateToRegisterParent = () => {
        setShowMenuModal(false);
        router.push('/register-parent' as any);
    };

    const navigateToRegisterStudent = () => {
        setShowMenuModal(false);
        router.push('/register-student' as any);
    };

    const navigateToTeacherAssignments = () => {
        setShowMenuModal(false);
        router.push('/teacher-assignments' as any);
    };

    const handleLogout = () => {
        setShowMenuModal(false);
        router.replace('/' as any);
    };

    const getStatusStyle = (status: string) => {
        if (status === 'PRESENT') return styles.presentStatus;
        if (status === 'ABSENT') return styles.absentStatus;
        if (status === 'LATE') return styles.lateStatus;
        return styles.defaultStatus;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.premiumGold} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <ImageBackground
                source={require('../assets/branding/india-ap-bg.png')}
                style={styles.hero}
                imageStyle={styles.heroImage}
                resizeMode="contain"
            >
                <View style={styles.heroOverlay}>
                    <View style={styles.heroTopRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.push('/home-v2' as any)}
                        >
                            <Text style={styles.backButtonText}>‹</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuIconButton}
                            onPress={() => setShowMenuModal(true)}
                        >
                            <Text style={styles.menuIcon}>☰</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.heroSmallText}>
                        {isAdmin ? 'Admin Workspace' : 'Teacher Workspace'}
                    </Text>

                    <Text style={styles.heroTitle}>
                        {isAdmin ? 'Student Dashboard' : 'Load Students'}
                    </Text>

                    <Text style={styles.heroSubtitle}>
                        {isAdmin
                            ? 'Filter attendance and review attention-needed students'
                            : `Welcome, ${teacherName || 'Teacher'}`}
                    </Text>
                </View>
            </ImageBackground>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {!isAdmin && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Select Class Details</Text>
                        <Text style={styles.cardSubtitle}>
                            Choose subject, class and section to load students for attendance.
                        </Text>

                        <Text style={styles.label}>Subject</Text>
                        <TouchableOpacity
                            style={styles.selectBox}
                            onPress={() => setShowSubjectModal(true)}
                        >
                            <Text style={subject ? styles.selectText : styles.placeholderText}>
                                {subject || 'Select Subject'}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Class</Text>
                        <TouchableOpacity
                            style={[styles.selectBox, !subject && styles.disabledBox]}
                            disabled={!subject}
                            onPress={() => setShowClassModal(true)}
                        >
                            <Text style={className ? styles.selectText : styles.placeholderText}>
                                {className || 'Select Class'}
                            </Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Section</Text>
                        <TouchableOpacity
                            style={[styles.selectBox, !className && styles.disabledBox]}
                            disabled={!className}
                            onPress={() => setShowSectionModal(true)}
                        >
                            <Text style={section ? styles.selectText : styles.placeholderText}>
                                {section || 'Select Section'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleLoadStudents}>
                            <Text style={styles.primaryButtonText}>Load Students</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isAdmin && (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Attendance Filters</Text>
                            <Text style={styles.cardSubtitle}>
                                Select date, class, section and subject to view filtered attendance.
                            </Text>

                            <Text style={styles.label}>Attendance Date</Text>

                            <TouchableOpacity
                                style={styles.selectBox}
                                onPress={openAdminDateModal}
                            >
                                <Text style={styles.selectText}>{attendanceDate}</Text>
                            </TouchableOpacity>

                            <Text style={styles.label}>Class</Text>
                            <TouchableOpacity
                                style={styles.selectBox}
                                onPress={() => setShowAdminClassModal(true)}
                            >
                                <Text style={adminClassName ? styles.selectText : styles.placeholderText}>
                                    {adminClassName || 'All Classes'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.label}>Section</Text>
                            <TouchableOpacity
                                style={styles.selectBox}
                                onPress={() => setShowAdminSectionModal(true)}
                            >
                                <Text style={adminSection ? styles.selectText : styles.placeholderText}>
                                    {adminSection || 'All Sections'}
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.label}>Subject</Text>
                            <TouchableOpacity
                                style={styles.selectBox}
                                onPress={() => setShowAdminSubjectModal(true)}
                            >
                                <Text style={adminSubject ? styles.selectText : styles.placeholderText}>
                                    {adminSubject || 'All Subjects'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={() => loadAdminDashboard(attendanceDate)}
                            >
                                <Text style={styles.primaryButtonText}>Load Dashboard</Text>
                            </TouchableOpacity>
                        </View>

                        {dashboardLoaded && (
                            <View style={styles.resultSection}>
                                <Text style={styles.sectionTitle}>Filtered Attendance Dashboard</Text>
                                <Text style={styles.sectionSubtitle}>
                                    Attendance Date: {adminDashboard.attendanceDate || attendanceDate}
                                </Text>

                                <View style={styles.summaryGrid}>
                                    <SummaryCard title="Total" value={adminDashboard.totalStudents} icon="👥" />
                                    <SummaryCard title="Present" value={adminDashboard.presentStudents} icon="✅" />
                                    <SummaryCard title="Absent" value={adminDashboard.absentStudents} icon="🚫" />
                                    <SummaryCard title="Late" value={adminDashboard.lateStudents} icon="⏰" />
                                </View>

                                <View style={styles.percentageCard}>
                                    <Text style={styles.percentageLabel}>Attendance Percentage</Text>
                                    <Text style={styles.percentageValue}>
                                        {adminDashboard.attendancePercentage.toFixed(2)}%
                                    </Text>
                                </View>

                                <Text style={styles.sectionTitle}>Attention Needed Students</Text>

                                {adminStudentAttendance.length === 0 ? (
                                    <View style={styles.emptyBox}>
                                        <Text style={styles.emptyText}>
                                            No absent or repeated late students found.
                                        </Text>
                                    </View>
                                ) : (
                                    adminStudentAttendance.map((item, index) => (
                                        <View
                                            key={`${item.studentId}-${item.subjectName}-${item.attendanceDate}-${index}`}
                                            style={styles.studentAttendanceCard}
                                        >
                                            <View style={styles.studentCardHeader}>
                                                <Text style={styles.studentName}>
                                                    {item.studentName}
                                                </Text>

                                                <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                                                    {item.status}
                                                </Text>
                                            </View>

                                            <Text style={styles.studentDetail}>
                                                Class {item.className} - Section {item.section}
                                            </Text>

                                            <Text style={styles.studentDetail}>
                                                Subject: {item.subjectName}
                                            </Text>

                                            <Text style={styles.studentDetail}>
                                                Date: {item.attendanceDate}
                                            </Text>

                                            {item.alertReason && (
                                                <Text style={styles.alertReasonText}>
                                                    Reason: {item.alertReason}
                                                </Text>
                                            )}
                                        </View>
                                    ))
                                )}
                            </View>
                        )}
                    </>
                )}

                <Modal visible={showMenuModal} transparent animationType="fade">
                    <TouchableOpacity
                        style={styles.menuOverlay}
                        activeOpacity={1}
                        onPress={() => setShowMenuModal(false)}
                    >
                        <View style={styles.menuBox}>
                            {isAdmin ? (
                                <>
                                    <MenuItem title="Admin Teacher Dashboard" onPress={navigateToAdminTeacherDashboard} />
                                    <MenuItem title="Teacher Leave Planning" onPress={navigateToTeacherLeavePlanning} />
                                    <MenuItem title="Admin Parent Dashboard" onPress={navigateToAdminParentDashboard} />
                                    <MenuItem title="Attendance Report" onPress={navigateToAttendanceReport} />
                                    <MenuItem title="Import School Data" onPress={navigateToImportSchoolData} />
                                    <MenuItem title="Register Teacher" onPress={navigateToRegisterTeacher} />
                                    <MenuItem title="Register Parent" onPress={navigateToRegisterParent} />
                                    <MenuItem title="Register Student" onPress={navigateToRegisterStudent} />
                                    <MenuItem title="Teacher Assignments" onPress={navigateToTeacherAssignments} />
                                </>
                            ) : (
                                <>
                                    <MenuItem title="Teacher Dashboard" onPress={navigateToTeacherDashboard} />
                                    <MenuItem title="Load Date Summary" onPress={navigateToDateSummary} />
                                    <MenuItem title="Attendance Report" onPress={navigateToAttendanceReport} />
                                </>
                            )}

                            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                                <Text style={styles.logoutText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                <Modal visible={showAdminDateModal} transparent animationType="fade">
                    <View style={styles.calendarOverlay}>
                        <View style={styles.calendarModalBox}>
                            <Text style={styles.calendarTitle}>Select Dashboard Date</Text>

                            <Text style={styles.calendarLabel}>Dashboard Date</Text>

                            <View style={styles.selectedDateBox}>
                                <Text style={styles.selectedDateText}>{selectedAdminDate}</Text>
                            </View>

                            <View style={styles.monthRow}>
                                <TouchableOpacity onPress={goToPreviousMonth}>
                                    <Text style={styles.monthArrow}>‹</Text>
                                </TouchableOpacity>

                                <Text style={styles.monthTitle}>
                                    {monthNames[calendarMonth]} {calendarYear}
                                </Text>

                                <TouchableOpacity onPress={goToNextMonth}>
                                    <Text style={styles.monthArrow}>›</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.weekRow}>
                                {weekDays.map((day) => (
                                    <Text key={day} style={styles.weekDayText}>
                                        {day}
                                    </Text>
                                ))}
                            </View>

                            <View style={styles.daysGrid}>
                                {getCalendarDays().map((item, index) => {
                                    const isSelected = item.date === selectedAdminDate;
                                    const isFutureDate = item.date > todayString;

                                    return (
                                        <TouchableOpacity
                                            key={`${item.date}-${index}`}
                                            style={[
                                                styles.dayButton,
                                                isSelected && styles.selectedDayButton,
                                                isFutureDate && styles.disabledDayButton,
                                            ]}
                                            disabled={isFutureDate}
                                            onPress={() => {
                                                if (!isFutureDate) {
                                                    setSelectedAdminDate(item.date);
                                                }
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.dayText,
                                                    !item.currentMonth && styles.otherMonthDayText,
                                                    isFutureDate && styles.futureDayText,
                                                    isSelected && styles.selectedDayText,
                                                ]}
                                            >
                                                {item.day}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <View style={styles.calendarButtonRow}>
                                <TouchableOpacity
                                    style={styles.cancelDateButton}
                                    onPress={() => setShowAdminDateModal(false)}
                                >
                                    <Text style={styles.calendarButtonText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.confirmDateButton}
                                    onPress={confirmAdminDate}
                                >
                                    <Text style={styles.calendarButtonText}>Confirm Date</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                <OptionModal
                    visible={showAdminClassModal}
                    title="Select Class"
                    options={adminClassOptions}
                    getLabel={(item) => (item === 'All' ? 'All Classes' : `Class ${item}`)}
                    onSelect={(item) => {
                        setAdminClassName(item === 'All' ? '' : item);
                        setShowAdminClassModal(false);
                    }}
                    onClose={() => setShowAdminClassModal(false)}
                />

                <OptionModal
                    visible={showAdminSectionModal}
                    title="Select Section"
                    options={adminSectionOptions}
                    getLabel={(item) => (item === 'All' ? 'All Sections' : `Section ${item}`)}
                    onSelect={(item) => {
                        setAdminSection(item === 'All' ? '' : item);
                        setShowAdminSectionModal(false);
                    }}
                    onClose={() => setShowAdminSectionModal(false)}
                />

                <OptionModal
                    visible={showAdminSubjectModal}
                    title="Select Subject"
                    options={adminSubjectOptions}
                    getLabel={(item) => (item === 'All' ? 'All Subjects' : item)}
                    onSelect={(item) => {
                        setAdminSubject(item === 'All' ? '' : item);
                        setShowAdminSubjectModal(false);
                    }}
                    onClose={() => setShowAdminSubjectModal(false)}
                />

                <OptionModal
                    visible={showSubjectModal}
                    title="Select Subject"
                    options={subjects}
                    getLabel={(item) => item}
                    onSelect={(item) => {
                        setSubject(item);
                        setShowSubjectModal(false);
                    }}
                    onClose={() => setShowSubjectModal(false)}
                />

                <OptionModal
                    visible={showClassModal}
                    title="Select Class"
                    options={classes}
                    getLabel={(item) => `Class ${item}`}
                    onSelect={(item) => {
                        setClassName(item);
                        setShowClassModal(false);
                    }}
                    onClose={() => setShowClassModal(false)}
                />

                <OptionModal
                    visible={showSectionModal}
                    title="Select Section"
                    options={sections}
                    getLabel={(item) => `Section ${item}`}
                    onSelect={(item) => {
                        setSection(item);
                        setShowSectionModal(false);
                    }}
                    onClose={() => setShowSectionModal(false)}
                />
            </ScrollView>
        </View>
    );
}

function SummaryCard({
                         title,
                         value,
                         icon,
                     }: {
    title: string;
    value: number;
    icon: string;
}) {
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>{icon}</Text>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryTitle}>{title}</Text>
        </View>
    );
}

function MenuItem({
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
}

function OptionModal({
                         visible,
                         title,
                         options,
                         getLabel,
                         onSelect,
                         onClose,
                     }: {
    visible: boolean;
    title: string;
    options: string[];
    getLabel: (item: string) => string;
    onSelect: (item: string) => void;
    onClose: () => void;
}) {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalBackground}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>{title}</Text>

                    {options.length === 0 ? (
                        <Text style={styles.emptyText}>No options available.</Text>
                    ) : (
                        options.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => onSelect(item)}
                            >
                                <Text style={styles.optionText}>{getLabel(item)}</Text>
                            </TouchableOpacity>
                        ))
                    )}

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFF8DF',
    },
    hero: {
        height: 270,
        backgroundColor: colors.primaryNavy,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        flex: 1,
        backgroundColor: 'rgba(212, 175, 55, 0.84)',
        paddingTop: 56,
        paddingHorizontal: 22,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 26,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButtonText: {
        fontSize: 38,
        lineHeight: 40,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    menuIconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuIcon: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    heroSmallText: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.primaryNavy,
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: 38,
        lineHeight: 42,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 6,
    },
    heroSubtitle: {
        fontSize: 15,
        lineHeight: 21,
        fontWeight: '700',
        color: colors.primaryNavy,
        opacity: 0.9,
    },
    container: {
        flex: 1,
        marginTop: -42,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingBottom: 60,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF8DF',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: colors.primaryNavy,
        fontWeight: '800',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 26,
        borderWidth: 1,
        borderColor: '#F0D58A',
        padding: spacing.xxl,
        marginBottom: 18,
        ...shadows.medium,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 6,
    },
    cardSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
        color: colors.mutedText,
        marginBottom: 18,
    },
    label: {
        fontSize: 15,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 8,
        marginTop: 12,
    },
    selectBox: {
        borderWidth: 1.5,
        borderColor: '#F0D58A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
        backgroundColor: '#FFFDF7',
    },
    disabledBox: {
        opacity: 0.55,
    },
    selectText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.darkText,
    },
    placeholderText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.mutedText,
    },
    primaryButton: {
        height: 58,
        borderRadius: 18,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        ...shadows.medium,
    },
    primaryButtonText: {
        color: colors.primaryNavy,
        fontSize: 18,
        fontWeight: '900',
    },
    resultSection: {
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.mutedText,
        marginBottom: 14,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 14,
    },
    summaryCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0D58A',
        borderRadius: 22,
        padding: 16,
        alignItems: 'center',
        ...shadows.medium,
    },
    summaryIcon: {
        fontSize: 26,
        marginBottom: 8,
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.mutedText,
        marginTop: 4,
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    percentageCard: {
        backgroundColor: '#FFF3C4',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#E9C84A',
        padding: 18,
        marginBottom: 24,
    },
    percentageLabel: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.mutedText,
    },
    percentageValue: {
        fontSize: 34,
        fontWeight: '900',
        color: colors.deepGold,
        marginTop: 4,
    },
    emptyBox: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0D58A',
        borderRadius: 18,
        padding: 18,
        marginTop: 8,
    },
    emptyText: {
        fontSize: 15,
        color: colors.mutedText,
        textAlign: 'center',
        fontWeight: '700',
    },
    studentAttendanceCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0D58A',
        borderRadius: 20,
        padding: 16,
        marginTop: 12,
        ...shadows.medium,
    },
    studentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    studentName: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
        flex: 1,
        marginRight: 10,
    },
    studentDetail: {
        fontSize: 14,
        color: colors.slateText,
        fontWeight: '700',
        marginTop: 4,
    },
    alertReasonText: {
        fontSize: 14,
        color: colors.alertRed,
        fontWeight: '900',
        marginTop: 8,
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: '900',
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 18,
        overflow: 'hidden',
    },
    presentStatus: {
        backgroundColor: '#DCFCE7',
        color: '#166534',
    },
    absentStatus: {
        backgroundColor: '#FEE2E2',
        color: '#991B1B',
    },
    lateStatus: {
        backgroundColor: '#FEF3C7',
        color: '#92400E',
    },
    defaultStatus: {
        backgroundColor: '#E5E7EB',
        color: '#374151',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        alignItems: 'flex-end',
        paddingTop: 72,
        paddingRight: 18,
    },
    menuBox: {
        width: 290,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#F0D58A',
        ...shadows.medium,
    },
    menuItem: {
        paddingVertical: 15,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#F4E8BF',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primaryNavy,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.alertRed,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        padding: 24,
    },
    modalBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F0D58A',
    },
    modalTitle: {
        fontSize: 23,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 12,
    },
    optionButton: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F4E8BF',
    },
    optionText: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.darkText,
    },
    closeButton: {
        backgroundColor: colors.primaryNavy,
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 18,
    },
    closeButtonText: {
        color: colors.premiumGold,
        fontSize: 16,
        fontWeight: '900',
    },
    calendarOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 20,
    },
    calendarModalBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F0D58A',
    },
    calendarTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: 18,
    },
    calendarLabel: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.slateText,
        marginBottom: 10,
    },
    selectedDateBox: {
        backgroundColor: '#FFF3C4',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#E9C84A',
    },
    selectedDateText: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    monthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    monthArrow: {
        fontSize: 36,
        color: colors.deepGold,
        fontWeight: '900',
        paddingHorizontal: 15,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDayText: {
        width: 40,
        textAlign: 'center',
        fontSize: 13,
        color: colors.mutedText,
        fontWeight: '900',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    dayButton: {
        width: '14.28%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 30,
    },
    selectedDayButton: {
        backgroundColor: colors.primaryNavy,
    },
    disabledDayButton: {
        opacity: 0.35,
    },
    dayText: {
        fontSize: 17,
        color: colors.primaryNavy,
        fontWeight: '800',
    },
    otherMonthDayText: {
        color: '#CBD5E1',
    },
    futureDayText: {
        color: '#CBD5E1',
    },
    selectedDayText: {
        color: colors.premiumGold,
        fontWeight: '900',
    },
    calendarButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelDateButton: {
        flex: 1,
        backgroundColor: colors.mutedText,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    confirmDateButton: {
        flex: 1,
        backgroundColor: colors.premiumGold,
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    calendarButtonText: {
        color: colors.primaryNavy,
        fontSize: 15,
        fontWeight: '900',
    },
});