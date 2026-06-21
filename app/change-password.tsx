import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authResponseToSession, changeTemporaryPassword } from '../src/services/authApi';
import { normalizeSchoolId, saveSession, VidyaSetuRole } from '../src/services/sessionService';
import { colors, shadows, spacing, typography } from '../src/theme';

function routeAfterPasswordChange(session: ReturnType<typeof authResponseToSession>) {
  if (session.role === 'ADMIN') {
    router.replace({ pathname: '/admin-dashboard', params: { role: session.role, adminName: session.displayName || 'Admin', userId: session.userId, schoolId: session.schoolId } } as any);
    return;
  }
  if (session.role === 'PRINCIPAL') {
    router.replace({ pathname: '/principal-home', params: { role: session.role, principalName: session.displayName || 'Principal', userId: session.userId, schoolId: session.schoolId } } as any);
    return;
  }
  if (session.role === 'TEACHER') {
    router.replace({ pathname: '/teacher-dashboard', params: { role: session.role, teacherId: String(session.teacherId || session.userId || '1'), teacherName: session.displayName || 'Teacher', schoolId: session.schoolId } } as any);
    return;
  }
  if (session.role === 'PARENT') {
    router.replace({ pathname: '/parent-dashboard', params: { role: session.role, parentId: session.userId || '1', parentName: session.displayName || 'Parent', studentId: String(session.studentId || '1'), studentName: session.studentName || 'Student', schoolId: session.schoolId } } as any);
    return;
  }
  router.replace({ pathname: '/student-dashboard', params: { role: session.role, studentId: String(session.studentId || session.userId || '1'), studentName: session.studentName || session.displayName || 'Student', schoolId: session.schoolId } } as any);
}

export default function ChangePasswordScreen() {
  const params = useLocalSearchParams<{ username?: string; schoolId?: string; role?: VidyaSetuRole; currentPassword?: string }>();
  const [currentPassword, setCurrentPassword] = useState(String(params.currentPassword || ''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const username = String(params.username || '').trim();
  const schoolId = normalizeSchoolId(String(params.schoolId || 'BRK1'));
  const role = (String(params.role || 'ADMIN').toUpperCase() as VidyaSetuRole) || 'ADMIN';

  const submit = async () => {
    if (!username || !schoolId) {
      Alert.alert('Session Missing', 'Please login again using your temporary credentials.');
      router.replace('/login' as any);
      return;
    }
    if (!currentPassword.trim()) {
      Alert.alert('Validation', 'Please enter the temporary password.');
      return;
    }
    if (newPassword.trim().length < 8) {
      Alert.alert('Validation', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      Alert.alert('Validation', 'New password and confirm password must match.');
      return;
    }
    if (newPassword.trim() === currentPassword.trim()) {
      Alert.alert('Validation', 'New password must be different from temporary password.');
      return;
    }

    try {
      setLoading(true);
      const response = await changeTemporaryPassword({ username, schoolId, currentPassword, newPassword });
      const session = authResponseToSession(response, role, username, schoolId);
      saveSession({ ...session, forcePasswordChange: false });
      Alert.alert('Password Updated', 'Your password has been changed successfully.', [
        { text: 'Continue', onPress: () => routeAfterPasswordChange(session) },
      ]);
    } catch (error: any) {
      Alert.alert('Password Change Failed', error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../assets/branding/india-ap-bg.png')} style={styles.background} imageStyle={styles.bgImage} resizeMode="contain">
      <View style={styles.overlay} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.eyebrow}>FIRST LOGIN SECURITY</Text>
          <Text style={styles.title}>Change Temporary Password</Text>
          <Text style={styles.subtitle}>Your generated onboarding password must be changed before entering the VidyaSetu workspace.</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Username: {username || 'Missing'}</Text>
            <Text style={styles.infoText}>School ID: {schoolId}</Text>
            <Text style={styles.infoText}>Role: {role}</Text>
          </View>

          <Text style={styles.label}>Temporary Password</Text>
          <TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter temporary password" placeholderTextColor={colors.mutedText} />

          <Text style={styles.label}>New Password</Text>
          <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Minimum 8 characters" placeholderTextColor={colors.mutedText} />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput style={styles.input} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter new password" placeholderTextColor={colors.mutedText} />

          <TouchableOpacity style={[styles.primaryButton, loading && styles.disabledButton]} onPress={submit} disabled={loading} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>{loading ? 'Saving...' : 'Save New Password'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login' as any)} activeOpacity={0.9}>
            <Text style={styles.secondaryButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.primaryNavy },
  bgImage: { width: '100%', height: '70%', alignSelf: 'center', opacity: 0.34 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6, 27, 51, 0.48)' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  card: { borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)', backgroundColor: 'rgba(7, 31, 56, 0.92)', padding: spacing.xl, ...shadows.medium },
  eyebrow: { ...typography.small, color: colors.premiumGold, letterSpacing: 1.2, marginBottom: 8 },
  title: { ...typography.title, color: colors.white, marginBottom: 8 },
  subtitle: { ...typography.body, color: colors.softCream, marginBottom: spacing.lg, lineHeight: 22 },
  infoBox: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(230, 180, 91, 0.35)', backgroundColor: 'rgba(230, 180, 91, 0.10)', padding: spacing.md, marginBottom: spacing.lg },
  infoText: { ...typography.small, color: colors.softCream, marginBottom: 4 },
  label: { ...typography.label, color: colors.premiumGold, marginBottom: 8, marginTop: spacing.md },
  input: { minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: colors.white, color: colors.primaryNavy, paddingHorizontal: spacing.md, ...typography.body },
  primaryButton: { marginTop: spacing.xl, minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.premiumGold },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { ...typography.button, color: colors.primaryNavy },
  secondaryButton: { marginTop: spacing.md, minHeight: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  secondaryButtonText: { ...typography.button, color: colors.white },
});
