import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { checkSchoolId, getOnboardingStatus, normalizeOnboardingText, normalizeRequestedSchoolId, onboardingStatusLabel, OnboardingStatusResponse, registerSchool, RegistrationResponse, SchoolIdAvailabilityResponse } from '../src/services/schoolRegistrationApi';
import { colors, shadows, spacing, typography } from '../src/theme';

export default function RegisterSchoolScreen() {
    const [schoolName, setSchoolName] = useState('');
    const [requestedSchoolId, setRequestedSchoolId] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [expectedStudents, setExpectedStudents] = useState('');
    const [expectedTeachers, setExpectedTeachers] = useState('');
    const [notes, setNotes] = useState('');
    const [schoolIdCheck, setSchoolIdCheck] = useState<SchoolIdAvailabilityResponse | null>(null);
    const [result, setResult] = useState<RegistrationResponse | null>(null);
    const [statusDetails, setStatusDetails] = useState<OnboardingStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const cleanSchoolId = useMemo(() => normalizeRequestedSchoolId(requestedSchoolId), [requestedSchoolId]);

    const onCheckSchoolId = async () => {
        if (cleanSchoolId.length !== 4) {
            Alert.alert('School ID', 'Enter exactly 4 uppercase letters/numbers.');
            return;
        }
        try {
            const response = await checkSchoolId(cleanSchoolId);
            setSchoolIdCheck(response);
            setResult(null);
            setStatusDetails(null);
        } catch (error: any) {
            Alert.alert('School ID Check', error?.response?.data?.message || error?.message || 'Unable to check school ID.');
        }
    };

    const onSubmit = async () => {
        if (!schoolName.trim() || !contactPerson.trim() || !contactPhone.trim() || cleanSchoolId.length !== 4) {
            Alert.alert('Validation', 'School name, 4-character school_id, contact person, and phone are required.');
            return;
        }
        setLoading(true);
        try {
            const response = await registerSchool({
                schoolName: schoolName.trim(),
                requestedSchoolId: cleanSchoolId,
                contactPerson: contactPerson.trim(),
                contactPhone: contactPhone.trim(),
                contactEmail: contactEmail.trim(),
                city: city.trim(),
                state: state.trim(),
                expectedStudents: expectedStudents ? Number(expectedStudents) : null,
                expectedTeachers: expectedTeachers ? Number(expectedTeachers) : null,
                notes: notes.trim(),
            });
            setResult(response);
            const status = await getOnboardingStatus(response.referenceId);
            setStatusDetails(status);
            setSchoolIdCheck(null);
        } catch (error: any) {
            Alert.alert('Register School', error?.response?.data?.message || error?.message || 'Registration could not be saved.');
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

                    <Text style={styles.eyebrow}>SCHOOL ONBOARDING</Text>
                    <Text style={styles.title}>Register School</Text>
                    <Text style={styles.subtitle}>Create a tenant-safe VidyaSetu school workspace foundation. Final Excel data import stays disabled until MVP onboarding is ready.</Text>

                    <View style={styles.card}>
                        <Field label="School Name" value={schoolName} onChangeText={setSchoolName} placeholder="BRK International School" />
                        <Field label="Requested school_id" value={requestedSchoolId} onChangeText={(value) => setRequestedSchoolId(normalizeRequestedSchoolId(value))} placeholder="BRK1" maxLength={4} autoCapitalize="characters" />
                        <TouchableOpacity style={styles.secondaryButton} onPress={onCheckSchoolId}><Text style={styles.secondaryButtonText}>Check school_id</Text></TouchableOpacity>
                        {schoolIdCheck ? <Text style={styles.notice}>{schoolIdCheck.schoolId}: {schoolIdCheck.message}</Text> : null}
                        <Field label="Contact Person" value={contactPerson} onChangeText={setContactPerson} placeholder="Principal/Admin name" />
                        <Field label="Contact Phone" value={contactPhone} onChangeText={setContactPhone} placeholder="Phone number" keyboardType="phone-pad" />
                        <Field label="Contact Email" value={contactEmail} onChangeText={setContactEmail} placeholder="school@example.com" keyboardType="email-address" autoCapitalize="none" />
                        <Field label="City" value={city} onChangeText={setCity} placeholder="City" />
                        <Field label="State" value={state} onChangeText={setState} placeholder="State" />
                        <Field label="Expected Students" value={expectedStudents} onChangeText={setExpectedStudents} placeholder="600" keyboardType="number-pad" />
                        <Field label="Expected Teachers" value={expectedTeachers} onChangeText={setExpectedTeachers} placeholder="50" keyboardType="number-pad" />
                        <Field label="Notes" value={notes} onChangeText={setNotes} placeholder="Pilot notes" multiline />

                        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit} disabled={loading}><Text style={styles.primaryButtonText}>{loading ? 'Saving...' : 'Submit Registration'}</Text></TouchableOpacity>
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
    secondaryButton: { height: 50, borderRadius: 15, backgroundColor: colors.primaryNavy, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    secondaryButtonText: { color: colors.premiumGold, fontWeight: '900' },
    notice: { color: colors.slateText, fontWeight: '800', lineHeight: 20, marginBottom: spacing.md },
    success: { color: colors.primaryNavy, fontWeight: '800', lineHeight: 21, marginTop: spacing.md },
});
