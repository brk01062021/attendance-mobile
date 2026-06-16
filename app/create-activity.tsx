import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { ActivityVisibilityType, createActivityDraft, submitActivity } from '../src/services/activityApi';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

const visibilityOptions: Array<{ label: string; value: ActivityVisibilityType; helper: string }> = [
  { label: 'Whole School', value: 'WHOLE_SCHOOL', helper: 'Visible to all school users.' },
  { label: 'Selected Classes', value: 'SELECTED_CLASSES', helper: 'Visible to selected class students and parents.' },
  { label: 'Selected Students', value: 'SELECTED_STUDENTS', helper: 'Visible only to selected students and mapped parents.' },
  { label: 'Student Parents Only', value: 'STUDENT_PARENTS_ONLY', helper: 'Best for individual achievements or participation memories.' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function CreateActivityScreen() {
  const session = getSession();
  const role = session?.role || 'TEACHER';
  const schoolId = session?.schoolId || 'TST2';
  const canCreate = role === 'ADMIN' || role === 'PRINCIPAL' || role === 'TEACHER';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [activityDate, setActivityDate] = useState(todayIso());
  const [visibilityType, setVisibilityType] = useState<ActivityVisibilityType>('WHOLE_SCHOOL');
  const [classIds, setClassIds] = useState('');
  const [studentIds, setStudentIds] = useState('');
  const [submitAfterCreate, setSubmitAfterCreate] = useState(role === 'TEACHER');
  const [saving, setSaving] = useState(false);

  const selectedVisibility = visibilityOptions.find((item) => item.value === visibilityType);

  const validate = () => {
    if (!canCreate) {
      Alert.alert('Not Allowed', 'Only Admin, Principal and Teacher can create activities.');
      return false;
    }
    if (title.trim().length < 3) {
      Alert.alert('Missing Title', 'Please enter an activity title.');
      return false;
    }
    if (description.trim().length < 5) {
      Alert.alert('Missing Description', 'Please enter activity description.');
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(activityDate.trim())) {
      Alert.alert('Invalid Date', 'Use date format YYYY-MM-DD.');
      return false;
    }
    if (visibilityType === 'SELECTED_CLASSES' && !classIds.trim()) {
      Alert.alert('Class Visibility', 'Enter class ids separated by comma.');
      return false;
    }
    if ((visibilityType === 'SELECTED_STUDENTS' || visibilityType === 'STUDENT_PARENTS_ONLY') && !studentIds.trim()) {
      Alert.alert('Student Visibility', 'Enter student ids separated by comma.');
      return false;
    }
    return true;
  };

  const parseIds = (value: string) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  const save = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const created = await createActivityDraft({
        title: title.trim(),
        description: description.trim(),
        activityDate: activityDate.trim(),
        visibilityType,
        classIds: visibilityType === 'SELECTED_CLASSES' ? parseIds(classIds) : [],
        studentIds: visibilityType === 'SELECTED_STUDENTS' || visibilityType === 'STUDENT_PARENTS_ONLY' ? parseIds(studentIds) : [],
      });

      if (submitAfterCreate && created?.id) {
        await submitActivity(created.id);
      }

      Alert.alert(
        role === 'TEACHER' ? 'Submitted for Approval' : 'Activity Saved',
        role === 'TEACHER'
          ? 'Your activity has been submitted to Admin/Principal for approval.'
          : 'Activity has been created. Publish it from approval workflow after review.',
        [{ text: 'OK', onPress: () => router.replace('/activity-feed' as any) }]
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Unable to save activity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <MobileWorkflowHeader
            title={resolveSchoolName(schoolId)}
            eyebrow="VidyaSetu ERP • Create Activity"
            sourceRole={role}
            onBackPress={() => router.back()}
          />

          <View style={styles.card}>
            <Text style={styles.eyebrow}>School Memories</Text>
            <Text style={styles.title}>New Activity</Text>
            <Text style={styles.helperText}>Create posts for events, achievements, celebrations and classroom memories.</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Example: Science Fair Winners" placeholderTextColor="#98A2B3" />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Write activity details for parents and students..."
              placeholderTextColor="#98A2B3"
              multiline
            />

            <Text style={styles.label}>Activity Date</Text>
            <TextInput style={styles.input} value={activityDate} onChangeText={setActivityDate} placeholder="YYYY-MM-DD" placeholderTextColor="#98A2B3" />

            <Text style={styles.label}>Visibility</Text>
            <View style={styles.visibilityGrid}>
              {visibilityOptions.map((option) => {
                const isSelected = visibilityType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.visibilityOption, isSelected && styles.visibilityOptionSelected]}
                    onPress={() => setVisibilityType(option.value)}
                    activeOpacity={0.9}
                  >
                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={styles.visibilityTextWrap}>
                      <Text style={[styles.visibilityLabel, isSelected && styles.visibilityLabelSelected]}>{option.label}</Text>
                      <Text style={styles.visibilityHelper}>{option.helper}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.helperText}>Selected: {selectedVisibility?.label}</Text>

            {visibilityType === 'SELECTED_CLASSES' ? (
              <>
                <Text style={styles.label}>Class IDs</Text>
                <TextInput style={styles.input} value={classIds} onChangeText={setClassIds} placeholder="Example: 8A, 9B" placeholderTextColor="#98A2B3" />
              </>
            ) : null}

            {visibilityType === 'SELECTED_STUDENTS' || visibilityType === 'STUDENT_PARENTS_ONLY' ? (
              <>
                <Text style={styles.label}>Student IDs</Text>
                <TextInput style={styles.input} value={studentIds} onChangeText={setStudentIds} placeholder="Example: ST1019, ST1044" placeholderTextColor="#98A2B3" />
              </>
            ) : null}

            {role === 'TEACHER' ? (
              <TouchableOpacity style={styles.checkRow} onPress={() => setSubmitAfterCreate((value) => !value)} activeOpacity={0.9}>
                <Text style={styles.checkIcon}>{submitAfterCreate ? '✅' : '⬜'}</Text>
                <Text style={styles.checkText}>Submit for approval after saving</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.saveButton} onPress={save} disabled={saving} activeOpacity={0.9}>
              {saving ? <ActivityIndicator color="#10223A" /> : <Text style={styles.saveText}>{role === 'TEACHER' ? 'Save / Submit' : 'Save Activity'}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  background: { flex: 1, backgroundColor: '#F5BC42' },
  safeArea: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: 120 },
  card: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 28, padding: spacing.lg, marginTop: spacing.md, ...shadows.medium },
  eyebrow: { color: '#C69214', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#10223A', fontSize: 26, fontWeight: '900', marginTop: 6 },
  helperText: { color: '#667085', fontSize: 13, lineHeight: 19, marginTop: 8 },
  label: { color: '#10223A', fontWeight: '900', marginTop: spacing.md, marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, color: '#10223A', fontSize: 15 },
  textArea: { minHeight: 118, textAlignVertical: 'top' },
  visibilityGrid: { gap: 10 },
  visibilityOption: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 18, padding: 12 },
  visibilityOptionSelected: { backgroundColor: '#FFF6D8', borderColor: '#C69214' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#98A2B3', alignItems: 'center', justifyContent: 'center', marginTop: 2, marginRight: 10 },
  radioOuterSelected: { borderColor: '#C69214' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#C69214' },
  visibilityTextWrap: { flex: 1 },
  visibilityLabel: { color: '#10223A', fontWeight: '900', fontSize: 14 },
  visibilityLabelSelected: { color: '#8A650B' },
  visibilityHelper: { color: '#667085', fontSize: 12, lineHeight: 17, marginTop: 3 },
  checkRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 12, marginTop: spacing.md },
  checkIcon: { fontSize: 18, marginRight: 8 },
  checkText: { color: '#10223A', fontWeight: '800' },
  saveButton: { backgroundColor: '#F5BC42', borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: spacing.lg },
  saveText: { color: '#10223A', fontWeight: '900', fontSize: 16 },
});
