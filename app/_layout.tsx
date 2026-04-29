import { Stack } from 'expo-router';

export default function RootLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Login',
                    headerShown: false,
                }}
            />

            <Stack.Screen
                name="home"
                options={{
                    title: 'Home',
                }}
            />

            <Stack.Screen
                name="attendance"
                options={{
                    title: 'Submit Attendance',
                }}
            />

            <Stack.Screen
                name="teacher-dashboard"
                options={{
                    title: 'Teacher Dashboard',
                }}
            />

            <Stack.Screen
                name="date-summary"
                options={{
                    title: 'Date Summary',
                }}
            />

            <Stack.Screen
                name="attendance-report"
                options={{
                    title: 'Attendance Report',
                }}
            />
        </Stack>
    );
}