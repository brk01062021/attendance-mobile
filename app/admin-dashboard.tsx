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

const BASE_URL = "http://192.168.1.75:8080";

export default function AdminDashboardScreen() {
    const todayString = new Date().toISOString().split("T")[0];

    const [date, setDate] = useState(todayString);
    const [selectedDate, setSelectedDate] = useState(todayString);
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
                        { width: `${Math.min(Math.max(percentage, 0), 100)}%` },
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
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Whole School Attendance Overview</Text>

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
                        Attendance: {Number(summary.attendancePercentage || 0).toFixed(2)}%
                    </Text>

                    {renderProgress(Number(summary.attendancePercentage || 0))}
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
                                Attendance: {Number(item.attendancePercentage || 0).toFixed(2)}%
                            </Text>

                            {renderProgress(Number(item.attendancePercentage || 0))}
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
                                Attendance: {Number(item.attendancePercentage || 0).toFixed(2)}%
                            </Text>

                            {renderProgress(Number(item.attendancePercentage || 0))}
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
                                Attendance: {Number(item.attendancePercentage || 0).toFixed(2)}%
                            </Text>

                            {renderProgress(Number(item.attendancePercentage || 0))}
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
                                    selectedColor: "#c69214",
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
        backgroundColor: "#fffdf7",
    },
    scrollContent: {
        padding: 25,
        paddingBottom: 70,
    },
    title: {
        fontSize: 42,
        fontWeight: "bold",
        color: "#7a4f01",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#374151",
        marginBottom: 32,
    },
    label: {
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 10,
        color: "#374151",
    },
    dateBox: {
        backgroundColor: "#fff8e7",
        borderWidth: 1.5,
        borderColor: "#f0d58a",
        borderRadius: 14,
        padding: 16,
        marginBottom: 22,
    },
    dateText: {
        fontSize: 20,
        color: "#111827",
    },
    button: {
        backgroundColor: "#7a4f01",
        padding: 17,
        borderRadius: 14,
        alignItems: "center",
        marginBottom: 24,
    },
    disabledButton: {
        backgroundColor: "#d8bd72",
    },
    buttonText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    loadingContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: "700",
        color: "#374151",
    },
    noDataContainer: {
        backgroundColor: "#fff8e7",
        borderRadius: 16,
        padding: 18,
        borderWidth: 1.5,
        borderColor: "#f0d58a",
        alignItems: "center",
        marginBottom: 20,
    },
    noDataTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#7a4f01",
        marginBottom: 6,
    },
    noDataText: {
        fontSize: 16,
        color: "#7a4f01",
        textAlign: "center",
    },
    summaryCard: {
        backgroundColor: "#fff8e7",
        padding: 20,
        borderRadius: 18,
        marginBottom: 24,
        borderWidth: 1.5,
        borderColor: "#f0d58a",
    },
    sectionTitle: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 14,
        color: "#7a4f01",
    },
    card: {
        backgroundColor: "#fffdf7",
        padding: 20,
        borderRadius: 18,
        marginBottom: 18,
        borderWidth: 1.5,
        borderColor: "#f0d58a",
    },
    summaryTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 14,
        color: "#7a4f01",
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 12,
        color: "#111827",
    },
    cardText: {
        fontSize: 17,
        marginBottom: 7,
        color: "#374151",
        fontWeight: "600",
    },
    present: {
        fontSize: 17,
        color: "#166534",
        fontWeight: "800",
        marginBottom: 7,
    },
    absent: {
        fontSize: 17,
        color: "#991b1b",
        fontWeight: "800",
        marginBottom: 7,
    },
    late: {
        fontSize: 17,
        color: "#92400e",
        fontWeight: "800",
        marginBottom: 7,
    },
    percentage: {
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 10,
        color: "#7a4f01",
    },
    progressBarBackground: {
        height: 12,
        backgroundColor: "#f3ead1",
        borderRadius: 12,
        marginTop: 12,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#c69214",
        borderRadius: 12,
    },
    statusText: {
        fontSize: 17,
        fontWeight: "bold",
        marginTop: 12,
        color: "#374151",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        padding: 25,
    },
    modalBox: {
        backgroundColor: "#fffdf7",
        borderRadius: 20,
        padding: 20,
        borderWidth: 1.5,
        borderColor: "#f0d58a",
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 18,
        color: "#7a4f01",
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
        borderRadius: 12,
        alignItems: "center",
    },
    confirmButton: {
        flex: 1,
        backgroundColor: "#7a4f01",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    modalButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
});