import React from 'react';
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, shadows } from '../src/theme';

export default function StudentDashboard() {
    const params = useLocalSearchParams();
    const studentName = String(params.studentName || 'Student');

    return (
        <ImageBackground
            source={require('../assets/branding/splash-dark.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.title}>Student Dashboard</Text>
                <Text style={styles.welcome}>Welcome, {studentName}</Text>

                <View style={styles.heroCard}>
                    <Text style={styles.sectionLabel}>Today Attendance</Text>
                    <Text style={styles.heroValue}>Present</Text>
                    <Text style={styles.heroText}>
                        Your attendance has been recorded for today.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>School Events / Alerts</Text>

                <EventCard
                    title="Holiday Alert"
                    text="School holiday on Friday for local festival."
                />
                <EventCard
                    title="Exam Schedule"
                    text="Half-yearly exams start next Monday."
                />
                <EventCard
                    title="School Event"
                    text="Annual day practice starts this week."
                />

                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.replace('/login' as any)}
                    activeOpacity={0.9}
                >
                    <Text style={styles.backButtonText}>Back / Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}

function EventCard({ title, text }: { title: string; text: string }) {
    return (
        <View style={styles.eventCard}>
            <Text style={styles.eventTitle}>{title}</Text>
            <Text style={styles.eventText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: colors.primaryNavy,
    },
    container: {
        padding: spacing.screenPadding,
        paddingBottom: spacing.xxxl,
    },
    title: {
        fontSize: 30,
        fontWeight: '900',
        color: colors.premiumGold,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    welcome: {
        fontSize: 19,
        fontWeight: '800',
        color: colors.white,
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
    },
    heroCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        ...shadows.medium,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.slateText,
    },
    heroValue: {
        fontSize: 30,
        fontWeight: '900',
        color: colors.successGreen,
        marginTop: spacing.sm,
    },
    heroText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.slateText,
        marginTop: spacing.sm,
        lineHeight: 21,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.premiumGold,
        marginTop: spacing.lg,
        marginBottom: spacing.md,
    },
    eventCard: {
        backgroundColor: '#FFF9E8',
        borderRadius: 18,
        borderWidth: 1.2,
        borderColor: colors.cardGoldBorder,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.soft,
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
    eventText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.slateText,
        marginTop: spacing.sm,
        lineHeight: 20,
    },
    backButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.premiumGold,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        ...shadows.medium,
    },
    backButtonText: {
        fontSize: 17,
        fontWeight: '900',
        color: colors.primaryNavy,
    },
});