import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getSession, normalizeSchoolId } from '../src/services/sessionService';
import { getLiveTimetable, getTimetableArchives, getTimetablePublishHistory } from '../src/services/timetableOperationsApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableArchiveSummary, TimetableEntry, TimetableLiveResponse, TimetablePublishAudit } from '../src/types/timetable';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

export default function ActivePublishedTimetableScreen() {
    const params = useLocalSearchParams();
    const session = getSession();
    const sourceRole = String(params.sourceRole || session?.role?.toLowerCase() || 'admin');
    const role = ['teacher', 'student', 'parent', 'principal'].includes(sourceRole) ? sourceRole.toUpperCase() : 'ADMIN';
    const backHome = sourceRole === 'principal' ? '/principal-home' : sourceRole === 'teacher' ? '/teacher-dashboard' : sourceRole === 'student' ? '/student-dashboard' : sourceRole === 'parent' ? '/parent-dashboard' : '/admin-dashboard';
    const schoolId = normalizeSchoolId(String(params.schoolId || session?.schoolId || 'BRK1'));

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('Loading latest active published timetable...');
    const [data, setData] = useState<TimetableLiveResponse | null>(null);
    const [publishHistory, setPublishHistory] = useState<TimetablePublishAudit[]>([]);
    const [rollbackHistory, setRollbackHistory] = useState<TimetableArchiveSummary[]>([]);
    const [classFilter, setClassFilter] = useState('ALL');
    const [sectionFilter, setSectionFilter] = useState('ALL');
    const [dayFilter, setDayFilter] = useState('ALL');

    const load = async () => {
        setLoading(true);
        try {
            const [response, history, archives] = await Promise.all([
                getLiveTimetable({ role, schoolId }),
                getTimetablePublishHistory(),
                getTimetableArchives(),
            ]);
            setData(response);
            setPublishHistory(history || []);
            setRollbackHistory(archives || []);
            setMessage(response.message || 'Latest active published timetable loaded.');
        } catch {
            setData(null);
            setMessage('Unable to load active published timetable. Publish an imported timetable first, then refresh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const entries = data?.entries || [];
    const classes = useMemo(() => Array.from(new Set(entries.map(e => String(e.className || '').trim()).filter(Boolean))).sort(), [entries]);
    const sections = useMemo(() => Array.from(new Set(entries.filter(e => classFilter === 'ALL' || e.className === classFilter).map(e => String(e.section || '').trim()).filter(Boolean))).sort(), [entries, classFilter]);
    const days = useMemo(() => DAYS.filter(day => entries.some(e => String(e.dayOfWeek || '').toUpperCase() === day)), [entries]);
    const visible = useMemo(() => entries
        .filter(e => classFilter === 'ALL' || e.className === classFilter)
        .filter(e => sectionFilter === 'ALL' || e.section === sectionFilter)
        .filter(e => dayFilter === 'ALL' || String(e.dayOfWeek || '').toUpperCase() === dayFilter)
        .sort((a, b) => DAYS.indexOf(String(a.dayOfWeek || '').toUpperCase()) - DAYS.indexOf(String(b.dayOfWeek || '').toUpperCase()) || Number(a.periodNumber || 0) - Number(b.periodNumber || 0)), [entries, classFilter, sectionFilter, dayFilter]);

    const grouped = visible.reduce<Record<string, TimetableEntry[]>>((acc, item) => {
        const day = String(item.dayOfWeek || 'UNASSIGNED').toUpperCase();
        acc[day] = acc[day] || [];
        acc[day].push(item);
        return acc;
    }, {});

    return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                <View style={styles.headerTextWrap}><Text style={styles.eyebrow}>ACTIVE PUBLISHED TIMETABLE</Text><Text style={styles.title}>Published Timetable Viewer</Text></View>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(backHome as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
            </View>

            <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Latest active published timetable</Text>
                <Text style={styles.heroText}>{loading ? 'Loading active published timetable...' : message}</Text>
            </View>

            <View style={styles.grid}>
                <Metric title="Active Batch ID" value={data?.batchId || 'NONE'} />
                <Metric title="Published" value={data?.published ? 'YES' : 'NO'} />
                <Metric title="Locked" value={data?.locked ? 'YES' : 'NO'} />
                <Metric title="Visible Periods" value={String(visible.length)} />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Class / Section Filter</Text>
                <View style={styles.chipRow}><FilterChip label="All Classes" active={classFilter === 'ALL'} onPress={() => { setClassFilter('ALL'); setSectionFilter('ALL'); }} />{classes.map(item => <FilterChip key={item} label={item} active={classFilter === item} onPress={() => { setClassFilter(item); setSectionFilter('ALL'); }} />)}</View>
                <View style={styles.chipRow}><FilterChip label="All Sections" active={sectionFilter === 'ALL'} onPress={() => setSectionFilter('ALL')} />{sections.map(item => <FilterChip key={item} label={item} active={sectionFilter === item} onPress={() => setSectionFilter(item)} />)}</View>
                <TouchableOpacity style={styles.primaryButton} onPress={load}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Refresh Active Timetable</Text>}</TouchableOpacity>
            </View>

            <View style={styles.chipRow}><FilterChip label="All Days" active={dayFilter === 'ALL'} onPress={() => setDayFilter('ALL')} />{days.map(day => <FilterChip key={day} label={day} active={dayFilter === day} onPress={() => setDayFilter(day)} />)}</View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Published Version History</Text>
                {publishHistory.length === 0 ? <Text style={styles.empty}>No published version history found yet.</Text> : publishHistory.slice(0, 6).map((item, index) => <View key={item.auditId || `${item.batchId}-${index}`} style={styles.historyCard}>
                    <Text style={styles.historyTitle}>V{item.versionNumber || '-'} • {item.batchId} • {item.status}</Text>
                    <Text style={styles.periodText}>Published By: {item.approvedBy || 'SYSTEM'}</Text>
                    <Text style={styles.periodText}>Published Time: {item.publishedAt ? item.publishedAt.slice(0, 16).replace('T', ' ') : 'Not published'}</Text>
                    <Text style={styles.periodText}>Readiness: {item.readinessPercentage ?? '-'}% • Errors: {item.errorCount ?? item.remainingConflicts ?? 0} • Conflicts: {item.remainingConflicts ?? 0}</Text>
                </View>)}
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Rollback History</Text>
                {rollbackHistory.length === 0 ? <Text style={styles.empty}>No rollback/archive history found yet.</Text> : rollbackHistory.slice(0, 6).map((item, index) => <View key={`${item.batchId}-${item.status}-${index}`} style={styles.historyCard}>
                    <Text style={styles.historyTitle}>{item.batchId} • {item.status}</Text>
                    <Text style={styles.periodText}>Changed By: {item.archivedBy || 'SYSTEM'}</Text>
                    <Text style={styles.periodText}>Changed Time: {item.archivedAt ? item.archivedAt.slice(0, 16).replace('T', ' ') : '-'}</Text>
                    <Text style={styles.periodText}>{item.message}</Text>
                </View>)}
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Day-wise Timetable</Text>
                <Text style={styles.note}>Source: latest active published imported timetable.</Text>
                {visible.length === 0 ? <Text style={styles.empty}>No active published timetable periods found for the selected filters.</Text> : Object.entries(grouped).map(([day, items]) => <View key={day} style={styles.dayBlock}>
                    <Text style={styles.dayTitle}>{day}</Text>
                    {items.map((item, index) => <View key={item.id || `${day}-${index}`} style={styles.periodCard}>
                        <Text style={styles.periodTitle}>Period {item.periodNumber || '-'} • Class {item.className || '-'}-{item.section || '-'}</Text>
                        <Text style={styles.periodText}>Subject: {item.subjectName || '-'}</Text>
                        <Text style={styles.periodText}>Teacher: {item.teacherName || '-'}</Text>
                        <Text style={styles.periodText}>Room: {item.roomNumber || '-'}</Text>
                        <Text style={styles.periodText}>Time: {item.startTime || '-'} - {item.endTime || '-'}</Text>
                    </View>)}
                </View>)}
            </View>
        </ScrollView>
    </ImageBackground>;
}

function Metric({ title, value }: { title: string; value: string }) {
    return <View style={styles.metricCard}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricTitle}>{title}</Text></View>;
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 34 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
    circleButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.primaryNavy, fontSize: 28, fontWeight: '900', marginTop: -2 },
    homeIcon: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900' },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900', textAlign: 'center' },
    heroCard: { backgroundColor: 'rgba(13, 33, 57, 0.94)', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.42)', ...shadows.medium },
    heroTitle: { color: colors.white, fontSize: 21, fontWeight: '900', marginBottom: 6 },
    heroText: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', lineHeight: 20 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    metricCard: { width: '48%', backgroundColor: colors.cardCream, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft },
    metricValue: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900' },
    metricTitle: { color: colors.slateText, fontWeight: '800', marginTop: 3, fontSize: 11 },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    cardTitle: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900', marginBottom: 8 },
    note: { color: colors.slateText, fontWeight: '700', marginBottom: 10 },
    empty: { color: colors.slateText, fontWeight: '800', lineHeight: 20 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.cardGoldBorder, backgroundColor: colors.cardCream, paddingHorizontal: 12, paddingVertical: 8 },
    chipActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy },
    chipText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 11 },
    chipTextActive: { color: colors.white },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 15, padding: 14, alignItems: 'center' },
    primaryText: { color: colors.white, fontWeight: '900' },
    dayBlock: { marginTop: 12 },
    dayTitle: { color: colors.deepGold, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    periodCard: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.cardGoldBorder, padding: 12, marginBottom: 8 },
    historyCard: { backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.cardGoldBorder, padding: 12, marginTop: 8 },
    historyTitle: { color: colors.primaryNavy, fontSize: 13, fontWeight: '900', marginBottom: 4 },
    periodTitle: { color: colors.primaryNavy, fontWeight: '900', marginBottom: 5 },
    periodText: { color: colors.slateText, fontWeight: '800', lineHeight: 20 },
});
