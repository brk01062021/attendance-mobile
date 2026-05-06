import React, { useState } from 'react';
import {
    ImageBackground,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, shadows, spacing } from '../src/theme';

export default function TeacherDashboard() {
    const params = useLocalSearchParams();
    const displayTeacherName = String(params.teacherName || 'Teacher');
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <ImageBackground
            source={require('../assets/branding/splash-gold.png')}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.topHeader}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>‹ Home</Text>
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Dashboard</Text>
                </View>

                <TouchableOpacity
                    style={styles.menuCircle}
                    onPress={() => setMenuVisible(true)}
                >
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>

                <Text style={styles.workspaceHeading}>
                    Teacher Workspace
                </Text>

                <Text style={styles.mainHeading}>Dashboard</Text>

                <Text style={styles.welcomeText}>
                    Welcome, {displayTeacherName}
                </Text>

                <View style={styles.workspaceCard}>
                    <Text style={styles.workspaceTitle}>
                        Today&apos;s Overview
                    </Text>

                    <View style={styles.statsGrid}>
                        <StatCard
                            emoji="📚"
                            value="4"
                            label="Classes"
                        />

                        <StatCard
                            emoji="🕒"
                            value="2"
                            label="Periods Left"
                        />

                        <StatCard
                            emoji="✅"
                            value="86%"
                            label="Attendance"
                        />

                        <StatCard
                            emoji="🗓️"
                            value="0"
                            label="Leaves"
                        />
                    </View>

                    <View style={styles.attendanceCard}>
                        <Text style={styles.attendanceTitle}>
                            Attendance Percentage
                        </Text>

                        <Text style={styles.attendanceValue}>
                            86%
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>
                    Quick Actions
                </Text>

                <View style={styles.quickGrid}>
                    <QuickActionCard
                        emoji="✅"
                        title="Take Attendance"
                        subtitle="Submit class attendance"
                        onPress={() => router.push('/home' as any)}
                    />

                    <QuickActionCard
                        emoji="📊"
                        title="Dashboard"
                        subtitle="Today and class-wise view"
                        onPress={() =>
                            router.push('/teacher-dashboard' as any)
                        }
                    />

                    <QuickActionCard
                        emoji="📅"
                        title="Date Summary"
                        subtitle="Daily attendance overview"
                        onPress={() =>
                            router.push('/date-summary' as any)
                        }
                    />

                    <QuickActionCard
                        emoji="📄"
                        title="Reports"
                        subtitle="Attendance analytics"
                        onPress={() =>
                            router.push('/attendance-report' as any)
                        }
                    />
                </View>
            </ScrollView>

            <Modal visible={menuVisible} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <Text style={styles.menuTitle}>
                            Teacher Menu
                        </Text>

                        <MenuItem
                            title="Home"
                            onPress={() => setMenuVisible(false)}
                        />

                        <MenuItem
                            title="Take Attendance"
                            onPress={() => {
                                setMenuVisible(false);
                                router.push('/home' as any);
                            }}
                        />

                        <MenuItem
                            title="Reports"
                            onPress={() => {
                                setMenuVisible(false);
                                router.push('/attendance-report' as any);
                            }}
                        />

                        <MenuItem
                            title="Logout"
                            onPress={() => {
                                setMenuVisible(false);
                                router.replace('/login' as any);
                            }}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </ImageBackground>
    );
}

function StatCard({
                      emoji,
                      value,
                      label,
                  }: {
    emoji: string;
    value: string;
    label: string;
}) {
    return (
        <View style={styles.statCard}>
            <Text style={styles.statEmoji}>
                {emoji}
            </Text>

            <Text style={styles.statValue}>
                {value}
            </Text>

            <Text style={styles.statLabel}>
                {label}
            </Text>
        </View>
    );
}

function QuickActionCard({
                             emoji,
                             title,
                             subtitle,
                             onPress,
                         }: {
    emoji: string;
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={styles.quickCard}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <Text style={styles.quickEmoji}>
                {emoji}
            </Text>

            <Text style={styles.quickTitle}>
                {title}
            </Text>

            <Text style={styles.quickSubtitle}>
                {subtitle}
            </Text>
        </TouchableOpacity>
    );
}

function MenuItem({
                      title,
                      onPress,
                  }: {
    title: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={onPress}
        >
            <Text style={styles.menuItemText}>
                {title}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: '#F6E7B0',
    },

    container: {
        padding: spacing.screenPadding,
        paddingBottom: 140,
    },

    topHeader: {
        marginTop: spacing.xxxl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
    },

    backButton: {
        backgroundColor: 'rgba(255,255,255,0.7)',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 20,
    },

    backButtonText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primaryNavy,
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginRight: 90,
    },

    menuCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end',
        marginBottom: spacing.lg,
    },

    menuIcon: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    workspaceHeading: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    mainHeading: {
        fontSize: 56,
        lineHeight: 62,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    welcomeText: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primaryNavy,
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },

    workspaceCard: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        ...shadows.medium,
    },

    workspaceTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.lg,
    },

    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    statCard: {
        width: '48%',
        backgroundColor: colors.white,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        alignItems: 'center',
        paddingVertical: spacing.xl,
        marginBottom: spacing.lg,
    },

    statEmoji: {
        fontSize: 34,
        marginBottom: spacing.md,
    },

    statValue: {
        fontSize: 34,
        fontWeight: '900',
        color: colors.primaryNavy,
    },

    statLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.slateText,
        marginTop: spacing.sm,
    },

    attendanceCard: {
        backgroundColor: colors.primaryNavy,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
    },

    attendanceTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.premiumGold,
    },

    attendanceValue: {
        fontSize: 52,
        fontWeight: '900',
        color: colors.white,
        marginTop: spacing.md,
    },

    sectionTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginTop: spacing.xxl,
        marginBottom: spacing.lg,
    },

    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    quickCard: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: colors.cardGoldBorder,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        minHeight: 190,
        ...shadows.medium,
    },

    quickEmoji: {
        fontSize: 42,
        marginBottom: spacing.lg,
    },

    quickTitle: {
        fontSize: 21,
        fontWeight: '900',
        color: colors.primaryNavy,
        lineHeight: 28,
    },

    quickSubtitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.slateText,
        marginTop: spacing.md,
        lineHeight: 22,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },

    menuContainer: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: spacing.xl,
    },

    menuTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.primaryNavy,
        marginBottom: spacing.lg,
    },

    menuItem: {
        backgroundColor: '#FFF8E1',
        borderRadius: 18,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },

    menuItemText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primaryNavy,
    },
});