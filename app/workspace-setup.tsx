import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getSession } from '../src/services/sessionService';
import { loadWorkspaceSetup, saveWorkspaceStep, type WorkspaceChecklist } from '../src/services/workspaceSetupApi';
import { colors, shadows, spacing } from '../src/theme';

export default function WorkspaceSetupScreen() {
  const session = getSession();
  const [checklist, setChecklist] = useState<WorkspaceChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [schoolName, setSchoolName] = useState(session?.schoolName || '');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [workingDays, setWorkingDays] = useState('MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('16:00');
  const [periodsPerDay, setPeriodsPerDay] = useState('7');

  useEffect(() => {
    loadWorkspaceSetup()
      .then((data) => {
        setChecklist(data);
        setSchoolName(data.schoolName || session?.schoolName || '');
        setAcademicYear(data.academicYear || '2026-2027');
        setWorkingDays(data.workingDays || 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY');
        setStartTime(data.schoolStartTime || '09:00');
        setEndTime(data.schoolEndTime || '16:00');
        setPeriodsPerDay(String(data.periodsPerDay || 7));
      })
      .catch((error: any) => setMessage(error?.response?.data?.message || error?.message || 'Unable to load workspace setup.'))
      .finally(() => setLoading(false));
  }, []);

  async function save(stepKey: string, body: Record<string, unknown>) {
    try {
      setSaving(stepKey);
      setMessage('');
      const data = await saveWorkspaceStep(stepKey, body);
      setChecklist(data);
      setMessage('Saved successfully.');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || 'Unable to save setup step.');
    } finally {
      setSaving('');
    }
  }

  const canManage = session?.role === 'ADMIN' || session?.role === 'PRINCIPAL';

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}><Text style={styles.backButtonText}>‹</Text></TouchableOpacity>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Workspace Initialization</Text>
          <Text style={styles.title}>{checklist ? `${checklist.completedSteps}/${checklist.totalSteps} Complete` : 'Setup Progress'}</Text>
          <Text style={styles.subtitle}>{checklist?.importLocked ? 'Import School Data is locked until setup is completed.' : 'Import School Data is unlocked.'}</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${checklist?.progressPercent || 0}%` }]} /></View>
        </View>

        {!canManage ? <Text style={styles.errorText}>Workspace setup is available only for Admin and Principal.</Text> : null}
        {loading ? <ActivityIndicator color={colors.primaryNavy} /> : null}
        {message ? <Text style={styles.messageText}>{message}</Text> : null}

        {canManage && checklist ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Required setup order</Text>
            {checklist.steps.map((step, index) => (
              <View key={step.key} style={[styles.stepRow, step.completed && styles.stepDone]}>
                <Text style={styles.stepText}>{index + 1}. {step.label}</Text>
                <Text style={styles.stepStatus}>{step.completed ? 'Done' : 'Pending'}</Text>
              </View>
            ))}

            <SetupInput label="School Profile" value={schoolName} onChangeText={setSchoolName} />
            <PrimaryButton title="Save School Profile" loading={saving === 'SCHOOL_PROFILE'} onPress={() => save('SCHOOL_PROFILE', { schoolName })} />

            <SetupInput label="Academic Year" value={academicYear} onChangeText={setAcademicYear} />
            <PrimaryButton title="Save Academic Year" loading={saving === 'ACADEMIC_YEAR'} onPress={() => save('ACADEMIC_YEAR', { academicYear, academicYearStartDate: '2026-06-01', academicYearEndDate: '2027-04-30' })} />

            <SetupInput label="Working Days" value={workingDays} onChangeText={setWorkingDays} />
            <PrimaryButton title="Save Working Days" loading={saving === 'WORKING_DAYS'} onPress={() => save('WORKING_DAYS', { workingDays })} />

            <SetupInput label="Start Time" value={startTime} onChangeText={setStartTime} />
            <SetupInput label="End Time" value={endTime} onChangeText={setEndTime} />
            <SetupInput label="Periods Per Day" value={periodsPerDay} onChangeText={setPeriodsPerDay} keyboardType="number-pad" />
            <PrimaryButton title="Save School Timings" loading={saving === 'SCHOOL_TIMINGS'} onPress={() => save('SCHOOL_TIMINGS', { schoolStartTime: startTime, schoolEndTime: endTime, periodsPerDay: Number(periodsPerDay) })} />

            {['CLASSES', 'SECTIONS', 'TEACHERS', 'SUBJECTS', 'HOLIDAY_CALENDAR'].map((step) => (
              <PrimaryButton key={step} title={`Mark ${step.replace('_', ' ')} Complete`} loading={saving === step} onPress={() => save(step, {})} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

function SetupInput(props: any) {
  return <><Text style={styles.inputLabel}>{props.label}</Text><TextInput {...props} style={styles.input} placeholderTextColor="rgba(20,35,55,.55)" /></>;
}

function PrimaryButton({ title, loading, onPress }: { title: string; loading?: boolean; onPress: () => void }) {
  return <TouchableOpacity style={styles.primaryButton} onPress={onPress} disabled={loading} activeOpacity={0.88}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{title}</Text>}</TouchableOpacity>;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F5BE38' },
  container: { paddingHorizontal: spacing.screenPadding, paddingTop: 70, paddingBottom: 120 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  backButtonText: { fontSize: 38, lineHeight: 40, fontWeight: '900', color: colors.primaryNavy },
  heroCard: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 34, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', padding: spacing.xl, marginBottom: spacing.xl },
  eyebrow: { fontSize: 13, fontWeight: '900', color: colors.primaryNavy, letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '900', color: colors.primaryNavy, marginTop: spacing.sm },
  subtitle: { fontSize: 16, lineHeight: 23, fontWeight: '800', color: colors.primaryNavy, marginTop: spacing.md },
  progressTrack: { height: 12, borderRadius: 999, backgroundColor: 'rgba(20,35,55,.16)', overflow: 'hidden', marginTop: spacing.lg },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: colors.primaryNavy },
  card: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 34, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, ...shadows.medium },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryNavy, marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderRadius: 18, backgroundColor: '#FFF8E8', marginBottom: spacing.sm },
  stepDone: { backgroundColor: '#E9F8EF' },
  stepText: { fontSize: 14, fontWeight: '800', color: colors.primaryNavy },
  stepStatus: { fontSize: 13, fontWeight: '900', color: colors.primaryNavy },
  inputLabel: { marginTop: spacing.lg, marginBottom: spacing.xs, fontSize: 13, fontWeight: '900', color: colors.primaryNavy },
  input: { borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 16, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.primaryNavy, backgroundColor: '#FFFDF7', fontWeight: '800' },
  primaryButton: { marginTop: spacing.md, borderRadius: 18, paddingVertical: 15, alignItems: 'center', backgroundColor: colors.primaryNavy },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  messageText: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900', marginBottom: spacing.md },
  errorText: { color: '#8B1E1E', fontSize: 14, fontWeight: '900', marginBottom: spacing.md },
});
