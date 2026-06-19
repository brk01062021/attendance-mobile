import { router } from 'expo-router';
import React from 'react';
import {
    ImageBackground,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const background = require('../assets/branding/splash-gold.png');

type Metric = {
    label: string;
    value: string;
    helper: string;
};

type AnalyticsSection = {
    eyebrow: string;
    title: string;
    description: string;
    metrics: Metric[];
};

const executiveMetrics: Metric[] = [
    { label: 'Attendance', value: '0%', helper: 'Whole-school current day signal' },
    { label: 'Coverage', value: '100%', helper: 'Timetable coverage readiness' },
    { label: 'Risk Students', value: '0', helper: 'Below safe threshold' },
    { label: 'School Health', value: '55', helper: 'Needs Principal Review' },
];

const sections: AnalyticsSection[] = [
    {
        eyebrow: 'ATTENDANCE ANALYTICS',
        title: 'Attendance Trends',
        description: 'Daily and monthly attendance movement by school, class, and section.',
        metrics: [
            { label: 'Monthly Trend', value: 'No data', helper: 'Appears after daily attendance submissions' },
            { label: 'Top Class', value: 'No data', helper: 'Attendance rank' },
            { label: 'Weak Section', value: 'No data', helper: 'Needs support' },
            { label: 'Class Risk', value: '0', helper: 'Classes below 75%' },
        ],
    },
    {
        eyebrow: 'RISK ANALYTICS',
        title: 'Student Risk Signals',
        description: 'Student, class, and section risk indicators for follow-up decisions.',
        metrics: [
            { label: 'Risk Students', value: '0', helper: 'Below safe threshold' },
            { label: 'Critical Alerts', value: '0', helper: 'High priority' },
            { label: 'Academic Insights', value: '0', helper: 'Priority decisions' },
            { label: 'Follow-ups', value: '1', helper: 'Pending attendance submission' },
        ],
    },
    {
        eyebrow: 'TEACHER ANALYTICS',
        title: 'Workload and Fatigue',
        description: 'Teacher leave load, daily overload, replacement pressure, and fatigue watch.',
        metrics: [
            { label: 'Teacher Leave Load', value: '0', helper: 'Needs attention' },
            { label: 'Daily Overload', value: '0', helper: 'Teachers ≥ 80 score' },
            { label: 'Fatigue Alerts', value: '0', helper: 'Today workload watch' },
            { label: 'Replacement Stress', value: '0', helper: 'Index 0' },
        ],
    },
    {
        eyebrow: 'TIMETABLE ANALYTICS',
        title: 'Coverage and Readiness',
        description: 'Published timetable health, coverage quality, replacement pressure, and utilization.',
        metrics: [
            { label: 'Timetable', value: 'LIVE', helper: '280 period allocations' },
            { label: 'Coverage', value: '100%', helper: 'Active published timetable' },
            { label: 'Classes', value: '4', helper: 'Detected in active batch' },
            { label: 'Sections', value: '8', helper: 'Detected in active batch' },
        ],
    },
    {
        eyebrow: 'COMMUNICATION ANALYTICS',
        title: 'Activity and Notice Signals',
        description: 'Published activities, approval backlog, notices, and future parent engagement indicators.',
        metrics: [
            { label: 'Activities', value: '3', helper: 'Published in feed' },
            { label: 'Approvals', value: '0', helper: 'Pending approval queue' },
            { label: 'Notices', value: 'No data', helper: 'Appears after notices are published' },
            { label: 'Engagement', value: 'Future', helper: 'Parent engagement metrics' },
        ],
    },
];

export default function OperationalAnalyticsScreen() {
    return (
        <ImageBackground source={background} style={styles.background} resizeMode="cover">
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()} activeOpacity={0.85}>
                            <Text style={styles.iconButtonText}>‹</Text>
                        </TouchableOpacity>
                        <View style={styles.headerCenter}>
                            <Text style={styles.headerEyebrow}>OPERATIONAL ANALYTICS</Text>
                            <Text style={styles.headerTitle}>Operational Analytics</Text>
                            <Text style={styles.headerSubtitle}>Trends, comparisons, risk, workload and drilldowns.</Text>
                        </View>
                        <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/admin-dashboard')} activeOpacity={0.85}>
                            <Text style={styles.homeIcon}>⌂</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.heroCard}>
                        <Text style={styles.heroEyebrow}>ANALYTICS HUB</Text>
                        <Text style={styles.heroTitle}>Understand trends and drill into operational decisions.</Text>
                        <Text style={styles.heroBody}>School Intelligence shows what needs attention now. Operational Analytics explains why it is happening and where to act next.</Text>
                    </View>

                    <View style={styles.summaryCard}>
                        <View style={styles.sectionHeaderRow}>
                            <View style={styles.sectionHeaderText}>
                                <Text style={styles.sectionEyebrow}>EXECUTIVE SUMMARY</Text>
                                <Text style={styles.sectionTitle}>Current operational pulse</Text>
                            </View>
                            <Text style={styles.livePill}>LIVE</Text>
                        </View>
                        <View style={styles.metricGrid}>
                            {executiveMetrics.map((metric) => (
                                <MetricCard key={metric.label} metric={metric} dark />
                            ))}
                        </View>
                    </View>

                    {sections.map((section) => (
                        <View key={section.title} style={styles.analyticsCard}>
                            <Text style={styles.sectionEyebrow}>{section.eyebrow}</Text>
                            <Text style={styles.sectionTitle}>{section.title}</Text>
                            <Text style={styles.sectionDescription}>{section.description}</Text>
                            <View style={styles.metricGrid}>
                                {section.metrics.map((metric) => (
                                    <MetricCard key={`${section.title}-${metric.label}`} metric={metric} />
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </SafeAreaView>
        </ImageBackground>
    );
}

function MetricCard({ metric, dark = false }: { metric: Metric; dark?: boolean }) {
    return (
        <View style={[styles.metricCard, dark && styles.darkMetricCard]}>
            <Text style={[styles.metricLabel, dark && styles.darkMetricLabel]}>{metric.label}</Text>
            <Text style={[styles.metricValue, dark && styles.darkMetricValue]}>{metric.value}</Text>
            <Text style={[styles.metricHelper, dark && styles.darkMetricHelper]}>{metric.helper}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    safeArea: { flex: 1 },
    content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34, gap: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    iconButton: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
    iconButtonText: { color: '#0b2f57', fontSize: 38, fontWeight: '900', marginTop: -4 },
    homeIcon: { color: '#0b2f57', fontSize: 28, fontWeight: '900' },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerEyebrow: { color: '#8f5a05', fontSize: 12, fontWeight: '900', letterSpacing: 4, textAlign: 'center' },
    headerTitle: { color: '#082747', fontSize: 27, fontWeight: '900', textAlign: 'center' },
    headerSubtitle: { color: '#39485b', fontSize: 14, fontWeight: '800', textAlign: 'center', lineHeight: 20 },
    heroCard: { backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 28, padding: 22, borderWidth: 1.5, borderColor: '#eed690' },
    heroEyebrow: { color: '#94420f', fontSize: 13, fontWeight: '900', letterSpacing: 4, marginBottom: 10 },
    heroTitle: { color: '#082747', fontSize: 28, fontWeight: '900', lineHeight: 34 },
    heroBody: { color: '#576276', fontSize: 16, fontWeight: '800', lineHeight: 24, marginTop: 12 },
    summaryCard: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 28, padding: 18, borderWidth: 1.5, borderColor: '#eed690' },
    analyticsCard: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 28, padding: 18, borderWidth: 1.5, borderColor: '#eed690' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    sectionHeaderText: { flex: 1 },
    sectionEyebrow: { color: '#94420f', fontSize: 13, fontWeight: '900', letterSpacing: 3, marginBottom: 6 },
    sectionTitle: { color: '#082747', fontSize: 24, fontWeight: '900', lineHeight: 30 },
    sectionDescription: { color: '#657186', fontSize: 15, fontWeight: '800', lineHeight: 22, marginTop: 8 },
    livePill: { overflow: 'hidden', backgroundColor: '#123a63', color: '#fff8de', borderRadius: 18, paddingHorizontal: 17, paddingVertical: 7, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
    metricCard: { width: '48%', minHeight: 132, borderRadius: 22, backgroundColor: 'rgba(255,251,239,0.88)', borderWidth: 1.5, borderColor: '#efd986', padding: 14, justifyContent: 'space-between' },
    darkMetricCard: { backgroundColor: '#071421', borderColor: '#b99b47' },
    metricLabel: { color: '#687386', fontSize: 13, fontWeight: '900' },
    darkMetricLabel: { color: '#d9bd42', letterSpacing: 3 },
    metricValue: { color: '#0b3158', fontSize: 30, fontWeight: '900', marginTop: 8 },
    darkMetricValue: { color: '#fff8de' },
    metricHelper: { color: '#93420f', fontSize: 13, fontWeight: '900', lineHeight: 18, marginTop: 6 },
    darkMetricHelper: { color: 'rgba(255,248,222,0.72)' },
});
