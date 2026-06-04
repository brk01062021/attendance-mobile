import { createSchoolNotice } from "@/src/services/schoolNoticeApi";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const NOTICE_TYPES = ["GENERAL", "HOLIDAY", "EXAM", "EVENT", "EMERGENCY"];

export default function CreateSchoolNoticeScreen() {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [noticeType, setNoticeType] = useState("GENERAL");
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const validateForm = () => {
        if (!title.trim()) {
            Alert.alert("Missing Title", "Please enter notice title.");
            return false;
        }

        if (!message.trim()) {
            Alert.alert("Missing Message", "Please enter notice message.");
            return false;
        }

        if (title.trim().length < 3) {
            Alert.alert("Invalid Title", "Title should be at least 3 characters.");
            return false;
        }

        if (message.trim().length < 5) {
            Alert.alert("Invalid Message", "Message should be at least 5 characters.");
            return false;
        }

        return true;
    };

    const publishNotice = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            await createSchoolNotice({
                schoolId: 1,
                title: title.trim(),
                message: message.trim(),
                noticeType,
                createdByRole: "ADMIN",
                createdByUserId: 1,
            });

            Alert.alert(
                "Notice Published",
                "School notice has been published successfully to Parents, Teachers and Students.",
                [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error) {
            console.error(error);
            Alert.alert(
                "Publish Failed",
                "Unable to publish school notice. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require("../assets/branding/splash-gold.png")}
            style={styles.background}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Text style={styles.backButtonText}>‹</Text>
                        </TouchableOpacity>

                        <View style={styles.headerTextBox}>
                            <Text style={styles.title}>Create Notice</Text>
                            <Text style={styles.subtitle}>Publish school-wide announcement</Text>
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.label}>Notice Title</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Example: Holiday Tomorrow"
                            placeholderTextColor="#9ca3af"
                            editable={!loading}
                        />

                        <Text style={styles.label}>Notice Type</Text>
                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() => setShowTypeModal(true)}
                            disabled={loading}
                        >
                            <Text style={styles.dropdownText}>{noticeType}</Text>
                            <Text style={styles.dropdownArrow}>⌄</Text>
                        </TouchableOpacity>

                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            style={styles.messageInput}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Enter notice message..."
                            placeholderTextColor="#9ca3af"
                            multiline
                            textAlignVertical="top"
                            editable={!loading}
                        />

                        <View style={styles.previewCard}>
                            <Text style={styles.previewLabel}>Preview</Text>
                            <Text style={styles.previewTitle}>
                                {title.trim() || "Notice title will appear here"}
                            </Text>
                            <Text style={styles.previewType}>{noticeType}</Text>
                            <Text style={styles.previewMessage}>
                                {message.trim() || "Notice message will appear here."}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.publishButton, loading && styles.disabledButton]}
                            onPress={publishNotice}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.publishButtonText}>Publish Notice</Text>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.noteText}>
                            This notice will auto-broadcast to Parent, Teacher and Student
                            notifications.
                        </Text>
                    </View>
                </ScrollView>

                <Modal visible={showTypeModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Select Notice Type</Text>

                            {NOTICE_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeOption,
                                        noticeType === type && styles.selectedTypeOption,
                                    ]}
                                    onPress={() => {
                                        setNoticeType(type);
                                        setShowTypeModal(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.typeOptionText,
                                            noticeType === type && styles.selectedTypeOptionText,
                                        ]}
                                    >
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={styles.modalCancelButton}
                                onPress={() => setShowTypeModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: "#fffdf7",
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 22,
        paddingTop: 72,
        paddingBottom: 60,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
    },
    backButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: "rgba(122, 79, 1, 0.92)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
    },
    backButtonText: {
        color: "#fff",
        fontSize: 28,
        lineHeight: 42,
        fontWeight: "bold",
    },
    headerTextBox: {
        flex: 1,
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#7a4f01",
    },
    subtitle: {
        fontSize: 16,
        fontWeight: "800",
        color: "#374151",
        marginTop: 4,
    },
    formCard: {
        backgroundColor: "rgba(255, 253, 247, 0.96)",
        borderRadius: 22,
        padding: 20,
        borderWidth: 1.5,
        borderColor: "#f0d58a",
    },
    label: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#7a4f01",
        marginBottom: 8,
        marginTop: 12,
    },
    input: {
        backgroundColor: "#fff8e7",
        borderWidth: 1.5,
        borderColor: "#f0d58a",
        borderRadius: 14,
        padding: 15,
        fontSize: 17,
        color: "#111827",
        fontWeight: "600",
    },
    dropdown: {
        backgroundColor: "#fff8e7",
        borderWidth: 1.5,
        borderColor: "#f0d58a",
        borderRadius: 14,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dropdownText: {
        fontSize: 17,
        color: "#111827",
        fontWeight: "800",
    },
    dropdownArrow: {
        fontSize: 24,
        color: "#7a4f01",
        fontWeight: "bold",
    },
    messageInput: {
        backgroundColor: "#fff8e7",
        borderWidth: 1.5,
        borderColor: "#f0d58a",
        borderRadius: 14,
        padding: 15,
        fontSize: 17,
        color: "#111827",
        fontWeight: "600",
        minHeight: 150,
    },
    previewCard: {
        backgroundColor: "#fffdf7",
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: "#f0d58a",
        padding: 16,
        marginTop: 22,
        marginBottom: 20,
    },
    previewLabel: {
        fontSize: 14,
        fontWeight: "900",
        color: "#92400e",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    previewTitle: {
        fontSize: 21,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 8,
    },
    previewType: {
        alignSelf: "flex-start",
        backgroundColor: "#7a4f01",
        color: "#fff",
        fontSize: 13,
        fontWeight: "bold",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        marginBottom: 10,
    },
    previewMessage: {
        fontSize: 16,
        fontWeight: "600",
        color: "#374151",
        lineHeight: 23,
    },
    publishButton: {
        backgroundColor: "#7a4f01",
        padding: 17,
        borderRadius: 15,
        alignItems: "center",
    },
    disabledButton: {
        backgroundColor: "#d8bd72",
    },
    publishButtonText: {
        color: "#fff",
        fontSize: 19,
        fontWeight: "bold",
    },
    noteText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#6b7280",
        textAlign: "center",
        marginTop: 14,
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        justifyContent: "center",
        padding: 24,
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
        color: "#7a4f01",
        marginBottom: 16,
    },
    typeOption: {
        padding: 15,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: "#f0d58a",
        backgroundColor: "#fff8e7",
        marginBottom: 10,
    },
    selectedTypeOption: {
        backgroundColor: "#7a4f01",
        borderColor: "#7a4f01",
    },
    typeOptionText: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#111827",
    },
    selectedTypeOptionText: {
        color: "#fff",
    },
    modalCancelButton: {
        backgroundColor: "#6b7280",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 8,
    },
    modalCancelText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});