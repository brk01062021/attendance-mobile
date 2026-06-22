import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../../src/theme';

export type MobileHeaderActionIcon = 'back' | 'home' | 'menu' | 'refresh' | 'logout' | 'close';

type Props = {
  icon: MobileHeaderActionIcon;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: ViewStyle;
};

const iconMap: Record<MobileHeaderActionIcon, string> = {
  back: '‹',
  home: '⌂',
  menu: '☰',
  refresh: '↻',
  logout: '⏻',
  close: '×',
};

export default function MobileHeaderActionButton({ icon, onPress, accessibilityLabel, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || icon}
    >
      <Text style={[styles.icon, icon === 'back' && styles.backIcon, icon === 'home' && styles.homeIcon]}>{iconMap[icon]}</Text>
    </TouchableOpacity>
  );
}

export const mobileHeaderActionStyles = {
  size: 56,
  radius: 28,
  iconSize: 24,
  touchTarget: 56,
};

const styles = StyleSheet.create({
  button: {
    width: mobileHeaderActionStyles.size,
    height: mobileHeaderActionStyles.size,
    borderRadius: mobileHeaderActionStyles.radius,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.92)',
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: colors.primaryNavy,
    fontSize: mobileHeaderActionStyles.iconSize,
    lineHeight: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  backIcon: {
    fontSize: 38,
    lineHeight: 40,
    marginTop: -2,
  },
  homeIcon: {
    fontSize: 28,
    lineHeight: 30,
  },
});
