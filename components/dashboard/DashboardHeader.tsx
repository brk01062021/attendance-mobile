import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardTheme } from '../../theme/dashboardTheme';

type Props = {
    schoolName: string;
    workspaceTitle: string;
    roleLabel: string;
    schoolId: string;
    onMenuPress: () => void;
    onLogoutPress: () => void;
    operationsSubtitle?: string;
};

export default function DashboardHeader({ schoolName, workspaceTitle, roleLabel, schoolId, onMenuPress, onLogoutPress, operationsSubtitle = 'Attendance • Reports • Leave • Timetable • School Operations' }: Props) {
    return (
        <View style={styles.headerShell}>
            <View style={styles.headerActionsRow}>
                <TouchableOpacity style={styles.circleButton} onPress={onMenuPress} activeOpacity={0.85}>
                    <Text style={styles.circleText}>☰</Text>
                </TouchableOpacity>

                <View style={styles.chipRow}>
                    <View style={styles.roleChip}><Text style={styles.roleChipText}>{roleLabel}</Text></View>
                    <View style={styles.schoolChip}><Text style={styles.schoolChipText}>school_id: {schoolId}</Text></View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress} activeOpacity={0.85}>
                    <Text style={styles.logoutText}>⏻</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.titleBlock}>
                <Text style={styles.schoolName}>{schoolName}</Text>
                <Text style={styles.workspace}>VidyaSetu ERP • {workspaceTitle}</Text>
                <Text style={styles.operationsSubtitle}>{operationsSubtitle}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerShell: { marginBottom: 22 },
    headerActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
    circleButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: dashboardTheme.colors.border },
    circleText: { color: dashboardTheme.colors.white, fontSize: 20, fontWeight: '900' },
    logoutButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: dashboardTheme.colors.border },
    logoutText: { color: dashboardTheme.colors.goldSoft, fontSize: 18, fontWeight: '900' },
    chipRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
    roleChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(248,223,155,0.18)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.36)' },
    roleChipText: { color: dashboardTheme.colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    schoolChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
    schoolChipText: { color: 'rgba(255,255,255,0.86)', fontSize: 11, fontWeight: '800' },
    titleBlock: { alignItems: 'center', paddingHorizontal: 14 },
    schoolName: { color: '#fff7df', fontSize: 27, fontWeight: '900', textAlign: 'center', letterSpacing: -0.6, textShadowColor: 'rgba(0,0,0,0.55)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    workspace: { marginTop: 6, color: dashboardTheme.colors.goldSoft, fontSize: 15, fontWeight: '900', textAlign: 'center', letterSpacing: 0.1 },
    operationsSubtitle: { marginTop: 7, color: 'rgba(255,255,255,0.66)', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 17 },
});
