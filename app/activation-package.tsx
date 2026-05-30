import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ActivationPackage, generateActivationPackage, normalizeOnboardingText, onboardingStatusLabel, statusTimeline } from '../src/services/schoolRegistrationApi';
import { colors, shadows, spacing } from '../src/theme';

export default function ActivationPackageScreen() {
    const params = useLocalSearchParams<{ referenceId?: string }>();
    const [referenceId, setReferenceId] = useState('');
    const [pkg, setPkg] = useState<ActivationPackage | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (params.referenceId) setReferenceId(String(params.referenceId).toUpperCase());
    }, [params.referenceId]);

    const onGenerate = async () => {
        const clean = referenceId.trim().toUpperCase();
        if (!clean) { Alert.alert('Activation Package', 'Enter an ACTIVE tenant Reference ID.'); return; }
        setLoading(true); setPkg(null);
        try { setPkg(await generateActivationPackage(clean)); }
        catch (error: any) { Alert.alert('Activation Package', error?.response?.data?.message || error?.message || 'Unable to generate activation package.'); }
        finally { setLoading(false); }
    };

    return (
        <ImageBackground source={require('../assets/branding/splash-dark.png')} style={styles.background} imageStyle={styles.bgImage}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}><TouchableOpacity style={styles.navButton} onPress={() => router.back()}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity><TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/onboarding-review')}><Text style={styles.homeButtonText}>Queue</Text></TouchableOpacity></View>
                <Text style={styles.eyebrow}>SCHOOL ACTIVATION & WORKSPACE PROVISIONING</Text>
                <Text style={styles.title}>Activation Package</Text>
                <Text style={styles.subtitle}>Generate first Admin and Principal login credentials after activation, then use this as the workspace handover checklist.</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Reference ID</Text>
                    <TextInput style={styles.input} placeholder="REG-202605290012-D74FC5" placeholderTextColor={colors.mutedText} value={referenceId} onChangeText={(value) => setReferenceId(value.toUpperCase())} autoCapitalize="characters" />
                    <TouchableOpacity style={styles.primaryButton} onPress={onGenerate} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? 'Generating...' : 'Generate Activation Package'}</Text></TouchableOpacity>
                </View>
                {pkg ? (
                    <View style={styles.card}>
                        <Text style={styles.schoolName}>{pkg.schoolName}</Text>
                        <Text style={styles.details}>School ID: {pkg.schoolId}</Text>
                        <Text style={styles.details}>Reference: {pkg.referenceId}</Text>
                        <Text style={styles.details}>Status: {onboardingStatusLabel(pkg.status)}</Text>
                        <Text style={styles.details}>Credentials Issued: {pkg.credentialsIssuedAt || 'Just generated'}</Text>
                        <Text style={styles.sectionTitle}>Activation Summary</Text>
                        <Text style={styles.message}>{normalizeOnboardingText(pkg.message)}</Text>
                        <Text style={styles.message}>{normalizeOnboardingText(pkg.nextStep)}</Text>
                        {pkg.workspaceSteps?.length ? (<><Text style={styles.sectionTitle}>Workspace Provisioning</Text>{pkg.workspaceSteps.map((step) => (<View key={step.key} style={styles.credentialBox}><Text style={styles.credentialRole}>{step.status} • {step.label}</Text><Text style={styles.details}>{step.detail}</Text></View>))}</>) : null}
                        <Text style={styles.sectionTitle}>Generated Credentials</Text>
                        {pkg.credentials.map((credential) => (
                            <View key={credential.role} style={styles.credentialBox}>
                                <Text style={styles.credentialRole}>{credential.role}</Text>
                                <Text style={styles.details}>Username: {credential.username}</Text>
                                <Text style={styles.details}>Temporary Password: {credential.initialPassword}</Text>
                                <Text style={styles.details}>Account: {credential.created ? 'Created now' : 'Already available'}</Text>
                            </View>
                        ))}
                        {pkg.activationChecklist?.length ? (<><Text style={styles.sectionTitle}>Activation Handover Checklist</Text>{pkg.activationChecklist.map((item) => <Text key={item} style={styles.details}>✓ {item}</Text>)}</>) : null}
                        {pkg.importPreparationChecklist?.length ? (<><Text style={styles.sectionTitle}>Excel Import Preparation</Text>{pkg.importPreparationChecklist.map((item) => <Text key={item} style={styles.details}>• {item}</Text>)}</>) : null}
                        <Text style={styles.sectionTitle}>Status Timeline</Text>
                        <View style={styles.timelineGrid}>{statusTimeline(pkg.status).map((step) => <Text key={step.key} style={[styles.timelineChip, !step.done && styles.timelineChipPending]}>{step.done ? '✓ ' : '○ '}{step.label}</Text>)}</View>
                        <Text style={styles.sectionTitle}>Audit History</Text>
                        <Text style={styles.auditText}>{normalizeOnboardingText(pkg.statusSummary?.statusHistory || 'No audit history found.')}</Text>
                    </View>
                ) : null}
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.primaryNavy }, bgImage: { opacity: 0.24 }, container: { padding: spacing.screenPadding, paddingTop: 54, paddingBottom: spacing.xxxl }, headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    navButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.28)' }, navButtonText: { color: colors.premiumGold, fontSize: 34, lineHeight: 34, fontWeight: '900' }, homeButton: { minWidth: 78, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,223,155,0.14)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.34)' }, homeButtonText: { color: colors.premiumGold, fontWeight: '900' },
    eyebrow: { color: colors.premiumGold, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#FFF7DF', fontSize: 31, lineHeight: 36, fontWeight: '900', marginTop: 8 }, subtitle: { color: '#D8C3A5', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8, marginBottom: spacing.xl },
    card: { backgroundColor: 'rgba(255,253,247,0.97)', borderRadius: 24, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.medium }, label: { color: colors.slateText, fontWeight: '900', marginBottom: 8 }, input: { minHeight: 54, borderRadius: 15, borderWidth: 1.5, borderColor: colors.cardGoldBorder, backgroundColor: colors.white, paddingHorizontal: spacing.lg, fontSize: 16, color: colors.darkText },
    primaryButton: { height: 56, borderRadius: 16, backgroundColor: colors.premiumGold, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, ...shadows.medium }, primaryButtonText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 16 }, schoolName: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900' }, details: { color: colors.slateText, fontWeight: '700', lineHeight: 20, marginTop: 5 }, sectionTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 16, marginTop: spacing.lg, marginBottom: spacing.sm }, message: { color: colors.primaryNavy, fontWeight: '800', lineHeight: 21, marginTop: 4 }, credentialBox: { borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 16, padding: spacing.md, marginTop: spacing.sm, backgroundColor: 'rgba(10,31,68,0.04)' }, credentialRole: { color: colors.primaryNavy, fontWeight: '900', fontSize: 16 }, timelineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, timelineChip: { color: colors.primaryNavy, fontWeight: '900', borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(248,223,155,0.34)' }, timelineChipPending: { opacity: 0.45 }, auditText: { color: colors.slateText, fontWeight: '700', lineHeight: 20 },
});
