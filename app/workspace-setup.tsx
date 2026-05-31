import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getSession } from '../src/services/sessionService';
import { loadWorkspaceSetup, saveWorkspaceStep, type WorkspaceChecklist, type WorkspaceStep } from '../src/services/workspaceSetupApi';
import { colors, shadows, spacing } from '../src/theme';

type WorkingDayOption = 'MONDAY_FRIDAY' | 'MONDAY_SATURDAY' | 'CUSTOM';

const PRODUCTION_STEP_KEYS = ['SCHOOL_PROFILE', 'ACADEMIC_YEAR', 'WORKING_DAYS', 'SCHOOL_TIMINGS'];
const DAY_OPTIONS = [
  { key: 'MONDAY', short: 'MON', label: 'Monday' },
  { key: 'TUESDAY', short: 'TUE', label: 'Tuesday' },
  { key: 'WEDNESDAY', short: 'WED', label: 'Wednesday' },
  { key: 'THURSDAY', short: 'THU', label: 'Thursday' },
  { key: 'FRIDAY', short: 'FRI', label: 'Friday' },
  { key: 'SATURDAY', short: 'SAT', label: 'Saturday' },
  { key: 'SUNDAY', short: 'SUN', label: 'Sunday' },
];
const PERIOD_OPTIONS = ['5', '6', '7', '8', '9', '10'];

function normalizeDays(raw?: string) {
  return (raw || '')
    .split(',')
    .map((day) => day.trim().toUpperCase())
    .filter(Boolean)
    .map((day) => {
      const found = DAY_OPTIONS.find((option) => option.key === day || option.short === day);
      return found?.key || day;
    });
}

function serializeDays(days: string[]) {
  return DAY_OPTIONS.filter((option) => days.includes(option.key)).map((option) => option.key).join(',');
}

function labelDays(days: string[]) {
  const normalized = normalizeDays(days.join(','));
  if (normalized.join(',') === 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY') return 'Monday – Friday';
  if (normalized.join(',') === 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY') return 'Monday – Saturday';
  return DAY_OPTIONS.filter((option) => normalized.includes(option.key)).map((option) => option.label).join(', ') || 'No days selected';
}

function optionFromDays(days: string[]): WorkingDayOption {
  const serialized = normalizeDays(days.join(',')).join(',');
  if (serialized === 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY') return 'MONDAY_FRIDAY';
  if (serialized === 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY') return 'MONDAY_SATURDAY';
  return 'CUSTOM';
}

function buildProductionChecklist(checklist: WorkspaceChecklist | null) {
  const allSteps = checklist?.steps || [];
  const fallbackSteps: WorkspaceStep[] = [
    { key: 'SCHOOL_PROFILE', label: 'School Profile', completed: false, requiredBeforeImport: true },
    { key: 'ACADEMIC_YEAR', label: 'Academic Year', completed: false, requiredBeforeImport: true },
    { key: 'WORKING_DAYS', label: 'Working Days', completed: false, requiredBeforeImport: true },
    { key: 'SCHOOL_TIMINGS', label: 'School Timings', completed: false, requiredBeforeImport: true },
  ];
  const visibleSteps = fallbackSteps.map((fallback) => allSteps.find((step) => step.key === fallback.key) || fallback);
  const completedSteps = visibleSteps.filter((step) => step.completed).length;
  const totalSteps = visibleSteps.length;
  const progressPercent = Math.round((completedSteps / totalSteps) * 100);
  const importLocked = completedSteps < totalSteps;
  return { visibleSteps, completedSteps, totalSteps, progressPercent, importLocked };
}

export default function WorkspaceSetupScreen() {
  const session = getSession();
  const [checklist, setChecklist] = useState<WorkspaceChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [message, setMessage] = useState('');
  const [schoolName, setSchoolName] = useState(session?.schoolName || '');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [workingDayOption, setWorkingDayOption] = useState<WorkingDayOption>('MONDAY_SATURDAY');
  const [selectedDays, setSelectedDays] = useState<string[]>(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('16:00');
  const [periodsPerDay, setPeriodsPerDay] = useState('7');

  const productionChecklist = useMemo(() => buildProductionChecklist(checklist), [checklist]);
  const canManage = session?.role === 'ADMIN' || session?.role === 'PRINCIPAL';
  const homePath = session?.role === 'PRINCIPAL' ? '/principal-dashboard' : '/admin-dashboard';
  const isStepCompleted = (stepKey: string) =>
    productionChecklist.visibleSteps.some((step) => step.key === stepKey && step.completed);

  useEffect(() => {
    loadWorkspaceSetup()
      .then((data) => {
        setChecklist(data);
        setSchoolName(data.schoolName || session?.schoolName || '');
        setAcademicYear(data.academicYear || '2026-2027');
        const hydratedDays = normalizeDays(data.workingDays || 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY');
        setSelectedDays(hydratedDays);
        setWorkingDayOption(optionFromDays(hydratedDays));
        setStartTime(data.schoolStartTime || '09:00');
        setEndTime(data.schoolEndTime || '16:00');
        setPeriodsPerDay(String(data.periodsPerDay || 7));
      })
      .catch((error: any) => setMessage(error?.response?.data?.message || error?.message || 'Unable to load workspace setup.'))
      .finally(() => setLoading(false));
  }, []);

  function chooseWorkingDayOption(option: WorkingDayOption) {
    setWorkingDayOption(option);
    if (option === 'MONDAY_FRIDAY') {
      setSelectedDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
    }
    if (option === 'MONDAY_SATURDAY') {
      setSelectedDays(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']);
    }
  }

  function toggleCustomDay(dayKey: string) {
    setWorkingDayOption('CUSTOM');
    setSelectedDays((current) => {
      if (current.includes(dayKey)) return current.filter((day) => day !== dayKey);
      return [...current, dayKey];
    });
  }

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

  const saveWorkingDays = () => {
    if (!selectedDays.length) {
      setMessage('Please select at least one working day.');
      return;
    }
    save('WORKING_DAYS', { workingDays: serializeDays(selectedDays) });
  };

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topActionRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.homeButton} onPress={() => router.replace(homePath as any)} activeOpacity={0.85}>
            <Text style={styles.homeButtonText}>⌂</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>School Workspace Setup</Text>
          <Text style={styles.title}>{productionChecklist.completedSteps}/{productionChecklist.totalSteps} Complete</Text>
          <Text style={styles.subtitle}>{productionChecklist.importLocked ? 'Complete the required school setup before importing school data.' : 'Import School Data is unlocked.'}</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${productionChecklist.progressPercent}%` }]} /></View>
        </View>

        {!canManage ? <Text style={styles.errorText}>Workspace setup is available only for Admin and Principal.</Text> : null}
        {loading ? <ActivityIndicator color={colors.primaryNavy} /> : null}
        {message ? <Text style={styles.messageText}>{message}</Text> : null}

        {canManage && checklist ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Required setup before import</Text>
            {productionChecklist.visibleSteps.map((step, index) => (
              <View key={step.key} style={[styles.stepRow, step.completed && styles.stepDone]}>
                <Text style={styles.stepText}>{index + 1}. {step.label}</Text>
                <Text style={styles.stepStatus}>{step.completed ? 'Completed' : 'Pending'}</Text>
              </View>
            ))}

            <SetupInput label="School Profile" value={schoolName} onChangeText={setSchoolName} editable={!isStepCompleted('SCHOOL_PROFILE')} />
            {isStepCompleted('SCHOOL_PROFILE') ? (
              <CompletedNote text="School Profile completed" />
            ) : (
              <PrimaryButton title="Save School Profile" loading={saving === 'SCHOOL_PROFILE'} onPress={() => save('SCHOOL_PROFILE', { schoolName })} />
            )}

            <SetupInput label="Academic Year" value={academicYear} onChangeText={setAcademicYear} editable={!isStepCompleted('ACADEMIC_YEAR')} />
            {isStepCompleted('ACADEMIC_YEAR') ? (
              <CompletedNote text="Academic Year completed" />
            ) : (
              <PrimaryButton title="Save Academic Year" loading={saving === 'ACADEMIC_YEAR'} onPress={() => save('ACADEMIC_YEAR', { academicYear, academicYearStartDate: '2026-06-01', academicYearEndDate: '2027-04-30' })} />
            )}

            <Text style={styles.inputLabel}>Working Days</Text>
            <View style={styles.optionRow}>
              <ChoiceChip title="Monday–Friday" selected={workingDayOption === 'MONDAY_FRIDAY'} onPress={() => !isStepCompleted('WORKING_DAYS') && chooseWorkingDayOption('MONDAY_FRIDAY')} />
              <ChoiceChip title="Monday–Saturday" selected={workingDayOption === 'MONDAY_SATURDAY'} onPress={() => !isStepCompleted('WORKING_DAYS') && chooseWorkingDayOption('MONDAY_SATURDAY')} />
              <ChoiceChip title="Custom" selected={workingDayOption === 'CUSTOM'} onPress={() => !isStepCompleted('WORKING_DAYS') && chooseWorkingDayOption('CUSTOM')} />
            </View>
            {workingDayOption === 'CUSTOM' ? (
              <View style={styles.customDaysBox}>
                <Text style={styles.helperText}>Select working days</Text>
                {DAY_OPTIONS.map((day) => (
                  <TouchableOpacity key={day.key} style={styles.checkboxRow} onPress={() => !isStepCompleted('WORKING_DAYS') && toggleCustomDay(day.key)} activeOpacity={0.85}>
                    <Text style={styles.checkbox}>{selectedDays.includes(day.key) ? '☑' : '☐'}</Text>
                    <Text style={styles.checkboxLabel}>{day.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            <Text style={styles.selectedText}>Selected: {labelDays(selectedDays)}</Text>
            {isStepCompleted('WORKING_DAYS') ? (
              <CompletedNote text="Working Days completed" />
            ) : (
              <PrimaryButton title="Save Working Days" loading={saving === 'WORKING_DAYS'} onPress={saveWorkingDays} />
            )}

            <Text style={styles.groupTitle}>School Operating Hours</Text>
            <SetupInput label="School Start Time" value={startTime} onChangeText={setStartTime} editable={!isStepCompleted('SCHOOL_TIMINGS')} />
            <SetupInput label="School End Time" value={endTime} onChangeText={setEndTime} editable={!isStepCompleted('SCHOOL_TIMINGS')} />
            <Text style={styles.inputLabel}>Periods Per Day</Text>
            <View style={styles.optionRow}>
              {PERIOD_OPTIONS.map((period) => (
                <ChoiceChip key={period} title={period} selected={periodsPerDay === period} onPress={() => !isStepCompleted('SCHOOL_TIMINGS') && setPeriodsPerDay(period)} compact />
              ))}
            </View>
            <Text style={styles.helperText}>These settings are used for timetable generation and attendance scheduling.</Text>
            {isStepCompleted('SCHOOL_TIMINGS') ? (
              <CompletedNote text="School Timings completed" />
            ) : (
              <PrimaryButton title="Save School Timings" loading={saving === 'SCHOOL_TIMINGS'} onPress={() => save('SCHOOL_TIMINGS', { schoolStartTime: startTime, schoolEndTime: endTime, periodsPerDay: Number(periodsPerDay) })} />
            )}

            <View style={styles.importInfoBox}>
              <Text style={styles.importInfoTitle}>Next: Import School Data</Text>
              <Text style={styles.importInfoText}>Classes, sections, teachers, subjects, teacher assignments, students, parents, holiday calendar, and academic rules will be validated through the Excel import engine.</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

function SetupInput(props: any) {
  const { label, editable = true, ...inputProps } = props;
  return (
    <>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        {...inputProps}
        editable={editable}
        style={[styles.input, !editable && styles.inputDisabled]}
        placeholderTextColor="rgba(20,35,55,.55)"
      />
    </>
  );
}

function CompletedNote({ text }: { text: string }) {
  return (
    <View style={styles.completedNote}>
      <Text style={styles.completedNoteText}>✓ {text}</Text>
    </View>
  );
}

function ChoiceChip({ title, selected, compact, onPress }: { title: string; selected: boolean; compact?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.choiceChip, compact && styles.choiceChipCompact, selected && styles.choiceChipSelected]} onPress={onPress} activeOpacity={0.85}>
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{title}</Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({ title, loading, onPress }: { title: string; loading?: boolean; onPress: () => void }) {
  return <TouchableOpacity style={styles.primaryButton} onPress={onPress} disabled={loading} activeOpacity={0.88}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{title}</Text>}</TouchableOpacity>;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F5BE38' },
  container: { paddingHorizontal: spacing.screenPadding, paddingTop: 70, paddingBottom: 120 },
  topActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  homeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.45)', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 38, lineHeight: 40, fontWeight: '900', color: colors.primaryNavy },
  homeButtonText: { fontSize: 24, lineHeight: 28, fontWeight: '900', color: colors.primaryNavy },
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
  inputDisabled: { backgroundColor: '#F7F2E6', color: colors.slateText },
  groupTitle: { marginTop: spacing.xl, marginBottom: spacing.xs, fontSize: 17, fontWeight: '900', color: colors.primaryNavy },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  choiceChip: { borderWidth: 1.4, borderColor: colors.cardGoldBorder, backgroundColor: '#FFFDF7', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, marginRight: 8, marginBottom: 8 },
  choiceChipCompact: { minWidth: 42, alignItems: 'center' },
  choiceChipSelected: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy },
  choiceChipText: { fontSize: 13, fontWeight: '900', color: colors.primaryNavy },
  choiceChipTextSelected: { color: '#FFFFFF' },
  customDaysBox: { backgroundColor: '#FFF8E8', borderRadius: 18, borderWidth: 1, borderColor: colors.cardGoldBorder, padding: spacing.md, marginTop: spacing.sm },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  checkbox: { fontSize: 20, color: colors.primaryNavy, marginRight: 10 },
  checkboxLabel: { fontSize: 14, fontWeight: '900', color: colors.primaryNavy },
  selectedText: { fontSize: 13, lineHeight: 19, color: colors.slateText, fontWeight: '900', marginTop: spacing.sm },
  helperText: { fontSize: 13, lineHeight: 19, color: colors.slateText, fontWeight: '800', marginTop: spacing.sm },
  importInfoBox: { backgroundColor: '#FFF8E8', borderRadius: 20, borderWidth: 1, borderColor: colors.cardGoldBorder, padding: spacing.md, marginTop: spacing.xl },
  importInfoTitle: { fontSize: 15, fontWeight: '900', color: colors.primaryNavy },
  importInfoText: { fontSize: 13, lineHeight: 20, fontWeight: '800', color: colors.slateText, marginTop: 4 },
  completedNote: { marginTop: spacing.md, borderRadius: 16, paddingVertical: 12, paddingHorizontal: spacing.md, backgroundColor: '#E9F8EF', borderWidth: 1, borderColor: '#BFE9CE' },
  completedNoteText: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900' },
  primaryButton: { marginTop: spacing.md, borderRadius: 18, paddingVertical: 15, alignItems: 'center', backgroundColor: colors.primaryNavy },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  messageText: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900', marginBottom: spacing.md },
  errorText: { color: '#8B1E1E', fontSize: 14, fontWeight: '900', marginBottom: spacing.md },
});
