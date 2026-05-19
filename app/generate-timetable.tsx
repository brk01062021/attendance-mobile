import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';
import { generateTimetable, getDefaultAcademicRules, validateAcademicRules } from '../src/services/timetableApi';
import {
    ClassTeacherPool,
    TeacherPoolSource,
    TimetableGenerationMode,
    TimetableGenerationRequest,
    TimetableGenerationResponse,
    AcademicRule,
    AcademicRulesSummary,
} from '../src/types/timetable';
import { CLASS_OPTIONS, DEFAULT_CLASS_TEACHER_POOLS, EXCEL_POOL_TABS } from '../src/data/timetableDefaults';
import { saveTimetableReviewSnapshot } from '../src/state/timetableReviewStore';

const modes: TimetableGenerationMode[] = ['ANNUAL', 'QUARTERLY', 'MONTHLY', 'CUSTOM'];
const DEFAULT_DAY14_RULES: AcademicRule[] = ['1', '2'].flatMap(className => [
    { ruleId: `AR-${className}-TEL`, className, subjectName: 'Telugu', subjectType: 'THEORY', weeklyPeriods: 5, sameTeacherContinuityRequired: true, priority: 'HIGH' },
    { ruleId: `AR-${className}-ENG`, className, subjectName: 'English', subjectType: 'THEORY', weeklyPeriods: 5, sameTeacherContinuityRequired: true, priority: 'HIGH' },
    { ruleId: `AR-${className}-MAT`, className, subjectName: 'Mathematics', subjectType: 'THEORY', weeklyPeriods: 6, sameTeacherContinuityRequired: true, priority: 'HIGH' },
    { ruleId: `AR-${className}-SCI`, className, subjectName: 'Science', subjectType: 'THEORY', weeklyPeriods: 5, sameTeacherContinuityRequired: true, priority: 'HIGH' },
    { ruleId: `AR-${className}-SOC`, className, subjectName: 'Social', subjectType: 'THEORY', weeklyPeriods: 5, sameTeacherContinuityRequired: true, priority: 'MEDIUM' },
    { ruleId: `AR-${className}-COM`, className, subjectName: 'Computer', subjectType: 'LAB', weeklyPeriods: 2, fixedPeriodRequired: true, preferredPeriodNumber: 5, sameTeacherContinuityRequired: true, priority: 'MEDIUM' },
    { ruleId: `AR-${className}-SPO`, className, subjectName: 'Sports', subjectType: 'SPORTS', weeklyPeriods: 2, fixedPeriodRequired: true, preferredPeriodNumber: 6, priority: 'LOW' },
    { ruleId: `AR-${className}-LIB`, className, subjectName: 'Library', subjectType: 'ACTIVITY', weeklyPeriods: 1, priority: 'LOW' },
]);

const poolSources: { key: TeacherPoolSource; label: string; subtitle: string }[] = [
    { key: 'AUTO_DEFAULT_POOL', label: 'Auto Default Teacher Pool', subtitle: 'Use class-wise pool automatically' },
    { key: 'EXCEL_CLASS_POOL', label: 'Excel Class Pool', subtitle: 'Principal upload: Pool 1, Pool 2, ...' },
    { key: 'MANUAL_TEACHER_IDS', label: 'Manual Teacher IDs', subtitle: 'Fallback only when needed' },
];

export default function GenerateTimetableScreen() {
    const params = useLocalSearchParams();
    const role = String(params.role || 'ADMIN');
    const sourceRole = String(params.sourceRole || role.toLowerCase());
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';

    const [academicYear, setAcademicYear] = useState('2026-2027');
    const [generationMode, setGenerationMode] = useState<TimetableGenerationMode>('ANNUAL');
    const [selectedClasses, setSelectedClasses] = useState<string[]>(['1', '2']);
    const [manualSections, setManualSections] = useState<string[]>([]);
    const [teacherPoolSource, setTeacherPoolSource] = useState<TeacherPoolSource>('AUTO_DEFAULT_POOL');
    const [manualTeacherIds, setManualTeacherIds] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TimetableGenerationResponse | null>(null);
    const [message, setMessage] = useState('');
    const [academicRules, setAcademicRules] = useState<AcademicRule[]>(DEFAULT_DAY14_RULES);
    const [academicRulesSummary, setAcademicRulesSummary] = useState<AcademicRulesSummary | null>(null);

    const autoSections = useMemo(() => {
        const sections = new Set<string>();
        selectedClasses.forEach(className => {
            CLASS_OPTIONS.find(option => option.className === className)?.sections.forEach(section => sections.add(section));
        });
        return Array.from(sections);
    }, [selectedClasses]);

    const selectedSections = manualSections.length ? manualSections : autoSections;

    const selectedTeacherPools = useMemo<ClassTeacherPool[]>(() => {
        return DEFAULT_CLASS_TEACHER_POOLS.filter(pool => selectedClasses.includes(pool.className));
    }, [selectedClasses]);

    const resolvedTeacherIds = useMemo(() => {
        if (teacherPoolSource === 'MANUAL_TEACHER_IDS') {
            return manualTeacherIds.split(',').map(v => Number(v.trim())).filter(Boolean);
        }
        return Array.from(new Set(selectedTeacherPools.flatMap(pool => pool.teacherIds)));
    }, [manualTeacherIds, selectedTeacherPools, teacherPoolSource]);

    const request = useMemo<TimetableGenerationRequest>(() => ({
        academicYear,
        generationMode,
        classNames: selectedClasses,
        sections: selectedSections,
        teacherIds: resolvedTeacherIds,
        teacherPoolSource,
        autoLoadSectionsEnabled: true,
        autoDefaultTeacherPoolEnabled: teacherPoolSource !== 'MANUAL_TEACHER_IDS',
        selectedTeacherPools,
        equalDistributionEnabled: true,
        workloadBalancingEnabled: true,
        fixedLabPeriodsEnabled: true,
        avoidTeacherGapsEnabled: true,
        sameTeacherContinuityEnabled: true,
        preventConsecutiveLabsEnabled: true,
        conflictFreeGenerationEnabled: true,
        academicRulesEngineEnabled: true,
        academicRules: academicRules.filter(rule => selectedClasses.includes(rule.className)),
    }), [academicRules, academicYear, generationMode, resolvedTeacherIds, selectedClasses, selectedSections, selectedTeacherPools, teacherPoolSource]);

    const toggleClass = (className: string) => {
        setResult(null);
        setSelectedClasses(prev => prev.includes(className) ? prev.filter(item => item !== className) : [...prev, className]);
        setManualSections([]);
        loadAcademicRulesForClasses(prevClassesAfterToggle(selectedClasses, className));
    };

    const prevClassesAfterToggle = (current: string[], className: string) => current.includes(className) ? current.filter(item => item !== className) : [...current, className];

    const loadAcademicRulesForClasses = async (classes: string[]) => {
        try {
            const rules = await getDefaultAcademicRules({ classNames: classes.length ? classes : selectedClasses, sections: selectedSections });
            setAcademicRules(rules);
        } catch {
            const fallbackClasses = classes.length ? classes : selectedClasses;
            setAcademicRules(DEFAULT_DAY14_RULES.filter(rule => fallbackClasses.includes(rule.className)));
        }
    };

    const toggleSection = (section: string) => {
        setResult(null);
        setManualSections(prev => prev.includes(section) ? prev.filter(item => item !== section) : [...prev, section]);
    };

    const runGeneration = async () => {
        if (!selectedClasses.length || !selectedSections.length || !resolvedTeacherIds.length) {
            setMessage('Please select at least one class, one section, and one teacher pool before generation.');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const summary = await validateAcademicRules(request);
            setAcademicRulesSummary(summary);
            const data = await generateTimetable(request);
            saveTimetableReviewSnapshot(request, data);
            setResult(data);
            setMessage(data.conflictsDetected === 0 ? 'Smart conflict-free timetable generated successfully. No teacher double-booking found.' : 'Timetable generated. Please review remaining alerts in Conflict Center.');
        } catch {
            const demo: TimetableGenerationResponse = {
                generatedBatchId: `DAY10-DEMO-${Date.now()}`,
                completionPercentage: 94,
                totalClassesScheduled: request.classNames.length * request.sections.length,
                totalEntries: request.classNames.length * request.sections.length * 6 * 6,
                conflictsDetected: 0,
                overloadRiskTeachers: 1,
                entries: [],
                conflicts: [],
                workloadSummary: [],
                academicRulesSummary: academicRulesSummary || undefined,
            };
            saveTimetableReviewSnapshot(request, demo);
            setResult(demo);
            setMessage('Backend timetable API not available yet. Showing Day 13 conflict-free workflow demo.');
        } finally {
            setLoading(false);
        }
    };

    const navParams = {
        role,
        sourceRole,
        generatedBatchId: result?.generatedBatchId || 'DEMO',
        classNames: selectedClasses.join(','),
        sections: selectedSections.join(','),
    };

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <PageHeader title="Generate Timetable" eyebrow="DAY 14 • SMART ACADEMIC RULES ENGINE" homePath={backHome} />

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Generation Setup</Text>
                    <Field label="Academic Year" value={academicYear} onChangeText={setAcademicYear} />
                    <Text style={styles.label}>Generation Mode</Text>
                    <View style={styles.modeRow}>
                        {modes.map(mode => (
                            <TouchableOpacity key={mode} style={[styles.modePill, generationMode === mode && styles.modePillActive]} onPress={() => setGenerationMode(mode)}>
                                <Text style={[styles.modeText, generationMode === mode && styles.modeTextActive]}>{mode}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Classes Dropdown Checklist</Text>
                    <Text style={styles.helper}>Select classes. Sections will auto-load from selected classes.</Text>
                    <View style={styles.classGrid}>
                        {CLASS_OPTIONS.map(option => {
                            const active = selectedClasses.includes(option.className);
                            return (
                                <TouchableOpacity key={option.className} style={[styles.classTile, active && styles.classTileActive]} onPress={() => toggleClass(option.className)}>
                                    <Text style={[styles.classLabel, active && styles.classLabelActive]}>{option.label}</Text>
                                    <Text style={[styles.classMeta, active && styles.classMetaActive]}>{option.sections.join(', ')}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Auto-loaded Sections</Text>
                    <Text style={styles.helper}>Default sections from selected classes: {autoSections.join(', ') || 'None'}</Text>
                    <View style={styles.modeRow}>
                        {autoSections.map(section => {
                            const active = selectedSections.includes(section);
                            return (
                                <TouchableOpacity key={section} style={[styles.sectionPill, active && styles.sectionPillActive]} onPress={() => toggleSection(section)}>
                                    <Text style={[styles.sectionText, active && styles.sectionTextActive]}>Section {section}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <Text style={styles.note}>Tip: leave all section chips unmodified to use the auto-loaded default.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Teacher Pool Source</Text>
                    {poolSources.map(source => (
                        <TouchableOpacity key={source.key} style={[styles.poolSource, teacherPoolSource === source.key && styles.poolSourceActive]} onPress={() => setTeacherPoolSource(source.key)}>
                            <View style={styles.radioOuter}>{teacherPoolSource === source.key ? <View style={styles.radioInner} /> : null}</View>
                            <View style={styles.poolSourceTextWrap}>
                                <Text style={styles.poolSourceTitle}>{source.label}</Text>
                                <Text style={styles.poolSourceSub}>{source.subtitle}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                    {teacherPoolSource === 'MANUAL_TEACHER_IDS' ? <Field label="Manual Teacher IDs" value={manualTeacherIds} onChangeText={setManualTeacherIds} placeholder="Example: 1,2,3,4" /> : null}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Selected Class Teacher Pools</Text>
                    {selectedTeacherPools.map(pool => (
                        <View key={pool.poolId} style={styles.poolCard}>
                            <View style={styles.poolTopRow}>
                                <Text style={styles.poolName}>{pool.poolName}</Text>
                                <Text style={styles.poolBadge}>{pool.teacherIds.length} teachers</Text>
                            </View>
                            <Text style={styles.poolTeachers}>{pool.teacherNames?.join(', ')}</Text>
                        </View>
                    ))}
                    {!selectedTeacherPools.length ? <Text style={styles.helper}>Select classes to auto-load class-wise teacher pools.</Text> : null}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Principal Excel Pool Format</Text>
                    <Text style={styles.helper}>Supported onboarding tabs: {EXCEL_POOL_TABS.join(', ')}</Text>
                    <Text style={styles.note}>Pool 1 = all teachers for Class 1, Pool 2 = all teachers for Class 2, and same pattern for each class.</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.poolTopRow}>
                        <Text style={styles.cardTitle}>Smart Academic Rules Engine</Text>
                        <TouchableOpacity style={styles.poolBadgeButton} onPress={() => router.push({ pathname: '/academic-rules-engine' as any, params: { ...navParams, classNames: selectedClasses.join(','), sections: selectedSections.join(',') } })}>
                            <Text style={styles.poolBadgeButtonText}>Open</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.helper}>Rules loaded: {request.academicRules?.length || 0}. Theory, Lab, Sports and Activity periods are sent to backend generation.</Text>
                    {(academicRulesSummary || result?.academicRulesSummary) ? <View style={styles.kpiGrid}>
                        <Kpi label="Required" value={String((academicRulesSummary || result?.academicRulesSummary)?.totalWeeklyPeriodsRequired || 0)} />
                        <Kpi label="Slots" value={String((academicRulesSummary || result?.academicRulesSummary)?.availableWeeklySlots || 0)} />
                        <Kpi label="Labs" value={String((academicRulesSummary || result?.academicRulesSummary)?.labPeriods || 0)} />
                        <Kpi label="Sports" value={String((academicRulesSummary || result?.academicRulesSummary)?.sportsPeriods || 0)} />
                    </View> : null}
                    {(academicRulesSummary || result?.academicRulesSummary)?.warnings?.slice(0, 2).map(warning => <Text key={warning} style={styles.note}>⚠ {warning}</Text>)}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Smart Rules Enabled</Text>
                    {[
                        'Equal theory distribution',
                        'Workload balancing',
                        'Fixed lab / sports periods',
                        'Avoid teacher timetable gaps',
                        'Same teacher continuity for same class-section',
                        'Prevent consecutive labs',
                        'Teacher availability map prevents double-booking',
                        'Lowest workload teacher selected first',
                        'Subject-aware weekly academic allocation',
                        'Fixed Computer lab and Sports period preferences',
                    ].map(item => <Text key={item} style={styles.rule}>✓ {item}</Text>)}
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={runGeneration} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Generate Smart Timetable</Text>}
                </TouchableOpacity>
                {message ? <Text style={styles.message}>{message}</Text> : null}

                {result ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Generation Summary</Text>
                        <View style={styles.kpiGrid}>
                            <Kpi label="Completion" value={`${result.completionPercentage}%`} />
                            <Kpi label="Classes" value={String(result.totalClassesScheduled)} />
                            <Kpi label="Entries" value={String(result.totalEntries)} />
                            <Kpi label="Conflicts" value={String(result.conflictsDetected)} />
                        </View>
                        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/timetable-review' as any, params: navParams })}>
                            <Text style={styles.secondaryText}>Review Timetable</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.linkButton} onPress={() => router.push({ pathname: '/timetable-conflicts' as any, params: navParams })}>
                            <Text style={styles.linkText}>Open Conflict Center</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </ScrollView>
        </ImageBackground>
    );
}

function PageHeader({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) {
    return <View style={styles.headerRow}><TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity><View style={styles.headerTextWrap}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View><TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity></View>;
}
function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string }) {
    return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput style={styles.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8A610D" /></View>;
}
function Kpi({ label, value }: { label: string; value: string }) {
    return <View style={styles.kpi}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 30 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 7 },
    circleButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.primaryNavy, fontSize: 40, fontWeight: '900', marginTop: -7 },
    homeIcon: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900', textAlign: 'center' },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 11, marginBottom: 9, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.medium },
    cardTitle: { color: colors.primaryNavy, fontSize: 13, fontWeight: '900', marginBottom: 9 },
    field: { marginBottom: 9 },
    label: { color: colors.deepGold, fontWeight: '800', fontSize: 12, marginBottom: 6 },
    helper: { color: colors.slateText, fontWeight: '700', fontSize: 11, lineHeight: 16, marginBottom: 8 },
    note: { color: colors.mutedText, fontWeight: '700', fontSize: 10, lineHeight: 15, marginTop: 4 },
    input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 13, padding: 10, color: colors.darkText, fontWeight: '700', fontSize: 13 },
    modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 4 },
    modePill: { paddingVertical: 7, paddingHorizontal: 9, borderRadius: 999, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.cardGoldBorder },
    modePillActive: { backgroundColor: colors.primaryNavy },
    modeText: { color: colors.deepGold, fontWeight: '900', fontSize: 9 },
    modeTextActive: { color: colors.white },
    classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    classTile: { width: '31%', minHeight: 58, borderRadius: 15, padding: 9, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.cardGoldBorder },
    classTileActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy },
    classLabel: { color: colors.primaryNavy, fontWeight: '900', fontSize: 12 },
    classLabelActive: { color: colors.white },
    classMeta: { color: colors.deepGold, fontWeight: '800', fontSize: 9, marginTop: 4 },
    classMetaActive: { color: colors.premiumGold },
    sectionPill: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.cardCream, borderWidth: 1, borderColor: colors.cardGoldBorder },
    sectionPillActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy },
    sectionText: { color: colors.deepGold, fontWeight: '900', fontSize: 11 },
    sectionTextActive: { color: colors.white },
    poolSource: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 15, backgroundColor: colors.softCream, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 8 },
    poolSourceActive: { backgroundColor: 'rgba(13,37,63,0.08)', borderColor: colors.primaryNavy },
    radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.primaryNavy, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primaryNavy },
    poolSourceTextWrap: { flex: 1 },
    poolSourceTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 12 },
    poolSourceSub: { color: colors.mutedText, fontWeight: '700', fontSize: 10, marginTop: 2 },
    poolCard: { backgroundColor: colors.white, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: colors.divider, marginBottom: 8 },
    poolTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    poolName: { flex: 1, color: colors.primaryNavy, fontWeight: '900', fontSize: 12 },
    poolBadge: { color: colors.deepGold, fontWeight: '900', fontSize: 10 },
    poolBadgeButton: { backgroundColor: colors.primaryNavy, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
    poolBadgeButtonText: { color: '#fff', fontWeight: '900', fontSize: 10 },
    poolTeachers: { color: colors.slateText, fontWeight: '700', fontSize: 10, lineHeight: 15, marginTop: 5 },
    rule: { color: colors.slateText, fontWeight: '700', marginBottom: 8, fontSize: 11 },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 14, padding: 12, alignItems: 'center', marginBottom: 8, ...shadows.medium },
    primaryText: { color: colors.white, fontWeight: '900', fontSize: 12 },
    message: { color: colors.deepGold, fontWeight: '800', marginBottom: 9, lineHeight: 17 },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
    kpi: { width: '47%', backgroundColor: colors.softCream, borderRadius: 14, padding: 11, borderWidth: 1, borderColor: colors.cardGoldBorder },
    kpiValue: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900' },
    kpiLabel: { color: colors.mutedText, fontWeight: '700', marginTop: 4, fontSize: 10 },
    secondaryButton: { backgroundColor: colors.premiumGold, padding: 11, borderRadius: 13, alignItems: 'center', marginTop: 12 },
    secondaryText: { color: colors.primaryNavy, fontWeight: '900' },
    linkButton: { padding: 11, alignItems: 'center' },
    linkText: { color: colors.infoBlue, fontWeight: '900' },
});
