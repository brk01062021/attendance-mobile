import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { API_BASE_URL } from '../src/services/api';
import { getSession } from '../src/services/sessionService';
import { shadows, spacing } from '../src/theme';
import { resolveSchoolName } from '../src/utils/schoolUtils';

type HealthItem = {
    key: string;
    label: string;
    status: string;
    message: string;
};

type AuditItem = {
    eventType: string;
    title: string;
    description: string;
    status: string;
    eventAt?: string;
};

type ActivationOperationsCenter = {
    schoolId: string;
    schoolName: string;
    activationStatus: string;
    reportingStatus: string;
    readinessPercent: number;
    readyForActivation: boolean;
    tenantActive: boolean;
    operationsNote: string;
    timeline: { stepKey: string; title: string; status: string; note: string; eventAt?: string }[];
    notesHistory: string[];
};

type ActivationSummary = {
    schoolId: string;
    schoolName: string;
    academicYear?: string;
    activationStatus: string;
    activationMessage: string;
    schoolProfileReady: boolean;
    academicYearReady: boolean;
    workspaceSetupReady: boolean;
    importCommitted: boolean;
    readyForActivation: boolean;
    readinessPercent: number;
    committedWorkbookCount: number;
    lastWorkbookCommittedAt?: string;
    tenantActive?: boolean;
    goLiveStatus?: string;
    activationButtonLabel?: string;
    activatedBy?: string;
    activatedAt?: string;
    healthItems: HealthItem[];
    auditTrail: AuditItem[];
};

function unwrap<T>(payload: any): T {
    return payload?.data ?? payload;
}

function label(value?: string) {
    return String(value || 'PENDING').replace(/_/g, ' ');
}

function fmt(value?: string) {
    if (!value) return 'Not available';
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function isActiveSummary(summary?: ActivationSummary | null) {
    return summary?.activationStatus === 'ACTIVE' || summary?.tenantActive === true;
}

function activatedByLabel(summary?: ActivationSummary | null) {
    return isActiveSummary(summary) && summary?.activatedBy ? summary.activatedBy : 'Not activated';
}

function activatedAtLabel(summary?: ActivationSummary | null) {
    return isActiveSummary(summary) && summary?.activatedAt ? fmt(summary.activatedAt) : 'Not activated';
}

export default function WorkspaceHealthScreen() {
    const params = useLocalSearchParams<{ role?: string; sourceRole?: string }>();
    const session = getSession();
    const schoolId = String(session?.schoolId || 'BRK1').toUpperCase();
    const sourceRole = String(params.sourceRole || params.role || session?.role || 'admin').toLowerCase();
    const roleLabel = sourceRole === 'principal' ? 'Principal' : 'Admin';
    const schoolName = resolveSchoolName(schoolId, session?.schoolName);
    const [summary, setSummary] = useState<ActivationSummary | null>(null);
    const [operations, setOperations] = useState<ActivationOperationsCenter | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const headers = useMemo(() => ({
        'Content-Type': 'application/json',
        'X-School-Id': schoolId,
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    }), [schoolId, session?.token]);

    const loadSummary = useCallback(async () => {
        setLoading(true);
        setError('');
        setNotice('');
        try {
            const response = await fetch(`${API_BASE_URL}/workspace-activation/summary?schoolId=${schoolId}`, { headers });
            if (!response.ok) throw new Error('Unable to load Workspace Health Center.');
            const payload = await response.json();
            setSummary(unwrap<ActivationSummary>(payload));
            const operationsResponse = await fetch(`${API_BASE_URL}/workspace-activation/operations-center?schoolId=${schoolId}`, { headers });
            if (operationsResponse.ok) {
                const operationsPayload = await operationsResponse.json();
                setOperations(unwrap<ActivationOperationsCenter>(operationsPayload));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to load Workspace Health Center.');
        } finally {
            setLoading(false);
        }
    }, [headers, schoolId]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    async function activateWorkspace() {
        if (!summary?.readyForActivation) return;
        setActivating(true);
        setError('');
        setNotice('');
        try {
            const response = await fetch(`${API_BASE_URL}/workspace-activation/activate?schoolId=${schoolId}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ activatedBy: session?.displayName || roleLabel, remarks: 'Activated from mobile Workspace Health Center' }),
            });
            if (!response.ok) throw new Error('Workspace activation could not be completed.');
            const payload = await response.json();
            setSummary(unwrap<ActivationSummary>(payload));
            const operationsResponse = await fetch(`${API_BASE_URL}/workspace-activation/operations-center?schoolId=${schoolId}`, { headers });
            if (operationsResponse.ok) {
                const operationsPayload = await operationsResponse.json();
                setOperations(unwrap<ActivationOperationsCenter>(operationsPayload));
            }
            setNotice('Workspace activation completed. School is now live ready for Admin/Principal reporting and mobile activation visibility.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Workspace activation could not be completed.');
        } finally {
            setActivating(false);
        }
    }

    const gates = summary ? [
        { title: 'School Profile', ready: summary.schoolProfileReady },
        { title: 'Academic Year', ready: summary.academicYearReady },
        { title: 'Workspace Setup', ready: summary.workspaceSetupReady },
        { title: 'Workbook Commit', ready: summary.importCommitted },
        { title: 'Go-Live Status', ready: summary.activationStatus === 'ACTIVE' || !!summary.tenantActive },
    ] : [];

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <View style={styles.overlay} />
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSummary} />}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
                        <Text style={styles.navIcon}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navButton}
                        onPress={() => router.replace(sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard')}
                    >
                        <Text style={styles.homeIcon}>⌂</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.schoolName}>{schoolName}</Text>
                <Text style={styles.subtitle}>VidyaSetu ERP • {roleLabel} Activation Visibility</Text>

                {loading && !summary ? (
                    <View style={styles.card}><ActivityIndicator /><Text style={styles.cardText}>Loading workspace health...</Text></View>
                ) : null}

                {error ? <View style={styles.alert}><Text style={styles.alertText}>{error}</Text></View> : null}
                {notice ? <View style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></View> : null}

                {summary ? (
                    <>
                        <View style={styles.heroCard}>
                            <Text style={styles.pill}>{label(summary.activationStatus)}</Text>
                            <Text style={styles.heroTitle}>{summary.schoolName || schoolName}</Text>
                            <Text style={styles.heroText}>{summary.activationMessage}</Text>
                            <View style={styles.readinessRow}>
                                <View>
                                    <Text style={styles.readiness}>{summary.readinessPercent}%</Text>
                                    <Text style={styles.smallText}>Activation readiness</Text>
                                    <Text style={styles.smallText}>Activated by: {activatedByLabel(summary)}</Text>
                                </View>
                                <TouchableOpacity
                                    disabled={!summary.readyForActivation || activating}
                                    style={[styles.activateButton, (!summary.readyForActivation || activating) && styles.disabled]}
                                    onPress={activateWorkspace}
                                >
                                    <Text style={styles.activateText}>{activating ? 'Checking...' : (summary.activationButtonLabel || (summary.readyForActivation ? 'Activate Workspace' : 'Activation Pending'))}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.gateGrid}>
                            {gates.map((gate) => (
                                <View key={gate.title} style={styles.gateCard}>
                                    <Text style={gate.ready ? styles.ready : styles.pending}>{gate.ready ? 'Ready' : 'Pending'}</Text>
                                    <Text style={styles.gateTitle}>{gate.title}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Admin/Principal Activation Summary</Text>
                            <View style={styles.rowCard}>
                                <Text style={styles.rowTitle}>Activation Status</Text>
                                <Text style={styles.cardText}>{label(summary.activationStatus)}</Text>
                                <Text style={styles.rowTitle}>Go-Live Readiness</Text>
                                <Text style={styles.cardText}>{label(summary.goLiveStatus || 'NOT_READY')}</Text>
                                <Text style={styles.rowTitle}>Activated At</Text>
                                <Text style={styles.cardText}>{activatedAtLabel(summary)}</Text>
                            </View>
                            <Text style={styles.sectionTitle}>School Configuration Summary</Text>
                            {summary.healthItems.map((item) => (
                                <View key={item.key} style={styles.rowCard}>
                                    <Text style={styles.pillSmall}>{label(item.status)}</Text>
                                    <Text style={styles.rowTitle}>{item.label}</Text>
                                    <Text style={styles.cardText}>{item.message}</Text>
                                </View>
                            ))}
                        </View>

                        {operations ? (
                            <View style={styles.card}>
                                <Text style={styles.sectionTitle}>Activation Operations Center</Text>
                                <View style={styles.rowCard}>
                                    <Text style={styles.pillSmall}>{label(operations.reportingStatus)}</Text>
                                    <Text style={styles.rowTitle}>Admin/Principal Activation Reporting</Text>
                                    <Text style={styles.cardText}>{operations.operationsNote}</Text>
                                    <Text style={styles.dateText}>Readiness: {operations.readinessPercent}%</Text>
                                </View>
                                <Text style={styles.sectionTitle}>Activation Timeline</Text>
                                {operations.timeline.slice(0, 6).map((item, index) => (
                                    <View key={`${item.stepKey}-${index}`} style={styles.rowCard}>
                                        <Text style={styles.pillSmall}>{label(item.status)}</Text>
                                        <Text style={styles.rowTitle}>{item.title}</Text>
                                        <Text style={styles.cardText}>{item.note}</Text>
                                        <Text style={styles.dateText}>{fmt(item.eventAt)}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : null}

                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Activation & Import Audit Trail</Text>
                            {summary.auditTrail.map((item, index) => (
                                <View key={`${item.eventType}-${index}`} style={styles.rowCard}>
                                    <Text style={styles.pillSmall}>{label(item.status)}</Text>
                                    <Text style={styles.rowTitle}>{item.title}</Text>
                                    <Text style={styles.cardText}>{item.description}</Text>
                                    <Text style={styles.dateText}>{fmt(item.eventAt)}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                ) : null}
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(74, 45, 4, 0.18)' },
    container: { paddingTop: 58, paddingHorizontal: spacing.lg, paddingBottom: 42 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    navButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(19, 31, 49, 0.88)', alignItems: 'center', justifyContent: 'center', ...shadows.soft },
    navIcon: { color: '#f8df9b', fontSize: 34, lineHeight: 36 },
    homeIcon: { color: '#f8df9b', fontSize: 22, fontWeight: '900' },
    schoolName: { color: '#f3c35b', fontSize: 24, fontWeight: '900', letterSpacing: 0.2 },
    subtitle: { color: '#7a5422', fontSize: 13, fontWeight: '800', marginTop: 5, marginBottom: spacing.lg },
    heroCard: { borderRadius: 28, backgroundColor: 'rgba(255, 250, 236, 0.9)', padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(126, 85, 20, 0.18)', ...shadows.soft },
    pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(116, 75, 10, 0.14)', color: '#7a4b0a', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, fontSize: 11, fontWeight: '900', overflow: 'hidden', textTransform: 'uppercase' },
    pillSmall: { alignSelf: 'flex-start', backgroundColor: 'rgba(116, 75, 10, 0.12)', color: '#7a4b0a', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 10, fontWeight: '900', overflow: 'hidden', textTransform: 'uppercase' },
    heroTitle: { color: '#2d220f', fontSize: 22, fontWeight: '900', marginTop: spacing.md },
    heroText: { color: '#604418', fontSize: 14, lineHeight: 21, marginTop: 8 },
    readinessRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.lg },
    readiness: { color: '#9b650d', fontSize: 44, fontWeight: '900' },
    smallText: { color: '#7a5422', fontSize: 12, fontWeight: '700' },
    activateButton: { backgroundColor: '#9b650d', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 },
    activateText: { color: '#fff8db', fontWeight: '900' },
    disabled: { opacity: 0.48 },
    gateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
    gateCard: { width: '48%', borderRadius: 20, backgroundColor: 'rgba(255, 250, 236, 0.86)', padding: spacing.md, borderWidth: 1, borderColor: 'rgba(126, 85, 20, 0.15)' },
    ready: { color: '#206c38', fontWeight: '900', fontSize: 13 },
    pending: { color: '#a65b00', fontWeight: '900', fontSize: 13 },
    gateTitle: { color: '#37270e', fontWeight: '800', marginTop: 4 },
    card: { borderRadius: 26, backgroundColor: 'rgba(255, 250, 236, 0.88)', padding: spacing.lg, marginTop: spacing.md, borderWidth: 1, borderColor: 'rgba(126, 85, 20, 0.16)', ...shadows.soft },
    sectionTitle: { color: '#2d220f', fontSize: 18, fontWeight: '900', marginBottom: spacing.sm },
    rowCard: { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.5)', padding: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: 'rgba(126, 85, 20, 0.12)' },
    rowTitle: { color: '#2d220f', fontSize: 15, fontWeight: '900', marginTop: 8 },
    cardText: { color: '#604418', fontSize: 13, lineHeight: 19, marginTop: 4 },
    dateText: { color: '#8c6a32', fontSize: 11, fontWeight: '700', marginTop: 6 },
    alert: { backgroundColor: 'rgba(119, 32, 20, 0.88)', borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
    alertText: { color: '#ffe6df', fontWeight: '800' },
    notice: { backgroundColor: 'rgba(28, 94, 51, 0.88)', borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
    noticeText: { color: '#e2ffea', fontWeight: '800' },
});
