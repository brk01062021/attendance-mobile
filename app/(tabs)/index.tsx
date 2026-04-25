import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';

const BASE_URL = 'http://192.168.1.75:8080';

type Student = {
  id: number;
  name: string;
  className: string;
  section: string;
};

type AttendanceMap = {
  [studentId: number]: string;
};

export default function HomeScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceDate, setAttendanceDate] = useState('2026-04-24');
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [summary, setSummary] = useState<{
    present: number;
    absent: number;
    late: number;
  } | null>(null);

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Login Failed', 'Invalid username or password');
      }
    } catch {
      Alert.alert('Error', 'Server not reachable');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${BASE_URL}/students`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStudents(data);

        const defaultAttendance: AttendanceMap = {};
        data.forEach((student: Student) => {
          defaultAttendance[student.id] = 'PRESENT';
        });
        setAttendance(defaultAttendance);

        Alert.alert('Students Loaded', `Count: ${data.length}`);
      } else {
        Alert.alert('Error', `Unable to fetch students. Status: ${response.status}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };

  const setStudentStatus = (studentId: number, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const submitAttendance = async () => {
    if (students.length === 0) {
      Alert.alert('Error', 'Load students first');
      return;
    }

    const attendanceList = students.map((student) => ({
      studentId: student.id,
      attendanceDate,
      status: attendance[student.id] || 'PRESENT',
    }));

    try {
      const response = await fetch(`${BASE_URL}/attendance/bulk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ attendanceList }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Attendance submitted successfully!');
      } else {
        const text = await response.text();
        Alert.alert('Error', `Failed to submit attendance: ${text}`);
      }
    } catch {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };
  const fetchDateSummary = async () => {
    try {
      const response = await fetch(
          `${BASE_URL}/attendance/summary/date?date=${attendanceDate}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
            },
          }
      );

      const data = await response.json();

      if (response.ok) {
        setSummary(data);
      } else {
        Alert.alert('Error', 'Unable to fetch summary');
      }
    } catch {
      Alert.alert('Error', 'Failed to connect to server');
    }
  };
  const renderStatusButton = (studentId: number, status: string) => {
    const selected = attendance[studentId] === status;

    return (
        <TouchableOpacity
            style={[styles.statusButton, selected && styles.selectedButton]}
            onPress={() => setStudentStatus(studentId, status)}
        >
          <Text style={selected ? styles.selectedText : styles.statusText}>
            {status}
          </Text>
        </TouchableOpacity>
    );
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Attendance App</Text>

        {!token ? (
            <>
              <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
              />

              <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"   // 👈 placeholder color
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
              />

              <Button title="Login" onPress={handleLogin} />
            </>
        ) : (
            <>
              <Text style={styles.success}>Logged in successfully</Text>

              <TextInput
                  style={styles.input}
                  placeholder="Attendance Date YYYY-MM-DD"
                  value={attendanceDate}
                  onChangeText={setAttendanceDate}
              />

              <Button title="Load Students" onPress={fetchStudents} />

              <Text style={styles.count}>Total Students: {students.length}</Text>

              <FlatList
                  data={students}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  renderItem={({ item }) => (
                      <View style={styles.card}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text>Class: {item.className}</Text>
                        <Text>Section: {item.section}</Text>

                        <View style={styles.statusRow}>
                          {renderStatusButton(item.id, 'PRESENT')}
                          {renderStatusButton(item.id, 'ABSENT')}
                          {renderStatusButton(item.id, 'LATE')}
                        </View>
                      </View>
                  )}
              />

              <View style={styles.submitContainer}>
                <Button title="Submit Attendance" onPress={submitAttendance} />
              </View>

              <Button title="Load Date Summary" onPress={fetchDateSummary} />

              {summary && (
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Summary for {attendanceDate}</Text>
                    <Text>Present: {summary.present}</Text>
                    <Text>Absent: {summary.absent}</Text>
                    <Text>Late: {summary.late}</Text>
                  </View>
              )}
            </>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    color: '#000'
  },
  success: {
    fontSize: 18,
    marginBottom: 15,
    color: 'green',
    textAlign: 'center',
  },
  count: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  card: {
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  statusButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
  },
  selectedButton: {
    backgroundColor: '#222',
  },
  statusText: {
    color: '#222',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  submitContainer: {
    marginTop: 10,
    marginBottom: 10,
  },
  summaryCard: {
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#eef',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
});