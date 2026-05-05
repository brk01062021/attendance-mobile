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
    ImageBackground,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { API_ENDPOINTS } from '../src/services/api';
import { images } from '../src/constants/images';

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

type ReplacementTab = 'BEST_MATCH' | 'SAME_CLASS' | 'OTHERS';

export default function AdminTeacherDashboardScreen() {
    const todayString = new Date().toISOString().split('T')[0];

    const [date, setDate] = useState(todayString);
    const [selectedDate, setSelectedDate] = useState(todayString);
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    const [allSchedules, setAllSchedules] = useState<TeacherSchedule[]>([]);
    const [showResults, setShowResults] = useState(false);

    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const [selectedTeacher, setSelectedTeacher] = useState('ALL');
    const [selectedClass, setSelectedClass] = useState('ALL');
    const [selectedSection, setSelectedSection] = useState('ALL');
    const [selectedSubject, setSelectedSubject] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedTimePeriod, setSelectedTimePeriod] = useState('ALL');
    const [selectedReplacementStatus, setSelectedReplacementStatus] = useState('ALL');

    const [showReplacementModal, setShowReplacementModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);
    const [replacementActionStatus, setReplacementActionStatus] =
        useState<'UNPLANNED_LEAVE' | 'ASSIGN_ONLY'>('UNPLANNED_LEAVE');

    const [groupedReplacements, setGroupedReplacements] =
        useState<GroupedReplacementOptions>({
            bestMatch: [],
            sameClass: [],
            others: [],
        });

    const [activeReplacementTab, setActiveReplacementTab] =
        useState<ReplacementTab>('BEST_MATCH');

    const [selectedReplacementTeacherId, setSelectedReplacementTeacherId] =
        useState<number | 'NO_REPLACEMENT' | null>(null);

    const [replacementLoading, setReplacementLoading] = useState(false);

    const [selectedBulkScheduleIds, setSelectedBulkScheduleIds] = useState<number[]>([]);
    const [showBulkSelectConfirmModal, setShowBulkSelectConfirmModal] = useState(false);
    const [showBulkReplacementModal, setShowBulkReplacementModal] = useState(false);
    const [bulkReplacementLoaded, setBulkReplacementLoaded] = useState(false);
    const [pendingBulkDate, setPendingBulkDate] = useState<string | null>(null);
    const [pendingBulkSchedules, setPendingBulkSchedules] = useState<TeacherSchedule[]>([]);

    const replacementStatusOptions = ['ALL', 'ASSIGNED', 'NOT_ASSIGNED'];

    const resetAllFilters = () => {
        setSelectedTeacher('ALL');
        setSelectedClass('ALL');
        setSelectedSection('ALL');
        setSelectedSubject('ALL');
        setSelectedStatus('ALL');
        setSelectedTimePeriod('ALL');
        setSelectedReplacementStatus('ALL');
    };

    const loadSchedulesForFilters = async () => {
        try {
            setLoading(true);
            setHasLoadedOnce(true);
            setShowResults(false);

            const response = await fetch(`${API_ENDPOINTS.teacherSchedules}?date=${date}`);

            if (!response.ok) {
                throw new Error('Failed to load teacher schedules');
            }

            const data = await response.json();
            setAllSchedules(Array.isArray(data) ? data : []);
            setSelectedBulkScheduleIds([]);
            setPendingBulkDate(null);
            setPendingBulkSchedules([]);
            resetAllFilters();
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load teacher schedules');
            setAllSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    const showFilteredResults = async () => {
        if (allSchedules.length === 0) {
            await loadSchedulesForFilters();
            setShowResults(true);
            return;
        }

        setShowResults(true);
    };

    const updateStatus = async (scheduleId: number, status: string) => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_ENDPOINTS.teacherSchedules}/${scheduleId}/status?status=${status}`,
                { method: 'PUT' }
            );

            if (!response.ok) {
                throw new Error('Failed to update schedule status');
            }

            await loadSchedulesForFilters();
            setShowResults(true);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to update teacher schedule');
        } finally {
            setLoading(false);
        }
    };

    const openReplacementModal = async (
        schedule: TeacherSchedule,
        actionStatus: 'UNPLANNED_LEAVE' | 'ASSIGN_ONLY'
    ) => {
        try {
            setSelectedSchedule(schedule);
            setReplacementActionStatus(actionStatus);
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

    const selectedReplacementList = useMemo(() => {
        if (activeReplacementTab === 'BEST_MATCH') return groupedReplacements.bestMatch;
        if (activeReplacementTab === 'SAME_CLASS') return groupedReplacements.sameClass;
        return groupedReplacements.others;
    }, [activeReplacementTab, groupedReplacements]);

    const isLeaveSchedule = (item: TeacherSchedule) => {
        return item.status === 'PLANNED_LEAVE' || item.status === 'UNPLANNED_LEAVE';
    };

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

    const handleAutoAssignBestMatches = async () => {
        if (selectedBulkScheduleIds.length === 0) {
            Alert.alert('Select Periods', 'Please select periods for bulk assignment first.');
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_ENDPOINTS.autoAssignBestMatches}?date=${pendingBulkDate || date}`,
                { method: 'POST' }
            );

            if (!response.ok) {
                throw new Error('Auto assign failed');
            }

            const result = await response.json();

            await loadSchedulesForFilters();
            setShowResults(true);
            setSelectedBulkScheduleIds([]);
            setPendingBulkDate(null);
            setPendingBulkSchedules([]);

            Alert.alert(
                'Auto Assign Completed',
                `Assigned: ${result.assignedCount}
Still Unassigned: ${result.stillUnassigned}`
            );
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to auto assign best matches');
        } finally {
            setLoading(false);
        }
    };

    const openBulkReplacementPicker = async () => {
        const selectedSchedule = filteredSchedules.find((item) =>
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

            setGroupedReplacements({ bestMatch, sameClass, others });

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

            await loadSchedulesForFilters();
            setShowResults(true);

            Alert.alert('Success', 'Bulk replacement assigned successfully.');
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to bulk assign replacement');
        } finally {
            setReplacementLoading(false);
        }
    };

    const saveReplacementAction = async () => {
        if (!selectedSchedule || selectedReplacementTeacherId === null) {
            Alert.alert('Select Teacher', 'Please select a replacement option.');
            return;
        }

        try {
            setReplacementLoading(true);

            let response;

            if (replacementActionStatus === 'UNPLANNED_LEAVE') {
                if (selectedReplacementTeacherId === 'NO_REPLACEMENT') {
                    response = await fetch(
                        `${API_ENDPOINTS.teacherSchedules}/${selectedSchedule.id}/status?status=UNPLANNED_LEAVE`,
                        { method: 'PUT' }
                    );
                } else {
                    const selectedTeacher = selectedReplacementList.find(
                        (teacher) => teacher.teacherId === selectedReplacementTeacherId
                    );

                    response = await fetch(
                        `${API_ENDPOINTS.teacherSchedules}/${selectedSchedule.id}/status?status=UNPLANNED_LEAVE&replacementTeacherId=${selectedReplacementTeacherId}&replacementTeacherName=${encodeURIComponent(
                            selectedTeacher?.teacherName || ''
                        )}`,
                        { method: 'PUT' }
                    );
                }
            } else {
                if (selectedReplacementTeacherId === 'NO_REPLACEMENT') {
                    response = await fetch(
                        `${API_ENDPOINTS.teacherSchedules}/${selectedSchedule.id}/status?status=${selectedSchedule.status}`,
                        { method: 'PUT' }
                    );
                } else {
                    response = await fetch(
                        `${API_ENDPOINTS.teacherSchedules}/${selectedSchedule.id}/assign-replacement?replacementTeacherId=${selectedReplacementTeacherId}`,
                        { method: 'PUT' }
                    );
                }
            }

            if (!response.ok) {
                throw new Error('Failed to save replacement');
            }

            setShowReplacementModal(false);
            setSelectedSchedule(null);
            setSelectedReplacementTeacherId(null);

            await loadSchedulesForFilters();
            setShowResults(true);

            Alert.alert('Success', 'Schedule updated successfully.', [
                {
                    text: 'OK',
                    onPress: () => {
                        setAllSchedules([]);
                        setShowResults(false);
                        setHasLoadedOnce(false);

                        setSelectedTeacher('ALL');
                        setSelectedClass('ALL');
                        setSelectedSection('ALL');
                        setSelectedSubject('ALL');
                        setSelectedStatus('ALL');
                        setSelectedTimePeriod('ALL');
                        setSelectedReplacementStatus('ALL');

                        setSelectedSchedule(null);
                        setSelectedReplacementTeacherId(null);

                        setGroupedReplacements({
                            bestMatch: [],
                            sameClass: [],
                            others: [],
                        });

                        setActiveReplacementTab('BEST_MATCH');
                    },
                },
            ]);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to save schedule update');
        } finally {
            setReplacementLoading(false);
        }
    };

    const confirmDate = () => {
        setDate(selectedDate);
        setShowCalendarModal(false);
        setAllSchedules([]);
        setShowResults(false);
        resetAllFilters();
    };

    const getStatusLabel = (status: string) => {
        return status.replace(/_/g, ' ');
    };

    const getReplacementLabel = (status: string) => {
        if (status === 'NOT_ASSIGNED') return 'NOT ASSIGNED';
        return status.replace(/_/g, ' ');
    };

    const getStatusStyle = (status: string) => {
        if (status === 'AVAILABLE') return styles.availableStatus;
        if (status === 'PLANNED_LEAVE') return styles.leaveStatus;
        if (status === 'UNPLANNED_LEAVE') return styles.absentStatus;
        return styles.defaultStatus;
    };

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

    const teacherOptions = useMemo(() => {
        const values = Array.from(new Set(allSchedules.map((item) => item.teacherName)))
            .filter(Boolean)
            .sort();

        return ['ALL', ...values];
    }, [allSchedules]);

    const classOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                allSchedules
                    .filter((item) => selectedTeacher === 'ALL' || item.teacherName === selectedTeacher)
                    .map((item) => item.className)
            )
        )
            .filter(Boolean)
            .sort((a, b) => Number(b) - Number(a));

        return ['ALL', ...values];
    }, [allSchedules, selectedTeacher]);

    const sectionOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                allSchedules
                    .filter((item) => selectedTeacher === 'ALL' || item.teacherName === selectedTeacher)
                    .filter((item) => selectedClass === 'ALL' || item.className === selectedClass)
                    .map((item) => item.section)
            )
        )
            .filter(Boolean)
            .sort();

        return ['ALL', ...values];
    }, [allSchedules, selectedTeacher, selectedClass]);

    const subjectOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                allSchedules
                    .filter((item) => selectedTeacher === 'ALL' || item.teacherName === selectedTeacher)
                    .filter((item) => selectedClass === 'ALL' || item.className === selectedClass)
                    .filter((item) => selectedSection === 'ALL' || item.section === selectedSection)
                    .map((item) => item.subjectName)
            )
        )
            .filter(Boolean)
            .sort();

        return ['ALL', ...values];
    }, [allSchedules, selectedTeacher, selectedClass, selectedSection]);

    const statusOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                allSchedules
                    .filter((item) => selectedTeacher === 'ALL' || item.teacherName === selectedTeacher)
                    .filter((item) => selectedClass === 'ALL' || item.className === selectedClass)
                    .filter((item) => selectedSection === 'ALL' || item.section === selectedSection)
                    .filter((item) => selectedSubject === 'ALL' || item.subjectName === selectedSubject)
                    .map((item) => item.status)
            )
        )
            .filter(Boolean)
            .sort();

        return ['ALL', ...values];
    }, [allSchedules, selectedTeacher, selectedClass, selectedSection, selectedSubject]);

    const timePeriods = useMemo(() => {
        const values = Array.from(
            new Set(
                allSchedules
                    .filter((item) => selectedTeacher === 'ALL' || item.teacherName === selectedTeacher)
                    .filter((item) => selectedClass === 'ALL' || item.className === selectedClass)
                    .filter((item) => selectedSection === 'ALL' || item.section === selectedSection)
                    .filter((item) => selectedSubject === 'ALL' || item.subjectName === selectedSubject)
                    .filter((item) => selectedStatus === 'ALL' || item.status === selectedStatus)
                    .map((item) => `${item.startTime} - ${item.endTime}`)
            )
        ).sort();

        return ['ALL', ...values];
    }, [
        allSchedules,
        selectedTeacher,
        selectedClass,
        selectedSection,
        selectedSubject,
        selectedStatus,
    ]);

    const filteredSchedules = useMemo(() => {
        return [...allSchedules]
            .filter((item) => selectedTeacher === 'ALL' || item.teacherName === selectedTeacher)
            .filter((item) => selectedClass === 'ALL' || item.className === selectedClass)
            .filter((item) => selectedSection === 'ALL' || item.section === selectedSection)
            .filter((item) => selectedSubject === 'ALL' || item.subjectName === selectedSubject)
            .filter((item) => selectedStatus === 'ALL' || item.status === selectedStatus)
            .filter(
                (item) =>
                    selectedTimePeriod === 'ALL' ||
                    `${item.startTime} - ${item.endTime}` === selectedTimePeriod
            )
            .filter((item) => {
                if (selectedReplacementStatus === 'ALL') return true;

                const hasReplacement = hasReplacementAssigned(item);

                if (selectedReplacementStatus === 'ASSIGNED') {
                    return hasReplacement;
                }

                return !hasReplacement;
            })
            .sort((a, b) => {
                const classCompare = Number(b.className) - Number(a.className);
                if (classCompare !== 0) return classCompare;

                const sectionCompare = a.section.localeCompare(b.section);
                if (sectionCompare !== 0) return sectionCompare;

                const timeCompare = a.startTime.localeCompare(b.startTime);
                if (timeCompare !== 0) return timeCompare;

                return a.teacherName.localeCompare(b.teacherName);
            });
    }, [
        allSchedules,
        selectedTeacher,
        selectedClass,
        selectedSection,
        selectedSubject,
        selectedStatus,
        selectedTimePeriod,
        selectedReplacementStatus,
    ]);

    const groupedSchedulesByDate = useMemo(() => {
        const grouped = new Map<string, TeacherSchedule[]>();

        filteredSchedules.forEach((item) => {
            if (!grouped.has(item.scheduleDate)) {
                grouped.set(item.scheduleDate, []);
            }

            grouped.get(item.scheduleDate)?.push(item);
        });

        return Array.from(grouped.entries());
    }, [filteredSchedules]);

    const renderFilterChips = (
        title: string,
        options: string[],
        selectedValue: string,
        onSelect: (value: string) => void,
        allLabel: string
    ) => (
        <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>{title}</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.filterChip,
                            selectedValue === option && styles.activeFilterChip,
                        ]}
                        onPress={() => {
                            onSelect(option);
                            setShowResults(false);

                            if (title === 'Teacher') {
                                setSelectedClass('ALL');
                                setSelectedSection('ALL');
                                setSelectedSubject('ALL');
                                setSelectedStatus('ALL');
                                setSelectedTimePeriod('ALL');
                                setSelectedReplacementStatus('ALL');
                            }

                            if (title === 'Class') {
                                setSelectedSection('ALL');
                                setSelectedSubject('ALL');
                                setSelectedStatus('ALL');
                                setSelectedTimePeriod('ALL');
                                setSelectedReplacementStatus('ALL');
                            }

                            if (title === 'Section') {
                                setSelectedSubject('ALL');
                                setSelectedStatus('ALL');
                                setSelectedTimePeriod('ALL');
                                setSelectedReplacementStatus('ALL');
                            }

                            if (title === 'Subject') {
                                setSelectedStatus('ALL');
                                setSelectedTimePeriod('ALL');
                                setSelectedReplacementStatus('ALL');
                            }

                            if (title === 'Status') {
                                setSelectedTimePeriod('ALL');
                                setSelectedReplacementStatus('ALL');
                            }

                            if (title === 'Time Period') {
                                setSelectedReplacementStatus('ALL');
                            }
                        }}
                    >
                        <Text
                            style={[
                                styles.filterChipText,
                                selectedValue === option && styles.activeFilterChipText,
                            ]}
                        >
                            {option === 'ALL'
                                ? allLabel
                                : title === 'Replacement'
                                    ? getReplacementLabel(option)
                                    : getStatusLabel(option)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderStatusAction = (item: TeacherSchedule) => {
        return (
            <>
                {item.status === 'AVAILABLE' && (
                    <TouchableOpacity
                        style={styles.unplannedButton}
                        onPress={() => openReplacementModal(item, 'UNPLANNED_LEAVE')}
                    >
                        <Text style={styles.actionButtonText}>Mark Unplanned Leave</Text>
                    </TouchableOpacity>
                )}

                {item.status !== 'AVAILABLE' && (
                    <TouchableOpacity
                        style={styles.availableButton}
                        onPress={() => updateStatus(item.id, 'AVAILABLE')}
                    >
                        <Text style={styles.actionButtonText}>Mark Available</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.assignReplacementButton}
                    onPress={() => openReplacementModal(item, 'ASSIGN_ONLY')}
                >
                    <Text style={styles.actionButtonText}>Assign Replacement</Text>
                </TouchableOpacity>
            </>
        );
    };

    return (
        <ImageBackground
            source={images.splashGold}
            style={styles.screen}
            resizeMode="cover"
        >
            <View style={styles.pageOverlay}>
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.title}>Admin Teacher&apos;s Dashboard</Text>
                    <Text style={styles.subtitle}>Single Period Leave & Replacement</Text>

                    <Text style={styles.label}>Schedule Date</Text>

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
                        style={[styles.smallLoadButton, loading && styles.disabledButton]}
                        onPress={loadSchedulesForFilters}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Loading...' : 'Load Filter Options'}
                        </Text>
                    </TouchableOpacity>

                    {allSchedules.length > 0 && (
                        <>
                            {renderFilterChips('Teacher', teacherOptions, selectedTeacher, setSelectedTeacher, 'All Teachers')}
                            {renderFilterChips('Class', classOptions, selectedClass, setSelectedClass, 'All Classes')}
                            {renderFilterChips('Section', sectionOptions, selectedSection, setSelectedSection, 'All Sections')}
                            {renderFilterChips('Subject', subjectOptions, selectedSubject, setSelectedSubject, 'All Subjects')}
                            {renderFilterChips('Status', statusOptions, selectedStatus, setSelectedStatus, 'All Status')}

                            {renderFilterChips(
                                'Time Period',
                                timePeriods,
                                selectedTimePeriod,
                                setSelectedTimePeriod,
                                'All Time Periods'
                            )}

                            {renderFilterChips(
                                'Replacement',
                                replacementStatusOptions,
                                selectedReplacementStatus,
                                setSelectedReplacementStatus,
                                'All Replacement'
                            )}

                            <TouchableOpacity
                                style={[styles.button, loading && styles.disabledButton]}
                                onPress={showFilteredResults}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>Load Teacher Schedule</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {showResults && allSchedules.length > 0 && (
                        <View style={styles.resultSummaryBox}>
                            <Text style={styles.resultSummaryText}>
                                Showing {filteredSchedules.length} of {allSchedules.length} schedules
                            </Text>

                            {selectedBulkScheduleIds.length > 0 && (
                                <Text style={styles.resultSummaryText}>
                                    Selected: {selectedBulkScheduleIds.length}
                                </Text>
                            )}

                            <TouchableOpacity
                                onPress={() => {
                                    resetAllFilters();
                                    setShowResults(false);
                                }}
                            >
                                <Text style={styles.resetText}>Reset Filters</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!loading && showResults && selectedBulkScheduleIds.length > 0 && (
                        <>
                            <TouchableOpacity
                                style={styles.autoAssignButton}
                                onPress={handleAutoAssignBestMatches}
                            >
                                <Text style={styles.autoAssignButtonText}>
                                    Auto Assign Best Matches ({selectedBulkScheduleIds.length})
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.bulkAssignButton}
                                onPress={openBulkReplacementPicker}
                            >
                                <Text style={styles.bulkAssignButtonText}>
                                    Bulk Assign Replacement ({selectedBulkScheduleIds.length})
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {loading && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" />
                            <Text style={styles.loadingText}>Loading schedules...</Text>
                        </View>
                    )}

                    {!loading && hasLoadedOnce && allSchedules.length === 0 && (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataTitle}>No Schedule Found</Text>
                            <Text style={styles.noDataText}>
                                No teacher schedule found for selected date.
                            </Text>
                        </View>
                    )}

                    {!loading && showResults && allSchedules.length > 0 && filteredSchedules.length === 0 && (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataTitle}>No Records Found</Text>
                            <Text style={styles.noDataText}>
                                No teacher schedule found for selected filters.
                            </Text>
                        </View>
                    )}

                    {!loading && showResults && groupedSchedulesByDate.map(([scheduleDate, dateSchedules]) => (
                        <View key={scheduleDate}>
                            <TouchableOpacity
                                style={styles.dateGroupHeader}
                                onPress={() => openBulkSelectConfirmModal(scheduleDate, dateSchedules)}
                            >
                                <Text style={styles.dateGroupTitle}>{scheduleDate}</Text>
                                <Text style={styles.dateGroupSubtitle}>{dateSchedules.length} period(s)</Text>
                            </TouchableOpacity>

                            {dateSchedules.map((item) => (
                                <View key={item.id} style={styles.card}>
                                    {selectedBulkScheduleIds.includes(item.id) && (
                                        <View style={styles.selectedBulkInfoBox}>
                                            <Text style={styles.selectedBulkInfoText}>✓ Selected for Bulk Assign</Text>
                                        </View>
                                    )}

                                    <View style={styles.cardHeader}>
                                        <Text style={styles.teacherName}>{item.teacherName}</Text>
                                        <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
                                            {getStatusLabel(item.status)}
                                        </Text>
                                    </View>

                                    <Text style={styles.cardText}>Class: {item.className}</Text>
                                    <Text style={styles.cardText}>Section: {item.section}</Text>
                                    <Text style={styles.cardText}>Subject: {item.subjectName}</Text>

                                    <Text style={styles.cardText}>
                                        Time Period: {item.startTime} - {item.endTime}
                                    </Text>

                                    {item.status !== 'AVAILABLE' && (
                                        hasReplacementAssigned(item) ? (
                                            <Text style={styles.replacementText}>
                                                Replacement info: {item.replacementTeacherName}
                                            </Text>
                                        ) : (
                                            <Text style={styles.noReplacementText}>
                                                Replacement info: No replacement assigned
                                            </Text>
                                        )
                                    )}

                                    {renderStatusAction(item)}
                                </View>
                            ))}
                        </View>
                    ))}

                    <Modal visible={showBulkSelectConfirmModal} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalBox}>
                                <Text style={styles.modalTitle}>Bulk Assign Replacement</Text>

                                <View style={styles.selectedDateBox}>
                                    <Text style={styles.selectedDateText}>{pendingBulkDate}</Text>
                                </View>

                                <Text style={styles.bulkPopupText}>
                                    Do you want to select all pending periods for bulk assignment?
                                </Text>

                                <Text style={styles.bulkPopupCount}>
                                    Pending Periods: {pendingBulkSchedules.length}
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

                    <Modal visible={showCalendarModal} transparent animationType="fade">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalBox}>
                                <Text style={styles.modalTitle}>Select Schedule Date</Text>

                                <View style={styles.selectedDateBox}>
                                    <Text style={styles.selectedDateText}>{selectedDate}</Text>
                                </View>

                                <Calendar
                                    current={selectedDate}
                                    onDayPress={(day) => setSelectedDate(day.dateString)}
                                    markedDates={{
                                        [selectedDate]: {
                                            selected: true,
                                            selectedColor: '#041226',
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
                            <View style={styles.replacementModalBox}>
                                <Text style={styles.modalTitle}>Replacement Options</Text>

                                {selectedSchedule && (
                                    <View style={styles.leaveInfoBox}>
                                        <Text style={styles.leaveInfoTitle}>{selectedSchedule.teacherName}</Text>
                                        <Text style={styles.leaveInfoText}>
                                            Class {selectedSchedule.className} - Section {selectedSchedule.section}
                                        </Text>
                                        <Text style={styles.leaveInfoText}>
                                            {selectedSchedule.subjectName} | {selectedSchedule.startTime} - {selectedSchedule.endTime}
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
                                            setSelectedSchedule(null);
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
                                        onPress={saveReplacementAction}
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
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    pageOverlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollContent: {
        padding: 25,
        paddingBottom: 120,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#041226',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#041226',
        marginBottom: 25,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        color: '#041226',
    },
    dateBox: {
        borderWidth: 1,
        borderColor: '#D8B84A',
        borderRadius: 10,
        padding: 14,
        marginBottom: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
    },
    dateText: {
        fontSize: 16,
        color: '#041226',
    },
    smallLoadButton: {
        backgroundColor: '#041226',
        padding: 13,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#041226',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    disabledButton: {
        backgroundColor: '#d8bd72',
    },
    buttonText: {
        color: '#D8B84A',
        fontSize: 17,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    resultSummaryBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderWidth: 1,
        borderColor: '#D8B84A',
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
        color: '#041226',
    },
    resetText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#041226',
    },
    filterContainer: {
        marginBottom: 18,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#041226',
        marginBottom: 10,
    },
    filterScroll: {
        flexGrow: 0,
    },
    filterChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    activeFilterChip: {
        backgroundColor: '#041226',
        borderColor: '#041226',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#041226',
    },
    activeFilterChipText: {
        color: '#D8B84A',
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
        color: '#041226',
    },
    noDataContainer: {
        backgroundColor: '#fef3c7',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#D8B84A',
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
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: '#D8B84A',
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
        color: '#041226',
        flex: 1,
        marginRight: 10,
    },
    cardText: {
        fontSize: 16,
        color: '#041226',
        marginBottom: 7,
        fontWeight: '600',
    },
    replacementText: {
        fontSize: 16,
        color: '#7c3aed',
        marginTop: 10,
        marginBottom: 8,
        fontWeight: 'bold',
    },
    noReplacementText: {
        fontSize: 15,
        color: '#92400e',
        marginTop: 10,
        marginBottom: 8,
        fontWeight: '700',
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
    defaultStatus: {
        backgroundColor: '#e5e7eb',
        color: '#041226',
    },
    unplannedButton: {
        backgroundColor: '#dc2626',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    availableButton: {
        backgroundColor: '#16a34a',
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
        color: '#D8B84A',
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
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: 18,
        padding: 20,
    },
    replacementModalBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderRadius: 18,
        padding: 20,
        maxHeight: '85%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#041226',
        marginBottom: 18,
    },
    selectedDateBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    selectedDateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#041226',
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
        color: '#D8B84A',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    leaveInfoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D8B84A',
        padding: 14,
        marginBottom: 16,
    },
    leaveInfoTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#041226',
        marginBottom: 6,
    },
    leaveInfoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#041226',
        marginBottom: 4,
    },
    replacementTabRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    replacementTab: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D8B84A',
    },
    activeReplacementTab: {
        backgroundColor: '#041226',
    },
    replacementTabText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#041226',
        textAlign: 'center',
    },
    activeReplacementTabText: {
        color: '#D8B84A',
    },
    replacementList: {
        maxHeight: 260,
    },
    groupedReplacementCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderWidth: 1,
        borderColor: '#D8B84A',
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
        color: '#041226',
        marginBottom: 6,
        textAlign: 'center',
    },
    groupedReplacementType: {
        fontSize: 14,
        fontWeight: '700',
        color: '#5D6675',
        textAlign: 'center',
    },
    groupedReplacementDetails: {
        fontSize: 13,
        fontWeight: '600',
        color: '#041226',
        textAlign: 'center',
        marginTop: 4,
    },
    noReplacementSelectButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderWidth: 1,
        borderColor: '#D8B84A',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    noReplacementSelectText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#041226',
        textAlign: 'center',
    },
    noReplacementBox: {
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D8B84A',
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

    dateGroupHeader: {
        backgroundColor: '#041226',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        marginTop: 8,
    },
    dateGroupTitle: {
        color: '#D8B84A',
        fontSize: 20,
        fontWeight: 'bold',
    },
    dateGroupSubtitle: {
        color: '#D8B84A',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
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
    autoAssignButton: {
        backgroundColor: '#B8860B',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 3,
    },
    autoAssignButtonText: {
        color: '#D8B84A',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    bulkAssignButton: {
        backgroundColor: '#041226',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 18,
    },
    bulkAssignButtonText: {
        color: '#D8B84A',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    bulkPopupText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#041226',
        textAlign: 'center',
        marginBottom: 10,
    },
    bulkPopupCount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#041226',
        textAlign: 'center',
        marginBottom: 12,
    },
});