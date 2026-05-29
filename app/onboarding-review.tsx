import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getOnboardingReviewQueue, normalizeOnboardingText, OnboardingReviewItem, OnboardingStatus, onboardingStatusLabel, runOnboardingAction } from '../src/services/schoolRegistrationApi';
import { colors, shadows, spacing } from '../src/theme';

const ACTIONS: { status: OnboardingStatus; label: string; action: 'approve' | 'reject' | 'mark-pilot' | 'activate' }[] = [
    { status: 'APPROVED', label: 'Approve', action: 'approve' },
    { status: 'REJECTED', label: 'Reject', action: 'reject' },
    { status: 'PILOT', label: 'Mark Pilot', action: 'mark-pilot' },
    { status: 'ACTIVE', label: 'Activate Tenant', action: 'activate' },
];

function canRunAction(current: OnboardingStatus, next: OnboardingStatus) {
    if (current === 'PENDING') return next === 'APPROVED' || next === 'REJECTED';
    if (current === 'APPROVED') return next === 'PILOT' || next === 'REJECTED';
    if (current === 'PILOT') return next === 'ACTIVE' || next === 'REJECTED';
    return false;
}

function historyLines(history?: string | null) {
    return normalizeOnboardingText(history).split('\n').map((line) => line.trim()).filter(Boolean).reverse();
}

export default function OnboardingReviewScreen() {
    const [items, setItems] = useState<OnboardingReviewItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeReference, setActiveReference] = useState<string | null>(null);
    const [selected, setSelected] = useState<OnboardingReviewItem | null>(null);

    const metrics = useMemo(() => {
        const count = (status: OnboardingStatus) => items.filter((item) => item.status === status).length;
        return [
            { label: 'Pending', value: count('PENDING') },
            { label: 'Approved', value: count('APPROVED') },
            { label: 'Pilot', value: count('PILOT') },
            { label: 'Active', value: count('ACTIVE') },
        ];
    }, [items]);

    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getOnboardingReviewQueue();
            setItems(response);
            if (selected) setSelected(response.find((item) => item.referenceId === selected.referenceId) || null);
        } catch (error: any) {
            Alert.alert('Onboarding Review', error?.response?.data?.message || error?.message || 'Unable to load review queue.');
        } finally {
            setLoading(false);
        }
    }, [selected]);

    const changeStatus = async (item: OnboardingReviewItem, action: 'approve' | 'reject' | 'mark-pilot' | 'activate', label: string) => {
        setActiveReference(item.referenceId);
        try {
            const response = await runOnboardingAction(item.referenceId, action, `${label} by VidyaSetu onboarding team.`);
            Alert.alert('Lifecycle Updated', `${response.schoolName} moved to ${onboardingStatusLabel(response.status)}.\n${normalizeOnboardingText(response.nextStep)}`);
            await loadQueue();
        } catch (error: any) {
            Alert.alert('Lifecycle Update', error?.response?.data?.message || error?.message || 'Unable to update lifecycle status.');
        } finally {
            setActiveReference(null);
        }
    };

    useEffect(() => { loadQueue(); }, []);

    return (
        <ImageBackground source={require('../assets/branding/splash-dark.png')} style={styles.background} imageStyle={styles.bgImage}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.navButton} onPress={() => router.back()}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/login')}><Text style={styles.homeButtonText}>Login</Text></TouchableOpacity>
                </View>

                <Text style={styles.eyebrow}>TENANT ACTIVATION</Text>
                <Text style={styles.title}>VidyaSetu Review Queue</Text>
                <Text style={styles.subtitle}>VidyaSetu onboarding team moves schools through Pending → Approved → Pilot → Active. Login and credentials are enabled only after Active.</Text>

                <View style={styles.metricGrid}>{metrics.map((metric) => <View key={metric.label} style={styles.metricCard}><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricLabel}>{metric.label}</Text></View>)}</View>
                <TouchableOpacity style={styles.refreshButton} onPress={loadQueue} disabled={loading}><Text style={styles.refreshButtonText}>{loading ? 'Loading...' : 'Refresh Queue'}</Text></TouchableOpacity>

                {items.length === 0 && !loading ? <View style={styles.card}><Text style={styles.emptyText}>No onboarding items found.</Text></View> : null}

                {items.map((item) => (
                    <View key={item.referenceId} style={styles.card}>
                        <Text style={styles.schoolName}>{item.schoolName}</Text>
                        <Text style={styles.meta}>{item.schoolId || 'school_id pending'} • {item.requestType.replace(/_/g, ' ')}</Text>
                        <Text style={styles.meta}>Reference: {item.referenceId}</Text>
                        <Text style={styles.status}>Current: {onboardingStatusLabel(item.status)}</Text>
                        <Text style={styles.details}>Contact: {item.contactPerson || 'Not provided'} • {item.contactPhone || 'No phone'}</Text>
                        <Text style={styles.details}>Size: {item.expectedStudents ?? '—'} students / {item.expectedTeachers ?? '—'} teachers</Text>
                        <TouchableOpacity style={styles.detailButton} onPress={() => setSelected(item)}><Text style={styles.detailButtonText}>View Details & Audit</Text></TouchableOpacity>
                        <View style={styles.statusGrid}>
                            {item.status === 'ACTIVE' ? <TouchableOpacity style={styles.statusButton} onPress={() => router.push('/activation-package')}><Text style={styles.statusButtonText}>Manage Activation Package</Text></TouchableOpacity> : null}
                            {ACTIONS.filter((entry) => canRunAction(item.status, entry.status)).map((entry) => (
                                <TouchableOpacity
                                    key={entry.action}
                                    style={[styles.statusButton, entry.status === 'ACTIVE' && styles.primaryStatusButton]}
                                    disabled={activeReference === item.referenceId}
                                    onPress={() => changeStatus(item, entry.action, entry.label)}
                                >
                                    <Text style={[styles.statusButtonText, entry.status === 'ACTIVE' && styles.primaryStatusButtonText]}>{entry.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Modal transparent visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
                <View style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <View style={styles.card}>
                            <Text style={styles.eyebrowDark}>REQUEST DETAIL</Text>
                            <Text style={styles.schoolName}>{selected?.schoolName}</Text>
                            <Text style={styles.details}>Status: {selected ? onboardingStatusLabel(selected.status) : '—'}</Text>
                            <Text style={styles.details}>Reference: {selected?.referenceId}</Text>
                            <Text style={styles.details}>school_id: {selected?.schoolId || 'Pending'}</Text>
                            <Text style={styles.details}>Expected Size: {selected?.expectedStudents ?? '—'} students / {selected?.expectedTeachers ?? '—'} teachers</Text>
                            <Text style={styles.details}>Submitted By: {selected?.submittedBy || 'School Registration Portal'}</Text>
                            <Text style={styles.details}>Submitted: {selected?.submittedAt || '—'}</Text>
                            <Text style={styles.details}>Approved By: {selected?.approvedBy || '—'}</Text>
                            <Text style={styles.details}>Approved Date: {selected?.approvedAt || '—'}</Text>
                            <Text style={styles.details}>Pilot Enabled By: {selected?.pilotEnabledBy || '—'}</Text>
                            <Text style={styles.details}>Pilot Date: {selected?.pilotActivatedAt || '—'}</Text>
                            <Text style={styles.details}>Activated By: {selected?.activatedBy || '—'}</Text>
                            <Text style={styles.details}>Activated Date: {selected?.activatedAt || '—'}</Text>
                            <Text style={styles.details}>Credentials Issued By: {selected?.credentialsIssuedBy || '—'}</Text>
                            <Text style={styles.details}>Credentials Issued Date: {selected?.credentialsIssuedAt || '—'}</Text>
                            <Text style={styles.details}>Updated: {selected?.updatedAt || '—'}</Text>
                            <Text style={styles.auditTitle}>Audit History</Text>
                            {historyLines(selected?.statusHistory).length ? historyLines(selected?.statusHistory).map((line) => <Text key={line} style={styles.auditLine}>• {line}</Text>) : <Text style={styles.details}>No audit history found yet.</Text>}
                            <TouchableOpacity style={styles.refreshButton} onPress={() => setSelected(null)}><Text style={styles.refreshButtonText}>Close</Text></TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
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
    eyebrowDark: { color: colors.primaryNavy, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    title: { color: '#FFF7DF', fontSize: 31, lineHeight: 36, fontWeight: '900', marginTop: 8 },
    subtitle: { color: '#D8C3A5', fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 8, marginBottom: spacing.xl },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
    metricCard: { flexGrow: 1, minWidth: 74, backgroundColor: 'rgba(255,253,247,0.14)', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: 'rgba(248,223,155,0.28)' },
    metricValue: { color: colors.premiumGold, fontSize: 20, fontWeight: '900' },
    metricLabel: { color: '#FFF7DF', fontSize: 12, fontWeight: '800', marginTop: 2 },
    refreshButton: { height: 52, borderRadius: 16, backgroundColor: colors.premiumGold, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.lg, ...shadows.medium },
    refreshButtonText: { color: colors.primaryNavy, fontWeight: '900', fontSize: 16 },
    card: { backgroundColor: 'rgba(255,253,247,0.97)', borderRadius: 24, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, marginBottom: spacing.lg, ...shadows.medium },
    schoolName: { color: colors.primaryNavy, fontSize: 19, fontWeight: '900' },
    meta: { color: colors.slateText, fontWeight: '800', marginTop: 5, lineHeight: 20 },
    status: { color: colors.primaryNavy, fontWeight: '900', marginTop: spacing.md },
    details: { color: colors.slateText, fontWeight: '700', lineHeight: 20, marginTop: 4 },
    emptyText: { color: colors.slateText, fontWeight: '800' },
    detailButton: { borderRadius: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(10, 31, 68, 0.06)', marginTop: spacing.md },
    detailButtonText: { color: colors.primaryNavy, fontWeight: '900' },
    statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.lg },
    statusButton: { borderRadius: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.white },
    primaryStatusButton: { backgroundColor: colors.premiumGold, borderColor: colors.premiumGold },
    disabledButton: { opacity: 0.38 },
    activatedText: { color: colors.primaryNavy, fontWeight: '900', paddingVertical: 10 },
    statusButtonText: { color: colors.primaryNavy, fontWeight: '900' },
    primaryStatusButtonText: { color: colors.primaryNavy },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(3, 8, 18, 0.76)' },
    modalContent: { padding: spacing.screenPadding, paddingTop: 70, paddingBottom: spacing.xxxl },
    auditTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 16, marginTop: spacing.lg, marginBottom: spacing.sm },
    auditLine: { color: colors.slateText, fontWeight: '700', lineHeight: 20, marginBottom: 6 },
});
