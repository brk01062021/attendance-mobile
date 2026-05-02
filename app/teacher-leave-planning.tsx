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
    replacementClass?: boolean | null;
};

type ReplacementTeacher = {
    teacherId: number;
    teacherName: string;
    className: string;
    section: string;
    subjectName: string;
    matchType?: string | null;
    dailyWorkload?: number;
    nextClass?: string | null;
    lastClassEnded?: string | null;
};

type GroupedReplacementOptions = {
    bestMatch: ReplacementTeacher[];
    sameClass: ReplacementTeacher[];
    others: ReplacementTeacher[];
};

type LeaveType = 'PLANNED_LEAVE' | 'UNPLANNED_LEAVE';
type DurationType = 'ONE_DAY' | 'MULTI_DAY';
type DateField = 'FROM' | 'TO';
type ReplacementTab = 'BEST_MATCH' | 'SAME_CLASS' | 'OTHERS';

export default function TeacherLeavePlanningScreen() {
    const todayString = new Date().toISOString().split('T')[0];

    const [fromDate, setFromDate] = useState(todayString);
    const [toDate, setToDate] = useState(todayString);
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(todayString);
    const [activeDateField, setActiveDateField] = useState<DateField>('FROM');
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    const [leaveType, setLeaveType] = useState<LeaveType>('PLANNED_LEAVE');
    const [durationType, setDurationType] = useState<DurationType>('ONE_DAY');

    const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('ALL');

    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [showReplacementModal, setShowReplacementModal] = useState(false);
    const [selectedLeaveSchedule, setSelectedLeaveSchedule] =
        useState<TeacherSchedule | null>(null);

    const [groupedReplacements, setGroupedReplacements] =
        useState<GroupedReplacementOptions>({
            bestMatch: [],
            sameClass: [],
            others: [],
        });

    const [activeReplacementTab, setActiveReplacementTab] =
        useState<ReplacementTab>('BEST_MATCH');

    const [replacementLoading, setReplacementLoading] = useState(false);
    const [selectedReplacementTeacherId, setSelectedReplacementTeacherId] =
        useState<number | 'NO_REPLACEMENT' | null>(null);

    const teacherOptions = useMemo(() => {
        const map = new Map<number, string>();

        schedules.forEach((item) => {
            map.set(item.teacherId, item.teacherName);
        });

        return Array.from(map.entries())
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([teacherId, teacherName]) => ({
                teacherId,
                teacherName,
            }));
    }, [schedules]);

    const filteredSchedules = useMemo(() => {
        return [...schedules]
            .filter((item) =>
                selectedTeacherId === 'ALL'
                    ? true
                    : item.teacherId === Number(selectedTeacherId)
            )
            .sort((a, b) => {
                const dateCompare = a.scheduleDate.localeCompare(b.scheduleDate);
                if (dateCompare !== 0) return dateCompare;

                const teacherCompare = a.teacherName.localeCompare(b.teacherName);
                if (teacherCompare !== 0) return teacherCompare;

                return a.startTime.localeCompare(b.startTime);
            });
    }, [schedules, selectedTeacherId]);

    const selectedReplacementList = useMemo(() => {
        if (activeReplacementTab === 'BEST_MATCH') {
            return groupedReplacements.bestMatch;
        }

        if (activeReplacementTab === 'SAME_CLASS') {
            return groupedReplacements.sameClass;
        }

        return groupedReplacements.others;
    }, [activeReplacementTab, groupedReplacements]);

    const openCalendar = (field: DateField) => {
        setActiveDateField(field);
        setSelectedCalendarDate(field === 'FROM' ? fromDate : toDate);
        setShowCalendarModal(true);
    };

    const confirmDate = () => {
        if (activeDateField === 'FROM') {
            setFromDate(selectedCalendarDate);

            if (durationType === 'ONE_DAY') {
                setToDate(selectedCalendarDate);
            }
        } else {
            setToDate(selectedCalendarDate);
        }

        setShowCalendarModal(false);
    };

    const loadSchedules = async () => {
        try {
            setLoading(true);
            setHasLoadedOnce(true);
            setSelectedTeacherId('ALL');

            if (durationType === 'ONE_DAY') {
                const response = await fetch(`${API_ENDPOINTS.teacherSchedules}?date=${fromDate}`);

                if (!response.ok) {
                    throw new Error('Failed to load schedules');
                }

                const data = await response.json();
                setSchedules(Array.isArray(data) ? data : []);
                return;
            }

            const start = new Date(fromDate);
            const end = new Date(toDate);

            if (start > end) {
                Alert.alert('Invalid Date Range', 'From Date cannot be after To Date.');
                setSchedules([]);
                return;
            }

            const allSchedules: TeacherSchedule[] = [];
            const current = new Date(start);

            while (current <= end) {
                const dateString = current.toISOString().split('T')[0];

                const response = await fetch(`${API_ENDPOINTS.teacherSchedules}?date=${dateString}`);

                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) {
                        allSchedules.push(...data);
                    }
                }

                current.setDate(current.getDate() + 1);
            }

            setSchedules(allSchedules);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load teacher schedules');
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (scheduleId: number, status: LeaveType) => {
        try {
            setLoading(true);

            const url = `${API_ENDPOINTS.teacherSchedules}/${scheduleId}/status?status=${status}`;

            const response = await fetch(url, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Failed to update leave status');
            }

            await loadSchedules();
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to mark leave');
        } finally {
            setLoading(false);
        }
    };

    const markAllFilteredAsLeave = async () => {
        if (filteredSchedules.length === 0) {
            Alert.alert('No Records', 'No schedule records found for selected teacher/date.');
            return;
        }

        try {
            setLoading(true);

            for (const item of filteredSchedules) {
                const url = `${API_ENDPOINTS.teacherSchedules}/${item.id}/status?status=${leaveType}`;

                const response = await fetch(url, {
                    method: 'PUT',
                });

                if (!response.ok) {
                    throw new Error(`Failed to update schedule id ${item.id}`);
                }
            }

            await loadSchedules();
            Alert.alert('Success', 'Leave applied to selected schedule records.');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to apply leave to all records');
        } finally {
            setLoading(false);
        }
    };

    const openReplacementModal = async (schedule: TeacherSchedule) => {
        try {
            setSelectedLeaveSchedule(schedule);
            setSelectedReplacementTeacherId(null);
            setGroupedReplacements({
                bestMatch: [],
                sameClass: [],
                others: [],
            });
            setActiveReplacementTab('BEST_MATCH');
            setShowReplacementModal(true);
            setReplacementLoading(true);

            const response = await fetch(
                `${API_ENDPOINTS.teacherSchedules}/available-replacements?scheduleId=${schedule.id}`
            );

            if (!response.ok) {
                throw new Error('Failed to load available replacement teachers');
            }

            const data = await response.json();

            setGroupedReplacements({
                bestMatch: Array.isArray(data.bestMatch) ? data.bestMatch : [],
                sameClass: Array.isArray(data.sameClass) ? data.sameClass : [],
                others: Array.isArray(data.others) ? data.others : [],
            });
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load available replacement teachers');
            setShowReplacementModal(false);
        } finally {
            setReplacementLoading(false);
        }
    };

    const assignReplacementTeacher = async () => {
        if (!selectedLeaveSchedule || selectedReplacementTeacherId === null) {
            Alert.alert('Select Teacher', 'Please select a replacement option.');
            return;
        }

        try {
            setReplacementLoading(true);

            let response;

            if (selectedReplacementTeacherId === 'NO_REPLACEMENT') {
                response = await fetch(
                    `${API_ENDPOINTS.teacherSchedules}/${selectedLeaveSchedule.id}/status?status=${selectedLeaveSchedule.status}`,
                    {
                        method: 'PUT',
                    }
                );
            } else {
                response = await fetch(
                    `${API_ENDPOINTS.teacherSchedules}/${selectedLeaveSchedule.id}/assign-replacement?replacementTeacherId=${selectedReplacementTeacherId}`,
                    {
                        method: 'PUT',
                    }
                );
            }

            if (!response.ok) {
                throw new Error('Failed to save replacement');
            }

            setShowReplacementModal(false);
            setSelectedLeaveSchedule(null);
            setSelectedReplacementTeacherId(null);
            setGroupedReplacements({
                bestMatch: [],
                sameClass: [],
                others: [],
            });

            await loadSchedules();

            Alert.alert('Success', 'Replacement updated successfully.');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to save replacement');
        } finally {
            setReplacementLoading(false);
        }
    };

    const canAssignReplacement = (status: string) => {
        return status === 'PLANNED_LEAVE' || status === 'UNPLANNED_LEAVE';
    };

    const getStatusStyle = (status: string) => {
        if (status === 'AVAILABLE') return styles.availableStatus;
        if (status === 'PLANNED_LEAVE') return styles.leaveStatus;
        if (status === 'UNPLANNED_LEAVE') return styles.absentStatus;
        if (status === 'REPLACED') return styles.replacedStatus;
        return styles.defaultStatus;
    };

    const getStatusLabel = (status: string) => {
        return status.replace('_', ' ');
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Teacher Leave Planning</Text>
            <Text style={styles.subtitle}>Full-Day & Multi-Day Leave Management</Text>

            <Text style={styles.label}>Leave Type</Text>
            <View style={styles.optionRow}>
                <TouchableOpacity
                    style={[
                        styles.optionChip,
                        leaveType === 'PLANNED_LEAVE' && styles.activeOptionChip,
                    ]}
                    onPress={() => setLeaveType('PLANNED_LEAVE')}
                >
                    <Text
                        style={[
                            styles.optionChipText,
                            leaveType === 'PLANNED_LEAVE' && styles.activeOptionChipText,
                        ]}
                    >
                        Planned Leave
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.optionChip,
                        leaveType === 'UNPLANNED_LEAVE' && styles.activeOptionChip,
                    ]}
                    onPress={() => setLeaveType('UNPLANNED_LEAVE')}
                >
                    <Text
                        style={[
                            styles.optionChipText,
                            leaveType === 'UNPLANNED_LEAVE' && styles.activeOptionChipText,
                        ]}
                    >
                        Unplanned Leave
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>Leave Duration</Text>
            <View style={styles.optionRow}>
                <TouchableOpacity
                    style={[
                        styles.optionChip,
                        durationType === 'ONE_DAY' && styles.activeOptionChip,
                    ]}
                    onPress={() => {
                        setDurationType('ONE_DAY');
                        setToDate(fromDate);
                    }}
                >
                    <Text
                        style={[
                            styles.optionChipText,
                            durationType === 'ONE_DAY' && styles.activeOptionChipText,
                        ]}
                    >
                        One Day
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.optionChip,
                        durationType === 'MULTI_DAY' && styles.activeOptionChip,
                    ]}
                    onPress={() => setDurationType('MULTI_DAY')}
                >
                    <Text
                        style={[
                            styles.optionChipText,
                            durationType === 'MULTI_DAY' && styles.activeOptionChipText,
                        ]}
                    >
                        Multiple Days
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>
                {durationType === 'ONE_DAY' ? 'Leave Date' : 'From Date'}
            </Text>

            <TouchableOpacity style={styles.dateBox} onPress={() => openCalendar('FROM')}>
                <Text style={styles.dateText}>{fromDate}</Text>
            </TouchableOpacity>

            {durationType === 'MULTI_DAY' && (
                <>
                    <Text style={styles.label}>To Date</Text>

                    <TouchableOpacity style={styles.dateBox} onPress={() => openCalendar('TO')}>
                        <Text style={styles.dateText}>{toDate}</Text>
                    </TouchableOpacity>
                </>
            )}

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
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            )}

            {!loading && schedules.length > 0 && (
                <>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryText}>
                            Showing {filteredSchedules.length} of {schedules.length} schedule records
                        </Text>
                    </View>

                    <Text style={styles.label}>Teacher</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.filterScroll}
                    >
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                selectedTeacherId === 'ALL' && styles.activeFilterChip,
                            ]}
                            onPress={() => setSelectedTeacherId('ALL')}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    selectedTeacherId === 'ALL' && styles.activeFilterChipText,
                                ]}
                            >
                                All Teachers
                            </Text>
                        </TouchableOpacity>

                        {teacherOptions.map((teacher) => (
                            <TouchableOpacity
                                key={teacher.teacherId}
                                style={[
                                    styles.filterChip,
                                    selectedTeacherId === String(teacher.teacherId) &&
                                    styles.activeFilterChip,
                                ]}
                                onPress={() => setSelectedTeacherId(String(teacher.teacherId))}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        selectedTeacherId === String(teacher.teacherId) &&
                                        styles.activeFilterChipText,
                                    ]}
                                >
                                    {teacher.teacherName}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[
                            styles.fullDayButton,
                            (selectedTeacherId === 'ALL' || loading) && styles.disabledButton,
                        ]}
                        onPress={markAllFilteredAsLeave}
                        disabled={selectedTeacherId === 'ALL' || loading}
                    >
                        <Text style={styles.buttonText}>
                            Mark Selected Teacher Leave
                        </Text>
                    </TouchableOpacity>

                    {selectedTeacherId === 'ALL' && (
                        <Text style={styles.helperText}>
                            Select one teacher to apply full-day or multi-day leave.
                        </Text>
                    )}
                </>
            )}

            {!loading && hasLoadedOnce && schedules.length === 0 && (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataTitle}>No Schedule Found</Text>
                    <Text style={styles.noDataText}>
                        No teacher schedule found for selected date range.
                    </Text>
                </View>
            )}

            {!loading && filteredSchedules.map((item) => (
                <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.teacherName}>{item.teacherName}</Text>
                        <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                            {getStatusLabel(item.status)}
                        </Text>
                    </View>

                    <Text style={styles.cardText}>Date: {item.scheduleDate}</Text>

                    <Text style={styles.cardText}>
                        Class {item.className} - Section {item.section}
                    </Text>

                    <Text style={styles.cardText}>Subject: {item.subjectName}</Text>

                    <Text style={styles.cardText}>
                        Time: {item.startTime} - {item.endTime}
                    </Text>

                    {item.replacementTeacherName && (
                        <Text style={styles.replacementText}>
                            Replacement: {item.replacementTeacherName}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={styles.periodLeaveButton}
                        onPress={() => updateStatus(item.id, leaveType)}
                    >
                        <Text style={styles.actionButtonText}>
                            Mark This Period as {getStatusLabel(leaveType)}
                        </Text>
                    </TouchableOpacity>

                    {canAssignReplacement(item.status) && (
                        <TouchableOpacity
                            style={styles.assignReplacementButton}
                            onPress={() => openReplacementModal(item)}
                        >
                            <Text style={styles.actionButtonText}>
                                Assign Replacement
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ))}

            <Modal visible={showCalendarModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>
                            {activeDateField === 'FROM' ? 'Select From Date' : 'Select To Date'}
                        </Text>

                        <View style={styles.selectedDateBox}>
                            <Text style={styles.selectedDateText}>{selectedCalendarDate}</Text>
                        </View>

                        <Calendar
                            current={selectedCalendarDate}
                            onDayPress={(day) => setSelectedCalendarDate(day.dateString)}
                            markedDates={{
                                [selectedCalendarDate]: {
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

                            <TouchableOpacity style={styles.confirmButton} onPress={confirmDate}>
                                <Text style={styles.modalButtonText}>Confirm Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showReplacementModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.replacementModalBox}>
                        <Text style={styles.modalTitle}>Select Replacement Teacher</Text>

                        {selectedLeaveSchedule && (
                            <View style={styles.leaveInfoBox}>
                                <Text style={styles.leaveInfoTitle}>
                                    {selectedLeaveSchedule.teacherName}
                                </Text>
                                <Text style={styles.leaveInfoText}>
                                    {selectedLeaveSchedule.scheduleDate}
                                </Text>
                                <Text style={styles.leaveInfoText}>
                                    Class {selectedLeaveSchedule.className} - Section {selectedLeaveSchedule.section}
                                </Text>
                                <Text style={styles.leaveInfoText}>
                                    {selectedLeaveSchedule.subjectName} | {selectedLeaveSchedule.startTime} - {selectedLeaveSchedule.endTime}
                                </Text>
                            </View>
                        )}

                        <View style={styles.replacementTabRow}>
                            <TouchableOpacity
                                style={[
                                    styles.replacementTab,
                                    activeReplacementTab === 'BEST_MATCH' && styles.activeReplacementTab,
                                ]}
                                onPress={() => setActiveReplacementTab('BEST_MATCH')}
                            >
                                <Text
                                    style={[
                                        styles.replacementTabText,
                                        activeReplacementTab === 'BEST_MATCH' && styles.activeReplacementTabText,
                                    ]}
                                >
                                    Best Match
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.replacementTab,
                                    activeReplacementTab === 'SAME_CLASS' && styles.activeReplacementTab,
                                ]}
                                onPress={() => setActiveReplacementTab('SAME_CLASS')}
                            >
                                <Text
                                    style={[
                                        styles.replacementTabText,
                                        activeReplacementTab === 'SAME_CLASS' && styles.activeReplacementTabText,
                                    ]}
                                >
                                    Same Class
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.replacementTab,
                                    activeReplacementTab === 'OTHERS' && styles.activeReplacementTab,
                                ]}
                                onPress={() => setActiveReplacementTab('OTHERS')}
                            >
                                <Text
                                    style={[
                                        styles.replacementTabText,
                                        activeReplacementTab === 'OTHERS' && styles.activeReplacementTabText,
                                    ]}
                                >
                                    Others
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {replacementLoading && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" />
                                <Text style={styles.loadingText}>Loading available teachers...</Text>
                            </View>
                        )}

                        {!replacementLoading && selectedReplacementList.length === 0 && (
                            <View style={styles.noReplacementBox}>
                                <Text style={styles.noReplacementTitle}>No Teachers</Text>
                                <Text style={styles.noReplacementText}>
                                    No teachers available in this category.
                                </Text>
                            </View>
                        )}

                        {!replacementLoading && selectedReplacementList.length > 0 && (
                            <ScrollView style={styles.replacementList}>
                                {selectedReplacementList.map((teacher) => (
                                    <TouchableOpacity
                                        key={teacher.teacherId}
                                        style={[
                                            styles.groupedReplacementCard,
                                            selectedReplacementTeacherId === teacher.teacherId &&
                                            styles.selectedGroupedReplacementCard,
                                        ]}
                                        onPress={() => setSelectedReplacementTeacherId(teacher.teacherId)}
                                    >
                                        <Text style={styles.groupedReplacementName}>
                                            {teacher.teacherName}
                                        </Text>
                                        <Text style={styles.groupedReplacementType}>
                                            {teacher.matchType || activeReplacementTab}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.noReplacementSelectButton,
                                selectedReplacementTeacherId === 'NO_REPLACEMENT' &&
                                styles.selectedGroupedReplacementCard,
                            ]}
                            onPress={() => setSelectedReplacementTeacherId('NO_REPLACEMENT')}
                        >
                            <Text style={styles.noReplacementSelectText}>No Replacement</Text>
                        </TouchableOpacity>

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowReplacementModal(false);
                                    setSelectedLeaveSchedule(null);
                                    setSelectedReplacementTeacherId(null);
                                    setGroupedReplacements({
                                        bestMatch: [],
                                        sameClass: [],
                                        others: [],
                                    });
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    (selectedReplacementTeacherId === null || replacementLoading) &&
                                    styles.disabledConfirmButton,
                                ]}
                                onPress={assignReplacementTeacher}
                                disabled={selectedReplacementTeacherId === null || replacementLoading}
                            >
                                <Text style={styles.modalButtonText}>Save</Text>
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
    optionRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    optionChip: {
        flex: 1,
        backgroundColor: '#e5e7eb',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    activeOptionChip: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    optionChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        textAlign: 'center',
    },
    activeOptionChipText: {
        color: '#fff',
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
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
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
    summaryBox: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 12,
        padding: 12,
        marginBottom: 18,
    },
    summaryText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },
    filterScroll: {
        flexGrow: 0,
        marginBottom: 18,
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
    fullDayButton: {
        backgroundColor: '#7c3aed',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280',
        marginBottom: 18,
        textAlign: 'center',
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
    periodLeaveButton: {
        backgroundColor: '#d97706',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    assignReplacementButton: {
        backgroundColor: '#2563eb',
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
    replacementModalBox: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 20,
        maxHeight: '85%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 18,
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
    disabledConfirmButton: {
        backgroundColor: '#86efac',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    leaveInfoBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        padding: 14,
        marginBottom: 16,
    },
    leaveInfoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 6,
    },
    leaveInfoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    replacementTabRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    replacementTab: {
        flex: 1,
        backgroundColor: '#e5e7eb',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignItems: 'center',
    },
    activeReplacementTab: {
        backgroundColor: '#2563eb',
    },
    replacementTabText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    activeReplacementTabText: {
        color: '#fff',
    },
    replacementList: {
        maxHeight: 260,
    },
    groupedReplacementCard: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    selectedGroupedReplacementCard: {
        backgroundColor: '#dcfce7',
        borderColor: '#16a34a',
        borderWidth: 2,
    },
    groupedReplacementName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 6,
        textAlign: 'center',
    },
    groupedReplacementType: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
        textAlign: 'center',
    },
    noReplacementSelectButton: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#bfdbfe',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    noReplacementSelectText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e3a8a',
        textAlign: 'center',
    },
    noReplacementBox: {
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#fcd34d',
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    noReplacementTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#92400e',
        marginBottom: 6,
    },
    noReplacementText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
        textAlign: 'center',
    },
});