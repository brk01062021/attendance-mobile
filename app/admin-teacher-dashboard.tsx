import React, { useMemo, useState } from 'react';
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

    const [selectedClass, setSelectedClass] = useState('ALL');
    const [selectedSection, setSelectedSection] = useState('ALL');
    const [selectedSubject, setSelectedSubject] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedTimePeriod, setSelectedTimePeriod] = useState('ALL');

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
        useState<'bestMatch' | 'sameClass' | 'others'>('bestMatch');

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
            resetFilters();
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
                url += `&replacementTeacherId=${replacementTeacherId}&replacementTeacherName=${encodeURIComponent(
                    replacementTeacherName
                )}`;
            }

            const response = await fetch(url, { method: 'PUT' });

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

    const getStatusLabel = (status: string) => {
        if (status === 'ALL') return 'All Status';
        return status.replace('_', ' ');
    };

    const classOptions = useMemo(() => {
        const values = Array.from(new Set(schedules.map((item) => item.className)))
            .sort((a, b) => Number(b) - Number(a));

        return ['ALL', ...values];
    }, [schedules]);

    const sectionOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                schedules
                    .filter((item) =>
                        selectedClass === 'ALL' ? true : item.className === selectedClass
                    )
                    .map((item) => item.section)
            )
        ).sort();

        return ['ALL', ...values];
    }, [schedules, selectedClass]);

    const subjectOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                schedules
                    .filter((item) =>
                        selectedClass === 'ALL' ? true : item.className === selectedClass
                    )
                    .filter((item) =>
                        selectedSection === 'ALL' ? true : item.section === selectedSection
                    )
                    .map((item) => item.subjectName)
            )
        ).sort();

        return ['ALL', ...values];
    }, [schedules, selectedClass, selectedSection]);

    const statusOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                schedules
                    .filter((item) =>
                        selectedClass === 'ALL' ? true : item.className === selectedClass
                    )
                    .filter((item) =>
                        selectedSection === 'ALL' ? true : item.section === selectedSection
                    )
                    .filter((item) =>
                        selectedSubject === 'ALL' ? true : item.subjectName === selectedSubject
                    )
                    .map((item) => item.status)
            )
        ).sort();

        return ['ALL', ...values];
    }, [schedules, selectedClass, selectedSection, selectedSubject]);

    const timePeriods = useMemo(() => {
        const values = Array.from(
            new Set(
                schedules
                    .filter((item) =>
                        selectedClass === 'ALL' ? true : item.className === selectedClass
                    )
                    .filter((item) =>
                        selectedSection === 'ALL' ? true : item.section === selectedSection
                    )
                    .filter((item) =>
                        selectedSubject === 'ALL' ? true : item.subjectName === selectedSubject
                    )
                    .filter((item) =>
                        selectedStatus === 'ALL' ? true : item.status === selectedStatus
                    )
                    .map((item) => `${item.startTime} - ${item.endTime}`)
            )
        ).sort();

        return ['ALL', ...values];
    }, [schedules, selectedClass, selectedSection, selectedSubject, selectedStatus]);

    const filteredSchedules = useMemo(() => {
        return [...schedules]
            .filter((item) => selectedClass === 'ALL' || item.className === selectedClass)
            .filter((item) => selectedSection === 'ALL' || item.section === selectedSection)
            .filter((item) => selectedSubject === 'ALL' || item.subjectName === selectedSubject)
            .filter((item) => selectedStatus === 'ALL' || item.status === selectedStatus)
            .filter(
                (item) =>
                    selectedTimePeriod === 'ALL' ||
                    `${item.startTime} - ${item.endTime}` === selectedTimePeriod
            )
            .sort((a, b) => {
                const classCompare = Number(b.className) - Number(a.className);
                if (classCompare !== 0) return classCompare;

                const sectionCompare = a.section.localeCompare(b.section);
                if (sectionCompare !== 0) return sectionCompare;

                const timeCompare = a.startTime.localeCompare(b.startTime);
                if (timeCompare !== 0) return timeCompare;

                const subjectCompare = a.subjectName.localeCompare(b.subjectName);
                if (subjectCompare !== 0) return subjectCompare;

                return a.teacherName.localeCompare(b.teacherName);
            });
    }, [
        schedules,
        selectedClass,
        selectedSection,
        selectedSubject,
        selectedStatus,
        selectedTimePeriod,
    ]);

    const conflictKeys = useMemo(() => {
        const countMap: Record<string, number> = {};

        schedules.forEach((item) => {
            const key = `${item.scheduleDate}_${item.startTime}_${item.endTime}_${item.className}_${item.section}_${item.subjectName}`;
            countMap[key] = (countMap[key] || 0) + 1;
        });

        return Object.keys(countMap).filter((key) => countMap[key] > 1);
    }, [schedules]);

    const isConflictSchedule = (item: TeacherSchedule) => {
        const key = `${item.scheduleDate}_${item.startTime}_${item.endTime}_${item.className}_${item.section}_${item.subjectName}`;
        return conflictKeys.includes(key);
    };

    const resetFilters = () => {
        setSelectedClass('ALL');
        setSelectedSection('ALL');
        setSelectedSubject('ALL');
        setSelectedStatus('ALL');
        setSelectedTimePeriod('ALL');
    };

    const renderFilterChips = (
        title: string,
        options: string[],
        selectedValue: string,
        onSelect: (value: string) => void,
        allLabel: string
    ) => (
        <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>{title}</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
            >
                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.filterChip,
                            selectedValue === option && styles.activeFilterChip,
                        ]}
                        onPress={() => {
                            onSelect(option);

                            if (title === 'Class') {
                                setSelectedSection('ALL');
                                setSelectedSubject('ALL');
                                setSelectedStatus('ALL');
                                setSelectedTimePeriod('ALL');
                            }

                            if (title === 'Section') {
                                setSelectedSubject('ALL');
                                setSelectedStatus('ALL');
                                setSelectedTimePeriod('ALL');
                            }

                            if (title === 'Subject') {
                                setSelectedStatus('ALL');
                                setSelectedTimePeriod('ALL');
                            }

                            if (title === 'Status') {
                                setSelectedTimePeriod('ALL');
                            }
                        }}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                selectedValue === option && styles.activeFilterChipText,
                            ]}
                        >
                            {title === 'Status'
                                ? getStatusLabel(option)
                                : option === 'ALL'
                                    ? allLabel
                                    : option}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

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

            {!loading && schedules.length > 0 && (
                <>
                    <View style={styles.resultSummaryBox}>
                        <Text style={styles.resultSummaryText}>
                            Showing {filteredSchedules.length} of {schedules.length} schedules
                        </Text>

                        <TouchableOpacity onPress={resetFilters}>
                            <Text style={styles.resetText}>Reset Filters</Text>
                        </TouchableOpacity>
                    </View>

                    {renderFilterChips(
                        'Class',
                        classOptions,
                        selectedClass,
                        setSelectedClass,
                        'All Classes'
                    )}

                    {renderFilterChips(
                        'Section',
                        sectionOptions,
                        selectedSection,
                        setSelectedSection,
                        'All Sections'
                    )}

                    {renderFilterChips(
                        'Subject',
                        subjectOptions,
                        selectedSubject,
                        setSelectedSubject,
                        'All Subjects'
                    )}

                    {renderFilterChips(
                        'Status',
                        statusOptions,
                        selectedStatus,
                        setSelectedStatus,
                        'All Status'
                    )}

                    {renderFilterChips(
                        'Time Period',
                        timePeriods,
                        selectedTimePeriod,
                        setSelectedTimePeriod,
                        'All Time Periods'
                    )}
                </>
            )}

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

            {!loading && hasLoadedOnce && schedules.length > 0 && filteredSchedules.length === 0 && (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataTitle}>No Records Found</Text>
                    <Text style={styles.noDataText}>
                        No teacher schedule found for selected filters.
                    </Text>
                </View>
            )}

            {!loading && conflictKeys.length > 0 && (
                <View style={styles.conflictWarningBox}>
                    <Text style={styles.conflictWarningTitle}>Schedule Conflict Detected</Text>
                    <Text style={styles.conflictWarningText}>
                        One or more class/section/subject time slots are assigned to multiple teachers.
                    </Text>
                </View>
            )}

            {!loading && filteredSchedules.map((item) => (
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

                    {isConflictSchedule(item) && (
                        <Text style={styles.cardConflictText}>
                            Conflict: Another teacher is assigned to this same class, section, subject, and time.
                        </Text>
                    )}

                    {item.replacementTeacherName && (
                        <Text style={styles.replacementText}>
                            Replacement: {item.replacementTeacherName}
                        </Text>
                    )}

                    {!item.replacementTeacherName &&
                        (item.status === 'PLANNED_LEAVE' ||
                            item.status === 'UNPLANNED_LEAVE') && (
                            <Text style={styles.noReplacementText}>
                                No replacement assigned
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

                        {replacementTeachers[selectedReplacementTab].length === 0 && (
                            <Text style={styles.emptyReplacementText}>
                                No teachers available in this category.
                            </Text>
                        )}

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
    resultSummaryBox: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultSummaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    resetText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    filterContainer: {
        marginBottom: 18,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 10,
    },
    filterScroll: {
        flexGrow: 0,
    },
    filterChip: {
        backgroundColor: '#e5e7eb',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    activeFilterChip: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    activeFilterChipText: {
        color: '#fff',
    },
    conflictWarningBox: {
        backgroundColor: '#fee2e2',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#fca5a5',
        marginBottom: 18,
    },
    conflictWarningTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#991b1b',
        marginBottom: 6,
    },
    conflictWarningText: {
        fontSize: 15,
        color: '#991b1b',
        fontWeight: '600',
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
    cardConflictText: {
        fontSize: 15,
        color: '#dc2626',
        fontWeight: 'bold',
        marginTop: 4,
        marginBottom: 8,
    },
    replacementText: {
        fontSize: 16,
        color: '#7c3aed',
        marginTop: 4,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    noReplacementText: {
        fontSize: 16,
        color: '#dc2626',
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
    emptyReplacementText: {
        fontSize: 15,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '600',
    },
});