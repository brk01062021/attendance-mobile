import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getTimetableRolloutReadiness, publishLockTimetable } from '../src/services/timetableOperationsApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableRolloutReadiness } from '../src/types/timetable';

export default function TimetableRolloutReadinessScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const role = sourceRole === 'principal' ? 'PRINCIPAL' : 'ADMIN';
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const [batchId, setBatchId] = useState(String(params.batchId || params.generatedBatchId || ''));
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Load rollout readiness before publishing timetable visibility to teachers, students, and parents.');
    const [readiness, setReadiness] = useState<TimetableRolloutReadiness | null>(null);

    const cleanBatchId = batchId.trim().toUpperCase();

    const load = async () => {
        if (!cleanBatchId) {
            setMessage('Enter a timetable batch ID first, for example TT-99266EBB.');
            return;
        }
        setLoading(true);
        try {
            const response = await getTimetableRolloutReadiness(cleanBatchId);
            setReadiness(response);
            setMessage(response.readyForRollout ? 'Ready for teacher, student, and parent rollout.' : 'Rollout blockers found. Fix blockers before final school rollout.');
        } catch {
            setMessage('Unable to load rollout readiness. Confirm the batch ID and try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (cleanBatchId) load();
    }, []);

    const lockAndReload = async () => {
        if (!cleanBatchId) return setMessage('Enter batch ID before publish lock.');
        setLoading(true);
        try {
            await publishLockTimetable(cleanBatchId, role, role === 'PRINCIPAL' ? 'Principal' : 'Admin');
            setMessage('Publish lock completed. Reloading rollout readiness.');
            const response = await getTimetableRolloutReadiness(cleanBatchId);
            setReadiness(response);
        } catch {
            setMessage('Publish lock failed. Repair conflicts first, then try again.');
        } finally {
            setLoading(false);
        }
    };

    return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.eyebrow}>FINAL TIMETABLE GATE</Text>
                    <Text style={styles.title}>Rollout Readiness</Text>
                </View>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(backHome as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
            </View>

            <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>Teacher + Student + Parent Visibility Gate</Text>
                <Text style={styles.heroText}>{message}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Batch ID</Text>
                <TextInput value={batchId} onChangeText={setBatchId} autoCapitalize="characters" placeholder="Example: TT-99266EBB" placeholderTextColor={colors.mutedText} style={styles.input} />
                <TouchableOpacity style={styles.primaryButton} onPress={load}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Load Rollout Readiness</Text>}</TouchableOpacity>
            </View>

            {readiness ? <>
                <View style={styles.scoreCard}>
                    <Text style={styles.score}>{readiness.readinessScore}%</Text>
                    <Text style={styles.scoreTitle}>{readiness.readyForRollout ? 'Ready for Rollout' : 'Review Required'}</Text>
                    <Text style={styles.scoreSub}>Batch {readiness.batchId}</Text>
                </View>

                <View style={styles.grid}>
                    <Metric title="Locked" value={readiness.locked ? 'YES' : 'NO'} />
                    <Metric title="Published" value={readiness.latestPublished ? 'YES' : 'NO'} />
                    <Metric title="Teacher Entries" value={String(readiness.teacherVisibleEntries)} />
                    <Metric title="Student/Parent Entries" value={String(readiness.studentParentVisibleEntries)} />
                    <Metric title="Conflicts" value={String(readiness.conflicts)} />
                    <Metric title="Notifications" value={String(readiness.notifications)} />
                </View>

                <View style={styles.grid}>
                    <Action title="Publish Lock Now" subtitle="Admin/Principal final gate" onPress={lockAndReload} />
                    <Action title="Open Live Timetable" subtitle="Validate role visibility" onPress={() => router.push({ pathname: '/timetable-live' as any, params: { batchId: readiness.batchId, sourceRole, role } })} />
                </View>

                <Section title="Rollout Blockers" items={readiness.blockers} empty="No blockers found." urgent />
                <Section title="Passed Checks" items={readiness.checks} empty="No checks loaded." />
            </> : null}
        </ScrollView>
    </ImageBackground>;
}

function Metric({ title, value }: { title: string; value: string }) {
    return <View style={styles.metricCard}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricTitle}>{title}</Text></View>;
}

function Action({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
    return <TouchableOpacity style={styles.actionCard} onPress={onPress}><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSubtitle}>{subtitle}</Text></TouchableOpacity>;
}

function Section({ title, items, empty, urgent }: { title: string; items: string[]; empty: string; urgent?: boolean }) {
    return <View style={styles.card}><Text style={styles.cardTitle}>{title}</Text>{items.length === 0 ? <Text style={styles.empty}>{empty}</Text> : items.map((item, index) => <Text key={`${title}-${index}`} style={urgent ? styles.blocker : styles.listItem}>• {item}</Text>)}</View>;
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
    scoreCard: { backgroundColor: colors.cardCream, borderRadius: 24, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    score: { color: colors.primaryNavy, fontSize: 44, fontWeight: '900' },
    scoreTitle: { color: colors.primaryNavy, fontSize: 18, fontWeight: '900' },
    scoreSub: { color: colors.slateText, fontWeight: '800', marginTop: 4 },
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
    blocker: { color: '#8A1F11', fontWeight: '900', lineHeight: 22 },
});
