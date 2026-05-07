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
import { router, useLocalSearchParams } from 'expo-router';
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
    const { teacherId, teacherName, role } = useLocalSearchParams();

    const numericTeacherId = Number(teacherId || 0);
    const displayTeacherName = String(teacherName || 'Teacher');
    const today = formatLocalDate(new Date());

    const [activeTab, setActiveTab] = useState<ReplacementTab>('TODAY');
    const [replacements, setReplacements] = useState<TeacherSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<TeacherSchedule | null>(null);

    useEffect(() => {
        loadReplacements();
    }, [teacherId]);

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
                `${API_ENDPOINTS.teacherSchedules}/replacements?teacherId=${numericTeacherId}&fromDate=${fromDate}&toDate=${toDate}`,
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
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={goBackToDashboard} activeOpacity={0.85}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Teacher Replacements</Text>

                    <TouchableOpacity style={styles.refreshButton} onPress={() => loadReplacements(true)} activeOpacity={0.85}>
                        <Text style={styles.refreshButtonText}>↻</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadReplacements(true)} />
                    }
                >
                    <View style={styles.heroCard}>
                        <Text style={styles.heroLabel}>Assigned replacement classes</Text>
                        <Text style={styles.heroName}>{displayTeacherName}</Text>
                        <Text style={styles.heroText}>
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
        backgroundColor: 'rgba(255, 248, 225, 0.55)',
    },
    headerRow: {
        paddingTop: 58,
        paddingHorizontal: 18,
        paddingBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFF8E1',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D6A94A',
    },
    backButtonText: {
        fontSize: 34,
        color: '#6B3F00',
        marginTop: -4,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 21,
        fontWeight: '900',
        color: '#3D2500',
    },
    refreshButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFF8E1',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D6A94A',
    },
    refreshButtonText: {
        fontSize: 23,
        fontWeight: '900',
        color: '#6B3F00',
    },
    container: {
        padding: 18,
        paddingBottom: 36,
    },
    heroCard: {
        backgroundColor: 'rgba(61, 37, 0, 0.92)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2B857',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 6,
    },
    heroLabel: {
        color: '#F6D37A',
        fontSize: 12,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    heroName: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '900',
        marginTop: 6,
    },
    heroText: {
        color: '#F8E8BC',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFDF4',
        borderRadius: 18,
        paddingVertical: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    summaryValue: {
        color: '#4B2E00',
        fontSize: 23,
        fontWeight: '900',
    },
    summaryLabel: {
        color: '#7B5A14',
        fontSize: 12,
        fontWeight: '800',
        marginTop: 3,
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 253, 244, 0.9)',
        borderRadius: 18,
        padding: 5,
        marginTop: 16,
        borderWidth: 1,
        borderColor: '#E3C36F',
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
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    emptyIcon: {
        fontSize: 34,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#3D2500',
        marginTop: 8,
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
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 12,
        elevation: 4,
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
