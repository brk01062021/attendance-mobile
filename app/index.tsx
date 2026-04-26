import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        router.push('/home' as any);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>School Attendance App</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Enter Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity>
                <Text style={styles.linkText}>Forgot Username?</Text>
            </TouchableOpacity>

            <TouchableOpacity>
                <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
        color: '#1e3a8a',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        padding: 14,
        fontSize: 16,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
    },
    loginButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 25,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    linkText: {
        textAlign: 'center',
        color: '#2563eb',
        fontSize: 15,
        marginBottom: 10,
    },
});