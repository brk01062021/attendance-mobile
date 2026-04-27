import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '../src/services/api';

export default function HomeScreen() {
    const { teacherId, teacherName } = useLocalSearchParams();

    const [subject, setSubject] = useState('');
    const [className, setClassName] = useState('');
    const [section, setSection] = useState('');

    const [subjects, setSubjects] = useState<string[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [sections, setSections] = useState<string[]>([]);

    const [loading, setLoading] = useState(false);

    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showClassModal, setShowClassModal] = useState(false);
    const [showSectionModal, setShowSectionModal] = useState(false);

    useEffect(() => {
        loadSubjects();
    }, []);

    useEffect(() => {
        if (subject) {
            loadClasses();
            setClassName('');
            setSection('');
            setSections([]);
        }
    }, [subject]);

    useEffect(() => {
        if (subject && className) {
            loadSections();
            setSection('');
        }
    }, [className]);

    const loadSubjects = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_ENDPOINTS.teacherSubjects}?teacherId=${teacherId}`
            );

            const data = await response.json();
            setSubjects(data);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const loadClasses = async () => {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.teacherClasses}?teacherId=${teacherId}&subjectName=${subject}`
            );

            const data = await response.json();
            setClasses(data);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load classes');
        }
    };

    const loadSections = async () => {
        try {
            const response = await fetch(
                `${API_ENDPOINTS.teacherSections}?teacherId=${teacherId}&subjectName=${subject}&className=${className}`
            );

            const data = await response.json();
            setSections(data);
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Unable to load sections');
        }
    };

    const handleLoadStudents = () => {
        if (!subject || !className || !section) {
            Alert.alert('Validation', 'Please select Subject, Class and Section');
            return;
        }

        router.push({
            pathname: '/attendance',
            params: {
                teacherId,
                teacherName,
                subject,
                className,
                section,
            },
        } as any);
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.welcome}>Welcome, {teacherName}</Text>

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

            <Text style={styles.title}>Load Students</Text>

            <Text style={styles.label}>Subject</Text>
            <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setShowSubjectModal(true)}
            >
                <Text style={subject ? styles.selectText : styles.placeholderText}>
                    {subject || 'Select Subject'}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Class</Text>
            <TouchableOpacity
                style={styles.selectBox}
                disabled={!subject}
                onPress={() => setShowClassModal(true)}
            >
                <Text style={className ? styles.selectText : styles.placeholderText}>
                    {className || 'Select Class'}
                </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Section</Text>
            <TouchableOpacity
                style={styles.selectBox}
                disabled={!className}
                onPress={() => setShowSectionModal(true)}
            >
                <Text style={section ? styles.selectText : styles.placeholderText}>
                    {section || 'Select Section'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loadButton} onPress={handleLoadStudents}>
                <Text style={styles.loadButtonText}>Load Students</Text>
            </TouchableOpacity>

            {/* Subject Modal */}
            <Modal visible={showSubjectModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Subject</Text>

                        {subjects.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setSubject(item);
                                    setShowSubjectModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>{item}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowSubjectModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Class Modal */}
            <Modal visible={showClassModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Class</Text>

                        {classes.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setClassName(item);
                                    setShowClassModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>Class {item}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowClassModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Section Modal */}
            <Modal visible={showSectionModal} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Select Section</Text>

                        {sections.map((item) => (
                            <TouchableOpacity
                                key={item}
                                style={styles.optionButton}
                                onPress={() => {
                                    setSection(item);
                                    setShowSectionModal(false);
                                }}
                            >
                                <Text style={styles.optionText}>Section {item}</Text>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setShowSectionModal(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 25,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcome: {
        marginTop: 20,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 20,
    },
    menuContainer: {
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
    label: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
        color: '#374151',
    },
    selectBox: {
        borderWidth: 1,
        borderColor: '#93c5fd',
        borderRadius: 10,
        padding: 14,
        marginBottom: 18,
        backgroundColor: '#eff6ff',
    },
    selectText: {
        fontSize: 16,
        color: '#111827',
    },
    placeholderText: {
        fontSize: 16,
        color: '#6b7280',
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
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 25,
    },
    modalBox: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    optionButton: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    optionText: {
        fontSize: 17,
    },
    closeButton: {
        backgroundColor: '#dc2626',
        padding: 13,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 18,
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});