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
import { normalizeSchoolId, saveSession } from '../src/services/sessionService';
import { colors, shadows, spacing, typography } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

type LoginRole = 'ADMIN' | 'PRINCIPAL' | 'TEACHER' | 'PARENT' | 'STUDENT';

export default function LoginScreen() {
    const [selectedRole, setSelectedRole] = useState<LoginRole>('TEACHER');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [schoolId, setSchoolId] = useState('BRK1');

    const roles: LoginRole[] = ['ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'];

    const handleLogin = () => {
        const cleanUsername = username.trim();
        const cleanSchoolId = normalizeSchoolId(schoolId);

        if (!cleanUsername || !password.trim()) {
            Alert.alert('Validation', 'Please enter username and password');
            return;
        }

        const boundTeacherId = selectedRole === 'TEACHER' ? '1' : undefined;
        const boundStudentId = selectedRole === 'STUDENT' ? '1' : undefined;
        saveSession({ role: selectedRole, userId: '1', displayName: cleanUsername, schoolId: cleanSchoolId, schoolName: resolveSchoolName(cleanSchoolId), teacherId: boundTeacherId, studentId: boundStudentId });

        if (selectedRole === 'ADMIN') {
            router.replace({
                pathname: '/admin-dashboard',
                params: {
                    role: selectedRole,
                    adminName: cleanUsername || 'Admin',
                    userId: '1',
                    schoolId: cleanSchoolId,
                },
            } as any);
            return;
        }

        if (selectedRole === 'PRINCIPAL') {
            router.replace({
                pathname: '/principal-home',
                params: {
                    role: selectedRole,
                    principalName: cleanUsername || 'Principal',
                    userId: '1',
                    schoolId: cleanSchoolId,
                },
            } as any);
            return;
        }

        if (selectedRole === 'TEACHER') {
            router.replace({
                pathname: '/teacher-dashboard',
                params: {
                    role: selectedRole,
                    teacherId: '1',
                    teacherName: cleanUsername,
                    schoolId: cleanSchoolId,
                },
            } as any);
            return;
        }

        if (selectedRole === 'PARENT') {
            router.replace({
                pathname: '/parent-dashboard',
                params: {
                    role: selectedRole,
                    parentId: '1',
                    parentName: cleanUsername,
                    studentId: '1',
                    studentName: 'Demo Student',
                    schoolId: cleanSchoolId,
                },
            } as any);
            return;
        }

        if (selectedRole === 'STUDENT') {
            router.replace({
                pathname: '/student-dashboard',
                params: {
                    role: selectedRole,
                    studentId: '1',
                    studentName: cleanUsername,
                    schoolId: cleanSchoolId,
                },
            } as any);
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

                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter username"
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
                                Login as {selectedRole}
                            </Text>
                        </TouchableOpacity>

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
    onboardingActions: {
        flexDirection: 'row',
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