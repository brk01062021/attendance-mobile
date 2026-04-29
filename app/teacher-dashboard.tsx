import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '../src/services/api';

export default function TeacherDashboardScreen() {
    const { teacherId, teacherName } = useLocalSearchParams();

    const [date, setDate] = useState('2026-04-27');
    const [selectedDate, setSelectedDate] = useState('2026-04-27');
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [dashboard, setDashboard] = useState<any>(null);

    const loadDashboard = async () => {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.teacherDashboard}?teacherId=${teacherId}&date=${date}`
            );

            if (!response.ok) {
                throw new Error('Failed to load teacher dashboard');
            }

            const data = await response.json();
            setDashboard(data);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load teacher dashboard');
        }
    };

    const confirmDate = () => {
        setDate(selectedDate);
        setShowCalendarModal(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Professional Dashboard</Text>
            <Text style={styles.subtitle}>{teacherName}</Text>

            <Text style={styles.label}>Date</Text>

            <TouchableOpacity
                style={styles.dateBox}
                onPress={() => {
                    setSelectedDate(date);
                    setShowCalendarModal(true);
                }}
            >
                <Text style={styles.dateText}>{date}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={loadDashboard}>
                <Text style={styles.buttonText}>Load Dashboard</Text>
            </TouchableOpacity>

            {dashboard && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Summary</Text>
                    <Text style={styles.cardText}>Teacher ID: {dashboard.teacherId}</Text>
                    <Text style={styles.cardText}>Teacher Name: {dashboard.teacherName}</Text>
                    <Text style={styles.cardText}>Total Students: {dashboard.totalStudents}</Text>
                    <Text style={styles.cardText}>Present: {dashboard.present}</Text>
                    <Text style={styles.cardText}>Absent: {dashboard.absent}</Text>
                    <Text style={styles.cardText}>Late: {dashboard.late}</Text>
                    <Text style={styles.percentage}>
                        Attendance: {dashboard.attendancePercentage.toFixed(2)}%
                    </Text>
                </View>
            )}

            <Modal visible={showCalendarModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Dashboard Date</Text>

                        <Text style={styles.modalLabel}>Dashboard Date</Text>
                        <View style={styles.selectedDateBox}>
                            <Text style={styles.selectedDateText}>{selectedDate}</Text>
                        </View>

                        <Calendar
                            current={selectedDate}
                            onDayPress={(day) => {
                                setSelectedDate(day.dateString);
                            }}
                            markedDates={{
                                [selectedDate]: {
                                    selected: true,
                                    selectedColor: '#0ea5e9',
                                },
                            }}
                        />

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCalendarModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={confirmDate}
                            >
                                <Text style={styles.modalButtonText}>Confirm Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        color: '#374151',
    },
    dateBox: {
        borderWidth: 1,
        borderColor: '#93c5fd',
        borderRadius: 10,
        padding: 14,
        marginBottom: 18,
        backgroundColor: '#eff6ff',
    },
    dateText: {
        fontSize: 16,
        color: '#111827',
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 25,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#111827',
    },
    cardText: {
        fontSize: 16,
        marginBottom: 8,
        color: '#374151',
    },
    percentage: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#16a34a',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 25,
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 18,
    },
    modalLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    selectedDateBox: {
        backgroundColor: '#e5e7eb',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginBottom: 18,
    },
    selectedDateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
    },
    modalButtonRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 18,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#6b7280',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    confirmButton: {
        flex: 1,
        backgroundColor: '#16a34a',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});