import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getLiveTimetable, getTimetableRoleNotifications } from '../src/services/timetableOperationsApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableEntry, TimetableLiveResponse } from '../src/types/timetable';

export default function TimetableLiveScreen() {
    const params = useLocalSearchParams();
    const [batchId, setBatchId] = useState(String(params.batchId || params.generatedBatchId || ''));
    const [role, setRole] = useState(String(params.role || 'TEACHER').toUpperCase());
    const [teacherId, setTeacherId] = useState(String(params.teacherId || ''));
    const [className, setClassName] = useState(String(params.className || '1'));
    const [section, setSection] = useState(String(params.section || 'A'));
    const [data, setData] = useState<TimetableLiveResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Load published timetable visibility for teacher, student, or parent.');
    const [notifications, setNotifications] = useState<any[]>([]);

    const load = async () => {
        setLoading(true);
        try {
            const response = await getLiveTimetable({
                batchId: batchId.trim().toUpperCase(),
                role,
                teacherId: teacherId ? Number(teacherId) : undefined,
                className,
                section,
            });
            setData(response);
            setMessage(response.message);
            const noticeResponse = await getTimetableRoleNotifications(role);
            setNotifications(noticeResponse || []);
        } catch {
            setMessage('Unable to load live timetable. Confirm backend and batch ID.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                <View style={styles.headerTextWrap}><Text style={styles.eyebrow}>LIVE TIMETABLE</Text><Text style={styles.title}>Live Timetable</Text></View>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homeRouteForRole(String(params.sourceRole || role)) as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
            </View>

            <View style={styles.heroCard}><Text style={styles.heroTitle}>{data?.visibilityScope || role} Timetable</Text><Text style={styles.heroText}>{message}</Text></View>

            <View style={styles.card}>
                <Text style={styles.label}>Batch ID</Text><TextInput value={batchId} onChangeText={setBatchId} autoCapitalize="characters" style={styles.input} placeholder="TT-99266EBB" placeholderTextColor={colors.mutedText} />
                <Text style={styles.label}>Role</Text><TextInput value={role} onChangeText={setRole} autoCapitalize="characters" style={styles.input} placeholder="TEACHER / STUDENT / PARENT" placeholderTextColor={colors.mutedText} />
                <View style={styles.row}>
                    <View style={styles.half}><Text style={styles.label}>Teacher ID</Text><TextInput value={teacherId} onChangeText={setTeacherId} keyboardType="number-pad" style={styles.input} placeholder="Optional" placeholderTextColor={colors.mutedText} /></View>
                    <View style={styles.half}><Text style={styles.label}>Class / Section</Text><TextInput value={`${className}-${section}`} onChangeText={(value) => { const parts = value.split('-'); setClassName(parts[0] || ''); setSection(parts[1] || ''); }} style={styles.input} placeholder="1-A" placeholderTextColor={colors.mutedText} /></View>
                </View>
                <TouchableOpacity style={styles.primaryButton} onPress={load}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Load Live Timetable</Text>}</TouchableOpacity>
            </View>

            {data ? <View style={styles.statusRow}><Pill text={data.published ? 'Published' : 'Hidden'} /><Pill text={data.locked ? 'Locked' : 'Unlocked'} /><Pill text={`${data.entries.length} periods`} /></View> : null}
            {groupEntries(data?.entries || []).map(group => <View key={group.day} style={styles.card}>
                <Text style={styles.cardTitle}>{group.day}</Text>
                {group.entries.map(entry => <View key={`${entry.id}-${entry.periodNumber}`} style={styles.entryRow}>
                    <Text style={styles.period}>P{entry.periodNumber}</Text>
                    <View style={{ flex: 1 }}><Text style={styles.subject}>{entry.subjectName}</Text><Text style={styles.meta}>{entry.className}-{entry.section} • {entry.teacherName} • {entry.startTime || ''}</Text></View>
                </View>)}
            </View>)}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Timetable Notification Center</Text>
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

function homeRouteForRole(role: string) {
    const normalized = role.toUpperCase();
    if (normalized.includes('PARENT')) return '/parent-dashboard';
    if (normalized.includes('STUDENT')) return '/student-dashboard';
    if (normalized.includes('PRINCIPAL')) return '/principal-dashboard';
    if (normalized.includes('ADMIN')) return '/admin-dashboard';
    return '/teacher-dashboard';
}

function groupEntries(entries: TimetableEntry[]) {
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days.map(day => ({ day, entries: entries.filter(item => item.dayOfWeek === day).sort((a, b) => a.periodNumber - b.periodNumber) })).filter(group => group.entries.length > 0);
}
function Pill({ text }: { text: string }) { return <View style={styles.pill}><Text style={styles.pillText}>{text}</Text></View>; }

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
    input: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: 14, paddingVertical: 12, color: colors.primaryNavy, fontWeight: '900', marginBottom: 10 },
    row: { flexDirection: 'row', gap: 10 },
    half: { flex: 1 },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 15, padding: 14, alignItems: 'center' },
    primaryText: { color: colors.white, fontWeight: '900' },
    statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    pill: { backgroundColor: colors.primaryNavy, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
    pillText: { color: colors.white, fontWeight: '900' },
    cardTitle: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900', marginBottom: 10 },
    entryRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.divider },
    period: { color: colors.deepGold, fontWeight: '900', width: 34 },
    subject: { color: colors.primaryNavy, fontWeight: '900' },
    meta: { color: colors.slateText, fontWeight: '700', marginTop: 3 },
});
