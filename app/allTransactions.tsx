import { useKategori } from '@/hooks/useCategory';
import { useMataUang } from '@/hooks/usePreference';
import { useTransactions } from '@/hooks/useTransactions';
import { Transaction } from '@/types/types';
import { dateUtils } from '@/utils/dateUtils';
import { lightTheme as theme } from '@/utils/themes';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, SafeAreaView, StyleSheet, View } from 'react-native';
import HeaderAplikasi from './components/HeaderAplikasi';
import { Text } from './components/StyledText';
import TransactionItem from './components/TransactionItem';

type SectionHeaderItem = { type: 'header'; title: string; id: string };
type TransactionListItem = { type: 'transaction'; data: Transaction };
type ListItem = SectionHeaderItem | TransactionListItem;

export default function AllTransactions() {
    const { t, i18n } = useTranslation();
    const { transactions: allTransactions, dapat, hapus, update } = useTransactions();
    const { kategori, dapat: dapatKategori } = useKategori();
    const { mataUang, dapat: dapatMataUang } = useMataUang();

    useEffect(() => {
        dapat();
        dapatKategori();
        dapatMataUang();
    }, []);

    // Flatten grouped transactions into a single array for FlashList
    const flatListData = useMemo(() => {
        const groups: { [date: string]: Transaction[] } = {};
        allTransactions.forEach(t => {
            const dateObj = dateUtils.parseDate(t.date);
            const sectionTitle = dateObj.toLocaleDateString(i18n.language, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            if (!groups[sectionTitle]) groups[sectionTitle] = [];
            groups[sectionTitle].push(t);
        });

        const sorted = Object.entries(groups)
            .sort((a, b) => {
                const dateA = dateUtils.parseDate(a[1][0].date).getTime();
                const dateB = dateUtils.parseDate(b[1][0].date).getTime();
                return dateB - dateA;
            });

        const items: ListItem[] = [];
        sorted.forEach(([title, transactions]) => {
            items.push({ type: 'header', title, id: `header-${title}` });
            transactions.forEach(tx => {
                items.push({ type: 'transaction', data: tx });
            });
        });

        return items;
    }, [allTransactions, i18n.language]);

    const handleDeleteTransaction = useCallback(async (transactionId: string) => {
        Alert.alert(
            t('categories.delete_title'),
            t('categories.delete_message'),
            [
                { text: t('categories.cancel'), style: 'cancel' },
                {
                    text: t('categories.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        hapus(transactionId);
                    },
                },
            ]
        );
    }, [hapus, t]);

    const renderItem = useCallback(({ item }: { item: ListItem }) => {
        if (item.type === 'header') {
            return (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{item.title}</Text>
                </View>
            );
        }
        return (
            <TransactionItem
                transaction={item.data}
                theme={theme}
                mataUang={mataUang}
                onDelete={handleDeleteTransaction}
                onEdit={update}
                customKategori={kategori}
            />
        );
    }, [mataUang, kategori, handleDeleteTransaction, update]);

    const keyExtractor = useCallback((item: ListItem) => {
        if (item.type === 'header') return item.id;
        return item.data.id;
    }, []);

    const getItemType = useCallback((item: ListItem) => {
        return item.type;
    }, []);

    const renderEmptyList = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('no_transactions_for_this_summary_mode')}</Text>
        </View>
    ), [t]);

    const stickyHeaderIndices = useMemo(() => {
        return flatListData
            .map((item, index) => (item.type === 'header' ? index : -1))
            .filter(index => index !== -1);
    }, [flatListData]);

    return (
        <LinearGradient colors={theme.linearGradientBackground} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <HeaderAplikasi subtitle={t('all_transactions')} pageUtama={false} icon="" />
                <FlashList
                    data={flatListData}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    getItemType={getItemType}
                    estimatedItemSize={100}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyList}
                    stickyHeaderIndices={stickyHeaderIndices}
                />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 40,
    },
    sectionHeader: {
        alignSelf: 'flex-start',
        backgroundColor: '#e3f2fd',
        paddingVertical: 6,
        paddingHorizontal: 18,
        borderRadius: 18,
        marginTop: 18,
        marginBottom: 6,
        marginLeft: 20,
        shadowColor: '#90caf9',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2',
        letterSpacing: 0.2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: '#6c757d',
    },
});
