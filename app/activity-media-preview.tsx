import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { Activity, ActivityMedia, deleteActivityMedia, fetchActivityDetail, fetchActivityMedia, uploadActivityMedia } from '../src/services/activityApi';
import { API_BASE_URL } from '../src/services/api';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

function getMediaItems(activity?: Activity | null): ActivityMedia[] { const media = activity?.media || activity?.mediaItems || (activity as any)?.mediaList || []; return Array.isArray(media) ? media : []; }
function isPhoto(item: ActivityMedia) { const mt = String(item.mediaType || '').toUpperCase(); const ct = String(item.contentType || '').toLowerCase(); return mt === 'PHOTO' || ct.startsWith('image/'); }
function isVideo(item: ActivityMedia) { const mt = String(item.mediaType || '').toUpperCase(); const ct = String(item.contentType || '').toLowerCase(); return mt === 'VIDEO' || ct.startsWith('video/'); }
function mediaUri(item: ActivityMedia) { const anyItem = item as any; const uri = anyItem.url || anyItem.mediaUrl || anyItem.publicUrl || anyItem.signedUrl || anyItem.thumbnailUrl; if (!uri) return undefined; return String(uri).startsWith('http') ? String(uri) : `${API_BASE_URL}${uri}`; }

export default function ActivityMediaPreviewScreen() {
  const params = useLocalSearchParams();
  const activityId = String(params.activityId || params.id || '');
  const session = getSession();
  const role = session?.role || 'ADMIN';
  const schoolId = session?.schoolId || 'TST2';
  const canManage = role === 'ADMIN' || role === 'PRINCIPAL';
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(Boolean(activityId));
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [mediaIndex, setMediaIndex] = useState(0);

  const load = useCallback(async () => {
    if (!activityId) { setError('Missing activity id.'); setLoading(false); return; }
    try { setLoading(true); const data = await fetchActivityDetail(activityId); const existingMedia = getMediaItems(data); const media = existingMedia.length ? existingMedia : await fetchActivityMedia(activityId); setActivity({ ...data, media, mediaList: media, mediaItems: media } as any); }
    catch (err: any) { setError(err?.message || 'Unable to load activity media.'); }
    finally { setLoading(false); }
  }, [activityId]);

  useEffect(() => { load(); }, [load]);

  const media = getMediaItems(activity);
  const photos = media.filter(isPhoto).length;
  const videos = media.filter(isVideo).length;

  const addMedia = async (video = false) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permission Needed', 'Allow photo library access to add activity media.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: video ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: !video, quality: 0.85 });
      if (result.canceled) return;
      setWorking(true);
      const drafts = result.assets.map((asset, index) => ({ uri: asset.uri, fileName: asset.fileName || `${video ? 'admin-video' : 'admin-photo'}-${Date.now()}-${index + 1}`, mediaType: video ? 'VIDEO' : 'PHOTO', mimeType: asset.mimeType, sizeBytes: asset.fileSize }));
      await uploadActivityMedia(activityId, drafts);
      await load();
    } catch (err: any) { Alert.alert('Upload Failed', err?.message || 'Unable to add media.'); }
    finally { setWorking(false); }
  };

  const deleteMedia = (item: ActivityMedia) => {
    if (!item.id) { Alert.alert('Cannot Delete', 'This media item has no server id.'); return; }
    Alert.alert('Delete Media?', `Remove ${item.fileName || 'this media item'} from the activity?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { setWorking(true); await deleteActivityMedia(activityId, item.id as string | number); await load(); } catch (err: any) { Alert.alert('Delete Failed', err?.message || 'Unable to delete media.'); } finally { setWorking(false); } } },
    ]);
  };

  return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.background} resizeMode="cover"><SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
    <MobileWorkflowHeader title={resolveSchoolName(schoolId, session?.schoolName)} eyebrow="VidyaSetu ERP • Activity Media" sourceRole={role} onBackPress={() => router.back()} />
    <View style={styles.heroCard}><Text style={styles.eyebrow}>Media Review</Text><Text style={styles.heroTitle}>{activity?.title || 'Activity Media'}</Text><Text style={styles.heroText}>{media.length} item(s) • {photos} Photos • {videos} Video</Text>{canManage ? <View style={styles.manageRow}><TouchableOpacity style={styles.addButton} onPress={() => addMedia(false)} disabled={working}><Text style={styles.addText}>Add Photos</Text></TouchableOpacity><TouchableOpacity style={styles.addButton} onPress={() => addMedia(true)} disabled={working}><Text style={styles.addText}>Add Video</Text></TouchableOpacity></View> : null}</View>
    {loading ? <View style={styles.stateCard}><ActivityIndicator /><Text style={styles.stateText}>Loading media...</Text></View> : error ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Media unavailable</Text><Text style={styles.stateText}>{error}</Text></View> : media.length === 0 ? <View style={styles.stateCard}><Text style={styles.emptyIcon}>🖼️</Text><Text style={styles.stateTitle}>No media attached yet</Text><Text style={styles.stateText}>Uploaded photos and videos will appear here.</Text></View> : (() => { const safeIndex = Math.max(0, Math.min(mediaIndex, media.length - 1)); const item = media[safeIndex]; const uri = mediaUri(item); const video = isVideo(item); return <View style={styles.carouselCard}><View style={styles.singleMediaRow}><TouchableOpacity style={styles.arrowButton} onPress={() => setMediaIndex((current) => current <= 0 ? media.length - 1 : current - 1)} disabled={media.length <= 1}><Text style={styles.arrowText}>‹</Text></TouchableOpacity><TouchableOpacity style={styles.carouselStage} activeOpacity={0.9} onPress={() => video && uri ? Linking.openURL(uri) : undefined}>{uri && !video ? <Image source={{ uri }} style={styles.carouselImage} resizeMode="contain" /> : <View style={styles.placeholder}><Text style={styles.placeholderIcon}>{video ? '🎥' : '📷'}</Text>{video ? <Text style={styles.playText}>Tap to play</Text> : null}</View>}</TouchableOpacity><TouchableOpacity style={styles.arrowButton} onPress={() => setMediaIndex((current) => current >= media.length - 1 ? 0 : current + 1)} disabled={media.length <= 1}><Text style={styles.arrowText}>›</Text></TouchableOpacity></View><Text style={styles.mediaName} numberOfLines={1}>{item.fileName || `${video ? 'Video' : 'Photo'} ${safeIndex + 1}`}</Text><Text style={styles.mediaType}>{safeIndex + 1} / {media.length} • {video ? 'Video' : 'Photo'}</Text>{canManage ? <TouchableOpacity style={styles.deleteButton} onPress={() => deleteMedia(item)} disabled={working}><Text style={styles.deleteText}>Delete Current</Text></TouchableOpacity> : null}</View>; })()}
  </ScrollView></SafeAreaView></ImageBackground>;
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F5BC42' }, safeArea: { flex: 1 }, container: { padding: spacing.lg, paddingBottom: 120 },
  heroCard: { backgroundColor: 'rgba(9, 28, 50, 0.92)', borderRadius: 26, padding: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(245, 188, 66, 0.28)', ...shadows.medium }, eyebrow: { color: '#F5BC42', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }, heroTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 6 }, heroText: { color: '#D8E2EF', fontSize: 14, lineHeight: 21, marginTop: 8 },
  manageRow: { flexDirection: 'row', gap: 10, marginTop: spacing.md }, addButton: { flex: 1, backgroundColor: '#F5BC42', borderRadius: 16, paddingVertical: 11, alignItems: 'center' }, addText: { color: '#10223A', fontWeight: '900' },
  stateCard: { backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: spacing.lg, alignItems: 'center', marginTop: spacing.md, ...shadows.medium }, stateTitle: { color: '#10223A', fontSize: 18, fontWeight: '900', marginTop: 8 }, stateText: { color: '#475467', textAlign: 'center', marginTop: 10, lineHeight: 20 }, emptyIcon: { fontSize: 38 },
  carouselCard: { width: '100%', alignSelf: 'center', backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 22, padding: 12, marginTop: spacing.md, ...shadows.medium }, singleMediaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, carouselStage: { width: '58%', maxWidth: 240, height: 150, borderRadius: 18, backgroundColor: '#EAF1F8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginHorizontal: 8 }, carouselImage: { width: '100%', height: '100%' }, placeholder: { width: '100%', height: 150, borderRadius: 18, backgroundColor: '#EAF1F8', alignItems: 'center', justifyContent: 'center' }, placeholderIcon: { fontSize: 34 }, playText: { color: '#10223A', fontSize: 12, fontWeight: '900', marginTop: 4 }, mediaName: { color: '#10223A', fontSize: 14, fontWeight: '900', marginTop: 10, textAlign: 'center' }, mediaType: { color: '#667085', fontSize: 12, fontWeight: '800', marginTop: 4, textAlign: 'center' }, carouselFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, arrowButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#10223A', alignItems: 'center', justifyContent: 'center' }, arrowText: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: -2 }, mediaInfoSpacer: { flex: 1 }, deleteButton: { backgroundColor: '#FDECEC', borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginHorizontal: 10, marginTop: 10 }, deleteText: { color: '#B42318', fontWeight: '900' },
});
