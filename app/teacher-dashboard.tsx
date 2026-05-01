import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '../src/services/api';

export default function TeacherDashboardScreen() {
    const { teacherId, teacherName } = useLocalSearchParams();

    const [date, setDate] = useState('2026-04-27');
    const [selectedDate, setSelectedDate] = useState('2026-04-27');
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    const [dashboardCards, setDashboardCards] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState('Highest Attendance First');
    const [showSortModal, setShowSortModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setHasLoadedOnce(true);

            const response = await fetch(
                `${API_ENDPOINTS.teacherClassDashboard}?teacherId=${teacherId}&date=${date}`
            );

            if (!response.ok) {
                throw new Error('Failed to load dashboard');
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setDashboardCards(data);
            } else {
                setDashboardCards([]);
            }
        } catch (error) {
            console.log(error);
            setDashboardCards([]);
            Alert.alert('Error', 'Unable to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const confirmDate = () => {
        setDate(selectedDate);
        setShowCalendarModal(false);
    };

    const getSortedCards = () => {
        const cards = [...dashboardCards];

        if (sortBy === 'Highest Attendance First') {
            cards.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
        } else if (sortBy === 'Lowest Attendance First') {
            cards.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
        } else {
            cards.sort((a, b) =>
                `${a.className}-${a.section}`.localeCompare(`${b.className}-${b.section}`)
            );
        }

        return cards;
    };

    const totalStudents = dashboardCards.reduce(
        (sum, item) => sum + item.totalStudents,
        0
    );

    const totalPresent = dashboardCards.reduce(
        (sum, item) => sum + item.present,
        0
    );

    const totalAbsent = dashboardCards.reduce(
        (sum, item) => sum + item.absent,
        0
    );

    const totalLate = dashboardCards.reduce(
        (sum, item) => sum + item.late,
        0
    );

    const overallAttendance =
        totalStudents === 0
            ? 0
            : ((totalPresent + totalLate) / totalStudents) * 100;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Dashboard</Text>
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

            <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={loadDashboard}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Loading...' : 'Load Dashboard'}
                </Text>
            </TouchableOpacity>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            )}

            {!loading && hasLoadedOnce && dashboardCards.length === 0 && (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataTitle}>No Data Found</Text>
                    <Text style={styles.noDataText}>
                        No attendance dashboard data found for selected date.
                    </Text>
                </View>
            )}

            {!loading && dashboardCards.length > 0 && (
                <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => setShowSortModal(true)}
                >
                    <Text style={styles.sortButtonText}>
                        Sort By: {sortBy}
                    </Text>
                </TouchableOpacity>
            )}

            {!loading && dashboardCards.length > 0 && (
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Today&apos;s Summary</Text>

                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryNumber}>{dashboardCards.length}</Text>
                            <Text style={styles.summaryLabel}>Classes</Text>
                        </View>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryNumber}>{totalStudents}</Text>
                            <Text style={styles.summaryLabel}>Students</Text>
                        </View>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryNumber}>{totalPresent}</Text>
                            <Text style={styles.summaryLabel}>Present</Text>
                        </View>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryNumber}>{totalAbsent}</Text>
                            <Text style={styles.summaryLabel}>Absent</Text>
                        </View>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryNumber}>{totalLate}</Text>
                            <Text style={styles.summaryLabel}>Late</Text>
                        </View>
                    </View>

                    <Text style={styles.overallPercentage}>
                        Overall Attendance: {overallAttendance.toFixed(2)}%
                    </Text>
                </View>
            )}

            {!loading &&
                getSortedCards().map((item, index) => {
                    const status =
                        item.attendancePercentage >= 80
                            ? 'Excellent'
                            : item.attendancePercentage >= 60
                                ? 'Good'
                                : 'Needs Attention';

                    return (
                        <View key={index} style={styles.card}>
                            <Text style={styles.cardTitle}>
                                Class {item.className} - Section {item.section}
                            </Text>

                            <Text style={styles.subject}>Subject: {item.subjectName}</Text>

                            <Text style={styles.cardText}>
                                Total Students: {item.totalStudents}
                            </Text>

                            <Text style={styles.present}>Present: {item.present}</Text>
                            <Text style={styles.absent}>Absent: {item.absent}</Text>
                            <Text style={styles.late}>Late: {item.late}</Text>

                            <Text style={styles.percentage}>
                                Attendance: {item.attendancePercentage.toFixed(2)}%
                            </Text>

                            <View style={styles.progressBarBackground}>
                                <View
                                    style={[
                                        styles.progressBarFill,
                                        { width: `${item.attendancePercentage}%` },
                                    ]}
                                />
                            </View>

                            <Text style={styles.statusText}>Status: {status}</Text>
                        </View>
                    );
                })}

            <Modal visible={showSortModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Sort Dashboard</Text>

                        {[
                            'Highest Attendance First',
                            'Lowest Attendance First',
                            'Class Name',
                        ].map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.optionButton}
                                onPress={() => {
                                    setSortBy(option);
                                    setShowSortModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>{option}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeSortButton}
                            onPress={() => setShowSortModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
                            maxDate={new Date().toISOString().split('T')[0]}
                            onDayPress={(day) => {
                                const todayString = new Date().toISOString().split('T')[0];

                                if (day.dateString > todayString) {
                                    Alert.alert('Invalid Date', 'Future dates are not allowed.');
                                    return;
                                }

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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 25,
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 22,
        fontWeight: '700',
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
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: '#93c5fd',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    loadingContainer: {
        marginTop: 10,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    noDataContainer: {
        backgroundColor: '#fef3c7',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#fcd34d',
        marginBottom: 20,
        alignItems: 'center',
    },
    noDataTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#92400e',
        marginBottom: 6,
    },
    noDataText: {
        fontSize: 16,
        color: '#92400e',
        textAlign: 'center',
        fontWeight: '600',
    },
    sortButton: {
        backgroundColor: '#f3f4f6',
        padding: 14,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    sortButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    summaryCard: {
        backgroundColor: '#eff6ff',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        marginBottom: 20,
    },
    summaryTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 14,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    summaryBox: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        minWidth: '30%',
        alignItems: 'center',
    },
    summaryNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
    },
    summaryLabel: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 4,
    },
    overallPercentage: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#16a34a',
        marginTop: 16,
    },
    card: {
        backgroundColor: '#f9fafb',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 18,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
    },
    subject: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2563eb',
        marginBottom: 12,
    },
    cardText: {
        fontSize: 17,
        marginBottom: 8,
        color: '#374151',
    },
    present: {
        fontSize: 17,
        marginBottom: 8,
        color: '#16a34a',
        fontWeight: '600',
    },
    absent: {
        fontSize: 17,
        marginBottom: 8,
        color: '#dc2626',
        fontWeight: '600',
    },
    late: {
        fontSize: 17,
        marginBottom: 8,
        color: '#d97706',
        fontWeight: '600',
    },
    percentage: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#1e3a8a',
    },
    progressBarBackground: {
        height: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 10,
        marginTop: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#16a34a',
        borderRadius: 10,
    },
    statusText: {
        fontSize: 17,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#1e3a8a',
    },
    optionButton: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    optionText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#111827',
    },
    closeSortButton: {
        backgroundColor: '#6b7280',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 18,
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