import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getSession, normalizeSchoolId } from '../src/services/sessionService';
import { getLiveTimetable, getTimetableRoleNotifications } from '../src/services/timetableOperationsApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableEntry, TimetableLiveResponse } from '../src/types/timetable';

const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const todayIndex = new Date().getDay() - 1;
const defaultDay = days[todayIndex >= 0 && todayIndex < days.length ? todayIndex : 0];

export default function TimetableLiveScreen() {
    const params = useLocalSearchParams();
    const session = getSession();
    const role = String(params.role || session?.role || 'TEACHER').toUpperCase();
    const schoolId = normalizeSchoolId(String(params.schoolId || session?.schoolId || ''));
    const teacherId = Number(params.teacherId || session?.teacherId || (role === 'TEACHER' ? session?.userId : 0) || 0) || undefined;
    const className = String(params.className || '10');
    const section = String(params.section || 'A');

    const [data, setData] = useState<TimetableLiveResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Loading latest published timetable visibility.');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState(defaultDay);
    const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const response = await getLiveTimetable({
                role,
                teacherId: role === 'TEACHER' ? teacherId : undefined,
                className: role === 'TEACHER' ? undefined : className,
                section: role === 'TEACHER' ? undefined : section,
                schoolId,
            });
            setData(response);
            setMessage(response.message);
            setSelectedEntry(response.entries?.[0] || null);
            const noticeResponse = await getTimetableRoleNotifications(role, schoolId);
            setNotifications(noticeResponse || []);
        } catch {
            setMessage('Unable to load published timetable. Confirm backend is running and the timetable has been published.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const dailyEntries = useMemo(() => (data?.entries || []).filter(item => item.dayOfWeek === selectedDay).sort((a, b) => a.periodNumber - b.periodNumber), [data?.entries, selectedDay]);
    const weekly = useMemo(() => days.map(day => ({ day, count: (data?.entries || []).filter(item => item.dayOfWeek === day).length })), [data?.entries]);
    const title = role.includes('PARENT') ? 'Child Timetable' : role.includes('STUDENT') ? 'Student Timetable' : 'My Timetable';

    return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                <View style={styles.headerTextWrap}><Text style={styles.eyebrow}>PUBLISHED TIMETABLE ONLY</Text><Text style={styles.title}>{title}</Text></View>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homeRouteForRole(String(params.sourceRole || role)) as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
            </View>

            <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>{data?.published ? 'Live Published Schedule' : 'Timetable Hidden Until Publish'}</Text>
                <Text style={styles.heroText}>{message}</Text>
            </View>

            <View style={styles.statusRow}>
                <Pill text={data?.published ? 'Published visible' : loading ? 'Loading' : 'Hidden'} />
                <Pill text="Latest published only" />
                <Pill text={`${data?.entries?.length || 0} periods`} />
            </View>

            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <View><Text style={styles.label}>Daily Timetable</Text><Text style={styles.cardTitle}>{formatDay(selectedDay)} Schedule</Text></View>
                    {loading ? <ActivityIndicator color={colors.primaryNavy} /> : <TouchableOpacity style={styles.smallButton} onPress={load}><Text style={styles.smallButtonText}>Refresh</Text></TouchableOpacity>}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayTabs}>
                    {days.map(day => <TouchableOpacity key={day} style={[styles.dayTab, selectedDay === day && styles.dayTabActive]} onPress={() => setSelectedDay(day)}><Text style={[styles.dayTabText, selectedDay === day && styles.dayTabTextActive]}>{day.slice(0, 3)}</Text></TouchableOpacity>)}
                </ScrollView>
                {dailyEntries.length === 0 ? <Text style={styles.meta}>No published periods visible for this day.</Text> : dailyEntries.map(entry => <TouchableOpacity key={`${entry.id}-${entry.periodNumber}`} style={styles.entryRow} onPress={() => setSelectedEntry(entry)}>
                    <Text style={styles.period}>P{entry.periodNumber}</Text>
                    <View style={{ flex: 1 }}><Text style={styles.subject}>{entry.subjectName}</Text><Text style={styles.meta}>{entry.className}-{entry.section} • {entry.teacherName} • {entry.startTime || '--'}-{entry.endTime || '--'}</Text></View>
                </TouchableOpacity>)}
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Weekly Timetable</Text>
                <View style={styles.weekGrid}>{weekly.map(item => <View key={item.day} style={styles.weekCell}><Text style={styles.weekDay}>{item.day.slice(0, 3)}</Text><Text style={styles.weekCount}>{item.count}</Text><Text style={styles.weekMeta}>periods</Text></View>)}</View>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Period Details</Text>
                {selectedEntry ? <>
                    <Text style={styles.cardTitle}>P{selectedEntry.periodNumber} • {selectedEntry.subjectName}</Text>
                    <Text style={styles.meta}>{selectedEntry.dayOfWeek} • {selectedEntry.startTime || '--'}-{selectedEntry.endTime || '--'}</Text>
                    <Text style={styles.meta}>{selectedEntry.className}-{selectedEntry.section} • {selectedEntry.teacherName}</Text>
                    {selectedEntry.roomNumber ? <Text style={styles.meta}>Room: {selectedEntry.roomNumber}</Text> : null}
                </> : <Text style={styles.meta}>Select a visible published period to view details.</Text>}
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Timetable Alerts</Text>
                {notifications.length === 0 ? <Text style={styles.meta}>No timetable alerts yet.</Text> : notifications.slice(0, 5).map((notice: any) => (
                    <View key={notice.notificationId} style={styles.entryRow}>
                        <Text style={styles.period}>•</Text>
                        <View style={{ flex: 1 }}><Text style={styles.subject}>{notice.title}</Text><Text style={styles.meta}>{notice.message}</Text></View>
                    </View>
                ))}
            </View>
        </ScrollView>
    </ImageBackground>;
}

function formatDay(day: string) { return day.charAt(0) + day.slice(1).toLowerCase(); }
function homeRouteForRole(role: string) {
    const normalized = role.toUpperCase();
    if (normalized.includes('PARENT')) return '/parent-dashboard';
    if (normalized.includes('STUDENT')) return '/student-dashboard';
    if (normalized.includes('PRINCIPAL')) return '/principal-dashboard';
    if (normalized.includes('ADMIN')) return '/admin-dashboard';
    return '/teacher-dashboard';
}
function Pill({ text }: { text: string }) { return <View style={styles.pill}><Text style={styles.pillText}>{text}</Text></View>; }

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
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
    label: { color: colors.deepGold, fontWeight: '900', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
    cardTitle: { color: colors.primaryNavy, fontSize: 17, fontWeight: '900', marginBottom: 8 },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    pill: { backgroundColor: colors.primaryNavy, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    pillText: { color: colors.white, fontWeight: '900', fontSize: 11 },
    dayTabs: { gap: 8, paddingVertical: 10 },
    dayTab: { borderRadius: 999, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: colors.white },
    dayTabActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy },
    dayTabText: { color: colors.primaryNavy, fontWeight: '900' },
    dayTabTextActive: { color: colors.white },
    entryRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.divider },
    period: { color: colors.deepGold, fontWeight: '900', width: 34 },
    subject: { color: colors.primaryNavy, fontWeight: '900' },
    meta: { color: colors.slateText, fontWeight: '700', marginTop: 3, lineHeight: 19 },
    smallButton: { borderRadius: 999, backgroundColor: colors.primaryNavy, paddingHorizontal: 13, paddingVertical: 8 },
    smallButtonText: { color: colors.white, fontWeight: '900', fontSize: 11 },
    weekGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    weekCell: { width: '31%', minWidth: 92, backgroundColor: colors.white, borderRadius: 15, borderWidth: 1, borderColor: colors.cardGoldBorder, padding: 10 },
    weekDay: { color: colors.deepGold, fontWeight: '900', fontSize: 11 },
    weekCount: { color: colors.primaryNavy, fontWeight: '900', fontSize: 22 },
    weekMeta: { color: colors.slateText, fontWeight: '800', fontSize: 11 },
});
