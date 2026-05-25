import React from 'react';
import { ImageBackground, ImageSourcePropType, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../src/theme';

const goldBackground = require('../../assets/branding/splash-gold.png');

type Props = {
  children: React.ReactNode;
  backgroundSource?: ImageSourcePropType;
  contentContainerStyle?: ViewStyle | ViewStyle[];
};

export default function MobileWorkflowScreen({ children, backgroundSource = goldBackground, contentContainerStyle }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={backgroundSource} style={styles.background} resizeMode="cover">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top + 20, 72) }, contentContainerStyle]}
      >
        {children}
      </ScrollView>
    </ImageBackground>
  );
}

export const mobileWorkflowSpacing = {
  screenPaddingHorizontal: spacing.lg,
  topOffset: 72,
  headerGap: 14,
  sectionGap: 14,
  cardGap: 10,
  cardPadding: 14,
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
  },
});
