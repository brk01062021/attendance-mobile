import React, { useEffect, useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';
import { getClassTimetable } from '../src/services/timetableApi';
import { TimetableEntry } from '../src/types/timetable';

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const demoEntries: TimetableEntry[] = days.flatMap((day, dayIndex) => [1, 2, 3, 4, 5, 6].map(period => ({
    id: `${day}-${period}`, className: '10', section: 'A', subjectName: ['Maths', 'Science', 'English', 'Social', 'Telugu', 'Sports'][(period + dayIndex) % 6], teacherName: ['Ravi Kumar', 'Anitha Reddy', 'Suresh Babu', 'Mary Thomas'][(period + dayIndex) % 4], dayOfWeek: day, periodNumber: period, roomNumber: period === 6 ? 'Ground' : 'Room 10A', isSports: period === 6, conflict: day === 'WEDNESDAY' && period === 3,
})));

export default function TimetableReviewScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const [selectedDay, setSelectedDay] = useState('MONDAY');
    const [entries, setEntries] = useState<TimetableEntry[]>(demoEntries);
    const [status, setStatus] = useState('Demo review loaded');

    useEffect(() => { getClassTimetable('10', 'A').then(data => { if (data?.length) { setEntries(data); setStatus('Live class timetable loaded'); } }).catch(() => setStatus('Backend review API not available yet. Showing Day 9 demo timetable.')); }, []);

    const dayEntries = entries.filter(entry => entry.dayOfWeek === selectedDay).sort((a, b) => a.periodNumber - b.periodNumber);
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const navParams = { sourceRole };

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <PageHeader title="Timetable Review" eyebrow="CLASS 10-A SCHEDULE" homePath={backHome} />
                <Text style={styles.status}>{status}</Text>
                <View style={styles.dayRow}>{days.map(day => <TouchableOpacity key={day} style={[styles.dayPill, selectedDay === day && styles.dayPillActive]} onPress={() => setSelectedDay(day)}><Text style={[styles.dayText, selectedDay === day && styles.dayTextActive]}>{day.slice(0, 3)}</Text></TouchableOpacity>)}</View>
                <View style={styles.card}>{dayEntries.map(entry => <View key={String(entry.id)} style={[styles.periodRow, entry.conflict && styles.conflictRow]}><View style={styles.periodBadge}><Text style={styles.periodBadgeText}>P{entry.periodNumber}</Text></View><View style={styles.periodInfo}><Text style={styles.subject}>{entry.subjectName}</Text><Text style={styles.teacher}>{entry.teacherName} • {entry.roomNumber || 'Room not set'}</Text></View><Text style={styles.flag}>{entry.conflict ? '⚠️' : entry.isLab ? 'Lab' : entry.isSports ? 'Sports' : 'OK'}</Text></View>)}</View>
                <View style={styles.actionRow}><TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/teacher-workload-dashboard' as any, params: navParams })}><Text style={styles.primaryText}>Workload</Text></TouchableOpacity><TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/timetable-conflicts' as any, params: navParams })}><Text style={styles.primaryText}>Conflicts</Text></TouchableOpacity></View>
                <TouchableOpacity style={styles.homeButton} onPress={() => router.replace(backHome as any)}><Text style={styles.homeText}>Back to {sourceRole === 'principal' ? 'Principal' : 'Admin'} Home</Text></TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}

function PageHeader({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) { return <View style={styles.headerRow}><TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity><View style={styles.headerTextWrap}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity></View>; }

const styles = StyleSheet.create({
    bg: { flex: 1 }, container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 30 }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 7 }, circleButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, backText: { color: colors.primaryNavy, fontSize: 40, fontWeight: '900', marginTop: -7 }, homeIcon: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 }, headerTextWrap: { flex: 1, alignItems: 'center' }, eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' }, title: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900', textAlign: 'center' }, status: { color: colors.deepGold, fontWeight: '800', marginBottom: 8 }, dayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 8 }, dayPill: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.cardCream, borderWidth: 1, borderColor: colors.cardGoldBorder }, dayPillActive: { backgroundColor: colors.primaryNavy }, dayText: { color: colors.deepGold, fontWeight: '900' }, dayTextActive: { color: colors.white }, card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.medium }, periodRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, backgroundColor: colors.white, marginBottom: 8, borderWidth: 1, borderColor: colors.divider }, conflictRow: { borderColor: colors.alertRed, backgroundColor: colors.alertBg }, periodBadge: { width: 35, height: 35, borderRadius: 14, backgroundColor: colors.primaryNavy, alignItems: 'center', justifyContent: 'center' }, periodBadgeText: { color: colors.white, fontWeight: '900' }, periodInfo: { flex: 1, marginLeft: 9 }, subject: { color: colors.primaryNavy, fontSize: 12, fontWeight: '900' }, teacher: { color: colors.mutedText, fontWeight: '700', marginTop: 3 }, flag: { color: colors.deepGold, fontWeight: '900' }, actionRow: { flexDirection: 'row', gap: 9, marginTop: 12 }, primaryButton: { flex: 1, backgroundColor: colors.primaryNavy, borderRadius: 13, padding: 11, alignItems: 'center' }, primaryText: { color: colors.white, fontWeight: '900' }, homeButton: { marginTop: 10, alignItems: 'center', padding: 11 }, homeText: { color: colors.infoBlue, fontWeight: '900' },
});
