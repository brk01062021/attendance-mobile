import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../src/theme';
import MobileHeaderActionButton from './MobileHeaderActionButton';

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  homePath?: string;
  onBackPress?: () => void;
  onHomePress?: () => void;
  rightAction?: 'home' | 'refresh' | 'logout' | 'none';
  onRightPress?: () => void;
};

export default function MobileWorkflowHeader({
  title,
  eyebrow,
  subtitle,
  homePath,
  onBackPress,
  onHomePress,
  rightAction = 'home',
  onRightPress,
}: Props) {
  const handleHome = () => {
    if (onHomePress) return onHomePress();
    if (onRightPress) return onRightPress();
    if (homePath) return router.replace(homePath as any);
  };

  return (
    <View style={styles.headerRow}>
      <MobileHeaderActionButton icon="back" onPress={onBackPress || (() => router.back())} accessibilityLabel="Go back" />
      <View style={styles.headerTextWrap}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {rightAction === 'none' ? <View style={styles.placeholder} /> : (
        <MobileHeaderActionButton icon={rightAction} onPress={handleHome} accessibilityLabel={rightAction === 'home' ? 'Go home' : rightAction} />
      )}
    </View>
  );
}

export const mobileWorkflowHeaderStyles = {
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    minHeight: 44,
    marginBottom: 14,
    gap: 8,
  },
  title: {
    color: colors.primaryNavy,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
    letterSpacing: -0.3,
  },
};

const styles = StyleSheet.create({
  headerRow: mobileWorkflowHeaderStyles.headerRow,
  headerTextWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, lineHeight: 12, letterSpacing: 1.2, textAlign: 'center', textTransform: 'uppercase' },
  title: mobileWorkflowHeaderStyles.title,
  subtitle: { marginTop: 3, color: colors.slateText, fontSize: 11, lineHeight: 15, fontWeight: '800', textAlign: 'center' },
  placeholder: { width: 40, height: 40 },
});
