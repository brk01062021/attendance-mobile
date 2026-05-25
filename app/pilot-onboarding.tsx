import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getPilotOnboardingSummary, pilotOnboardingFallback, PilotOnboardingSummary } from '../src/services/pilotOnboardingApi';
import { colors, shadows, spacing } from '../src/theme';

export default function PilotOnboardingScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const [summary, setSummary] = useState<PilotOnboardingSummary>(pilotOnboardingFallback);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('Checking pilot onboarding backend API...');

    const load = async () => {
        setLoading(true);
        try {
            const data = await getPilotOnboardingSummary(summary.schoolId || 1);
            setSummary(data);
            setMessage('Backend pilot onboarding API connected.');
        } catch {
            setSummary(pilotOnboardingFallback);
            setMessage('Backend unavailable. Showing safe Day 26 fallback checklist.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.eyebrow}>PILOT SCHOOL</Text>
                    <Text style={styles.title}>Pilot Onboarding</Text>
                </View>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(backHome as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
            </View>

            <View style={styles.heroCard}>
                <Text style={styles.heroTitle}>{summary.schoolName}</Text>
                <Text style={styles.heroText}>{message}</Text>
                <Text style={styles.heroText}>Target: {summary.targetStudents} students • {summary.targetTeachers} teachers • {summary.targetAdmins} admin • {summary.targetPrincipals} principal</Text>
            </View>

            <View style={styles.grid}>
                <Metric title="Students" value={String(summary.targetStudents)} />
                <Metric title="Teachers" value={String(summary.targetTeachers)} />
                <Metric title="Readiness" value={summary.readinessStatus.replace(/_/g, ' ')} />
                <Metric title="School ID" value={String(summary.schoolId)} />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={load}>{loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Reload Pilot API</Text>}</TouchableOpacity>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Onboarding Gates</Text>
                {summary.steps.map((step) => <View key={step.key} style={styles.stepCard}>
                    <View style={styles.stepTop}><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.priority}>{step.priority}</Text></View>
                    <Text style={styles.stepMeta}>{step.owner} • {step.status.replace(/_/g, ' ')}</Text>
                    <Text style={styles.stepDetail}>{step.detail}</Text>
                </View>)}
            </View>
        </ScrollView>
    </ImageBackground>;
}

function Metric({ title, value }: { title: string; value: string }) {
    return <View style={styles.metricCard}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricTitle}>{title}</Text></View>;
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 34 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
    circleButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.primaryNavy, fontSize: 28, fontWeight: '900', marginTop: -2 },
    homeIcon: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900', marginTop: 0 },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900', textAlign: 'center' },
    heroCard: { backgroundColor: 'rgba(13, 33, 57, 0.94)', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.42)', ...shadows.medium },
    heroTitle: { color: colors.white, fontSize: 21, fontWeight: '900', marginBottom: 6 },
    heroText: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', lineHeight: 20, marginTop: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    metricCard: { width: '48%', backgroundColor: colors.cardCream, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft },
    metricValue: { color: colors.primaryNavy, fontSize: 19, fontWeight: '900' },
    metricTitle: { color: colors.slateText, fontWeight: '800', marginTop: 3 },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 15, padding: 14, alignItems: 'center', marginBottom: 12 },
    primaryText: { color: colors.white, fontWeight: '900' },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    cardTitle: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900', marginBottom: 10 },
    stepCard: { backgroundColor: colors.cardCream, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 10 },
    stepTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    stepTitle: { flex: 1, color: colors.primaryNavy, fontWeight: '900', lineHeight: 20 },
    priority: { color: colors.deepGold, fontWeight: '900' },
    stepMeta: { color: colors.slateText, fontWeight: '900', marginTop: 5 },
    stepDetail: { color: colors.slateText, fontWeight: '700', lineHeight: 19, marginTop: 5 },
});
