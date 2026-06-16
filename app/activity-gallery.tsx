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
import { Activity, fetchActivityGallery } from '../src/services/activityApi';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

export default function ActivityGalleryScreen() {
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
      setActivities(await fetchActivityGallery(0, 60));
    } catch (err: any) {
      setError(err?.message || 'Unable to load gallery.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />} showsVerticalScrollIndicator={false}>
          <MobileWorkflowHeader
            title={resolveSchoolName(schoolId)}
            eyebrow="VidyaSetu ERP • Activity Gallery"
            sourceRole={role}
            onBackPress={() => router.back()}
          />

        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Photos & Videos</Text>
          <Text style={styles.title}>School Gallery</Text>
          <Text style={styles.helperText}>Browse media-rich activities and memories shared by the school.</Text>
        </View>

        {loading ? (
          <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Loading gallery...</Text></View>
        ) : error ? (
          <View style={styles.stateCard}><Text style={styles.errorTitle}>Gallery unavailable</Text><Text style={styles.stateText}>{error}</Text></View>
        ) : activities.length === 0 ? (
          <View style={styles.stateCard}><Text style={styles.emptyIcon}>🖼️</Text><Text style={styles.errorTitle}>No gallery items yet</Text><Text style={styles.stateText}>Photos and videos will appear here after activities are published.</Text></View>
        ) : (
          <View style={styles.grid}>
            {activities.map((item) => (
              <TouchableOpacity key={String(item.id)} style={styles.tile} onPress={() => router.push({ pathname: '/activity-detail' as any, params: { activityId: String(item.id) } })} activeOpacity={0.88}>
                <Text style={styles.tileIcon}>📸</Text>
                <Text style={styles.tileTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.tileMeta}>{item.media?.length || item.mediaItems?.length || 0} media</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '48%', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 22, padding: spacing.md, marginBottom: spacing.md, minHeight: 160, ...shadows.medium },
  tileIcon: { fontSize: 38, marginBottom: 16 },
  tileTitle: { color: '#10223A', fontSize: 15, fontWeight: '900', lineHeight: 20 },
  tileMeta: { color: '#667085', fontSize: 12, fontWeight: '800', marginTop: 8 },
});
