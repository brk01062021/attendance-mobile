import React from 'react';
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';

export default function ImportSchoolDataScreen() {
    return (
        <ImageBackground
            source={require('../assets/branding/splash-gold.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>

                <View style={styles.heroCard}>
                    <Text style={styles.heroEyebrow}>School Onboarding</Text>
                    <Text style={styles.heroTitle}>Import School Data</Text>
                    <Text style={styles.heroSubtitle}>SUBImport School Data</Text>
                </View>

                <View style={styles.contentCard}>
                    <Text style={styles.sectionEyebrow}>CURRENT STATUS</Text>
                    <Text style={styles.sectionTitle}>SECTION_Import School Data</Text>
                    <Text style={styles.bodyText}>This keeps the admin menu route stable while the Excel onboarding engine is built.</Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>Next build</Text>
                        <Text style={styles.infoText}>Connect Excel workbook upload, validation summary, error download and import confirmation.</Text>
                    </View>
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#F5BE38',
    },

    container: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 70,
        paddingBottom: 120,
    },

    backButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.45)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },

    backButtonText: {
        fontSize: 38,
        lineHeight: 40,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.20)',
        borderRadius: 34,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.45)',
        padding: spacing.xl,
        marginBottom: spacing.xl,
    },

    heroEyebrow: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.primaryNavy,
        letterSpacing: 1.1,
        textTransform: 'uppercase',
    },

    heroTitle: {
        fontSize: 34,
        lineHeight: 40,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.sm,
    },

    heroSubtitle: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '800',
        color: colors.primaryNavy,
        marginTop: spacing.md,
    },

    contentCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        ...shadows.medium,
    },

    sectionEyebrow: {
        fontSize: 13,
        fontWeight: '900',
        color: colors.premiumGold,
        textTransform: 'uppercase',
        letterSpacing: 1.1,
    },

    sectionTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.xs,
    },

    bodyText: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.md,
    },

    infoBox: {
        backgroundColor: '#FFF8E1',
        borderRadius: 24,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginTop: spacing.xl,
    },

    infoTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    infoText: {
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.sm,
    },
});
