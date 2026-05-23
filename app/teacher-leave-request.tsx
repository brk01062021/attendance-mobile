import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ImageBackground, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { images } from '../src/constants/images';
import { submitTeacherLeaveEnquiry } from '../src/services/day4AutomationApi';

const today = () => new Date().toISOString().split('T')[0];

type LeaveType = 'PLANNED_LEAVE' | 'UNPLANNED_LEAVE';

export default function TeacherLeaveRequestScreen() {
    const params = useLocalSearchParams();
    const teacherId = Number(params.teacherId || 1);
    const teacherName = String(params.teacherName || 'Teacher');

    const [fromDate, setFromDate] = useState(today());
    const [toDate, setToDate] = useState(today());
    const [leaveType, setLeaveType] = useState<LeaveType>('PLANNED_LEAVE');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const markedDates = useMemo(() => ({
        [fromDate]: { selected: true, selectedColor: '#7a5200' },
        ...(toDate !== fromDate ? { [toDate]: { selected: true, selectedColor: '#3b2a05' } } : {}),
    }), [fromDate, toDate]);

    const onDayPress = (day: { dateString: string }) => {
        if (!fromDate || (fromDate && toDate && fromDate !== toDate)) {
            setFromDate(day.dateString);
            setToDate(day.dateString);
            return;
        }

        if (day.dateString < fromDate) {
            setToDate(fromDate);
            setFromDate(day.dateString);
        } else {
            setToDate(day.dateString);
        }
    };

    const submit = async () => {
        if (!teacherId) {
            Alert.alert('Teacher profile missing', 'Please login again as teacher.');
            return;
        }
        if (!reason.trim()) {
            Alert.alert('Reason required', 'Please enter a short reason before requesting leave enquiry.');
            return;
        }

        try {
            setSubmitting(true);
            await submitTeacherLeaveEnquiry({
                teacherId,
                teacherName,
                fromDate,
                toDate,
                leaveType,
                reason: reason.trim(),
            });
            Alert.alert(
                'Leave enquiry requested',
                'Your leave enquiry was sent to Admin and Principal for approval.',
                [{ text: 'OK', onPress: () => router.replace({ pathname: '/teacher-dashboard', params: { teacherId, teacherName, role: 'TEACHER' } } as any) }]
            );
        } catch (error) {
            Alert.alert('Request failed', 'Please confirm backend is running and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <ImageBackground source={images.splashGold} style={styles.background} resizeMode="cover">
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace({ pathname: '/teacher-dashboard', params: { teacherId, teacherName, role: 'TEACHER' } } as any)}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.eyebrow}>Teacher Leave</Text>
                <Text style={styles.title}>Request Leave / Leave Enquiry</Text>
                <Text style={styles.subtitle}>Submit a leave enquiry only. Admin or Principal will approve/reject it and start replacement planning after approval.</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Teacher</Text>
                    <Text style={styles.teacherName}>{teacherName}</Text>

                    <Text style={styles.label}>Leave Type</Text>
                    <View style={styles.typeRow}>
                        <TypePill title="Planned" active={leaveType === 'PLANNED_LEAVE'} onPress={() => setLeaveType('PLANNED_LEAVE')} />
                        <TypePill title="Emergency" active={leaveType === 'UNPLANNED_LEAVE'} onPress={() => setLeaveType('UNPLANNED_LEAVE')} />
                    </View>

                    <Text style={styles.label}>Select From / To Date</Text>
                    <Calendar markedDates={markedDates} onDayPress={onDayPress} />

                    <View style={styles.dateSummary}>
                        <Text style={styles.dateText}>From: {fromDate}</Text>
                        <Text style={styles.dateText}>To: {toDate}</Text>
                    </View>

                    <Text style={styles.label}>Reason</Text>
                    <TextInput
                        style={styles.input}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Enter reason for leave enquiry"
                        placeholderTextColor="#8b7442"
                        multiline
                    />

                    <TouchableOpacity style={[styles.submitButton, submitting && styles.disabledButton]} onPress={submit} disabled={submitting} activeOpacity={0.9}>
                        {submitting ? <ActivityIndicator color="#fff7d6" /> : <Text style={styles.submitText}>Request Leave Enquiry</Text>}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

function TypePill({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity onPress={onPress} style={[styles.typePill, active && styles.activeTypePill]}>
            <Text style={[styles.typeText, active && styles.activeTypeText]}>{title}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: { padding: 20, paddingTop: 54, paddingBottom: 44 },
    backButton: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.82)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, marginBottom: 16 },
    backText: { color: '#3b2a05', fontWeight: '900' },
    eyebrow: { color: '#7a5200', fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    title: { fontSize: 28, fontWeight: '900', color: '#2f2106', marginTop: 6 },
    subtitle: { color: '#5b4515', marginTop: 8, marginBottom: 18, lineHeight: 20, fontWeight: '700' },
    card: { backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 26, padding: 16, borderWidth: 1, borderColor: 'rgba(116,83,15,0.2)' },
    label: { color: '#6b551f', fontWeight: '900', marginTop: 14, marginBottom: 8 },
    teacherName: { color: '#2f2106', fontSize: 18, fontWeight: '900' },
    typeRow: { flexDirection: 'row', gap: 10 },
    typePill: { flex: 1, borderWidth: 1, borderColor: 'rgba(122,82,0,0.25)', borderRadius: 16, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff8df' },
    activeTypePill: { backgroundColor: '#3b2a05' },
    typeText: { color: '#6b551f', fontWeight: '900' },
    activeTypeText: { color: '#fff7d6' },
    dateSummary: { marginTop: 12, backgroundColor: '#fff8df', borderRadius: 16, padding: 12, gap: 4 },
    dateText: { color: '#3b2a05', fontWeight: '900' },
    input: { minHeight: 92, textAlignVertical: 'top', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(122,82,0,0.25)', padding: 12, color: '#2f2106', fontWeight: '700', backgroundColor: '#fffdf5' },
    submitButton: { marginTop: 18, backgroundColor: '#2f2106', borderRadius: 18, paddingVertical: 15, alignItems: 'center' },
    disabledButton: { opacity: 0.7 },
    submitText: { color: '#fff7d6', fontWeight: '900', fontSize: 16 },
});
