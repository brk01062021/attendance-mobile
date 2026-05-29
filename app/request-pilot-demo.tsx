import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getOnboardingStatus, normalizeOnboardingText, onboardingStatusLabel, OnboardingStatusResponse, RegistrationResponse, requestPilotDemo } from '../src/services/schoolRegistrationApi';
import { colors, shadows, spacing, typography } from '../src/theme';

export default function RequestPilotDemoScreen() {
    const [schoolName, setSchoolName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [preferredRole, setPreferredRole] = useState('Principal');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [expectedStudents, setExpectedStudents] = useState('');
    const [notes, setNotes] = useState('');
    const [result, setResult] = useState<RegistrationResponse | null>(null);
    const [statusDetails, setStatusDetails] = useState<OnboardingStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        if (!schoolName.trim() || !contactPerson.trim() || !contactPhone.trim()) {
            Alert.alert('Validation', 'School name, contact person, and phone are required.');
            return;
        }
        setLoading(true);
        try {
            const response = await requestPilotDemo({
                schoolName: schoolName.trim(),
                contactPerson: contactPerson.trim(),
                contactPhone: contactPhone.trim(),
                contactEmail: contactEmail.trim(),
                preferredRole: preferredRole.trim(),
                city: city.trim(),
                state: state.trim(),
                expectedStudents: expectedStudents ? Number(expectedStudents) : null,
                notes: notes.trim(),
            });
            setResult(response);
            const status = await getOnboardingStatus(response.referenceId);
            setStatusDetails(status);
        } catch (error: any) {
            Alert.alert('Pilot Demo', error?.response?.data?.message || error?.message || 'Pilot demo request could not be saved.');
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

                    <Text style={styles.eyebrow}>PILOT DEMO</Text>
                    <Text style={styles.title}>Request Pilot Demo</Text>
                    <Text style={styles.subtitle}>Capture school interest before final onboarding, AWS staging, or app-store rollout.</Text>

                    <View style={styles.card}>
                        <Field label="School Name" value={schoolName} onChangeText={setSchoolName} placeholder="School name" />
                        <Field label="Contact Person" value={contactPerson} onChangeText={setContactPerson} placeholder="Principal/Admin name" />
                        <Field label="Contact Phone" value={contactPhone} onChangeText={setContactPhone} placeholder="Phone number" keyboardType="phone-pad" />
                        <Field label="Contact Email" value={contactEmail} onChangeText={setContactEmail} placeholder="school@example.com" keyboardType="email-address" autoCapitalize="none" />
                        <Field label="Preferred Contact Role" value={preferredRole} onChangeText={setPreferredRole} placeholder="Principal" />
                        <Field label="City" value={city} onChangeText={setCity} placeholder="City" />
                        <Field label="State" value={state} onChangeText={setState} placeholder="State" />
                        <Field label="Expected Students" value={expectedStudents} onChangeText={setExpectedStudents} placeholder="1000" keyboardType="number-pad" />
                        <Field label="Demo Notes" value={notes} onChangeText={setNotes} placeholder="Modules to show, best time to contact" multiline />

                        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? 'Saving...' : 'Submit Pilot Demo Request'}</Text></TouchableOpacity>
                        {result ? <Text style={styles.success}>Reference {result.referenceId}\n{normalizeOnboardingText(result.message)}\nNext: {normalizeOnboardingText(result.nextStep)}</Text> : null}
                        {statusDetails ? <Text style={styles.success}>Lifecycle: {onboardingStatusLabel(statusDetails.status)}\nLogin: {statusDetails.loginEnabled ? 'Enabled for active tenant' : 'Disabled until Active'}\nExcel Import: Disabled\nNext: {normalizeOnboardingText(statusDetails.nextStep)}</Text> : null}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };
function Field({ label, style, ...props }: FieldProps) {
    return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor={colors.mutedText} style={[styles.input, props.multiline && styles.textArea, style]} /></View>;
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    background: { flex: 1, backgroundColor: colors.primaryNavy },
    bgImage: { opacity: 0.26 },
    container: { padding: spacing.screenPadding, paddingTop: 54, paddingBottom: spacing.xxxl },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    navButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.28)' },
    navButtonText: { color: colors.premiumGold, fontSize: 34, lineHeight: 34, fontWeight: '900' },
    homeButton: { minWidth: 78, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,223,155,0.14)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.34)' },
    homeButtonText: { color: colors.premiumGold, fontWeight: '900' },
    eyebrow: { color: colors.premiumGold, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    title: { color: '#FFF7DF', fontSize: 34, lineHeight: 38, fontWeight: '900', marginTop: 8 },
    subtitle: { color: '#D8C3A5', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8, marginBottom: spacing.xl },
    card: { backgroundColor: 'rgba(255,253,247,0.97)', borderRadius: 26, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xxl, ...shadows.medium },
    field: { marginBottom: spacing.md },
    label: { ...typography.label, color: colors.slateText, marginBottom: spacing.sm, fontWeight: '800' },
    input: { minHeight: 54, borderRadius: 15, borderWidth: 1.5, borderColor: colors.cardGoldBorder, backgroundColor: colors.white, paddingHorizontal: spacing.lg, fontSize: 16, color: colors.darkText },
    textArea: { minHeight: 96, paddingTop: spacing.md, textAlignVertical: 'top' },
    primaryButton: { height: 58, borderRadius: 16, backgroundColor: colors.premiumGold, alignItems: 'center', justifyContent: 'center', marginTop: spacing.lg, ...shadows.medium },
    primaryButtonText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 17 },
    success: { color: colors.primaryNavy, fontWeight: '800', lineHeight: 21, marginTop: spacing.md },
});
