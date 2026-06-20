import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import MobileWorkflowScreen from '../components/layout/MobileWorkflowScreen';
import { getSession, normalizeSchoolId } from '../src/services/sessionService';
import { CredentialRole, fetchUserCredentials, UserCredential } from '../src/services/userCredentialsApi';
import { colors, shadows, spacing } from '../src/theme';

export default function UserCredentialsScreen() {
  const params = useLocalSearchParams();
  const session = getSession();
  const sourceRole = String(params.sourceRole || params.role || session?.role || 'ADMIN').toUpperCase();
  const schoolId = normalizeSchoolId(String(params.schoolId || session?.schoolId || 'TST2'));
  const [role, setRole] = useState<CredentialRole>('TEACHER');
  const [credentials, setCredentials] = useState<UserCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canAccess = useMemo(() => sourceRole === 'ADMIN' || sourceRole === 'PRINCIPAL', [sourceRole]);

  const load = useCallback(async (nextRole: CredentialRole = role) => {
    if (!canAccess) {
      setError('Only Admin and Principal can access credential downloads.');
      setCredentials([]);
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const rows = await fetchUserCredentials(nextRole, schoolId);
      setCredentials(rows);
      setMessage(`${rows.length} ${nextRole.toLowerCase()} credential${rows.length === 1 ? '' : 's'} ready. Parents activate separately with OTP.`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.response?.data || err?.message || 'Unable to load credentials.');
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [canAccess, role, schoolId]);

  useEffect(() => {
    load('TEACHER');
  }, [load]);

  const switchRole = (nextRole: CredentialRole) => {
    setRole(nextRole);
    load(nextRole);
  };

  return (
    <MobileWorkflowScreen contentContainerStyle={styles.screenContent}>
      <MobileWorkflowHeader
        title="User Credentials"
        eyebrow="Credential Center"
        subtitle="Teacher and student first-login downloads"
        sourceRole={sourceRole}
        rightAction="refresh"
        onRightPress={() => load(role)}
      />

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Production Login Rule</Text>
        <Text style={styles.heroTitle}>Teacher & Student Credentials</Text>
        <Text style={styles.heroText}>
          Downloaded credentials are only for imported teachers and students. They use a temporary password first, then create a new password during first login.
        </Text>
      </View>

      <View style={styles.ruleGrid}>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleLabel}>Teacher</Text>
          <Text style={styles.ruleBody}>Temporary password + first-login password change.</Text>
        </View>

        <View style={styles.ruleCard}>
          <Text style={styles.ruleLabel}>Student</Text>
          <Text style={styles.ruleBody}>Temporary password + first-login password change.</Text>
        </View>

        <View style={styles.ruleCardWide}>
          <Text style={styles.ruleLabel}>Parent</Text>
          <Text style={styles.ruleBody}>No exported password. Parent activates with Student ID + parent mobile OTP mapping.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.eyebrow}>Downloads</Text>
            <Text style={styles.sectionTitle}>{role === 'TEACHER' ? 'Teacher Credentials' : 'Student Credentials'}</Text>
            <Text style={styles.schoolText}>School: {schoolId}</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, role === 'TEACHER' && styles.tabActive]}
            onPress={() => switchRole('TEACHER')}
            disabled={loading}
          >
            <Text style={[styles.tabText, role === 'TEACHER' && styles.tabTextActive]}>Teacher</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, role === 'STUDENT' && styles.tabActive]}
            onPress={() => switchRole('STUDENT')}
            disabled={loading}
          >
            <Text style={[styles.tabText, role === 'STUDENT' && styles.tabTextActive]}>Student</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color={colors.deepGold} style={styles.loader} /> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(role)} />}
          style={styles.tableScroll}
        >
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.th, styles.nameCell]}>Name</Text>
              <Text style={styles.th}>Username</Text>
              <Text style={styles.th}>Temp Password</Text>
              <Text style={styles.th}>Reference</Text>
            </View>

            {credentials.map((item) => (
              <View style={styles.tableRow} key={`${item.role}-${item.username}`}>
                <Text style={[styles.td, styles.nameCell]} numberOfLines={2}>
                  {item.displayName || '-'}
                </Text>
                <Text style={styles.td}>{item.username || '-'}</Text>
                <Text style={[styles.td, styles.passwordCell]}>{item.temporaryPassword || '-'}</Text>
                <Text style={styles.td}>{item.linkedReference || '-'}</Text>
              </View>
            ))}

            {!credentials.length && !loading ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No credentials found</Text>
                <Text style={styles.emptyText}>Commit school import data first, then refresh this page.</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <Text style={styles.footerNote}>
          Instruction: share credentials securely. Teacher/student first login must create a new password. Parent login must use OTP activation, not this credentials list.
        </Text>
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={() => router.back()}>
        <Text style={styles.homeButtonText}>Back</Text>
      </TouchableOpacity>
    </MobileWorkflowScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: { paddingBottom: 52 },
  heroCard: {
    backgroundColor: 'rgba(255,253,247,0.96)',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardGoldBorder,
    ...shadows.soft,
  },
  eyebrow: {
    color: colors.deepGold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.primaryNavy,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  heroText: { color: colors.slateText, marginTop: 8, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  ruleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  ruleCard: {
    flex: 1,
    minWidth: 145,
    backgroundColor: 'rgba(255,253,247,0.94)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardGoldBorder,
  },
  ruleCardWide: {
    width: '100%',
    backgroundColor: 'rgba(255,253,247,0.94)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardGoldBorder,
  },
  ruleLabel: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900' },
  ruleBody: { color: colors.slateText, fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 4 },
  card: {
    marginTop: 14,
    backgroundColor: 'rgba(255,253,247,0.98)',
    borderRadius: 24,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardGoldBorder,
    ...shadows.soft,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  sectionTitle: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900', marginTop: 6 },
  schoolText: { color: colors.slateText, fontSize: 12, fontWeight: '800', marginTop: 4 },
  tabs: { flexDirection: 'row', gap: 10, marginTop: 16 },
  tab: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.cardGoldBorder,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fffdf7',
  },
  tabActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy },
  tabText: { color: colors.primaryNavy, fontWeight: '900' },
  tabTextActive: { color: '#fffdf7' },
  loader: { marginVertical: 16 },
  successText: { color: '#166534', fontWeight: '800', marginTop: 12, lineHeight: 18 },
  errorText: { color: '#b42318', fontWeight: '800', marginTop: 12, lineHeight: 18 },
  tableScroll: { marginTop: 14 },
  table: { minWidth: 700, borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 16, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.cardGoldBorder, backgroundColor: '#fffdf7' },
  tableHeader: { backgroundColor: '#f7edcf' },
  th: { width: 155, padding: 12, color: colors.primaryNavy, fontWeight: '900', fontSize: 12 },
  td: { width: 155, padding: 12, color: colors.primaryNavy, fontWeight: '800', fontSize: 12 },
  nameCell: { width: 210 },
  passwordCell: { fontFamily: 'monospace' },
  emptyBox: { padding: 18, backgroundColor: '#fffdf7' },
  emptyTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15 },
  emptyText: { color: colors.slateText, fontWeight: '700', marginTop: 4 },
  footerNote: { marginTop: 14, color: colors.slateText, fontSize: 12, lineHeight: 18, fontWeight: '800' },
  homeButton: { marginTop: 16, borderRadius: 18, backgroundColor: colors.primaryNavy, paddingVertical: 14, alignItems: 'center' },
  homeButtonText: { color: '#fffdf7', fontWeight: '900', fontSize: 16 },
});
