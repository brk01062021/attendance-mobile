import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { Activity, fetchActivityFeed } from '../src/services/activityApi';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

function formatDate(value?: string) {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusLabel(status?: string) {
  if (!status) return 'Published';
  return status.replace(/_/g, ' ');
}

export default function ActivityFeedScreen() {
  const session = getSession();
  const role = session?.role || 'PARENT';
  const schoolId = session?.schoolId || 'TST2';
  const schoolName = resolveSchoolName(schoolId);
  const canCreate = role === 'ADMIN' || role === 'PRINCIPAL' || role === 'TEACHER';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadFeed = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      const data = await fetchActivityFeed(0, 30);
      setActivities(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load activity feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} />}
        showsVerticalScrollIndicator={false}
      >
          <MobileWorkflowHeader
            title={schoolName}
            eyebrow="VidyaSetu ERP • School Activities"
            sourceRole={role}
            onBackPress={() => router.back()}
          />

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>School Memories</Text>
          <Text style={styles.heroTitle}>Activities Feed</Text>
          <Text style={styles.heroText}>
            Private school timeline for celebrations, achievements, classroom activities and campus memories.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/school-memories' as any)} activeOpacity={0.9}>
              <Text style={styles.secondaryButtonText}>Memories</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/activity-gallery' as any)} activeOpacity={0.9}>
              <Text style={styles.secondaryButtonText}>Gallery</Text>
            </TouchableOpacity>
            {canCreate ? (
              <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/create-activity' as any)} activeOpacity={0.9}>
                <Text style={styles.primaryButtonText}>Create</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Loading latest school activities...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorTitle}>Feed unavailable</Text>
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => loadFeed()} activeOpacity={0.9}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : activities.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.emptyIcon}>🌱</Text>
            <Text style={styles.errorTitle}>No activities yet</Text>
            <Text style={styles.stateText}>Published activities will appear here for students and parents.</Text>
          </View>
        ) : (
          activities.map((activity) => (
            <TouchableOpacity
              key={String(activity.id)}
              style={styles.activityCard}
              activeOpacity={0.88}
              onPress={() => router.push({ pathname: '/activity-detail' as any, params: { activityId: String(activity.id) } })}
            >
              <View style={styles.mediaPlaceholder}>
                <Text style={styles.mediaIcon}>📸</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.dateText}>{formatDate(activity.activityDate)}</Text>
                  <Text style={styles.statusPill}>{statusLabel(activity.approvalStatus)}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{activity.title}</Text>
                <Text style={styles.cardText} numberOfLines={3}>{activity.description || 'School activity update'}</Text>
                <View style={styles.metricRow}>
                  <Text style={styles.metricText}>👁 {activity.viewCount || 0} views</Text>
                  <Text style={styles.metricText}>❤️ {activity.likeCount || 0} likes</Text>
                  <Text style={styles.openText}>Open ›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F5BC42' },
  safeArea: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: 'rgba(9, 28, 50, 0.92)',
    borderRadius: 26,
    padding: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 188, 66, 0.28)',
    ...shadows.medium,
  },
  eyebrow: { color: '#F5BC42', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 6 },
  heroText: { color: '#D8E2EF', fontSize: 14, lineHeight: 21, marginTop: 8 },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  primaryButton: { backgroundColor: '#F5BC42', borderRadius: 16, paddingVertical: 11, paddingHorizontal: 18, marginRight: 8, marginTop: 8 },
  primaryButtonText: { color: '#10223A', fontWeight: '900' },
  secondaryButton: { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 16, paddingVertical: 11, paddingHorizontal: 16, marginRight: 8, marginTop: 8 },
  secondaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  stateCard: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  stateText: { color: '#42526E', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  errorTitle: { color: '#10223A', fontSize: 18, fontWeight: '900', marginTop: 8 },
  emptyIcon: { fontSize: 38 },
  retryButton: { backgroundColor: '#10223A', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18, marginTop: spacing.md },
  retryText: { color: '#FFFFFF', fontWeight: '900' },
  activityCard: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 24, marginBottom: spacing.md, overflow: 'hidden', ...shadows.medium },
  mediaPlaceholder: { minHeight: 132, backgroundColor: '#EAF1F8', alignItems: 'center', justifyContent: 'center' },
  mediaIcon: { fontSize: 42 },
  cardBody: { padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { color: '#667085', fontSize: 12, fontWeight: '800' },
  statusPill: { backgroundColor: '#E8F7EF', color: '#157347', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '900' },
  cardTitle: { color: '#10223A', fontSize: 19, fontWeight: '900' },
  cardText: { color: '#475467', fontSize: 14, lineHeight: 20, marginTop: 6 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  metricText: { color: '#667085', fontSize: 12, fontWeight: '700', marginRight: 14 },
  openText: { color: '#0B5CAD', fontSize: 13, fontWeight: '900', marginLeft: 'auto' },
});
