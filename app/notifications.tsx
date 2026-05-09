import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ImageBackground,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_ENDPOINTS } from '../src/services/api';
import { images } from '../src/constants/images';

type NotificationItem = {
    id: number;
    userId: number;
    schoolId?: number;
    role: string;
    className?: string;
    section?: string;
    title: string;
    message: string;
    type: string;
    read?: boolean;
    readStatus?: boolean;
    createdAt: string;
};

const getNotificationsEndpoint = () => {
    const endpoints = API_ENDPOINTS as any;

    if (endpoints.notifications) {
        return endpoints.notifications;
    }

    if (endpoints.teacherSchedules) {
        return String(endpoints.teacherSchedules).replace('/teacher-schedules', '/notifications');
    }

    return 'http://localhost:8080/notifications';
};

const getRoleLabel = (role: string) => {
    const normalizedRole = role.toUpperCase();

    if (normalizedRole === 'PARENT') return 'Parent';
    if (normalizedRole === 'STUDENT') return 'Student';
    if (normalizedRole === 'ADMIN') return 'Admin';
    return 'Teacher';
};

const getDefaultName = (role: string) => {
    const normalizedRole = role.toUpperCase();

    if (normalizedRole === 'PARENT') return 'Parent';
    if (normalizedRole === 'STUDENT') return 'Student';
    if (normalizedRole === 'ADMIN') return 'Admin';
    return 'Teacher';
};

const isNotificationRead = (item: NotificationItem) => {
    return item.readStatus === true || item.read === true;
};

const normalizeNotification = (item: NotificationItem): NotificationItem => {
    const readValue = item.readStatus === true || item.read === true;

    return {
        ...item,
        read: readValue,
        readStatus: readValue,
    };
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'REPLACEMENT_ASSIGNED':
            return '🔁';
        case 'ATTENDANCE_SUBMITTED':
            return '✅';
        case 'TEACHER_LEAVE_APPLIED':
            return '🧑‍🏫';
        case 'SCHOOL_NOTICE':
        case 'SCHOOL_ALERT':
            return '📢';
        case 'WEEKLY_ATTENDANCE':
        case 'MONTHLY_ATTENDANCE':
            return '📊';
        case 'EXAM_RESULT':
        case 'EXAM_RESULT_PUBLISHED':
            return '📘';
        default:
            return '🔔';
    }
};

const getTypeLabel = (type: string) => {
    return type ? type.replace(/_/g, ' ') : 'GENERAL';
};

const getDateText = (createdAt: string) => {
    if (!createdAt) return '';

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return createdAt;

    const today = new Date();
    const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

    if (isToday) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};

export default function NotificationsScreen() {
    const {
        userId,
        teacherId,
        parentId,
        studentId,
        teacherName,
        parentName,
        studentName,
        name,
        role,
    } = useLocalSearchParams();

    const effectiveRole = String(role || 'TEACHER').toUpperCase();

    const effectiveUserId = Number(
        userId ||
        teacherId ||
        parentId ||
        studentId ||
        0
    );

    const displayName = String(
        name ||
        teacherName ||
        parentName ||
        studentName ||
        getDefaultName(effectiveRole)
    );

    const roleLabel = getRoleLabel(effectiveRole);

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const notificationsEndpoint = getNotificationsEndpoint();

    useEffect(() => {
        loadNotifications();
    }, [effectiveUserId, effectiveRole]);

    const unreadCount = useMemo(() => {
        return notifications.filter((item) => !isNotificationRead(item)).length;
    }, [notifications]);

    const readCount = useMemo(() => {
        return notifications.filter((item) => isNotificationRead(item)).length;
    }, [notifications]);

    const loadNotifications = async (refreshOnly = false) => {
        if (!effectiveUserId) {
            Alert.alert('Missing User', 'User details are missing. Please login again.');
            return;
        }

        try {
            if (refreshOnly) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await fetch(
                `${notificationsEndpoint}?userId=${effectiveUserId}&role=${effectiveRole}`,
            );

            if (!response.ok) {
                throw new Error('Unable to load notifications');
            }

            const data = await response.json();

            setNotifications(
                Array.isArray(data)
                    ? data.map((item) => normalizeNotification(item))
                    : []
            );
        } catch (error) {
            console.log('loadNotifications error:', error);
            Alert.alert('Error', 'Unable to load notifications');
            setNotifications([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (notification: NotificationItem) => {
        if (isNotificationRead(notification)) {
            return;
        }

        try {
            const response = await fetch(`${notificationsEndpoint}/${notification.id}/read`, {
                method: 'PUT',
            });

            if (!response.ok) {
                throw new Error('Unable to mark notification as read');
            }

            const updatedNotification = normalizeNotification(await response.json());

            setNotifications((current) =>
                current.map((item) =>
                    item.id === updatedNotification.id ? updatedNotification : item,
                ),
            );
        } catch (error) {
            console.log('markAsRead error:', error);
            Alert.alert('Error', 'Unable to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        if (!effectiveUserId || unreadCount === 0) {
            return;
        }

        try {
            const response = await fetch(
                `${notificationsEndpoint}/mark-all-read?userId=${effectiveUserId}&role=${effectiveRole}`,
                {
                    method: 'PUT',
                },
            );

            if (!response.ok) {
                throw new Error('Unable to mark all notifications as read');
            }

            const updatedNotifications = await response.json();

            if (Array.isArray(updatedNotifications)) {
                setNotifications(updatedNotifications.map((item) => normalizeNotification(item)));
            } else {
                setNotifications((current) =>
                    current.map((item) => ({
                        ...item,
                        read: true,
                        readStatus: true,
                    })),
                );
            }
        } catch (error) {
            console.log('markAllAsRead error:', error);
            Alert.alert('Error', 'Unable to mark all notifications as read');
        }
    };

    const goBack = () => {
        if (effectiveRole === 'TEACHER') {
            router.replace({
                pathname: '/teacher-dashboard',
                params: {
                    teacherId: String(effectiveUserId),
                    teacherName: displayName,
                    role: effectiveRole,
                },
            } as any);
            return;
        }

        router.back();
    };

    return (
        <ImageBackground source={images.splashGold} style={styles.screen} resizeMode="cover">
            <View style={styles.overlay}>
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.circleButton} onPress={goBack} activeOpacity={0.85}>
                        <Text style={styles.backButtonText}>‹</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.circleButton} onPress={() => loadNotifications(true)} activeOpacity={0.85}>
                        <Text style={styles.refreshButtonText}>↻</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.container}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => loadNotifications(true)} />
                    }
                >
                    <View style={styles.titleBlock}>
                        <Text style={styles.workspaceTitle}>{roleLabel} Workspace</Text>
                        <Text style={styles.pageTitle}>Notifications</Text>
                        <Text style={styles.welcomeText}>Welcome, {displayName}</Text>
                    </View>

                    <View style={styles.mainCard}>
                        <View style={styles.cardHeaderRow}>
                            <View style={styles.cardHeaderTextBlock}>
                                <Text style={styles.sectionTitle}>Alerts & Updates</Text>
                                <Text style={styles.sectionSubtitle}>
                                    View important school updates, replacement alerts, attendance reports, and exam messages.
                                </Text>
                            </View>

                            {unreadCount > 0 && (
                                <View style={styles.unreadBadge}>
                                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.summaryRow}>
                            <SummaryCard label="Total" value={notifications.length} />
                            <SummaryCard label="Unread" value={unreadCount} />
                            <SummaryCard label="Read" value={readCount} />
                        </View>

                        <TouchableOpacity
                            style={[styles.markAllButton, unreadCount === 0 && styles.disabledButton]}
                            onPress={markAllAsRead}
                            activeOpacity={0.88}
                            disabled={unreadCount === 0}
                        >
                            <Text style={[styles.markAllButtonText, unreadCount === 0 && styles.disabledButtonText]}>
                                Mark all as read
                            </Text>
                        </TouchableOpacity>

                        {loading ? (
                            <View style={styles.loadingCard}>
                                <ActivityIndicator size="large" />
                                <Text style={styles.loadingText}>Loading notifications...</Text>
                            </View>
                        ) : notifications.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Text style={styles.emptyIcon}>🔔</Text>
                                <Text style={styles.emptyTitle}>No notifications found</Text>
                                <Text style={styles.emptyText}>
                                    New school alerts, replacement classes, attendance reports, and updates will appear here.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.listSection}>
                                {notifications.map((item) => (
                                    <NotificationCard
                                        key={item.id}
                                        item={item}
                                        onPress={() => markAsRead(item)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </ImageBackground>
    );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{value}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
        </View>
    );
}

function NotificationCard({
                              item,
                              onPress,
                          }: {
    item: NotificationItem;
    onPress: () => void;
}) {
    const read = isNotificationRead(item);

    return (
        <TouchableOpacity
            style={[styles.notificationCard, !read && styles.unreadNotificationCard]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.notificationTopRow}>
                <View style={styles.iconBox}>
                    <Text style={styles.iconText}>{getTypeIcon(item.type)}</Text>
                </View>

                <View style={styles.notificationTextBlock}>
                    <View style={styles.titleRow}>
                        <Text style={styles.notificationTitle} numberOfLines={2}>
                            {item.title}
                        </Text>

                        {!read && <View style={styles.dot} />}
                    </View>

                    <Text style={styles.notificationMessage}>{item.message}</Text>
                </View>
            </View>

            <View style={styles.notificationFooter}>
                <Text style={styles.typeText}>{getTypeLabel(item.type)}</Text>
                <Text style={styles.dateText}>{getDateText(item.createdAt)}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
    },
    topBar: {
        paddingTop: 58,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    circleButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(214, 169, 74, 0.7)',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        elevation: 4,
    },
    backButtonText: {
        fontSize: 40,
        color: '#09213F',
        fontWeight: '900',
        marginTop: -6,
    },
    refreshButtonText: {
        fontSize: 29,
        fontWeight: '900',
        color: '#09213F',
        marginTop: -2,
    },
    container: {
        paddingHorizontal: 24,
        paddingTop: 26,
        paddingBottom: 36,
    },
    titleBlock: {
        marginBottom: 22,
    },
    workspaceTitle: {
        color: '#09213F',
        fontSize: 21,
        fontWeight: '900',
        marginBottom: 4,
    },
    pageTitle: {
        color: '#071B35',
        fontSize: 42,
        fontWeight: '900',
        lineHeight: 48,
        letterSpacing: -1.1,
    },
    welcomeText: {
        color: '#0C2442',
        fontSize: 17,
        fontWeight: '900',
        marginTop: 18,
    },
    mainCard: {
        backgroundColor: 'rgba(255, 248, 225, 0.18)',
        borderRadius: 30,
        paddingHorizontal: 22,
        paddingTop: 26,
        paddingBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(230, 202, 129, 0.75)',
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
        elevation: 8,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 14,
    },
    cardHeaderTextBlock: {
        flex: 1,
    },
    sectionTitle: {
        color: '#071B35',
        fontSize: 27,
        fontWeight: '900',
        lineHeight: 32,
    },
    sectionSubtitle: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 23,
        marginTop: 8,
    },
    unreadBadge: {
        minWidth: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#4B2E00',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#D6A94A',
    },
    unreadBadgeText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 9,
        marginTop: 18,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#FFFDF4',
        borderRadius: 17,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E8D28B',
    },
    summaryValue: {
        color: '#4B2E00',
        fontSize: 23,
        fontWeight: '900',
    },
    summaryLabel: {
        color: '#7B5A14',
        fontSize: 11,
        fontWeight: '900',
        marginTop: 3,
    },
    markAllButton: {
        marginTop: 16,
        backgroundColor: '#4B2E00',
        borderRadius: 18,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D6A94A',
    },
    markAllButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '900',
    },
    disabledButton: {
        backgroundColor: '#F1E7C5',
        borderColor: '#E0C878',
    },
    disabledButtonText: {
        color: '#9A7B2F',
    },
    loadingCard: {
        marginTop: 18,
        backgroundColor: '#FFFDF4',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    loadingText: {
        marginTop: 10,
        color: '#604400',
        fontWeight: '800',
    },
    emptyCard: {
        marginTop: 18,
        backgroundColor: '#FFFDF4',
        borderRadius: 22,
        paddingVertical: 30,
        paddingHorizontal: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    emptyIcon: {
        fontSize: 34,
    },
    emptyTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: '#3D2500',
        marginTop: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#755711',
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 6,
    },
    listSection: {
        marginTop: 18,
        gap: 13,
    },
    notificationCard: {
        backgroundColor: '#FFFDF4',
        borderRadius: 22,
        padding: 16,
        borderWidth: 1,
        borderColor: '#DFC069',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        elevation: 3,
    },
    unreadNotificationCard: {
        backgroundColor: '#FFF7D6',
        borderColor: '#C99218',
    },
    notificationTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#F7E7B0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E3C36F',
    },
    iconText: {
        fontSize: 22,
    },
    notificationTextBlock: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
    },
    notificationTitle: {
        flex: 1,
        color: '#3D2500',
        fontSize: 17,
        fontWeight: '900',
        lineHeight: 22,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#C2410C',
        marginTop: 5,
    },
    notificationMessage: {
        color: '#6B4F0C',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
        marginTop: 5,
    },
    notificationFooter: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#EBD89B',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    typeText: {
        flex: 1,
        color: '#9A6A00',
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    dateText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '800',
    },
});