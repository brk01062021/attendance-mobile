import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { Activity, ActivityMedia, fetchActivityDetail } from '../src/services/activityApi';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

function getMediaItems(activity?: Activity | null): ActivityMedia[] {
  const media = activity?.media || activity?.mediaItems || [];
  return Array.isArray(media) ? media : [];
}

function isPhoto(item: ActivityMedia) {
  const mediaType = String(item.mediaType || '').toUpperCase();
  const contentType = String(item.contentType || '').toLowerCase();
  return mediaType === 'PHOTO' || contentType.startsWith('image/');
}

function isVideo(item: ActivityMedia) {
  const mediaType = String(item.mediaType || '').toUpperCase();
  const contentType = String(item.contentType || '').toLowerCase();
  return mediaType === 'VIDEO' || contentType.startsWith('video/');
}

function mediaUri(item: ActivityMedia) {
  const anyItem = item as any;
  return anyItem.url || anyItem.mediaUrl || anyItem.publicUrl || anyItem.signedUrl || anyItem.thumbnailUrl || undefined;
}

export default function ActivityMediaPreviewScreen() {
  const params = useLocalSearchParams();
  const activityId = String(params.activityId || params.id || '');
  const session = getSession();
  const role = session?.role || 'ADMIN';
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
        if (mounted) setError(err?.message || 'Unable to load activity media.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [activityId]);

  const media = getMediaItems(activity);
  const photos = media.filter(isPhoto).length;
  const videos = media.filter(isVideo).length;

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <MobileWorkflowHeader
            title={resolveSchoolName(schoolId, session?.schoolName)}
            eyebrow="VidyaSetu ERP • Activity Media"
            sourceRole={role}
            onBackPress={() => router.back()}
          />

          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Media Review</Text>
            <Text style={styles.heroTitle}>{activity?.title || 'Activity Media'}</Text>
            <Text style={styles.heroText}>{media.length} item(s) • {photos} Photos • {videos} Video</Text>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator />
              <Text style={styles.stateText}>Loading media...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Media unavailable</Text>
              <Text style={styles.stateText}>{error}</Text>
            </View>
          ) : media.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.emptyIcon}>🖼️</Text>
              <Text style={styles.stateTitle}>No media attached yet</Text>
              <Text style={styles.stateText}>Uploaded photos and videos will appear here after the backend media upload API is enabled.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {media.map((item, index) => {
                const uri = mediaUri(item);
                const video = isVideo(item);
                return (
                  <View key={String(item.id || item.storageKey || index)} style={styles.mediaCard}>
                    {uri && !video ? <Image source={{ uri }} style={styles.thumbnail} /> : <View style={styles.placeholder}><Text style={styles.placeholderIcon}>{video ? '🎥' : '📷'}</Text></View>}
                    <Text style={styles.mediaName} numberOfLines={2}>{item.fileName || `${video ? 'Video' : 'Photo'} ${index + 1}`}</Text>
                    <Text style={styles.mediaType}>{video ? 'Video' : 'Photo'}</Text>
                  </View>
                );
              })}
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
  container: { padding: spacing.lg, paddingBottom: 120 },
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
  stateCard: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md, ...shadows.medium },
  stateTitle: { color: '#10223A', fontSize: 18, fontWeight: '900', marginTop: 8 },
  stateText: { color: '#475467', textAlign: 'center', marginTop: 10, lineHeight: 20 },
  emptyIcon: { fontSize: 38 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mediaCard: { width: '48%', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 20, padding: 12, ...shadows.medium },
  thumbnail: { width: '100%', height: 118, borderRadius: 16, backgroundColor: '#EAF1F8' },
  placeholder: { width: '100%', height: 118, borderRadius: 16, backgroundColor: '#EAF1F8', alignItems: 'center', justifyContent: 'center' },
  placeholderIcon: { fontSize: 34 },
  mediaName: { color: '#10223A', fontSize: 14, fontWeight: '900', marginTop: 10 },
  mediaType: { color: '#667085', fontSize: 12, fontWeight: '800', marginTop: 4 },
});
