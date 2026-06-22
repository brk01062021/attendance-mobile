import { API_ENDPOINTS } from '@/src/services/api';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { images } from '../src/constants/images';
import { getSession, normalizeSchoolId } from '../src/services/sessionService';

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

type ReplacementTab = 'TODAY' | 'UPCOMING' | 'HISTORY';

const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
};

const getDateLabel = (dateValue: string) => {
    const today = formatLocalDate(new Date());
    const tomorrow = formatLocalDate(addDays(new Date(), 1));
    const yesterday = formatLocalDate(addDays(new Date(), -1));

    if (dateValue === today) return 'Today';
    if (dateValue === tomorrow) return 'Tomorrow';
    if (dateValue === yesterday) return 'Yesterday';

    const parsed = new Date(`${dateValue}T00:00:00`);
    return parsed.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
};

const formatTime = (timeValue: string) => {
    if (!timeValue) return '';

    const [hourPart, minutePart] = timeValue.split(':');
    const hour = Number(hourPart);
    const minute = Number(minutePart || '0');

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
        return timeValue;
    }

    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
};

const getRangeText = (item: TeacherSchedule) => {
    return `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`;
};

export default function TeacherReplacementsScreen() {
    const { teacherId, teacherName, role, schoolId, tab } = useLocalSearchParams();
    const session = getSession();

    const numericTeacherId = Number(teacherId || session?.teacherId || session?.userId || 0);
    const rawTeacherName = String(teacherName || session?.displayName || 'Teacher');
    const displayTeacherName = /admin/i.test(rawTeacherName) ? 'Teacher' : rawTeacherName;
    const safeSchoolId = normalizeSchoolId(String(schoolId || session?.schoolId || ''));
    const today = formatLocalDate(new Date());

    const initialTab = String(tab || 'TODAY').toUpperCase() as ReplacementTab;
    const [activeTab, setActiveTab] = useState<ReplacementTab>(['TODAY', 'UPCOMING', 'HISTORY'].includes(initialTab) ? initialTab : 'TODAY');
    const [replacements, setReplacements] = useState<TeacherSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);

    useEffect(() => {
        loadReplacements();
    }, [numericTeacherId, safeSchoolId]);

    const loadReplacements = async (refreshOnly = false) => {
        if (!numericTeacherId) {
            Alert.alert('Missing Teacher', 'Teacher details are missing. Please login again.');
            return;
        }

        try {
            if (refreshOnly) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const fromDate = formatLocalDate(addDays(new Date(), -45));
            const toDate = formatLocalDate(addDays(new Date(), 90));

            const response = await fetch(
                `${API_ENDPOINTS.teacherSchedules}/replacements?teacherId=${numericTeacherId}&fromDate=${fromDate}&toDate=${toDate}&schoolId=${safeSchoolId}`,
                { headers: { 'X-School-Id': safeSchoolId } }
            );

            if (!response.ok) {
                throw new Error('Unable to load replacement schedules');
            }

            const data = await response.json();
            setReplacements(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log('loadReplacements error:', error);
            Alert.alert('Error', 'Unable to load teacher replacements');
            setReplacements([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const todayItems = useMemo(() => {
        return replacements.filter((item) => item.scheduleDate === today);
    }, [replacements, today]);

    const upcomingItems = useMemo(() => {
        return replacements.filter((item) => item.scheduleDate > today);
    }, [replacements, today]);

    const historyItems = useMemo(() => {
        return [...replacements]
            .filter((item) => item.scheduleDate < today)
            .sort((a, b) => {
                const dateCompare = b.scheduleDate.localeCompare(a.scheduleDate);
                if (dateCompare !== 0) return dateCompare;
                return b.startTime.localeCompare(a.startTime);
            });
    }, [replacements, today]);

    const visibleItems = useMemo(() => {
        if (activeTab === 'TODAY') return todayItems;
        if (activeTab === 'UPCOMING') return upcomingItems;
        return historyItems;
    }, [activeTab, todayItems, upcomingItems, historyItems]);

    const goBackToDashboard = () => {
        router.replace({
            pathname: '/teacher-dashboard',
            params: {
                teacherId,
                teacherName,
                role: role || 'TEACHER',
            },
        } as any);
    };

    return (
        <ImageBackground source={images.splashGold} style={styles.screen} resizeMode="cover">
            <View style={styles.overlay}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadReplacements(true)} />
                    }
                >
                    <MobileWorkflowHeader
                        title="Assigned Replacements"
                        eyebrow="Replacement Classes"
                        subtitle={`Welcome, ${displayTeacherName}`}
                        sourceRole="teacher"
                        onBackPress={goBackToDashboard}
                    />

                    <View style={styles.mainCard}>
                        <View style={styles.cardHeaderBlock}>
                            <Text style={styles.sectionTitle}>Assigned Replacement Classes</Text>
                            <Text style={styles.sectionSubtitle}>
                                View classes assigned to you when another teacher is on leave.
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <SummaryCard label="Today" value={todayItems.length} />
                            <SummaryCard label="Upcoming" value={upcomingItems.length} />
                            <SummaryCard label="Completed" value={historyItems.length} />
                        </View>

                        <View style={styles.tabRow}>
                            <TabButton title="Today" active={activeTab === 'TODAY'} onPress={() => setActiveTab('TODAY')} />
                            <TabButton title="Upcoming" active={activeTab === 'UPCOMING'} onPress={() => setActiveTab('UPCOMING')} />
                            <TabButton title="History" active={activeTab === 'HISTORY'} onPress={() => setActiveTab('HISTORY')} />
                        </View>

                        {loading ? (
                            <View style={styles.loadingCard}>
                                <ActivityIndicator size="large" />
                                <Text style={styles.loadingText}>Loading replacements...</Text>
                            </View>
                        ) : visibleItems.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>🧑‍🏫</Text>
                                <Text style={styles.emptyTitle}>No replacements found</Text>
                                <Text style={styles.emptyText}>
                                    {activeTab === 'TODAY'
                                        ? 'No replacement classes assigned for today.'
                                        : activeTab === 'UPCOMING'
                                            ? 'No upcoming replacement classes assigned.'
                                            : 'No completed replacement history found.'}
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.listSection}>
                                {visibleItems.map((item) => (
                                    <ReplacementCard
                                        key={item.id}
                                        item={item}
                                        currentTab={activeTab}
                                        onPress={() => setSelectedSchedule(item)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>

                <Modal visible={selectedSchedule !== null} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.detailsCard}>
                            <Text style={styles.detailsTitle}>Replacement Details</Text>

                            {selectedSchedule && (
                                <>
                                    <DetailRow label="Date" value={getDateLabel(selectedSchedule.scheduleDate)} />
                                    <DetailRow label="Time" value={getRangeText(selectedSchedule)} />
                                    <DetailRow label="Class" value={`Class ${selectedSchedule.className} - ${selectedSchedule.section}`} />
                                    <DetailRow label="Subject" value={selectedSchedule.subjectName} />
                                    <DetailRow label="Replacing" value={selectedSchedule.teacherName} />
                                    <DetailRow label="Leave Type" value={selectedSchedule.status.replace(/_/g, ' ')} />
                                    <DetailRow
                                        label="Status"
                                        value={selectedSchedule.scheduleDate < today ? 'Completed' : 'Assigned'}
                                    />
                                </>
                            )}

                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setSelectedSchedule(null)}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.closeButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </ImageBackground>
    );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </View>
    );
}

function TabButton({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity style={[styles.tabButton, active && styles.activeTabButton]} onPress={onPress} activeOpacity={0.85}>
            <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
        </TouchableOpacity>
    );
}

function ReplacementCard({
                             item,
                             currentTab,
                             onPress,
                         }: {
    item: TeacherSchedule;
    currentTab: ReplacementTab;
    onPress: () => void;
}) {
    const isCompleted = currentTab === 'HISTORY';

    return (
        <TouchableOpacity style={styles.replacementCard} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.cardTopRow}>
                <View>
                    <Text style={styles.dateLabel}>{getDateLabel(item.scheduleDate)}</Text>
                    <Text style={styles.timeText}>{getRangeText(item)}</Text>
                </View>

                <View style={[styles.statusChip, isCompleted ? styles.completedChip : styles.assignedChip]}>
                    <Text style={[styles.statusChipText, isCompleted ? styles.completedChipText : styles.assignedChipText]}>
                        {isCompleted ? 'Completed' : 'Assigned'}
                    </Text>
                </View>
            </View>

            <View style={styles.subjectRow}>
                <View style={styles.subjectIconBox}>
                    <Text style={styles.subjectIcon}>📚</Text>
                </View>

                <View style={styles.subjectInfo}>
                    <Text style={styles.subjectText}>{item.subjectName}</Text>
                    <Text style={styles.classText}>Class {item.className} - {item.section}</Text>
                </View>
            </View>

            <View style={styles.replacingBox}>
                <Text style={styles.replacingLabel}>{isCompleted ? 'Replaced' : 'Replacing'}</Text>
                <Text style={styles.replacingName}>{item.teacherName}</Text>
            </View>
        </TouchableOpacity>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
    },
    topBar: {
        paddingTop: 72,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    circleButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(214, 169, 74, 0.7)',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        elevation: 4,
    },
    backButtonText: {
        fontSize: 28,
        color: '#09213F',
        fontWeight: '900',
        marginTop: -6,
    },
    refreshButtonText: {
        fontSize: 29,
        fontWeight: '900',
        color: '#09213F',
        marginTop: -2,
    },
    container: {
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 36,
    },
    titleBlock: {
        marginBottom: 22,
    },
    workspaceTitle: {
        color: '#09213F',
        fontSize: 21,
        fontWeight: '900',
        marginBottom: 4,
    },
    pageTitle: {
        color: '#071B35',
        fontSize: 42,
        fontWeight: '900',
        lineHeight: 48,
        letterSpacing: -1.1,
    },
    welcomeText: {
        color: '#0C2442',
        fontSize: 17,
        fontWeight: '900',
        marginTop: 18,
    },
    mainCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
        borderRadius: 26,
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 22,
        borderWidth: 1,
        borderColor: 'rgba(230, 202, 129, 0.75)',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
        elevation: 8,
    },
    cardHeaderBlock: {
        marginBottom: 18,
    },
    sectionTitle: {
        color: '#071B35',
        fontSize: 24,
        fontWeight: '900',
        lineHeight: 30,
    },
    sectionSubtitle: {
        color: '#6B7280',
        fontSize: 15,
        fontWeight: '800',
        lineHeight: 22,
        marginTop: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 9,
        marginTop: 4,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFDF4',
        borderRadius: 17,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8D28B',
    },
    summaryValue: {
        color: '#4B2E00',
        fontSize: 23,
        fontWeight: '900',
    },
    summaryLabel: {
        color: '#7B5A14',
        fontSize: 11,
        fontWeight: '900',
        marginTop: 3,
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: '#FFFDF4',
        borderRadius: 18,
        padding: 5,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#E8D28B',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 11,
        alignItems: 'center',
        borderRadius: 14,
    },
    activeTabButton: {
        backgroundColor: '#4B2E00',
    },
    tabText: {
        color: '#6F520F',
        fontWeight: '900',
        fontSize: 13,
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    loadingCard: {
        marginTop: 18,
        backgroundColor: '#FFFDF4',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    loadingText: {
        marginTop: 10,
        color: '#604400',
        fontWeight: '800',
    },
    emptyCard: {
        marginTop: 18,
        backgroundColor: '#FFFDF4',
        borderRadius: 22,
        paddingVertical: 30,
        paddingHorizontal: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    emptyIcon: {
        fontSize: 34,
    },
    emptyTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: '#3D2500',
        marginTop: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#755711',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 6,
    },
    listSection: {
        marginTop: 18,
        gap: 13,
    },
    replacementCard: {
        backgroundColor: '#FFFDF4',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DFC069',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        elevation: 3,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    dateLabel: {
        color: '#9A6A00',
        fontSize: 13,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    timeText: {
        color: '#3D2500',
        fontSize: 18,
        fontWeight: '900',
        marginTop: 3,
    },
    statusChip: {
        paddingHorizontal: 11,
        paddingVertical: 6,
        borderRadius: 999,
    },
    assignedChip: {
        backgroundColor: '#E9F8EC',
        borderWidth: 1,
        borderColor: '#6DBA79',
    },
    completedChip: {
        backgroundColor: '#EEF1F5',
        borderWidth: 1,
        borderColor: '#9CA3AF',
    },
    statusChipText: {
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    assignedChipText: {
        color: '#166534',
    },
    completedChipText: {
        color: '#374151',
    },
    subjectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
    },
    subjectIconBox: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: '#F7E7B0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    subjectIcon: {
        fontSize: 21,
    },
    subjectInfo: {
        flex: 1,
    },
    subjectText: {
        color: '#3D2500',
        fontSize: 17,
        fontWeight: '900',
    },
    classText: {
        color: '#73520A',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    replacingBox: {
        marginTop: 14,
        padding: 12,
        borderRadius: 16,
        backgroundColor: '#FFF4CE',
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    replacingLabel: {
        color: '#9A6A00',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    replacingName: {
        color: '#3D2500',
        fontSize: 15,
        fontWeight: '900',
        marginTop: 3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.48)',
        justifyContent: 'center',
        padding: 22,
    },
    detailsCard: {
        backgroundColor: '#FFFDF4',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    detailsTitle: {
        color: '#3D2500',
        fontSize: 21,
        fontWeight: '900',
        marginBottom: 14,
        textAlign: 'center',
    },
    detailRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1E0AA',
    },
    detailLabel: {
        color: '#9A6A00',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    detailValue: {
        color: '#3D2500',
        fontSize: 16,
        fontWeight: '800',
        marginTop: 3,
    },
    closeButton: {
        marginTop: 18,
        backgroundColor: '#3D2500',
        borderRadius: 17,
        paddingVertical: 14,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
});
