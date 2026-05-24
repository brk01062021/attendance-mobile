import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { dashboardTheme } from '../../theme/dashboardTheme';
import type { DashboardRole } from './roleMenus';

type IntelligenceItem = {
    emoji: string;
    title: string;
    value: string;
    subtitle: string;
    tone: 'success' | 'warning' | 'danger' | 'info' | 'gold';
};

const roleIntelligence: Record<DashboardRole, IntelligenceItem[]> = {
    ADMIN: [
        { emoji: '🧠', title: 'School Health', value: 'Live', subtitle: 'Attendance, leave, replacement pulse', tone: 'success' },
        { emoji: '⚖️', title: 'Workload Risk', value: 'Watch', subtitle: 'Teacher fatigue protection active', tone: 'warning' },
        { emoji: '📤', title: 'Export Ready', value: 'Next', subtitle: 'PDF/Excel foundation prepared', tone: 'gold' },
    ],
    PRINCIPAL: [
        { emoji: '🏫', title: 'Executive View', value: 'Live', subtitle: 'Principal operational intelligence', tone: 'success' },
        { emoji: '🚨', title: 'Risk Center', value: 'Active', subtitle: 'Student and class risk monitoring', tone: 'danger' },
        { emoji: '🔁', title: 'Coverage', value: 'Smart', subtitle: 'Replacement coverage visibility', tone: 'info' },
    ],
    TEACHER: [
        { emoji: '✅', title: 'Today Flow', value: 'Ready', subtitle: 'Attendance and schedule workspace', tone: 'success' },
        { emoji: '🔁', title: 'Replacement Duty', value: 'Tracked', subtitle: 'Assigned periods and leave support', tone: 'info' },
        { emoji: '📊', title: 'Completion', value: 'Weekly', subtitle: 'Submission health and summaries', tone: 'gold' },
    ],
    STUDENT: [
        { emoji: '📚', title: 'Learning Pulse', value: 'Ready', subtitle: 'Attendance and academic snapshot', tone: 'success' },
        { emoji: '🎯', title: 'Focus Areas', value: 'Smart', subtitle: 'Weak subject and risk highlights', tone: 'warning' },
        { emoji: '🏅', title: 'Progress', value: 'Premium', subtitle: 'Badges and achievement area', tone: 'gold' },
    ],
    PARENT: [
        { emoji: '👨‍👩‍👧', title: 'Child Snapshot', value: 'Ready', subtitle: 'Attendance and performance pulse', tone: 'success' },
        { emoji: '🔔', title: 'Alerts', value: 'Smart', subtitle: 'Notices, holidays, risk signals', tone: 'info' },
        { emoji: '📈', title: 'Monthly Trend', value: 'Premium', subtitle: 'Parent-friendly progress summary', tone: 'gold' },
    ],
};

const toneColor = (tone: IntelligenceItem['tone']) => {
    if (tone === 'success') return dashboardTheme.colors.success;
    if (tone === 'warning') return dashboardTheme.colors.warning;
    if (tone === 'danger') return dashboardTheme.colors.danger;
    if (tone === 'info') return dashboardTheme.colors.info;
    return dashboardTheme.colors.gold;
};

type Props = {
    role: DashboardRole;
};

export default function DashboardIntelligencePanel({ role }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.eyebrow}>SCHOOL INTELLIGENCE</Text>
            <Text style={styles.title}>Production Intelligence Layer</Text>
            <Text style={styles.subtitle}>Shared dashboard foundation for mobile now, web app reuse later.</Text>
            <View style={styles.grid}>
                {roleIntelligence[role].map((item) => (
                    <View style={styles.item} key={item.title}>
                        <Text style={styles.emoji}>{item.emoji}</Text>
                        <Text style={[styles.value, { color: toneColor(item.tone) }]}>{item.value}</Text>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 26,
        padding: 18,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderWidth: 1,
        borderColor: dashboardTheme.colors.border,
        marginBottom: 18,
        ...dashboardTheme.shadows.card,
    },
    eyebrow: { color: dashboardTheme.colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    title: { color: dashboardTheme.colors.ink, fontSize: 20, fontWeight: '900', marginTop: 4 },
    subtitle: { color: dashboardTheme.colors.muted, fontSize: 12, marginTop: 5, lineHeight: 17 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 14 },
    item: { width: '31%', borderRadius: 18, padding: 10, backgroundColor: 'rgba(247,243,232,0.90)', borderWidth: 1, borderColor: 'rgba(215,168,79,0.18)' },
    emoji: { fontSize: 18, marginBottom: 5 },
    value: { fontSize: 13, fontWeight: '900' },
    itemTitle: { color: dashboardTheme.colors.ink, fontSize: 11, fontWeight: '900', marginTop: 3 },
    itemSubtitle: { color: dashboardTheme.colors.muted, fontSize: 9, lineHeight: 12, marginTop: 3 },
});
