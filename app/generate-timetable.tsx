import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';
import { generateTimetable } from '../src/services/timetableApi';
import { TimetableGenerationMode, TimetableGenerationRequest, TimetableGenerationResponse } from '../src/types/timetable';

const modes: TimetableGenerationMode[] = ['ANNUAL', 'QUARTERLY', 'MONTHLY', 'CUSTOM'];

export default function GenerateTimetableScreen() {
    const params = useLocalSearchParams();
    const role = String(params.role || 'ADMIN');
    const sourceRole = String(params.sourceRole || role.toLowerCase());
    const [academicYear, setAcademicYear] = useState('2026-2027');
    const [generationMode, setGenerationMode] = useState<TimetableGenerationMode>('ANNUAL');
    const [classes, setClasses] = useState('10, 9, 8');
    const [sections, setSections] = useState('A, B');
    const [teacherIds, setTeacherIds] = useState('1, 2, 3, 4, 5');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TimetableGenerationResponse | null>(null);
    const [message, setMessage] = useState('');

    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';

    const request = useMemo<TimetableGenerationRequest>(() => ({
        academicYear,
        generationMode,
        classNames: classes.split(',').map(v => v.trim()).filter(Boolean),
        sections: sections.split(',').map(v => v.trim()).filter(Boolean),
        teacherIds: teacherIds.split(',').map(v => Number(v.trim())).filter(Boolean),
        equalDistributionEnabled: true,
        workloadBalancingEnabled: true,
        fixedLabPeriodsEnabled: true,
        avoidTeacherGapsEnabled: true,
        sameTeacherContinuityEnabled: true,
        preventConsecutiveLabsEnabled: true,
    }), [academicYear, generationMode, classes, sections, teacherIds]);

    const runGeneration = async () => {
        setLoading(true);
        setMessage('');
        try {
            const data = await generateTimetable(request);
            setResult(data);
            setMessage('Live timetable generated successfully.');
        } catch {
            const demo: TimetableGenerationResponse = {
                generatedBatchId: `DEMO-${Date.now()}`,
                completionPercentage: 92,
                totalClassesScheduled: request.classNames.length * request.sections.length,
                totalEntries: 144,
                conflictsDetected: 3,
                overloadRiskTeachers: 1,
                entries: [],
                conflicts: [],
                workloadSummary: [],
            };
            setResult(demo);
            setMessage('Backend timetable API not available yet. Showing Day 9 demo generation summary.');
        } finally {
            setLoading(false);
        }
    };

    const navParams = { role, sourceRole, generatedBatchId: result?.generatedBatchId || 'DEMO' };

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <PageHeader title="Generate Timetable" eyebrow="DAY 9 • AUTO TIMETABLE" homePath={backHome} />

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Generation Setup</Text>
                    <Field label="Academic Year" value={academicYear} onChangeText={setAcademicYear} />
                    <Text style={styles.label}>Generation Mode</Text>
                    <View style={styles.modeRow}>{modes.map(m => <TouchableOpacity key={m} style={[styles.modePill, generationMode === m && styles.modePillActive]} onPress={() => setGenerationMode(m)}><Text style={[styles.modeText, generationMode === m && styles.modeTextActive]}>{m}</Text></TouchableOpacity>)}</View>
                    <Field label="Classes" value={classes} onChangeText={setClasses} />
                    <Field label="Sections" value={sections} onChangeText={setSections} />
                    <Field label="Teacher IDs" value={teacherIds} onChangeText={setTeacherIds} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Smart Rules Enabled</Text>
                    {['Equal theory distribution', 'Workload balancing', 'Fixed lab/sports handling', 'Avoid teacher gaps', 'Same teacher continuity', 'Prevent consecutive labs'].map(item => <Text key={item} style={styles.rule}>✓ {item}</Text>)}
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={runGeneration} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Generate Smart Timetable</Text>}</TouchableOpacity>
                {message ? <Text style={styles.message}>{message}</Text> : null}

                {result ? <View style={styles.card}><Text style={styles.cardTitle}>Generation Summary</Text><View style={styles.kpiGrid}><Kpi label="Completion" value={`${result.completionPercentage}%`} /><Kpi label="Classes" value={String(result.totalClassesScheduled)} /><Kpi label="Entries" value={String(result.totalEntries)} /><Kpi label="Conflicts" value={String(result.conflictsDetected)} /></View><TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/timetable-review' as any, params: navParams })}><Text style={styles.secondaryText}>Review Timetable</Text></TouchableOpacity><TouchableOpacity style={styles.linkButton} onPress={() => router.push({ pathname: '/timetable-conflicts' as any, params: navParams })}><Text style={styles.linkText}>Open Conflict Center</Text></TouchableOpacity></View> : null}
            </ScrollView>
        </ImageBackground>
    );
}

function PageHeader({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) { return <View style={styles.headerRow}><TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity><View style={styles.headerTextWrap}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity></View>; }
function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholderTextColor="#8A610D" /></View>; }
function Kpi({ label, value }: { label: string; value: string }) { return <View style={styles.kpi}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 30 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 7 },
    circleButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.primaryNavy, fontSize: 40, fontWeight: '900', marginTop: -7 },
    homeIcon: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900', textAlign: 'center' },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 11, marginBottom: 9, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.medium },
    cardTitle: { color: colors.primaryNavy, fontSize: 13, fontWeight: '900', marginBottom: 9 }, field: { marginBottom: 9 }, label: { color: colors.deepGold, fontWeight: '800', fontSize: 12, marginBottom: 6 }, input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 13, padding: 10, color: colors.darkText, fontWeight: '700', fontSize: 13 }, modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 9 }, modePill: { paddingVertical: 7, paddingHorizontal: 9, borderRadius: 999, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.cardGoldBorder }, modePillActive: { backgroundColor: colors.primaryNavy }, modeText: { color: colors.deepGold, fontWeight: '900', fontSize: 9 }, modeTextActive: { color: colors.white }, rule: { color: colors.slateText, fontWeight: '700', marginBottom: 8 }, primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 14, padding: 12, alignItems: 'center', marginBottom: 8, ...shadows.medium }, primaryText: { color: colors.white, fontWeight: '900', fontSize: 12 }, message: { color: colors.deepGold, fontWeight: '800', marginBottom: 9 }, kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, kpi: { width: '47%', backgroundColor: colors.softCream, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: colors.cardGoldBorder }, kpiValue: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900' }, kpiLabel: { color: colors.mutedText, fontWeight: '700', marginTop: 4 }, secondaryButton: { backgroundColor: colors.premiumGold, padding: 11, borderRadius: 13, alignItems: 'center', marginTop: 12 }, secondaryText: { color: colors.primaryNavy, fontWeight: '900' }, linkButton: { padding: 11, alignItems: 'center' }, linkText: { color: colors.infoBlue, fontWeight: '900' },
});
