import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getDashboardPath, getRoleNavigationParams, goRoleHome } from '../../src/navigation/roleNavigation';
import { colors } from '../../src/theme';
import MobileHeaderActionButton from './MobileHeaderActionButton';

type Props = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  homePath?: string;
  sourceRole?: string;
  onBackPress?: () => void;
  onHomePress?: () => void;
  rightAction?: 'home' | 'menu' | 'refresh' | 'logout' | 'none';
  onRightPress?: () => void;
};

export default function MobileWorkflowHeader({
  title,
  eyebrow,
  subtitle,
  homePath,
  sourceRole,
  onBackPress,
  onHomePress,
  rightAction = 'home',
  onRightPress,
}: Props) {
  const params = useLocalSearchParams();
  const resolvedSourceRole = sourceRole || String(params.sourceRole || params.originRole || params.role || '');
  const resolvedHomePath = homePath || getDashboardPath(resolvedSourceRole);

  const handleBack = () => {
    if (onBackPress) return onBackPress();
    if (params.returnTo) return router.replace({ pathname: String(params.returnTo) as any, params: getRoleNavigationParams(params as any, resolvedSourceRole) });
    return router.back();
  };

  const handleHome = () => {
    if (onHomePress) return onHomePress();
    if (onRightPress) return onRightPress();
    if (resolvedHomePath) return goRoleHome(resolvedSourceRole, params as any);
  };

  return (
    <View style={styles.headerRow}>
      <MobileHeaderActionButton icon="back" onPress={handleBack} accessibilityLabel="Go back" />
      <View style={styles.headerTextWrap}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      {rightAction === 'none' ? <View style={styles.placeholder} /> : (
        <MobileHeaderActionButton icon={rightAction} onPress={handleHome} accessibilityLabel={rightAction === 'home' ? 'Go home' : rightAction === 'menu' ? 'Open menu' : rightAction} />
      )}
    </View>
  );
}

export const mobileWorkflowHeaderStyles = {
  headerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    minHeight: 56,
    marginBottom: 16,
    gap: 10,
  },
  title: {
    color: colors.primaryNavy,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900' as const,
    textAlign: 'center' as const,
    letterSpacing: -0.25,
  },
};

const styles = StyleSheet.create({
  headerRow: mobileWorkflowHeaderStyles.headerRow,
  headerTextWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 11, lineHeight: 14, letterSpacing: 2.2, textAlign: 'center', textTransform: 'uppercase' },
  title: mobileWorkflowHeaderStyles.title,
  subtitle: { marginTop: 4, color: colors.slateText, fontSize: 13, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  placeholder: { width: 50, height: 50 },
});
