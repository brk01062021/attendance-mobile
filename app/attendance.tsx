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
    ImageBackground,
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
            setStudents(data);
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
                    onPress: () => router.replace('/home' as any),
                },
            ]);
        } catch {
            Alert.alert('Error', 'Submission failed');
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
        <ImageBackground
            source={images.splashGold}
            style={styles.screen}
            resizeMode="cover"
        >
            <View style={styles.overlay}>

                <ScrollView contentContainerStyle={styles.container}>
                    <Text style={styles.title}>Students Attendance</Text>

                    <Text style={styles.info}>Teacher: {teacherName}</Text>
                    <Text style={styles.info}>Subject: {subject}</Text>
                    <Text style={styles.info}>Class: {className}</Text>
                    <Text style={styles.info}>Section: {section}</Text>

                    {students.map((student) => (
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
        padding: 20,
        paddingBottom: 100,
    },

    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#041226',
        marginBottom: 12,
    },

    info: {
        fontSize: 15,
        color: '#041226',
        marginBottom: 4,
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