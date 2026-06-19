import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
    title: string;
    value: string | number;
    subtitle?: string;
};

export default function AnalyticsKpiCard({
                                             title,
                                             value,
                                             subtitle,
                                         }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.value}>{value}</Text>

            {!!subtitle && (
                <Text style={styles.subtitle}>{subtitle}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '48%',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 22,
        paddingVertical: 18,
        paddingHorizontal: 14,
        marginBottom: 14,

        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,

        shadowOffset: {
            width: 0,
            height: 3,
        },

        elevation: 3,
    },

    title: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7280',
        marginBottom: 10,
    },

    value: {
        fontSize: 30,
        fontWeight: '800',
        color: '#14345A',

        marginTop: 6,
        lineHeight: 34,

        includeFontPadding: false,
        textAlignVertical: 'center',
    },

    subtitle: {
        marginTop: 6,
        fontSize: 12,
        color: '#92400E',
        fontWeight: '600',
    },
});