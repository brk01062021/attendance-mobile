import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const session = getSession();
  const role = session?.role || 'PARENT';
  const schoolId = session?.schoolId || 'TST2';
  const schoolName = resolveSchoolName(schoolId);
  const canCreate = role === 'ADMIN' || role === 'PRINCIPAL' || role === 'TEACHER';

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

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

  const visibleActivities = showAll ? activities : activities.slice(0, 5);

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 14, 60) }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadFeed(true)} />}
        showsVerticalScrollIndicator={false}
      >
          <MobileWorkflowHeader
            title="School Activities"
            eyebrow="VidyaSetu ERP • School Activities"
            subtitle={schoolName}
            sourceRole={role}
            onBackPress={() => router.back()}
          />

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Recent Feed</Text>
          <Text style={styles.heroTitle}>School Activities</Text>
          <Text style={styles.heroText}>
            Private school timeline for celebrations, achievements, classroom activities and campus memories.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.headerPill} onPress={() => setShowAll(false)} activeOpacity={0.9}>
              <Text style={styles.headerPillText}>Recent Feed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerPill} onPress={() => router.push('/activity-gallery' as any)} activeOpacity={0.9}>
              <Text style={styles.headerPillText}>Gallery</Text>
            </TouchableOpacity>
            {canCreate ? (
              <TouchableOpacity style={[styles.headerPill, styles.headerPillGold]} onPress={() => router.push('/create-activity' as any)} activeOpacity={0.9}>
                <Text style={styles.headerPillGoldText}>Create New</Text>
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
          <>
            {visibleActivities.map((activity) => (
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
            ))}
            {activities.length > 5 ? (
              <TouchableOpacity style={styles.viewMoreButton} onPress={() => setShowAll((current) => !current)} activeOpacity={0.9}>
                <Text style={styles.viewMoreText}>{showAll ? 'Show Less' : 'View More'}</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F5BC42' },
  container: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: 'rgba(9, 28, 50, 0.92)',
    borderRadius: 24,
    padding: 18,
    marginTop: 0,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 188, 66, 0.28)',
    ...shadows.medium,
  },
  eyebrow: { color: '#F5BC42', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 6 },
  heroText: { color: '#D8E2EF', fontSize: 14, lineHeight: 20, marginTop: 8, fontWeight: '700' },
  heroActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  headerPill: { minHeight: 36, minWidth: 96, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14, marginRight: 10, marginTop: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  headerPillText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
  headerPillGold: { minWidth: 126, backgroundColor: '#F5BC42', borderColor: '#F5BC42' },
  headerPillGoldText: { color: '#10223A', fontWeight: '900', fontSize: 13 },
  stateCard: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  stateText: { color: '#42526E', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  errorTitle: { color: '#10223A', fontSize: 18, fontWeight: '900', marginTop: 8 },
  emptyIcon: { fontSize: 38 },
  retryButton: { backgroundColor: '#10223A', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18, marginTop: spacing.md },
  retryText: { color: '#FFFFFF', fontWeight: '900' },
  activityCard: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 22, marginBottom: spacing.md, overflow: 'hidden', ...shadows.medium },
  mediaPlaceholder: { minHeight: 78, backgroundColor: '#EAF1F8', alignItems: 'center', justifyContent: 'center' },
  mediaIcon: { fontSize: 30 },
  cardBody: { padding: spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dateText: { color: '#667085', fontSize: 12, fontWeight: '800' },
  statusPill: { backgroundColor: '#E8F7EF', color: '#157347', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: '900' },
  cardTitle: { color: '#10223A', fontSize: 18, lineHeight: 23, fontWeight: '900' },
  cardText: { color: '#475467', fontSize: 14, lineHeight: 20, marginTop: 6 },
  metricRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' },
  metricText: { color: '#667085', fontSize: 12, fontWeight: '700', marginRight: 14 },
  openText: { color: '#0B5CAD', fontSize: 13, fontWeight: '900', marginLeft: 'auto' },
  viewMoreButton: { backgroundColor: '#10223A', borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: spacing.sm },
  viewMoreText: { color: '#FFFFFF', fontWeight: '900' },
});
