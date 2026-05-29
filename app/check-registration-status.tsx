import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getOnboardingStatus, normalizeOnboardingText, onboardingStatusLabel, OnboardingStatusResponse } from '../src/services/schoolRegistrationApi';
import { colors, shadows, spacing, typography } from '../src/theme';

export default function CheckRegistrationStatusScreen() {
    const [referenceId, setReferenceId] = useState('');
    const [status, setStatus] = useState<OnboardingStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const onCheck = async () => {
        const clean = referenceId.trim().toUpperCase();
        if (!clean) {
            Alert.alert('Reference ID', 'Enter the reference ID received after registration.');
            return;
        }
        setLoading(true);
        setStatus(null);
        try {
            const response = await getOnboardingStatus(clean);
            setStatus(response);
        } catch (error: any) {
            Alert.alert('Registration Status', error?.response?.data?.message || error?.message || 'Unable to find registration status.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground source={require('../assets/branding/splash-dark.png')} style={styles.background} imageStyle={styles.bgImage}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.navButton} onPress={() => router.back()}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/login')}><Text style={styles.homeButtonText}>Login</Text></TouchableOpacity>
                    </View>

                    <Text style={styles.eyebrow}>PUBLIC ONBOARDING STATUS</Text>
                    <Text style={styles.title}>Check Registration Status</Text>
                    <Text style={styles.subtitle}>Use the reference ID received after Register School. Login credentials are shared only after tenant activation.</Text>

                    <View style={styles.card}>
                        <Text style={styles.label}>Reference ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="REG-202605290012-D74FC5"
                            placeholderTextColor={colors.mutedText}
                            value={referenceId}
                            onChangeText={(value) => setReferenceId(value.toUpperCase())}
                            autoCapitalize="characters"
                        />
                        <TouchableOpacity style={styles.primaryButton} onPress={onCheck} disabled={loading}>
                            <Text style={styles.primaryButtonText}>{loading ? 'Checking...' : 'Check Status'}</Text>
                        </TouchableOpacity>

                        {status ? (
                            <View style={styles.resultBox}>
                                <Text style={styles.schoolName}>{status.schoolName}</Text>
                                <Text style={styles.details}>Reference: {status.referenceId}</Text>
                                <Text style={styles.details}>school_id: {status.schoolId || 'Pending'}</Text>
                                <Text style={styles.details}>Status: {onboardingStatusLabel(status.status)}</Text>
                                <Text style={styles.details}>Login: {status.loginEnabled ? 'Enabled after credentials are shared' : 'Disabled until Active'}</Text>
                                <Text style={styles.details}>Excel Import: Disabled</Text>
                                <Text style={styles.message}>{normalizeOnboardingText(status.message)}</Text>
                                <Text style={styles.message}>Next: {normalizeOnboardingText(status.nextStep)}</Text>
                            </View>
                        ) : null}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    background: { flex: 1, backgroundColor: colors.primaryNavy },
    bgImage: { opacity: 0.24 },
    container: { padding: spacing.screenPadding, paddingTop: 54, paddingBottom: spacing.xxxl },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    navButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.28)' },
    navButtonText: { color: colors.premiumGold, fontSize: 34, lineHeight: 34, fontWeight: '900' },
    homeButton: { minWidth: 78, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,223,155,0.14)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.34)' },
    homeButtonText: { color: colors.premiumGold, fontWeight: '900' },
    eyebrow: { color: colors.premiumGold, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    title: { color: '#FFF7DF', fontSize: 32, lineHeight: 38, fontWeight: '900', marginTop: 8 },
    subtitle: { color: '#D8C3A5', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8, marginBottom: spacing.xl },
    card: { backgroundColor: 'rgba(255,253,247,0.97)', borderRadius: 26, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xxl, ...shadows.medium },
    label: { ...typography.label, color: colors.slateText, marginBottom: spacing.sm, fontWeight: '800' },
    input: { minHeight: 54, borderRadius: 15, borderWidth: 1.5, borderColor: colors.cardGoldBorder, backgroundColor: colors.white, paddingHorizontal: spacing.lg, fontSize: 16, color: colors.darkText },
    primaryButton: { height: 58, borderRadius: 16, backgroundColor: colors.premiumGold, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, ...shadows.medium },
    primaryButtonText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 17 },
    resultBox: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.cardGoldBorder, paddingTop: spacing.lg },
    schoolName: { color: colors.primaryNavy, fontSize: 19, fontWeight: '900' },
    details: { color: colors.slateText, fontWeight: '700', lineHeight: 21, marginTop: 5 },
    message: { color: colors.primaryNavy, fontWeight: '800', lineHeight: 21, marginTop: spacing.md },
});
