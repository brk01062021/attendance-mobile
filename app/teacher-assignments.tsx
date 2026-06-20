import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { colors, shadows, spacing } from '../src/theme';

type AssignmentRow = {
    teacherId: number;
    teacher: string;
    className: string;
    section: string;
    subject: string;
};

const SUBJECTS = ['Computers', 'English', 'Hindi', 'Math', 'Science', 'Social', 'Sports'];
const CLASS_SECTION_ROWS = ['1', '2', '3', '4'].flatMap(className => ['A', 'B'].map(section => ({ className, section })));
const CLASS_A_TEACHERS = [
    { teacherId: 12, teacher: 'Ravi Chandra' },
    { teacherId: 1, teacher: 'Aruna Meka' },
    { teacherId: 10, teacher: 'Pooja Das' },
    { teacherId: 8, teacher: 'Madhav Singh' },
    { teacherId: 13, teacher: 'Suresh Kota' },
    { teacherId: 5, teacher: 'Eshwar Kumar' },
    { teacherId: 7, teacher: 'Lakshmi Gupta' },
];
const CLASS_B_TEACHERS = [
    { teacherId: 6, teacher: 'Farah Khan' },
    { teacherId: 3, teacher: 'Chandra Rao' },
    { teacherId: 4, teacher: 'Deepa Nair' },
    { teacherId: 15, teacher: 'Zoya Bose' },
    { teacherId: 2, teacher: 'Bhavana Reddy' },
    { teacherId: 11, teacher: 'Qureshi Rahman' },
    { teacherId: 14, teacher: 'Yamini Shetty' },
];

const ASSIGNMENTS: AssignmentRow[] = CLASS_SECTION_ROWS.flatMap(({ className, section }) => {
    const teachers = section === 'A' ? CLASS_A_TEACHERS : CLASS_B_TEACHERS;
    return SUBJECTS.map((subject, index) => ({
        teacherId: teachers[index].teacherId,
        teacher: teachers[index].teacher,
        className: `Class ${className}`,
        section,
        subject,
    }));
});

const unique = (values: string[]) => Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

export default function TeacherAssignmentsScreen() {
    const params = useLocalSearchParams();
    const role = String(params.role || 'ADMIN');
    const sourceRole = String(params.sourceRole || role.toLowerCase());
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';

    const [teacherIdFilter, setTeacherIdFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [search, setSearch] = useState('');

    const teacherIdOptions = useMemo(() => unique(ASSIGNMENTS.map(row => String(row.teacherId))), []);
    const classOptions = useMemo(() => unique(ASSIGNMENTS.map(row => row.className)), []);
    const sectionOptions = useMemo(() => unique(ASSIGNMENTS.map(row => row.section)), []);
    const subjectOptions = useMemo(() => unique(ASSIGNMENTS.map(row => row.subject)), []);

    const filteredAssignments = useMemo(() => {
        const needle = search.trim().toLowerCase();
        return ASSIGNMENTS.filter(row => {
            const matchesTeacherId = !teacherIdFilter || String(row.teacherId) === teacherIdFilter;
            const matchesClass = !classFilter || row.className === classFilter;
            const matchesSection = !sectionFilter || row.section === sectionFilter;
            const matchesSubject = !subjectFilter || row.subject === subjectFilter;
            const matchesSearch = !needle || [row.teacher, row.teacherId, row.className, row.section, row.subject].join(' ').toLowerCase().includes(needle);
            return matchesTeacherId && matchesClass && matchesSection && matchesSubject && matchesSearch;
        });
    }, [classFilter, search, sectionFilter, subjectFilter, teacherIdFilter]);

    const clearFilters = () => {
        setTeacherIdFilter('');
        setClassFilter('');
        setSectionFilter('');
        setSubjectFilter('');
        setSearch('');
    };

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <MobileWorkflowHeader
                    title="Teacher Assignments"
                    eyebrow="ADMIN OPERATIONS"
                    subtitle="Class-section-subject mapping"
                    homePath={backHome}
                    sourceRole={sourceRole}
                />

                <View style={styles.card}>
                    <View style={styles.cardTopRow}>
                        <View style={styles.cardTitleWrap}>
                            <Text style={styles.cardTitle}>Assignment Filters</Text>
                            <Text style={styles.helper}>Use real tenant assignment rows to validate timetable readiness and workload balance.</Text>
                        </View>
                        <Text style={styles.tenantBadge}>TST2</Text>
                    </View>
                    <TextInput
                        style={styles.input}
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search teacher, class, section, subject"
                        placeholderTextColor="#8A610D"
                    />
                    <FilterGroup title="Teacher ID" options={teacherIdOptions} value={teacherIdFilter} onChange={setTeacherIdFilter} prefix="ID " />
                    <FilterGroup title="Class" options={classOptions} value={classFilter} onChange={setClassFilter} />
                    <FilterGroup title="Section" options={sectionOptions} value={sectionFilter} onChange={setSectionFilter} prefix="Section " />
                    <FilterGroup title="Subject" options={subjectOptions} value={subjectFilter} onChange={setSubjectFilter} />
                    <TouchableOpacity style={styles.clearButton} onPress={clearFilters} activeOpacity={0.85}>
                        <Text style={styles.clearText}>Clear Filters</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.kpiRow}>
                    <Kpi label="Rows" value={String(filteredAssignments.length)} />
                    <Kpi label="Classes" value="4" />
                    <Kpi label="Sections" value="2" />
                    <Kpi label="Teachers" value="15" />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Detailed Assignment Rows</Text>
                    <Text style={styles.helper}>Showing {filteredAssignments.length} of {ASSIGNMENTS.length} teacher-subject-class-section rows.</Text>
                    {filteredAssignments.slice(0, 30).map((row, index) => (
                        <View key={`${row.teacherId}-${row.className}-${row.section}-${row.subject}-${index}`} style={styles.assignmentRow}>
                            <View style={styles.assignmentMain}>
                                <Text style={styles.teacherName}>{row.teacher}</Text>
                                <Text style={styles.assignmentMeta}>Teacher ID {row.teacherId}</Text>
                            </View>
                            <View style={styles.assignmentTags}>
                                <Text style={styles.tag}>{row.className}</Text>
                                <Text style={styles.tag}>Sec {row.section}</Text>
                                <Text style={styles.tag}>{row.subject}</Text>
                            </View>
                        </View>
                    ))}
                    {filteredAssignments.length > 30 ? <Text style={styles.note}>Showing first 30 rows. Use filters to narrow the list.</Text> : null}
                    {!filteredAssignments.length ? <Text style={styles.emptyText}>No assignment rows match the selected filters.</Text> : null}
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/generate-timetable' as any, params: { role, sourceRole } })} activeOpacity={0.9}>
                    <Text style={styles.primaryText}>Open Generate Timetable</Text>
                </TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}

function FilterGroup({ title, options, value, onChange, prefix = '' }: { title: string; options: string[]; value: string; onChange: (value: string) => void; prefix?: string }) {
    return (
        <View style={styles.filterGroup}>
            <Text style={styles.filterTitle}>{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <FilterChip label="All" active={!value} onPress={() => onChange('')} />
                {options.map(option => (
                    <FilterChip key={option} label={`${prefix}${option}`} active={value === option} onPress={() => onChange(option)} />
                ))}
            </ScrollView>
        </View>
    );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.85}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

function Kpi({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.kpi}>
            <Text style={styles.kpiValue}>{value}</Text>
            <Text style={styles.kpiLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 34 },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.medium },
    cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' },
    cardTitleWrap: { flex: 1 },
    cardTitle: { color: colors.primaryNavy, fontSize: 14, fontWeight: '900', marginBottom: 6 },
    helper: { color: colors.slateText, fontWeight: '700', fontSize: 11, lineHeight: 16, marginBottom: 8 },
    tenantBadge: { color: colors.deepGold, fontWeight: '900', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.softCream, overflow: 'hidden' },
    input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 13, padding: 10, color: colors.darkText, fontWeight: '700', fontSize: 12, marginBottom: 8 },
    filterGroup: { marginTop: 5 },
    filterTitle: { color: colors.deepGold, fontWeight: '900', fontSize: 11, marginBottom: 6 },
    chipRow: { gap: 7, paddingRight: 4, paddingBottom: 2 },
    chip: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: colors.cardCream, borderWidth: 1, borderColor: colors.cardGoldBorder },
    chipActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy },
    chipText: { color: colors.deepGold, fontWeight: '900', fontSize: 10 },
    chipTextActive: { color: colors.white },
    clearButton: { alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 999, backgroundColor: colors.primaryNavy, marginTop: 10 },
    clearText: { color: colors.white, fontSize: 11, fontWeight: '900' },
    kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
    kpi: { width: '23%', minWidth: 70, flexGrow: 1, backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.small },
    kpiValue: { color: colors.primaryNavy, fontSize: 18, fontWeight: '900' },
    kpiLabel: { color: colors.slateText, fontSize: 10, fontWeight: '800', marginTop: 2 },
    assignmentRow: { backgroundColor: colors.white, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: colors.divider, marginBottom: 8 },
    assignmentMain: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
    teacherName: { flex: 1, color: colors.primaryNavy, fontSize: 12, fontWeight: '900' },
    assignmentMeta: { color: colors.deepGold, fontSize: 10, fontWeight: '900' },
    assignmentTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: { color: colors.slateText, fontSize: 10, fontWeight: '800', backgroundColor: colors.softCream, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
    note: { color: colors.mutedText, fontWeight: '700', fontSize: 10, lineHeight: 15, marginTop: 4 },
    emptyText: { color: colors.slateText, fontSize: 12, fontWeight: '800', paddingVertical: 10 },
    primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 8, ...shadows.medium },
    primaryText: { color: colors.white, fontWeight: '900', fontSize: 12 },
});
