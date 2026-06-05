import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTimetableConflicts } from '../src/services/timetableApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableConflict } from '../src/types/timetable';

const demoConflicts: TimetableConflict[] = [];

export default function TimetableConflictsScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const generatedBatchId = String(params.generatedBatchId || 'PENDING');
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const [conflicts, setConflicts] = useState<TimetableConflict[]>(generatedBatchId === 'PENDING' ? demoConflicts : []);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(generatedBatchId === 'PENDING' ? 'No teacher double-booking found for this timetable.' : 'Loading conflict center...');

    useEffect(() => {
        let active = true;
        setLoading(true);
        getTimetableConflicts(generatedBatchId)
            .then(data => {
                if (!active) return;
                setConflicts(data || []);
                setStatus(data?.length ? `Conflicts loaded for ${generatedBatchId}` : `No timetable conflicts found for ${generatedBatchId}`);
            })
            .catch(() => {
                if (!active) return;
                if (generatedBatchId === 'PENDING') {
                    setConflicts(demoConflicts);
                    setStatus('Conflict details are unavailable. Please refresh after the timetable service is restored.');
                } else {
                    setConflicts([]);
                    setStatus('Conflict details are unavailable for this batch.');
                }
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [generatedBatchId]);

    const navParams = { sourceRole, generatedBatchId, className: params.className, section: params.section };

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <PageHeader title="Conflict Center" eyebrow="CONFLICT REPAIR" homePath={backHome} />
                <Text style={styles.status}>{status}</Text>
                <Text style={styles.batch}>Batch: {generatedBatchId}</Text>
                {loading ? <ActivityIndicator color={colors.primaryNavy} style={{ marginBottom: 10 }} /> : null}
                <View style={styles.summaryRow}>
                    <Kpi label="High" value={String(conflicts.filter(c => c.severity === 'HIGH').length)} />
                    <Kpi label="Medium" value={String(conflicts.filter(c => c.severity === 'MEDIUM').length)} />
                    <Kpi label="Low" value={String(conflicts.filter(c => c.severity === 'LOW').length)} />
                </View>
                {conflicts.length ? conflicts.map(conflict => (
                    <View key={String(conflict.id)} style={styles.card}>
                        <View style={styles.cardTop}><Text style={styles.severity}>{conflict.severity}</Text><Text style={styles.type}>{conflict.type.replace(/_/g, ' ')}</Text></View>
                        <Text style={styles.cardTitle}>{conflict.title}</Text>
                        <Text style={styles.description}>{conflict.description}</Text>
                        <Text style={styles.meta}>{[conflict.teacherName, conflict.className && `${conflict.className}-${conflict.section}`, conflict.dayOfWeek, conflict.periodNumber && `P${conflict.periodNumber}`].filter(Boolean).join(' • ')}</Text>
                    </View>
                )) : <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No conflicts found</Text><Text style={styles.emptyText}>This generated timetable batch is clean. Teacher availability map prevented same-period double-booking. Continue with workload review before publish.</Text></View>}
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/timetable-repair' as any, params: navParams })}><Text style={styles.primaryText}>Run Auto Conflict Repair</Text></TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/teacher-workload-dashboard' as any, params: navParams })}><Text style={styles.primaryText}>Open Workload Intelligence</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/timetable-review' as any, params: navParams })}><Text style={styles.secondaryText}>Return to Review</Text></TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}
function PageHeader({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) { return <View style={styles.headerRow}><TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity><View style={styles.headerTextWrap}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity></View>; }
function Kpi({ label, value }: { label: string; value: string }) { return <View style={styles.kpi}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ bg: { flex: 1 }, container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 30 }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 }, circleButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, backText: { color: colors.primaryNavy, fontSize: 28, fontWeight: '900', marginTop: -2 }, homeIcon: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900', marginTop: 0 }, headerTextWrap: { flex: 1, alignItems: 'center' }, eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' }, title: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900', textAlign: 'center' }, status: { color: colors.deepGold, fontWeight: '900', marginBottom: 5 }, batch: { color: colors.slateText, fontWeight: '800', marginBottom: 10 }, summaryRow: { flexDirection: 'row', gap: 7, marginBottom: 9 }, kpi: { flex: 1, backgroundColor: colors.cardCream, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft }, kpiValue: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900' }, kpiLabel: { color: colors.mutedText, fontWeight: '800' }, card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 14, padding: 12, marginBottom: 9, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.medium }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, severity: { color: colors.alertRed, fontWeight: '900' }, type: { color: colors.deepGold, fontWeight: '800', fontSize: 9 }, cardTitle: { color: colors.primaryNavy, fontSize: 12, fontWeight: '900' }, description: { color: colors.slateText, marginTop: 5, lineHeight: 16, fontWeight: '600' }, meta: { color: colors.mutedText, marginTop: 6, fontWeight: '800' }, emptyCard: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 10, ...shadows.soft }, emptyTitle: { color: colors.successGreen, fontWeight: '900', fontSize: 16 }, emptyText: { color: colors.slateText, fontWeight: '700', marginTop: 6 }, primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 13, padding: 11, alignItems: 'center', marginTop: 6 }, primaryText: { color: colors.white, fontWeight: '900' }, secondaryButton: { backgroundColor: colors.cardCream, borderRadius: 13, padding: 11, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: colors.cardGoldBorder }, secondaryText: { color: colors.primaryNavy, fontWeight: '900' } });
