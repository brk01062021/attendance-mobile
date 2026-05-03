import React, { useEffect, useMemo, useState } from 'react';
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

const MAX_VISIBLE_PERIOD_CARDS = 10;

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
    const [teacherList, setTeacherList] = useState<{ teacherId: number; teacherName: string }[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
    const [currentBatchStartIndex, setCurrentBatchStartIndex] = useState(0);

    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [showReplacementModal, setShowReplacementModal] = useState(false);
    const [showApplyConfirmModal, setShowApplyConfirmModal] = useState(false);

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

    const [selectedBulkScheduleIds, setSelectedBulkScheduleIds] = useState<number[]>([]);
    const [showBulkReplacementModal, setShowBulkReplacementModal] = useState(false);
    const [bulkReplacementLoaded, setBulkReplacementLoaded] = useState(false);
    const [showBulkSelectConfirmModal, setShowBulkSelectConfirmModal] = useState(false);
    const [pendingBulkDate, setPendingBulkDate] = useState<string | null>(null);
    const [pendingBulkSchedules, setPendingBulkSchedules] = useState<TeacherSchedule[]>([]);

    useEffect(() => {
        loadTeacherOptions(todayString);
    }, []);

    const loadTeacherOptions = async (dateToLoad: string) => {
        try {
            let response = await fetch(`${API_ENDPOINTS.teacherSchedules}/teachers`);
            let data = [];

            if (response.ok) {
                data = await response.json();
            }

            if (!Array.isArray(data) || data.length === 0) {
                response = await fetch(`${API_ENDPOINTS.teacherSchedules}?date=${dateToLoad}`);

                if (response.ok) {
                    data = await response.json();
                }
            }

            if (!Array.isArray(data)) {
                setTeacherList([]);
                setSelectedTeacherId('');
                return;
            }

            const map = new Map<number, string>();

            data.forEach((item: any) => {
                const teacherId = item.teacherId ?? item.id ?? item.teacher_id;
                const teacherName = item.teacherName ?? item.name ?? item.teacher_name;

                if (teacherId && teacherName) {
                    map.set(Number(teacherId), String(teacherName));
                }
            });

            const teachers = Array.from(map.entries())
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([teacherId, teacherName]) => ({
                    teacherId,
                    teacherName,
                }));

            setTeacherList(teachers);

            if (teachers.length > 0) {
                setSelectedTeacherId(String(teachers[0].teacherId));
            } else {
                setSelectedTeacherId('');
            }
        } catch (error) {
            console.log('loadTeacherOptions error:', error);
            setTeacherList([]);
            setSelectedTeacherId('');
        }
    };

    const teacherOptions = useMemo(() => {
        return teacherList;
    }, [teacherList]);

    const filteredSchedules = useMemo(() => {
        return [...schedules]
            .filter((item) =>
                selectedTeacherId === ''
                    ? true
                    : item.teacherId === Number(selectedTeacherId)
            )
            .sort((a, b) => {
                const dateCompare = a.scheduleDate.localeCompare(b.scheduleDate);
                if (dateCompare !== 0) return dateCompare;
                return a.startTime.localeCompare(b.startTime);
            });
    }, [schedules, selectedTeacherId]);

    const visibleSchedules = useMemo(() => {
        return filteredSchedules.slice(
            currentBatchStartIndex,
            currentBatchStartIndex + MAX_VISIBLE_PERIOD_CARDS
        );
    }, [filteredSchedules, currentBatchStartIndex]);

    const currentBatchNumber = Math.floor(currentBatchStartIndex / MAX_VISIBLE_PERIOD_CARDS) + 1;

    const totalBatchCount = Math.max(
        1,
        Math.ceil(filteredSchedules.length / MAX_VISIBLE_PERIOD_CARDS)
    );

    const groupedSchedulesByDate = useMemo(() => {
        const grouped = new Map<string, TeacherSchedule[]>();

        visibleSchedules.forEach((item) => {
            if (!grouped.has(item.scheduleDate)) {
                grouped.set(item.scheduleDate, []);
            }

            grouped.get(item.scheduleDate)?.push(item);
        });

        return Array.from(grouped.entries());
    }, [visibleSchedules]);

    const selectedReplacementList = useMemo(() => {
        if (activeReplacementTab === 'BEST_MATCH') return groupedReplacements.bestMatch;
        if (activeReplacementTab === 'SAME_CLASS') return groupedReplacements.sameClass;
        return groupedReplacements.others;
    }, [activeReplacementTab, groupedReplacements]);

    const selectedBulkTeacherName = useMemo(() => {
        const allTeachers = [
            ...groupedReplacements.bestMatch,
            ...groupedReplacements.sameClass,
            ...groupedReplacements.others,
        ];

        const selected = allTeachers.find(
            (teacher) => teacher.teacherId === selectedReplacementTeacherId
        );

        return selected?.teacherName ?? '';
    }, [groupedReplacements, selectedReplacementTeacherId]);

    const hasReplacementAssigned = (item: TeacherSchedule) => {
        return (
            item.replacementTeacherId !== null &&
            item.replacementTeacherId !== undefined &&
            item.replacementTeacherName !== null &&
            item.replacementTeacherName !== undefined &&
            item.replacementTeacherName.trim() !== '' &&
            item.replacementTeacherName !== 'No replacement assigned'
        );
    };

    const isLeaveSchedule = (item: TeacherSchedule) => {
        return (
            item.status === 'PLANNED_LEAVE' ||
            item.status === 'UNPLANNED_LEAVE'
        );
    };

    const toggleBulkScheduleSelection = (scheduleId: number) => {
        setSelectedBulkScheduleIds((prev) =>
            prev.includes(scheduleId)
                ? prev.filter((id) => id !== scheduleId)
                : [...prev, scheduleId]
        );
    };

    const openBulkSelectConfirmModal = (dateValue: string, dateSchedules: TeacherSchedule[]) => {
        const pendingSchedules = dateSchedules.filter(
            (item) => isLeaveSchedule(item) && !hasReplacementAssigned(item)
        );

        if (pendingSchedules.length === 0) {
            Alert.alert(
                'No Pending Periods',
                'No leave periods without replacement are available for bulk assignment on this date.'
            );
            return;
        }

        setPendingBulkDate(dateValue);
        setPendingBulkSchedules(pendingSchedules);
        setShowBulkSelectConfirmModal(true);
    };

    const confirmBulkSelectForDate = () => {
        setSelectedBulkScheduleIds(pendingBulkSchedules.map((item) => item.id));
        setShowBulkSelectConfirmModal(false);
    };

    const replacementAssignedCount = useMemo(() => {
        return visibleSchedules.filter(
            (item) => isLeaveSchedule(item) && hasReplacementAssigned(item)
        ).length;
    }, [visibleSchedules]);

    const replacementNotAssignedCount = useMemo(() => {
        return visibleSchedules.filter(
            (item) => isLeaveSchedule(item) && !hasReplacementAssigned(item)
        ).length;
    }, [visibleSchedules]);

    const getStatusLabel = (status: string) => {
        return status.replace(/_/g, ' ');
    };

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

            loadTeacherOptions(selectedCalendarDate);
        } else {
            setToDate(selectedCalendarDate);
        }

        setSchedules([]);
        setSelectedBulkScheduleIds([]);
        setCurrentBatchStartIndex(0);
        setHasLoadedOnce(false);
        setShowCalendarModal(false);
    };

    const onLeaveTypeChange = (type: LeaveType) => {
        setLeaveType(type);

        if (type === 'UNPLANNED_LEAVE') {
            setDurationType('ONE_DAY');
            setToDate(fromDate);
        }

        setSchedules([]);
        setSelectedBulkScheduleIds([]);
        setCurrentBatchStartIndex(0);
        setHasLoadedOnce(false);
        loadTeacherOptions(fromDate);
    };

    const loadSchedules = async () => {
        try {
            setLoading(true);
            setHasLoadedOnce(true);

            const start = new Date(fromDate);
            const end = new Date(durationType === 'ONE_DAY' ? fromDate : toDate);

            if (start > end) {
                Alert.alert('Invalid Date Range', 'From Date cannot be after To Date.');
                setSchedules([]);
                setSelectedBulkScheduleIds([]);
                setCurrentBatchStartIndex(0);
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

            setCurrentBatchStartIndex(0);
            setSelectedBulkScheduleIds([]);
            setSchedules(allSchedules);

            if (!selectedTeacherId && allSchedules.length > 0) {
                setSelectedTeacherId(String(allSchedules[0].teacherId));
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load teacher schedules');
            setSchedules([]);
            setSelectedBulkScheduleIds([]);
            setCurrentBatchStartIndex(0);
        } finally {
            setLoading(false);
        }
    };

    const loadSchedulesWithoutReset = async () => {
        try {
            const start = new Date(fromDate);
            const end = new Date(durationType === 'ONE_DAY' ? fromDate : toDate);

            const allSchedules: TeacherSchedule[] = [];
            const current = new Date(start);

            while (current <= end) {
                const dateString = current.toISOString().split('T')[0];
                const response = await fetch(
                    `${API_ENDPOINTS.teacherSchedules}?date=${dateString}`
                );

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
            Alert.alert('Error', 'Unable to refresh teacher schedules');
        }
    };

    const handleAutoAssignBestMatches = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_ENDPOINTS.autoAssignBestMatches}?date=${pendingBulkDate || fromDate}`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                throw new Error('Auto assign failed');
            }

            const result = await response.json();

            await loadSchedulesWithoutReset();

            Alert.alert(
                'Auto Assign Completed',
                `Assigned: ${result.assignedCount}\nStill Unassigned: ${result.stillUnassigned}`
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to auto assign best matches');
        } finally {
            setLoading(false);
        }
    };

    const openApplyConfirmModal = () => {
        if (selectedTeacherId === '') {
            Alert.alert('Select Teacher', 'Please select one teacher first.');
            return;
        }

        if (visibleSchedules.length === 0) {
            Alert.alert('No Records', 'No schedule records found for selected teacher/date.');
            return;
        }

        setShowApplyConfirmModal(true);
    };

    const markSelectedTeacherLeave = async () => {
        if (selectedTeacherId === '') {
            Alert.alert('Select Teacher', 'Please select one teacher first.');
            return;
        }

        if (visibleSchedules.length === 0) {
            Alert.alert('No Records', 'No schedule records found for selected teacher/date.');
            return;
        }

        try {
            setShowApplyConfirmModal(false);
            setLoading(true);

            for (const item of visibleSchedules) {
                const response = await fetch(
                    `${API_ENDPOINTS.teacherSchedules}/${item.id}/status?status=${leaveType}`,
                    { method: 'PUT' }
                );

                if (!response.ok) {
                    throw new Error(`Failed to update schedule id ${item.id}`);
                }
            }

            const nextBatchStartIndex = currentBatchStartIndex + MAX_VISIBLE_PERIOD_CARDS;
            const remainingPeriods = Math.max(filteredSchedules.length - nextBatchStartIndex, 0);

            await loadSchedulesWithoutReset();

            setSelectedBulkScheduleIds([]);

            Alert.alert(
                'Success',
                remainingPeriods > 0
                    ? `${visibleSchedules.length} period(s) updated. ${remainingPeriods} period(s) still pending. Next batch is ready.`
                    : `${getStatusLabel(leaveType)} applied successfully.`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            if (remainingPeriods > 0) {
                                setCurrentBatchStartIndex(nextBatchStartIndex);
                            } else {
                                setSchedules([]);
                                setSelectedBulkScheduleIds([]);
                                setSelectedReplacementTeacherId(null);
                                setGroupedReplacements({
                                    bestMatch: [],
                                    sameClass: [],
                                    others: [],
                                });
                                setCurrentBatchStartIndex(0);
                                setHasLoadedOnce(false);
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to apply leave');
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

            const bestMatch = Array.isArray(data.bestMatch) ? data.bestMatch : [];
            const sameClass = Array.isArray(data.sameClass) ? data.sameClass : [];
            const others = Array.isArray(data.others) ? data.others : [];

            setGroupedReplacements({
                bestMatch,
                sameClass,
                others,
            });

            if (bestMatch.length > 0) {
                setActiveReplacementTab('BEST_MATCH');
            } else if (sameClass.length > 0) {
                setActiveReplacementTab('SAME_CLASS');
            } else {
                setActiveReplacementTab('OTHERS');
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load available replacement teachers');
            setShowReplacementModal(false);
        } finally {
            setReplacementLoading(false);
        }
    };

    const openBulkReplacementPicker = async () => {
        const selectedSchedule = visibleSchedules.find((item) =>
            selectedBulkScheduleIds.includes(item.id)
        );

        if (!selectedSchedule) {
            Alert.alert('Select Periods', 'Please select at least one leave period.');
            return;
        }

        try {
            setReplacementLoading(true);
            setSelectedReplacementTeacherId(null);
            setGroupedReplacements({
                bestMatch: [],
                sameClass: [],
                others: [],
            });
            setActiveReplacementTab('BEST_MATCH');
            setBulkReplacementLoaded(false);
            setShowBulkReplacementModal(true);

            const response = await fetch(
                `${API_ENDPOINTS.teacherSchedules}/available-replacements?scheduleId=${selectedSchedule.id}`
            );

            if (!response.ok) {
                throw new Error('Failed to load available replacement teachers');
            }

            const data = await response.json();

            const bestMatch = Array.isArray(data.bestMatch) ? data.bestMatch : [];
            const sameClass = Array.isArray(data.sameClass) ? data.sameClass : [];
            const others = Array.isArray(data.others) ? data.others : [];

            setGroupedReplacements({
                bestMatch,
                sameClass,
                others,
            });

            if (bestMatch.length > 0) {
                setActiveReplacementTab('BEST_MATCH');
            } else if (sameClass.length > 0) {
                setActiveReplacementTab('SAME_CLASS');
            } else {
                setActiveReplacementTab('OTHERS');
            }

            setBulkReplacementLoaded(true);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load replacement teachers');
            setShowBulkReplacementModal(false);
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
                    { method: 'PUT' }
                );
            } else {
                response = await fetch(
                    `${API_ENDPOINTS.teacherSchedules}/${selectedLeaveSchedule.id}/assign-replacement?replacementTeacherId=${selectedReplacementTeacherId}`,
                    { method: 'PUT' }
                );
            }

            if (!response.ok) {
                throw new Error('Failed to save replacement');
            }

            setShowReplacementModal(false);
            setSelectedLeaveSchedule(null);
            setSelectedReplacementTeacherId(null);

            await loadSchedulesWithoutReset();

            Alert.alert('Success', 'Replacement updated successfully.');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to save replacement');
        } finally {
            setReplacementLoading(false);
        }
    };

    const bulkAssignReplacementTeacher = async () => {
        if (selectedBulkScheduleIds.length === 0) {
            Alert.alert('Select Periods', 'Please select at least one leave period.');
            return;
        }

        if (
            selectedReplacementTeacherId === null ||
            selectedReplacementTeacherId === 'NO_REPLACEMENT'
        ) {
            Alert.alert('Select Teacher', 'Please select a replacement teacher.');
            return;
        }

        try {
            setReplacementLoading(true);

            const response = await fetch(API_ENDPOINTS.bulkAssignReplacement, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    scheduleIds: selectedBulkScheduleIds,
                    replacementTeacherId: selectedReplacementTeacherId,
                }),
            });

            if (!response.ok) {
                throw new Error('Bulk assign failed');
            }

            setShowBulkReplacementModal(false);
            setSelectedBulkScheduleIds([]);
            setSelectedReplacementTeacherId(null);
            setBulkReplacementLoaded(false);
            setGroupedReplacements({
                bestMatch: [],
                sameClass: [],
                others: [],
            });

            await loadSchedulesWithoutReset();

            Alert.alert('Success', 'Bulk replacement assigned successfully.');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to bulk assign replacement');
        } finally {
            setReplacementLoading(false);
        }
    };

    const applyButtonText = useMemo(() => {
        const count = visibleSchedules.length;

        if (leaveType === 'PLANNED_LEAVE') {
            return count > 0
                ? `Apply Planned Leave for ${count} Period(s)`
                : 'Apply Planned Leave';
        }

        return count > 0
            ? `Apply Unplanned Leave for ${count} Period(s)`
            : 'Apply Unplanned Leave';
    }, [leaveType, visibleSchedules.length]);

    return (
        <View style={styles.screen}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.title}>Teacher Leave Planning</Text>
                <Text style={styles.subtitle}>Planned & Unplanned Leave Workflow</Text>

                <Text style={styles.label}>Leave Type</Text>
                <View style={styles.optionRow}>
                    <TouchableOpacity
                        style={[
                            styles.optionChip,
                            leaveType === 'PLANNED_LEAVE' && styles.activeOptionChip,
                        ]}
                        onPress={() => onLeaveTypeChange('PLANNED_LEAVE')}
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
                        onPress={() => onLeaveTypeChange('UNPLANNED_LEAVE')}
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
                            setSchedules([]);
                            setSelectedBulkScheduleIds([]);
                            setCurrentBatchStartIndex(0);
                            setHasLoadedOnce(false);
                            loadTeacherOptions(fromDate);
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

                    {leaveType === 'PLANNED_LEAVE' && (
                        <TouchableOpacity
                            style={[
                                styles.optionChip,
                                durationType === 'MULTI_DAY' && styles.activeOptionChip,
                            ]}
                            onPress={() => {
                                setDurationType('MULTI_DAY');
                                setSchedules([]);
                                setSelectedBulkScheduleIds([]);
                                setCurrentBatchStartIndex(0);
                                setHasLoadedOnce(false);
                                loadTeacherOptions(fromDate);
                            }}
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
                    )}
                </View>

                {teacherOptions.length > 0 && (
                    <>
                        <Text style={styles.label}>Teacher Name</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                            {teacherOptions.map((teacher) => (
                                <TouchableOpacity
                                    key={teacher.teacherId}
                                    style={[
                                        styles.filterChip,
                                        selectedTeacherId === String(teacher.teacherId) &&
                                        styles.activeFilterChip,
                                    ]}
                                    onPress={() => {
                                        setSelectedTeacherId(String(teacher.teacherId));
                                        setSelectedBulkScheduleIds([]);
                                    }}
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
                    </>
                )}

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
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryText}>
                            Total Periods: {filteredSchedules.length}
                        </Text>
                        <Text style={styles.summarySubText}>
                            Batch {currentBatchNumber} of {totalBatchCount} — Showing {visibleSchedules.length} of {filteredSchedules.length} period card(s)
                        </Text>
                        <Text style={styles.summarySubText}>
                            Replacement Assigned: {replacementAssignedCount}
                        </Text>
                        <Text style={styles.summarySubText}>
                            Replacement Not Assigned: {replacementNotAssignedCount}
                        </Text>

                        {selectedBulkScheduleIds.length > 0 && (
                            <Text style={styles.summaryWarning}>
                                Selected for Bulk Assign: {selectedBulkScheduleIds.length}
                            </Text>
                        )}

                        {filteredSchedules.length > MAX_VISIBLE_PERIOD_CARDS && (
                            <Text style={styles.summaryWarning}>
                                {filteredSchedules.length - visibleSchedules.length} pending period(s). Complete this batch, then continue next batch.
                            </Text>
                        )}
                    </View>
                )}

                {!loading && schedules.length > 0 && selectedBulkScheduleIds.length > 0 && (
                    <TouchableOpacity
                        style={styles.autoAssignButton}
                        onPress={handleAutoAssignBestMatches}
                    >
                        <Text style={styles.autoAssignButtonText}>
                            Auto Assign Best Matches ({selectedBulkScheduleIds.length})
                        </Text>
                    </TouchableOpacity>
                )}

                {!loading && hasLoadedOnce && schedules.length === 0 && (
                    <View style={styles.noDataContainer}>
                        <Text style={styles.noDataTitle}>No Schedule Found</Text>
                        <Text style={styles.noDataText}>
                            No teacher schedule found for selected date.
                        </Text>
                    </View>
                )}

                {!loading && groupedSchedulesByDate.map(([date, dateSchedules]) => (
                    <View key={date}>
                        <TouchableOpacity
                            style={styles.dateGroupHeader}
                            onPress={() => openBulkSelectConfirmModal(date, dateSchedules)}
                        >
                            <Text style={styles.dateGroupTitle}>{date}</Text>
                            <Text style={styles.dateGroupSubtitle}>{dateSchedules.length} period(s)</Text>
                        </TouchableOpacity>

                        {dateSchedules.map((item) => (
                            <View key={item.id} style={styles.card}>
                                {selectedBulkScheduleIds.includes(item.id) && (
                                    <View style={styles.selectedBulkInfoBox}>
                                        <Text style={styles.selectedBulkInfoText}>✓ Selected for Bulk Assign</Text>
                                    </View>
                                )}

                                <Text style={styles.teacherName}>{item.teacherName}</Text>

                                <Text style={styles.cardText}>Subject: {item.subjectName}</Text>

                                <Text style={styles.cardText}>
                                    Time: {item.startTime} - {item.endTime}
                                </Text>

                                <TouchableOpacity
                                    style={styles.assignReplacementButton}
                                    onPress={() => openReplacementModal(item)}
                                >
                                    <Text style={styles.actionButtonText}>Replacement Options</Text>
                                </TouchableOpacity>

                                {hasReplacementAssigned(item) ? (
                                    <Text style={styles.replacementText}>
                                        Replacement: {item.replacementTeacherName}
                                    </Text>
                                ) : (
                                    <Text style={styles.noReplacementText}>
                                        Replacement: No replacement assigned
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                ))}
            </ScrollView>

            {schedules.length > 0 && selectedTeacherId !== '' && (
                <View style={styles.bottomActionContainer}>
                    {selectedBulkScheduleIds.length > 0 && (
                        <TouchableOpacity
                            style={styles.bulkAssignButton}
                            onPress={openBulkReplacementPicker}
                        >
                            <Text style={styles.bulkAssignButtonText}>
                                Bulk Assign Replacement ({selectedBulkScheduleIds.length})
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.bottomApplyButton, loading && styles.disabledBottomButton]}
                        onPress={openApplyConfirmModal}
                        disabled={loading}
                    >
                        <Text style={styles.bottomApplyButtonText}>{applyButtonText}</Text>
                    </TouchableOpacity>
                </View>
            )}


            <Modal visible={showBulkSelectConfirmModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.applyConfirmModalBox}>
                        <Text style={styles.modalTitle}>Bulk Assign Replacement</Text>

                        <View style={styles.applySummaryBox}>
                            <Text style={styles.applySummaryText}>{pendingBulkDate}</Text>
                            <Text style={styles.applySummaryText}>
                                Pending Periods: {pendingBulkSchedules.length}
                            </Text>
                        </View>

                        <Text style={styles.applyWarningNote}>
                            Do you want to select all pending periods for bulk assignment?
                        </Text>

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowBulkSelectConfirmModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={confirmBulkSelectForDate}
                            >
                                <Text style={styles.modalButtonText}>Yes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showApplyConfirmModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.applyConfirmModalBox}>
                        <Text style={styles.modalTitle}>Confirm Leave</Text>

                        <View style={styles.applySummaryBox}>
                            <Text style={styles.applySummaryText}>
                                Total Visible Periods: {visibleSchedules.length}
                            </Text>
                            <Text style={styles.applySummaryText}>
                                Replacement Assigned: {replacementAssignedCount}
                            </Text>
                            <Text style={styles.applyWarningText}>
                                Replacement Not Assigned: {replacementNotAssignedCount}
                            </Text>
                        </View>

                        {replacementNotAssignedCount > 0 && (
                            <Text style={styles.applyWarningNote}>
                                Some periods do not have replacement teachers. You can apply leave anyway and use Admin Teacher Dashboard replacement filter later.
                            </Text>
                        )}

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowApplyConfirmModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Review Replacements</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={markSelectedTeacherLeave}
                            >
                                <Text style={styles.modalButtonText}>Apply Anyway</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

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
                                    selectedColor: '#c69214',
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
                        <Text style={styles.modalTitle}>Replacement Options</Text>

                        {selectedLeaveSchedule && (
                            <View style={styles.leaveInfoBox}>
                                <Text style={styles.leaveInfoTitle}>
                                    {selectedLeaveSchedule.teacherName}
                                </Text>
                                <Text style={styles.leaveInfoText}>
                                    Subject: {selectedLeaveSchedule.subjectName}
                                </Text>
                                <Text style={styles.leaveInfoText}>
                                    Time: {selectedLeaveSchedule.startTime} - {selectedLeaveSchedule.endTime}
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
                                <Text style={styles.noReplacementBoxText}>
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

                                        <Text style={styles.groupedReplacementDetails}>
                                            Class: {teacher.className} - Section {teacher.section}
                                        </Text>

                                        <Text style={styles.groupedReplacementDetails}>
                                            Subject: {teacher.subjectName}
                                        </Text>

                                        <Text style={styles.groupedReplacementDetails}>
                                            Workload: {teacher.dailyWorkload ?? 0}
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

            <Modal visible={showBulkReplacementModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.replacementModalBox}>
                        <Text style={styles.modalTitle}>Bulk Assign Replacement</Text>

                        <View style={styles.leaveInfoBox}>
                            <Text style={styles.leaveInfoTitle}>
                                Selected Periods: {selectedBulkScheduleIds.length}
                            </Text>

                            <Text style={styles.leaveInfoText}>
                                Select one replacement teacher for all selected leave periods.
                            </Text>

                            {selectedBulkTeacherName !== '' && (
                                <Text style={styles.leaveInfoText}>
                                    Selected Replacement: {selectedBulkTeacherName}
                                </Text>
                            )}
                        </View>

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

                        {!replacementLoading && bulkReplacementLoaded && selectedReplacementList.length === 0 && (
                            <View style={styles.noReplacementBox}>
                                <Text style={styles.noReplacementTitle}>No Teachers</Text>
                                <Text style={styles.noReplacementBoxText}>
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

                                        <Text style={styles.groupedReplacementDetails}>
                                            Class: {teacher.className} - Section {teacher.section}
                                        </Text>

                                        <Text style={styles.groupedReplacementDetails}>
                                            Subject: {teacher.subjectName}
                                        </Text>

                                        <Text style={styles.groupedReplacementDetails}>
                                            Workload: {teacher.dailyWorkload ?? 0}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setShowBulkReplacementModal(false);
                                    setSelectedReplacementTeacherId(null);
                                    setBulkReplacementLoaded(false);
                                }}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.confirmButton,
                                    (selectedReplacementTeacherId === null ||
                                        selectedReplacementTeacherId === 'NO_REPLACEMENT' ||
                                        replacementLoading) &&
                                    styles.disabledConfirmButton,
                                ]}
                                onPress={bulkAssignReplacementTeacher}
                                disabled={
                                    selectedReplacementTeacherId === null ||
                                    selectedReplacementTeacherId === 'NO_REPLACEMENT' ||
                                    replacementLoading
                                }
                            >
                                <Text style={styles.modalButtonText}>Bulk Assign</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fffdf7',
    },
    container: {
        flex: 1,
        backgroundColor: '#fffdf7',
        padding: 25,
    },
    scrollContent: {
        paddingBottom: 150,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#7a4f01',
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
        backgroundColor: '#fff7df',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0d58a',
    },
    activeOptionChip: {
        backgroundColor: '#c69214',
        borderColor: '#c69214',
    },
    optionChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#7a4f01',
        textAlign: 'center',
    },
    activeOptionChipText: {
        color: '#fff',
    },
    dateBox: {
        borderWidth: 1,
        borderColor: '#f0d58a',
        borderRadius: 10,
        padding: 14,
        marginBottom: 18,
        backgroundColor: '#fff8e7',
    },
    dateText: {
        fontSize: 16,
        color: '#111827',
    },
    button: {
        backgroundColor: '#c69214',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: '#d8bd72',
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
        backgroundColor: '#fff8e7',
        borderWidth: 1,
        borderColor: '#f0d58a',
        borderRadius: 12,
        padding: 12,
        marginBottom: 18,
    },
    summaryText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    summarySubText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginTop: 4,
    },
    summaryWarning: {
        fontSize: 13,
        fontWeight: '700',
        color: '#92400e',
        marginTop: 6,
    },
    filterScroll: {
        flexGrow: 0,
        marginBottom: 18,
    },
    filterChip: {
        backgroundColor: '#fff7df',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#f0d58a',
    },
    activeFilterChip: {
        backgroundColor: '#c69214',
        borderColor: '#c69214',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#7a4f01',
    },
    activeFilterChipText: {
        color: '#fff',
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
    dateGroupHeader: {
        backgroundColor: '#7a4f01',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        marginTop: 8,
    },
    dateGroupTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dateGroupSubtitle: {
        color: '#fff7df',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#f0d58a',
        marginBottom: 18,
    },
    teacherName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 10,
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
        marginTop: 10,
        fontWeight: 'bold',
    },
    noReplacementText: {
        fontSize: 15,
        color: '#92400e',
        marginTop: 10,
        fontWeight: '700',
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
    bottomActionContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#fffdf7',
        paddingHorizontal: 22,
        paddingTop: 12,
        paddingBottom: 22,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    bottomApplyButton: {
        backgroundColor: '#7a4f01',
        borderRadius: 28,
        paddingVertical: 18,
        paddingHorizontal: 18,
        alignItems: 'center',
    },
    disabledBottomButton: {
        backgroundColor: '#9ca3af',
    },
    bottomApplyButtonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
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
    applyConfirmModalBox: {
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
    applySummaryBox: {
        backgroundColor: '#fff8e7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0d58a',
        padding: 14,
        marginBottom: 14,
    },
    applySummaryText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 6,
    },
    applyWarningText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#92400e',
        marginBottom: 6,
    },
    applyWarningNote: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
        lineHeight: 20,
        marginBottom: 10,
    },
    selectedDateBox: {
        backgroundColor: '#fff8e7',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#f0d58a',
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
        backgroundColor: '#fff8e7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f0d58a',
        padding: 14,
        marginBottom: 16,
    },
    leaveInfoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#7a4f01',
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
        backgroundColor: '#fff7df',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0d58a',
    },
    activeReplacementTab: {
        backgroundColor: '#c69214',
    },
    replacementTabText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#7a4f01',
        textAlign: 'center',
    },
    activeReplacementTabText: {
        color: '#fff',
    },
    replacementList: {
        maxHeight: 260,
    },
    groupedReplacementCard: {
        backgroundColor: '#fff8e7',
        borderWidth: 1,
        borderColor: '#f0d58a',
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
        color: '#7a4f01',
        marginBottom: 6,
        textAlign: 'center',
    },
    groupedReplacementType: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6b7280',
        textAlign: 'center',
    },
    groupedReplacementDetails: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginTop: 4,
    },
    noReplacementSelectButton: {
        backgroundColor: '#fff8e7',
        borderWidth: 1,
        borderColor: '#f0d58a',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    noReplacementSelectText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#7a4f01',
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
    noReplacementBoxText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400e',
        textAlign: 'center',
    },
    autoAssignButton: {
        backgroundColor: '#B8860B',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 18,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
    },
    autoAssignButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    selectedBulkInfoBox: {
        backgroundColor: '#dcfce7',
        borderWidth: 1,
        borderColor: '#16a34a',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        alignItems: 'center',
    },
    selectedBulkInfoText: {
        color: '#166534',
        fontSize: 14,
        fontWeight: '700',
    },
    bulkSelectBox: {
        backgroundColor: '#fff8e7',
        borderWidth: 1,
        borderColor: '#f0d58a',
        borderRadius: 10,
        padding: 10,
        marginBottom: 12,
        alignItems: 'center',
    },
    bulkSelectBoxActive: {
        backgroundColor: '#dcfce7',
        borderColor: '#16a34a',
        borderWidth: 2,
    },
    bulkSelectText: {
        color: '#7a4f01',
        fontSize: 14,
        fontWeight: '700',
    },
    bulkSelectTextActive: {
        color: '#166534',
    },
    bulkAssignButton: {
        backgroundColor: '#B8860B',
        borderRadius: 24,
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: 'center',
        marginBottom: 10,
    },
    bulkAssignButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});