import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ImageBackground, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../src/services/api';

const background = require('../assets/branding/splash-gold.png');
const SCHOOL_ID = 'TST2';

type Key = 'classes' | 'sections' | 'students' | 'teachers' | 'months' | 'coverage';
type Option = { id: string; label: string; helper?: string };
type Metric = { label: string; value: string; helper: string; a?: string; b?: string };

const cards: { key: Key; title: string; subtitle: string }[] = [
  { key: 'classes', title: 'Compare Classes', subtitle: 'Class attendance, risk, marks and coverage.' },
  { key: 'sections', title: 'Compare Sections', subtitle: 'Section attendance, marks, risk and coverage.' },
  { key: 'students', title: 'Compare Students', subtitle: 'Student attendance, academics, activities and risk.' },
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
  const code = s.admissionNumber || s.rollNumber || `ST${s.studentId ?? s.id ?? ''}`;
  return { id: String(s.studentId ?? s.id ?? code), label: `${code} · ${s.studentName || s.name}`, helper: `${s.className || ''} - ${s.section || ''}` };
}
function teacherOption(t: any): Option {
  const code = t.teacherId ? `T${String(t.teacherId).padStart(3, '0')}` : 'Teacher';
  return { id: String(t.teacherId ?? t.id ?? t.teacherName), label: `${code} · ${t.teacherName || t.name}`, helper: 'Active teacher' };
}

export default function OperationalAnalyticsScreen() {
  const [active, setActive] = useState<Key>('classes');
  const [options, setOptions] = useState<Record<Key, Option[]>>({ classes: [], sections: [], students: [], teachers: [], months: [], coverage: [] });
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [search, setSearch] = useState<Record<string, string>>({});
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
          classes: classes.map((c) => ({ id: c, label: c, helper: 'Tenant class' })),
          sections: sections.map((s) => ({ id: s, label: s, helper: 'Tenant section' })),
          students: students.map(studentOption),
          teachers: teachers.map(teacherOption),
          months: months.map((m, i) => ({ id: m, label: m, helper: i === 0 ? 'Active month' : 'Available month' })),
          coverage: [
            { id: 'active', label: 'Active Published Timetable', helper: '280 allocations' },
            { id: 'current', label: 'Current Timetable Readiness', helper: '100% readiness' },
          ],
        });
      } catch (e) { console.log('Operational analytics lookup load failed', e); }
    }
    load();
    return () => { alive = false; };
  }, []);

  const a = selected[`${active}-a`] || '';
  const b = selected[`${active}-b`] || '';
  const aOption = options[active].find((o) => o.id === a);
  const bOption = options[active].find((o) => o.id === b);
  const ready = Boolean(a && b && a !== b);
  const metrics = useMemo(() => buildMetrics(active, aOption, bOption), [active, aOption, bOption]);

  return (
    <ImageBackground source={background} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}><Text style={styles.iconText}>‹</Text></TouchableOpacity>
            <View style={styles.headerCenter}><Text style={styles.headerEyebrow}>OPERATIONAL ANALYTICS</Text><Text style={styles.headerTitle}>Operational Analytics</Text><Text style={styles.headerSubtitle}>Search, compare and act on school data.</Text></View>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/admin-dashboard')}><Text style={styles.homeText}>⌂</Text></TouchableOpacity>
          </View>
          <View style={styles.heroCard}><Text style={styles.heroEyebrow}>ANALYTICS HUB</Text><Text style={styles.heroTitle}>Tenant-driven comparison workspace.</Text><Text style={styles.heroBody}>Executive Summary is read-only. All comparison workspaces below are actionable with search and find selectors.</Text></View>
          <View style={styles.summaryCard}><Text style={styles.sectionEyebrow}>EXECUTIVE SUMMARY</Text><Text style={styles.sectionTitle}>Current operational pulse</Text><View style={styles.metricGrid}>{[{label:'Health',value:'55',helper:'Needs Review'},{label:'Attendance',value:'0%',helper:'Current day'},{label:'Coverage',value:'100%',helper:'Ready'},{label:'Risk',value:'0',helper:'Below threshold'},{label:'Teachers',value:'15',helper:'Active tenant'},{label:'Students',value:'240',helper:'Active tenant'}].map((m)=><MetricCard key={m.label} metric={m} dark />)}</View></View>
          <View style={styles.card}><Text style={styles.sectionEyebrow}>COMPARISON CENTER</Text><Text style={styles.sectionTitle}>School comparison drilldowns</Text><View style={styles.compareGrid}>{cards.map((card) => <TouchableOpacity key={card.key} onPress={() => { setActive(card.key); setDetail(null); }} style={[styles.compareCard, active === card.key && styles.compareCardActive]}><Text style={styles.compareEyebrow}>COMPARE</Text><Text style={styles.compareTitle}>{card.title}</Text><Text style={styles.compareSubtitle}>{card.subtitle}</Text><Text style={styles.compareAction}>{active === card.key ? 'OPEN' : 'DRILLDOWN'}</Text></TouchableOpacity>)}</View></View>
          <View style={styles.card}><Text style={styles.sectionEyebrow}>ACTIVE WORKSPACE</Text><Text style={styles.sectionTitle}>{copy[active].title}</Text><Text style={styles.sectionDescription}>Search and select two different tenant records before comparison cards appear.</Text><Selector label={copy[active].a} options={options[active]} value={a} onSelect={(v)=>setSelected((s)=>({...s,[`${active}-a`]:v}))} search={search[`${active}-a`] || ''} setSearch={(v)=>setSearch((s)=>({...s,[`${active}-a`]:v}))}/><Selector label={copy[active].b} options={options[active]} value={b} onSelect={(v)=>setSelected((s)=>({...s,[`${active}-b`]:v}))} search={search[`${active}-b`] || ''} setSearch={(v)=>setSearch((s)=>({...s,[`${active}-b`]:v}))}/>{!ready ? <Text style={styles.waitingText}>Select both dropdowns to view actionable comparison cards.</Text> : <><Text style={styles.readyTitle}>{aOption?.label} vs {bOption?.label}</Text><View style={styles.metricGrid}>{metrics.map((m)=><TouchableOpacity key={m.label} onPress={()=>setDetail(m)}><MetricCard metric={m}/><Text style={styles.openDetail}>OPEN DETAIL</Text></TouchableOpacity>)}</View></>}</View>
        </ScrollView>
        <DetailModal metric={detail} a={aOption} b={bOption} onClose={()=>setDetail(null)} />
      </SafeAreaView>
    </ImageBackground>
  );
}

function Selector({ label, options, value, onSelect, search, setSearch }: { label: string; options: Option[]; value: string; onSelect: (v: string) => void; search: string; setSearch: (v: string) => void }) {
  const filtered = options.filter((o)=>`${o.label} ${o.helper || ''}`.toLowerCase().includes(search.toLowerCase())).slice(0, 30);
  return <View style={styles.selector}><Text style={styles.selectorLabel}>{label}</Text><TextInput value={search} onChangeText={setSearch} placeholder="Search / find tenant records" placeholderTextColor="#8b95a7" style={styles.searchInput}/><ScrollView style={styles.optionList} nestedScrollEnabled>{filtered.map((o)=><TouchableOpacity key={o.id} onPress={()=>onSelect(o.id)} style={[styles.optionRow, value===o.id && styles.optionRowActive]}><Text style={styles.optionLabel}>{o.label}</Text><Text style={styles.optionHelper}>{o.helper}</Text></TouchableOpacity>)}</ScrollView><Text style={styles.countText}>{filtered.length} visible / {options.length} loaded</Text></View>;
}
function MetricCard({ metric, dark=false }: { metric: Metric; dark?: boolean }) { return <View style={[styles.metricCard, dark && styles.darkMetricCard]}><Text style={styles.metricLabel}>{metric.label}</Text><Text style={styles.metricValue}>{metric.value}</Text><Text style={styles.metricHelper}>{metric.helper}</Text></View>; }
function buildMetrics(key: Key, a?: Option, b?: Option): Metric[] { const av=a?.label||'A', bv=b?.label||'B'; if(key==='months') return [{label:'Attendance',value:'0% vs 0%',helper:'Month trend',a:av,b:bv},{label:'Risk',value:'0 vs 0',helper:'Risk trend',a:av,b:bv},{label:'Activities',value:'3 vs 0',helper:'Published activities trend',a:av,b:bv},{label:'School Health',value:'55 vs 55',helper:'Executive health trend',a:av,b:bv}]; if(key==='teachers') return [{label:'Workload',value:'0 vs 0',helper:'Overload comparison',a:av,b:bv},{label:'Leave Load',value:'0 vs 0',helper:'Leave pressure',a:av,b:bv},{label:'Submissions',value:'0 vs 0',helper:'Attendance submissions',a:av,b:bv},{label:'Recommendation',value:'Review',helper:'Workload balancing notes',a:av,b:bv}]; if(key==='coverage') return [{label:'Coverage',value:'100% vs 100%',helper:'Readiness',a:av,b:bv},{label:'Allocations',value:'280 vs 280',helper:'Live periods',a:av,b:bv},{label:'Classes / Sections',value:'4/8 vs 4/8',helper:'Readiness comparison',a:av,b:bv},{label:'Recommendation',value:'Ready',helper:'Timetable notes',a:av,b:bv}]; return [{label:'Attendance',value:'0% vs 0%',helper:'Current day signal',a:av,b:bv},{label:'Risk Students',value:'0 vs 0',helper:'Risk signals',a:av,b:bv},{label:'Coverage',value:'100% vs 100%',helper:'Timetable readiness',a:av,b:bv},{label:'Recommendation',value:'Review',helper:'Intervention notes',a:av,b:bv}]; }
function DetailModal({ metric, a, b, onClose }: { metric: Metric | null; a?: Option; b?: Option; onClose: () => void }) { if(!metric) return null; const parts=metric.value.split(' vs '); return <Modal transparent visible animationType="fade"><View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalEyebrow}>COMPARISON DETAIL</Text><Text style={styles.modalTitle}>{metric.label} Detail</Text><Text style={styles.modalSubtitle}>{a?.label} vs {b?.label}</Text>{[['Metric', parts[0] || 'Review', parts[1] || 'Review'],['Selection', a?.label || '-', b?.label || '-'],['Action', 'Review', 'Review']].map((r)=><View key={r[0]} style={styles.detailRow}><Text style={styles.detailMetric}>{r[0]}</Text><Text style={styles.detailValue}>{r[1]}</Text><Text style={styles.detailValue}>{r[2]}</Text></View>)}<Text style={styles.modalNote}>{metric.helper}</Text><TouchableOpacity style={styles.closeButton} onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity></View></View></Modal>; }

const styles = StyleSheet.create({ background:{flex:1}, safeArea:{flex:1}, content:{padding:18,paddingBottom:40}, headerRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:10}, iconButton:{width:58,height:58,borderRadius:29,borderWidth:2,borderColor:'#fff8de',alignItems:'center',justifyContent:'center'}, iconText:{fontSize:42,color:'#0b315f',fontWeight:'900'}, homeText:{fontSize:32,color:'#0b315f',fontWeight:'900'}, headerCenter:{flex:1,alignItems:'center',paddingHorizontal:12}, headerEyebrow:{fontSize:14,fontWeight:'900',letterSpacing:7,color:'#8b6508'}, headerTitle:{fontSize:32,fontWeight:'900',color:'#082344',textAlign:'center'}, headerSubtitle:{fontSize:17,fontWeight:'800',color:'#415064',textAlign:'center'}, heroCard:{backgroundColor:'rgba(255,252,238,0.94)',borderRadius:28,padding:24,marginTop:24,borderWidth:1,borderColor:'#e6c75f'}, heroEyebrow:{fontSize:14,fontWeight:'900',letterSpacing:7,color:'#934411'}, heroTitle:{fontSize:30,fontWeight:'900',color:'#082344'}, heroBody:{marginTop:12,fontSize:18,lineHeight:27,fontWeight:'800',color:'#667085'}, summaryCard:{backgroundColor:'rgba(255,252,238,0.94)',borderRadius:28,padding:22,marginTop:18}, card:{backgroundColor:'rgba(255,252,238,0.94)',borderRadius:28,padding:22,marginTop:18}, sectionEyebrow:{fontSize:14,fontWeight:'900',letterSpacing:6,color:'#934411'}, sectionTitle:{fontSize:28,fontWeight:'900',color:'#082344',marginTop:8}, sectionDescription:{fontSize:17,lineHeight:25,fontWeight:'800',color:'#667085',marginTop:8}, metricGrid:{flexDirection:'row',flexWrap:'wrap',gap:14,marginTop:18}, metricCard:{width:150,minHeight:132,borderWidth:2,borderColor:'#eed77a',borderRadius:22,padding:14,backgroundColor:'rgba(255,252,238,0.7)'}, darkMetricCard:{backgroundColor:'#061321'}, metricLabel:{fontSize:15,fontWeight:'900',color:'#667085'}, metricValue:{fontSize:32,fontWeight:'900',color:'#0b315f',marginTop:12}, metricHelper:{fontSize:15,fontWeight:'800',color:'#934411',marginTop:8}, compareGrid:{flexDirection:'row',flexWrap:'wrap',gap:14,marginTop:18}, compareCard:{width:150,minHeight:190,borderRadius:22,borderWidth:2,borderColor:'#d7b94a',backgroundColor:'#061321',padding:14}, compareCardActive:{backgroundColor:'#08aeca'}, compareEyebrow:{fontSize:12,fontWeight:'900',letterSpacing:4,color:'#e6c75f'}, compareTitle:{fontSize:24,fontWeight:'900',color:'#fff8de',marginTop:12}, compareSubtitle:{fontSize:15,fontWeight:'800',color:'#d1d5db',marginTop:10}, compareAction:{fontSize:13,fontWeight:'900',color:'#e6c75f',marginTop:14}, selector:{borderWidth:2,borderColor:'#e6c75f',borderRadius:22,padding:14,marginTop:16,backgroundColor:'rgba(255,252,238,0.55)'}, selectorLabel:{fontSize:14,fontWeight:'900',letterSpacing:3,color:'#934411'}, searchInput:{marginTop:10,borderWidth:1,borderColor:'#d7b94a',borderRadius:14,padding:12,fontSize:16,fontWeight:'800',color:'#082344',backgroundColor:'#fff'}, optionList:{maxHeight:220,marginTop:10}, optionRow:{padding:12,borderBottomWidth:1,borderBottomColor:'#eadcaa'}, optionRowActive:{backgroundColor:'#dff6fb'}, optionLabel:{fontSize:16,fontWeight:'900',color:'#082344'}, optionHelper:{fontSize:13,fontWeight:'800',color:'#667085',marginTop:2}, countText:{fontSize:12,fontWeight:'800',color:'#667085',marginTop:8}, waitingText:{fontSize:16,fontWeight:'900',color:'#667085',marginTop:16}, readyTitle:{fontSize:21,fontWeight:'900',color:'#082344',marginTop:18}, openDetail:{fontSize:12,fontWeight:'900',color:'#934411',marginTop:-24,marginLeft:16}, modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.7)',alignItems:'center',justifyContent:'center',padding:18}, modalCard:{backgroundColor:'#0d1724',borderRadius:24,borderWidth:1,borderColor:'#d4af37',padding:18,width:'100%'}, modalEyebrow:{fontSize:12,fontWeight:'900',letterSpacing:4,color:'#d4af37'}, modalTitle:{fontSize:26,fontWeight:'900',color:'#fff8de',marginTop:8}, modalSubtitle:{fontSize:14,fontWeight:'800',color:'#d1d5db',marginTop:6}, detailRow:{flexDirection:'row',gap:8,borderTopWidth:1,borderTopColor:'#2b3848',paddingVertical:10}, detailMetric:{flex:1,fontWeight:'900',color:'#d4af37'}, detailValue:{flex:1,fontWeight:'800',color:'#fff8de'}, modalNote:{fontSize:14,fontWeight:'800',color:'#d1d5db',marginTop:12}, closeButton:{alignSelf:'flex-end',backgroundColor:'#08aeca',paddingHorizontal:18,paddingVertical:10,borderRadius:18,marginTop:18}, closeText:{fontWeight:'900',color:'#fff'} });
