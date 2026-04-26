import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';

export default function DateSummaryScreen() {
    const handleLoadSummary = () => {
        Alert.alert('Info', 'Date summary API will be connected next');
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Date Summary</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>Today</Text>

                <Text style={styles.label}>Total Students</Text>
                <Text style={styles.value}>5</Text>

                <Text style={styles.label}>Present</Text>
                <Text style={styles.present}>0</Text>

                <Text style={styles.label}>Absent</Text>
                <Text style={styles.absent}>0</Text>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLoadSummary}>
                <Text style={styles.buttonText}>Load Date Summary</Text>
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
        padding: 18,
        backgroundColor: '#f9fafb',
    },
    label: {
        fontSize: 15,
        color: '#6b7280',
        marginTop: 10,
    },
    value: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#111827',
    },
    present: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#16a34a',
    },
    absent: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#dc2626',
    },
    button: {
        backgroundColor: '#2563eb',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 25,
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
});