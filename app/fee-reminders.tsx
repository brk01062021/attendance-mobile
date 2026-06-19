import { API_ENDPOINTS, api } from '@/src/services/api';
import { getSession, normalizeSchoolId } from '@/src/services/sessionService';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';

const background = require('../assets/branding/splash-gold.png');

type FeeReminderHistory = {
    id: number;
    uploadId: number;
    studentId?: string;
    studentName?: string;
    className?: string;
    section?: string;
    parentName?: string;
    pendingAmount?: number;
    dueDate?: string;
    remarks?: string;
    status: string;
    channel: string;
    sentAt?: string;
};

const formatAmount = (value?: number) => {
    if (typeof value !== 'number') return 'Amount not available';
    return `₹${value.toLocaleString('en-IN')}`;
};

const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function FeeRemindersScreen() {
    const params = useLocalSearchParams();
    const session = getSession();
    const schoolId = normalizeSchoolId(String(params.schoolId || session?.schoolId || 'TST2'));
    const parentUserId = Number(params.parentUserId || params.userId || session?.userId || 101);
    const role = String(params.role || session?.role || 'PARENT').toUpperCase();
    const isAdminOrPrincipal = role === 'ADMIN' || role === 'PRINCIPAL';
    const homeRoute = role === 'ADMIN' ? '/admin-dashboard' : role === 'PRINCIPAL' ? '/principal-home' : '/parent-dashboard';
    const [items, setItems] = useState<FeeReminderHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setError('');
        try {
            if (isAdminOrPrincipal) {
                setItems([]);
                return;
            }
            const response = await api.get(API_ENDPOINTS.feeReminderParentHistory, { params: { schoolId, parentUserId } });
            setItems(Array.isArray(response.data) ? response.data : []);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Unable to load fee reminders.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isAdminOrPrincipal, parentUserId, schoolId]);

    useEffect(() => { load(); }, [load]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load();
    }, [load]);

    return (
        <ImageBackground source={background} style={styles.background} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <MobileWorkflowHeader title="Fee Reminders" eyebrow={role} subtitle={isAdminOrPrincipal ? `${schoolId} • Web-first finance workflow` : `${schoolId} • Parent notification center`} onBackPress={() => router.back()} onHomePress={() => router.replace(homeRoute as any)} />

                {isAdminOrPrincipal ? (
                    <View style={styles.card}>
                        <Text style={styles.icon}>💻</Text>
                        <Text style={styles.title}>Fee Reminder Upload is Web-first</Text>
                        <Text style={styles.body}>Use the ERP Portal Fee Reminder menu to upload pending fee Excel files, validate rows, check parent mapping and send reminders.</Text>
                    </View>
                ) : loading ? (
                    <View style={styles.card}><ActivityIndicator /><Text style={styles.body}>Loading fee reminders...</Text></View>
                ) : error ? (
                    <View style={styles.card}><Text style={styles.error}>{error}</Text></View>
                ) : items.length === 0 ? (
                    <View style={styles.card}><Text style={styles.icon}>💰</Text><Text style={styles.title}>No fee reminders</Text><Text style={styles.body}>Fee reminders sent by school finance team will appear here.</Text></View>
                ) : (
                    items.map((item) => <View key={item.id} style={styles.card}>
                        <View style={styles.rowBetween}><Text style={styles.badge}>FEE REMINDER</Text><Text style={styles.date}>{formatDate(item.sentAt)}</Text></View>
                        <Text style={styles.title}>{item.studentName || item.studentId || 'Student'}</Text>
                        <Text style={styles.amount}>{formatAmount(item.pendingAmount)}</Text>
                        <Text style={styles.body}>Due Date: {formatDate(item.dueDate)}</Text>
                        {!!item.remarks && <Text style={styles.note}>{item.remarks}</Text>}
                        <Text style={styles.status}>{item.status} • {item.channel}</Text>
                    </View>)
                )}

                {!isAdminOrPrincipal && (
                    <TouchableOpacity style={styles.notificationButton} onPress={() => router.push({ pathname: '/notifications', params: { userId: parentUserId, role: 'PARENT', schoolId } } as any)}>
                        <Text style={styles.notificationButtonText}>Open Notifications</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: { padding: 18, paddingBottom: 42 },
    card: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(15,23,42,0.10)' },
    icon: { fontSize: 32, marginBottom: 8 },
    title: { fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8 },
    amount: { fontSize: 28, fontWeight: '900', color: '#92400e', marginBottom: 8 },
    body: { fontSize: 14, lineHeight: 21, color: '#475569' },
    note: { marginTop: 10, fontSize: 14, lineHeight: 21, color: '#334155', backgroundColor: '#f8fafc', padding: 10, borderRadius: 12 },
    error: { color: '#991b1b', fontWeight: '800' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badge: { backgroundColor: '#fef3c7', color: '#92400e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 11, fontWeight: '900' },
    date: { color: '#64748b', fontSize: 12, fontWeight: '700' },
    status: { marginTop: 12, color: '#166534', fontSize: 12, fontWeight: '900' },
    notificationButton: { marginTop: 6, backgroundColor: '#0f172a', borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
    notificationButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
