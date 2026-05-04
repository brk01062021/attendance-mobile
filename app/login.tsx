import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Image,
    ImageBackground,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, shadows } from '../src/theme';

type LoginRole = 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT';

export default function LoginScreen() {
    const [selectedRole, setSelectedRole] = useState<LoginRole>('TEACHER');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Validation', 'Please enter username and password');
            return;
        }

        router.replace({
            pathname: '/home-v2',
            params: {
                role: selectedRole,
                teacherId: selectedRole === 'TEACHER' ? '1' : undefined,
                teacherName: selectedRole === 'TEACHER' ? username : undefined,
                principalName: selectedRole === 'ADMIN' ? username : undefined,
                parentName: selectedRole === 'PARENT' ? username : undefined,
                studentName: selectedRole === 'STUDENT' ? username : undefined,
            },
        } as any);
    };

    const roles: LoginRole[] = ['ADMIN', 'TEACHER', 'PARENT', 'STUDENT'];

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