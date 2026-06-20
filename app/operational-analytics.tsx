import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_BASE_URL } from '../src/services/api';

const background = require('../assets/branding/splash-gold.png');
const SCHOOL_ID = 'TST2';

type Key = 'classes' | 'sections' | 'students' | 'teachers' | 'months' | 'coverage';
type Option = { id: string; label: string; helper?: string; className?: string; section?: string };
type Metric = { label: string; value: string; helper: string; a?: string; b?: string };

const cards: { key: Key; title: string; subtitle: string }[] = [
  { key: 'classes', title: 'Compare Classes', subtitle: 'Class attendance, risk, marks and coverage.' },
  { key: 'sections', title: 'Compare Sections', subtitle: 'Section attendance, marks, risk and coverage.' },
  { key: 'students', title: 'Compare Students', subtitle: 'Student attendance, academics and risk.' },
  { key: 'teachers', title: 'Compare Teachers', subtitle: 'Teacher workload, leave and submissions.' },
  { key: 'months', title: 'Compare Months', subtitle: 'Month-over-month progress.' },
  { key: 'coverage', title: 'Compare Coverage', subtitle: 'Timetable allocation readiness.' },
];

const copy: Record<Key, { title: string; a: string; b: string }> = {
  classes: { title: 'Class Comparison Workspace', a: 'Select Class A', b: 'Select Class B' },
  sections: { title: 'Section Comparison Workspace', a: 'Select Section A', b: 'Select Section B' },
  students: { title: 'Student Comparison Workspace', a: 'Select Student A', b: 'Select Student B' },
  teachers: { title: 'Teacher Comparison Workspace', a: 'Select Teacher A', b: 'Select Teacher B' },
  months: { title: 'Month Comparison Workspace', a: 'Select Month A', b: 'Select Month B' },
  coverage: { title: 'Coverage Comparison Workspace', a: 'Select Coverage A', b: 'Select Coverage B' },
};

async function getData<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { 'X-School-Id': SCHOOL_ID } });
  const json = await res.json();
  return (json?.data ?? json) as T;
}

function studentOption(s: any): Option {
  const code = s.admissionNumber || s.rollNumber || s.username || `ST${s.studentId ?? s.id ?? ''}`;
  const className = s.className || s.class_name || '';
  const section = s.section || '';
  const name = s.studentName || s.name || 'Student';
  return {
    id: String(s.studentId ?? s.id ?? code),
    label: `${code} - ${name}${className ? ` - ${className}` : ''}${section ? ` - ${section}` : ''}`,
    helper: `${className} ${section}`.trim(),
    className,
    section,
  };
}

function teacherOption(t: any): Option {
  const rawId = t.teacherCode || t.username || (t.teacherId ? `T${String(t.teacherId).padStart(3, '0')}` : 'Teacher');
  const name = t.teacherName || t.name || t.fullName || 'Teacher';
  return { id: String(t.teacherId ?? t.id ?? rawId), label: `${rawId} - ${name}`, helper: 'Active teacher' };
}

export default function OperationalAnalyticsScreen() {
  const [active, setActive] = useState<Key>('classes');
  const [options, setOptions] = useState<Record<Key, Option[]>>({ classes: [], sections: [], students: [], teachers: [], months: [], coverage: [] });
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [search, setSearch] = useState<Record<string, string>>({});
  const [openSelector, setOpenSelector] = useState<string | null>(null);
  const [detail, setDetail] = useState<Metric | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [classes, sections, students, teachers, months] = await Promise.all([
          getData<string[]>(`/api/operational-lookups/classes?schoolId=${SCHOOL_ID}`),
          getData<string[]>(`/api/operational-lookups/sections?schoolId=${SCHOOL_ID}`),
          getData<any[]>(`/api/operational-lookups/students/search?schoolId=${SCHOOL_ID}&query=`),
          getData<any[]>(`/api/operational-lookups/teachers/search?schoolId=${SCHOOL_ID}&query=`),
          getData<string[]>(`/api/operational-lookups/months?schoolId=${SCHOOL_ID}`).catch(() => ['2026-05', '2026-04', '2026-03']),
        ]);
        if (!alive) return;
        setOptions({
          classes: classes.map((c) => ({ id: c, label: c })),
          sections: sections.map((s) => {
            const [className, section] = String(s).split(' - ').map((v) => v.trim());
            return { id: s, label: s, className, section };
          }),
          students: students.map(studentOption),
          teachers: teachers.map(teacherOption),
          months: months.map((m) => ({ id: m, label: m })),
          coverage: [
            { id: 'active', label: 'Active Published Timetable', helper: '280 allocations' },
            { id: 'current', label: 'Current Timetable Readiness', helper: '100% readiness' },
          ],
        });
      } catch (e) {
        console.log('Operational analytics lookup load failed', e);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

  const a = selected[`${active}-a`] || '';
  const b = selected[`${active}-b`] || '';
  const sectionClass = selected['sections-class'] || '';
  const baseOptions = active === 'sections' && sectionClass
    ? options.sections.filter((o) => o.className === sectionClass)
    : options[active];
  const optionsForA = baseOptions.filter((o) => o.id !== b);
  const optionsForB = baseOptions.filter((o) => o.id !== a);
  const aOption = baseOptions.find((o) => o.id === a);
  const bOption = baseOptions.find((o) => o.id === b);
  const ready = Boolean(a && b && a !== b && (active !== 'sections' || sectionClass));
  const metrics = useMemo(() => buildMetrics(active, aOption, bOption), [active, aOption, bOption]);

  const resetActive = (key: Key) => {
    setActive(key);
    setOpenSelector(null);
    setDetail(null);
  };

  return (
    <ImageBackground source={background} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <Text style={styles.iconText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerEyebrow}>OPERATIONAL ANALYTICS</Text>
              <Text style={styles.headerTitle}>Operational Analytics</Text>
              <Text style={styles.headerSubtitle}>Search, compare and act on school data.</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/admin-dashboard')}>
              <Text style={styles.homeText}>⌂</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>ANALYTICS HUB</Text>
            <Text style={styles.heroTitle}>Tenant-driven comparison workspace.</Text>
            <Text style={styles.heroBody}>Executive Summary is read-only. Comparison workspaces use real tenant data.</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sectionEyebrow}>EXECUTIVE SUMMARY</Text>
            <Text style={styles.sectionTitle}>Current operational pulse</Text>
            <View style={styles.metricGrid}>
              {[
                { label: 'Health', value: '55', helper: 'Needs Review' },
                { label: 'Attendance', value: '0%', helper: 'Current day' },
                { label: 'Coverage', value: '100%', helper: 'Ready' },
                { label: 'Risk', value: '0', helper: 'Below threshold' },
                { label: 'Teachers', value: '15', helper: 'Active tenant' },
                { label: 'Students', value: '240', helper: 'Active tenant' },
              ].map((m) => <MetricCard key={m.label} metric={m} dark />)}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>COMPARISON CENTER</Text>
            <Text style={styles.sectionTitle}>School comparison drilldowns</Text>
            <View style={styles.compareGrid}>
              {cards.map((card) => (
                <TouchableOpacity key={card.key} onPress={() => resetActive(card.key)} style={[styles.compareCard, active === card.key && styles.compareCardActive]}>
                  <Text style={styles.compareEyebrow}>COMPARE</Text>
                  <Text style={styles.compareTitle}>{card.title}</Text>
                  <Text style={styles.compareSubtitle}>{card.subtitle}</Text>
                  <Text style={styles.compareAction}>{active === card.key ? 'OPEN' : 'DRILLDOWN'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionEyebrow}>ACTIVE WORKSPACE</Text>
            <Text style={styles.sectionTitle}>{copy[active].title}</Text>
            <Text style={styles.sectionDescription}>
              {active === 'sections' ? 'Select a class first, then compare two sections from that class.' : 'Select two different tenant records before comparison cards appear.'}
            </Text>

            {active === 'sections' ? (
              <CompactDropdown
                selectorKey="sections-class"
                label="Select Class"
                options={options.classes}
                value={sectionClass}
                openSelector={openSelector}
                setOpenSelector={setOpenSelector}
                onSelect={(v) => setSelected((s) => ({ ...s, 'sections-class': v, 'sections-a': '', 'sections-b': '' }))}
              />
            ) : null}

            {active === 'students' || active === 'teachers' ? (
              <>
                <SearchableDropdown
                  selectorKey={`${active}-a`}
                  label={copy[active].a}
                  options={optionsForA}
                  value={a}
                  openSelector={openSelector}
                  setOpenSelector={setOpenSelector}
                  search={search[`${active}-a`] || ''}
                  setSearch={(v) => setSearch((s) => ({ ...s, [`${active}-a`]: v }))}
                  onSelect={(v) => setSelected((s) => ({ ...s, [`${active}-a`]: v, [`${active}-b`]: s[`${active}-b`] === v ? '' : s[`${active}-b`] }))}
                />
                <SearchableDropdown
                  selectorKey={`${active}-b`}
                  label={copy[active].b}
                  options={optionsForB}
                  value={b}
                  openSelector={openSelector}
                  setOpenSelector={setOpenSelector}
                  search={search[`${active}-b`] || ''}
                  setSearch={(v) => setSearch((s) => ({ ...s, [`${active}-b`]: v }))}
                  onSelect={(v) => setSelected((s) => ({ ...s, [`${active}-b`]: v, [`${active}-a`]: s[`${active}-a`] === v ? '' : s[`${active}-a`] }))}
                />
              </>
            ) : (
              <>
                <CompactDropdown
                  selectorKey={`${active}-a`}
                  label={copy[active].a}
                  options={optionsForA}
                  value={a}
                  openSelector={openSelector}
                  setOpenSelector={setOpenSelector}
                  onSelect={(v) => setSelected((s) => ({ ...s, [`${active}-a`]: v, [`${active}-b`]: s[`${active}-b`] === v ? '' : s[`${active}-b`] }))}
                />
                <CompactDropdown
                  selectorKey={`${active}-b`}
                  label={copy[active].b}
                  options={optionsForB}
                  value={b}
                  openSelector={openSelector}
                  setOpenSelector={setOpenSelector}
                  onSelect={(v) => setSelected((s) => ({ ...s, [`${active}-b`]: v, [`${active}-a`]: s[`${active}-a`] === v ? '' : s[`${active}-a`] }))}
                />
              </>
            )}

            {!ready ? (
              <Text style={styles.waitingText}>Select both dropdowns to view actionable comparison cards.</Text>
            ) : (
              <>
                <Text style={styles.readyTitle}>{aOption?.label} vs {bOption?.label}</Text>
                <View style={styles.metricGrid}>
                  {metrics.map((m) => (
                    <TouchableOpacity key={m.label} onPress={() => setDetail(m)} style={styles.metricActionWrap}>
                      <MetricCard metric={m} contained />
                      <Text style={styles.openDetail}>OPEN DETAIL</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        </ScrollView>
        <DetailModal metric={detail} a={aOption} b={bOption} onClose={() => setDetail(null)} />
      </SafeAreaView>
    </ImageBackground>
  );
}

function CompactDropdown({ selectorKey, label, options, value, openSelector, setOpenSelector, onSelect }: { selectorKey: string; label: string; options: Option[]; value: string; openSelector: string | null; setOpenSelector: (k: string | null) => void; onSelect: (v: string) => void }) {
  const selectedLabel = options.find((o) => o.id === value)?.label || `Select (${options.length})`;
  const open = openSelector === selectorKey;
  return (
    <View style={styles.selector}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity style={styles.selectBox} onPress={() => setOpenSelector(open ? null : selectorKey)}>
        <Text style={styles.selectText}>{selectedLabel}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>
      {open ? (
        <ScrollView style={styles.optionList} nestedScrollEnabled>
          {options.map((o) => (
            <TouchableOpacity key={o.id} onPress={() => { onSelect(o.id); setOpenSelector(null); }} style={[styles.optionRow, value === o.id && styles.optionRowActive]}>
              <Text style={styles.optionLabel}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function SearchableDropdown({ selectorKey, label, options, value, openSelector, setOpenSelector, search, setSearch, onSelect }: { selectorKey: string; label: string; options: Option[]; value: string; openSelector: string | null; setOpenSelector: (k: string | null) => void; search: string; setSearch: (v: string) => void; onSelect: (v: string) => void }) {
  const selectedLabel = options.find((o) => o.id === value)?.label;
  const open = openSelector === selectorKey;
  const filtered = options.filter((o) => `${o.label} ${o.helper || ''}`.toLowerCase().includes(search.toLowerCase())).slice(0, 50);
  return (
    <View style={styles.selector}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <TouchableOpacity style={styles.selectBox} onPress={() => setOpenSelector(open ? null : selectorKey)}>
        <TextInput
          value={open ? search : (selectedLabel || search)}
          onFocus={() => setOpenSelector(selectorKey)}
          onChangeText={(v) => { setSearch(v); setOpenSelector(selectorKey); }}
          placeholder={`Search / select (${options.length})`}
          placeholderTextColor="#8b95a7"
          style={styles.searchInput}
        />
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>
      {open ? (
        <ScrollView style={styles.optionList} nestedScrollEnabled>
          {filtered.map((o) => (
            <TouchableOpacity key={o.id} onPress={() => { onSelect(o.id); setSearch(''); setOpenSelector(null); }} style={[styles.optionRow, value === o.id && styles.optionRowActive]}>
              <Text style={styles.optionLabel}>{o.label}</Text>
              {o.helper ? <Text style={styles.optionHelper}>{o.helper}</Text> : null}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function MetricCard({ metric, dark = false, contained = false }: { metric: Metric; dark?: boolean; contained?: boolean }) {
  return (
    <View style={[styles.metricCard, contained && styles.metricCardContained, dark && styles.darkMetricCard]}>
      <Text style={[styles.metricLabel, dark && styles.darkMetricLabel]}>{metric.label}</Text>
      <Text style={[styles.metricValue, dark && styles.darkMetricValue]}>{metric.value}</Text>
      <Text style={[styles.metricHelper, dark && styles.darkMetricHelper]}>{metric.helper}</Text>
    </View>
  );
}

function buildMetrics(key: Key, a?: Option, b?: Option): Metric[] {
  const av = a?.label || 'A';
  const bv = b?.label || 'B';
  if (key === 'months') {
    return [
      { label: 'Attendance', value: '0% vs 0%', helper: 'Month trend', a: av, b: bv },
      { label: 'Risk', value: '0 vs 0', helper: 'Risk trend', a: av, b: bv },
      { label: 'Activities', value: '3 vs 0', helper: 'Published activities trend', a: av, b: bv },
      { label: 'Health', value: '55 vs 55', helper: 'Executive health trend', a: av, b: bv },
    ];
  }
  if (key === 'teachers') {
    return [
      { label: 'Workload', value: '0 vs 0', helper: 'Overload comparison', a: av, b: bv },
      { label: 'Leave Load', value: '0 vs 0', helper: 'Leave pressure', a: av, b: bv },
      { label: 'Submissions', value: '0 vs 0', helper: 'Attendance submissions', a: av, b: bv },
      { label: 'Recommendation', value: 'Review', helper: 'Workload balancing notes', a: av, b: bv },
    ];
  }
  if (key === 'coverage') {
    return [
      { label: 'Coverage', value: '100% vs 100%', helper: 'Readiness', a: av, b: bv },
      { label: 'Allocations', value: '280 vs 280', helper: 'Live periods', a: av, b: bv },
      { label: 'Classes', value: '4/8 vs 4/8', helper: 'Readiness comparison', a: av, b: bv },
      { label: 'Recommendation', value: 'Ready', helper: 'Timetable notes', a: av, b: bv },
    ];
  }
  return [
    { label: 'Attendance', value: '0% vs 0%', helper: 'Current day signal', a: av, b: bv },
    { label: 'Risk Students', value: '0 vs 0', helper: 'Risk signals', a: av, b: bv },
    { label: 'Coverage', value: '100% vs 100%', helper: 'Timetable readiness', a: av, b: bv },
    { label: 'Recommendation', value: 'Review', helper: 'Intervention notes', a: av, b: bv },
  ];
}

function DetailModal({ metric, a, b, onClose }: { metric: Metric | null; a?: Option; b?: Option; onClose: () => void }) {
  if (!metric) return null;
  const parts = metric.value.split(' vs ');
  const rows = [
    ['Metric', parts[0] || metric.value, parts[1] || metric.value],
    ['Selection', a?.label || '-', b?.label || '-'],
    ['Action', metric.helper, 'Compare and review'],
  ];
  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEyebrow}>COMPARISON DETAIL</Text>
          <Text style={styles.modalTitle}>{metric.label} Detail</Text>
          <Text style={styles.modalSubtitle}>{a?.label} vs {b?.label}</Text>
          {rows.map((r) => (
            <View key={r[0]} style={styles.detailRow}>
              <Text style={styles.detailMetric}>{r[0]}</Text>
              <Text style={styles.detailValue}>{r[1]}</Text>
              <Text style={styles.detailValue}>{r[2]}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  iconButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: '#fff8de', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  iconText: { fontSize: 30, color: '#0b315f', fontWeight: '900', lineHeight: 32, marginTop: -2 },
  homeText: { fontSize: 23, color: '#0b315f', fontWeight: '900', lineHeight: 26 },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 4, color: '#8b6508', textAlign: 'center' },
  headerTitle: { fontSize: 24, lineHeight: 28, fontWeight: '900', color: '#082344', textAlign: 'center' },
  headerSubtitle: { fontSize: 13, lineHeight: 17, fontWeight: '800', color: '#415064', textAlign: 'center' },
  heroCard: { backgroundColor: 'rgba(255,252,238,0.94)', borderRadius: 22, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#e6c75f' },
  heroEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 4, color: '#934411' },
  heroTitle: { fontSize: 22, lineHeight: 27, fontWeight: '900', color: '#082344', marginTop: 5 },
  heroBody: { marginTop: 8, fontSize: 13, lineHeight: 18, fontWeight: '800', color: '#667085' },
  summaryCard: { backgroundColor: 'rgba(255,252,238,0.94)', borderRadius: 22, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#e6c75f' },
  card: { backgroundColor: 'rgba(255,252,238,0.94)', borderRadius: 22, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#e6c75f' },
  sectionEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 4, color: '#934411' },
  sectionTitle: { fontSize: 22, lineHeight: 27, fontWeight: '900', color: '#082344', marginTop: 5 },
  sectionDescription: { fontSize: 13, lineHeight: 18, fontWeight: '800', color: '#667085', marginTop: 5 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  metricActionWrap: { width: '48%' },
  metricCard: { width: '48%', minHeight: 94, borderWidth: 1.5, borderColor: '#eed77a', borderRadius: 18, padding: 11, backgroundColor: 'rgba(255,252,238,0.75)', justifyContent: 'space-between' },
  metricCardContained: { width: '100%' },
  darkMetricCard: { backgroundColor: '#061321', borderColor: '#b99b47' },
  metricLabel: { fontSize: 12, fontWeight: '900', color: '#667085' },
  darkMetricLabel: { color: 'rgba(255,248,222,0.72)' },
  metricValue: { fontSize: 23, fontWeight: '900', color: '#0b315f', marginTop: 6 },
  darkMetricValue: { color: '#fff8de' },
  metricHelper: { fontSize: 12, fontWeight: '800', color: '#934411', marginTop: 5, lineHeight: 15 },
  darkMetricHelper: { color: '#d5a45f' },
  compareGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  compareCard: { width: '48%', minHeight: 132, borderRadius: 18, borderWidth: 1.5, borderColor: '#d7b94a', backgroundColor: '#061321', padding: 11 },
  compareCardActive: { backgroundColor: '#08aeca' },
  compareEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 3, color: '#e6c75f' },
  compareTitle: { fontSize: 17, lineHeight: 21, fontWeight: '900', color: '#fff8de', marginTop: 8 },
  compareSubtitle: { fontSize: 11, lineHeight: 15, fontWeight: '800', color: '#d1d5db', marginTop: 6 },
  compareAction: { fontSize: 10, fontWeight: '900', color: '#e6c75f', marginTop: 'auto', paddingTop: 8 },
  selector: { borderWidth: 1.5, borderColor: '#e6c75f', borderRadius: 18, padding: 11, marginTop: 12, backgroundColor: 'rgba(255,252,238,0.58)' },
  selectorLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 3, color: '#934411' },
  selectBox: { marginTop: 8, minHeight: 42, borderWidth: 1, borderColor: '#d7b94a', borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  selectText: { flex: 1, fontSize: 13, fontWeight: '800', color: '#082344' },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '800', color: '#082344', paddingVertical: 6 },
  chevron: { fontSize: 18, fontWeight: '900', color: '#934411', marginLeft: 6 },
  optionList: { maxHeight: 162, marginTop: 7, borderWidth: 1, borderColor: '#eadcaa', borderRadius: 13, backgroundColor: '#fffdf4' },
  optionRow: { paddingVertical: 9, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eadcaa' },
  optionRowActive: { backgroundColor: '#dff6fb' },
  optionLabel: { fontSize: 13, fontWeight: '900', color: '#082344' },
  optionHelper: { fontSize: 10, fontWeight: '800', color: '#667085', marginTop: 1 },
  waitingText: { fontSize: 13, fontWeight: '900', color: '#667085', marginTop: 12, lineHeight: 18 },
  readyTitle: { fontSize: 18, fontWeight: '900', color: '#082344', marginTop: 14, lineHeight: 22 },
  openDetail: { fontSize: 10, fontWeight: '900', color: '#934411', marginTop: 5, marginLeft: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#0d1724', borderRadius: 20, borderWidth: 1, borderColor: '#d4af37', padding: 15, width: '100%' },
  modalEyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 3, color: '#d4af37' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#fff8de', marginTop: 7 },
  modalSubtitle: { fontSize: 12, fontWeight: '800', color: '#d1d5db', marginTop: 5 },
  detailRow: { flexDirection: 'row', gap: 7, borderTopWidth: 1, borderTopColor: '#2b3848', paddingVertical: 9 },
  detailMetric: { flex: 1, fontWeight: '900', color: '#d4af37', fontSize: 12 },
  detailValue: { flex: 1, fontWeight: '800', color: '#fff8de', fontSize: 12 },
  closeButton: { alignSelf: 'flex-end', backgroundColor: '#08aeca', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 16, marginTop: 16 },
  closeText: { fontWeight: '900', color: '#fff', fontSize: 12 },
});
