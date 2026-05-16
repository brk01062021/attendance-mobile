import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dashboardTheme } from '../../theme/dashboardTheme';

type Props = {
    label: string;
    value: string | number;
    emoji?: string;
    tone?: 'success' | 'warning' | 'danger' | 'info' | 'gold';
};

const getToneColor = (tone?: Props['tone']) => {
    if (tone === 'success') return dashboardTheme.colors.success;
    if (tone === 'warning') return dashboardTheme.colors.warning;
    if (tone === 'danger') return dashboardTheme.colors.danger;
    if (tone === 'info') return dashboardTheme.colors.info;
    return dashboardTheme.colors.gold;
};

export default function DashboardStatCard({ label, value, emoji = '•', tone = 'gold' }: Props) {
    const color = getToneColor(tone);
    return (
        <View style={styles.card}>
            <Text style={styles.emoji}>{emoji}</Text>
            <Text style={[styles.value, { color }]}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '48%',
        borderRadius: 20,
        padding: 14,
        backgroundColor: 'rgba(255,255,255,0.94)',
        borderWidth: 1,
        borderColor: dashboardTheme.colors.border,
        marginBottom: 12,
        ...dashboardTheme.shadows.soft,
    },
    emoji: { fontSize: 18, marginBottom: 6 },
    value: { fontSize: 24, fontWeight: '900' },
    label: { color: dashboardTheme.colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
});
