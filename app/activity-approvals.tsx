import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  Activity,
  ActivityMedia,
  approveActivity,
  fetchPendingActivityApprovals,
  publishActivity,
  rejectActivity,
} from '../src/services/activityApi';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

function formatDate(value?: string) {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function visibilityLabel(value?: string) {
  switch (value) {
    case 'SELECTED_CLASSES':
      return 'Selected Classes';
    case 'SELECTED_STUDENTS':
      return 'Selected Students';
    case 'STUDENT_PARENTS_ONLY':
      return 'Student Parents Only';
    case 'WHOLE_SCHOOL':
    default:
      return 'Whole School';
  }
}

function getMediaItems(activity: Activity): ActivityMedia[] {
  const media = activity.media || activity.mediaItems || [];
  return Array.isArray(media) ? media : [];
}

function getMediaSummary(activity: Activity) {
  const anyActivity = activity as any;
  const media = getMediaItems(activity);

  const explicitPhotoCount = Number(anyActivity.photoCount ?? anyActivity.photosCount ?? anyActivity.imageCount ?? NaN);
  const explicitVideoCount = Number(anyActivity.videoCount ?? anyActivity.videosCount ?? NaN);
  const explicitTotal = Number(anyActivity.mediaCount ?? anyActivity.totalMediaCount ?? anyActivity.mediaItemsCount ?? NaN);

  const countedPhotos = media.filter((item) => {
    const mediaType = String(item.mediaType || '').toUpperCase();
    const contentType = String(item.contentType || '').toLowerCase();
    return mediaType === 'PHOTO' || contentType.startsWith('image/');
  }).length;

  const countedVideos = media.filter((item) => {
    const mediaType = String(item.mediaType || '').toUpperCase();
    const contentType = String(item.contentType || '').toLowerCase();
    return mediaType === 'VIDEO' || contentType.startsWith('video/');
  }).length;

  const photos = Number.isFinite(explicitPhotoCount) ? explicitPhotoCount : countedPhotos;
  const videos = Number.isFinite(explicitVideoCount) ? explicitVideoCount : countedVideos;
  const total = Number.isFinite(explicitTotal) ? explicitTotal : photos + videos || media.length;

  return { total, photos, videos };
}

export default function ActivityApprovalsScreen() {
  const session = getSession();
  const role = session?.role || 'ADMIN';
  const schoolId = session?.schoolId || 'TST2';
  const schoolName = resolveSchoolName(schoolId, session?.schoolName);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workingId, setWorkingId] = useState<string | number | null>(null);
  const [error, setError] = useState('');

  const loadPending = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      const data = await fetchPendingActivityApprovals();
      setActivities(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load pending activity approvals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const approveAndPublish = (activity: Activity) => {
    const mediaSummary = getMediaSummary(activity);
    Alert.alert(
      'Approve & Publish?',
      `Title: ${activity.title}\nVisibility: ${visibilityLabel(activity.visibilityType)}\nMedia: ${mediaSummary.total} item(s)\n${mediaSummary.photos} Photos • ${mediaSummary.videos} Video(s)\n\nThis will publish the activity to the selected audience.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Publish',
          onPress: async () => {
            try {
              setWorkingId(activity.id);
              await approveActivity(activity.id, 'Approved from mobile approval workflow.');
              await publishActivity(activity.id);
              Alert.alert('Published', 'Activity has been approved and published successfully.');
              await loadPending(true);
            } catch (err: any) {
              Alert.alert('Action Failed', err?.message || 'Unable to approve and publish activity.');
            } finally {
              setWorkingId(null);
            }
          },
        },
      ]
    );
  };

  const approveOnly = async (activity: Activity) => {
    try {
      setWorkingId(activity.id);
      await approveActivity(activity.id, 'Approved from mobile approval workflow.');
      Alert.alert('Approved', 'Activity has been approved. Publish it when ready.');
      await loadPending(true);
    } catch (err: any) {
      Alert.alert('Approval Failed', err?.message || 'Unable to approve activity.');
    } finally {
      setWorkingId(null);
    }
  };

  const reject = (activity: Activity) => {
    Alert.alert('Reject Activity?', `Reject “${activity.title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            setWorkingId(activity.id);
            await rejectActivity(activity.id, 'Rejected from mobile approval workflow.');
            Alert.alert('Rejected', 'Activity request has been rejected.');
            await loadPending(true);
          } catch (err: any) {
            Alert.alert('Reject Failed', err?.message || 'Unable to reject activity.');
          } finally {
            setWorkingId(null);
          }
        },
      },
    ]);
  };

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadPending(true)} />}
          showsVerticalScrollIndicator={false}
        >
          <MobileWorkflowHeader
            title={schoolName}
            eyebrow="VidyaSetu ERP • Activity Approvals"
            sourceRole={role}
            onBackPress={() => router.back()}
          />

          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Admin / Principal Review</Text>
            <Text style={styles.heroTitle}>Pending Activity Approvals</Text>
            <Text style={styles.heroText}>
              Review teacher-submitted activities, validate visibility and media, then approve and publish.
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator />
              <Text style={styles.stateText}>Loading activity requests...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Approvals unavailable</Text>
              <Text style={styles.stateText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => loadPending()} activeOpacity={0.9}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : activities.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.stateTitle}>No pending activities</Text>
              <Text style={styles.stateText}>Teacher-submitted activity requests will appear here for approval.</Text>
            </View>
          ) : (
            activities.map((activity) => {
              const isWorking = workingId === activity.id;
              const mediaSummary = getMediaSummary(activity);
              return (
                <View key={String(activity.id)} style={styles.approvalCard}>
                  <View style={styles.compactHeader}>
                    <Text style={styles.dateText}>{formatDate(activity.activityDate)}</Text>
                    <Text style={styles.statusPill}>{activity.approvalStatus || 'SUBMITTED'}</Text>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>{activity.title}</Text>
                  <Text style={styles.cardText} numberOfLines={2}>{activity.description || 'No description provided.'}</Text>

                  <View style={styles.summaryBlock}>
                    <Text style={styles.mediaTotal}>{mediaSummary.total} item(s)</Text>
                    <Text style={styles.mediaBreakdown}>{mediaSummary.photos} Photos • {mediaSummary.videos} Video</Text>
                  </View>

                  <View style={styles.visibilityPill}>
                    <Text style={styles.visibilityText}>{visibilityLabel(activity.visibilityType)}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.previewButton]}
                      onPress={() => router.push({ pathname: '/activity-detail' as any, params: { activityId: String(activity.id) } })}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.previewText}>Preview</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryButton, styles.mediaButton]}
                      onPress={() => router.push({ pathname: '/activity-media-preview' as any, params: { activityId: String(activity.id) } })}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.mediaText}>View Media</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => reject(activity)}
                      disabled={isWorking}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.actionText, styles.rejectText]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => approveOnly(activity)}
                      disabled={isWorking}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.publishButton, isWorking && styles.disabledButton]}
                    onPress={() => approveAndPublish(activity)}
                    disabled={isWorking}
                    activeOpacity={0.9}
                  >
                    {isWorking ? <ActivityIndicator color="#10223A" /> : <Text style={styles.publishText}>Approve & Publish</Text>}
                  </TouchableOpacity>
                </View>
              );
            })
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
  retryButton: { backgroundColor: '#10223A', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18, marginTop: spacing.md },
  retryText: { color: '#FFFFFF', fontWeight: '900' },
  approvalCard: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 26, padding: spacing.lg, marginBottom: spacing.md, ...shadows.medium },
  compactHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { color: '#667085', fontSize: 13, fontWeight: '900' },
  statusPill: { color: '#92400E', backgroundColor: '#FFF4D6', overflow: 'hidden', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, fontSize: 11, fontWeight: '900' },
  cardTitle: { color: '#10223A', fontSize: 24, fontWeight: '900', marginTop: 16 },
  cardText: { color: '#475467', fontSize: 15, lineHeight: 22, marginTop: 8 },
  summaryBlock: { marginTop: spacing.md },
  mediaTotal: { color: '#10223A', fontSize: 17, fontWeight: '900' },
  mediaBreakdown: { color: '#667085', fontSize: 14, fontWeight: '800', marginTop: 3 },
  visibilityPill: { alignSelf: 'flex-start', backgroundColor: '#F8FAFC', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#EAECF0', marginTop: spacing.md },
  visibilityText: { color: '#10223A', fontSize: 14, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: spacing.md },
  secondaryButton: { flex: 1, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  previewButton: { backgroundColor: '#EAF1F8' },
  mediaButton: { backgroundColor: '#FFF4D6' },
  previewText: { color: '#0B5CAD', fontWeight: '900' },
  mediaText: { color: '#8A650B', fontWeight: '900' },
  actionButton: { flex: 1, borderRadius: 16, paddingVertical: 13, alignItems: 'center' },
  rejectButton: { backgroundColor: '#FDECEC' },
  approveButton: { backgroundColor: '#DFF7EA' },
  actionText: { color: '#157347', fontWeight: '900' },
  rejectText: { color: '#B42318' },
  publishButton: { backgroundColor: '#F5BC42', borderRadius: 18, paddingVertical: 15, alignItems: 'center', marginTop: 10 },
  disabledButton: { opacity: 0.65 },
  publishText: { color: '#10223A', fontSize: 16, fontWeight: '900' },
});
