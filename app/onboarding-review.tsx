import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getOnboardingReviewQueue, OnboardingReviewItem, OnboardingStatus, onboardingStatusLabel, updateOnboardingStatus } from '../src/services/schoolRegistrationApi';
import { colors, shadows, spacing } from '../src/theme';

const STATUS_OPTIONS: OnboardingStatus[] = ['PENDING', 'APPROVED', 'PILOT', 'ACTIVE', 'REJECTED'];

export default function OnboardingReviewScreen() {
    const [items, setItems] = useState<OnboardingReviewItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeReference, setActiveReference] = useState<string | null>(null);

    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getOnboardingReviewQueue();
            setItems(response);
        } catch (error: any) {
            Alert.alert('Onboarding Review', error?.response?.data?.message || error?.message || 'Unable to load review queue.');
        } finally {
            setLoading(false);
        }
    }, []);

    const changeStatus = async (referenceId: string, status: OnboardingStatus) => {
        setActiveReference(referenceId);
        try {
            const response = await updateOnboardingStatus(referenceId, status, `Moved to ${status} from mobile onboarding review.`);
            Alert.alert('Lifecycle Updated', `${response.schoolName} moved to ${onboardingStatusLabel(response.status)}.\n${response.nextStep}`);
            await loadQueue();
        } catch (error: any) {
            Alert.alert('Lifecycle Update', error?.response?.data?.message || error?.message || 'Unable to update lifecycle status.');
        } finally {
            setActiveReference(null);
        }
    };

    useEffect(() => { loadQueue(); }, [loadQueue]);

    return (
        <ImageBackground source={require('../assets/branding/splash-dark.png')} style={styles.background} imageStyle={styles.bgImage}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.navButton} onPress={() => router.back()}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/login')}><Text style={styles.homeButtonText}>Login</Text></TouchableOpacity>
                </View>

                <Text style={styles.eyebrow}>TENANT ACTIVATION</Text>
                <Text style={styles.title}>Onboarding Review Queue</Text>
                <Text style={styles.subtitle}>Move schools through Pending, Approved, Pilot, and Active lifecycle states. Final Excel import remains disabled.</Text>

                <TouchableOpacity style={styles.refreshButton} onPress={loadQueue} disabled={loading}><Text style={styles.refreshButtonText}>{loading ? 'Loading...' : 'Refresh Queue'}</Text></TouchableOpacity>

                {items.length === 0 && !loading ? <View style={styles.card}><Text style={styles.emptyText}>No pending onboarding items found.</Text></View> : null}

                {items.map((item) => (
                    <View key={item.referenceId} style={styles.card}>
                        <Text style={styles.schoolName}>{item.schoolName}</Text>
                        <Text style={styles.meta}>{item.schoolId || 'school_id pending'} • {item.requestType.replace(/_/g, ' ')}</Text>
                        <Text style={styles.meta}>Reference: {item.referenceId}</Text>
                        <Text style={styles.status}>Current: {onboardingStatusLabel(item.status)}</Text>
                        <Text style={styles.details}>Contact: {item.contactPerson || 'Not provided'} • {item.contactPhone || 'No phone'}</Text>
                        <Text style={styles.details}>Size: {item.expectedStudents ?? '—'} students / {item.expectedTeachers ?? '—'} teachers</Text>
                        <View style={styles.statusGrid}>
                            {STATUS_OPTIONS.map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[styles.statusButton, status === 'ACTIVE' && styles.primaryStatusButton, item.status === status && styles.disabledButton]}
                                    disabled={activeReference === item.referenceId || item.status === status}
                                    onPress={() => changeStatus(item.referenceId, status)}
                                >
                                    <Text style={[styles.statusButtonText, status === 'ACTIVE' && styles.primaryStatusButtonText]}>{item.status === status ? onboardingStatusLabel(status) : `Set ${onboardingStatusLabel(status)}`}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: colors.primaryNavy },
    bgImage: { opacity: 0.24 },
    container: { padding: spacing.screenPadding, paddingTop: 54, paddingBottom: spacing.xxxl },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    navButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.28)' },
    navButtonText: { color: colors.premiumGold, fontSize: 34, lineHeight: 34, fontWeight: '900' },
    homeButton: { minWidth: 78, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,223,155,0.14)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.34)' },
    homeButtonText: { color: colors.premiumGold, fontWeight: '900' },
    eyebrow: { color: colors.premiumGold, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    title: { color: '#FFF7DF', fontSize: 32, lineHeight: 37, fontWeight: '900', marginTop: 8 },
    subtitle: { color: '#D8C3A5', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8, marginBottom: spacing.xl },
    refreshButton: { height: 52, borderRadius: 16, backgroundColor: colors.premiumGold, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, ...shadows.medium },
    refreshButtonText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 16 },
    card: { backgroundColor: 'rgba(255,253,247,0.97)', borderRadius: 24, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.medium },
    schoolName: { color: colors.primaryNavy, fontSize: 19, fontWeight: '900' },
    meta: { color: colors.slateText, fontWeight: '800', marginTop: 5, lineHeight: 20 },
    status: { color: colors.primaryNavy, fontWeight: '900', marginTop: spacing.md },
    details: { color: colors.slateText, fontWeight: '700', lineHeight: 20, marginTop: 4 },
    emptyText: { color: colors.slateText, fontWeight: '800' },
    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.lg },
    statusButton: { borderRadius: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.white },
    primaryStatusButton: { backgroundColor: colors.premiumGold, borderColor: colors.premiumGold },
    disabledButton: { opacity: 0.48 },
    statusButtonText: { color: colors.primaryNavy, fontWeight: '900' },
    primaryStatusButtonText: { color: colors.primaryNavy },
});
