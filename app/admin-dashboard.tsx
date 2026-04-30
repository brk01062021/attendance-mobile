import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    ActivityIndicator,
} from "react-native";
import { Calendar } from "react-native-calendars";

const BASE_URL = 'http://192.168.1.75:8080';

export default function AdminDashboardScreen() {
    const [date, setDate] = useState("2026-04-27");
    const [selectedDate, setSelectedDate] = useState("2026-04-27");
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    const [summary, setSummary] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setHasLoadedOnce(true);

            const summaryRes = await fetch(
                `${BASE_URL}/attendance/dashboard/admin?date=${date}`
            );

            const classesRes = await fetch(
                `${BASE_URL}/attendance/dashboard/admin/classes?date=${date}`
            );

            const teachersRes = await fetch(
                `${BASE_URL}/attendance/dashboard/admin/teachers?date=${date}`
            );

            const subjectsRes = await fetch(
                `${BASE_URL}/attendance/dashboard/admin/subjects?date=${date}`
            );

            if (!summaryRes.ok || !classesRes.ok || !teachersRes.ok || !subjectsRes.ok) {
                throw new Error("Failed to load dashboard data");
            }

            const summaryData = await summaryRes.json();
            const classesData = await classesRes.json();
            const teachersData = await teachersRes.json();
            const subjectsData = await subjectsRes.json();

            setSummary(summaryData || null);
            setClasses(Array.isArray(classesData) ? classesData : []);
            setTeachers(Array.isArray(teachersData) ? teachersData : []);
            setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
        } catch (error) {
            console.error(error);
            setSummary(null);
            setClasses([]);
            setTeachers([]);
            setSubjects([]);
            Alert.alert("Error", "Unable to load admin dashboard");
        } finally {
            setLoading(false);
        }
    };

    const confirmDate = () => {
        setDate(selectedDate);
        setShowCalendarModal(false);
    };

    const getHealthStatus = (percentage: number) => {
        if (percentage >= 80) return "Excellent";
        if (percentage >= 60) return "Good";
        return "Needs Attention";
    };

    const renderProgress = (percentage: number) => (
        <>
            <View style={styles.progressBarBackground}>
                <View
                    style={[
                        styles.progressBarFill,
                        { width: `${percentage}%` },
                    ]}
                />
            </View>

            <Text style={styles.statusText}>
                Status: {getHealthStatus(percentage)}
            </Text>
        </>
    );

    const noData =
        !summary &&
        classes.length === 0 &&
        teachers.length === 0 &&
        subjects.length === 0;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>

            <Text style={styles.label}>Attendance Date</Text>

            <TouchableOpacity
                style={styles.dateBox}
                onPress={() => {
                    setSelectedDate(date);
                    setShowCalendarModal(true);
                }}
            >
                <Text style={styles.dateText}>{date}</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={loadDashboard}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? "Loading..." : "Load Dashboard"}
                </Text>
            </TouchableOpacity>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            )}

            {!loading && hasLoadedOnce && noData && (
                <View style={styles.noDataContainer}>
                    <Text style={styles.noDataTitle}>No Data Found</Text>
                    <Text style={styles.noDataText}>
                        No admin dashboard data found for selected date.
                    </Text>
                </View>
            )}

            {!loading && summary && (
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>School Summary</Text>

                    <Text style={styles.cardText}>
                        Total Records: {summary.totalRecords}
                    </Text>
                    <Text style={styles.present}>Present: {summary.present}</Text>
                    <Text style={styles.absent}>Absent: {summary.absent}</Text>
                    <Text style={styles.late}>Late: {summary.late}</Text>

                    <Text style={styles.percentage}>
                        Attendance: {summary.attendancePercentage.toFixed(2)}%
                    </Text>

                    {renderProgress(summary.attendancePercentage)}
                </View>
            )}

            {!loading && classes.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Class-wise Summary</Text>

                    {classes.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={styles.cardTitle}>
                                Class {item.className} - Section {item.section}
                            </Text>

                            <Text style={styles.cardText}>
                                Total: {item.totalRecords}
                            </Text>
                            <Text style={styles.present}>Present: {item.present}</Text>
                            <Text style={styles.absent}>Absent: {item.absent}</Text>
                            <Text style={styles.late}>Late: {item.late}</Text>

                            <Text style={styles.percentage}>
                                Attendance: {item.attendancePercentage.toFixed(2)}%
                            </Text>

                            {renderProgress(item.attendancePercentage)}
                        </View>
                    ))}
                </>
            )}

            {!loading && teachers.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Teacher-wise Summary</Text>

                    {teachers.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={styles.cardTitle}>{item.teacherName}</Text>

                            <Text style={styles.cardText}>
                                Teacher ID: {item.teacherId}
                            </Text>

                            <Text style={styles.cardText}>
                                Total: {item.totalRecords}
                            </Text>

                            <Text style={styles.present}>Present: {item.present}</Text>
                            <Text style={styles.absent}>Absent: {item.absent}</Text>
                            <Text style={styles.late}>Late: {item.late}</Text>

                            <Text style={styles.percentage}>
                                Attendance: {item.attendancePercentage.toFixed(2)}%
                            </Text>

                            {renderProgress(item.attendancePercentage)}
                        </View>
                    ))}
                </>
            )}

            {!loading && subjects.length > 0 && (
                <>
                    <Text style={styles.sectionTitle}>Subject-wise Summary</Text>

                    {subjects.map((item, index) => (
                        <View key={index} style={styles.card}>
                            <Text style={styles.cardTitle}>{item.subjectName}</Text>

                            <Text style={styles.cardText}>
                                Total: {item.totalRecords}
                            </Text>

                            <Text style={styles.present}>Present: {item.present}</Text>
                            <Text style={styles.absent}>Absent: {item.absent}</Text>
                            <Text style={styles.late}>Late: {item.late}</Text>

                            <Text style={styles.percentage}>
                                Attendance: {item.attendancePercentage.toFixed(2)}%
                            </Text>

                            {renderProgress(item.attendancePercentage)}
                        </View>
                    ))}
                </>
            )}

            <Modal visible={showCalendarModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Dashboard Date</Text>

                        <Calendar
                            current={selectedDate}
                            onDayPress={(day) => setSelectedDate(day.dateString)}
                            markedDates={{
                                [selectedDate]: {
                                    selected: true,
                                    selectedColor: "#2563eb",
                                },
                            }}
                        />

                        <View style={styles.modalButtonRow}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setShowCalendarModal(false)}
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={confirmDate}
                            >
                                <Text style={styles.modalButtonText}>Confirm Date</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
    },

    title: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#1e3a8a",
        marginBottom: 20,
        textAlign: "center",
    },

    label: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
    },

    dateBox: {
        backgroundColor: "#eff6ff",
        borderWidth: 1,
        borderColor: "#93c5fd",
        borderRadius: 10,
        padding: 14,
        marginBottom: 18,
    },

    dateText: {
        fontSize: 16,
        color: "#111827",
    },

    button: {
        backgroundColor: "#2563eb",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginBottom: 20,
    },

    disabledButton: {
        backgroundColor: "#93c5fd",
    },

    buttonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "bold",
    },

    loadingContainer: {
        alignItems: "center",
        marginBottom: 20,
    },

    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: "600",
    },

    noDataContainer: {
        backgroundColor: "#fef3c7",
        borderRadius: 14,
        padding: 18,
        borderWidth: 1,
        borderColor: "#fcd34d",
        alignItems: "center",
        marginBottom: 20,
    },

    noDataTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#92400e",
        marginBottom: 6,
    },

    noDataText: {
        fontSize: 16,
        color: "#92400e",
        textAlign: "center",
    },

    summaryCard: {
        backgroundColor: "#eff6ff",
        padding: 18,
        borderRadius: 14,
        marginBottom: 20,
    },

    sectionTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#111827",
    },

    card: {
        backgroundColor: "#f9fafb",
        padding: 18,
        borderRadius: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },

    summaryTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#1e3a8a",
    },

    cardTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },

    cardText: {
        fontSize: 16,
        marginBottom: 6,
    },

    present: {
        fontSize: 16,
        color: "#16a34a",
        fontWeight: "600",
        marginBottom: 6,
    },

    absent: {
        fontSize: 16,
        color: "#dc2626",
        fontWeight: "600",
        marginBottom: 6,
    },

    late: {
        fontSize: 16,
        color: "#d97706",
        fontWeight: "600",
        marginBottom: 6,
    },

    percentage: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 8,
        color: "#1e3a8a",
    },

    progressBarBackground: {
        height: 10,
        backgroundColor: "#e5e7eb",
        borderRadius: 10,
        marginTop: 10,
        overflow: "hidden",
    },

    progressBarFill: {
        height: "100%",
        backgroundColor: "#16a34a",
        borderRadius: 10,
    },

    statusText: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 10,
        color: "#1e3a8a",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        padding: 25,
    },

    modalBox: {
        backgroundColor: "#fff",
        borderRadius: 18,
        padding: 20,
    },

    modalTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 18,
    },

    modalButtonRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 18,
    },

    cancelButton: {
        flex: 1,
        backgroundColor: "#6b7280",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },

    confirmButton: {
        flex: 1,
        backgroundColor: "#16a34a",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },

    modalButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});