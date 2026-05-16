import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardTheme } from '../../theme/dashboardTheme';
import type { DashboardMenuConfig } from './roleMenus';

type Props = {
    item: DashboardMenuConfig;
    onPress: (item: DashboardMenuConfig) => void;
};

export default function DashboardMenuItem({ item, onPress }: Props) {
    return (
        <TouchableOpacity style={styles.row} activeOpacity={0.86} onPress={() => onPress(item)}>
            <View style={styles.iconBox}>
                <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <View style={styles.textBox}>
                <Text style={styles.title}>{item.label}</Text>
                {item.description ? <Text style={styles.subtitle}>{item.description}</Text> : null}
            </View>
            <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: dashboardTheme.colors.border,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginBottom: 10,
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(215,168,79,0.18)',
        marginRight: 10,
    },
    icon: { fontSize: 18 },
    textBox: { flex: 1 },
    title: { color: dashboardTheme.colors.white, fontWeight: '900', fontSize: 14 },
    subtitle: { color: 'rgba(255,255,255,0.70)', fontSize: 11, marginTop: 2, lineHeight: 15 },
    arrow: { color: dashboardTheme.colors.goldSoft, fontSize: 26, fontWeight: '800' },
});
