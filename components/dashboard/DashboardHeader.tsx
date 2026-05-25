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

export default function DashboardHeader({ schoolName, workspaceTitle, roleLabel, schoolId, onMenuPress, onLogoutPress, operationsSubtitle = '' }: Props) {
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
                {operationsSubtitle ? <Text style={styles.operationsSubtitle}>{operationsSubtitle}</Text> : null}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerShell: { marginBottom: 16, paddingTop: 6 },
    headerActionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12, minHeight: 44 },
    circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: dashboardTheme.colors.border },
    circleText: { color: dashboardTheme.colors.white, fontSize: 20, fontWeight: '900' },
    logoutButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: dashboardTheme.colors.border },
    logoutText: { color: dashboardTheme.colors.goldSoft, fontSize: 18, fontWeight: '900' },
    chipRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6, flexWrap: 'wrap', paddingHorizontal: 2 },
    roleChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(248,223,155,0.18)', borderWidth: 1, borderColor: 'rgba(248,223,155,0.36)' },
    roleChipText: { color: dashboardTheme.colors.goldSoft, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    schoolChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
    schoolChipText: { color: 'rgba(255,255,255,0.86)', fontSize: 11, fontWeight: '800' },
    titleBlock: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 4,
        borderRadius: 26,
        backgroundColor: 'rgba(255,248,225,0.94)',
        borderWidth: 1.2,
        borderColor: 'rgba(238,213,138,0.92)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 4,
    },
    schoolName: { color: '#061B33', fontSize: 24, lineHeight: 29, fontWeight: '900', textAlign: 'center', letterSpacing: -0.6 },
    workspace: { marginTop: 6, color: '#A06F00', fontSize: 15, lineHeight: 20, fontWeight: '900', textAlign: 'center', letterSpacing: 0.1 },
    operationsSubtitle: { marginTop: 8, color: 'rgba(6,27,51,0.70)', fontSize: 12, fontWeight: '800', textAlign: 'center', lineHeight: 17 },
});
