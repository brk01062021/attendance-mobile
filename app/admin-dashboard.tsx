import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";

const BASE_URL = "http://localhost:8080";

export default function AdminDashboardScreen() {
    const [date, setDate] = useState("2026-04-27");

    const [summary, setSummary] = useState<any>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);

    const loadDashboard = async () => {
        try {
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

            setSummary(await summaryRes.json());
            setClasses(await classesRes.json());
            setTeachers(await teachersRes.json());
            setSubjects(await subjectsRes.json());
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Unable to load admin dashboard");
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Admin Dashboard</Text>

            <Text style={styles.label}>Attendance Date</Text>
            <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
            />

            <TouchableOpacity style={styles.button} onPress={loadDashboard}>
                <Text style={styles.buttonText}>Load Dashboard</Text>
            </TouchableOpacity>

            {summary && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>School Summary</Text>
                    <Text>Total Records: {summary.totalRecords}</Text>
                    <Text>Present: {summary.present}</Text>
                    <Text>Absent: {summary.absent}</Text>
                    <Text>Late: {summary.late}</Text>
                    <Text>
                        Attendance: {summary.attendancePercentage.toFixed(2)}%
                    </Text>
                </View>
            )}

            <Text style={styles.sectionTitle}>Class-wise Summary</Text>
            {classes.map((item, index) => (
                <View key={index} style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Class {item.className} - Section {item.section}
                    </Text>
                    <Text>Total: {item.totalRecords}</Text>
                    <Text>Present: {item.present}</Text>
                    <Text>Absent: {item.absent}</Text>
                    <Text>Late: {item.late}</Text>
                    <Text>Attendance: {item.attendancePercentage.toFixed(2)}%</Text>
                </View>
            ))}

            <Text style={styles.sectionTitle}>Teacher-wise Summary</Text>
            {teachers.map((item, index) => (
                <View key={index} style={styles.card}>
                    <Text style={styles.cardTitle}>{item.teacherName}</Text>
                    <Text>Teacher ID: {item.teacherId}</Text>
                    <Text>Total: {item.totalRecords}</Text>
                    <Text>Present: {item.present}</Text>
                    <Text>Absent: {item.absent}</Text>
                    <Text>Late: {item.late}</Text>
                    <Text>Attendance: {item.attendancePercentage.toFixed(2)}%</Text>
                </View>
            ))}

            <Text style={styles.sectionTitle}>Subject-wise Summary</Text>
            {subjects.map((item, index) => (
                <View key={index} style={styles.card}>
                    <Text style={styles.cardTitle}>{item.subjectName}</Text>
                    <Text>Total: {item.totalRecords}</Text>
                    <Text>Present: {item.present}</Text>
                    <Text>Absent: {item.absent}</Text>
                    <Text>Late: {item.late}</Text>
                    <Text>Attendance: {item.attendancePercentage.toFixed(2)}%</Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#f5f5f5",
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    label: {
        fontSize: 16,
        marginBottom: 6,
    },
    input: {
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    button: {
        backgroundColor: "#2563eb",
        padding: 14,
        borderRadius: 8,
        marginBottom: 20,
    },
    buttonText: {
        color: "white",
        textAlign: "center",
        fontWeight: "bold",
        fontSize: 16,
    },
    card: {
        backgroundColor: "white",
        padding: 14,
        borderRadius: 10,
        marginBottom: 12,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 6,
    },
    sectionTitle: {
        fontSize: 21,
        fontWeight: "bold",
        marginTop: 18,
        marginBottom: 10,
    },
});