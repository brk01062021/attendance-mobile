import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardTheme } from '../../theme/dashboardTheme';

type Props = {
    emoji: string;
    title: string;
    subtitle: string;
    onPress?: () => void;
};

export default function DashboardQuickCard({ emoji, title, subtitle, onPress }: Props) {
    return (
        <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress} disabled={!onPress}>
            <View style={styles.iconBox}><Text style={styles.icon}>{emoji}</Text></View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        minWidth: '47%',
        borderRadius: 22,
        padding: 14,
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderWidth: 1,
        borderColor: dashboardTheme.colors.border,
        ...dashboardTheme.shadows.soft,
    },
    iconBox: { width: 40, height: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(215,168,79,0.16)', marginBottom: 10 },
    icon: { fontSize: 20 },
    title: { color: dashboardTheme.colors.ink, fontSize: 14, fontWeight: '900' },
    subtitle: { color: dashboardTheme.colors.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
});
