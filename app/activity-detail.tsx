import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { Activity, fetchActivityDetail } from '../src/services/activityApi';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

function formatDate(value?: string) {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ActivityDetailScreen() {
  const params = useLocalSearchParams();
  const activityId = String(params.activityId || params.id || '');
  const session = getSession();
  const role = session?.role || 'PARENT';
  const schoolId = session?.schoolId || 'TST2';

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(Boolean(activityId));
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!activityId) {
        setError('Missing activity id.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchActivityDetail(activityId);
        if (mounted) setActivity(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Unable to load activity.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activityId]);

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <MobileWorkflowHeader
            title={resolveSchoolName(schoolId)}
            eyebrow="VidyaSetu ERP • Activity Details"
            sourceRole={role}
            onBackPress={() => router.back()}
          />

        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator />
            <Text style={styles.stateText}>Loading activity...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateCard}>
            <Text style={styles.errorTitle}>Unable to open activity</Text>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : activity ? (
          <>
            <View style={styles.coverCard}>
              <Text style={styles.coverIcon}>🎉</Text>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.dateText}>{formatDate(activity.activityDate)}</Text>
              <Text style={styles.title}>{activity.title}</Text>
              <Text style={styles.description}>{activity.description || 'School activity update'}</Text>

              <View style={styles.divider} />

              <Text style={styles.sectionTitle}>Visibility</Text>
              <Text style={styles.metaText}>{String(activity.visibilityType || 'WHOLE_SCHOOL').replace(/_/g, ' ')}</Text>

              <View style={styles.metrics}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{activity.viewCount || 0}</Text>
                  <Text style={styles.metricLabel}>Views</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{activity.likeCount || 0}</Text>
                  <Text style={styles.metricLabel}>Likes</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricValue}>{activity.media?.length || activity.mediaItems?.length || 0}</Text>
                  <Text style={styles.metricLabel}>Media</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Gallery</Text>
              <Text style={styles.metaText}>
                Photos and videos uploaded for this activity will be shown here after media upload is enabled.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F5BC42' },
  safeArea: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  stateCard: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  stateText: { color: '#42526E', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  errorTitle: { color: '#10223A', fontSize: 18, fontWeight: '900', marginTop: 8 },
  coverCard: { minHeight: 190, backgroundColor: '#EAF1F8', borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, ...shadows.medium },
  coverIcon: { fontSize: 58 },
  detailCard: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 26, padding: spacing.lg, marginTop: spacing.md, ...shadows.medium },
  dateText: { color: '#667085', fontSize: 13, fontWeight: '800' },
  title: { color: '#10223A', fontSize: 26, fontWeight: '900', marginTop: 8 },
  description: { color: '#344054', fontSize: 15, lineHeight: 23, marginTop: 12 },
  divider: { height: 1, backgroundColor: '#E4E7EC', marginVertical: spacing.md },
  sectionTitle: { color: '#10223A', fontSize: 17, fontWeight: '900' },
  metaText: { color: '#667085', fontSize: 14, lineHeight: 21, marginTop: 8 },
  metrics: { flexDirection: 'row', marginTop: spacing.md },
  metricBox: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 18, padding: spacing.md, marginRight: 8, alignItems: 'center' },
  metricValue: { color: '#10223A', fontSize: 22, fontWeight: '900' },
  metricLabel: { color: '#667085', fontSize: 12, fontWeight: '800', marginTop: 4 },
});
