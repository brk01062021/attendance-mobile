import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { images } from '../src/constants/images';
import { approveTeacherLeaveEnquiry, getPendingLeaveEnquiries, rejectTeacherLeaveEnquiry } from '../src/services/day4AutomationApi';

type PendingLeaveEnquiry = {
    id: number;
    teacherId: number;
    teacherName: string;
    fromDate: string;
    toDate: string;
    leaveType: string;
    reason?: string;
    status: string;
    requestedAt?: string;
};

const today = () => new Date().toISOString().split('T')[0];
const plusDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export default function AdminLeaveApprovalsScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || params.role || '').toLowerCase();
    const backPath = useMemo(() => sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard', [sourceRole]);
    const [items, setItems] = useState<PendingLeaveEnquiry[]>([]);
    const [loading, setLoading] = useState(false);
    const [savingId, setSavingId] = useState<number | null>(null);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getPendingLeaveEnquiries(today(), plusDays(30));
            setItems(data || []);
        } catch (error) {
            Alert.alert('Unable to load', 'Please confirm backend is running and Day 29 leave enquiry APIs are available.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const approve = async (enquiryId: number) => {
        try {
            setSavingId(enquiryId);
            await approveTeacherLeaveEnquiry(enquiryId, 'Approved from Leave Approvals');
            Alert.alert('Approved', 'Leave enquiry approved. Replacement workflow can now start.');
            loadData();
        } catch (error) {
            Alert.alert('Approval failed', 'Please try again.');
        } finally {
            setSavingId(null);
        }
    };

    const reject = async (enquiryId: number) => {
        try {
            setSavingId(enquiryId);
            await rejectTeacherLeaveEnquiry(enquiryId, 'Rejected from Leave Approvals');
            Alert.alert('Rejected', 'Leave enquiry rejected.');
            loadData();
        } catch (error) {
            Alert.alert('Reject failed', 'Please try again.');
        } finally {
            setSavingId(null);
        }
    };

    return (
        <ImageBackground source={images.splashGold} style={styles.background} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace(backPath as any)}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.eyebrow}>Admin / Principal Workflow</Text>
                <Text style={styles.title}>Leave Approvals</Text>
                <Text style={styles.subtitle}>Approve or reject teacher leave enquiries. Approved enquiries mark the teacher schedule as leave and then replacement planning can start.</Text>

                {loading ? <ActivityIndicator size="large" /> : null}

                {!loading && items.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No pending leave enquiries</Text>
                        <Text style={styles.emptyText}>Teachers have not submitted new leave enquiries for the selected window.</Text>
                    </View>
                ) : null}

                {items.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.teacher}>{item.teacherName || `Teacher #${item.teacherId}`}</Text>
                            <Text style={[styles.badge, item.leaveType === 'UNPLANNED_LEAVE' ? styles.danger : styles.warning]}>{item.leaveType || 'PLANNED_LEAVE'}</Text>
                        </View>
                        <Text style={styles.meta}>{item.fromDate} → {item.toDate}</Text>
                        <Text style={styles.meta}>Reason: {item.reason || 'Not provided'}</Text>
                        <Text style={styles.status}>Status: {item.status}</Text>
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={() => approve(item.id)} disabled={savingId === item.id}>
                                <Text style={styles.actionText}>{savingId === item.id ? 'Updating...' : 'Approve'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={() => reject(item.id)} disabled={savingId === item.id}>
                                <Text style={styles.rejectText}>Reject</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: { padding: 20, paddingTop: 72, paddingBottom: 44 },
    backButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, marginBottom: 14 },
    backText: { color: '#3b2a05', fontWeight: '800' },
    eyebrow: { color: '#7a5200', fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    title: { fontSize: 28, fontWeight: '900', color: '#2f2106', marginTop: 6 },
    subtitle: { color: '#5b4515', marginTop: 6, marginBottom: 18, fontSize: 14, lineHeight: 20, fontWeight: '700' },
    card: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(116,83,15,0.18)' },
    emptyCard: { backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 24, padding: 22 },
    emptyTitle: { fontWeight: '900', fontSize: 18, color: '#2f2106' },
    emptyText: { color: '#6b551f', marginTop: 8 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
    teacher: { fontSize: 18, fontWeight: '900', color: '#2f2106', flex: 1 },
    badge: { overflow: 'hidden', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
    warning: { backgroundColor: '#fff4cf', color: '#7a5200' },
    danger: { backgroundColor: '#ffe0de', color: '#9a241c' },
    meta: { color: '#5b4515', marginTop: 8, fontWeight: '700' },
    status: { color: '#2f2106', marginTop: 8, fontWeight: '900' },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    actionButton: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
    approveButton: { backgroundColor: '#2f2106' },
    rejectButton: { backgroundColor: '#fff8df', borderWidth: 1, borderColor: 'rgba(122,82,0,0.3)' },
    actionText: { color: '#fff7d6', fontWeight: '900' },
    rejectText: { color: '#7a1d16', fontWeight: '900' },
});
