import { API_ENDPOINTS, api } from '@/src/services/api';
import { getSession, normalizeSchoolId } from '@/src/services/sessionService';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

type FeeReminderSummary = {
    uploadId: number;
    schoolId?: string;
    originalFilename?: string;
    status?: string;
    totalRows?: number;
    readyRows?: number;
    invalidRows?: number;
    missingStudentRows?: number;
    missingParentMappingRows?: number;
    sentRows?: number;
    failedRows?: number;
    createdAt?: string;
    sentAt?: string;
};

type FeeReminderRow = {
    id?: number;
    rowNumber?: number;
    studentId?: string;
    studentName?: string;
    className?: string;
    section?: string;
    pendingAmount?: number;
    dueDate?: string;
    remarks?: string;
    status?: string;
    validationMessage?: string;
    mappedParentNames?: string;
};

type HistoryBatch = {
    key: string;
    uploadId: number;
    sentAt?: string;
    sentLabel: string;
    count: number;
    records: FeeReminderHistory[];
};

const DARK_NAVY = '#08213f';

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

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};

const minuteKey = (value?: string) => {
    if (!value) return 'unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value.slice(0, 16);
    date.setSeconds(0, 0);
    return date.toISOString();
};

const groupHistoryBatches = (records: FeeReminderHistory[]): HistoryBatch[] => {
    const grouped = new Map<string, FeeReminderHistory[]>();
    records.forEach((record) => {
        const key = `${record.uploadId || 'upload'}-${minuteKey(record.sentAt)}`;
        grouped.set(key, [...(grouped.get(key) || []), record]);
    });
    return Array.from(grouped.entries()).map(([key, batch]) => {
        const first = batch[0];
        return {
            key,
            uploadId: first?.uploadId || 0,
            sentAt: first?.sentAt,
            sentLabel: formatDateTime(first?.sentAt),
            count: batch.length,
            records: batch,
        };
    });
};

export default function FeeRemindersScreen() {
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const session = getSession();
    const schoolId = normalizeSchoolId(String(params.schoolId || session?.schoolId || 'TST2'));
    const parentUserId = Number(params.parentUserId || params.userId || session?.userId || 101);
    const role = String(params.role || session?.role || 'PARENT').toUpperCase();
    const isAdminOrPrincipal = role === 'ADMIN' || role === 'PRINCIPAL';
    const homeRoute = role === 'ADMIN' ? '/admin-dashboard' : role === 'PRINCIPAL' ? '/principal-home' : '/parent-dashboard';
    const [items, setItems] = useState<FeeReminderHistory[]>([]);
    const [uploads, setUploads] = useState<FeeReminderSummary[]>([]);
    const [previewRowsByUpload, setPreviewRowsByUpload] = useState<Record<number, FeeReminderRow[]>>({});
    const [openHistoryKey, setOpenHistoryKey] = useState<string>('');
    const [openUploadId, setOpenUploadId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [error, setError] = useState('');

    const historyBatches = useMemo(() => groupHistoryBatches(items), [items]);

    const load = useCallback(async () => {
        setError('');
        try {
            if (isAdminOrPrincipal) {
                const [historyResponse, uploadsResponse] = await Promise.all([
                    api.get(API_ENDPOINTS.feeReminderHistory, { params: { schoolId } }),
                    api.get(API_ENDPOINTS.feeReminderUploads, { params: { schoolId } }),
                ]);
                setItems(Array.isArray(historyResponse.data) ? historyResponse.data : []);
                setUploads(Array.isArray(uploadsResponse.data) ? uploadsResponse.data : []);
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

    const toggleUpload = useCallback(async (uploadId: number) => {
        const nextOpen = openUploadId === uploadId ? null : uploadId;
        setOpenUploadId(nextOpen);
        if (!nextOpen || previewRowsByUpload[uploadId]) return;
        setPreviewLoading(true);
        try {
            const response = await api.get(API_ENDPOINTS.feeReminderPreview(uploadId), { params: { schoolId } });
            setPreviewRowsByUpload((current) => ({ ...current, [uploadId]: Array.isArray(response.data?.rows) ? response.data.rows : [] }));
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || 'Unable to load validation preview rows.');
        } finally {
            setPreviewLoading(false);
        }
    }, [openUploadId, previewRowsByUpload, schoolId]);

    const renderHistoryRecord = (item: FeeReminderHistory, index?: number) => (
        <View key={item.id} style={styles.recordRow}>
            {typeof index === 'number' ? <Text style={styles.recordIndex}>{index + 1}</Text> : null}
            <View style={styles.recordBody}>
                <Text style={styles.recordTitle}>{item.studentName || item.studentId || 'Student'}</Text>
                <Text style={styles.recordMeta}>{item.className || '-'} {item.section ? `- ${item.section}` : ''} • {item.parentName || 'Parent'}</Text>
                <Text style={styles.recordMeta}>{formatAmount(item.pendingAmount)} • Due {formatDate(item.dueDate)}</Text>
                <Text style={styles.sentStatus}>{item.status} • {item.channel}</Text>
            </View>
        </View>
    );

    const renderAdminView = () => (
        <>
            <View style={styles.card}>
                <Text style={styles.icon}>💻</Text>
                <Text style={styles.title}>Fee Reminder Upload is Web-first</Text>
                <Text style={styles.body}>Use the ERP Portal Fee Reminder menu to upload pending fee Excel files, validate rows, check parent mapping and send reminders.</Text>
                <Text style={styles.bodyStrong}>Mobile shows Parent Notification History and Validation / Send Upload Log for quick verification.</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Parent Notification History</Text>
                <Text style={styles.helper}>Sent reminder batches are grouped by upload and sent time. Tap Show to inspect all records.</Text>
                {historyBatches.length === 0 ? <Text style={styles.emptyText}>No reminders sent yet.</Text> : historyBatches.map((batch) => {
                    const open = openHistoryKey === batch.key;
                    return <View key={batch.key} style={styles.accordion}>
                        <TouchableOpacity style={styles.accordionHeader} onPress={() => setOpenHistoryKey(open ? '' : batch.key)}>
                            <View>
                                <Text style={styles.accordionTitle}>{batch.sentLabel} • Sent {batch.count}</Text>
                                <Text style={styles.accordionSub}>Upload {batch.uploadId}</Text>
                            </View>
                            <Text style={styles.showText}>{open ? 'Hide ▲' : 'Show ▼'}</Text>
                        </TouchableOpacity>
                        {open ? <View style={styles.accordionContent}>{batch.records.map(renderHistoryRecord)}</View> : null}
                    </View>;
                })}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Validation / Send Upload Log</Text>
                <Text style={styles.helper}>Tap Show Records to view validation preview rows for each upload.</Text>
                {uploads.length === 0 ? <Text style={styles.emptyText}>No upload log records found.</Text> : uploads.map((upload) => {
                    const uploadId = Number(upload.uploadId);
                    const open = openUploadId === uploadId;
                    const rows = previewRowsByUpload[uploadId] || [];
                    return <View key={uploadId} style={styles.accordion}>
                        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleUpload(uploadId)}>
                            <View style={styles.uploadTitleWrap}>
                                <Text style={styles.accordionTitle}>{upload.originalFilename || `Upload ${uploadId}`}</Text>
                                <Text style={styles.accordionSub}>{upload.status || 'UNKNOWN'} • Ready {upload.readyRows || 0} • Sent {upload.sentRows || 0} • Invalid {upload.invalidRows || 0}</Text>
                                <Text style={styles.accordionSub}>{formatDateTime(upload.createdAt)}{upload.sentAt ? ` → Sent ${formatDateTime(upload.sentAt)}` : ''}</Text>
                            </View>
                            <Text style={styles.showText}>{open ? 'Hide ▲' : 'Show Records ▼'}</Text>
                        </TouchableOpacity>
                        {open ? <View style={styles.accordionContent}>
                            {previewLoading && rows.length === 0 ? <ActivityIndicator /> : null}
                            {rows.length === 0 && !previewLoading ? <Text style={styles.emptyText}>No preview rows loaded.</Text> : rows.map((row, index) => (
                                <View key={row.id || `${uploadId}-${index}`} style={styles.recordRow}>
                                    <Text style={styles.recordIndex}>{index + 1}</Text>
                                    <View style={styles.recordBody}>
                                        <Text style={styles.recordTitle}>{row.studentName || row.studentId || 'Student'}</Text>
                                        <Text style={styles.recordMeta}>{row.className || '-'} {row.section ? `- ${row.section}` : ''} • {row.mappedParentNames || 'Parent mapping not available'}</Text>
                                        <Text style={styles.recordMeta}>{formatAmount(row.pendingAmount)} • Due {formatDate(row.dueDate)}</Text>
                                        <Text style={styles.sentStatus}>{row.status || '-'} • {row.validationMessage || '-'}</Text>
                                    </View>
                                </View>
                            ))}
                        </View> : null}
                    </View>;
                })}
            </View>
        </>
    );

    return (
        <ImageBackground source={background} style={styles.background} resizeMode="cover">
            <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 22, 76) }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <MobileWorkflowHeader title="Fee Reminders" eyebrow={role} subtitle={isAdminOrPrincipal ? `${schoolId} • Web-first finance workflow` : `${schoolId} • Parent notification center`} onBackPress={() => router.back()} onHomePress={() => router.replace(homeRoute as any)} />

                {loading ? (
                    <View style={styles.card}><ActivityIndicator /><Text style={styles.body}>Loading fee reminders...</Text></View>
                ) : error ? (
                    <View style={styles.card}><Text style={styles.error}>{error}</Text></View>
                ) : isAdminOrPrincipal ? renderAdminView() : items.length === 0 ? (
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
    container: { paddingHorizontal: 18, paddingBottom: 42 },
    card: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(15,23,42,0.10)' },
    icon: { fontSize: 32, marginBottom: 8 },
    title: { fontSize: 20, fontWeight: '900', color: DARK_NAVY, marginBottom: 8 },
    sectionTitle: { fontSize: 18, fontWeight: '900', color: DARK_NAVY, marginBottom: 6 },
    amount: { fontSize: 28, fontWeight: '900', color: '#92400e', marginBottom: 8 },
    body: { fontSize: 14, lineHeight: 21, color: '#475569' },
    bodyStrong: { marginTop: 10, fontSize: 14, lineHeight: 21, color: DARK_NAVY, fontWeight: '900' },
    helper: { fontSize: 12, lineHeight: 18, color: DARK_NAVY, marginBottom: 12, fontWeight: '700' },
    emptyText: { color: '#475569', fontSize: 13, fontWeight: '700' },
    note: { marginTop: 10, fontSize: 14, lineHeight: 21, color: '#334155', backgroundColor: '#f8fafc', padding: 10, borderRadius: 12 },
    error: { color: '#991b1b', fontWeight: '800' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    badge: { backgroundColor: '#fef3c7', color: '#92400e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 11, fontWeight: '900' },
    date: { color: '#64748b', fontSize: 12, fontWeight: '700' },
    status: { marginTop: 12, color: '#166534', fontSize: 12, fontWeight: '900' },
    accordion: { borderWidth: 1, borderColor: 'rgba(8,33,63,0.12)', borderRadius: 16, marginTop: 10, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.72)' },
    accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: 12 },
    uploadTitleWrap: { flex: 1 },
    accordionTitle: { color: DARK_NAVY, fontSize: 13, fontWeight: '900' },
    accordionSub: { color: '#475569', fontSize: 11, fontWeight: '700', marginTop: 4 },
    showText: { color: DARK_NAVY, fontSize: 12, fontWeight: '900' },
    accordionContent: { borderTopWidth: 1, borderTopColor: 'rgba(8,33,63,0.10)', padding: 10 },
    recordRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(8,33,63,0.08)' },
    recordIndex: { width: 24, color: DARK_NAVY, fontWeight: '900', fontSize: 12 },
    recordBody: { flex: 1 },
    recordTitle: { color: DARK_NAVY, fontSize: 13, fontWeight: '900' },
    recordMeta: { color: '#475569', fontSize: 12, marginTop: 3, fontWeight: '700' },
    sentStatus: { marginTop: 5, color: '#166534', fontSize: 11, fontWeight: '900' },
    notificationButton: { marginTop: 6, backgroundColor: DARK_NAVY, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
    notificationButtonText: { color: '#fff', fontWeight: '900', fontSize: 15 },
});
