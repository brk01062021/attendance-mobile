import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ImageBackground, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, shadows, spacing } from '../src/theme';

export default function ImportExistingTimetableScreen() {
    const params = useLocalSearchParams<{ role?: string; sourceRole?: string }>();
    const sourceRole = String(params.sourceRole || params.role || 'admin').toLowerCase();
    const roleLabel = sourceRole === 'principal' ? 'Principal' : 'Admin';
    const homeRoute = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.circleButton} onPress={() => router.back()} activeOpacity={0.85}>
                            <Text style={styles.backText}>‹</Text>
                        </TouchableOpacity>
                        <View style={styles.headerTextWrap}>
                            <Text style={styles.eyebrow}>TIMETABLE IMPORT</Text>
                            <Text style={styles.title}>Import Existing Timetable</Text>
                        </View>
                        <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homeRoute as any)} activeOpacity={0.85}>
                            <Text style={styles.homeIcon}>⌂</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.heroCard}>
                        <Text style={styles.heroTitle}>Web ERP Import Guidance</Text>
                        <Text style={styles.heroText}>
                            Use Web ERP to upload, validate, preview, and publish the active school timetable.
                        </Text>
                        <View style={styles.statusPill}>
                            <Text style={styles.statusText}>After publish, Teacher, Student, and Parent timetable visibility is updated.</Text>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>REQUIRED FORMAT</Text>
                        <Text style={styles.cardTitle}>Excel columns</Text>
                        <Text style={styles.requiredText}>Class · Section · Day · Period · Subject · Teacher</Text>
                        <Text style={styles.bodyText}>Keep headers in row 1. Add one row per class period.</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>PRODUCTION FLOW</Text>
                        <Step number="1" title="Open Web ERP" subtitle="Go to Timetable → Import Existing Timetable." />
                        <Step number="2" title="Upload Excel" subtitle="Select the active timetable file." />
                        <Step number="3" title="Validate and Preview" subtitle="Review summary cards and preview records." />
                        <Step number="4" title="Publish" subtitle="Publish after validation passes." last />
                    </View>

                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/timetable-operations' as any, params: { role: roleLabel.toUpperCase(), sourceRole } })} activeOpacity={0.88}>
                        <Text style={styles.primaryText}>Open Timetable Operations</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace(homeRoute as any)} activeOpacity={0.88}>
                        <Text style={styles.secondaryText}>Back to {roleLabel} Home</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

function Step({ number, title, subtitle, last = false }: { number: string; title: string; subtitle: string; last?: boolean }) {
    return (
        <View style={[styles.stepRow, last && styles.stepRowLast]}>
            <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{number}</Text></View>
            <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepSubtitle}>{subtitle}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    safeArea: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 34 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
    circleButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 },
    homeIcon: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900' },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 10, letterSpacing: 1.8, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900', textAlign: 'center' },
    heroCard: { backgroundColor: 'rgba(13, 33, 57, 0.95)', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.46)', ...shadows.medium },
    heroTitle: { color: colors.white, fontSize: 21, fontWeight: '900', lineHeight: 25, marginBottom: 10 },
    heroText: { color: 'rgba(255,255,255,0.84)', fontWeight: '800', lineHeight: 20 },
    statusPill: { marginTop: 14, borderRadius: 16, padding: 12, backgroundColor: 'rgba(245,190,56,0.14)', borderWidth: 1, borderColor: 'rgba(245,190,56,0.38)' },
    statusText: { color: colors.cardCream, fontWeight: '900', lineHeight: 18 },
    card: { backgroundColor: 'rgba(255,253,247,0.97)', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    cardLabel: { color: colors.deepGold, fontWeight: '900', fontSize: 10, letterSpacing: 1.3, marginBottom: 4 },
    cardTitle: { color: colors.primaryNavy, fontSize: 18, fontWeight: '900', marginBottom: 8 },
    requiredText: { color: colors.deepGold, fontSize: 17, fontWeight: '900', marginBottom: 8, lineHeight: 22 },
    bodyText: { color: colors.slateText, fontWeight: '800', lineHeight: 20 },
    stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.22)' },
    stepRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    stepBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryNavy, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
    stepBadgeText: { color: colors.white, fontWeight: '900' },
    stepTextWrap: { flex: 1 },
    stepTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15 },
    stepSubtitle: { color: colors.slateText, fontWeight: '800', lineHeight: 19, marginTop: 2 },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 18, paddingVertical: 15, alignItems: 'center', ...shadows.medium },
    primaryText: { color: colors.white, fontWeight: '900', fontSize: 15 },
    secondaryButton: { marginTop: 10, backgroundColor: 'rgba(255,253,247,0.82)', borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 18, paddingVertical: 14, alignItems: 'center' },
    secondaryText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15 },
});
