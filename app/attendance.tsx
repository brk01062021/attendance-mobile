import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '../src/services/api';

type AttendanceStatus = 'Present' | 'Absent' | 'Late';

type Student = {
    id: number;
    name: string;
};

export default function AttendanceScreen() {
    const { className, section } = useLocalSearchParams();

    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<number, AttendanceStatus>>({});
    const [loading, setLoading] = useState(false);

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

    const handleSubmitAttendance = async () => {
        try {
            const attendanceDate = new Date().toISOString().split('T')[0];

            const payload = {
                attendanceList: students.map((student) => ({
                    studentId: student.id,
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

            Alert.alert('Success', 'Attendance submitted successfully');
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
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Students Attendance</Text>

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

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitAttendance}>
                <Text style={styles.submitButtonText}>Submit Attendance</Text>
            </TouchableOpacity>
        </ScrollView>
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
});