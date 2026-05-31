import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { day28SampleSheets, validateImportPreview, type ImportPreviewResponse } from '../src/services/importValidationApi';
import { getSession } from '../src/services/sessionService';
import { loadWorkspaceImportLock, type WorkspaceChecklist } from '../src/services/workspaceSetupApi';
import { colors, shadows, spacing } from '../src/theme';

const PRODUCTION_STEP_KEYS = ['SCHOOL_PROFILE', 'ACADEMIC_YEAR', 'WORKING_DAYS', 'SCHOOL_TIMINGS'];

function getProductionImportStatus(lockStatus: WorkspaceChecklist | null) {
    const visibleSteps = (lockStatus?.steps || []).filter((step) => PRODUCTION_STEP_KEYS.includes(step.key));
    const completedSteps = visibleSteps.filter((step) => step.completed).length;
    const totalSteps = PRODUCTION_STEP_KEYS.length;
    const importLocked = completedSteps < totalSteps;
    const importLockMessage = importLocked
        ? 'Complete School Profile, Academic Year, Working Days, and School Timings before importing school data.'
        : 'School workspace setup complete. Import School Data is unlocked.';
    return { visibleSteps, completedSteps, totalSteps, importLocked, importLockMessage };
}

export default function ImportSchoolDataScreen() {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [lockStatus, setLockStatus] = useState<WorkspaceChecklist | null>(null);
    const session = getSession();

    useEffect(() => {
        loadWorkspaceImportLock()
            .then(setLockStatus)
            .catch((lockError: any) => setError(lockError?.response?.data?.message || lockError?.message || 'Unable to verify workspace import lock.'));
    }, []);

    const productionImportStatus = useMemo(() => getProductionImportStatus(lockStatus), [lockStatus]);
    const totalRows = useMemo(() => Object.values(preview?.rowCounts || {}).reduce((sum, count) => sum + count, 0), [preview]);
    const errors = preview?.issues?.filter((issue) => issue.severity === 'ERROR') || [];
    const warnings = preview?.issues?.filter((issue) => issue.severity === 'WARNING') || [];

    const runPreview = async () => {
        if (productionImportStatus.importLocked) {
            setError(productionImportStatus.importLockMessage);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const result = await validateImportPreview(day28SampleSheets);
            setPreview(result);
        } catch (previewError: any) {
            console.log(previewError);
            setError(previewError?.response?.data?.message || previewError?.message || 'Unable to validate import preview');
        } finally {
            setLoading(false);
        }
    };

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
                    <Text style={styles.heroEyebrow}>Day 28 Foundation</Text>
                    <Text style={styles.heroTitle}>Excel Import Validation</Text>
                    <Text style={styles.heroSubtitle}>Tenant-safe preview before importing real school data.</Text>
                </View>

                <View style={styles.contentCard}>
                    <Text style={styles.sectionEyebrow}>ACTIVE TENANT</Text>
                    <Text style={styles.sectionTitle}>{session?.schoolId || 'DEMO'} · {session?.role || 'ADMIN'}</Text>
                    <Text style={styles.bodyText}>Validate workbook sheets, required tabs, row counts, role permission, and school_id isolation before final import processing.</Text>
                    <Text style={styles.previewSummary}>Required workspace setup: {productionImportStatus.completedSteps}/{productionImportStatus.totalSteps} complete.</Text>

                    {productionImportStatus.importLocked ? (
                        <View style={styles.previewBox}>
                            <Text style={styles.previewStatus}>🔒 Import Locked</Text>
                            <Text style={styles.previewSummary}>{productionImportStatus.importLockMessage}</Text>
                            <Text style={styles.previewSummary}>{productionImportStatus.completedSteps}/{productionImportStatus.totalSteps} required setup steps complete.</Text>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/workspace-setup')} activeOpacity={0.88}>
                                <Text style={styles.primaryButtonText}>Open Workspace Initialization</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}

                    <TouchableOpacity style={[styles.primaryButton, productionImportStatus.importLocked && { opacity: 0.45 }]} onPress={runPreview} activeOpacity={0.88} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Run Preview Validation</Text>}
                    </TouchableOpacity>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {preview ? (
                        <View style={styles.previewBox}>
                            <Text style={styles.previewStatus}>{preview.status}</Text>
                            <Text style={styles.previewSummary}>{preview.summary}</Text>
                            <View style={styles.metricRow}>
                                <Metric label="Sheets" value={String(Object.keys(preview.rowCounts || {}).length)} />
                                <Metric label="Rows" value={String(totalRows)} />
                                <Metric label="Errors" value={String(errors.length)} />
                                <Metric label="Warnings" value={String(warnings.length)} />
                            </View>

                            <Text style={styles.subTitle}>Sheet Preview</Text>
                            {preview.previewSheets?.map((sheet) => (
                                <View key={sheet.sheetName} style={styles.sheetRow}>
                                    <Text style={styles.sheetName}>{sheet.sheetName}</Text>
                                    <Text style={styles.sheetMeta}>{sheet.totalRows} rows · {sheet.headers?.length || 0} headers</Text>
                                </View>
                            ))}

                            <Text style={styles.subTitle}>Import Issues</Text>
                            {preview.issues?.length ? preview.issues.map((issue, index) => (
                                <View key={`${issue.sheetName}-${index}`} style={styles.issueRow}>
                                    <Text style={[styles.issueSeverity, issue.severity === 'ERROR' && styles.issueError]}>{issue.severity}</Text>
                                    <Text style={styles.issueMessage}>{issue.sheetName}: {issue.message}</Text>
                                </View>
                            )) : <Text style={styles.successText}>No blocking errors found. Preview is ready for final import confirmation.</Text>}
                        </View>
                    ) : null}
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, backgroundColor: '#F5BE38' },
    container: { paddingHorizontal: spacing.screenPadding, paddingTop: 70, paddingBottom: 120 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.65)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
    backButtonText: { fontSize: 38, lineHeight: 40, fontWeight: '900', color: colors.primaryNavy },
    heroCard: { backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 34, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', padding: spacing.xl, marginBottom: spacing.xl },
    heroEyebrow: { fontSize: 14, fontWeight: '900', color: colors.primaryNavy, letterSpacing: 1.1, textTransform: 'uppercase' },
    heroTitle: { fontSize: 34, lineHeight: 40, fontWeight: '900', color: colors.primaryNavy, marginTop: spacing.sm },
    heroSubtitle: { fontSize: 16, lineHeight: 24, fontWeight: '800', color: colors.primaryNavy, marginTop: spacing.md },
    contentCard: { backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 34, borderWidth: 1.5, borderColor: colors.cardGoldBorder, padding: spacing.xl, ...shadows.medium },
    sectionEyebrow: { fontSize: 13, fontWeight: '900', color: colors.premiumGold, textTransform: 'uppercase', letterSpacing: 1.1 },
    sectionTitle: { fontSize: 26, fontWeight: '900', color: colors.primaryNavy, marginTop: spacing.xs },
    bodyText: { fontSize: 16, lineHeight: 24, fontWeight: '800', color: colors.slateText, marginTop: spacing.md },
    primaryButton: { marginTop: spacing.xl, backgroundColor: colors.primaryNavy, borderRadius: 22, paddingVertical: 16, alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
    errorText: { marginTop: spacing.md, color: '#B91C1C', fontWeight: '900' },
    previewBox: { marginTop: spacing.xl, backgroundColor: '#FFF8E1', borderRadius: 24, borderWidth: 1.2, borderColor: colors.cardGoldBorder, padding: spacing.lg },
    previewStatus: { fontSize: 18, fontWeight: '900', color: colors.primaryNavy },
    previewSummary: { fontSize: 14, lineHeight: 21, fontWeight: '800', color: colors.slateText, marginTop: spacing.xs },
    metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.md },
    metricCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder },
    metricValue: { fontSize: 20, fontWeight: '900', color: colors.primaryNavy },
    metricLabel: { fontSize: 12, fontWeight: '900', color: colors.slateText, marginTop: 2, textTransform: 'uppercase' },
    subTitle: { fontSize: 17, fontWeight: '900', color: colors.primaryNavy, marginTop: spacing.lg, marginBottom: spacing.sm },
    sheetRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.cardGoldBorder },
    sheetName: { fontSize: 15, fontWeight: '900', color: colors.primaryNavy },
    sheetMeta: { fontSize: 13, fontWeight: '800', color: colors.slateText, marginTop: 3 },
    issueRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.cardGoldBorder },
    issueSeverity: { fontSize: 12, fontWeight: '900', color: '#92400E' },
    issueError: { color: '#B91C1C' },
    issueMessage: { fontSize: 13, lineHeight: 19, fontWeight: '800', color: colors.slateText, marginTop: 3 },
    successText: { fontSize: 14, lineHeight: 20, fontWeight: '900', color: '#166534' },
});
