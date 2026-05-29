import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getOnboardingStatus, normalizeOnboardingText, onboardingStatusLabel, OnboardingStatusResponse, statusTimeline } from '../src/services/schoolRegistrationApi';
import { colors, shadows, spacing, typography } from '../src/theme';

function Detail({ label, value }: { label: string; value?: string | null }) {
    return <Text style={styles.details}><Text style={styles.bold}>{label}:</Text> {value || '—'}</Text>;
}

export default function CheckRegistrationStatusScreen() {
    const [referenceId, setReferenceId] = useState('');
    const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const onCheck = async () => {
        const clean = referenceId.trim().toUpperCase();
        if (!clean) { Alert.alert('Reference ID', 'Enter the reference ID received after registration.'); return; }
        setLoading(true); setStatus(null);
        try { setStatus(await getOnboardingStatus(clean)); }
        catch (error: any) { Alert.alert('Registration Status', error?.response?.data?.message || error?.message || 'Unable to find registration status.'); }
        finally { setLoading(false); }
    };

    return (
        <ImageBackground source={require('../assets/branding/splash-dark.png')} style={styles.background} imageStyle={styles.bgImage}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={styles.headerRow}><TouchableOpacity style={styles.navButton} onPress={() => router.back()}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity><TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/login')}><Text style={styles.homeButtonText}>Login</Text></TouchableOpacity></View>
                    <Text style={styles.eyebrow}>PUBLIC ONBOARDING STATUS</Text>
                    <Text style={styles.title}>Check Registration Status</Text>
                    <Text style={styles.subtitle}>Track school onboarding by Reference ID. Login access stays disabled until the VidyaSetu Onboarding Team activates the school workspace and issues credentials.</Text>
                    <View style={styles.card}>
                        <Text style={styles.label}>Reference ID</Text>
                        <TextInput style={styles.input} placeholder="REG-202605290012-D74FC5" placeholderTextColor={colors.mutedText} value={referenceId} onChangeText={(value) => setReferenceId(value.toUpperCase())} autoCapitalize="characters" />
                        <TouchableOpacity style={styles.primaryButton} onPress={onCheck} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? 'Checking...' : 'Check Status'}</Text></TouchableOpacity>
                    </View>
                    {status ? (
                        <View style={styles.card}>
                            <Text style={styles.schoolName}>{status.schoolName}</Text>
                            <Detail label="Reference ID" value={status.referenceId} />
                            <Detail label="School ID" value={status.schoolId || 'Pending'} />
                            <Detail label="Registration Date" value={status.registrationDate || status.submittedAt} />
                            <Detail label="Current Status" value={onboardingStatusLabel(status.status)} />
                            <Detail label="Login Access" value={status.loginEnabled ? (status.credentialsIssuedAt ? 'Enabled — credentials issued' : 'Enabled — credentials pending') : 'Disabled until Active + Credentials Issued'} />
                            <Text style={styles.sectionTitle}>Status Message</Text>
                            <Text style={styles.message}>{normalizeOnboardingText(status.message)}</Text>
                            <Text style={styles.sectionTitle}>Next Step</Text>
                            <Text style={styles.message}>{normalizeOnboardingText(status.nextStep)}</Text>
                            <Text style={styles.sectionTitle}>Status Timeline</Text>
                            <View style={styles.timelineGrid}>{statusTimeline(status.status).map((step) => <Text key={step.key} style={[styles.timelineChip, !step.done && styles.timelineChipPending]}>{step.done ? '✓ ' : '○ '}{step.label}</Text>)}</View>
                            <Text style={styles.sectionTitle}>Audit History</Text>
                            <Detail label="Submitted By" value={status.submittedBy || 'School Registration Portal'} />
                            <Detail label="Submitted Date" value={status.submittedAt} />
                            <Detail label="Approved By" value={status.approvedBy} />
                            <Detail label="Approved Date" value={status.approvedAt} />
                            <Detail label="Pilot Enabled By" value={status.pilotEnabledBy} />
                            <Detail label="Pilot Date" value={status.pilotActivatedAt} />
                            <Detail label="Activated By" value={status.activatedBy} />
                            <Detail label="Activated Date" value={status.activatedAt} />
                            <Detail label="Credentials Issued By" value={status.credentialsIssuedBy} />
                            <Detail label="Credentials Issued Date" value={status.credentialsIssuedAt} />
                            {status.statusHistory ? <Text style={styles.auditHistory}>{normalizeOnboardingText(status.statusHistory)}</Text> : null}
                        </View>
                    ) : null}
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 }, background: { flex: 1, backgroundColor: colors.primaryNavy }, bgImage: { opacity: 0.24 }, container: { padding: spacing.screenPadding, paddingTop: 54, paddingBottom: spacing.xxxl },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    navButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.28)' },
    navButtonText: { color: colors.premiumGold, fontSize: 34, lineHeight: 34, fontWeight: '900' },
    homeButton: { minWidth: 78, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,223,155,0.14)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.34)' }, homeButtonText: { color: colors.premiumGold, fontWeight: '900' },
    eyebrow: { color: colors.premiumGold, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 }, title: { color: '#FFF7DF', fontSize: 32, lineHeight: 38, fontWeight: '900', marginTop: 8 }, subtitle: { color: '#D8C3A5', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8, marginBottom: spacing.xl },
    card: { backgroundColor: 'rgba(255,253,247,0.97)', borderRadius: 26, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xxl, marginBottom: spacing.lg, ...shadows.medium },
    label: { ...typography.label, color: colors.slateText, marginBottom: spacing.sm, fontWeight: '800' }, input: { minHeight: 54, borderRadius: 15, borderWidth: 1.5, borderColor: colors.cardGoldBorder, backgroundColor: colors.white, paddingHorizontal: spacing.lg, fontSize: 16, color: colors.darkText },
    primaryButton: { height: 58, borderRadius: 16, backgroundColor: colors.premiumGold, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, ...shadows.medium }, primaryButtonText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 17 },
    schoolName: { color: colors.primaryNavy, fontSize: 19, fontWeight: '900', marginBottom: spacing.sm }, details: { color: colors.slateText, fontWeight: '700', lineHeight: 21, marginTop: 5 }, bold: { color: colors.primaryNavy, fontWeight: '900' }, message: { color: colors.primaryNavy, fontWeight: '800', lineHeight: 21, marginTop: spacing.sm }, sectionTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15, marginTop: spacing.lg },
    timelineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm }, timelineChip: { color: colors.primaryNavy, fontWeight: '900', borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: 'rgba(248,223,155,0.34)' }, timelineChipPending: { opacity: 0.45 },
    auditHistory: { color: colors.slateText, fontWeight: '700', lineHeight: 20, marginTop: spacing.sm },
});
