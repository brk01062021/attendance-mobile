import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getTimetableArchives, getTimetableBatches, getTimetableBatchSummary, getTimetableNotifications, getTimetableOperationsStatus, getTimetablePublishHistory, getTimetableVersions } from '../src/services/timetableOperationsApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableArchiveSummary, TimetableBatchSummary, TimetableNotification, TimetableOperationsStatus, TimetablePublishAudit, TimetableVersion } from '../src/types/timetable';

export default function TimetableOperationsScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const role = sourceRole === 'principal' ? 'PRINCIPAL' : 'ADMIN';
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const [batchId, setBatchId] = useState(String(params.generatedBatchId || params.batchId || ''));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Review existing timetable repair status, publish readiness, rollback history, and timetable batches.');
    const [status, setStatus] = useState<TimetableOperationsStatus | null>(null);
    const [versions, setVersions] = useState<TimetableVersion[]>([]);
    const [notifications, setNotifications] = useState<TimetableNotification[]>([]);
    const [archives, setArchives] = useState<TimetableArchiveSummary[]>([]);
    const [batches, setBatches] = useState<TimetableBatchSummary[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<TimetableBatchSummary | null>(null);
    const [publishAudit, setPublishAudit] = useState<TimetablePublishAudit[]>([]);
    const scrollRef = useRef<ScrollView>(null);

    const cleanBatchId = batchId.trim().toUpperCase();

    const displayStatus = (value?: string | null) => {
        if (!value) return '—';
        return value
            .toLowerCase()
            .split('_')
            .filter(Boolean)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    };

    const load = async (targetBatchId = cleanBatchId) => {
        if (!targetBatchId) {
            setMessage('Enter a timetable batch ID first, for example TT-99266EBB.');
            return;
        }
        setLoading(true);
        try {
            const [nextStatus, nextVersions, nextNotifications, nextArchives, nextBatches, nextSummary, nextAudit] = await Promise.all([
                getTimetableOperationsStatus(targetBatchId),
                getTimetableVersions(targetBatchId),
                getTimetableNotifications(targetBatchId),
                getTimetableArchives().catch(() => []),
                getTimetableBatches().catch(() => []),
                getTimetableBatchSummary(targetBatchId).catch(() => null),
                getTimetablePublishHistory(targetBatchId).catch(() => []),
            ]);
            setStatus(nextStatus);
            setVersions(nextVersions || []);
            setNotifications(nextNotifications || []);
            setArchives(nextArchives || []);
            setBatches(nextBatches || []);
            setSelectedBatch(nextSummary);
            setPublishAudit(nextAudit || []);
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

    const openActivePublishedTimetable = () => {
        router.push({ pathname: '/active-published-timetable' as any, params: { role, sourceRole } });
    };

    return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
        <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                <View style={styles.headerTextWrap}><Text style={styles.eyebrow}>TIMETABLE OPERATIONS</Text><Text style={styles.title}>Timetable Operations</Text></View>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(backHome as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
            </View>

            <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Mobile Timetable Visibility</Text>
                <Text style={styles.heroText}>{message}</Text>
                <Text style={styles.heroNote}>Mobile is read-only for publish lifecycle. Use Web ERP for existing timetable Auto Repair, same-day period reshuffle, Revalidate, Publish Confirmation, Publish, and Rollback actions.</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Batch ID</Text>
                <TextInput value={batchId} onChangeText={setBatchId} autoCapitalize="characters" placeholder="Example: TT-99266EBB" placeholderTextColor={colors.mutedText} style={styles.input} />
                <TouchableOpacity style={styles.primaryButton} onPress={() => load()}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Load Operations Status</Text>}</TouchableOpacity>
            </View>

            {status ? <View style={styles.grid}>
                <Metric title="Locked" value={status.locked ? 'YES' : 'NO'} />
                <Metric title="Published" value={status.latestPublished ? 'YES' : 'NO'} />
                <Metric title="Versions" value={String(status.versions)} />
                <Metric title="Entries" value={String(status.entries)} />
            </View> : null}

            {selectedBatch ? <View style={styles.card}>
                <Text style={styles.cardEyebrow}>BATCH SUMMARY</Text>
                <Text style={styles.cardTitle}>{selectedBatch.batchId}</Text>
                <Text style={styles.empty}>{selectedBatch.message}</Text>
                <Text style={styles.summaryMeta}>Completion: {selectedBatch.completionPercentage || 0}%</Text>
                <View style={styles.grid}>
                    <Metric title="Status" value={displayStatus(selectedBatch.status)} compact />
                    <Metric title="Conflicts" value={String(selectedBatch.conflicts || 0)} compact />
                    <Metric title="Uploaded By" value={selectedBatch.uploadedBy || 'System'} compact />
                    <Metric title="Upload Time" value={formatDateTime(selectedBatch.uploadedAt)} compact />
                </View>
            </View> : null}

            <View style={styles.grid}>
                <Action title="Active Published Timetable" subtitle="Read-only latest active version" onPress={openActivePublishedTimetable} />
                <Action title="Refresh History" subtitle="Reload publish and rollback history" onPress={() => load()} />
            </View>

            <View style={styles.readOnlyCard}>
                <Text style={styles.cardEyebrow}>WEB-FIRST ACTIONS</Text>
                <Text style={styles.cardTitle}>Publish lifecycle actions are disabled on mobile</Text>
                <Text style={styles.empty}>Run Auto Repair, Revalidate, Publish Confirmation, Publish, and Rollback from Web ERP. Mobile shows Active Published Timetable, Published Version History, and Rollback History only.</Text>
            </View>

            <BatchHistory batches={batches} currentBatchId={cleanBatchId} onOpen={(id) => { setBatchId(id); load(id); scrollRef.current?.scrollTo({ y: 0, animated: true }); }} />
            <Section title="Publish Audit Trail" items={publishAudit.map(a => `${formatStatus(a.status)} • ${a.batchId} • ${a.approvedBy || 'System'} • Previous: ${a.previousActiveBatchId || 'None'} → Active: ${a.newActiveBatchId || a.batchId}`)} />
            <ArchiveHistory archives={archives} />

            <Section title="Version / Rollback History" items={versions.map(v => `Version ${v.versionNumber} • ${formatStatus(v.changeType)} • ${v.createdBy}`)} />
            <Section title="Notifications" items={notifications.map(n => `${n.audience}: ${n.title}`)} />
            <Section title="Archive History" items={archives.map(a => `${a.batchId} • ${formatStatus(a.status)} • ${a.entriesCount} entries`)} />
        </ScrollView>
    </ImageBackground>;
}

function formatDateTime(value?: string | null) {
    if (!value) return '—';
    return value.replace('T', ' ').slice(0, 16);
}

function formatStatus(value?: string | null) {
    if (!value) return '—';
    return value
        .toLowerCase()
        .split('_')
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function BatchHistory({ batches, currentBatchId, onOpen }: { batches: TimetableBatchSummary[]; currentBatchId: string; onOpen: (batchId: string) => void }) {
    return <View style={styles.card}>
        <Text style={styles.cardEyebrow}>BATCH HISTORY</Text>
        <Text style={styles.cardTitle}>Open Previous Batch</Text>
        {batches.length === 0 ? <Text style={styles.empty}>No timetable batches yet.</Text> : batches.slice(0, 12).map(batch => <TouchableOpacity key={batch.batchId} style={[styles.historyRow, batch.batchId === currentBatchId ? styles.historyRowActive : null]} onPress={() => onOpen(batch.batchId)}>
            <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{batch.batchId} • {formatStatus(batch.status)}</Text>
                <Text style={styles.historySub}>{batch.totalEntries} entries • {batch.conflicts} conflicts • {batch.uploadedBy || 'SYSTEM'}</Text>
            </View>
            <Text style={styles.openText}>Open</Text>
        </TouchableOpacity>)}
    </View>;
}

function ArchiveHistory({ archives }: { archives: TimetableArchiveSummary[] }) {
    return <View style={styles.card}>
        <Text style={styles.cardEyebrow}>ROLLBACK HISTORY</Text>
        <Text style={styles.cardTitle}>Published Batch History</Text>
        {archives.length === 0 ? <Text style={styles.empty}>No rollback/archive records yet.</Text> : archives.slice(0, 8).map(item => <View key={`${item.batchId}-${item.status}`} style={styles.historyRow}>
            <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>{item.batchId} • {formatStatus(item.status)}</Text>
                <Text style={styles.historySub}>{item.entriesCount} entries • {item.archivedBy || 'SYSTEM'} • {formatDateTime(item.archivedAt)}</Text>
                <Text style={styles.historySub}>{item.message}</Text>
            </View>
        </View>)}
    </View>;
}


function Metric({ title, value, compact = false }: { title: string; value: string; compact?: boolean }) {
    return <View style={styles.metricCard}><Text style={[styles.metricValue, compact ? styles.metricValueCompact : null]} numberOfLines={2} adjustsFontSizeToFit>{value}</Text><Text style={styles.metricTitle}>{title}</Text></View>;
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
    heroNote: { color: colors.cardCream, fontWeight: '900', lineHeight: 18, marginTop: 10 },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    readOnlyCard: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    label: { color: colors.primaryNavy, fontWeight: '900', marginBottom: 8 },
    input: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: 14, paddingVertical: 12, color: colors.primaryNavy, fontWeight: '900', letterSpacing: 0.5, marginBottom: 10 },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 15, padding: 14, alignItems: 'center' },
    primaryText: { color: colors.white, fontWeight: '900' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    metricCard: { width: '48%', backgroundColor: colors.cardCream, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft },
    metricValue: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900' },
    metricValueCompact: { fontSize: 18, lineHeight: 22 },
    metricTitle: { color: colors.slateText, fontWeight: '800', marginTop: 3 },
    actionCard: { width: '48%', backgroundColor: colors.cardCream, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft },
    actionTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15, marginBottom: 5 },
    actionSubtitle: { color: colors.slateText, fontWeight: '700', fontSize: 11, lineHeight: 15 },
    editBox: { backgroundColor: colors.white, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.cardGoldBorder, marginTop: 8 },
    cardEyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.4, marginBottom: 4 },
    cardTitle: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900', marginBottom: 10 },
    empty: { color: colors.slateText, fontWeight: '800', lineHeight: 20 },
    summaryMeta: { color: colors.deepGold, fontWeight: '900', marginTop: 8, marginBottom: 10 },
    listItem: { color: colors.slateText, fontWeight: '800', lineHeight: 22 },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,248,225,0.78)', borderRadius: 15, padding: 12, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 8 },
    historyRowActive: { backgroundColor: colors.cardCream },
    historyTitle: { color: colors.primaryNavy, fontWeight: '900', flexShrink: 1 },
    historySub: { color: colors.slateText, fontWeight: '700', fontSize: 11, marginTop: 3 },
    openText: { color: colors.deepGold, fontWeight: '900' },
    smallButton: { backgroundColor: colors.primaryNavy, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
    smallButtonText: { color: colors.white, fontWeight: '900', fontSize: 11 },
});
