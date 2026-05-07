import React from 'react';
import {
    Alert,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';
import { images } from '../src/constants/images';

export default function DateSummaryScreen() {
    const { teacherId, teacherName, role } = useLocalSearchParams();

    const handleLoadSummary = () => {
        Alert.alert('Info', 'Date summary API will be connected next');
    };

    const goBackToTeacherDashboard = () => {
        router.replace({
            pathname: '/teacher-dashboard',
            params: {
                teacherId,
                teacherName,
                role: role || 'TEACHER',
            },
        } as any);
    };

    return (
        <ImageBackground
            source={images.splashGold}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.overlay}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.headerRow}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={goBackToTeacherDashboard}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.backButtonText}>‹</Text>
                        </TouchableOpacity>

                        <Text style={styles.title}>Date Summary</Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Daily Attendance Summary</Text>
                        <Text style={styles.cardSubtitle}>
                            Review today&apos;s attendance totals for your classes.
                        </Text>

                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Date</Text>
                            <Text style={styles.value}>Today</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Total Students</Text>
                            <Text style={styles.value}>5</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Present</Text>
                            <Text style={styles.present}>0</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Absent</Text>
                            <Text style={styles.absent}>0</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLoadSummary}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.buttonText}>Load Date Summary</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#F6E7B0',
    },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },

    container: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 64,
        paddingBottom: 100,
    },

    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },

    backButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.42)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    backButtonText: {
        fontSize: 38,
        lineHeight: 40,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 30,
        fontWeight: '900',
        color: colors.primaryNavy,
        paddingHorizontal: spacing.sm,
    },

    headerSpacer: {
        width: 48,
    },

    card: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        ...shadows.medium,
    },

    cardTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.xs,
    },

    cardSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '700',
        color: colors.slateText,
        marginBottom: spacing.lg,
    },

    summaryRow: {
        backgroundColor: '#FFF8E1',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        marginTop: spacing.md,
    },

    label: {
        fontSize: 15,
        color: colors.slateText,
        fontWeight: '800',
    },

    value: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.xs,
    },

    present: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.successGreen,
        marginTop: spacing.xs,
    },

    absent: {
        fontSize: 26,
        fontWeight: '900',
        color: '#DC2626',
        marginTop: spacing.xs,
    },

    button: {
        backgroundColor: colors.premiumGold,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
        ...shadows.medium,
    },

    buttonText: {
        color: colors.primaryNavy,
        fontSize: 18,
        fontWeight: '900',
    },
});
