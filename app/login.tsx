import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { activateParentLogin, authResponseToSession, loginWithTenant, requestParentOtp } from '../src/services/authApi';
import { getOnboardingStatusBySchoolId, normalizeOnboardingText } from '../src/services/schoolRegistrationApi';
import { normalizeSchoolId, saveSession } from '../src/services/sessionService';
import { colors, shadows, spacing, typography } from '../src/theme';

type LoginRole = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'PARENT' | 'STUDENT';

export default function LoginScreen() {
    const [selectedRole, setSelectedRole] = useState<LoginRole>('TEACHER');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [schoolId, setSchoolId] = useState('BRK1');
    const [parentStudentId, setParentStudentId] = useState('');
    const [parentMobile, setParentMobile] = useState('');
    const [parentOtp, setParentOtp] = useState('');
    const [parentNewPassword, setParentNewPassword] = useState('');
    const [parentOtpRequested, setParentOtpRequested] = useState(false);

    const roles: LoginRole[] = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'];

    const routeAfterLogin = (role: LoginRole, displayName: string, cleanSchoolId: string, userId: string, teacherId?: string | number | null, studentId?: string | number | null, studentName?: string | null) => {
        if (role === 'ADMIN') {
            router.replace({ pathname: '/admin-dashboard', params: { role, adminName: displayName || 'Admin', userId, schoolId: cleanSchoolId } } as any);
            return;
        }

        if (role === 'PRINCIPAL') {
            router.replace({ pathname: '/principal-home', params: { role, principalName: displayName || 'Principal', userId, schoolId: cleanSchoolId } } as any);
            return;
        }

        if (role === 'TEACHER') {
            router.replace({ pathname: '/teacher-dashboard', params: { role, teacherId: String(teacherId || userId || '1'), teacherName: displayName, schoolId: cleanSchoolId } } as any);
            return;
        }

        if (role === 'PARENT') {
            router.replace({ pathname: '/parent-dashboard', params: { role, parentId: userId || '1', parentName: displayName, studentId: String(studentId || '1'), studentName: studentName || 'Student', schoolId: cleanSchoolId } } as any);
            return;
        }

        router.replace({ pathname: '/student-dashboard', params: { role, studentId: String(studentId || userId || '1'), studentName: studentName || displayName, schoolId: cleanSchoolId } } as any);
    };



    const handleParentOtpRequest = async () => {
        const cleanSchoolId = normalizeSchoolId(schoolId);
        if (!parentStudentId.trim() || !parentMobile.trim()) {
            Alert.alert('Validation', 'Enter Student ID and parent mobile number from school import data.');
            return;
        }
        try {
            const response = await requestParentOtp({ schoolId: cleanSchoolId, studentId: parentStudentId, parentMobile });
            setParentOtpRequested(true);
            Alert.alert('OTP Sent', response.message || `OTP sent to registered parent mobile${response.maskedMobile ? ` ${response.maskedMobile}` : ''}.`);
        } catch (error: any) {
            Alert.alert('OTP Request Failed', error?.response?.data?.message || error?.response?.data || error?.message || 'Student and parent mobile mapping could not be verified.');
        }
    };

    const handleParentActivation = async () => {
        const cleanSchoolId = normalizeSchoolId(schoolId);
        if (!parentStudentId.trim() || !parentMobile.trim() || !parentOtp.trim() || parentNewPassword.trim().length < 8) {
            Alert.alert('Validation', 'Enter Student ID, parent mobile, OTP and a new password of at least 8 characters.');
            return;
        }
        try {
            const authResponse = await activateParentLogin({ schoolId: cleanSchoolId, studentId: parentStudentId, parentMobile, otp: parentOtp, newPassword: parentNewPassword });
            const session = authResponseToSession(authResponse, 'PARENT', parentMobile.trim(), cleanSchoolId);
            saveSession(session);
            routeAfterLogin(session.role, session.displayName || parentMobile.trim(), session.schoolId, session.userId, session.teacherId, session.studentId, session.studentName);
        } catch (error: any) {
            Alert.alert('Parent Activation Failed', error?.response?.data?.message || error?.response?.data || error?.message || 'Unable to activate parent login.');
        }
    };

    const handleLogin = async () => {
        const cleanUsername = username.trim();
        const cleanSchoolId = normalizeSchoolId(schoolId);
        const cleanPassword = password.trim();

        if (!cleanUsername || !cleanPassword) {
            Alert.alert('Validation', 'Please enter username and password');
            return;
        }

        try {
            const status = await getOnboardingStatusBySchoolId(cleanSchoolId);
            if (!status.loginEnabled) {
                Alert.alert('Registration Not Active', normalizeOnboardingText(`${status.message}

${status.nextStep}

Use Check Registration Status with your reference ID.`));
                return;
            }

            const authResponse = await loginWithTenant({ username: cleanUsername, password: cleanPassword, role: selectedRole, schoolId: cleanSchoolId });
            const session = authResponseToSession(authResponse, selectedRole, cleanUsername, cleanSchoolId);
            saveSession(session);

            if (session.forcePasswordChange) {
                router.replace({
                    pathname: '/change-password',
                    params: {
                        username: cleanUsername,
                        schoolId: cleanSchoolId,
                        role: session.role,
                        currentPassword: cleanPassword,
                    },
                } as any);
                return;
            }

            routeAfterLogin(session.role, session.displayName || cleanUsername, session.schoolId, session.userId, session.teacherId, session.studentId, session.studentName);
        } catch (error: any) {
            Alert.alert('Login Failed', error?.response?.data?.message || error?.response?.data || error?.message || 'Invalid username, password, or school ID');
        }
    };

    return (
        <ImageBackground
            source={require('../assets/branding/india-ap-bg.png')}
            style={styles.background}
            imageStyle={styles.bgImage}
            resizeMode="contain"
        >
            <View style={styles.overlay} />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.container}>
                    <Image
                        source={require('../assets/branding/vidyasetu-logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>
                        Welcome to{'\n'}
                        <Text style={styles.brandText}>VidyaSetu</Text>
                    </Text>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Login to your workspace</Text>

                        <Text style={styles.label}>Select Role</Text>

                        <View style={styles.roleGrid}>
                            {roles.map((role) => {
                                const active = selectedRole === role;

                                return (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            styles.roleButton,
                                            active && styles.roleButtonActive,
                                        ]}
                                        onPress={() => setSelectedRole(role)}
                                        activeOpacity={0.85}
                                    >
                                        <Text
                                            style={[
                                                styles.roleText,
                                                active && styles.roleTextActive,
                                            ]}
                                        >
                                            {role}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.label}>{selectedRole === 'PARENT' ? 'Parent Mobile Number' : 'Username'}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={selectedRole === 'PARENT' ? 'Enter parent mobile number' : 'Enter username'}
                            placeholderTextColor={colors.mutedText}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />

                        <Text style={styles.label}>School ID</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="4-char school ID, e.g. BRK1"
                            placeholderTextColor={colors.mutedText}
                            value={schoolId}
                            onChangeText={(value) => setSchoolId(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
                            autoCapitalize="characters"
                            maxLength={4}
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter password"
                            placeholderTextColor={colors.mutedText}
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={handleLogin}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.loginButtonText}>
                                {selectedRole === 'PARENT' ? 'Login with Parent Password' : `Login as ${selectedRole}`}
                            </Text>
                        </TouchableOpacity>


                        {selectedRole === 'PARENT' ? (
                            <View style={styles.parentSetupBox}>
                                <Text style={styles.parentSetupTitle}>First-time Parent OTP Setup</Text>
                                <Text style={styles.parentSetupText}>Use Student ID and parent mobile from school import data. The OTP will be sent to the registered parent mobile. After OTP verification, create the parent password. Future login uses school ID + mobile + password.</Text>

                                <Text style={styles.label}>Student ID</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Imported student ID / admission no"
                                    placeholderTextColor={colors.mutedText}
                                    value={parentStudentId}
                                    onChangeText={setParentStudentId}
                                    autoCapitalize="characters"
                                />

                                <Text style={styles.label}>Parent Mobile</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Imported parent mobile"
                                    placeholderTextColor={colors.mutedText}
                                    value={parentMobile}
                                    onChangeText={setParentMobile}
                                    keyboardType="phone-pad"
                                />

                                <TouchableOpacity style={styles.secondaryActionButton} onPress={handleParentOtpRequest} activeOpacity={0.9}>
                                    <Text style={styles.secondaryActionText}>Request OTP</Text>
                                </TouchableOpacity>

                                {parentOtpRequested ? (
                                    <>
                                        <Text style={styles.label}>OTP</Text>
                                        <TextInput style={styles.input} placeholder="Enter OTP" placeholderTextColor={colors.mutedText} value={parentOtp} onChangeText={setParentOtp} keyboardType="number-pad" />
                                        <Text style={styles.label}>Create Password</Text>
                                        <TextInput style={styles.input} placeholder="Minimum 8 characters" placeholderTextColor={colors.mutedText} secureTextEntry value={parentNewPassword} onChangeText={setParentNewPassword} />
                                        <TouchableOpacity style={styles.loginButton} onPress={handleParentActivation} activeOpacity={0.9}>
                                            <Text style={styles.loginButtonText}>Verify OTP & Create Parent Password</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : null}
                            </View>
                        ) : null}

                        <View style={styles.onboardingActions}>
                            <TouchableOpacity
                                style={styles.onboardingButton}
                                onPress={() => router.push('/register-school')}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.onboardingButtonText}>Register School</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.onboardingButton}
                                onPress={() => router.push('/request-pilot-demo')}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.onboardingButtonText}>Request Pilot Demo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.onboardingButton, styles.statusCheckButton]}
                                onPress={() => router.push('/check-registration-status')}
                                activeOpacity={0.88}
                            >
                                <Text style={styles.onboardingButtonText}>Check Registration Status</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.linksRow}>
                            <TouchableOpacity>
                                <Text style={styles.link}>Forgot Username?</Text>
                            </TouchableOpacity>

                            <Text style={styles.linkDivider}>|</Text>

                            <TouchableOpacity>
                                <Text style={styles.link}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.footerText}>
                        Empowering Education. Building Futures.
                    </Text>
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.primaryNavy,
    },
    bgImage: {
        width: '100%',
        height: '70%',
        alignSelf: 'center',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(6, 27, 51, 0.40)',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 49,
        paddingBottom: spacing.xxxl,
        justifyContent: 'center',
    },
    logo: {
        width: 250,
        height: 400,
        alignSelf: 'center',
        marginTop: 0,
        marginBottom: -28,
    },
    title: {
        fontSize: 40,
        lineHeight: 42,
        fontWeight: '900',
        color: colors.premiumGold,
        textAlign: 'center',
        marginTop: 0,
        marginBottom: 14,
        letterSpacing: 1,
    },
    brandText: {
        color: '#FFD76A',
        letterSpacing: 1.5,
    },
    card: {
        backgroundColor: 'rgba(255,253,247,0.97)',
        borderRadius: 26,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xxl,
        ...shadows.medium,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primaryNavy,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    label: {
        ...typography.label,
        color: colors.slateText,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        fontWeight: '700',
    },
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: spacing.md,
    },
    roleButton: {
        width: '47.8%',
        height: 50,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleButtonActive: {
        backgroundColor: colors.primaryNavy,
        borderColor: colors.premiumGold,
    },
    roleText: {
        fontSize: 15,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    roleTextActive: {
        color: colors.premiumGold,
    },
    input: {
        height: 58,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        fontSize: 17,
        color: colors.darkText,
        marginBottom: spacing.md,
    },
    loginButton: {
        height: 60,
        borderRadius: 16,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.medium,
    },
    loginButtonText: {
        ...typography.button,
        color: colors.primaryNavy,
        fontWeight: '900',
        fontSize: 18,
    },
    statusCheckButton: {
        width: '100%',
    },
    onboardingActions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: spacing.lg,
    },
    onboardingButton: {
        flex: 1,
        minHeight: 50,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.sm,
    },
    onboardingButtonText: {
        color: colors.primaryNavy,
        fontSize: 13,
        fontWeight: '900',
        textAlign: 'center',
    },
    parentSetupBox: {
        marginTop: spacing.lg,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(230, 180, 91, 0.35)',
        backgroundColor: 'rgba(230, 180, 91, 0.10)',
        padding: spacing.md,
    },
    parentSetupTitle: { ...typography.subtitle, color: colors.primaryNavy, marginBottom: 6, fontWeight: '900' },
    parentSetupText: { ...typography.small, color: colors.primaryNavy, lineHeight: 19, fontWeight: '700' },
    secondaryActionButton: {
        marginTop: spacing.md,
        minHeight: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(230, 180, 91, 0.60)',
    },
    secondaryActionText: { ...typography.button, color: colors.primaryNavy },
    linksRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    link: {
        color: colors.infoBlue,
        fontSize: 15,
        fontWeight: '700',
    },
    linkDivider: {
        color: colors.mutedText,
        fontSize: 15,
    },
    footerText: {
        color: colors.premiumGold,
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '800',
        marginTop: spacing.xxl,
    },
});