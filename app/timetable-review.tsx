import React, { useEffect, useMemo, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';
import { getClassTimetable } from '../src/services/timetableApi';
import { TimetableEntry } from '../src/types/timetable';
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

export default function TimetableReviewScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const generatedBatchId = String(params.generatedBatchId || 'DEMO');
    const snapshot = getTimetableReviewSnapshot();

    const resolvedClassSections = useMemo<TimetableClassSection[]>(() => {
        if (snapshot?.classSections?.length) return snapshot.classSections;
        const classNames = parseList(params.classNames);
        const sections = parseList(params.sections);
        const fromParams = buildClassSections(classNames, sections);
        return fromParams.length ? fromParams : createFallbackTimetableSnapshot().classSections;
    }, [params.classNames, params.sections, snapshot]);

    const initialEntries = useMemo<TimetableEntry[]>(() => {
        if (snapshot?.entries?.length) return snapshot.entries;
        return buildDemoTimetableEntries(resolvedClassSections);
    }, [resolvedClassSections, snapshot]);

    const [selectedDay, setSelectedDay] = useState('MONDAY');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [entries, setEntries] = useState<TimetableEntry[]>(initialEntries);
    const [status, setStatus] = useState(snapshot ? 'Generated timetable review loaded' : 'Dynamic demo review loaded');

    const selectedClassSection = resolvedClassSections[selectedIndex] || resolvedClassSections[0];

    useEffect(() => {
        setEntries(initialEntries);
        setSelectedIndex(0);
    }, [initialEntries]);

    useEffect(() => {
        if (!selectedClassSection) return;
        let active = true;
        getClassTimetable(selectedClassSection.className, selectedClassSection.section)
            .then(data => {
                if (!active) return;
                if (data?.length) {
                    const otherEntries = initialEntries.filter(entry => entry.className !== selectedClassSection.className || entry.section !== selectedClassSection.section);
                    setEntries([...otherEntries, ...data]);
                    setStatus(`Live timetable loaded for Class ${selectedClassSection.label}`);
                } else {
                    setStatus(`Generated review loaded for Class ${selectedClassSection.label}`);
                }
            })
            .catch(() => setStatus(`Generated review loaded for Class ${selectedClassSection.label}. Backend class API not available yet.`));
        return () => { active = false; };
    }, [initialEntries, selectedClassSection]);

    const selectedEntries = entries.filter(entry => entry.className === selectedClassSection?.className && entry.section === selectedClassSection?.section);
    const dayEntries = selectedEntries.filter(entry => entry.dayOfWeek === selectedDay).sort((a, b) => a.periodNumber - b.periodNumber);
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const navParams = { sourceRole, generatedBatchId, className: selectedClassSection?.className, section: selectedClassSection?.section };

    const goPreviousClass = () => setSelectedIndex(prev => (prev === 0 ? resolvedClassSections.length - 1 : prev - 1));
    const goNextClass = () => setSelectedIndex(prev => (prev + 1) % resolvedClassSections.length);

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <PageHeader title="Timetable Review" eyebrow="DAY 11 • DYNAMIC CLASS-SECTION REVIEW" homePath={backHome} />
                <Text style={styles.status}>{status}</Text>

                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Generated Batch</Text>
                    <Text style={styles.summaryValue}>{generatedBatchId}</Text>
                    <Text style={styles.summaryMeta}>{resolvedClassSections.length} class-sections ready for review</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Class-Section Switcher</Text>
                        <Text style={styles.countBadge}>{selectedIndex + 1}/{resolvedClassSections.length}</Text>
                    </View>
                    <View style={styles.classSectionGrid}>
                        {resolvedClassSections.map((item, index) => {
                            const active = index === selectedIndex;
                            return (
                                <TouchableOpacity key={item.label} style={[styles.classSectionChip, active && styles.classSectionChipActive]} onPress={() => setSelectedIndex(index)}>
                                    <Text style={[styles.classSectionText, active && styles.classSectionTextActive]}>Class {item.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <View style={styles.stepperRow}>
                        <TouchableOpacity style={styles.stepperButton} onPress={goPreviousClass}><Text style={styles.stepperText}>‹ Previous</Text></TouchableOpacity>
                        <Text style={styles.currentClassText}>Class {selectedClassSection?.label}</Text>
                        <TouchableOpacity style={styles.stepperButton} onPress={goNextClass}><Text style={styles.stepperText}>Next ›</Text></TouchableOpacity>
                    </View>
                </View>

                <View style={styles.dayRow}>{days.map(day => <TouchableOpacity key={day} style={[styles.dayPill, selectedDay === day && styles.dayPillActive]} onPress={() => setSelectedDay(day)}><Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day.slice(0, 3)}</Text></TouchableOpacity>)}</View>

                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Class {selectedClassSection?.label} • {selectedDay}</Text>
                        <Text style={styles.countBadge}>{dayEntries.length} periods</Text>
                    </View>
                    {dayEntries.length ? dayEntries.map(entry => <View key={String(entry.id)} style={[styles.periodRow, entry.conflict && styles.conflictRow]}><View style={styles.periodBadge}><Text style={styles.periodBadgeText}>P{entry.periodNumber}</Text></View><View style={styles.periodInfo}><Text style={styles.subject}>{entry.subjectName}</Text><Text style={styles.teacher}>{entry.teacherName} • {entry.roomNumber || 'Room not set'}</Text></View><Text style={styles.flag}>{entry.conflict ? '⚠️' : entry.isLab ? 'Lab' : entry.isSports ? 'Sports' : 'OK'}</Text></View>) : <Text style={styles.emptyText}>No periods available for this day.</Text>}
                </View>

                <View style={styles.actionRow}><TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/teacher-workload-dashboard' as any, params: navParams })}><Text style={styles.primaryText}>Workload</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/timetable-conflicts' as any, params: navParams })}><Text style={styles.primaryText}>Conflicts</Text></TouchableOpacity></View>
                <TouchableOpacity style={styles.homeButton} onPress={() => router.replace(backHome as any)}><Text style={styles.homeText}>Back to {sourceRole === 'principal' ? 'Principal' : 'Admin'} Home</Text></TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}

function PageHeader({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) { return <View style={styles.headerRow}><TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity><View style={styles.headerTextWrap}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity></View>; }

const styles = StyleSheet.create({
    bg: { flex: 1 }, container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 30 }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 7 }, circleButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, backText: { color: colors.primaryNavy, fontSize: 40, fontWeight: '900', marginTop: -7 }, homeIcon: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 }, headerTextWrap: { flex: 1, alignItems: 'center' }, eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' }, title: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900', textAlign: 'center' }, status: { color: colors.deepGold, fontWeight: '800', marginBottom: 8, lineHeight: 17 }, summaryCard: { backgroundColor: 'rgba(13,37,63,0.92)', borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.premiumGold, ...shadows.medium }, summaryTitle: { color: colors.premiumGold, fontWeight: '900', fontSize: 10, letterSpacing: 1 }, summaryValue: { color: colors.white, fontWeight: '900', fontSize: 15, marginTop: 5 }, summaryMeta: { color: colors.cardCream, fontWeight: '700', fontSize: 11, marginTop: 4 }, dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }, dayPill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.cardCream, borderWidth: 1, borderColor: colors.cardGoldBorder }, dayPillActive: { backgroundColor: colors.primaryNavy }, dayText: { color: colors.deepGold, fontWeight: '900' }, dayTextActive: { color: colors.white }, card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 10, ...shadows.medium }, cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 9 }, cardTitle: { color: colors.primaryNavy, fontSize: 13, fontWeight: '900' }, countBadge: { color: colors.deepGold, fontSize: 10, fontWeight: '900' }, classSectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, classSectionChip: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.cardGoldBorder }, classSectionChipActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy }, classSectionText: { color: colors.deepGold, fontWeight: '900', fontSize: 11 }, classSectionTextActive: { color: colors.white }, stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 }, stepperButton: { flex: 1, backgroundColor: colors.cardCream, borderRadius: 13, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.cardGoldBorder }, stepperText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 11 }, currentClassText: { flex: 1, textAlign: 'center', color: colors.deepGold, fontWeight: '900', fontSize: 11 }, periodRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, backgroundColor: colors.white, marginBottom: 8, borderWidth: 1, borderColor: colors.divider }, conflictRow: { borderColor: colors.alertRed, backgroundColor: colors.alertBg }, periodBadge: { width: 35, height: 35, borderRadius: 14, backgroundColor: colors.primaryNavy, alignItems: 'center', justifyContent: 'center' }, periodBadgeText: { color: colors.white, fontWeight: '900' }, periodInfo: { flex: 1, marginLeft: 9 }, subject: { color: colors.primaryNavy, fontSize: 12, fontWeight: '900' }, teacher: { color: colors.mutedText, fontWeight: '700', marginTop: 3 }, flag: { color: colors.deepGold, fontWeight: '900', fontSize: 11 }, emptyText: { color: colors.mutedText, fontWeight: '800', padding: 12, textAlign: 'center' }, actionRow: { flexDirection: 'row', gap: 9, marginTop: 2 }, primaryButton: { flex: 1, backgroundColor: colors.primaryNavy, borderRadius: 13, padding: 11, alignItems: 'center' }, primaryText: { color: colors.white, fontWeight: '900' }, homeButton: { marginTop: 10, alignItems: 'center', padding: 11 }, homeText: { color: colors.infoBlue, fontWeight: '900' },
});
