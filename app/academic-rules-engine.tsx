import { router, useLocalSearchParams } from 'expo-router';
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
import { getDefaultAcademicRules, validateAcademicRules } from '../src/services/timetableApi';
import { colors, shadows, spacing } from '../src/theme';
import { AcademicRule, AcademicRulesSummary } from '../src/types/timetable';

const subjectTypeOrder = ['THEORY', 'LAB', 'SPORTS', 'ACTIVITY'];

export default function AcademicRulesEngineScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || params.role || 'admin').toLowerCase();
    const classNames = String(params.classNames || '1,2').split(',').map(item => item.trim()).filter(Boolean);
    const sections = String(params.sections || 'A,B').split(',').map(item => item.trim()).filter(Boolean);
    const homePath = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';

    const [loading, setLoading] = useState(true);
    const [rules, setRules] = useState<AcademicRule[]>([]);
    const [summary, setSummary] = useState<AcademicRulesSummary | null>(null);
    const [message, setMessage] = useState('');

    const groupedRules = useMemo(() => {
        return rules.reduce<Record<string, AcademicRule[]>>((acc, rule) => {
            acc[rule.className] = acc[rule.className] || [];
            acc[rule.className].push(rule);
            return acc;
        }, {});
    }, [rules]);

    const loadRules = async () => {
        setLoading(true);
        setMessage('');
        try {
            const data = await getDefaultAcademicRules({ classNames, sections });
            setRules(data);
            const validated = await validateAcademicRules({ classNames, sections, academicRules: data, academicRulesEngineEnabled: true });
            setSummary(validated);
            setMessage(validated.valid ? 'Academic rules are valid for selected classes and sections.' : 'Academic rules need review before publishing.');
        } catch {
            setMessage('Backend academic rules API not available. Please test after backend starts on port 8080.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRules();
    }, []);

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.eyebrow}>SMART ACADEMIC RULES</Text>
                        <Text style={styles.title}>Academic Rules Engine</Text>
                    </View>
                    <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Selected Scope</Text>
                    <Text style={styles.helper}>Classes: {classNames.join(', ')} • Sections: {sections.join(', ')}</Text>
                    <Text style={styles.note}>Rules define weekly subject allocation before timetable generation: theory distribution, fixed labs/sports, continuity preference, and subject priorities.</Text>
                </View>

                {loading ? <ActivityIndicator color={colors.primaryNavy} size="large" /> : null}
                {message ? <Text style={styles.message}>{message}</Text> : null}

                {summary ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Validation Summary</Text>
                        <View style={styles.kpiGrid}>
                            <Kpi label="Rules" value={String(summary.totalRules)} />
                            <Kpi label="Required" value={String(summary.totalWeeklyPeriodsRequired)} />
                            <Kpi label="Slots" value={String(summary.availableWeeklySlots)} />
                            <Kpi label="Valid" value={summary.valid ? 'Yes' : 'No'} />
                        </View>
                        <View style={styles.kpiGrid}>
                            <Kpi label="Theory" value={String(summary.theoryPeriods)} />
                            <Kpi label="Labs" value={String(summary.labPeriods)} />
                            <Kpi label="Sports" value={String(summary.sportsPeriods)} />
                            <Kpi label="Activity" value={String(summary.activityPeriods)} />
                        </View>
                        {summary.warnings.map(warning => <Text key={warning} style={styles.warning}>⚠ {warning}</Text>)}
                    </View>
                ) : null}

                {Object.entries(groupedRules).map(([className, classRules]) => (
                    <View key={className} style={styles.card}>
                        <Text style={styles.cardTitle}>Class {className} Rules</Text>
                        {subjectTypeOrder.map(type => {
                            const typedRules = classRules.filter(rule => rule.subjectType === type);
                            if (!typedRules.length) return null;
                            return (
                                <View key={type} style={styles.ruleGroup}>
                                    <Text style={styles.groupTitle}>{type}</Text>
                                    {typedRules.map(rule => (
                                        <View key={rule.ruleId} style={styles.ruleRow}>
                                            <View style={styles.ruleMain}>
                                                <Text style={styles.subject}>{rule.subjectName}</Text>
                                                <Text style={styles.meta}>{rule.weeklyPeriods} weekly periods • {rule.priority || 'MEDIUM'} priority</Text>
                                            </View>
                                            <View style={styles.badges}>
                                                {rule.fixedPeriodRequired ? <Text style={styles.badge}>Fixed P{rule.preferredPeriodNumber}</Text> : null}
                                                {rule.sameTeacherContinuityRequired ? <Text style={styles.badge}>Continuity</Text> : null}
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            );
                        })}
                    </View>
                ))}

                <TouchableOpacity style={styles.primaryButton} onPress={loadRules} disabled={loading}>
                    <Text style={styles.primaryText}>Reload & Validate Rules</Text>
                </TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}

function Kpi({ label, value }: { label: string; value: string }) {
    return <View style={styles.kpi}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 30 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 8 },
    circleButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.primaryNavy, fontSize: 28, fontWeight: '900', marginTop: -2 },
    homeIcon: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900', marginTop: 0 },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 20, fontWeight: '900', textAlign: 'center' },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.medium },
    cardTitle: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900', marginBottom: 9 },
    helper: { color: colors.slateText, fontWeight: '700', fontSize: 12, lineHeight: 17, marginBottom: 5 },
    note: { color: colors.mutedText, fontWeight: '700', fontSize: 11, lineHeight: 16 },
    message: { color: colors.primaryNavy, fontWeight: '900', textAlign: 'center', marginVertical: 10 },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
    kpi: { flexGrow: 1, minWidth: '22%', backgroundColor: 'rgba(255,248,225,0.9)', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: colors.cardGoldBorder, alignItems: 'center' },
    kpiValue: { color: colors.primaryNavy, fontSize: 17, fontWeight: '900' },
    kpiLabel: { color: colors.deepGold, fontSize: 9, fontWeight: '900', marginTop: 2 },
    warning: { color: '#8A4B00', fontWeight: '800', fontSize: 11, lineHeight: 16, marginTop: 4 },
    ruleGroup: { marginTop: 8 },
    groupTitle: { color: colors.deepGold, fontWeight: '900', fontSize: 11, marginBottom: 6 },
    ruleRow: { backgroundColor: '#FFF8E6', borderRadius: 15, padding: 10, marginBottom: 7, borderWidth: 1, borderColor: colors.cardGoldBorder, flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    ruleMain: { flex: 1 },
    subject: { color: colors.primaryNavy, fontSize: 13, fontWeight: '900' },
    meta: { color: colors.slateText, fontSize: 10, fontWeight: '700', marginTop: 3 },
    badges: { alignItems: 'flex-end', gap: 4 },
    badge: { color: '#fff', backgroundColor: colors.primaryNavy, borderRadius: 12, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4, fontSize: 9, fontWeight: '900' },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 22, paddingVertical: 15, alignItems: 'center', ...shadows.medium },
    primaryText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
