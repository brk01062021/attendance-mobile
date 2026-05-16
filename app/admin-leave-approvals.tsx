import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { images } from '../src/constants/images';
import { approveTeacherLeave, getPendingLeaveApprovals } from '../src/services/day4AutomationApi';

type PendingLeave = {
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
};

const today = () => new Date().toISOString().split('T')[0];
const plusDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
};

export default function AdminLeaveApprovalsScreen() {
    const [items, setItems] = useState<PendingLeave[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getPendingLeaveApprovals(today(), plusDays(30));
            setItems(data || []);
        } catch (error) {
            Alert.alert('Unable to load', 'Please confirm backend is running and Day 4 APIs are available.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const approveWithoutReplacement = async (scheduleId: number) => {
        try {
            await approveTeacherLeave(scheduleId, null, null);
            Alert.alert('Updated', 'Leave approval has been updated.');
            loadData();
        } catch (error) {
            Alert.alert('Approval failed', 'Please try again.');
        }
    };

    return (
        <ImageBackground source={images.splashGold} style={styles.background} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Admin Leave Approvals</Text>
                <Text style={styles.subtitle}>Review planned and emergency leaves for the next 30 days.</Text>

                {loading ? <ActivityIndicator size="large" /> : null}

                {!loading && items.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No pending approvals</Text>
                        <Text style={styles.emptyText}>Teacher leave planning is clear for the selected window.</Text>
                    </View>
                ) : null}

                {items.map((item) => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.teacher}>{item.teacherName}</Text>
                            <Text style={[styles.badge, item.status === 'UNPLANNED_LEAVE' ? styles.danger : styles.warning]}>{item.status}</Text>
                        </View>
                        <Text style={styles.meta}>{item.scheduleDate} • {item.startTime} - {item.endTime}</Text>
                        <Text style={styles.meta}>Class {item.className}-{item.section} • {item.subjectName}</Text>
                        <TouchableOpacity style={styles.actionButton} onPress={() => approveWithoutReplacement(item.id)}>
                            <Text style={styles.actionText}>Approve / Keep for Manual Replacement</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: { padding: 20, paddingTop: 54, paddingBottom: 44 },
    backButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, marginBottom: 14 },
    backText: { color: '#3b2a05', fontWeight: '800' },
    title: { fontSize: 28, fontWeight: '900', color: '#2f2106' },
    subtitle: { color: '#5b4515', marginTop: 6, marginBottom: 18, fontSize: 14 },
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
    actionButton: { marginTop: 14, backgroundColor: '#2f2106', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
    actionText: { color: '#fff7d6', fontWeight: '900' },
});
