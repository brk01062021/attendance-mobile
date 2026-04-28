import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_ENDPOINTS } from '../src/services/api';

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

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_ENDPOINTS.loadStudents}?className=${className}&section=${section}`
            );

            if (!response.ok) {
                throw new Error('Failed to load students');
            }

            const data = await response.json();
            setStudents(data);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load students from backend');
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
        if (!date) {
            setShowCalendar(false);
            return;
        }

        if (date < sevenDaysAgo || date > todayDate) {
            Alert.alert('Invalid Date', 'You can select only today or previous 7 days.');
            setShowCalendar(false);
            return;
        }

        setSelectedDate(date);
        setAttendanceDate(formatLocalDate(date));
        setShowCalendar(false);
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

            const response = await fetch(`${API_ENDPOINTS.submitAttendance}/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to submit attendance');
            }

            setShowDateModal(false);
            setShowCalendar(false);

            Alert.alert('Success', 'Attendance submitted successfully', [
                {
                    text: 'OK',
                    onPress: () =>
                        router.replace({
                            pathname: '/home',
                            params: {
                                teacherId,
                                teacherName,
                            },
                        } as any),
                },
            ]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to submit attendance');
        }
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
        <>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Students Attendance</Text>

                {teacherName ? <Text style={styles.info}>Teacher: {teacherName}</Text> : null}
                {subject ? <Text style={styles.info}>Subject: {subject}</Text> : null}
                <Text style={styles.info}>Class: {className}</Text>
                <Text style={styles.info}>Section: {section}</Text>

                {students.length === 0 ? (
                    <Text style={styles.noData}>No students found</Text>
                ) : (
                    students.map((student) => (
                        <View key={student.id} style={styles.studentCard}>
                            <Text style={styles.studentName}>{student.name}</Text>

                            <View style={styles.buttonRow}>
                                <TouchableOpacity
                                    style={[
                                        styles.statusButton,
                                        attendance[student.id] === 'Present' && styles.presentSelected,
                                    ]}
                                    onPress={() => markAttendance(student.id, 'Present')}
                                >
                                    <Text style={styles.statusText}>Present</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.statusButton,
                                        attendance[student.id] === 'Late' && styles.lateSelected,
                                    ]}
                                    onPress={() => markAttendance(student.id, 'Late')}
                                >
                                    <Text style={styles.statusText}>Late</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.statusButton,
                                        attendance[student.id] === 'Absent' && styles.absentSelected,
                                    ]}
                                    onPress={() => markAttendance(student.id, 'Absent')}
                                >
                                    <Text style={styles.statusText}>Absent</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                <TouchableOpacity style={styles.submitButton} onPress={openDatePopup}>
                    <Text style={styles.submitButtonText}>Submit Attendance</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal visible={showDateModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Attendance Date</Text>

                        <Text style={styles.label}>Attendance Date</Text>

                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowCalendar(true)}
                        >
                            <Text style={styles.selectedDateText}>{attendanceDate}</Text>
                        </TouchableOpacity>

                        {showCalendar && (
                            <View style={styles.calendarContainer}>
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="inline"
                                minimumDate={sevenDaysAgo}
                                maximumDate={todayDate}
                                onChange={handleDateChange}
                                themeVariant="light"
                            />
                            </View>
                        )}

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowCalendar(false);
                                    setShowDateModal(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleSubmitAttendance}
                            >
                                <Text style={styles.modalButtonText}>Confirm Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 22,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    title: {
        fontSize: 27,
        fontWeight: 'bold',
        marginBottom: 18,
        color: '#111827',
    },
    info: {
        fontSize: 17,
        marginBottom: 8,
        color: '#374151',
    },
    noData: {
        fontSize: 16,
        marginTop: 25,
        color: '#dc2626',
        fontWeight: '600',
    },
    studentCard: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 15,
        marginTop: 15,
        backgroundColor: '#f9fafb',
    },
    studentName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statusButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
    },
    presentSelected: {
        backgroundColor: '#22c55e',
    },
    lateSelected: {
        backgroundColor: '#f59e0b',
    },
    absentSelected: {
        backgroundColor: '#ef4444',
    },
    statusText: {
        color: '#111827',
        fontWeight: 'bold',
    },
    submitButton: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 25,
        marginBottom: 40,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 25,
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 20,
        width:'92%',
        alignSelf: 'center',
    },
    calendarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginVertical: 5,
        transform: [{scale: 0.88}],
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 18,
        color: '#111827',
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        color: '#374151',
    },
    dateButton: {
        backgroundColor: '#e5e7eb',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 18,
    },
    selectedDateText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#6b7280',
        padding: 13,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#16a34a',
        padding: 13,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});