import { Text } from '@/app/components/StyledText';
import { uangUtils } from '@/utils/preferences';
import { WarnaTema } from '@/utils/themes';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { DailySummary, MataUang } from '../../types/types';

interface SummaryProps {
    summary: DailySummary;
    mataUang: MataUang;
    theme: WarnaTema
}

export default function Summary({ summary, mataUang, theme }: SummaryProps) {
    const getBalanceColor = (balance: number) => {
        if (balance > 0) return '#28a745';
        if (balance < 0) return '#dc3545';
        return '#6c757d';
    };

    const { t } = useTranslation();

    return (
        <View style={[styles.container, { backgroundColor: theme.card }]} pointerEvents='box-none'>
            <View style={styles.row}>
                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>{t('summary.income')}</Text>
                    <Text style={[styles.amount, { color: '#28a745' }]}>
                        {uangUtils.formatAmount(summary.totalIncome, mataUang)}
                    </Text>
                </View>

                <View style={styles.column}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>{t('summary.expenses')}</Text>
                    <Text style={[styles.amount, { color: '#dc3545' }]}>
                        {uangUtils.formatAmount(summary.totalExpenses, mataUang)}
                    </Text>
                </View>
            </View>

            <View style={[styles.balanceContainer, { borderTopColor: theme.divider }]} pointerEvents='box-none'>
                <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>{t('summary.balance')}</Text>
                <Text style={[styles.balanceAmount, { color: getBalanceColor(summary.netBalance) }]}>
                    {uangUtils.formatAmount(summary.netBalance, mataUang)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        marginHorizontal: 20,
        marginVertical: 10,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    column: {
        alignItems: 'center',
        flex: 1,
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        fontWeight: '500',
    },
    amount: {
        fontSize: 18,
        fontWeight: '600',
    },
    balanceContainer: {
        borderTopWidth: 1,
        paddingTop: 15,
        alignItems: 'center',
    },
    balanceLabel: {
        fontSize: 16,
        marginBottom: 5,
        fontWeight: '600',
    },
    balanceAmount: {
        fontSize: 24,
        fontWeight: 'bold',
    },
}); 