import { router } from 'expo-router';
import React from 'react';
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { colors, shadows, spacing } from '../src/theme';

const assignmentRows = [
    { label: 'Teacher Pool Summary', value: 'Class-wise teacher pools are prepared from workbook import.' },
    { label: 'Assignment Summary', value: 'Teacher-subject-class-section mappings appear after school data import.' },
    { label: 'Class Filter', value: 'Review assignments by class after workbook validation.' },
    { label: 'Section Filter', value: 'Review assignments by section after workbook validation.' },
];

export default function TeacherAssignmentsScreen() {
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
                    <Text style={styles.heroEyebrow}>Admin Operations</Text>
                    <Text style={styles.heroTitle}>Teacher Assignment Center</Text>
                    <Text style={styles.heroSubtitle}>Teacher-subject-class-section mapping for timetable readiness and workload planning.</Text>
                </View>

                <View style={styles.contentCard}>
                    <Text style={styles.sectionEyebrow}>Current Status</Text>
                    <Text style={styles.sectionTitle}>Teacher Assignments</Text>
                    <Text style={styles.bodyText}>
                        Manage teacher-subject-class-section assignments used for timetable generation and workload planning.
                    </Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoTitle}>Assignment data source</Text>
                        <Text style={styles.infoText}>
                            Teacher assignments will appear after workbook import. Use Web ERP to manage bulk assignment updates.
                        </Text>
                    </View>

                    <View style={styles.summaryGrid}>
                        {assignmentRows.map((row) => (
                            <View key={row.label} style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>{row.label}</Text>
                                <Text style={styles.summaryText}>{row.value}</Text>
                            </View>
                        ))}
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
        width: 40,
        height: 40,
        borderRadius: 20,
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
        fontSize: 32,
        lineHeight: 38,
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

    summaryGrid: {
        marginTop: spacing.lg,
        gap: spacing.md,
    },

    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
    },

    summaryTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    summaryText: {
        fontSize: 14,
        lineHeight: 21,
        fontWeight: '700',
        color: colors.slateText,
        marginTop: spacing.sm,
    },
});
