import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Activity, fetchActivityTimeline } from '../src/services/activityApi';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

function yearOf(activity: Activity) {
  const date = new Date(activity.activityDate || activity.createdAt || '');
  return Number.isNaN(date.getTime()) ? 'Timeline' : String(date.getFullYear());
}

export default function SchoolMemoriesScreen() {
  const session = getSession();
  const role = session?.role || 'PARENT';
  const schoolId = session?.schoolId || 'TST2';
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError('');
      setActivities(await fetchActivityTimeline(0, 80));
    } catch (err: any) {
      setError(err?.message || 'Unable to load memories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    return activities.reduce<Record<string, Activity[]>>((acc, item) => {
      const year = yearOf(item);
      acc[year] = acc[year] || [];
      acc[year].push(item);
      return acc;
    }, {});
  }, [activities]);

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />} showsVerticalScrollIndicator={false}>
          <MobileWorkflowHeader
            title="School Memories"
            eyebrow="Digital Yearbook"
            subtitle={resolveSchoolName(schoolId)}
            sourceRole={role}
            onBackPress={() => router.back()}
          />

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Digital Yearbook</Text>
          <Text style={styles.title}>Memories Timeline</Text>
          <Text style={styles.helperText}>A private timeline of school events, celebrations and achievements.</Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Loading memories...</Text></View>
        ) : error ? (
          <View style={styles.stateCard}><Text style={styles.errorTitle}>Timeline unavailable</Text><Text style={styles.stateText}>{error}</Text></View>
        ) : activities.length === 0 ? (
          <View style={styles.stateCard}><Text style={styles.emptyIcon}>📚</Text><Text style={styles.errorTitle}>No memories yet</Text><Text style={styles.stateText}>Published activity memories will appear by year here.</Text></View>
        ) : (
          Object.entries(grouped).map(([year, items]) => (
            <View style={styles.yearCard} key={year}>
              <Text style={styles.yearTitle}>{year}</Text>
              {items.map((item) => (
                <TouchableOpacity key={String(item.id)} style={styles.timelineRow} onPress={() => router.push({ pathname: '/activity-detail' as any, params: { activityId: String(item.id) } })} activeOpacity={0.88}>
                  <View style={styles.dot} />
                  <View style={styles.timelineText}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDescription} numberOfLines={2}>{item.description || 'School memory'}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
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
  heroCard: { backgroundColor: 'rgba(9, 28, 50, 0.92)', borderRadius: 26, padding: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(245, 188, 66, 0.28)', ...shadows.medium },
  eyebrow: { color: '#F5BC42', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 6 },
  helperText: { color: '#D8E2EF', fontSize: 14, lineHeight: 21, marginTop: 8 },
  stateCard: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 24, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md },
  stateText: { color: '#42526E', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  errorTitle: { color: '#10223A', fontSize: 18, fontWeight: '900', marginTop: 8 },
  emptyIcon: { fontSize: 38 },
  yearCard: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 26, padding: spacing.lg, marginBottom: spacing.md, ...shadows.medium },
  yearTitle: { color: '#10223A', fontSize: 24, fontWeight: '900', marginBottom: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#EEF2F6' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F5BC42', marginRight: 12 },
  timelineText: { flex: 1 },
  itemTitle: { color: '#10223A', fontSize: 15, fontWeight: '900' },
  itemDescription: { color: '#667085', fontSize: 13, lineHeight: 18, marginTop: 4 },
  arrow: { color: '#0B5CAD', fontSize: 26, fontWeight: '800' },
});
