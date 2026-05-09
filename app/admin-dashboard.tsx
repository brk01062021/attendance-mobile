import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ImageBackground,
    Modal,
    Alert,
} from "react-native";
import { router } from "expo-router";

export default function AdminDashboardScreen() {
    const [menuVisible, setMenuVisible] = useState(false);

    const openRoute = (path: string) => {
        setMenuVisible(false);
        router.push({ pathname: path as any });
    };

    const logout = () => {
        setMenuVisible(false);
        router.replace("/login");
    };

    return (
        <ImageBackground
            source={require("../assets/branding/splash-dark.png")}
            style={styles.background}
            resizeMode="cover"
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.topRow}>
                    <TouchableOpacity
                        style={styles.circleButton}
                        onPress={() => setMenuVisible(true)}
                    >
                        <Text style={styles.circleButtonText}>☰</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.circleButton}
                        onPress={() => openRoute("/create-school-notice")}
                    >
                        <Text style={styles.micText}>🎙️</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.greeting}>Good Morning 👋</Text>
                <Text style={styles.principalText}>Principal</Text>

                <View style={styles.overviewCard}>
                    <Text style={styles.overviewTitle}>Today&apos;s Overview</Text>

                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statIcon}>👥</Text>
                            <Text style={styles.statNumber}>17</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>

                        <View style={styles.statBox}>
                            <Text style={styles.statIcon}>✅</Text>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Present</Text>
                        </View>

                        <View style={styles.statBox}>
                            <Text style={styles.statIcon}>🚫</Text>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                        </View>

                        <View style={styles.statBox}>
                            <Text style={styles.statIcon}>⏰</Text>
                            <Text style={styles.statNumber}>0</Text>
                            <Text style={styles.statLabel}>Late</Text>
                        </View>
                    </View>

                    <View style={styles.percentageBox}>
                        <Text style={styles.percentageLabel}>Attendance Percentage</Text>
                        <Text style={styles.percentageValue}>0.00%</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Quick Actions</Text>

                <View style={styles.quickGrid}>
                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => openRoute("/attendance-report")}
                    >
                        <Text style={styles.quickIcon}>🎓</Text>
                        <Text style={styles.quickTitle}>Attendance Report</Text>
                        <Text style={styles.quickText}>Daily attendance reports</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => openRoute("/admin-teacher-dashboard")}
                    >
                        <Text style={styles.quickIcon}>✅</Text>
                        <Text style={styles.quickTitle}>Teacher Replacements</Text>
                        <Text style={styles.quickText}>Leave replacement flow</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => openRoute("/teacher-leave-planning")}
                    >
                        <Text style={styles.quickIcon}>🗓️</Text>
                        <Text style={styles.quickTitle}>Leave Planning</Text>
                        <Text style={styles.quickText}>Plan teacher leave</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => openRoute("/create-school-notice")}
                    >
                        <Text style={styles.quickIcon}>🎙️</Text>
                        <Text style={styles.quickTitle}>Create Notice</Text>
                        <Text style={styles.quickText}>Publish school notice</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={menuVisible} transparent animationType="slide">
                <View style={styles.menuOverlay}>
                    <View style={styles.menuBox}>
                        <TouchableOpacity
                            style={styles.menuCloseButton}
                            onPress={() => setMenuVisible(false)}
                        >
                            <Text style={styles.menuCloseText}>×</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openRoute("/admin-teacher-dashboard")}
                        >
                            <Text style={styles.menuItemText}>
                                Admin Teacher&apos;s Dashboard
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openRoute("/teacher-leave-planning")}
                        >
                            <Text style={styles.menuItemText}>Teacher Leave Planning</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openRoute("/attendance-report")}
                        >
                            <Text style={styles.menuItemText}>Attendance Report</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => openRoute("/create-school-notice")}
                        >
                            <Text style={styles.menuItemText}>Create School Notice</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() =>
                                Alert.alert(
                                    "Coming Soon",
                                    "Import School Data screen will be connected next."
                                )
                            }
                        >
                            <Text style={styles.menuItemText}>Import School Data</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() =>
                                Alert.alert(
                                    "Coming Soon",
                                    "Register Teacher screen will be connected next."
                                )
                            }
                        >
                            <Text style={styles.menuItemText}>Register Teacher</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() =>
                                Alert.alert(
                                    "Coming Soon",
                                    "Register Parent screen will be connected next."
                                )
                            }
                        >
                            <Text style={styles.menuItemText}>Register Parent</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() =>
                                Alert.alert(
                                    "Coming Soon",
                                    "Register Student screen will be connected next."
                                )
                            }
                        >
                            <Text style={styles.menuItemText}>Register Student</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() =>
                                Alert.alert(
                                    "Coming Soon",
                                    "Teacher Assignments screen will be connected next."
                                )
                            }
                        >
                            <Text style={styles.menuItemText}>Teacher Assignments</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={logout}>
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#061B33",
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 70,
        paddingBottom: 90,
    },
    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 56,
    },
    circleButton: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 2,
        borderColor: "#e5be3f",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(2,18,38,0.65)",
    },
    circleButtonText: {
        fontSize: 30,
        color: "#e5be3f",
        fontWeight: "bold",
    },
    micText: {
        fontSize: 29,
    },
    greeting: {
        fontSize: 28,
        fontWeight: "900",
        color: "#e5be3f",
        marginBottom: 6,
    },
    principalText: {
        fontSize: 52,
        fontWeight: "900",
        color: "#ffffff",
        marginBottom: 36,
    },
    overviewCard: {
        backgroundColor: "rgba(255,255,255,0.96)",
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: "#e5be3f",
        padding: 20,
        marginBottom: 30,
    },
    overviewTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: "#061B33",
        marginBottom: 20,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    statBox: {
        width: "48%",
        backgroundColor: "#ffffff",
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: "#e5be3f",
        alignItems: "center",
        paddingVertical: 20,
        marginBottom: 14,
    },
    statIcon: {
        fontSize: 30,
        marginBottom: 8,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: "900",
        color: "#061B33",
    },
    statLabel: {
        fontSize: 17,
        fontWeight: "800",
        color: "#6b7280",
        marginTop: 4,
    },
    percentageBox: {
        backgroundColor: "#061B33",
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: "#e5be3f",
        padding: 18,
        marginTop: 6,
    },
    percentageLabel: {
        color: "#e5be3f",
        fontSize: 19,
        fontWeight: "900",
        marginBottom: 8,
    },
    percentageValue: {
        color: "#ffffff",
        fontSize: 42,
        fontWeight: "900",
    },
    sectionTitle: {
        fontSize: 28,
        fontWeight: "900",
        color: "#e5be3f",
        marginBottom: 16,
    },
    quickGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    quickCard: {
        width: "48%",
        backgroundColor: "rgba(255,255,255,0.94)",
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "#e5be3f",
        padding: 14,
        minHeight: 142,
        marginBottom: 16,
        justifyContent: "center",
    },
    quickIcon: {
        fontSize: 30,
        marginBottom: 10,
    },
    quickTitle: {
        fontSize: 17,
        fontWeight: "900",
        color: "#061B33",
        marginBottom: 6,
    },
    quickText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#6b7280",
        lineHeight: 18,
    },
    menuOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "flex-start",
    },
    menuBox: {
        marginTop: 70,
        marginHorizontal: 18,
        backgroundColor: "#ffffff",
        borderRadius: 22,
        overflow: "hidden",
        maxHeight: "88%",
    },
    menuCloseButton: {
        alignSelf: "flex-end",
        paddingHorizontal: 22,
        paddingTop: 12,
    },
    menuCloseText: {
        fontSize: 34,
        fontWeight: "bold",
        color: "#111827",
    },
    menuItem: {
        paddingVertical: 20,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    menuItemText: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
    },
    logoutText: {
        fontSize: 24,
        fontWeight: "900",
        color: "#dc2626",
    },
});