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
import { API_ENDPOINTS } from '../src/services/api';

type TeacherSchedule = {
    id: number;
    teacherId: number;
    teacherName: string;
    className: string;
    section: string;
    subjectName: string;
    scheduleDate: string;
    startTime: string;
    endTime: string;
    status: string;
    replacementTeacherId?: number | null;
    replacementTeacherName?: string | null;
};

export default function AdminTeacherDashboardScreen() {
    const todayString = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(todayString);
    const [selectedDate, setSelectedDate] = useState(todayString);
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [showReplacementModal, setShowReplacementModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
    const [selectedLeaveStatus, setSelectedLeaveStatus] =
        useState<'PLANNED_LEAVE' | 'UNPLANNED_LEAVE'>('PLANNED_LEAVE');

    const [replacementTeachers, setReplacementTeachers] = useState({
        bestMatch: [] as any[],
        sameClass: [] as any[],
        others: [] as any[],
    });

    const [selectedReplacementTab, setSelectedReplacementTab] =
        useState<'bestMatch' | 'sameClass' | 'others'>(
            'bestMatch'
        );

    const loadSchedules = async () => {
        try {
            setLoading(true);
            setHasLoadedOnce(true);

            const response = await fetch(`${API_ENDPOINTS.teacherSchedules}?date=${date}`);

            if (!response.ok) {
                throw new Error('Failed to load teacher schedules');
            }

            const data = await response.json();
            setSchedules(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load teacher schedules');
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };
    const loadAvailableReplacementTeachers = async (schedule: TeacherSchedule) => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_ENDPOINTS.availableReplacementTeachers}?scheduleId=${schedule.id}`
            );

            if (!response.ok) {
                throw new Error('Failed to load replacement teachers');
            }

            const data = await response.json();

            setReplacementTeachers({
                bestMatch: data.bestMatch || [],
                sameClass: data.sameClass || [],
                others: data.others || [],
            });

            setSelectedReplacementTab(
                data.bestMatch?.length
                    ? 'bestMatch'
                    : data.sameClass?.length
                        ? 'sameClass'
                        : 'others'
            );
            setSelectedSchedule(schedule);
            setShowReplacementModal(true);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load available replacement teachers');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (
        scheduleId: number,
        status: string,
        replacementTeacherId?: number,
        replacementTeacherName?: string
    ) => {
        try {
            setLoading(true);

            let url = `${API_ENDPOINTS.teacherSchedules}/${scheduleId}/status?status=${status}`;

            if (replacementTeacherId && replacementTeacherName) {
                url += `&replacementTeacherId=${replacementTeacherId}&replacementTeacherName=${encodeURIComponent(replacementTeacherName)}`;
            }

            const response = await fetch(url, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Failed to update schedule status');
            }

            await loadSchedules();
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to update teacher schedule');
        } finally {
            setLoading(false);
        }
    };

    const confirmDate = () => {
        setDate(selectedDate);
        setShowCalendarModal(false);
    };

    const getStatusStyle = (status: string) => {
        if (status === 'AVAILABLE') return styles.availableStatus;
        if (status === 'PLANNED_LEAVE') return styles.leaveStatus;
        if (status === 'UNPLANNED_LEAVE') return styles.absentStatus;
        if (status === 'REPLACED') return styles.replacedStatus;
        return styles.defaultStatus;
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Admin Teacher&apos;s Dashboard</Text>
            <Text style={styles.subtitle}>Teacher Schedule & Leave Planning</Text>

            <Text style={styles.label}>Schedule Date:</Text>

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
                onPress={loadSchedules}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Loading...' : 'Load Teacher Schedule'}
                </Text>
            </TouchableOpacity>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>Loading schedules...</Text>
                </View>
            )}

            {!loading && hasLoadedOnce && schedules.length === 0 && (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataTitle}>No Schedule Found</Text>
                    <Text style={styles.noDataText}>
                        No teacher schedule found for selected date.
                    </Text>
                </View>
            )}

            {!loading && schedules.map((item) => (
                <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.teacherName}>{item.teacherName}</Text>
                        <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                            {item.status.replace('_', ' ')}
                        </Text>
                    </View>

                    <Text style={styles.cardText}>
                        Class {item.className} - Section {item.section}
                    </Text>

                    <Text style={styles.cardText}>
                        Subject: {item.subjectName}
                    </Text>

                    <Text style={styles.cardText}>
                        Time: {item.startTime} - {item.endTime}
                    </Text>

                    {item.replacementTeacherName && (
                        <Text style={styles.replacementText}>
                            Replacement: {item.replacementTeacherName}
                        </Text>
                    )}

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.leaveButton}
                            onPress={() => {
                                setSelectedLeaveStatus('PLANNED_LEAVE');
                                loadAvailableReplacementTeachers(item);
                            }}
                        >
                            <Text style={styles.actionButtonText}>Planned Leave</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.absentButton}
                            onPress={() => {
                                setSelectedLeaveStatus('UNPLANNED_LEAVE');
                                loadAvailableReplacementTeachers(item);
                            }}
                        >
                            <Text style={styles.actionButtonText}>Un-Planned Leave</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.availableButton}
                        onPress={() => updateStatus(item.id, 'AVAILABLE')}
                    >
                        <Text style={styles.actionButtonText}>Mark Available</Text>
                    </TouchableOpacity>
                </View>
            ))}

            <Modal visible={showCalendarModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Schedule Date</Text>

                        <Text style={styles.modalLabel}>Schedule Date</Text>

                        <View style={styles.selectedDateBox}>
                            <Text style={styles.selectedDateText}>{selectedDate}</Text>
                        </View>

                        <Calendar
                            current={selectedDate}
                            onDayPress={(day) => setSelectedDate(day.dateString)}
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

            <Modal visible={showReplacementModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Replacement Teacher</Text>

                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
                            <TouchableOpacity
                                style={[
                                    styles.tabButton,
                                    selectedReplacementTab === 'bestMatch' &&
                                    styles.activeTabButton,
                                ]}
                                onPress={() => setSelectedReplacementTab('bestMatch')}
                            >
                                <Text style={styles.tabText}>Best Match</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.tabButton,
                                    selectedReplacementTab === 'sameClass' &&
                                    styles.activeTabButton,
                                ]}
                                onPress={() => setSelectedReplacementTab('sameClass')}
                            >
                                <Text style={styles.tabText}>Same Class</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.tabButton,
                                    selectedReplacementTab === 'others' &&
                                    styles.activeTabButton,
                                ]}
                                onPress={() => setSelectedReplacementTab('others')}
                            >
                                <Text style={styles.tabText}>Others</Text>
                            </TouchableOpacity>
                        </View>

                        {replacementTeachers[selectedReplacementTab].map((teacher: any) => (
                            <TouchableOpacity
                                key={teacher.teacherId}
                                style={styles.optionButton}
                                onPress={() => {
                                    if (selectedSchedule) {
                                        updateStatus(
                                            selectedSchedule.id,
                                            selectedLeaveStatus,
                                            teacher.teacherId,
                                            teacher.teacherName
                                        );
                                    }

                                    setShowReplacementModal(false);
                                    setSelectedSchedule(null);
                                }}
                            >
                                <Text style={styles.optionText}>
                                    {teacher.teacherName}
                                </Text>

                                <Text
                                    style={{
                                        textAlign: 'center',
                                        marginTop: 4,
                                        color: '#6b7280',
                                    }}
                                >
                                    {teacher.matchType}
                                </Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                if (selectedSchedule) {
                                    updateStatus(
                                        selectedSchedule.id,
                                        selectedLeaveStatus
                                    );
                                }

                                setShowReplacementModal(false);
                                setSelectedSchedule(null);
                            }}
                        >
                            <Text style={styles.optionText}>No Replacement</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                                setShowReplacementModal(false);
                                setSelectedSchedule(null);
                            }}
                        >
                            <Text style={styles.modalButtonText}>Cancel</Text>
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
        backgroundColor: '#fff',
        padding: 25,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
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
    card: {
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#dbeafe',
        marginBottom: 18,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    teacherName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        flex: 1,
        marginRight: 10,
    },
    cardText: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 7,
        fontWeight: '600',
    },
    replacementText: {
        fontSize: 16,
        color: '#7c3aed',
        marginTop: 4,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    tabButton: {
        flex: 1,
        backgroundColor: '#e5e7eb',
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },

    activeTabButton: {
        backgroundColor: '#2563eb',
    },

    tabText: {
        color: '#111827',
        fontWeight: 'bold',
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        overflow: 'hidden',
    },
    availableStatus: {
        backgroundColor: '#dcfce7',
        color: '#166534',
    },
    leaveStatus: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
    },
    absentStatus: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
    },
    replacedStatus: {
        backgroundColor: '#ede9fe',
        color: '#5b21b6',
    },
    defaultStatus: {
        backgroundColor: '#e5e7eb',
        color: '#374151',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    leaveButton: {
        flex: 1,
        backgroundColor: '#d97706',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    absentButton: {
        flex: 1,
        backgroundColor: '#dc2626',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    availableButton: {
        backgroundColor: '#16a34a',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
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
    optionButton: {
        backgroundColor: '#eff6ff',
        padding: 14,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    optionText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e3a8a',
        textAlign: 'center',
    },
});