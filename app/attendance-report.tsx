import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const BASE_URL = 'http://192.168.1.75:8080';

type ReportItem = {
    className: string;
    section: string;
    totalRecords: number;
    present: number;
    absent: number;
    late: number;
    attendancePercentage: number;
};

export default function AttendanceReportScreen() {
    const { role } = useLocalSearchParams();

    const userRole = String(role || 'TEACHER').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    const [date, setDate] = useState('2026-04-27');
    const [reportData, setReportData] = useState<ReportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [sortBy, setSortBy] = useState('Overall');
    const [showSortModal, setShowSortModal] = useState(false);

    const sortOptions = [
        'Class Name',
        'Least Weekly Attendance',
        'Highest Weekly Attendance',
        'Least Monthly Attendance',
        'Highest Monthly Attendance',
        'Overall',
    ];

    const formatDate = (inputDate: Date) => {
        return inputDate.toISOString().split('T')[0];
    };

    const getDateRange = () => {
        const selected = new Date(date);
        const dates: string[] = [];

        let daysBack = 0;

        if (sortBy.includes('Weekly')) {
            daysBack = 6;
        } else if (sortBy.includes('Monthly')) {
            daysBack = 29;
        } else {
            daysBack = 0;
        }

        for (let i = daysBack; i >= 0; i--) {
            const d = new Date(selected);
            d.setDate(selected.getDate() - i);
            dates.push(formatDate(d));
        }

        return dates;
    };

    const loadAdminReport = async () => {
        try {
            setLoading(true);
            setHasLoadedOnce(true);

            const dates = getDateRange();
            const map = new Map<string, ReportItem>();

            for (const reportDate of dates) {
                const response = await fetch(
                    `${BASE_URL}/attendance/dashboard/admin/classes?date=${reportDate}`
                );

                if (!response.ok) {
                    throw new Error('Failed to load report');
                }

                const data = await response.json();

                if (Array.isArray(data)) {
                    data.forEach((item) => {
                        const key = `${item.className}-${item.section}`;

                        const existing = map.get(key) || {
                            className: item.className,
                            section: item.section,
                            totalRecords: 0,
                            present: 0,
                            absent: 0,
                            late: 0,
                            attendancePercentage: 0,
                        };

                        existing.totalRecords += item.totalRecords || 0;
                        existing.present += item.present || 0;
                        existing.absent += item.absent || 0;
                        existing.late += item.late || 0;

                        existing.attendancePercentage =
                            existing.totalRecords === 0
                                ? 0
                                : ((existing.present + existing.late) / existing.totalRecords) * 100;

                        map.set(key, existing);
                    });
                }
            }

            setReportData(Array.from(map.values()));
        } catch (error) {
            console.log(error);
            setReportData([]);
            Alert.alert('Error', 'Unable to load attendance report');
        } finally {
            setLoading(false);
        }
    };

    const handleLoadReport = () => {
        if (!isAdmin) {
            Alert.alert('Info', 'Teacher attendance report will be connected next');
            return;
        }

        loadAdminReport();
    };

    const getSortedReport = () => {
        const data = [...reportData];

        if (sortBy === 'Class Name') {
            data.sort((a, b) =>
                `${a.className}-${a.section}`.localeCompare(`${b.className}-${b.section}`)
            );
        } else if (
            sortBy === 'Least Weekly Attendance' ||
            sortBy === 'Least Monthly Attendance'
        ) {
            data.sort((a, b) => a.attendancePercentage - b.attendancePercentage);
        } else {
            data.sort((a, b) => b.attendancePercentage - a.attendancePercentage);
        }

        return data;
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>
                {isAdmin ? 'Admin Attendance Report' : 'Attendance Report'}
            </Text>

            <Text style={styles.label}>Report Date</Text>
            <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
            />

            {isAdmin && (
                <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => setShowSortModal(true)}
                >
                    <Text style={styles.sortButtonText}>Sort By: {sortBy}</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={handleLoadReport}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Load Attendance Report</Text>
                )}
            </TouchableOpacity>

            {!loading && hasLoadedOnce && reportData.length === 0 && (
                <View style={styles.noDataCard}>
                    <Text style={styles.noDataTitle}>No Data Found</Text>
                    <Text style={styles.noDataText}>
                        No attendance report data found for selected date.
                    </Text>
                </View>
            )}

            {!loading &&
                getSortedReport().map((item, index) => (
                    <View key={index} style={styles.card}>
                        <Text style={styles.cardTitle}>
                            Class {item.className} - Section {item.section}
                        </Text>

                        <Text style={styles.cardText}>Total Records: {item.totalRecords}</Text>
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
                    </View>
                ))}

            <Modal visible={showSortModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Sort Attendance Report</Text>

                        {sortOptions.map((option) => (
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
                            style={styles.closeButton}
                            onPress={() => setShowSortModal(false)}
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
        padding: 22,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 27,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#111827',
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        color: '#374151',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 14,
        backgroundColor: '#f9fafb',
    },
    sortButton: {
        backgroundColor: '#f3f4f6',
        padding: 14,
        borderRadius: 10,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    sortButtonText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
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
    card: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 15,
        marginBottom: 14,
        backgroundColor: '#f9fafb',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#111827',
    },
    cardText: {
        fontSize: 16,
        marginBottom: 5,
        color: '#374151',
    },
    present: {
        fontSize: 16,
        color: '#16a34a',
        marginBottom: 4,
        fontWeight: '600',
    },
    absent: {
        fontSize: 16,
        color: '#dc2626',
        marginBottom: 4,
        fontWeight: '600',
    },
    late: {
        fontSize: 16,
        color: '#d97706',
        marginBottom: 4,
        fontWeight: '600',
    },
    percentage: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
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
    noDataCard: {
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
    },
    modalOverlay: {
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
        fontWeight: '600',
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
});