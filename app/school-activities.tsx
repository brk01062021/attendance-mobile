import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { getSession, normalizeSchoolId } from '../src/services/sessionService';
import { colors, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

export default function SchoolActivitiesMenuScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const session = getSession();

  const teacherId = String(params.teacherId || session?.teacherId || session?.userId || '').trim();
  const teacherName = String(params.teacherName || session?.displayName || 'Teacher').trim();
  const schoolId = normalizeSchoolId(String(params.schoolId || session?.schoolId || ''));
  const schoolName = resolveSchoolName(schoolId, session?.schoolName);

  const commonParams = useMemo(() => ({
    teacherId,
    teacherName,
    role: 'TEACHER',
    sourceRole: 'teacher',
    schoolId,
  }), [schoolId, teacherId, teacherName]);

  const openCreateActivity = () => router.push({ pathname: '/create-activity', params: commonParams } as any);
  const openActivityFeed = () => router.push({ pathname: '/activity-feed', params: commonParams } as any);
  const openSchoolMemories = () => router.push({ pathname: '/school-memories', params: commonParams } as any);

  return (
    <ImageBackground
      source={require('../assets/branding/splash-gold.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 14, 60) }]} showsVerticalScrollIndicator={false}>
        <MobileWorkflowHeader
          title="School Activities"
          eyebrow="Teacher Workspace"
          subtitle={schoolName}
          sourceRole="teacher"
          onBackPress={() => router.back()}
          onHomePress={() => router.replace({ pathname: '/teacher-dashboard', params: commonParams } as any)}
        />

        <View style={styles.card}>
          <ActionRow
            title="Create Activity"
            description="Create classroom events, achievements, or memories for approval."
            onPress={openCreateActivity}
          />
          <ActionRow
            title="Activity Feed"
            description="View published activities visible to students and parents."
            onPress={openActivityFeed}
          />
          <ActionRow
            title="School Memories"
            description="Open the school memories gallery and timeline."
            onPress={openSchoolMemories}
            last
          />
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function ActionRow({ title, description, onPress, last = false }: { title: string; description: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.actionRow, last && styles.actionRowLast]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.actionTextWrap}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Text style={styles.actionArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: colors.primaryNavy,
  },
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.44)',
  },
  circleIcon: {
    color: colors.primaryNavy,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
  },
  eyebrow: {
    color: '#8A6410',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.primaryNavy,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: '#2C3444',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E8D69B',
    overflow: 'hidden',
  },
  actionRow: {
    minHeight: 118,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE4C5',
  },
  actionRowLast: {
    borderBottomWidth: 0,
  },
  actionTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  actionTitle: {
    color: colors.primaryNavy,
    fontSize: 25,
    fontWeight: '900',
    marginBottom: 6,
  },
  actionDescription: {
    color: '#5E6675',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  actionArrow: {
    color: colors.primaryNavy,
    fontSize: 44,
    fontWeight: '900',
  },
});
