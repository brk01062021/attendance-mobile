import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { images } from '../src/constants/images';
import { API_ENDPOINTS } from '../src/services/api';
import { getSession, normalizeSchoolId } from '../src/services/sessionService';
import { colors, shadows, spacing } from '../src/theme';

export default function DateSummaryScreen() {
    const { teacherId, teacherName, role, schoolId: routeSchoolId } = useLocalSearchParams();
    const session = getSession();
    const safeTeacherId = String(teacherId || session?.teacherId || session?.userId || '').trim();
    const safeTeacherName = String(teacherName || session?.displayName || 'Teacher');
    const safeSchoolId = normalizeSchoolId(String(routeSchoolId || session?.schoolId || ''));
    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const [summary, setSummary] = useState({ totalStudents: 0, present: 0, absent: 0, late: 0, attendancePercentage: 0 });
    const [loading, setLoading] = useState(false);

    const handleLoadSummary = async () => {
        if (!safeTeacherId) {
            Alert.alert('Teacher profile missing', 'Please login again as teacher.');
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`${API_ENDPOINTS.teacherDashboard}?teacherId=${encodeURIComponent(safeTeacherId)}&date=${today}&schoolId=${encodeURIComponent(safeSchoolId)}`, { headers: { 'X-School-Id': safeSchoolId } });
            if (!response.ok) throw new Error('Unable to load date summary');
            const data = await response.json();
            setSummary({
                totalStudents: Number(data.totalStudents || 0),
                present: Number(data.present || 0),
                absent: Number(data.absent || 0),
                late: Number(data.late || 0),
                attendancePercentage: Number(data.attendancePercentage || 0),
            });
        } catch (error) {
            Alert.alert('Date Summary', 'Live summary unavailable. Please confirm backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const goBackToTeacherDashboard = () => {
        router.replace({
            pathname: '/teacher-dashboard',
            params: {
                teacherId: safeTeacherId,
                teacherName: safeTeacherName,
                role: role || 'TEACHER',
                schoolId: safeSchoolId,
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
                            <Text style={styles.value}>{today}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Total Students</Text>
                            <Text style={styles.value}>{summary.totalStudents}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Present</Text>
                            <Text style={styles.present}>{summary.present}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Absent</Text>
                            <Text style={styles.absent}>{summary.absent}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLoadSummary}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Load Date Summary'}</Text>
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
        backgroundColor: 'rgba(255, 248, 225, 0.10)',
    },

    container: {
        paddingHorizontal: spacing.screenPadding,
        paddingTop: 72,
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
        backgroundColor: 'rgba(255, 255, 255, 0.90)',
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
        fontSize: 21,
        fontWeight: '900',
        color: colors.primaryNavy,
        paddingHorizontal: spacing.sm,
    },

    headerSpacer: {
        width: 48,
    },

    card: {
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
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
