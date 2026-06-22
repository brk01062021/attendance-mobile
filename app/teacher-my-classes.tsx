import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { images } from '../src/constants/images';
import { getSession, normalizeSchoolId } from '../src/services/sessionService';
import { getLiveTimetable } from '../src/services/timetableOperationsApi';
import { colors, shadows } from '../src/theme';
import { TimetableEntry } from '../src/types/timetable';

type ClassSummary = {
  key: string;
  className: string;
  section: string;
  subjectName: string;
  periods: number;
};

export default function TeacherMyClassesScreen() {
  const params = useLocalSearchParams();
  const session = getSession();
  const teacherId = Number(params.teacherId || session?.teacherId || session?.userId || 0) || undefined;
  const teacherName = String(params.teacherName || session?.displayName || 'Teacher');
  const schoolId = normalizeSchoolId(String(params.schoolId || session?.schoolId || ''));
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Loading assigned classes from active published timetable.');

  const load = async () => {
    setLoading(true);
    try {
      const response = await getLiveTimetable({ role: 'TEACHER', teacherId, teacherName, schoolId });
      setEntries(Array.isArray(response.entries) ? response.entries : []);
      setMessage(response.message || 'Assigned classes loaded from active published timetable.');
    } catch {
      setEntries([]);
      setMessage('Unable to load assigned classes. Confirm timetable is published and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [teacherId, schoolId]);

  const classes = useMemo(() => {
    const map = new Map<string, ClassSummary>();
    entries.forEach((entry) => {
      const className = String(entry.className || '').trim();
      const section = String(entry.section || '').trim();
      const subjectName = String(entry.subjectName || '').trim();
      if (!className || !section || !subjectName) return;
      const key = `${className}-${section}-${subjectName}`;
      const existing = map.get(key);
      if (existing) existing.periods += 1;
      else map.set(key, { key, className, section, subjectName, periods: 1 });
    });
    return Array.from(map.values()).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true }) || a.section.localeCompare(b.section) || a.subjectName.localeCompare(b.subjectName));
  }, [entries]);

  const goAttendance = (item: ClassSummary) => {
    router.push({ pathname: '/home', params: { teacherId, teacherName, role: 'TEACHER', sourceRole: 'teacher', schoolId, subject: item.subjectName, className: item.className, section: item.section } } as any);
  };

  const goReports = (item: ClassSummary) => {
    router.push({ pathname: '/attendance-report', params: { teacherId, teacherName, role: 'TEACHER', sourceRole: 'teacher', schoolId, subject: item.subjectName, className: item.className, section: item.section, readOnly: 'true' } } as any);
  };

  return (
    <ImageBackground source={images.splashGold} style={styles.background} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <MobileWorkflowHeader title="My Classes" eyebrow="Assigned Classes" sourceRole="teacher" />

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Teaching Assignments</Text>
          <Text style={styles.heroText}>{message}</Text>
        </View>

        <View style={styles.summaryGrid}>
          <SummaryCard label="Classes" value={classes.length} />
          <SummaryCard label="Subjects" value={new Set(classes.map((item) => item.subjectName)).size} />
          <SummaryCard label="Periods" value={entries.length} />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Assigned Class / Section / Subject</Text>
          {loading ? (
            <View style={styles.loadingBox}><ActivityIndicator color={colors.primaryNavy} /><Text style={styles.emptyText}>Loading classes...</Text></View>
          ) : classes.length === 0 ? (
            <Text style={styles.emptyText}>No assigned classes found in the active published timetable.</Text>
          ) : classes.map((item) => (
            <View key={item.key} style={styles.assignmentRow}>
              <View style={styles.assignmentTextBox}>
                <Text style={styles.assignmentTitle}>{item.className}-{item.section} • {item.subjectName}</Text>
                <Text style={styles.assignmentMeta}>{item.periods} weekly period{item.periods === 1 ? '' : 's'}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => goReports(item)} activeOpacity={0.88}><Text style={styles.secondaryButtonText}>Reports</Text></TouchableOpacity>
                <TouchableOpacity style={styles.primaryButton} onPress={() => goAttendance(item)} activeOpacity={0.88}><Text style={styles.primaryButtonText}>Attendance</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <View style={styles.summaryCard}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#D8A700' },
  container: { paddingHorizontal: 24, paddingTop: 58, paddingBottom: 80 },
  heroCard: { backgroundColor: colors.primaryNavy, borderRadius: 32, padding: 24, marginBottom: 22, ...shadows.medium },
  heroTitle: { color: colors.white, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  heroText: { color: 'rgba(255,255,255,0.82)', fontSize: 16, lineHeight: 23, fontWeight: '800', marginTop: 10 },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, minHeight: 104, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.92)', borderWidth: 1.4, borderColor: colors.cardGoldBorder, padding: 14, justifyContent: 'center', ...shadows.soft },
  summaryLabel: { color: colors.deepGold, fontSize: 12, lineHeight: 16, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  summaryValue: { color: colors.primaryNavy, fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 2 },
  card: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 32, borderWidth: 1.4, borderColor: colors.cardGoldBorder, padding: 22, ...shadows.medium },
  label: { color: colors.deepGold, fontSize: 13, lineHeight: 18, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 },
  loadingBox: { paddingVertical: 28, alignItems: 'center', gap: 10 },
  emptyText: { color: colors.slateText, fontSize: 16, lineHeight: 23, fontWeight: '800', textAlign: 'center' },
  assignmentRow: { borderTopWidth: 1, borderTopColor: 'rgba(6,27,51,0.10)', paddingVertical: 16 },
  assignmentTextBox: { marginBottom: 12 },
  assignmentTitle: { color: colors.primaryNavy, fontSize: 20, lineHeight: 26, fontWeight: '900' },
  assignmentMeta: { color: colors.slateText, fontSize: 15, lineHeight: 21, fontWeight: '800', marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: 10 },
  primaryButton: { flex: 1, minHeight: 48, borderRadius: 20, backgroundColor: '#D6B22D', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900' },
  secondaryButton: { flex: 1, minHeight: 48, borderRadius: 20, borderWidth: 1.2, borderColor: colors.cardGoldBorder, backgroundColor: '#FFFDF3', alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900' },
});
