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
import { getImportTemplateRequirements, type ImportPreviewResponse, type ImportTemplateRequirementsResponse } from '../src/services/importValidationApi';
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

function isCommitReadyStatus(status?: string | null) {
    return status === 'READY_TO_IMPORT' || status === 'READY_WITH_WARNINGS';
}

export default function ImportSchoolDataScreen() {
    const [loading, setLoading] = useState(false);
    const [templateLoading, setTemplateLoading] = useState(false);
    const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
    const [template, setTemplate] = useState<ImportTemplateRequirementsResponse | null>(null);
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
    const canCommitPreview = Boolean(preview?.valid && isCommitReadyStatus(preview?.status));

    const loadRequirements = async () => {
        if (productionImportStatus.importLocked) {
            setError(productionImportStatus.importLockMessage);
            return;
        }
        try {
            setTemplateLoading(true);
            setError(null);
            const result = await getImportTemplateRequirements();
            setTemplate(result);
        } catch (requirementsError: any) {
            console.log(requirementsError);
            setError(requirementsError?.response?.data?.message || requirementsError?.message || 'Unable to load import requirements.');
        } finally {
            setTemplateLoading(false);
        }
    };

    const runPreview = async () => {
        setLoading(true);
        setError(null);
        setPreview(null);
        setTimeout(() => {
            setLoading(false);
            setError(
  "No School Data Workbook Found\n\n" +
  "School data has not been uploaded yet.\n\n" +
  "To continue, upload and validate your school's Excel workbook from the VidyaSetu Web Portal.\n\n" +
  "After validation is complete, the import status and readiness information will appear here."
);
        }, 350);
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
                    <Text style={styles.heroEyebrow}>School Data Import</Text>
                    <Text style={styles.heroTitle}>Workbook Commit Visibility</Text>
                    <Text style={styles.heroSubtitle}>Review workbook upload, validation, commit, rollback, and activation visibility for this school.</Text>
                </View>

                <View style={styles.contentCard}>
                    <Text style={styles.sectionEyebrow}>ACTIVE TENANT</Text>
                    <Text style={styles.sectionTitle}>{session?.schoolId || 'DEMO'} · {session?.role || 'ADMIN'}</Text>
                    <Text style={styles.bodyText}>Validate workbook sheets, row-level issues, teacher assignments, academic rules, and timetable readiness before final import processing.</Text>
                    <Text style={styles.previewSummary}>Workspace setup complete: {productionImportStatus.completedSteps}/{productionImportStatus.totalSteps} complete.</Text>

                    {productionImportStatus.importLocked ? (
                        <View style={styles.previewBox}>
                            <Text style={styles.previewStatus}>🔒 Import Locked</Text>
                            <Text style={styles.previewSummary}>{productionImportStatus.importLockMessage}</Text>
                            <Text style={styles.previewSummary}>{productionImportStatus.completedSteps}/{productionImportStatus.totalSteps} required setup steps complete.</Text>
                            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/workspace-setup')} activeOpacity={0.88}>
                                <Text style={styles.primaryButtonText}>Open Workspace Setup</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.emptyStateBox}>
                            <Text style={styles.emptyStateStatus}>No School Data Workbook Found</Text>
                            <Text style={styles.emptyStateTitle}>School data has not been uploaded yet.</Text>
                            <Text style={styles.emptyStateText}>{"To continue, upload and validate your school's Excel workbook from the VidyaSetu Web Portal.\n\nAfter validation is complete, the import status and readiness information will appear here."}</Text>
                            <View style={styles.statusPillRow}>
                                <View style={styles.statusPill}><Text style={styles.statusPillText}>Workbook Status: Not Uploaded</Text></View>
                                <View style={styles.statusPill}><Text style={styles.statusPillText}>Validation Status: Pending</Text></View>
                                <View style={styles.statusPill}><Text style={styles.statusPillText}>Import Status: Waiting for Workbook</Text></View>
                            </View>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.primaryButton, productionImportStatus.importLocked && { opacity: 0.45 }]} onPress={loadRequirements} activeOpacity={0.88} disabled={templateLoading || productionImportStatus.importLocked}>
                        {templateLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Check Required Workbook Template</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.secondaryButton, productionImportStatus.importLocked && { opacity: 0.45 }]} onPress={runPreview} activeOpacity={0.88} disabled={loading || productionImportStatus.importLocked}>
                        {loading ? <ActivityIndicator color={colors.primaryNavy} /> : <Text style={styles.secondaryButtonText}>Open Web Portal to Upload Workbook</Text>}
                    </TouchableOpacity>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    {template ? (
                        <View style={styles.previewBox}>
                            <Text style={styles.previewStatus}>Template Requirements Loaded</Text>
                            <Text style={styles.previewSummary}>Allowed roles: {template.allowedRoles?.join(', ') || 'ADMIN, PRINCIPAL'}</Text>
                            <Text style={styles.previewSummary}>Import type: {template.importType || 'MASTER_WORKBOOK'}</Text>

                            <Text style={styles.subTitle}>Required Workbook Sheets</Text>
                            {template.requiredSheets?.map((sheetName) => (
                                <View key={sheetName} style={styles.sheetRow}>
                                    <Text style={styles.sheetName}>{sheetName}</Text>
                                    <Text style={styles.sheetMeta}>{(template.requiredColumns?.[sheetName] || []).join(', ') || 'Columns pending'}</Text>
                                </View>
                            ))}

                            <Text style={styles.subTitle}>Validation Rules</Text>
                            {template.validationRules?.slice(0, 6).map((rule, index) => (
                                <View key={`${rule}-${index}`} style={styles.ruleRow}>
                                    <Text style={styles.ruleText}>{rule}</Text>
                                </View>
                            ))}
                        </View>
                    ) : null}

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

                            <TouchableOpacity
                                style={[styles.commitButton, !canCommitPreview && styles.disabledButton]}
                                activeOpacity={0.88}
                                disabled={!canCommitPreview}
                                onPress={() => setError('Mobile commit is enabled only after backend validation returns READY_TO_IMPORT or READY_WITH_WARNINGS.')}
                            >
                                <Text style={styles.commitButtonText}>{canCommitPreview ? 'Commit Import' : 'Commit Locked'}</Text>
                            </TouchableOpacity>
                            {!canCommitPreview ? <Text style={styles.previewSummary}>Commit is locked until the workbook is ready or ready with warnings.</Text> : null}

                            <Text style={styles.subTitle}>Detected Workbook Sheets</Text>
                            {preview.previewSheets?.map((sheet) => (
                                <View key={sheet.sheetName} style={styles.sheetRow}>
                                    <Text style={styles.sheetName}>{sheet.sheetName}</Text>
                                    <Text style={styles.sheetMeta}>{sheet.totalRows} rows · {sheet.headers?.length || 0} headers</Text>
                                </View>
                            ))}

                            <Text style={styles.subTitle}>Row-Level Validation Issues</Text>
                            {preview.issues?.length ? preview.issues.map((issue, index) => (
                                <View key={`${issue.sheetName}-${index}`} style={styles.issueRow}>
                                    <Text style={[styles.issueSeverity, issue.severity === 'ERROR' && styles.issueError]}>{issue.severity}</Text>
                                    <Text style={styles.issueMessage}>{issue.sheetName}: {issue.message}</Text>
                                </View>
                            )) : <Text style={styles.successText}>No blocking errors found. Workbook is ready for backend upload/commit from the web portal.</Text>}
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
    emptyStateBox: { marginTop: spacing.xl, backgroundColor: '#FFF8E1', borderRadius: 24, borderWidth: 1.2, borderColor: colors.cardGoldBorder, padding: spacing.lg },
    emptyStateStatus: { fontSize: 13, fontWeight: '900', color: '#92400E', textTransform: 'uppercase', letterSpacing: 1.1 },
    emptyStateTitle: { fontSize: 20, fontWeight: '900', color: colors.primaryNavy, marginTop: spacing.xs },
    emptyStateText: { fontSize: 14, lineHeight: 21, fontWeight: '800', color: colors.slateText, marginTop: spacing.sm },
    statusPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.md },
    statusPill: { backgroundColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.cardGoldBorder },
    statusPillText: { fontSize: 11, fontWeight: '900', color: colors.primaryNavy },
    primaryButton: { marginTop: spacing.xl, backgroundColor: colors.primaryNavy, borderRadius: 22, paddingVertical: 16, alignItems: 'center' },
    primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', textAlign: 'center' },
    secondaryButton: { marginTop: spacing.md, backgroundColor: '#FFFFFF', borderRadius: 22, paddingVertical: 15, alignItems: 'center', borderWidth: 1.2, borderColor: colors.cardGoldBorder },
    secondaryButtonText: { color: colors.primaryNavy, fontSize: 15, fontWeight: '900', textAlign: 'center' },
    commitButton: { marginTop: spacing.lg, backgroundColor: '#047857', borderRadius: 22, paddingVertical: 15, alignItems: 'center' },
    disabledButton: { backgroundColor: '#9CA3AF', opacity: 0.65 },
    commitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
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
    ruleRow: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.cardGoldBorder },
    ruleText: { fontSize: 13, lineHeight: 19, fontWeight: '800', color: colors.slateText },
    successText: { fontSize: 14, lineHeight: 20, fontWeight: '900', color: '#166534' },
});
