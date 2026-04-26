import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
    const [className, setClassName] = useState('');
    const [section, setSection] = useState('');

    const handleLoadStudents = () => {
        if (!className.trim() || !section.trim()) {
            alert('Please enter Class Name and Section');
            return;
        }

        router.push({
            pathname: '/attendance',
            params: {
                className,
                section,
            },
        } as any);
    };

    return (
        <View style={styles.container}>
            {/* Menu buttons */}
            <View style={styles.menuContainer}>
                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => router.push('/date-summary' as any)}
                >
                    <Text style={styles.menuText}>Load Date Summary</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuButton}
                    onPress={() => router.push('/attendance-report' as any)}
                >
                    <Text style={styles.menuText}>Load Attendance Report</Text>
                </TouchableOpacity>
            </View>

            {/* Main section */}
            <Text style={styles.title}>Load Students</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter Class Name"
                value={className}
                onChangeText={setClassName}
            />

            <TextInput
                style={styles.input}
                placeholder="Enter Section"
                value={section}
                onChangeText={setSection}
            />

            <TouchableOpacity
                style={styles.loadButton}
                onPress={handleLoadStudents}
            >
                <Text style={styles.loadButtonText}>Load Students</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 25,
    },
    menuContainer: {
        marginTop: 20,
        marginBottom: 35,
    },
    menuButton: {
        backgroundColor: '#e0ecff',
        padding: 14,
        borderRadius: 10,
        marginBottom: 12,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e3a8a',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 25,
        color: '#111827',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 18,
        backgroundColor: '#f9fafb',
    },
    loadButton: {
        backgroundColor: '#16a34a',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    loadButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
});