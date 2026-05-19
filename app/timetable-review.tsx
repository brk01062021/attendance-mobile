import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';
import { getTimetableReview } from '../src/services/timetableApi';
import { TimetableClassSectionReview, TimetableEntry } from '../src/types/timetable';
import {
    buildClassSections,
    buildDemoTimetableEntries,
    createFallbackTimetableSnapshot,
    getTimetableReviewSnapshot,
    TimetableClassSection,
} from '../src/state/timetableReviewStore';

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function parseList(value: string | string[] | undefined): string[] {
    const raw = Array.isArray(value) ? value.join(',') : value || '';
    return raw.split(',').map(item => item.trim()).filter(Boolean);
}

function flattenReviewEntries(rows: TimetableClassSectionReview[]): TimetableEntry[] {
    return rows.flatMap(row => (row.entries || []).map(entry => ({
        ...entry,
        className: entry.className || row.className,
        section: entry.section || row.section,
    })));
}

export default function TimetableReviewScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const generatedBatchId = String(params.generatedBatchId || 'DEMO');
    const snapshot = getTimetableReviewSnapshot();

    const fallbackClassSections = useMemo<TimetableClassSection[]>(() => {
        if (snapshot?.classSections?.length) return snapshot.classSections;
        const classNames = parseList(params.classNames);
        const sections = parseList(params.sections);
        const fromParams = buildClassSections(classNames, sections);
        return fromParams.length ? fromParams : createFallbackTimetableSnapshot().classSections;
    }, [params.classNames, params.sections, snapshot]);

    const fallbackEntries = useMemo<TimetableEntry[]>(() => {
        if (snapshot?.entries?.length) return snapshot.entries;
        return buildDemoTimetableEntries(fallbackClassSections);
    }, [fallbackClassSections, snapshot]);

    const [selectedDay, setSelectedDay] = useState('MONDAY');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [classSections, setClassSections] = useState<TimetableClassSection[]>(fallbackClassSections);
    const [entries, setEntries] = useState<TimetableEntry[]>(fallbackEntries);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(snapshot ? 'Generated timetable review loaded' : 'Dynamic review loaded');

    useEffect(() => {
        setClassSections(fallbackClassSections);
        setEntries(fallbackEntries);
        setSelectedIndex(0);
    }, [fallbackClassSections, fallbackEntries]);

    useEffect(() => {
        if (!generatedBatchId || generatedBatchId === 'DEMO' || generatedBatchId.startsWith('DAY')) return;
        let active = true;
        setLoading(true);
        getTimetableReview(generatedBatchId)
            .then(rows => {
                if (!active) return;
                if (rows?.length) {
                    const apiClassSections = rows.map(row => ({
                        className: row.className,
                        section: row.section,
                        label: row.label || `${row.className}-${row.section}`,
                    }));
                    const apiEntries = flattenReviewEntries(rows);
                    setClassSections(apiClassSections);
                    setEntries(apiEntries.length ? apiEntries : fallbackEntries);
                    setSelectedIndex(0);
                    setStatus(`Backend review loaded for batch ${generatedBatchId}`);
                } else {
                    setStatus(`Backend review returned no class-section rows for ${generatedBatchId}`);
                }
            })
            .catch(() => setStatus('Backend review API unavailable. Showing generated snapshot/demo data.'))
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [fallbackEntries, generatedBatchId]);

    const selectedClassSection = classSections[selectedIndex] || classSections[0];
    const selectedEntries = entries.filter(entry => entry.className === selectedClassSection?.className && entry.section === selectedClassSection?.section);
    const dayEntries = selectedEntries.filter(entry => entry.dayOfWeek === selectedDay).sort((a, b) => a.periodNumber - b.periodNumber);
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const navParams = { sourceRole, generatedBatchId, className: selectedClassSection?.className, section: selectedClassSection?.section };

    const goPreviousClass = () => setSelectedIndex(prev => (prev === 0 ? classSections.length - 1 : prev - 1));
    const goNextClass = () => setSelectedIndex(prev => (prev + 1) % Math.max(classSections.length, 1));

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <PageHeader title="Timetable Review" eyebrow="DAY 13 • CONFLICT-FREE REVIEW" homePath={backHome} />
                <Text style={styles.status}>{status}</Text>
                <Text style={styles.batch}>Batch: {generatedBatchId}</Text>
                {loading ? <ActivityIndicator color={colors.primaryNavy} style={{ marginBottom: 10 }} /> : null}

                <View style={styles.summaryRow}>
                    <Kpi label="Class Sections" value={String(classSections.length)} />
                    <Kpi label="Periods" value={String(entries.length)} />
                    <Kpi label="Conflicts" value={String(entries.filter(entry => entry.conflict).length)} />
                </View>

                <View style={styles.dayRow}>
                    {days.map(day => (
                        <TouchableOpacity key={day} style={[styles.dayPill, selectedDay === day && styles.dayPillActive]} onPress={() => setSelectedDay(day)}>
                            <Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day.slice(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Generated Class-Sections</Text>
                        <Text style={styles.countBadge}>{classSections.length} groups</Text>
                    </View>
                    <View style={styles.classSectionGrid}>
                        {classSections.map((item, index) => (
                            <TouchableOpacity key={`${item.className}-${item.section}`} style={[styles.classSectionChip, selectedIndex === index && styles.classSectionChipActive]} onPress={() => setSelectedIndex(index)}>
                                <Text style={[styles.classSectionText, selectedIndex === index && styles.classSectionTextActive]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.stepperRow}>
                        <TouchableOpacity style={styles.stepperButton} onPress={goPreviousClass}><Text style={styles.stepperText}>Previous</Text></TouchableOpacity>
                        <Text style={styles.currentClassText}>{selectedClassSection?.label || 'No Class'}</Text>
                        <TouchableOpacity style={styles.stepperButton} onPress={goNextClass}><Text style={styles.stepperText}>Next</Text></TouchableOpacity>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{selectedClassSection?.label || 'Class'} • {selectedDay}</Text>
                    {dayEntries.length ? dayEntries.map(entry => (
                        <View key={String(entry.id)} style={[styles.periodRow, entry.conflict && styles.conflictRow]}>
                            <View style={styles.periodBadge}><Text style={styles.periodBadgeText}>P{entry.periodNumber}</Text></View>
                            <View style={styles.periodInfo}>
                                <Text style={styles.subject}>{entry.subjectName}</Text>
                                <Text style={styles.teacher}>{entry.teacherName || 'Teacher not assigned'}</Text>
                                <Text style={styles.teacher}>{entry.roomNumber || 'Room auto assigned'}</Text>
                            </View>
                            {entry.conflict ? <Text style={styles.flag}>Review</Text> : null}
                        </View>
                    )) : <Text style={styles.emptyText}>No periods found for this day.</Text>}
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/teacher-workload-dashboard' as any, params: navParams })}><Text style={styles.primaryText}>Workload</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/timetable-conflicts' as any, params: navParams })}><Text style={styles.primaryText}>Conflicts</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.homeButton} onPress={() => router.replace(backHome as any)}><Text style={styles.homeText}>Back to Home</Text></TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}

function PageHeader({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) { return <View style={styles.headerRow}><TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity><View style={styles.headerTextWrap}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity></View>; }
function Kpi({ label, value }: { label: string; value: string }) { return <View style={styles.kpi}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
    bg: { flex: 1 }, container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 32 }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 7 }, circleButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, backText: { color: colors.primaryNavy, fontSize: 40, fontWeight: '900', marginTop: -7 }, homeIcon: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 }, headerTextWrap: { flex: 1, alignItems: 'center' }, eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' }, title: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900', textAlign: 'center' }, status: { color: colors.deepGold, fontWeight: '900', marginBottom: 5 }, batch: { color: colors.slateText, fontWeight: '800', marginBottom: 10 }, summaryRow: { flexDirection: 'row', gap: 7, marginBottom: 10 }, kpi: { flex: 1, backgroundColor: colors.cardCream, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft }, kpiValue: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900' }, kpiLabel: { color: colors.mutedText, fontWeight: '800', fontSize: 10 }, dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }, dayPill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.cardCream, borderWidth: 1, borderColor: colors.cardGoldBorder }, dayPillActive: { backgroundColor: colors.primaryNavy }, dayText: { color: colors.deepGold, fontWeight: '900' }, dayTextActive: { color: colors.white }, card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 10, ...shadows.medium }, cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 9 }, cardTitle: { color: colors.primaryNavy, fontSize: 13, fontWeight: '900' }, countBadge: { color: colors.deepGold, fontSize: 10, fontWeight: '900' }, classSectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, classSectionChip: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.cardGoldBorder }, classSectionChipActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy }, classSectionText: { color: colors.deepGold, fontWeight: '900', fontSize: 11 }, classSectionTextActive: { color: colors.white }, stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 }, stepperButton: { flex: 1, backgroundColor: colors.cardCream, borderRadius: 13, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.cardGoldBorder }, stepperText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 11 }, currentClassText: { flex: 1, textAlign: 'center', color: colors.deepGold, fontWeight: '900', fontSize: 11 }, periodRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, backgroundColor: colors.white, marginBottom: 8, borderWidth: 1, borderColor: colors.divider }, conflictRow: { borderColor: colors.alertRed, backgroundColor: colors.alertBg }, periodBadge: { width: 35, height: 35, borderRadius: 14, backgroundColor: colors.primaryNavy, alignItems: 'center', justifyContent: 'center' }, periodBadgeText: { color: colors.white, fontWeight: '900' }, periodInfo: { flex: 1, marginLeft: 9 }, subject: { color: colors.primaryNavy, fontSize: 12, fontWeight: '900' }, teacher: { color: colors.mutedText, fontWeight: '700', marginTop: 3 }, flag: { color: colors.deepGold, fontWeight: '900', fontSize: 11 }, emptyText: { color: colors.mutedText, fontWeight: '800', padding: 12, textAlign: 'center' }, actionRow: { flexDirection: 'row', gap: 9, marginTop: 2 }, primaryButton: { flex: 1, backgroundColor: colors.primaryNavy, borderRadius: 13, padding: 11, alignItems: 'center' }, primaryText: { color: colors.white, fontWeight: '900' }, homeButton: { marginTop: 10, alignItems: 'center', padding: 11 }, homeText: { color: colors.infoBlue, fontWeight: '900' },
});
