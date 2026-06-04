import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MobileWorkflowHeader from '../components/layout/MobileWorkflowHeader';
import { repairTimetable } from '../src/services/timetableApi';
import { colors, shadows, spacing } from '../src/theme';
import { TimetableRepairResult } from '../src/types/timetable';

export default function TimetableRepairScreen() {
    const params = useLocalSearchParams();
    const generatedBatchId = String(params.generatedBatchId || 'DEMO');
    const sourceRole = String(params.sourceRole || 'admin');
    const backHome = sourceRole === 'principal' ? '/principal-home' : '/admin-dashboard';
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<TimetableRepairResult | null>(null);
    const [status, setStatus] = useState('Ready to run automatic conflict repair.');

    const runRepair = () => {
        setLoading(true);
        setStatus('Repairing timetable conflicts and recalculating workload...');
        repairTimetable(generatedBatchId)
            .then(data => { setResult(data); setStatus(data.publishReady ? 'Repair complete. Timetable is publish-ready.' : 'Repair complete. Manual review still recommended.'); })
            .catch(() => setStatus('Auto repair is unavailable. Please try again after the service is restored.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { if (generatedBatchId !== 'DEMO') runRepair(); }, [generatedBatchId]);
    const navParams = { sourceRole, generatedBatchId: result?.batchId || generatedBatchId };

    return <ImageBackground source={require('../assets/branding/splash-gold.png')} style={styles.bg} resizeMode="cover"><ScrollView contentContainerStyle={styles.container}>
        <Header title="Auto Conflict Repair" eyebrow="REPAIR ENGINE" homePath={backHome} />
        <Text style={styles.status}>{status}</Text><Text style={styles.batch}>Batch: {result?.batchId || generatedBatchId}</Text>
        {loading ? <ActivityIndicator color={colors.primaryNavy} style={{ marginVertical: 10 }} /> : null}
        <View style={styles.summaryRow}><Kpi label="Before" value={String(result?.conflictsBefore ?? '-')} /><Kpi label="After" value={String(result?.conflictsAfter ?? '-')} /><Kpi label="Fixed" value={String(result?.repairedItems ?? '-')} /></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Repair Actions</Text>{(result?.actions || ['Tap Run Auto Repair to validate this generated timetable.']).map((item, index) => <Text key={index} style={styles.action}>• {item}</Text>)}</View>
        <TouchableOpacity style={styles.primaryButton} onPress={runRepair}><Text style={styles.primaryText}>Run Auto Repair Again</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/timetable-review' as any, params: navParams })}><Text style={styles.secondaryText}>Open Review</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/timetable-publish' as any, params: navParams })}><Text style={styles.secondaryText}>Continue to Publish</Text></TouchableOpacity>
    </ScrollView></ImageBackground>;
}
function Header({ title, eyebrow, homePath }: { title: string; eyebrow: string; homePath: string }) { return <MobileWorkflowHeader title={title} eyebrow={eyebrow} homePath={homePath} />; }
function Kpi({ label, value }: { label: string; value: string }) { return <View style={styles.kpi}><Text style={styles.kpiValue}>{value}</Text><Text style={styles.kpiLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ bg:{flex:1}, container:{paddingHorizontal:spacing.lg,paddingTop:72,paddingBottom:32}, headerRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:8}, circleButton:{width:52,height:52,borderRadius:26,borderWidth:1.5,borderColor:'rgba(255,255,255,0.78)',backgroundColor:'rgba(255,255,255,0.12)',alignItems:'center',justifyContent:'center'}, backText:{color:colors.primaryNavy,fontSize:40,fontWeight:'900',marginTop:-7}, homeIcon:{color:colors.primaryNavy,fontSize:30,fontWeight:'900',marginTop:-3}, headerTextWrap:{flex:1,alignItems:'center'}, eyebrow:{color:colors.deepGold,fontWeight:'900',fontSize:9,letterSpacing:1.5,textAlign:'center'}, title:{color:colors.primaryNavy,fontSize:20,fontWeight:'900',textAlign:'center'}, status:{color:colors.deepGold,fontWeight:'900',marginBottom:5}, batch:{color:colors.slateText,fontWeight:'800',marginBottom:10}, summaryRow:{flexDirection:'row',gap:7,marginBottom:10}, kpi:{flex:1,backgroundColor:colors.cardCream,borderRadius:14,padding:11,borderWidth:1,borderColor:colors.cardGoldBorder,...shadows.soft}, kpiValue:{color:colors.primaryNavy,fontSize:16,fontWeight:'900'}, kpiLabel:{color:colors.mutedText,fontWeight:'800',fontSize:10}, card:{backgroundColor:'rgba(255,253,247,0.96)',borderRadius:20,padding:14,borderWidth:1,borderColor:colors.cardGoldBorder,marginBottom:10,...shadows.medium}, cardTitle:{color:colors.primaryNavy,fontSize:14,fontWeight:'900',marginBottom:8}, action:{color:colors.slateText,fontWeight:'700',lineHeight:20,marginBottom:5}, primaryButton:{backgroundColor:colors.primaryNavy,borderRadius:13,padding:12,alignItems:'center',marginTop:8}, primaryText:{color:colors.white,fontWeight:'900'}, secondaryButton:{backgroundColor:colors.cardCream,borderRadius:13,padding:12,alignItems:'center',marginTop:8,borderWidth:1,borderColor:colors.cardGoldBorder}, secondaryText:{color:colors.primaryNavy,fontWeight:'900'} });
