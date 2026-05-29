import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    ActivationPackage,
    generateActivationPackage,
    getActivationPackage,
    getOnboardingReviewQueue,
    normalizeOnboardingText,
    OnboardingReviewItem,
    OnboardingStatus,
    onboardingStatusLabel,
    runOnboardingAction,
    statusTimeline,
} from '../src/services/schoolRegistrationApi';
import { colors, shadows, spacing } from '../src/theme';

type ReviewAction = 'approve' | 'reject' | 'mark-pilot' | 'activate';

const STATUS_ORDER: Record<string, number> = {
    PENDING: 1,
    APPROVED: 2,
    PILOT: 3,
    ACTIVE: 4,
    REJECTED: 5,
};

export default function PilotOnboardingScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';

    const [requests, setRequests] = useState<OnboardingReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selected, setSelected] = useState<OnboardingReviewItem | null>(null);
    const [activationPackage, setActivationPackage] = useState<ActivationPackage | null>(null);
    const [activationLoading, setActivationLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [message, setMessage] = useState('Loading onboarding review queue...');

    const sortQueue = (items: OnboardingReviewItem[]) => {
        return [...items].sort((a, b) => {
            const statusDiff = (STATUS_ORDER[String(a.status || 'PENDING')] || 99) - (STATUS_ORDER[String(b.status || 'PENDING')] || 99);
            if (statusDiff !== 0) return statusDiff;
            const aDate = new Date(a.submittedAt || a.registrationDate || a.updatedAt || 0).getTime();
            const bDate = new Date(b.submittedAt || b.registrationDate || b.updatedAt || 0).getTime();
            return bDate - aDate;
        });
    };

    const loadQueue = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const data = await getOnboardingReviewQueue();
            setRequests(sortQueue(data));
            setMessage('Real onboarding review queue connected. VidyaSetu onboarding team can review, pilot, activate, and issue first-login credentials.');
        } catch (error) {
            setMessage('Unable to load onboarding review queue. Please verify backend is running.');
            Alert.alert('Review Queue Error', 'Unable to load onboarding requests. Please check backend API.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadQueue();
    }, []);

    const metrics = useMemo(() => {
        return requests.reduce(
            (acc, item) => {
                const status = item.status || 'PENDING';
                acc.total += 1;
                if (status === 'PENDING') acc.pending += 1;
                if (status === 'APPROVED') acc.approved += 1;
                if (status === 'PILOT') acc.pilot += 1;
                if (status === 'ACTIVE') acc.active += 1;
                if (status === 'REJECTED') acc.rejected += 1;
                return acc;
            },
            { total: 0, pending: 0, approved: 0, pilot: 0, active: 0, rejected: 0 }
        );
    }, [requests]);

    const closeDetails = () => {
        setSelected(null);
        setActivationPackage(null);
        setReviewNotes('');
    };

    const openDetails = async (item: OnboardingReviewItem) => {
        setSelected(item);
        setReviewNotes('');
        setActivationPackage(null);

        if (item.status === 'ACTIVE') {
            await loadActivationPackage(item.referenceId, false);
        }
    };

    const refreshSelectedFromList = (referenceId: string, list: OnboardingReviewItem[]) => {
        const updated = list.find((item) => item.referenceId === referenceId);
        if (updated) setSelected(updated);
        return updated;
    };

    const reloadQueueAfterAction = async (referenceId: string) => {
        const data = await getOnboardingReviewQueue();
        const sorted = sortQueue(data);
        setRequests(sorted);
        return refreshSelectedFromList(referenceId, sorted);
    };

    const loadActivationPackage = async (referenceId: string, showAlert = true) => {
        setActivationLoading(true);
        try {
            const data = await getActivationPackage(referenceId);
            setActivationPackage(data);
        } catch {
            setActivationPackage(null);
            if (showAlert) {
                Alert.alert('Activation Package', 'No activation package found yet. Generate credentials after the tenant is ACTIVE.');
            }
        } finally {
            setActivationLoading(false);
        }
    };

    const handleGenerateActivationPackage = async (request: OnboardingReviewItem) => {
        Alert.alert(
            'Generate Activation Package',
            `Generate first Admin and Principal credentials for ${request.schoolName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Generate',
                    onPress: async () => {
                        setActivationLoading(true);
                        try {
                            const data = await generateActivationPackage(request.referenceId);
                            setActivationPackage(data);
                            await reloadQueueAfterAction(request.referenceId);
                            Alert.alert('Credentials Generated', 'First Admin and Principal credentials are ready to issue.');
                        } catch {
                            Alert.alert('Generation Failed', 'Unable to generate activation package. Please verify this tenant is ACTIVE.');
                        } finally {
                            setActivationLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const performAction = async (request: OnboardingReviewItem, action: ReviewAction) => {
        const label = actionLabel(action);

        Alert.alert(
            label,
            `Confirm ${label.toLowerCase()} for ${request.schoolName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: label,
                    style: action === 'reject' ? 'destructive' : 'default',
                    onPress: async () => {
                        setActionLoading(true);
                        try {
                            await runOnboardingAction(request.referenceId, action, reviewNotes.trim() || undefined);
                            const updated = await reloadQueueAfterAction(request.referenceId);
                            setReviewNotes('');
                            if (action === 'activate' || updated?.status === 'ACTIVE') {
                                await loadActivationPackage(request.referenceId, false);
                            }
                            Alert.alert('Success', `${request.schoolName} updated successfully.`);
                        } catch {
                            Alert.alert('Action Failed', `Unable to ${label.toLowerCase()} this request.`);
                        } finally {
                            setActionLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadQueue(true)} />}
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
                        <Text style={styles.backText}>‹</Text>
                    </TouchableOpacity>

                    <View style={styles.headerTextWrap}>
                        <Text style={styles.eyebrow}>VIDYASETU ONBOARDING TEAM</Text>
                        <Text style={styles.title}>Activation & Credentials</Text>
                    </View>

                    <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(backHome as any)}>
                        <Text style={styles.homeIcon}>⌂</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.heroCard}>
                    <Text style={styles.heroTitle}>School Activation Queue</Text>
                    <Text style={styles.heroText}>{message}</Text>
                    <Text style={styles.heroText}>
                        Login remains disabled until the tenant is ACTIVE and the first Admin / Principal credentials are issued.
                    </Text>
                </View>

                <View style={styles.grid}>
                    <Metric title="Pending" value={String(metrics.pending)} />
                    <Metric title="Approved" value={String(metrics.approved)} />
                    <Metric title="Pilot" value={String(metrics.pilot)} />
                    <Metric title="Active" value={String(metrics.active)} />
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={() => loadQueue()}>
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Refresh Queue</Text>}
                </TouchableOpacity>

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.cardTitle}>Registration Requests</Text>
                        <Text style={styles.countText}>{metrics.total} total</Text>
                    </View>

                    {loading && requests.length === 0 ? (
                        <ActivityIndicator color={colors.primaryNavy} />
                    ) : requests.length === 0 ? (
                        <Text style={styles.emptyText}>No onboarding requests found.</Text>
                    ) : (
                        requests.map((item) => (
                            <RequestCard
                                key={item.referenceId}
                                item={item}
                                onView={() => openDetails(item)}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            <Modal visible={!!selected} transparent animationType="slide" onRequestClose={closeDetails}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selected && (
                                <>
                                    <View style={styles.modalHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.modalEyebrow}>ACTIVATION DETAIL</Text>
                                            <Text style={styles.modalTitle}>{selected.schoolName}</Text>
                                        </View>
                                        <TouchableOpacity style={styles.closeButton} onPress={closeDetails}>
                                            <Text style={styles.closeText}>×</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <StatusBadge status={selected.status} />
                                    <StatusMessage status={selected.status} loginEnabled={!!selected.loginEnabled} />

                                    <View style={styles.timelineBox}>
                                        <Text style={styles.auditTitle}>Status Timeline</Text>
                                        <Timeline status={selected.status} />
                                    </View>

                                    <View style={styles.detailBlock}>
                                        <Text style={styles.blockTitle}>Registration Details</Text>
                                        <InfoRow label="School Name" value={selected.schoolName || '-'} />
                                        <InfoRow label="Reference ID" value={selected.referenceId} />
                                        <InfoRow label="School ID" value={selected.schoolId || '-'} />
                                        <InfoRow label="Registration Date" value={formatDate(selected.registrationDate || selected.submittedAt)} />
                                        <InfoRow label="Current Status" value={onboardingStatusLabel(selected.status || 'PENDING')} />
                                        <InfoRow label="Login Access" value={selected.loginEnabled ? 'Enabled' : 'Disabled'} />
                                        <InfoRow label="Next Step" value={statusNextStep(selected.status)} />
                                    </View>

                                    <View style={styles.detailBlock}>
                                        <Text style={styles.blockTitle}>School Contact</Text>
                                        <InfoRow label="Request Type" value={selected.requestType || '-'} />
                                        <InfoRow label="Contact Person" value={selected.contactPerson || selected.submittedBy || '-'} />
                                        <InfoRow label="Phone" value={selected.contactPhone || '-'} />
                                        <InfoRow label="Email" value={selected.contactEmail || '-'} />
                                        <InfoRow label="Location" value={[selected.city, selected.state].filter(Boolean).join(', ') || '-'} />
                                        <InfoRow label="Expected Students" value={formatCount(selected.expectedStudents)} />
                                        <InfoRow label="Expected Teachers" value={formatCount(selected.expectedTeachers)} />
                                    </View>

                                    <View style={styles.notesBox}>
                                        <Text style={styles.notesLabel}>Review Notes</Text>
                                        <TextInput
                                            value={reviewNotes}
                                            onChangeText={setReviewNotes}
                                            placeholder="Optional note for VidyaSetu onboarding audit history"
                                            placeholderTextColor="rgba(15,31,53,0.45)"
                                            multiline
                                            style={styles.notesInput}
                                        />
                                    </View>

                                    <ActionButtons
                                        item={selected}
                                        loading={actionLoading}
                                        onAction={(action) => performAction(selected, action)}
                                    />

                                    {selected.status === 'ACTIVE' && (
                                        <ActivationPackageCard
                                            item={selected}
                                            activationPackage={activationPackage}
                                            loading={activationLoading}
                                            onGenerate={() => handleGenerateActivationPackage(selected)}
                                            onRefresh={() => loadActivationPackage(selected.referenceId)}
                                        />
                                    )}

                                    <View style={styles.auditBox}>
                                        <Text style={styles.auditTitle}>Audit Trail</Text>
                                        <AuditTrail item={selected} />
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

function RequestCard({ item, onView }: { item: OnboardingReviewItem; onView: () => void }) {
    return (
        <View style={styles.requestCard}>
            <View style={styles.requestTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.requestTitle}>{item.schoolName}</Text>
                    <Text style={styles.requestMeta}>
                        {item.schoolId || 'No School ID'} • {item.referenceId}
                    </Text>
                </View>
                <StatusBadge status={item.status} compact />
            </View>

            <Text style={styles.requestSub}>{statusShortMessage(item.status)}</Text>

            <View style={styles.requestStats}>
                <Text style={styles.requestStat}>Students: {formatCount(item.expectedStudents)}</Text>
                <Text style={styles.requestStat}>Teachers: {formatCount(item.expectedTeachers)}</Text>
            </View>

            <Text style={styles.requestSub}>Registration Date: {formatDate(item.registrationDate || item.submittedAt)}</Text>
            <Text style={styles.requestSub}>Login Access: {item.loginEnabled ? 'Enabled' : 'Disabled'}</Text>

            <TouchableOpacity style={styles.viewButton} onPress={onView}>
                <Text style={styles.viewButtonText}>Open Activation Detail</Text>
            </TouchableOpacity>
        </View>
    );
}

function StatusMessage({ status, loginEnabled }: { status: OnboardingStatus | string; loginEnabled: boolean }) {
    return (
        <View style={styles.statusMessageBox}>
            <Text style={styles.statusMessageTitle}>{onboardingStatusLabel(String(status || 'PENDING'))}</Text>
            <Text style={styles.statusMessageText}>{statusFullMessage(status, loginEnabled)}</Text>
        </View>
    );
}

function Timeline({ status }: { status: OnboardingStatus | string }) {
    return (
        <View style={styles.timelineRow}>
            {statusTimeline(String(status || 'PENDING')).map((item, index) => (
                <View key={item.key} style={styles.timelineItem}>
                    <View style={[styles.timelineDot, item.done && styles.timelineDotDone]}>
                        <Text style={[styles.timelineDotText, item.done && styles.timelineDotTextDone]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.timelineLabel, item.done && styles.timelineLabelDone]}>{item.label}</Text>
                </View>
            ))}
        </View>
    );
}

function ActionButtons({
    item,
    loading,
    onAction,
}: {
    item: OnboardingReviewItem;
    loading: boolean;
    onAction: (action: ReviewAction) => void;
}) {
    const status = item.status;

    if (status === 'ACTIVE') {
        return <Text style={styles.finalState}>Tenant activated ✓ Continue below to generate or view first Admin and Principal credentials.</Text>;
    }

    if (status === 'REJECTED') {
        return <Text style={styles.finalState}>Rejected. No ERP login access is enabled.</Text>;
    }

    if (status === 'PENDING') {
        return (
            <View style={styles.actionGrid}>
                <ActionButton title="Approve Registration" action="approve" loading={loading} onAction={onAction} />
                <ActionButton title="Reject Request" action="reject" loading={loading} onAction={onAction} danger />
            </View>
        );
    }

    if (status === 'APPROVED') {
        return (
            <View style={styles.actionGrid}>
                <ActionButton title="Enable Pilot Stage" action="mark-pilot" loading={loading} onAction={onAction} />
            </View>
        );
    }

    if (status === 'PILOT') {
        return (
            <View style={styles.actionGrid}>
                <ActionButton title="Activate Tenant" action="activate" loading={loading} onAction={onAction} />
            </View>
        );
    }

    return null;
}

function ActivationPackageCard({
    item,
    activationPackage,
    loading,
    onGenerate,
    onRefresh,
}: {
    item: OnboardingReviewItem;
    activationPackage: ActivationPackage | null;
    loading: boolean;
    onGenerate: () => void;
    onRefresh: () => void;
}) {
    const issued = !!activationPackage?.credentials?.length;

    return (
        <View style={styles.activationBox}>
            <Text style={styles.activationTitle}>Activation Package</Text>
            <Text style={styles.activationText}>
                ACTIVE Tenant → Generate First Admin Account → Generate Principal Account → Issue Credentials → ERP Login Enabled
            </Text>

            <InfoRow label="School" value={activationPackage?.schoolName || item.schoolName || '-'} />
            <InfoRow label="School ID" value={activationPackage?.schoolId || item.schoolId || '-'} />
            <InfoRow label="Login Access" value={activationPackage?.loginEnabled || item.loginEnabled ? 'Enabled' : 'Disabled'} />
            <InfoRow label="Credentials Issued" value={formatDate(activationPackage?.credentialsIssuedAt || item.credentialsIssuedAt)} />

            <View style={styles.activationButtons}>
                <TouchableOpacity disabled={loading} style={[styles.actionButton, loading && { opacity: 0.6 }]} onPress={onGenerate}>
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionText}>{issued ? 'Manage Credentials' : 'Generate Credentials'}</Text>}
                </TouchableOpacity>
                <TouchableOpacity disabled={loading} style={[styles.secondaryButton, loading && { opacity: 0.6 }]} onPress={onRefresh}>
                    <Text style={styles.secondaryButtonText}>Refresh Package</Text>
                </TouchableOpacity>
            </View>

            {activationPackage?.message ? <Text style={styles.activationNote}>{activationPackage.message}</Text> : null}
            {activationPackage?.nextStep ? <Text style={styles.activationNote}>{activationPackage.nextStep}</Text> : null}

            {issued ? (
                <View style={styles.credentialsWrap}>
                    {activationPackage.credentials.map((credential) => (
                        <View key={`${credential.role}-${credential.username}`} style={styles.credentialCard}>
                            <Text style={styles.credentialRole}>{credential.role}</Text>
                            <InfoRow label="Display Name" value={credential.displayName || '-'} />
                            <InfoRow label="Username" value={credential.username || '-'} />
                            <InfoRow label="Initial Password" value={credential.initialPassword || '-'} />
                            <Text style={styles.credentialNote}>
                                Share these credentials only after VidyaSetu onboarding verification is complete. User should change password after first login.
                            </Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.emptyText}>No credentials generated yet for this ACTIVE tenant.</Text>
            )}
        </View>
    );
}

function ActionButton({
    title,
    action,
    loading,
    danger,
    onAction,
}: {
    title: string;
    action: ReviewAction;
    loading: boolean;
    danger?: boolean;
    onAction: (action: ReviewAction) => void;
}) {
    return (
        <TouchableOpacity
            disabled={loading}
            style={[styles.actionButton, danger && styles.dangerButton, loading && { opacity: 0.6 }]}
            onPress={() => onAction(action)}
        >
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.actionText}>{title}</Text>}
        </TouchableOpacity>
    );
}

function Metric({ title, value }: { title: string; value: string }) {
    return (
        <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricTitle}>{title}</Text>
        </View>
    );
}

function StatusBadge({ status, compact }: { status: OnboardingStatus | string; compact?: boolean }) {
    const normalized = String(status || 'PENDING').toUpperCase();
    return (
        <View style={[styles.statusBadge, statusStyle(normalized), compact && styles.compactBadge]}>
            <Text style={styles.statusText}>{onboardingStatusLabel(normalized)}</Text>
        </View>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function AuditTrail({ item }: { item: OnboardingReviewItem }) {
    const structuredEntries = [
        { label: 'Submitted By', value: item.submittedBy || 'School Registration Portal' },
        { label: 'Submitted Date', value: formatDate(item.submittedAt || item.registrationDate) },
        { label: 'Approved By', value: item.approvedBy || '-' },
        { label: 'Approved Date', value: formatDate(item.approvedAt) },
        { label: 'Pilot Enabled By', value: item.pilotEnabledBy || '-' },
        { label: 'Pilot Date', value: formatDate(item.pilotActivatedAt) },
        { label: 'Activated By', value: item.activatedBy || '-' },
        { label: 'Activated Date', value: formatDate(item.activatedAt) },
        { label: 'Credentials Issued By', value: item.credentialsIssuedBy || '-' },
        { label: 'Credentials Issued Date', value: formatDate(item.credentialsIssuedAt) },
    ];
    const historyEntries = buildAuditEntries(item);

    return (
        <View>
            <View style={styles.auditGrid}>
                {structuredEntries.map((entry) => (
                    <View key={entry.label} style={styles.auditGridItem}>
                        <Text style={styles.auditGridLabel}>{entry.label}</Text>
                        <Text style={styles.auditGridValue}>{entry.value}</Text>
                    </View>
                ))}
            </View>

            <Text style={styles.auditSubTitle}>Status History</Text>
            {historyEntries.length === 0 ? (
                <Text style={styles.emptyText}>No status history found yet.</Text>
            ) : (
                historyEntries.map((entry, index) => (
                    <View key={`${entry.label}-${index}`} style={styles.auditItem}>
                        <Text style={styles.auditDot}>●</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.auditStatus}>{entry.label}</Text>
                            <Text style={styles.auditDate}>{entry.date}</Text>
                            {entry.by ? <Text style={styles.auditDate}>By: {entry.by}</Text> : null}
                            {entry.note ? <Text style={styles.auditDate}>Note: {entry.note}</Text> : null}
                        </View>
                    </View>
                ))
            )}
        </View>
    );
}

function buildAuditEntries(item: OnboardingReviewItem) {
    const entries: { label: string; date: string; by?: string; note?: string }[] = [];

    if (item.statusHistory) {
        const raw = normalizeOnboardingText(item.statusHistory);
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                parsed.forEach((entry) => {
                    entries.push({
                        label: onboardingStatusLabel(String(entry.status || entry.action || 'STATUS UPDATE')),
                        date: formatDate(entry.timestamp || entry.updatedAt || entry.date),
                        by: entry.by || entry.updatedBy || entry.actor,
                        note: entry.note || entry.reviewNotes,
                    });
                });
            }
        } catch {
            raw.split('\n').filter(Boolean).forEach((line) => {
                entries.push(parseAuditHistoryLine(line));
            });
        }
    }

    if (entries.length === 0) {
        if (item.submittedAt || item.registrationDate) entries.push({ label: 'Submitted', date: formatDate(item.submittedAt || item.registrationDate), by: item.submittedBy || item.contactPerson || undefined });
        if (item.approvedAt) entries.push({ label: 'Approved', date: formatDate(item.approvedAt), by: item.approvedBy || undefined });
        if (item.pilotActivatedAt) entries.push({ label: 'Pilot', date: formatDate(item.pilotActivatedAt), by: item.pilotEnabledBy || undefined });
        if (item.activatedAt) entries.push({ label: 'Active', date: formatDate(item.activatedAt), by: item.activatedBy || undefined });
        if (item.credentialsIssuedAt) entries.push({ label: 'Credentials Issued', date: formatDate(item.credentialsIssuedAt), by: item.credentialsIssuedBy || undefined });
        if (item.rejectedAt) entries.push({ label: 'Rejected', date: formatDate(item.rejectedAt) });
    }

    return entries;
}


function parseAuditHistoryLine(line: string) {
    const parts = line.split('|').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 3) {
        const date = formatDate(parts[0]);
        const actor = parts[1];
        const transition = parts[2];
        const note = parts.slice(3).join(' • ');
        const label = transition.includes('CREDENTIALS_ISSUED')
            ? 'Credentials Issued'
            : transition.includes('PILOT -> ACTIVE')
                ? 'Activated'
                : transition.includes('APPROVED -> PILOT')
                    ? 'Pilot Enabled'
                    : transition.includes('PENDING -> APPROVED')
                        ? 'Approved'
                        : transition.includes('NEW -> PENDING') || transition.includes('RESERVED -> PENDING')
                            ? 'Submitted'
                            : transition.replace(/_/g, ' ');
        return { label, date, by: actor, note };
    }
    return { label: line, date: '' };
}

function actionLabel(action: ReviewAction) {
    if (action === 'approve') return 'Approve';
    if (action === 'reject') return 'Reject';
    if (action === 'mark-pilot') return 'Mark Pilot';
    return 'Activate Tenant';
}

function statusShortMessage(status?: string | null) {
    if (status === 'ACTIVE') return 'ERP login can be enabled after credentials are issued.';
    if (status === 'PILOT') return 'Pilot validation is ready. Activation can be completed next.';
    if (status === 'APPROVED') return 'Registration is approved. Pilot stage can be enabled next.';
    if (status === 'REJECTED') return 'Registration request was rejected. Login remains disabled.';
    return 'VidyaSetu onboarding team will review this registration request.';
}

function statusFullMessage(status?: string | null, loginEnabled?: boolean) {
    if (status === 'ACTIVE') {
        return loginEnabled
            ? 'The school tenant is active. Generate or view the first Admin and Principal credentials, then share them securely with the school.'
            : 'The school tenant is active, but login access is waiting for credential provisioning.';
    }
    if (status === 'PILOT') return 'Pilot validation is enabled. VidyaSetu can now complete final activation after verification.';
    if (status === 'APPROVED') return 'The registration is approved by the VidyaSetu onboarding team. Move it to Pilot when validation is ready.';
    if (status === 'REJECTED') return 'This request is rejected. No ERP workspace login access is enabled.';
    return 'The registration request is under review by the VidyaSetu onboarding team. ERP login is disabled until activation is complete.';
}

function statusNextStep(status?: string | null) {
    if (status === 'ACTIVE') return 'Generate / issue first Admin and Principal credentials.';
    if (status === 'PILOT') return 'Complete pilot verification and activate tenant.';
    if (status === 'APPROVED') return 'Enable pilot stage for controlled validation.';
    if (status === 'REJECTED') return 'No further action unless the request is reopened manually.';
    return 'VidyaSetu onboarding team will review and approve the registration request.';
}

function formatCount(value?: number | null) {
    if (value === null || value === undefined) return '-';
    return String(value);
}

function formatDate(value?: string | null) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
}

function statusStyle(status: string) {
    if (status === 'ACTIVE') return styles.statusActive;
    if (status === 'PILOT') return styles.statusPilot;
    if (status === 'APPROVED') return styles.statusApproved;
    if (status === 'REJECTED') return styles.statusRejected;
    return styles.statusPending;
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 34 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
    circleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.78)',
        backgroundColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: { color: colors.primaryNavy, fontSize: 28, fontWeight: '900', marginTop: -2 },
    homeIcon: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900' },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900', textAlign: 'center' },

    heroCard: {
        backgroundColor: 'rgba(13, 33, 57, 0.94)',
        borderRadius: 24,
        padding: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.42)',
        ...shadows.medium,
    },
    heroTitle: { color: colors.white, fontSize: 21, fontWeight: '900', marginBottom: 6 },
    heroText: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', lineHeight: 20, marginTop: 4 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    metricCard: {
        width: '48%',
        backgroundColor: colors.cardCream,
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        ...shadows.soft,
    },
    metricValue: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900' },
    metricTitle: { color: colors.slateText, fontWeight: '800', marginTop: 3 },

    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 15, padding: 14, alignItems: 'center', marginBottom: 12 },
    primaryText: { color: colors.white, fontWeight: '900' },

    card: {
        backgroundColor: 'rgba(255,253,247,0.96)',
        borderRadius: 20,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        marginBottom: 12,
        ...shadows.medium,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    cardTitle: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900' },
    countText: { color: colors.deepGold, fontWeight: '900' },
    emptyText: { color: colors.slateText, fontWeight: '800', lineHeight: 20 },

    requestCard: {
        backgroundColor: colors.cardCream,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        marginBottom: 10,
    },
    requestTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
    requestTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15, lineHeight: 20 },
    requestMeta: { color: colors.slateText, fontWeight: '800', fontSize: 11, marginTop: 3 },
    requestStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 9 },
    requestStat: { color: colors.primaryNavy, fontWeight: '900', fontSize: 12 },
    requestSub: { color: colors.slateText, fontWeight: '700', marginTop: 8, fontSize: 11, lineHeight: 16 },
    viewButton: { marginTop: 10, backgroundColor: colors.primaryNavy, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
    viewButtonText: { color: colors.white, fontWeight: '900' },

    statusBadge: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        marginBottom: 10,
    },
    compactBadge: { marginBottom: 0, paddingHorizontal: 9, paddingVertical: 5 },
    statusText: { fontSize: 10, fontWeight: '900', color: colors.primaryNavy },
    statusPending: { backgroundColor: '#FFF4D6', borderColor: '#D4AF37' },
    statusApproved: { backgroundColor: '#E8F0FF', borderColor: '#7EA1E8' },
    statusPilot: { backgroundColor: '#F0E8FF', borderColor: '#A77DDA' },
    statusActive: { backgroundColor: '#E7F8ED', borderColor: '#46A66A' },
    statusRejected: { backgroundColor: '#FFE7E7', borderColor: '#D85656' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modalCard: {
        maxHeight: '90%',
        backgroundColor: 'rgba(255,253,247,0.99)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    modalEyebrow: { color: colors.deepGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    modalTitle: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900', marginTop: 2 },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primaryNavy,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeText: { color: colors.white, fontSize: 23, fontWeight: '900', marginTop: -2 },

    statusMessageBox: {
        backgroundColor: colors.cardCream,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        marginBottom: 12,
    },
    statusMessageTitle: { color: colors.primaryNavy, fontSize: 15, fontWeight: '900', marginBottom: 4 },
    statusMessageText: { color: colors.slateText, fontWeight: '800', lineHeight: 19 },

    timelineBox: {
        backgroundColor: 'rgba(13,33,57,0.94)',
        borderRadius: 18,
        padding: 13,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.42)',
    },
    timelineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
    timelineItem: { flex: 1, alignItems: 'center' },
    timelineDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.16)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.34)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    timelineDotDone: { backgroundColor: colors.deepGold, borderColor: colors.deepGold },
    timelineDotText: { color: 'rgba(255,255,255,0.7)', fontWeight: '900', fontSize: 11 },
    timelineDotTextDone: { color: colors.primaryNavy },
    timelineLabel: { color: 'rgba(255,255,255,0.68)', fontWeight: '900', fontSize: 10, textAlign: 'center' },
    timelineLabelDone: { color: colors.white },

    detailBlock: {
        backgroundColor: 'rgba(255,255,255,0.42)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(15,31,53,0.08)',
        paddingHorizontal: 10,
        paddingTop: 10,
        marginBottom: 12,
    },
    blockTitle: { color: colors.primaryNavy, fontSize: 15, fontWeight: '900', marginBottom: 4 },

    infoRow: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(15,31,53,0.09)',
        paddingVertical: 9,
    },
    infoLabel: { color: colors.slateText, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
    infoValue: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900', marginTop: 3 },

    notesBox: { marginTop: 2, marginBottom: 12 },
    notesLabel: { color: colors.primaryNavy, fontWeight: '900', marginBottom: 6 },
    notesInput: {
        minHeight: 78,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        borderRadius: 14,
        padding: 12,
        color: colors.primaryNavy,
        fontWeight: '800',
        backgroundColor: colors.cardCream,
        textAlignVertical: 'top',
    },

    actionGrid: { gap: 10, marginVertical: 10 },
    actionButton: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
    },
    dangerButton: { backgroundColor: '#9D2B2B' },
    actionText: { color: colors.white, fontWeight: '900' },
    finalState: {
        color: colors.primaryNavy,
        fontWeight: '900',
        backgroundColor: colors.cardCream,
        borderRadius: 14,
        padding: 12,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
        lineHeight: 19,
    },

    activationBox: {
        backgroundColor: 'rgba(13, 33, 57, 0.95)',
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.45)',
        marginTop: 8,
        marginBottom: 12,
    },
    activationTitle: { color: colors.white, fontSize: 17, fontWeight: '900', marginBottom: 5 },
    activationText: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', lineHeight: 19, marginBottom: 10 },
    activationButtons: { gap: 10, marginTop: 10, marginBottom: 8 },
    secondaryButton: {
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.42)',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
    },
    secondaryButtonText: { color: colors.white, fontWeight: '900' },
    activationNote: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', lineHeight: 18, marginTop: 4 },
    credentialsWrap: { marginTop: 10, gap: 10 },
    credentialCard: {
        backgroundColor: 'rgba(255,253,247,0.96)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
    },
    credentialRole: { color: colors.deepGold, fontWeight: '900', fontSize: 13, letterSpacing: 0.8, marginBottom: 4 },
    credentialNote: { color: colors.slateText, fontWeight: '800', lineHeight: 18, marginTop: 8, fontSize: 12 },

    auditBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(15,31,53,0.12)' },
    auditTitle: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900', marginBottom: 10 },
    auditSubTitle: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900', marginTop: 12, marginBottom: 8 },
    auditGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    auditGridItem: {
        width: '48%',
        backgroundColor: colors.cardCream,
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.cardGoldBorder,
    },
    auditGridLabel: { color: colors.slateText, fontWeight: '900', fontSize: 10, textTransform: 'uppercase' },
    auditGridValue: { color: colors.primaryNavy, fontWeight: '900', marginTop: 4, fontSize: 12, lineHeight: 16 },
    auditItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    auditDot: { color: colors.deepGold, fontSize: 13, marginTop: 1 },
    auditStatus: { color: colors.primaryNavy, fontWeight: '900' },
    auditDate: { color: colors.slateText, fontWeight: '700', marginTop: 2, fontSize: 12, lineHeight: 16 },
});
