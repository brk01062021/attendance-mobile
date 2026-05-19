import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';
import { getTeacherWorkloadSummary } from '../src/services/timetableApi';
import { TeacherWorkloadSummary } from '../src/types/timetable';

const demoWorkload: TeacherWorkloadSummary[] = [
    { teacherId: 1, teacherName: 'Ravi Kumar', weeklyPeriods: 28, replacementLoad: 4, continuousPeriodRisk: 82, freeGapCount: 2, overloadRiskScore: 86, status: 'Overload' },
    { teacherId: 2, teacherName: 'Anitha Reddy', weeklyPeriods: 24, replacementLoad: 2, continuousPeriodRisk: 52, freeGapCount: 3, overloadRiskScore: 58, status: 'Watch' },
    { teacherId: 3, teacherName: 'Mary Thomas', weeklyPeriods: 20, replacementLoad: 1, continuousPeriodRisk: 26, freeGapCount: 1, overloadRiskScore: 32, status: 'Balanced' },
];

export default function TeacherWorkloadDashboardScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const generatedBatchId = String(params.generatedBatchId || 'DEMO');
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const [rows, setRows] = useState<TeacherWorkloadSummary[]>(generatedBatchId === 'DEMO' ? demoWorkload : []);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(generatedBatchId === 'DEMO' ? 'Demo workload intelligence loaded' : 'Loading backend workload intelligence...');

    useEffect(() => {
        let active = true;
        setLoading(true);
        getTeacherWorkloadSummary(generatedBatchId)
            .then(data => {
                if (!active) return;
                setRows(data || []);
                setStatus(data?.length ? `Backend workload loaded for ${generatedBatchId}` : `No workload rows found for ${generatedBatchId}`);
            })
            .catch(() => {
                if (!active) return;
                if (generatedBatchId === 'DEMO') {
                    setRows(demoWorkload);
                    setStatus('Backend workload API unavailable. Showing demo workload.');
                } else {
                    setRows([]);
                    setStatus('Backend workload API unavailable for this batch.');
                }
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [generatedBatchId]);

    const avgUtilization = Math.round(rows.reduce((sum, row) => sum + row.weeklyPeriods, 0) / Math.max(rows.length, 1));
    const overloadCount = rows.filter(row => row.status === 'Overload').length;
    const watchCount = rows.filter(row => row.status === 'Watch').length;
    const navParams = { sourceRole, generatedBatchId, className: params.className, section: params.section };

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <PageHeader title="Workload Intelligence" eyebrow="DAY 12 • BACKEND WORKLOAD" homePath={backHome} />
                <Text style={styles.status}>{status}</Text>
                <Text style={styles.batch}>Batch: {generatedBatchId}</Text>
                {loading ? <ActivityIndicator color={colors.primaryNavy} style={{ marginBottom: 10 }} /> : null}
                <View style={styles.summaryRow}><Kpi label="Avg Weekly" value={String(avgUtilization)} /><Kpi label="Watch" value={String(watchCount)} /><Kpi label="Overload" value={String(overloadCount)} /></View>
                {rows.length ? rows.map(row => <View key={row.teacherId} style={styles.card}><View style={styles.rowTop}><Text style={styles.teacher}>{row.teacherName}</Text><Text style={[styles.badge, row.status === 'Overload' && styles.badgeDanger, row.status === 'Watch' && styles.badgeWarn]}>{row.status}</Text></View><View style={styles.metricRow}><Metric label="Weekly Periods" value={row.weeklyPeriods} /><Metric label="Replacement" value={row.replacementLoad} /><Metric label="Gaps" value={row.freeGapCount} /></View><Text style={styles.risk}>Overload Risk Score: {row.overloadRiskScore}%</Text><View style={styles.bar}><View style={[styles.barFill, { width: `${Math.min(row.overloadRiskScore, 100)}%` }]} /></View><Text style={styles.detail}>Continuous Period Risk: {row.continuousPeriodRisk}</Text></View>) : <View style={styles.emptyCard}><Text style={styles.emptyTitle}>No workload data</Text><Text style={styles.emptyText}>Generate a timetable and open workload from the review screen to load teacher workload analysis.</Text></View>}
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/timetable-conflicts' as any, params: navParams })}><Text style={styles.primaryText}>Review Timetable Conflicts</Text></TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/timetable-review' as any, params: navParams })}><Text style={styles.secondaryText}>Return to Review</Text></TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}
function PageHeader({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) { return <View style={styles.headerRow}><TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity><View style={styles.headerTextWrap}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity></View>; }
function Kpi({ label, value }: { label: string; value: string }) { return <View style={styles.kpi}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>; }
function Metric({ label, value }: { label: string; value: number }) { return <View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ bg: { flex: 1 }, container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 30 }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 7 }, circleButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, backText: { color: colors.primaryNavy, fontSize: 40, fontWeight: '900', marginTop: -7 }, homeIcon: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 }, headerTextWrap: { flex: 1, alignItems: 'center' }, eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' }, title: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900', textAlign: 'center' }, status: { color: colors.deepGold, fontWeight: '900', marginBottom: 5 }, batch: { color: colors.slateText, fontWeight: '800', marginBottom: 10 }, summaryRow: { flexDirection: 'row', gap: 7, marginBottom: 9 }, kpi: { flex: 1, backgroundColor: colors.cardCream, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft }, kpiValue: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900' }, kpiLabel: { color: colors.mutedText, fontWeight: '800' }, card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 14, padding: 12, marginBottom: 9, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.medium }, rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, teacher: { color: colors.primaryNavy, fontSize: 13, fontWeight: '900' }, badge: { color: colors.successGreen, backgroundColor: colors.successBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden', fontWeight: '900' }, badgeDanger: { color: colors.alertRed, backgroundColor: colors.alertBg }, badgeWarn: { color: colors.warningOrange, backgroundColor: colors.warningBg }, metricRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 11 }, metricValue: { color: colors.primaryNavy, fontSize: 15, fontWeight: '900' }, metricLabel: { color: colors.mutedText, fontWeight: '700', fontSize: 9 }, risk: { color: colors.slateText, fontWeight: '800', marginTop: 10 }, detail: { color: colors.mutedText, fontWeight: '700', marginTop: 7 }, bar: { height: 7, backgroundColor: colors.divider, borderRadius: 999, marginTop: 6, overflow: 'hidden' }, barFill: { height: 7, backgroundColor: colors.premiumGold, borderRadius: 999 }, emptyCard: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 10, ...shadows.soft }, emptyTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 16 }, emptyText: { color: colors.slateText, fontWeight: '700', marginTop: 6 }, primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 13, padding: 11, alignItems: 'center', marginTop: 6 }, primaryText: { color: colors.white, fontWeight: '900' }, secondaryButton: { backgroundColor: colors.cardCream, borderRadius: 13, padding: 11, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: colors.cardGoldBorder }, secondaryText: { color: colors.primaryNavy, fontWeight: '900' } });
