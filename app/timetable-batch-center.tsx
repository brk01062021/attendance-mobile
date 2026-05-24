import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ImageBackground, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getLatestPublishedTimetable, getTimetableBatches } from '../src/services/timetableApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableBatchSummary, TimetablePublishAudit } from '../src/types/timetable';

export default function TimetableBatchCenterScreen() {
    const params = useLocalSearchParams();
    const sourceRole = String(params.sourceRole || 'admin');
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const [batchInput, setBatchInput] = useState(String(params.generatedBatchId || ''));
    const [batches, setBatches] = useState<TimetableBatchSummary[]>([]);
    const [latest, setLatest] = useState<TimetablePublishAudit | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('Use a generated batch ID like TT-CEB9E72D to review, repair, publish, export, or open principal intelligence.');

    const selectedBatchId = useMemo(() => batchInput.trim().toUpperCase(), [batchInput]);

    const load = async () => {
        setLoading(true);
        try {
            const [batchList, latestPublished] = await Promise.all([
                getTimetableBatches(),
                getLatestPublishedTimetable().catch(() => null),
            ]);
            setBatches(batchList || []);
            setLatest(latestPublished);
            if (!batchInput && latestPublished?.batchId) setBatchInput(latestPublished.batchId);
            setMessage(batchList?.length ? 'Loaded available server-session timetable batches.' : 'No generated batches found yet. Generate a timetable first.');
        } catch {
            setMessage('Batch API unavailable. You can still paste a batch ID and open screens manually.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openPath = (pathname: string) => {
        if (!selectedBatchId) {
            setMessage('Please enter or select a generated batch ID first.');
            return;
        }
        router.push({ pathname: pathname as any, params: { generatedBatchId: selectedBatchId, sourceRole } });
    };

    const selectBatch = (batchId: string) => {
        setBatchInput(batchId);
        setMessage(`Selected ${batchId}. Now open Review, Conflicts, Publish, Export, or Intelligence.`);
    };

    return (
        <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover">
            <ScrollView
                contentContainerStyle={styles.container}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
            >
                <Header title="Timetable Batch Center" eyebrow="BATCH CONTROL" homePath={backHome} />

                <View style={styles.heroCard}>
                    <Text style={styles.heroTitle}>Use Generated Batch in Mobile</Text>
                    <Text style={styles.heroText}>{message}</Text>
                    {latest?.batchId ? <Text style={styles.latest}>Latest published: {latest.batchId} • {latest.status}</Text> : null}
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Batch ID</Text>
                    <TextInput
                        value={batchInput}
                        onChangeText={setBatchInput}
                        autoCapitalize="characters"
                        placeholder="Example: TT-CEB9E72D"
                        placeholderTextColor={colors.mutedText}
                        style={styles.input}
                    />
                    <Text style={styles.help}>Tip: paste the batch ID you saw in Postman or after Generate Timetable.</Text>
                </View>

                <View style={styles.grid}>
                    <Action title="Review" subtitle="Class-section timetable" onPress={() => openPath('/timetable-review')} />
                    <Action title="Conflicts" subtitle="Repair blocking issues" onPress={() => openPath('/timetable-conflicts')} />
                    <Action title="Publish / Export" subtitle="PDF, Excel, audit" onPress={() => openPath('/timetable-publish')} />
                    <Action title="Intelligence" subtitle="Principal readiness" onPress={() => openPath('/principal-timetable-intelligence')} />
                </View>

                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.cardTitle}>Available Batches</Text>
                        {loading ? <ActivityIndicator color={colors.primaryNavy} /> : null}
                    </View>
                    {batches.length === 0 ? <Text style={styles.empty}>No batches loaded. Pull down to refresh after generating timetable.</Text> : null}
                    {batches.map(item => (
                        <TouchableOpacity key={item.batchId} style={styles.batchCard} onPress={() => selectBatch(item.batchId)}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.batchTitle}>{item.batchId}</Text>
                                <Text style={styles.batchMeta}>{item.status} • {item.classSections} sections • {item.totalEntries} periods</Text>
                                <Text style={styles.batchMessage}>{item.message}</Text>
                            </View>
                            <View style={styles.scorePill}><Text style={styles.scoreText}>{item.completionPercentage}%</Text></View>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.refreshButton} onPress={load}>
                    <Text style={styles.refreshText}>Refresh Batches</Text>
                </TouchableOpacity>
            </ScrollView>
        </ImageBackground>
    );
}

function Header({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) {
    return <View style={styles.headerRow}>
        <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <View style={styles.headerTextWrap}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text></View>
        <TouchableOpacity style={styles.circleButton} onPress={() => router.replace(homePath as any)}><Text style={styles.homeIcon}>⌂</Text></TouchableOpacity>
    </View>;
}

function Action({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
    return <TouchableOpacity style={styles.actionCard} onPress={onPress}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>;
}

const styles = StyleSheet.create({
    bg: { flex: 1 },
    container: { paddingHorizontal: spacing.lg, paddingTop: 72, paddingBottom: 34 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 7 },
    circleButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.78)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    backText: { color: colors.primaryNavy, fontSize: 40, fontWeight: '900', marginTop: -7 },
    homeIcon: { color: colors.primaryNavy, fontSize: 30, fontWeight: '900', marginTop: -3 },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    eyebrow: { color: colors.deepGold, fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textAlign: 'center' },
    title: { color: colors.primaryNavy, fontSize: 22, fontWeight: '900', textAlign: 'center' },
    heroCard: { backgroundColor: 'rgba(13, 33, 57, 0.94)', borderRadius: 24, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(212,175,55,0.42)', ...shadows.medium },
    heroTitle: { color: colors.white, fontSize: 21, fontWeight: '900', marginBottom: 6 },
    heroText: { color: 'rgba(255,255,255,0.82)', fontWeight: '800', lineHeight: 20 },
    latest: { color: colors.premiumGold, fontWeight: '900', marginTop: 10 },
    card: { backgroundColor: 'rgba(255,253,247,0.96)', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, marginBottom: 12, ...shadows.medium },
    label: { color: colors.primaryNavy, fontWeight: '900', marginBottom: 8 },
    input: { backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, paddingHorizontal: 14, paddingVertical: 12, color: colors.primaryNavy, fontWeight: '900', letterSpacing: 0.5 },
    help: { color: colors.mutedText, fontWeight: '700', marginTop: 8, lineHeight: 18 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    actionCard: { width: '48%', backgroundColor: colors.cardCream, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.cardGoldBorder, ...shadows.soft },
    actionTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 15, marginBottom: 5 },
    actionSubtitle: { color: colors.slateText, fontWeight: '700', fontSize: 11, lineHeight: 15 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { color: colors.primaryNavy, fontSize: 16, fontWeight: '900', marginBottom: 10 },
    empty: { color: colors.slateText, fontWeight: '800', lineHeight: 20 },
    batchCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 11, marginTop: 10 },
    batchTitle: { color: colors.primaryNavy, fontWeight: '900', fontSize: 16 },
    batchMeta: { color: colors.deepGold, fontWeight: '900', marginTop: 3 },
    batchMessage: { color: colors.slateText, fontWeight: '700', marginTop: 3, lineHeight: 17 },
    scorePill: { backgroundColor: colors.primaryNavy, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
    scoreText: { color: colors.white, fontWeight: '900' },
    refreshButton: { backgroundColor: colors.primaryNavy, borderRadius: 15, padding: 14, alignItems: 'center' },
    refreshText: { color: colors.white, fontWeight: '900' },
});
