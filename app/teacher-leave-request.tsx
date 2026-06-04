import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { images } from '../src/constants/images';
import { getTeacherLeaveEnquiryHistory, submitTeacherLeaveEnquiry } from '../src/services/day4AutomationApi';
import { getSession } from '../src/services/sessionService';

const today = () => new Date().toISOString().split('T')[0];

type LeaveType = 'PLANNED_LEAVE' | 'UNPLANNED_LEAVE';
type LeaveHistoryItem = {
    id: number;
    teacherId: number;
    teacherName?: string;
    fromDate: string;
    toDate: string;
    leaveType: string;
    reason?: string;
    status: string;
    adminRemarks?: string;
    requestedAt?: string;
    decidedAt?: string;
};

const prettyDate = (value?: string) => {
    if (!value) return 'Pending';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).replace('T', ' ').slice(0, 16);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const statusStyle = (status: string) => {
    const value = status?.toUpperCase();
    if (value === 'APPROVED') return [styles.statusPill, styles.approvedPill];
    if (value === 'REJECTED') return [styles.statusPill, styles.rejectedPill];
    return [styles.statusPill, styles.pendingPill];
};

export default function TeacherLeaveRequestScreen() {
    const params = useLocalSearchParams();
    const session = getSession();
    const teacherId = Number(params.teacherId || session?.teacherId || params.userId || session?.userId || 0);
    const rawTeacherName = String(params.teacherName || session?.displayName || params.name || 'Teacher');
    const teacherName = /admin/i.test(rawTeacherName) ? 'Teacher' : rawTeacherName;

    const [fromDate, setFromDate] = useState(today());
    const [toDate, setToDate] = useState(today());
    const [leaveType, setLeaveType] = useState<LeaveType>('PLANNED_LEAVE');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState<LeaveHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const markedDates = useMemo(() => ({
        [fromDate]: { selected: true, selectedColor: '#7a5200' },
        ...(toDate !== fromDate ? { [toDate]: { selected: true, selectedColor: '#3b2a05' } } : {}),
    }), [fromDate, toDate]);

    const loadHistory = async (refreshOnly = false) => {
        if (!teacherId) return;
        try {
            refreshOnly ? setRefreshing(true) : setHistoryLoading(true);
            const data = await getTeacherLeaveEnquiryHistory(teacherId);
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.log('Teacher leave history load failed', error);
        } finally {
            setHistoryLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, [teacherId]);

    const onDayPress = (day: { dateString: string }) => {
        if (!fromDate || (fromDate && toDate && fromDate !== toDate)) {
            setFromDate(day.dateString);
            setToDate(day.dateString);
            return;
        }

        if (day.dateString < fromDate) {
            setToDate(fromDate);
            setFromDate(day.dateString);
        } else {
            setToDate(day.dateString);
        }
    };

    const submit = async () => {
        if (!teacherId) {
            Alert.alert('Teacher profile missing', 'Please login again as teacher.');
            return;
        }
        if (!reason.trim()) {
            Alert.alert('Reason required', 'Please enter a short reason before requesting leave enquiry.');
            return;
        }

        try {
            setSubmitting(true);
            await submitTeacherLeaveEnquiry({
                teacherId,
                teacherName,
                fromDate,
                toDate,
                leaveType,
                reason: reason.trim(),
            });
            setReason('');
            await loadHistory(true);
            Alert.alert('Leave enquiry requested', 'Your leave enquiry was sent to Admin and Principal. Track the status in My Leave Enquiry History below.');
        } catch (error) {
            Alert.alert('Request failed', 'Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ImageBackground source={images.splashGold} style={styles.background} resizeMode="cover">
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} />}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace({ pathname: '/teacher-dashboard', params: { teacherId, teacherName, role: 'TEACHER' } } as any)}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.eyebrow}>Teacher Leave</Text>
                <Text style={styles.title}>Request Leave / Leave Enquiry</Text>
                <Text style={styles.subtitle}>Submit a leave enquiry only. Admin or Principal will approve/reject it and replacement planning starts after approval.</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Teacher</Text>
                    <Text style={styles.teacherName}>{teacherName}</Text>

                    <Text style={styles.label}>Leave Type</Text>
                    <View style={styles.typeRow}>
                        <TypePill title="Planned" active={leaveType === 'PLANNED_LEAVE'} onPress={() => setLeaveType('PLANNED_LEAVE')} />
                        <TypePill title="Emergency" active={leaveType === 'UNPLANNED_LEAVE'} onPress={() => setLeaveType('UNPLANNED_LEAVE')} />
                    </View>

                    <Text style={styles.label}>Select From / To Date</Text>
                    <Calendar markedDates={markedDates} onDayPress={onDayPress} />

                    <View style={styles.dateSummary}>
                        <Text style={styles.dateText}>From: {fromDate}</Text>
                        <Text style={styles.dateText}>To: {toDate}</Text>
                    </View>

                    <Text style={styles.label}>Reason</Text>
                    <TextInput
                        style={styles.input}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Enter reason for leave enquiry"
                        placeholderTextColor="#8b7442"
                        multiline
                    />

                    <TouchableOpacity style={[styles.submitButton, submitting && styles.disabledButton]} onPress={submit} disabled={submitting} activeOpacity={0.9}>
                        {submitting ? <ActivityIndicator color="#fff7d6" /> : <Text style={styles.submitText}>Request Leave Enquiry</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.historyHeaderRow}>
                    <View>
                        <Text style={styles.historyEyebrow}>Status Tracking</Text>
                        <Text style={styles.historyTitle}>My Leave Enquiry History</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshPill} onPress={() => loadHistory(true)} disabled={historyLoading}>
                        <Text style={styles.refreshText}>{historyLoading ? 'Loading...' : 'Refresh'}</Text>
                    </TouchableOpacity>
                </View>

                {history.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No leave enquiries yet</Text>
                        <Text style={styles.emptyText}>After you submit a request, Pending / Approved / Rejected status and Admin/Principal remarks will appear here.</Text>
                    </View>
                ) : history.map((item) => (
                    <View key={item.id} style={styles.historyCard}>
                        <View style={styles.historyTopRow}>
                            <View style={styles.historyTitleBlock}>
                                <Text style={styles.historyCardTitle}>{(item.leaveType || 'LEAVE').replace(/_/g, ' ')}</Text>
                                <Text style={styles.historyMeta}>{item.fromDate} → {item.toDate}</Text>
                            </View>
                            <Text style={statusStyle(item.status)}>{item.status || 'PENDING'}</Text>
                        </View>
                        <Text style={styles.historyMeta}>Reason: {item.reason || 'Not provided'}</Text>
                        <View style={styles.timelineBox}>
                            <Text style={styles.timelineText}>• Requested: {prettyDate(item.requestedAt)}</Text>
                            <Text style={styles.timelineText}>• Decision: {prettyDate(item.decidedAt)}</Text>
                        </View>
                        <View style={styles.remarksBox}>
                            <Text style={styles.remarksLabel}>Admin/Principal Remarks</Text>
                            <Text style={styles.remarksText}>{item.adminRemarks || (item.status === 'PENDING' ? 'Waiting for approval decision.' : 'No remarks provided.')}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </ImageBackground>
    );
}

function TypePill({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.typePill, active && styles.activeTypePill]}>
            <Text style={[styles.typeText, active && styles.activeTypeText]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: { padding: 20, paddingTop: 72, paddingBottom: 44 },
    backButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.82)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, marginBottom: 16 },
    backText: { color: '#3b2a05', fontWeight: '900' },
    eyebrow: { color: '#7a5200', fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    title: { fontSize: 28, fontWeight: '900', color: '#2f2106', marginTop: 6 },
    subtitle: { color: '#5b4515', marginTop: 8, marginBottom: 18, lineHeight: 20, fontWeight: '700' },
    card: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(116,83,15,0.2)' },
    label: { color: '#6b551f', fontWeight: '900', marginTop: 14, marginBottom: 8 },
    teacherName: { color: '#2f2106', fontSize: 18, fontWeight: '900' },
    typeRow: { flexDirection: 'row', gap: 10 },
    typePill: { flex: 1, borderWidth: 1, borderColor: 'rgba(122,82,0,0.25)', borderRadius: 16, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff8df' },
    activeTypePill: { backgroundColor: '#3b2a05' },
    typeText: { color: '#6b551f', fontWeight: '900' },
    activeTypeText: { color: '#fff7d6' },
    dateSummary: { marginTop: 12, backgroundColor: '#fff8df', borderRadius: 16, padding: 12, gap: 4 },
    dateText: { color: '#3b2a05', fontWeight: '900' },
    input: { minHeight: 92, textAlignVertical: 'top', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(122,82,0,0.25)', padding: 12, color: '#2f2106', fontWeight: '700', backgroundColor: '#fffdf5' },
    submitButton: { marginTop: 18, backgroundColor: '#2f2106', borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
    disabledButton: { opacity: 0.7 },
    submitText: { color: '#fff7d6', fontWeight: '900', fontSize: 16 },
    historyHeaderRow: { marginTop: 22, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    historyEyebrow: { color: '#7a5200', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 12 },
    historyTitle: { color: '#2f2106', fontSize: 21, fontWeight: '900', marginTop: 3 },
    refreshPill: { backgroundColor: '#2f2106', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
    refreshText: { color: '#fff7d6', fontWeight: '900' },
    emptyCard: { backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: 'rgba(116,83,15,0.18)' },
    emptyTitle: { color: '#2f2106', fontWeight: '900', fontSize: 17 },
    emptyText: { color: '#6b551f', fontWeight: '700', marginTop: 6, lineHeight: 19 },
    historyCard: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 22, padding: 16, marginBottom: 13, borderWidth: 1, borderColor: 'rgba(116,83,15,0.18)' },
    historyTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
    historyTitleBlock: { flex: 1 },
    historyCardTitle: { color: '#2f2106', fontWeight: '900', fontSize: 16 },
    historyMeta: { color: '#5b4515', fontWeight: '700', marginTop: 7 },
    statusPill: { overflow: 'hidden', borderRadius: 15, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
    approvedPill: { backgroundColor: '#dff8e6', color: '#116534' },
    rejectedPill: { backgroundColor: '#ffe0de', color: '#9a241c' },
    pendingPill: { backgroundColor: '#fff4cf', color: '#7a5200' },
    timelineBox: { marginTop: 12, backgroundColor: '#fff8df', borderRadius: 16, padding: 12, gap: 5 },
    timelineText: { color: '#3b2a05', fontWeight: '800' },
    remarksBox: { marginTop: 12, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(122,82,0,0.18)', backgroundColor: '#fffdf5' },
    remarksLabel: { color: '#6b551f', fontWeight: '900', marginBottom: 4 },
    remarksText: { color: '#2f2106', fontWeight: '700', lineHeight: 19 },
});
