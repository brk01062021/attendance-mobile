import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack initialRouteName="index">
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />

            <Stack.Screen name="home" options={{ title: 'Home' }} />
            <Stack.Screen name="home-v2" options={{ headerShown: false }} />
            <Stack.Screen name="attendance" options={{ title: 'Submit Attendance' }} />
            <Stack.Screen name="teacher-dashboard" options={{ title: 'Dashboard' }} />
            <Stack.Screen name="teacher-leave-planning" options={{ title: 'Teacher Leave Planning' }} />
            <Stack.Screen name="admin-dashboard" options={{ title: 'Admin Dashboard' }} />
            <Stack.Screen name="admin-teacher-dashboard" options={{ title: "Admin Teacher's Dashboard" }} />
            <Stack.Screen name="date-summary" options={{ title: 'Date Summary' }} />
            <Stack.Screen name="attendance-report" options={{ title: 'Attendance Report' }} />
        </Stack>
    );
}