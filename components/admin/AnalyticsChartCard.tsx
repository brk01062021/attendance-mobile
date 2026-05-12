import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
    title: string;
    children: React.ReactNode;
};

export default function AnalyticsChartCard({
                                               title,
                                               children,
                                           }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>

            <View style={styles.chartContainer}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderRadius: 24,

        paddingTop: 18,
        paddingBottom: 18,
        paddingHorizontal: 12,

        marginBottom: 18,

        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 8,

        shadowOffset: {
            width: 0,
            height: 4,
        },

        elevation: 4,

        overflow: 'hidden',
    },

    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#14345A',

        marginBottom: 12,
        paddingHorizontal: 6,
    },

    chartContainer: {
        alignItems: 'center',
        justifyContent: 'center',

        width: '100%',
        overflow: 'hidden',
    },
});
