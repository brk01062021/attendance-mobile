import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '../src/theme';

export default function SplashScreen() {
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/login' as any);
        }, 2200);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/branding/splash-dark.png')}
                style={styles.backgroundImage}
                resizeMode="cover"
            />

            <View style={styles.overlay} />

            <View style={styles.content}>
                <Image
                    source={require('../assets/branding/vidyasetu-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.appName}>VidyaSetu</Text>

                <Text style={styles.tagline}>
                    Connecting Schools, Empowering Students
                </Text>

                <View style={styles.divider} />

                <ActivityIndicator
                    size="large"
                    color={colors.premiumGold}
                />

                <Text style={styles.loadingText}>
                    Preparing your school workspace...
                </Text>
            </View>

            <Text style={styles.footerText}>
                Empowering Education. Building Futures.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primaryNavy,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.18,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.primaryNavy,
        opacity: 0.82,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: spacing.xxxl,
    },
    logo: {
        width: 180,
        height: 180,
        marginBottom: spacing.lg,
    },
    appName: {
        ...typography.title,
        color: colors.white,
        fontSize: 42,
        marginBottom: spacing.sm,
    },
    tagline: {
        ...typography.subtitle,
        color: colors.premiumGold,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    divider: {
        width: 160,
        height: 2,
        backgroundColor: colors.premiumGold,
        marginBottom: spacing.xl,
        borderRadius: 2,
    },
    loadingText: {
        ...typography.small,
        color: colors.softCream,
        marginTop: spacing.md,
        textAlign: 'center',
    },
    footerText: {
        position: 'absolute',
        bottom: 45,
        color: colors.premiumGold,
        fontSize: 13,
        fontWeight: '700',
    },
});