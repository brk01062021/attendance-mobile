import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { images } from '../src/constants/images';
import { getStudentAttendanceRisk } from '../src/services/day4AutomationApi';
import type { StudentRisk } from '../src/types/day4Automation';

const firstDayOfMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};
const today = () => new Date().toISOString().split('T')[0];

export default function StudentRiskDashboardScreen() {
    const [items, setItems] = useState<StudentRisk[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setItems(await getStudentAttendanceRisk(firstDayOfMonth(), today()));
        } catch (error) {
            Alert.alert('Unable to load risk analytics', 'Please confirm backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    return (
        <ImageBackground source={images.splashGold} style={styles.background} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Student Attendance Risk</Text>
                <Text style={styles.subtitle}>Early-warning list for low attendance and recovery follow-up.</Text>
                {loading ? <ActivityIndicator size="large" /> : null}
                {items.map((item) => (
                    <View key={item.studentId} style={styles.card}>
                        <View style={styles.rowBetween}>
                            <Text style={styles.student}>{item.studentName}</Text>
                            <Text style={[styles.risk, item.riskLevel === 'HIGH' ? styles.high : item.riskLevel === 'MEDIUM' ? styles.medium : styles.low]}>{item.riskLevel}</Text>
                        </View>
                        <Text style={styles.meta}>Class {item.className}-{item.section}</Text>
                        <View style={styles.metricsRow}>
                            <View style={styles.metric}><Text style={styles.metricValue}>{item.attendancePercentage}%</Text><Text style={styles.metricLabel}>Attendance</Text></View>
                            <View style={styles.metric}><Text style={styles.metricValue}>{item.absentCount}</Text><Text style={styles.metricLabel}>Absent</Text></View>
                            <View style={styles.metric}><Text style={styles.metricValue}>{item.totalClasses}</Text><Text style={styles.metricLabel}>Classes</Text></View>
                        </View>
                        <Text style={styles.action}>{item.actionRequired}</Text>
                    </View>
                ))}
            </ScrollView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: { padding: 20, paddingTop: 54, paddingBottom: 44 },
    backButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, marginBottom: 14 },
    backText: { color: '#3b2a05', fontWeight: '800' },
    title: { fontSize: 28, fontWeight: '900', color: '#2f2106' },
    subtitle: { color: '#5b4515', marginTop: 6, marginBottom: 18, fontSize: 14 },
    card: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 22, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(116,83,15,0.18)' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    student: { fontSize: 18, fontWeight: '900', color: '#2f2106', flex: 1 },
    risk: { overflow: 'hidden', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, fontWeight: '900' },
    high: { backgroundColor: '#ffe0de', color: '#9a241c' },
    medium: { backgroundColor: '#fff4cf', color: '#7a5200' },
    low: { backgroundColor: '#e5f8e8', color: '#1f7a35' },
    meta: { color: '#5b4515', marginTop: 8, fontWeight: '800' },
    metricsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
    metric: { flex: 1, backgroundColor: '#fff9e9', borderRadius: 16, padding: 12, alignItems: 'center' },
    metricValue: { fontSize: 18, fontWeight: '900', color: '#2f2106' },
    metricLabel: { color: '#7a6221', fontSize: 11, fontWeight: '800', marginTop: 3 },
    action: { marginTop: 12, color: '#5b4515', fontWeight: '800' },
});
