import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

const MAX_PHOTOS = 10;
const MAX_VIDEOS = 5;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 170 * 1024 * 1024;

export type ActivityMediaDraft = {
  id: string;
  uri: string;
  fileName: string;
  mediaType: 'PHOTO' | 'VIDEO';
  sizeBytes?: number;
  mimeType?: string;
  status: 'READY' | 'PENDING_BACKEND';
};

type Props = {
  value: ActivityMediaDraft[];
  onChange: (value: ActivityMediaDraft[]) => void;
};

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return 'Size unavailable';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

function getAssetFileName(asset: ImagePicker.ImagePickerAsset, fallback: string) {
  return asset.fileName || asset.uri.split('/').pop() || fallback;
}

function dedupeByUri(items: ActivityMediaDraft[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.uri)) return false;
    seen.add(item.uri);
    return true;
  });
}

export default function ActivityMediaUploader({ value, onChange }: Props) {
  const photos = value.filter((item) => item.mediaType === 'PHOTO');
  const videos = value.filter((item) => item.mediaType === 'VIDEO');

  const requestPermission = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow gallery access to upload activity photos and videos.');
      return false;
    }
    return true;
  };

  const pickMedia = async (mediaType: 'PHOTO' | 'VIDEO') => {
    const isPhoto = mediaType === 'PHOTO';
    const currentCount = isPhoto ? photos.length : videos.length;
    const maxCount = isPhoto ? MAX_PHOTOS : MAX_VIDEOS;
    const maxSizeBytes = isPhoto ? MAX_PHOTO_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
    const remaining = maxCount - currentCount;

    if (remaining <= 0) {
      Alert.alert(
        isPhoto ? 'Photo Limit Reached' : 'Video Limit Reached',
        isPhoto ? 'You can upload up to 10 photos per activity.' : 'You can upload up to 5 videos per activity.'
      );
      return;
    }

    const allowed = await requestPermission();
    if (!allowed) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (isPhoto ? ['images'] : ['videos']) as any,
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: isPhoto ? 0.9 : 1,
        videoMaxDuration: 300,
      });

      if (result.canceled) return;

      const accepted: ActivityMediaDraft[] = [];
      const rejected: string[] = [];

      result.assets.forEach((asset, index) => {
        const size = asset.fileSize;
        const fileName = getAssetFileName(asset, `${isPhoto ? 'photo' : 'video'}-${Date.now()}-${index + 1}`);

        if (typeof size === 'number' && size > maxSizeBytes) {
          rejected.push(`${fileName} (${formatBytes(size)})`);
          return;
        }

        accepted.push({
          id: `${mediaType}-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
          uri: asset.uri,
          fileName,
          mediaType,
          sizeBytes: size,
          mimeType: asset.mimeType,
          status: 'PENDING_BACKEND',
        });
      });

      const sameTypeExisting = value.filter((item) => item.mediaType === mediaType);
      const otherTypeExisting = value.filter((item) => item.mediaType !== mediaType);
      const limitedAccepted = accepted.slice(0, Math.max(0, maxCount - sameTypeExisting.length));
      onChange(dedupeByUri([...otherTypeExisting, ...sameTypeExisting, ...limitedAccepted]));

      if (rejected.length) {
        Alert.alert(
          isPhoto ? 'Some Photos Skipped' : 'Some Videos Skipped',
          isPhoto
            ? `Each photo must be 5 MB or smaller. Skipped:\n${rejected.join('\n')}`
            : `Each video must be 170 MB or smaller. Skipped:\n${rejected.join('\n')}`
        );
      }
    } catch (error: any) {
      Alert.alert('Gallery Error', error?.message || 'Unable to open device gallery.');
    }
  };

  const removeItem = (id: string) => {
    onChange(value.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Media</Text>
      <Text style={styles.helper}>Optional photos and videos for this activity.</Text>

      <View style={styles.limitBox}>
        <Text style={styles.limitText}>Photos: up to 10 files, max 5 MB each.</Text>
        <Text style={styles.limitText}>Videos: up to 5 files, max 170 MB each.</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable style={styles.uploadButton} onPress={() => pickMedia('PHOTO')}>
          <Text style={styles.uploadIcon}>📷</Text>
          <Text style={styles.uploadText}>Upload Photos ({photos.length}/{MAX_PHOTOS})</Text>
        </Pressable>

        <Pressable style={styles.uploadButton} onPress={() => pickMedia('VIDEO')}>
          <Text style={styles.uploadIcon}>🎥</Text>
          <Text style={styles.uploadText}>Upload Videos ({videos.length}/{MAX_VIDEOS})</Text>
        </Pressable>
      </View>

      {value.length ? (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Selected Media</Text>
          {value.map((item) => (
            <View key={item.id} style={styles.previewRow}>
              <View style={styles.thumbWrap}>
                {item.mediaType === 'PHOTO' ? (
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.videoThumb}><Text style={styles.videoIcon}>🎥</Text></View>
                )}
              </View>
              <View style={styles.previewTextWrap}>
                <Text style={styles.previewName} numberOfLines={1}>{item.fileName}</Text>
                <Text style={styles.previewStatus}>{formatBytes(item.sizeBytes)} • Ready for upload after save</Text>
              </View>
              <Pressable onPress={() => removeItem(item.id)} style={styles.removeButton}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No media selected yet.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 18,
  },
  label: {
    color: '#10223A',
    fontWeight: '900',
    marginBottom: 6,
  },
  helper: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  limitBox: {
    backgroundColor: '#FFF9E8',
    borderColor: '#F1D48A',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  limitText: {
    color: '#8A650B',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    minHeight: 74,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  uploadIcon: {
    fontSize: 22,
    marginBottom: 5,
  },
  uploadText: {
    color: '#10223A',
    fontWeight: '900',
    fontSize: 12,
    textAlign: 'center',
  },
  previewBox: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EAECF0',
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  previewTitle: {
    color: '#10223A',
    fontWeight: '900',
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#EAECF0',
  },
  thumbWrap: {
    marginRight: 10,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EAF1F8',
  },
  videoThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EAF1F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoIcon: {
    fontSize: 20,
  },
  previewTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  previewName: {
    color: '#10223A',
    fontWeight: '800',
  },
  previewStatus: {
    color: '#667085',
    fontSize: 11,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFF1F1',
    marginLeft: 8,
  },
  removeText: {
    color: '#B42318',
    fontWeight: '900',
    fontSize: 12,
  },
  emptyBox: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
  },
  emptyText: {
    color: '#667085',
    fontWeight: '700',
  },
});
