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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '../src/services/api';

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

        if (date) {
            params.append('date', date);
        }

        if (adminClassName) {
            params.append('className', adminClassName);
        }

        if (adminSection) {
            params.append('section', adminSection);
        }

        if (adminSubject) {
            params.append('subjectName', adminSubject);
        }

        return `${API_ENDPOINTS.adminStudentDashboard}?${params.toString()}`;
    };

    const getAdminStudentAttendanceUrlWithoutDate = () => {
        const params = new URLSearchParams();

        if (adminClassName) {
            params.append('className', adminClassName);
        }

        if (adminSection) {
            params.append('section', adminSection);
        }

        if (adminSubject) {
            params.append('subjectName', adminSubject);
        }

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
        if (status === 'PRESENT') {
            return styles.presentStatus;
        }

        if (status === 'ABSENT') {
            return styles.absentStatus;
        }

        if (status === 'LATE') {
            return styles.lateStatus;
        }

        return styles.defaultStatus;
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            {isAdmin ? (
                <View style={styles.adminHeaderRow}>
                    <View style={styles.adminTitleBox}>
                        <Text style={styles.adminDashboardTitle}>Admin’s Students Dashboard</Text>
                        <Text style={styles.adminWelcomeText}>Welcome, Principal</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.menuIconButton}
                        onPress={() => setShowMenuModal(true)}
                    >
                        <Text style={styles.menuIcon}>☰</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.headerRow}>
                    <Text style={styles.welcome}>
                        Welcome, {teacherName || 'Teacher'}
                    </Text>

                    <TouchableOpacity
                        style={styles.menuIconButton}
                        onPress={() => setShowMenuModal(true)}
                    >
                        <Text style={styles.menuIcon}>☰</Text>
                    </TouchableOpacity>
                </View>
            )}

            {!isAdmin && (
                <>
                    <Text style={styles.title}>Load Students</Text>

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
                        style={styles.selectBox}
                        disabled={!subject}
                        onPress={() => setShowClassModal(true)}
                    >
                        <Text style={className ? styles.selectText : styles.placeholderText}>
                            {className || 'Select Class'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Section</Text>
                    <TouchableOpacity
                        style={styles.selectBox}
                        disabled={!className}
                        onPress={() => setShowSectionModal(true)}
                    >
                        <Text style={section ? styles.selectText : styles.placeholderText}>
                            {section || 'Select Section'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.loadButton} onPress={handleLoadStudents}>
                        <Text style={styles.loadButtonText}>Load Students</Text>
                    </TouchableOpacity>
                </>
            )}

            {isAdmin && (
                <>
                    <Text style={styles.label}>Attendance Date</Text>

                    <TouchableOpacity
                        style={styles.dateInputBox}
                        onPress={openAdminDateModal}
                    >
                        <Text style={styles.dateInputText}>{attendanceDate}</Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Class</Text>
                    <TouchableOpacity
                        style={styles.selectBox}
                        onPress={() => setShowAdminClassModal(true)}
                    >
                        <Text style={adminClassName ? styles.selectText : styles.placeholderText}>
                            {adminClassName || 'Select Class'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Section</Text>
                    <TouchableOpacity
                        style={styles.selectBox}
                        onPress={() => setShowAdminSectionModal(true)}
                    >
                        <Text style={adminSection ? styles.selectText : styles.placeholderText}>
                            {adminSection || 'Select Section'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.label}>Subject</Text>
                    <TouchableOpacity
                        style={styles.selectBox}
                        onPress={() => setShowAdminSubjectModal(true)}
                    >
                        <Text style={adminSubject ? styles.selectText : styles.placeholderText}>
                            {adminSubject || 'Select Subject'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.loadDashboardButton}
                        onPress={() => loadAdminDashboard(attendanceDate)}
                    >
                        <Text style={styles.loadDashboardButtonText}>Load Dashboard</Text>
                    </TouchableOpacity>

                    {dashboardLoaded && (
                        <View style={styles.dashboardResultBox}>
                            <Text style={styles.dashboardResultTitle}>
                                Filtered Attendance Dashboard
                            </Text>

                            <Text style={styles.dashboardResultText}>
                                Attendance Date: {adminDashboard.attendanceDate || attendanceDate}
                            </Text>

                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Total Students</Text>
                                <Text style={styles.summaryValue}>
                                    {adminDashboard.totalStudents}
                                </Text>
                            </View>

                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Present Students</Text>
                                <Text style={styles.summaryValue}>
                                    {adminDashboard.presentStudents}
                                </Text>
                            </View>

                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Absent Students</Text>
                                <Text style={styles.summaryValue}>
                                    {adminDashboard.absentStudents}
                                </Text>
                            </View>

                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Late Students</Text>
                                <Text style={styles.summaryValue}>
                                    {adminDashboard.lateStudents}
                                </Text>
                            </View>

                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Attendance Percentage</Text>
                                <Text style={styles.summaryValue}>
                                    {adminDashboard.attendancePercentage.toFixed(2)}%
                                </Text>
                            </View>

                            <Text style={styles.studentListTitle}>
                                Attention Needed Students
                            </Text>

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
                                <TouchableOpacity style={styles.menuItem} onPress={navigateToAdminTeacherDashboard}>
                                    <Text style={styles.menuItemText}>Admin Teacher Dashboard</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToTeacherLeavePlanning}>
                                    <Text style={styles.menuItemText}>Teacher Leave Planning</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToAdminParentDashboard}>
                                    <Text style={styles.menuItemText}>Admin Parent Dashboard</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToAttendanceReport}>
                                    <Text style={styles.menuItemText}>Attendance Report</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToImportSchoolData}>
                                    <Text style={styles.menuItemText}>Import School Data</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToRegisterTeacher}>
                                    <Text style={styles.menuItemText}>Register Teacher</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToRegisterParent}>
                                    <Text style={styles.menuItemText}>Register Parent</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToRegisterStudent}>
                                    <Text style={styles.menuItemText}>Register Student</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToTeacherAssignments}>
                                    <Text style={styles.menuItemText}>Teacher Assignments</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={styles.menuItem} onPress={navigateToTeacherDashboard}>
                                    <Text style={styles.menuItemText}>Teacher Dashboard</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToDateSummary}>
                                    <Text style={styles.menuItemText}>Load Date Summary</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={navigateToAttendanceReport}>
                                    <Text style={styles.menuItemText}>Attendance Report</Text>
                                </TouchableOpacity>
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

            <Modal visible={showAdminClassModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Class</Text>

                        {adminClassOptions.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setAdminClassName(item === 'All' ? '' : item);
                                    setShowAdminClassModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>
                                    {item === 'All' ? 'All Classes' : `Class ${item}`}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAdminClassModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showAdminSectionModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Section</Text>

                        {adminSectionOptions.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setAdminSection(item === 'All' ? '' : item);
                                    setShowAdminSectionModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>
                                    {item === 'All' ? 'All Sections' : `Section ${item}`}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAdminSectionModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showAdminSubjectModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Subject</Text>

                        {adminSubjectOptions.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setAdminSubject(item === 'All' ? '' : item);
                                    setShowAdminSubjectModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>
                                    {item === 'All' ? 'All Subjects' : item}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowAdminSubjectModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showSubjectModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Subject</Text>

                        {subjects.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setSubject(item);
                                    setShowSubjectModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>{item}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowSubjectModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showClassModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Class</Text>

                        {classes.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setClassName(item);
                                    setShowClassModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>Class {item}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowClassModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showSectionModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Section</Text>

                        {sections.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setSection(item);
                                    setShowSectionModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>Section {item}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowSectionModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fffdf7',
    },
    scrollContent: {
        padding: 25,
        paddingBottom: 60,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        marginTop: 20,
        marginBottom: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    welcome: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1e3a8a',
        flex: 1,
        textAlign: 'left',
    },
    adminHeaderRow: {
        marginTop: 20,
        marginBottom: 35,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    adminTitleBox: {
        flex: 1,
    },
    adminDashboardTitle: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#7a4f01',
        textAlign: 'left',
        marginBottom: 18,
    },
    adminWelcomeText: {
        fontSize: 30,
        fontWeight: '800',
        color: '#374151',
        textAlign: 'left',
    },
    menuIconButton: {
        padding: 10,
        borderRadius: 14,
        backgroundColor: '#fff8e7',
        borderWidth: 1,
        borderColor: '#f0d58a',
    },
    menuIcon: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#7a4f01',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 25,
        color: '#111827',
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        color: '#111827',
    },
    selectBox: {
        borderWidth: 1.5,
        borderColor: '#f0d58a',
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
        backgroundColor: '#fff8e7',
    },
    selectText: {
        fontSize: 16,
        color: '#111827',
    },
    placeholderText: {
        fontSize: 16,
        color: '#6b7280',
    },
    dateInputBox: {
        borderWidth: 1.5,
        borderColor: '#f0d58a',
        borderRadius: 14,
        padding: 16,
        marginBottom: 18,
        backgroundColor: '#fff8e7',
    },
    dateInputText: {
        fontSize: 20,
        color: '#111827',
    },
    disabledDayButton: {
        opacity: 0.35,
    },
    futureDayText: {
        color: '#cbd5e1',
    },
    loadButton: {
        backgroundColor: '#16a34a',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    loadButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    loadDashboardButton: {
        backgroundColor: '#7a4f01',
        padding: 17,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 5,
    },
    loadDashboardButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dashboardResultBox: {
        marginTop: 25,
    },
    dashboardResultTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
    },
    dashboardResultText: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 15,
    },
    summaryCard: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
    },
    summaryValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginTop: 5,
    },
    studentListTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 20,
        marginBottom: 12,
    },
    emptyBox: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 18,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    studentAttendanceCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
    },
    studentCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 10,
    },
    studentDetail: {
        fontSize: 15,
        color: '#374151',
        marginTop: 3,
    },
    alertReasonText: {
        fontSize: 15,
        color: '#dc2626',
        fontWeight: '700',
        marginTop: 6,
    },
    statusBadge: {
        fontSize: 13,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        overflow: 'hidden',
    },
    presentStatus: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    absentStatus: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
    },
    lateStatus: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
    },
    defaultStatus: {
        backgroundColor: '#e5e7eb',
        color: '#374151',
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.15)',
        alignItems: 'flex-end',
        paddingTop: 70,
        paddingRight: 20,
    },
    menuBox: {
        width: 285,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    menuItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#dc2626',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 25,
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    optionButton: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    optionText: {
        fontSize: 17,
    },
    closeButton: {
        backgroundColor: '#dc2626',
        padding: 13,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 18,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    calendarOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 25,
    },
    calendarModalBox: {
        backgroundColor: '#fff',
        borderRadius: 22,
        padding: 22,
    },
    calendarTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 22,
    },
    calendarLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 10,
    },
    selectedDateBox: {
        backgroundColor: '#e5e7eb',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginBottom: 22,
    },
    selectedDateText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    monthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    monthArrow: {
        fontSize: 38,
        color: '#0ea5e9',
        fontWeight: 'bold',
        paddingHorizontal: 15,
    },
    monthTitle: {
        fontSize: 20,
        color: '#334155',
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    weekDayText: {
        width: 40,
        textAlign: 'center',
        fontSize: 15,
        color: '#94a3b8',
        fontWeight: '600',
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
        backgroundColor: '#0ea5e9',
    },
    dayText: {
        fontSize: 18,
        color: '#334155',
    },
    otherMonthDayText: {
        color: '#cbd5e1',
    },
    selectedDayText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    calendarButtonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelDateButton: {
        flex: 1,
        backgroundColor: '#6b7280',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmDateButton: {
        flex: 1,
        backgroundColor: '#16a34a',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    calendarButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});