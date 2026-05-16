import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { dashboardTheme } from '../../theme/dashboardTheme';
import DashboardMenuItem from './DashboardMenuItem';
import { DashboardMenuConfig, DashboardRole, roleMenus } from './roleMenus';

type Props = {
    visible: boolean;
    role: DashboardRole;
    title: string;
    subtitle?: string;
    onClose: () => void;
    onSelect: (item: DashboardMenuConfig) => void;
};

export default function DashboardDrawer({ visible, role, title, subtitle, onClose, onSelect }: Props) {
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={styles.drawer} activeOpacity={1}>
                    <View style={styles.handle} />
                    <Text style={styles.eyebrow}>{role} MENU</Text>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuList}>
                        {roleMenus[role].map((item) => (
                            <DashboardMenuItem key={`${item.label}-${item.route || item.action}`} item={item} onPress={onSelect} />
                        ))}
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'flex-end',
    },
    drawer: {
        maxHeight: '88%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        backgroundColor: 'rgba(7,20,38,0.98)',
        borderWidth: 1,
        borderColor: dashboardTheme.colors.border,
    },
    handle: {
        alignSelf: 'center',
        width: 52,
        height: 5,
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.30)',
        marginBottom: 16,
    },
    eyebrow: {
        color: dashboardTheme.colors.goldSoft,
        fontSize: 11,
        letterSpacing: 1,
        fontWeight: '900',
    },
    title: {
        color: dashboardTheme.colors.white,
        fontSize: 24,
        fontWeight: '900',
        marginTop: 4,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 13,
        marginTop: 6,
        lineHeight: 18,
    },
    menuList: { paddingTop: 16, paddingBottom: 20 },
});
