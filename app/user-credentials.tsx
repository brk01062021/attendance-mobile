import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [query, setQuery] = useState('');

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
      const apiMessage = err?.response?.data?.message || err?.message;
      setError(typeof apiMessage === 'string' ? apiMessage : 'Unable to load credentials.');
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }, [canAccess, role, schoolId]);

  useEffect(() => {
    load('TEACHER');
  }, [load]);

  const filteredCredentials = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return credentials;
    return credentials.filter((item) => [item.displayName, item.username, item.linkedReference]
      .some((value) => String(value || '').toLowerCase().includes(search)));
  }, [credentials, query]);

  const switchRole = (nextRole: CredentialRole) => {
    setRole(nextRole);
    setQuery('');
    load(nextRole);
  };

  const selectedCountLabel = `${credentials.length} ${role.toLowerCase()} record${credentials.length === 1 ? '' : 's'} loaded`;

  const exportRows = useMemo(() => credentials.map((credential) => ({
    Role: credential.role || role,
    Name: credential.displayName || '',
    Username: credential.username || '',
    'Temporary Password': credential.temporaryPassword || '',
    Reference: credential.linkedReference || '',
    'First Login Rule': 'Use temporary password for first login, then create a new password.',
  })), [credentials, role]);

  const csvCell = (value: string | undefined | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const htmlCell = (value: string | undefined | null) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const openDataDownload = async (content: string, mimeType: string, extension: 'csv' | 'xls') => {
    const fileName = `${schoolId}-${role.toLowerCase()}-credentials.${extension}`;

    const webDocument = (globalThis as any).document;
    const webUrl = (globalThis as any).URL;
    const webBlob = (globalThis as any).Blob;
    if (Platform.OS === 'web' && webDocument && webUrl && webBlob) {
      const blob = new webBlob([content], { type: `${mimeType};charset=utf-8;` });
      const url = webUrl.createObjectURL(blob);
      const link = webDocument.createElement('a');
      link.href = url;
      link.download = fileName;
      webDocument.body.appendChild(link);
      link.click();
      webDocument.body.removeChild(link);
      webUrl.revokeObjectURL(url);
      return;
    }

    const dataUrl = `data:${mimeType};charset=utf-8,${encodeURIComponent(content)}`;
    const supported = await Linking.canOpenURL(dataUrl);
    if (!supported) {
      setError('Download is not available on this device. Please use the web portal download if sharing is blocked by the phone.');
      return;
    }
    await Linking.openURL(dataUrl);
  };

  const downloadCsv = async () => {
    if (!exportRows.length) return;
    const header = ['Role', 'Name', 'Username', 'Temporary Password', 'Reference', 'First Login Rule'];
    const lines = [
      header.map(csvCell).join(','),
      ...exportRows.map((row) => header.map((key) => csvCell(row[key as keyof typeof row])).join(',')),
    ];
    await openDataDownload(lines.join('\n'), 'text/csv', 'csv');
  };

  const downloadExcel = async () => {
    if (!exportRows.length) return;
    const header = ['Role', 'Name', 'Username', 'Temporary Password', 'Reference', 'First Login Rule'];
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${header.map((column) => `<th>${column}</th>`).join('')}</tr></thead><tbody>${exportRows.map((row) => `<tr>${header.map((key) => `<td>${htmlCell(row[key as keyof typeof row])}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    await openDataDownload(html, 'application/vnd.ms-excel', 'xls');
  };

  const chooseDownloadFormat = () => {
    if (!credentials.length || loading) return;
    Alert.alert(
      'Download credentials',
      `Choose a format for ${role.toLowerCase()} credentials.`,
      [
        { text: 'CSV', onPress: downloadCsv },
        { text: 'Excel', onPress: downloadExcel },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
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
          Real {schoolId} teacher and student credentials are shown here for secure first-login sharing. Parents activate separately with Student ID and parent mobile OTP.
        </Text>
      </View>

      <View style={styles.ruleGrid}>
        <TouchableOpacity
          style={[styles.ruleCard, role === 'TEACHER' && styles.ruleCardActive]}
          onPress={() => switchRole('TEACHER')}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.ruleLabel, role === 'TEACHER' && styles.ruleLabelActive]}>Teacher</Text>
          <Text style={[styles.ruleBody, role === 'TEACHER' && styles.ruleBodyActive]}>
            {role === 'TEACHER' ? selectedCountLabel : 'Tap to view teacher records.'}
          </Text>
          <Text style={[styles.ruleMeta, role === 'TEACHER' && styles.ruleMetaActive]}>Temporary password + first-login password change.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ruleCard, role === 'STUDENT' && styles.ruleCardActive]}
          onPress={() => switchRole('STUDENT')}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={[styles.ruleLabel, role === 'STUDENT' && styles.ruleLabelActive]}>Student</Text>
          <Text style={[styles.ruleBody, role === 'STUDENT' && styles.ruleBodyActive]}>
            {role === 'STUDENT' ? selectedCountLabel : 'Tap to view student records.'}
          </Text>
          <Text style={[styles.ruleMeta, role === 'STUDENT' && styles.ruleMetaActive]}>Temporary password + first-login password change.</Text>
        </TouchableOpacity>

        <View style={styles.ruleCardWide}>
          <Text style={styles.ruleLabel}>Parent</Text>
          <Text style={styles.ruleBody}>No exported password. Parent activates with Student ID + parent mobile OTP mapping.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.eyebrow}>Downloads</Text>
            <Text style={styles.sectionTitle}>{role === 'TEACHER' ? 'Teacher Credentials' : 'Student Credentials'}</Text>
            <Text style={styles.schoolText}>School: {schoolId} · Loaded: {credentials.length}</Text>
          </View>
          <TouchableOpacity
            style={[styles.downloadButton, (!credentials.length || loading) && styles.downloadButtonDisabled]}
            onPress={chooseDownloadFormat}
            disabled={!credentials.length || loading}
            activeOpacity={0.85}
          >
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
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

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, username, reference"
          placeholderTextColor={colors.slateText}
          style={styles.searchInput}
        />

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

            {filteredCredentials.map((item) => (
              <View style={styles.tableRow} key={`${item.role}-${item.username}`}>
                <Text style={[styles.td, styles.nameCell]} numberOfLines={2}>
                  {item.displayName || '-'}
                </Text>
                <Text style={styles.td}>{item.username || '-'}</Text>
                <Text style={[styles.td, styles.passwordCell]}>{item.temporaryPassword || '-'}</Text>
                <Text style={styles.td}>{item.linkedReference || '-'}</Text>
              </View>
            ))}

            {!filteredCredentials.length && !loading ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No matching credentials found</Text>
                <Text style={styles.emptyText}>Refresh after school import commit/recommit, or clear the search filter.</Text>
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
  ruleCardActive: { backgroundColor: colors.primaryNavy, borderColor: colors.primaryNavy },
  ruleLabel: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900' },
  ruleLabelActive: { color: '#fffdf7' },
  ruleBody: { color: colors.slateText, fontSize: 12, lineHeight: 17, fontWeight: '800', marginTop: 4 },
  ruleBodyActive: { color: '#fffdf7' },
  ruleMeta: { color: colors.slateText, fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 5 },
  ruleMetaActive: { color: 'rgba(255,253,247,0.86)' },
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
  cardTitleBlock: { flex: 1 },
  downloadButton: { borderRadius: 14, backgroundColor: colors.primaryNavy, paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  downloadButtonDisabled: { opacity: 0.5 },
  downloadButtonText: { color: '#fffdf7', fontWeight: '900', fontSize: 12 },
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
  searchInput: { marginTop: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, color: colors.primaryNavy, backgroundColor: '#fffdf7', fontWeight: '800' },
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
