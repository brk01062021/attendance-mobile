import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
    ImageBackground,
    TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_ENDPOINTS } from '../src/services/api';
import { images } from '../src/constants/images';

type AttendanceStatus = 'Present' | 'Absent' | 'Late';

type Student = {
    id: number;
    name: string;
};

const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function AttendanceScreen() {
    const { teacherId, teacherName, subject, className, section } =
        useLocalSearchParams();

    const todayDate = new Date();
    const today = formatLocalDate(todayDate);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(todayDate.getDate() - 7);

    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
    const [loading, setLoading] = useState(false);

    const [showDateModal, setShowDateModal] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(today);
    const [selectedDate, setSelectedDate] = useState(todayDate);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | 'Present' | 'Late' | 'Absent'>('All');

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API_ENDPOINTS.loadStudents}?className=${className}&section=${section}`
            );
            const data = await response.json();
            const safeData = Array.isArray(data) ? data : [];

            setStudents(safeData);

            const defaultAttendance: Record<number, AttendanceStatus> = {};
            safeData.forEach((student: Student) => {
                defaultAttendance[student.id] = 'Present';
            });
            setAttendance(defaultAttendance);
        } catch (error) {
            Alert.alert('Error', 'Unable to load students');
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = (studentId: number, status: AttendanceStatus) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: status,
        }));
    };

    const openDatePopup = () => {
        const currentDate = new Date();
        setSelectedDate(currentDate);
        setAttendanceDate(formatLocalDate(currentDate));
        setShowCalendar(false);
        setShowDateModal(true);
    };

    const handleDateChange = (_event: any, date?: Date) => {
        if (!date) return;

        if (date < sevenDaysAgo || date > todayDate) {
            Alert.alert('Invalid Date', 'Only last 7 days allowed');
            return;
        }

        setSelectedDate(date);
        setAttendanceDate(formatLocalDate(date));
    };

    const handleSubmitAttendance = async () => {
        try {
            const payload = {
                attendanceList: students.map((student) => ({
                    studentId: student.id,
                    teacherId: Number(teacherId),
                    teacherName,
                    subjectName: subject,
                    className,
                    section,
                    attendanceDate,
                    status: attendance[student.id] || 'Absent',
                })),
            };

            await fetch(`${API_ENDPOINTS.submitAttendance}/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            setShowDateModal(false);

            Alert.alert('Success', 'Attendance submitted', [
                {
                    text: 'OK',
                    onPress: () =>
                        router.replace({
                            pathname: '/teacher-dashboard',
                            params: {
                                teacherId,
                                teacherName,
                                role: 'TEACHER',
                            },
                        } as any),
                },
            ]);
        } catch {
            Alert.alert('Error', 'Submission failed');
        }
    };


    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const currentStatus = attendance[student.id] || 'Present';
            const matchesSearch = student.name
                .toLowerCase()
                .includes(searchText.trim().toLowerCase());
            const matchesFilter =
                statusFilter === 'All' || currentStatus === statusFilter;

            return matchesSearch && matchesFilter;
        });
    }, [students, attendance, searchText, statusFilter]);

    const attendanceSummary = useMemo(() => {
        const values = students.map(
            (student) => attendance[student.id] || 'Present'
        );

        return {
            present: values.filter((status) => status === 'Present').length,
            late: values.filter((status) => status === 'Late').length,
            absent: values.filter((status) => status === 'Absent').length,
        };
    }, [students, attendance]);

    const markAllPresent = () => {
        const updatedAttendance: Record<number, AttendanceStatus> = {};

        students.forEach((student) => {
            updatedAttendance[student.id] = 'Present';
        });

        setAttendance(updatedAttendance);
        setStatusFilter('All');
        setSearchText('');
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading students...</Text>
            </View>
        );
    }

    return (
        <ImageBackground
            source={images.splashGold}
            style={styles.screen}
            resizeMode="cover"
        >
            <View style={styles.overlay}>

                <ScrollView contentContainerStyle={styles.container}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() =>
                                router.replace({
                                    pathname: '/home',
                                    params: {
                                        teacherId,
                                        teacherName,
                                        role: 'TEACHER',
                                    },
                                } as any)
                            }
                            activeOpacity={0.85}
                        >
                            <Text style={styles.backButtonText}>‹</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>Students Attendance</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <Text style={styles.info}>Teacher: {teacherName}</Text>
                    <Text style={styles.info}>Subject: {subject}</Text>
                    <Text style={styles.info}>Class: {className}</Text>
                    <Text style={styles.info}>Section: {section}</Text>

                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search student by name"
                            placeholderTextColor="#6b7280"
                        />

                        {searchText.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearSearchButton}
                                onPress={() => setSearchText('')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.clearSearchText}>×</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.filterRow}>
                        {(['All', 'Present', 'Late', 'Absent'] as const).map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={[
                                    styles.filterChip,
                                    statusFilter === item && styles.filterChipActive,
                                ]}
                                onPress={() => setStatusFilter(item)}
                                activeOpacity={0.85}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        statusFilter === item && styles.filterChipTextActive,
                                    ]}
                                >
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.markAllButton}
                        onPress={markAllPresent}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.markAllButtonText}>Mark All Present</Text>
                    </TouchableOpacity>

                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Attendance Summary</Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryPresent}>
                                Present: {attendanceSummary.present}
                            </Text>

                            <Text style={styles.summaryLate}>
                                Late: {attendanceSummary.late}
                            </Text>

                            <Text style={styles.summaryAbsent}>
                                Absent: {attendanceSummary.absent}
                            </Text>
                        </View>
                    </View>

                    {filteredStudents.map((student) => (
                        <View key={student.id} style={styles.card}>
                            <Text style={styles.studentName}>{student.name}</Text>

                            <View style={styles.row}>
                                {(['Present', 'Late', 'Absent'] as AttendanceStatus[]).map((status) => (
                                    <TouchableOpacity
                                        key={status}
                                        style={[
                                            styles.statusButton,
                                            attendance[student.id] === status && styles.selected,
                                        ]}
                                        onPress={() => markAttendance(student.id, status)}
                                    >
                                        <Text style={styles.statusText}>{status}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))}

                    <TouchableOpacity style={styles.submitButton} onPress={openDatePopup}>
                        <Text style={styles.submitText}>Submit Attendance</Text>
                    </TouchableOpacity>
                </ScrollView>

                <Modal visible={showDateModal} transparent animationType="slide">
                    <View style={styles.modalBg}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Select Date</Text>

                            <TouchableOpacity
                                style={styles.dateBox}
                                onPress={() => setShowCalendar(true)}
                            >
                                <Text style={styles.dateText}>{attendanceDate}</Text>
                            </TouchableOpacity>

                            {showCalendar && (
                                <DateTimePicker
                                    value={selectedDate}
                                    mode="date"
                                    display="inline"
                                    onChange={handleDateChange}
                                />
                            )}

                            <View style={styles.modalRow}>
                                <TouchableOpacity style={styles.cancel} onPress={() => setShowDateModal(false)}>
                                    <Text style={styles.modalBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.confirm} onPress={handleSubmitAttendance}>
                                    <Text style={styles.modalBtnText}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({

    screen: { flex: 1 },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },

    container: {
        paddingHorizontal: 20,
        paddingTop: 64,
        paddingBottom: 100,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
    },

    backButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: 'rgba(255,255,255,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    backButtonText: {
        fontSize: 34,
        lineHeight: 36,
        fontWeight: '900',
        color: '#041226',
    },

    headerSpacer: {
        width: 46,
    },

    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 26,
        fontWeight: '900',
        color: '#041226',
    },

    info: {
        fontSize: 15,
        color: '#041226',
        marginBottom: 4,
    },


    searchContainer: {
        marginTop: 16,
        position: 'relative',
    },

    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingLeft: 14,
        paddingRight: 48,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#D8B84A',
        color: '#041226',
        fontWeight: '800',
    },

    clearSearchButton: {
        position: 'absolute',
        right: 10,
        top: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#041226',
        alignItems: 'center',
        justifyContent: 'center',
    },

    clearSearchText: {
        color: '#D8B84A',
        fontSize: 24,
        lineHeight: 26,
        fontWeight: '900',
    },

    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },

    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 22,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D8B84A',
    },

    filterChipActive: {
        backgroundColor: '#041226',
    },

    filterChipText: {
        color: '#041226',
        fontWeight: '900',
    },

    filterChipTextActive: {
        color: '#D8B84A',
    },

    markAllButton: {
        marginTop: 12,
        backgroundColor: '#041226',
        padding: 13,
        borderRadius: 12,
        alignItems: 'center',
    },

    markAllButtonText: {
        color: '#D8B84A',
        fontWeight: '900',
    },

    summaryCard: {
        backgroundColor: '#FFF8E1',
        borderRadius: 14,
        padding: 13,
        borderWidth: 1,
        borderColor: '#D8B84A',
        marginTop: 14,
    },

    summaryTitle: {
        fontWeight: '900',
        color: '#041226',
        marginBottom: 8,
    },

    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },

    summaryPresent: {
        fontWeight: '900',
        color: '#16a34a',
    },

    summaryLate: {
        fontWeight: '900',
        color: '#D97706',
    },

    summaryAbsent: {
        fontWeight: '900',
        color: '#dc2626',
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#D8B84A',
    },

    studentName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#041226',
        marginBottom: 10,
    },

    row: {
        flexDirection: 'row',
        gap: 10,
    },

    statusButton: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#eee',
        alignItems: 'center',
    },

    selected: {
        backgroundColor: '#041226',
    },

    statusText: {
        color: '#D8B84A',
        fontWeight: '800',
    },

    submitButton: {
        marginTop: 20,
        backgroundColor: '#041226',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    submitText: {
        color: '#D8B84A',
        fontWeight: '900',
    },

    modalBg: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 20,
    },

    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
    },

    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#041226',
        marginBottom: 10,
    },

    dateBox: {
        backgroundColor: '#eee',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 12,
    },

    dateText: {
        fontWeight: '800',
        color: '#041226',
    },

    modalRow: {
        flexDirection: 'row',
        gap: 10,
    },

    cancel: {
        flex: 1,
        backgroundColor: '#6b7280',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },

    confirm: {
        flex: 1,
        backgroundColor: '#041226',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },

    modalBtnText: {
        color: '#fff',
        fontWeight: '900',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        marginTop: 10,
    },
});