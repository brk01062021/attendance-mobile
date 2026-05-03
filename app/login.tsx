import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography, shadows } from '../src/theme';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Validation', 'Please enter username and password');
            return;
        }

        if (username.toLowerCase().includes('admin')) {
            router.replace({
                pathname: '/home',
                params: {
                    role: 'ADMIN',
                },
            } as any);
        } else {
            router.replace({
                pathname: '/home',
                params: {
                    role: 'TEACHER',
                    teacherId: '1',
                    teacherName: username,
                },
            } as any);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.container}>
                <Text style={styles.title}>Welcome to VidyaSetu</Text>
                <Text style={styles.subtitle}>
                    Connecting Schools, Empowering Students
                </Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Username"
                        placeholderTextColor={colors.mutedText}
                        value={username}
                        onChangeText={setUsername}
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter Password"
                        placeholderTextColor={colors.mutedText}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                    >
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <Text style={styles.link}>Forgot Username?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <Text style={styles.link}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: colors.softCream,
    },
    container: {
        flex: 1,
        padding: spacing.screenPadding,
        justifyContent: 'center',
    },
    title: {
        ...typography.title,
        color: colors.primaryNavy,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        ...typography.subtitle,
        color: colors.deepGold,
        textAlign: 'center',
        marginBottom: spacing.xxxl,
    },
    card: {
        backgroundColor: colors.cardCream,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xxl,
        ...shadows.medium,
    },
    label: {
        ...typography.label,
        color: colors.slateText,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    input: {
        height: 58,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        fontSize: 17,
        color: colors.darkText,
        marginBottom: spacing.md,
    },
    loginButton: {
        height: 58,
        borderRadius: 14,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.lg,
    },
    loginButtonText: {
        ...typography.button,
        color: colors.white,
    },
    link: {
        textAlign: 'center',
        color: colors.infoBlue,
        fontSize: 16,
        fontWeight: '600',
        marginTop: spacing.md,
    },
});