import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack
            initialRouteName="index"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />

            <Stack.Screen name="home" />
            <Stack.Screen name="home-v2" />
            <Stack.Screen name="attendance" />
            <Stack.Screen name="teacher-dashboard" />
            <Stack.Screen name="teacher-leave-planning" />
            <Stack.Screen name="teacher-replacements" />
            <Stack.Screen name="admin-dashboard" />
            <Stack.Screen name="admin-teacher-dashboard" />
            <Stack.Screen name="date-summary" />
            <Stack.Screen name="attendance-report" />

            <Stack.Screen name="parent-dashboard" />
            <Stack.Screen name="student-dashboard" />
        </Stack>
    );
}