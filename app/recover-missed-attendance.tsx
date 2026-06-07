import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_BASE_URL } from '../src/services/api';
import { getSession } from '../src/services/sessionService';
import { colors, shadows, spacing } from '../src/theme';

type RecoveryStatus = { status: string; label: string; message: string; latestRecoveryBatchId?: string; submittedRows: number; auditTrail: string[] };
function label(value?: string) { return String(value || 'Pending').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); }

export default function RecoverMissedAttendanceScreen() {
  const params = useLocalSearchParams<{ role?: string; sourceRole?: string }>();
  const session = getSession();
  const schoolId = String(session?.schoolId || 'BRK1').toUpperCase();
  const sourceRole = String(params.sourceRole || params.role || session?.role || 'admin').toLowerCase();
  const roleLabel = sourceRole === 'principal' ? 'Principal' : 'Admin';
  const homeRoute = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
  const [status, setStatus] = useState<RecoveryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', 'X-School-Id': schoolId, ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) }), [schoolId, session?.token]);

  const loadStatus = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/attendance/recovery/status?schoolId=${schoolId}`, { headers });
      if (!res.ok) throw new Error('Unable to load recovery status.');
      const payload = await res.json();
      setStatus(payload?.data ?? payload);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load recovery status.'); }
    finally { setLoading(false); }
  }, [headers, schoolId]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  return (
    <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStatus} />}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.circleButton} onPress={() => router.back()} activeOpacity={0.85}><Text style={styles.backText}>‹</Text></TouchableOpacity>
          <View style={styles.headerTextWrap}><Text style={styles.eyebrow}>ATTENDANCE RECOVERY</Text><Text style={styles.title}>Recover Missed Attendance</Text></View>
          <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homeRoute as any)} activeOpacity={0.85}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Web ERP Recovery Workflow</Text>
          <Text style={styles.heroText}>Download template, upload missed attendance file, validate, preview, submit recovery, and update attendance history from Web ERP.</Text>
          <View style={styles.statusPill}><Text style={styles.statusText}>Mobile is read-only. Excel upload is not available on mobile.</Text></View>
        </View>

        {loading && !status ? <View style={styles.card}><ActivityIndicator /><Text style={styles.bodyText}>Loading recovery status...</Text></View> : null}
        {error ? <View style={styles.alert}><Text style={styles.alertText}>{error}</Text></View> : null}

        {status ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>CURRENT STATUS</Text>
            <Text style={styles.cardTitle}>{status.label || label(status.status)}</Text>
            <Text style={styles.bodyText}>{(status.message || '').replace('before submit.', 'before submission.')}</Text>
            <View style={styles.summaryRow}>
              <View style={styles.metricCard}><Text style={styles.metricValue}>{status.submittedRows || 0}</Text><Text style={styles.metricLabel}>Recovered Records</Text></View>
              <View style={styles.metricCard}><Text style={styles.metricValue}>{status.auditTrail?.length || 0}</Text><Text style={styles.metricLabel}>Audit Events</Text></View>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>REQUIRED COLUMNS</Text>
          <Text style={styles.requiredText}>Student ID · Class · Section · Attendance Date · Status · Reason</Text>
          <Text style={styles.bodyText}>Status must be PRESENT, ABSENT, or LATE. Recovery is allowed only within the configured recovery window.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>WEB ERP FLOW</Text>
          {['Download Template', 'Upload Missed Attendance File', 'Validate', 'Preview', 'Submit Recovery', 'Audit Trail', 'Attendance History Update'].map((item, index) => <Step key={item} number={String(index + 1)} title={item} />)}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/workspace-health' as any, params: { role: roleLabel.toUpperCase(), sourceRole } })} activeOpacity={0.88}><Text style={styles.primaryText}>Open Workspace Health</Text></TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}
function Step({ number, title }: { number: string; title: string }) { return <View style={styles.stepRow}><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{number}</Text></View><Text style={styles.stepTitle}>{title}</Text></View>; }
const styles = StyleSheet.create({
  bg: { flex: 1 }, safeArea: { flex: 1 }, container: { paddingHorizontal: spacing.lg, paddingTop: 18, paddingBottom: 42 }, headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 10 },
  circleButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }, backText: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 }, homeIcon: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900' }, headerTextWrap: { flex: 1, alignItems: 'center' }, eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 10, letterSpacing: 1.8, textAlign: 'center' }, title: { color: colors.primaryNavy, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  heroCard: { backgroundColor: 'rgba(13, 33, 57, 0.95)', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.46)', ...shadows.medium }, heroTitle: { color: colors.white, fontSize: 21, fontWeight: '900', lineHeight: 25, marginBottom: 10 }, heroText: { color: 'rgba(255,255,255,0.84)', fontWeight: '800', lineHeight: 20 }, statusPill: { marginTop: 14, borderRadius: 16, padding: 12, backgroundColor: 'rgba(245,190,56,0.14)', borderWidth: 1, borderColor: 'rgba(245,190,56,0.38)' }, statusText: { color: colors.cardCream, fontWeight: '900', lineHeight: 18 },
  card: { paddingTop: 24, backgroundColor: 'rgba(255,253,247,0.97)', borderRadius: 22, padding: 16, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium }, cardLabel: { color: colors.deepGold, fontWeight: '900', fontSize: 10, letterSpacing: 1.3, marginBottom: 4 }, cardTitle: { color: colors.primaryNavy, fontSize: 18, fontWeight: '900', marginBottom: 8 }, requiredText: { color: colors.deepGold, fontSize: 16, fontWeight: '900', marginBottom: 8, lineHeight: 22 }, bodyText: { color: colors.slateText, fontWeight: '800', lineHeight: 20 },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 12 }, metricCard: { flex: 1, borderRadius: 16, padding: 12, backgroundColor: 'rgba(13,33,57,0.06)', borderWidth: 1, borderColor: colors.cardGoldBorder }, metricValue: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900' }, metricLabel: { color: colors.slateText, fontSize: 11, fontWeight: '900' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(212,175,55,0.18)' }, stepBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryNavy, alignItems: 'center', justifyContent: 'center' }, stepBadgeText: { color: colors.white, fontWeight: '900' }, stepTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15 },
  primaryButton: { backgroundColor: colors.primaryNavy, borderRadius: 18, paddingVertical: 15, alignItems: 'center', ...shadows.medium }, primaryText: { color: colors.white, fontWeight: '900', fontSize: 15 }, alert: { backgroundColor: 'rgba(119, 32, 20, 0.88)', borderRadius: 18, padding: spacing.md, marginBottom: spacing.md }, alertText: { color: '#ffe6df', fontWeight: '800' },
});
