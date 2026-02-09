import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { MataUang, Transaction } from '../../types/types';


interface BalanceCalendarProps {
    transactions: Transaction[];
    selectedDate: Date;
    mataUang: MataUang;
}

export default function BalanceCalendar({
    transactions,
    selectedDate,
    mataUang
}: BalanceCalendarProps) {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const { t } = useTranslation();

    // Get calendar data for the current month
    const calendarData = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

        const days: {
            date: Date;
            isCurrentMonth: boolean;
            balance: number;
            hasTransactions: boolean;
        }[] = [];

        const currentDate = new Date(startDate);
        while (currentDate <= lastDay || currentDate.getDay() !== 0) {
            const dateString = currentDate.toISOString().split('T')[0];
            const dayTransactions = transactions.filter(t => t.date === dateString);

            const balance = dayTransactions.reduce((sum, t) => {
                return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);

            days.push({
                date: new Date(currentDate),
                isCurrentMonth: currentDate.getMonth() === currentMonth,
                balance,
                hasTransactions: dayTransactions.length > 0,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    }, [transactions, currentMonth, currentYear]);

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekDaysTranslated = weekDays.map(day => t(`week_days.${day}`));

    const formatBalance = (balance: number) => {
        if (balance === 0) return '';
        const absBalance = Math.abs(balance);
        const sign = balance > 0 ? '+' : '-';
        // Format with shorter display for small amounts
        if (absBalance < 1000) {
            return `${sign}${Math.round(absBalance)}`;
        } else if (absBalance < 1000000) {
            return `${sign}${(absBalance / 1000).toFixed(1)}K`;
        } else {
            return `${sign}${(absBalance / 1000000).toFixed(1)}M`;
        }
    };

    const getBalanceColor = (balance: number) => {
        if (balance === 0) return '#6c757d';
        return balance > 0 ? '#28a745' : '#dc3545';
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('monthly_balance_calendar')}</Text>

            {/* Week day headers */}
            <View style={styles.weekHeader}>
                {weekDaysTranslated.map(day => (
                    <View key={day} style={styles.weekDayHeader}>
                        <Text style={styles.weekDayText}>{day}</Text>
                    </View>
                ))}
            </View>

            {/* Calendar grid */}
            <View style={styles.calendarGrid}>
                {calendarData.map((day, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dayCell,
                            !day.isCurrentMonth && styles.otherMonthDay,
                            day.hasTransactions && styles.hasTransactionsDay,
                        ]}
                    >
                        <Text style={[
                            styles.dayNumber,
                            !day.isCurrentMonth && styles.otherMonthText,
                        ]}>
                            {day.date.getDate()}
                        </Text>
                        {day.hasTransactions && (
                            <Text style={[
                                styles.balanceText,
                                { color: getBalanceColor(day.balance) }
                            ]}>
                                {formatBalance(day.balance)}
                            </Text>
                        )}
                    </View>
                ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#28a745' }]} />
                    <Text style={styles.legendText}>{t('balance_calendar.positive_balance')}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#dc3545' }]} />
                    <Text style={styles.legendText}>{t('balance_calendar.negative_balance')}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 18,
        marginHorizontal: 16,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1976d2',
        marginTop: 0,
        marginBottom: 12,
        letterSpacing: 0.2,
        textShadowColor: '#e3f2fd',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    weekHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDayHeader: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6c757d',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
        borderWidth: 0.5,
        borderColor: '#e9ecef',
    },
    otherMonthDay: {
        backgroundColor: '#f8f9fa',
    },
    otherMonthText: {
        color: '#adb5bd',
    },
    hasTransactionsDay: {
        // backgroundColor: '#f8f9fa',
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: '#2c3e50',
        marginBottom: 2,
    },
    balanceText: {
        fontSize: 8,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 10,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 12,
        color: '#6c757d',
    },
}); 