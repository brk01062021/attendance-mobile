import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { exportTimetableBinary, getTimetableArchives, getTimetableNotifications, getTimetableOperationsStatus, getTimetableVersions, publishLockTimetable, rollbackTimetableVersion } from '../src/services/timetableOperationsApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableArchiveSummary, TimetableNotification, TimetableOperationsStatus, TimetableVersion } from '../src/types/timetable';

export default function TimetableOperationsScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const role = sourceRole === 'principal' ? 'PRINCIPAL' : 'ADMIN';
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const [batchId, setBatchId] = useState(String(params.generatedBatchId || params.batchId || ''));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Enter or select a batch ID to manage publish lock, exports, live visibility, readiness, versions, notifications, and archive history.');
    const [status, setStatus] = useState<TimetableOperationsStatus | null>(null);
    const [versions, setVersions] = useState<TimetableVersion[]>([]);
    const [notifications, setNotifications] = useState<TimetableNotification[]>([]);
    const [archives, setArchives] = useState<TimetableArchiveSummary[]>([]);

    const cleanBatchId = batchId.trim().toUpperCase();

    const load = async () => {
        if (!cleanBatchId) {
            setMessage('Enter a timetable batch ID first, for example TT-99266EBB.');
            return;
        }
        setLoading(true);
        try {
            const [nextStatus, nextVersions, nextNotifications, nextArchives] = await Promise.all([
                getTimetableOperationsStatus(cleanBatchId),
                getTimetableVersions(cleanBatchId),
                getTimetableNotifications(cleanBatchId),
                getTimetableArchives().catch(() => []),
            ]);
            setStatus(nextStatus);
            setVersions(nextVersions || []);
            setNotifications(nextNotifications || []);
            setArchives(nextArchives || []);
            setMessage('Timetable operational status loaded.');
        } catch {
            setMessage('Unable to load timetable operations. Confirm the batch ID exists and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cleanBatchId) load();
    }, []);

    const runPublishLock = async () => {
        if (!cleanBatchId) return setMessage('Enter batch ID before publish lock.');
        setLoading(true);
        try {
            const response = await publishLockTimetable(cleanBatchId, role, role === 'PRINCIPAL' ? 'Principal' : 'Admin');
            setMessage(response.message || response.notificationMessage || 'Publish lock completed.');
            await load();
        } catch {
            setMessage('Publish lock failed. Check conflicts and role.');
        } finally {
            setLoading(false);
        }
    };

    const runExport = async (format: 'PDF' | 'EXCEL') => {
        if (!cleanBatchId) return setMessage('Enter batch ID before export.');
        setLoading(true);
        try {
            const response = await exportTimetableBinary(cleanBatchId, format);
            setMessage(`${response.fileName} generated • ${response.byteSize} bytes • ${response.contentType}`);
        } catch {
            setMessage(`${format} export failed. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    const runRollback = async () => {
        if (!cleanBatchId) return setMessage('Enter batch ID before rollback.');
        setLoading(true);
        try {
            const version = await rollbackTimetableVersion(cleanBatchId, 1, role);
            setMessage(version.notes || 'Rollback marker created.');
            await load();
        } catch {
            setMessage('Rollback failed. Only Admin/Principal can rollback.');
        } finally {
            setLoading(false);
        }
    };

    return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                <View style={styles.headerTextWrap}><Text style={styles.eyebrow}>TIMETABLE OPERATIONS</Text><Text style={styles.title}>Timetable Operations</Text></View>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(backHome as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
            </View>

            <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Publish Lock + Export + Rollout Readiness</Text>
                <Text style={styles.heroText}>{message}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Batch ID</Text>
                <TextInput value={batchId} onChangeText={setBatchId} autoCapitalize="characters" placeholder="Example: TT-99266EBB" placeholderTextColor={colors.mutedText} style={styles.input} />
                <TouchableOpacity style={styles.primaryButton} onPress={load}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Load Operations Status</Text>}</TouchableOpacity>
            </View>

            {status ? <View style={styles.grid}>
                <Metric title="Locked" value={status.locked ? 'YES' : 'NO'} />
                <Metric title="Published" value={status.latestPublished ? 'YES' : 'NO'} />
                <Metric title="Versions" value={String(status.versions)} />
                <Metric title="Entries" value={String(status.entries)} />
            </View> : null}

            <View style={styles.grid}>
                <Action title="Auto Repair" subtitle="Repair conflicts" onPress={() => router.push({ pathname: '/timetable-repair' as any, params: { generatedBatchId: cleanBatchId, sourceRole } })} />
                <Action title="Manual Review" subtitle="Editor foundation" onPress={() => router.push({ pathname: '/timetable-review' as any, params: { generatedBatchId: cleanBatchId, sourceRole } })} />
                <Action title="Publish Lock" subtitle="Admin/Principal only" onPress={runPublishLock} />
                <Action title="PDF Export" subtitle="Real PDF payload" onPress={() => runExport('PDF')} />
                <Action title="Excel Export" subtitle="Excel .xls payload" onPress={() => runExport('EXCEL')} />
                <Action title="Live Timetable" subtitle="Teacher/student/parent view" onPress={() => router.push({ pathname: '/timetable-live' as any, params: { batchId: cleanBatchId, role, sourceRole } })} />
                <Action title="Rollout Readiness" subtitle="Final readiness check" onPress={() => router.push({ pathname: '/timetable-rollout-readiness' as any, params: { batchId: cleanBatchId, sourceRole } })} />
                <Action title="Rollback" subtitle="Unlock to review mode" onPress={runRollback} />
                <Action title="Intelligence" subtitle="Principal analytics" onPress={() => router.push({ pathname: '/principal-timetable-intelligence' as any, params: { generatedBatchId: cleanBatchId, sourceRole } })} />
            </View>

            <Section title="Version / Rollback History" items={versions.map(v => `V${v.versionNumber} • ${v.changeType} • ${v.createdBy}`)} />
            <Section title="Notifications" items={notifications.map(n => `${n.audience}: ${n.title}`)} />
            <Section title="Archive History" items={archives.map(a => `${a.batchId} • ${a.status} • ${a.entriesCount} entries`)} />
        </ScrollView>
    </ImageBackground>;
}

function Metric({ title, value }: { title: string; value: string }) {
    return <View style={styles.metricCard}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricTitle}>{title}</Text></View>;
}

function Action({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
    return <TouchableOpacity style={styles.actionCard} onPress={onPress}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></TouchableOpacity>;
}

function Section({ title, items }: { title: string; items: string[] }) {
    return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{items.length === 0 ? <Text style={styles.empty}>No records yet.</Text> : items.slice(0, 8).map((item, index) => <Text key={`${title}-${index}`} style={styles.listItem}>• {item}</Text>)}</View>;
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 34 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
    circleButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.primaryNavy, fontSize: 28, fontWeight: '900', marginTop: -2 },
    homeIcon: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900', marginTop: 0 },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900', textAlign: 'center' },
    heroCard: { backgroundColor: 'rgba(13, 33, 57, 0.94)', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.42)', ...shadows.medium },
    heroTitle: { color: colors.white, fontSize: 21, fontWeight: '900', marginBottom: 6 },
    heroText: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', lineHeight: 20 },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    label: { color: colors.primaryNavy, fontWeight: '900', marginBottom: 8 },
    input: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: 14, paddingVertical: 12, color: colors.primaryNavy, fontWeight: '900', letterSpacing: 0.5, marginBottom: 10 },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 15, padding: 14, alignItems: 'center' },
    primaryText: { color: colors.white, fontWeight: '900' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    metricCard: { width: '48%', backgroundColor: colors.cardCream, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft },
    metricValue: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900' },
    metricTitle: { color: colors.slateText, fontWeight: '800', marginTop: 3 },
    actionCard: { width: '48%', backgroundColor: colors.cardCream, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft },
    actionTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15, marginBottom: 5 },
    actionSubtitle: { color: colors.slateText, fontWeight: '700', fontSize: 11, lineHeight: 15 },
    cardTitle: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900', marginBottom: 10 },
    empty: { color: colors.slateText, fontWeight: '800', lineHeight: 20 },
    listItem: { color: colors.slateText, fontWeight: '800', lineHeight: 22 },
});
