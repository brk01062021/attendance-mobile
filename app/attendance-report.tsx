import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

export default function AttendanceReportScreen() {
    const handleLoadReport = () => {
        Alert.alert('Info', 'Attendance report API will be connected next');
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Attendance Report</Text>

            <View style={styles.card}>
                <Text style={styles.studentName}>Student 1</Text>
                <Text style={styles.present}>Present: 0 days</Text>
                <Text style={styles.absent}>Absent: 0 days</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.studentName}>Student 2</Text>
                <Text style={styles.present}>Present: 0 days</Text>
                <Text style={styles.absent}>Absent: 0 days</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.studentName}>Student 3</Text>
                <Text style={styles.present}>Present: 0 days</Text>
                <Text style={styles.absent}>Absent: 0 days</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLoadReport}>
                <Text style={styles.buttonText}>Load Attendance Report</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 22,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 27,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#111827',
    },
    card: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        padding: 15,
        marginBottom: 14,
        backgroundColor: '#f9fafb',
    },
    studentName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#111827',
    },
    present: {
        fontSize: 16,
        color: '#16a34a',
        marginBottom: 4,
    },
    absent: {
        fontSize: 16,
        color: '#dc2626',
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 40,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
});