import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardTheme } from '../../theme/dashboardTheme';

type Props = {
    title: string;
    onMenuPress: () => void;
    onLogoutPress: () => void;
};

export default function DashboardHeader({ title, onMenuPress, onLogoutPress }: Props) {
    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.circleButton} onPress={onMenuPress} activeOpacity={0.85}>
                <Text style={styles.circleText}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogoutPress} activeOpacity={0.85}>
                <Text style={styles.logoutText}>⏻</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    circleButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: dashboardTheme.colors.border,
    },
    circleText: { color: dashboardTheme.colors.white, fontSize: 20, fontWeight: '900' },
    title: { flex: 1, color: dashboardTheme.colors.white, textAlign: 'center', fontSize: 18, fontWeight: '900' },
    logoutButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: dashboardTheme.colors.border,
    },
    logoutText: { color: dashboardTheme.colors.goldSoft, fontSize: 18, fontWeight: '900' },
});
