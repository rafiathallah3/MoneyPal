import { useBudget } from '@/hooks/useBudget';
import { useKategori } from '@/hooks/useCategory';
import { useMataUang } from '@/hooks/usePreference';
import { useTransactions } from '@/hooks/useTransactions';
import { lightTheme as theme, WarnaTema } from '@/utils/themes';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Platform,
    Animated as RNAnimated,
    SafeAreaView,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Transaction } from '../../types/types';
import { dateUtils } from '../../utils/dateUtils';
import AddTransactionModal from '../components/AddTransactionModal';
import FancyLoader from '../components/FancyLoader';
import HeaderAplikasi from '../components/HeaderAplikasi';
import Summary from '../components/Summary';
import TransactionItem from '../components/TransactionItem';

const SUMMARY_MODES = ['Day', 'Month', 'Year'] as const;
type SummaryMode = typeof SUMMARY_MODES[number];

function formatSummaryDate(date: Date, mode: SummaryMode, bahasa: string): string {
    if (mode === 'Day') {
        // e.g., Monday, July 7th, 2025
        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };

        return date.toLocaleDateString(bahasa, options as any);
    } else if (mode === 'Month') {
        // e.g., July 2025
        return date.toLocaleDateString(bahasa, { month: 'long', year: 'numeric' });
    } else {
        // e.g., 2025
        return date.getFullYear().toString();
    }
}

function addToDate(date: Date, mode: SummaryMode, amount: number): Date {
    if (mode === 'Day') {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + amount);
        return newDate;
    } else if (mode === 'Month') {
        const newDate = new Date(date);
        newDate.setMonth(date.getMonth() + amount);
        return newDate;
    } else {
        const newDate = new Date(date);
        newDate.setFullYear(date.getFullYear() + amount);
        return newDate;
    }
}

// Animated button for summary mode
function SummaryModeButton({ mode, theme, isActive, onPress }: { mode: string, theme: WarnaTema, isActive: boolean, onPress: () => void }) {
    const scale = React.useRef(new RNAnimated.Value(isActive ? 1.08 : 1)).current;
    React.useEffect(() => {
        RNAnimated.spring(scale, {
            toValue: isActive ? 1.08 : 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 8,
        }).start();
    }, [isActive]);
    return (
        <RNAnimated.View style={{ transform: [{ scale }], flex: 1 }}>
            <TouchableOpacity
                style={[
                    styles.fancySummaryModeButton,
                    isActive && styles.fancySummaryModeButtonActive,
                ]}
                activeOpacity={0.85}
                onPress={onPress}
            >
                <Text style={[
                    styles.fancySummaryModeText, { color: theme.textSecondary },
                    isActive && { fontWeight: '700', color: theme.textColorInBackground },
                ]}>
                    {mode}
                </Text>
            </TouchableOpacity>
        </RNAnimated.View>
    );
}

export default function MoneyPal() {
    const { kategori, dapat: dapatKategori } = useKategori();
    const { mataUang, dapat: dapatMataUang } = useMataUang();
    const { budgetData, dapat: dapatBudget } = useBudget();
    const { transactions: allTransactions, dapat: dapatTransaksi, tambah, update, hapus } = useTransactions();
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [summaryMode, setSummaryMode] = useState<SummaryMode>('Day');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    // For draggable transaction list
    const [containerHeight, setContainerHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState(0);
    const translateY = useSharedValue(0);
    const sebelumTranslateY = useSharedValue(0);
    const collapsedY = 0; // Will be set after layout
    const [isExpanded, setIsExpanded] = useState(false);

    // Get header height after layout
    const onHeaderLayout = (e: any) => {
        setHeaderHeight(e.nativeEvent.layout.height);
    };
    // Get container height after layout
    const onContainerLayout = (e: any) => {
        setContainerHeight(e.nativeEvent.layout.height);
    };

    // Calculate max translation (how far up the list can go)
    const maxTranslateY = headerHeight ? -(containerHeight - headerHeight) : 0;

    // Animated style for the list container
    const animatedStyle = useAnimatedStyle(() => {
        let heightStyle = {};
        if (isExpanded && containerHeight && headerHeight) {
            heightStyle = { minHeight: containerHeight - headerHeight + 300 };
        } else {
            heightStyle = { flex: 1, minHeight: containerHeight };
        }
        return {
            ...heightStyle,
            transform: [{ translateY: translateY.value }],
        };
    });

    // Gesture handler for drag
    const panGesture = Gesture.Pan()
        .onStart((e) => {
            sebelumTranslateY.value = translateY.value;
        })
        .onUpdate((event) => {
            let nextY = sebelumTranslateY.value + event.translationY;
            if (nextY < maxTranslateY) nextY = maxTranslateY;
            if (nextY > collapsedY) nextY = collapsedY;
            translateY.value = nextY;
        })
        .onEnd(() => {
            const threshold = (maxTranslateY + collapsedY) / 2;
            if (translateY.value < threshold) {
                translateY.value = withSpring(maxTranslateY, { damping: 20 });
                runOnJS(setIsExpanded)(true);
            } else {
                translateY.value = withSpring(collapsedY, { damping: 20 });
                runOnJS(setIsExpanded)(false);
            }
        });

    useEffect(() => {
        (async () => {
            await dapatMataUang();
            await dapatKategori();
            await dapatTransaksi();
            await dapatBudget();
        })();
    }, []);

    useEffect(() => {
        if (loading) {
            setLoading(false);
        }
    }, [selectedDate, summaryMode, allTransactions, loading]);

    // Load transactions for the selected date/month/year or when allTransactions change
    // useEffect(() => {
    // filterTransactionsForPeriod(); // This function is no longer needed
    // }, [selectedDate, summaryMode, allTransactions]);

    // Memoize filtered transactions to prevent unnecessary re-renders
    const transactionsDiTunjukan = useMemo(() => {
        const dateString = dateUtils.formatDate(selectedDate);
        let filtered: Transaction[] = [];

        if (summaryMode === 'Day') {
            filtered = allTransactions.filter(t => t.date === dateString);
        } else if (summaryMode === 'Month') {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;
            filtered = allTransactions.filter(t => {
                const [tYear, tMonth] = t.date.split('-');
                return parseInt(tYear) === year && parseInt(tMonth) === month;
            });
        } else if (summaryMode === 'Year') {
            const year = selectedDate.getFullYear();
            filtered = allTransactions.filter(t => {
                const [tYear] = t.date.split('-');
                return parseInt(tYear) === year;
            });
        }

        return filtered;
    }, [selectedDate, summaryMode, allTransactions]);

    // Ensure loading is stopped when transactionsDiTunjukan changes (even if empty)
    // useEffect(() => {
    //     setLoading(false);
    // }, [transactionsDiTunjukan]);


    // Memoize summary calculation
    const summary = useMemo(() => {
        const totalIncome = transactionsDiTunjukan
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactionsDiTunjukan
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
        };
    }, [transactionsDiTunjukan]);

    // Group transactions for SectionList
    const groupTransactionsForSectionList = useCallback(() => {
        if (summaryMode === 'Month') {
            // Group by day
            const groups: { [date: string]: Transaction[] } = {};
            transactionsDiTunjukan.forEach(t => {
                const dateObj = dateUtils.parseDate(t.date);

                const sectionTitle = dateObj.toLocaleDateString(i18n.language, { month: "long", day: "numeric" });
                if (!groups[sectionTitle]) groups[sectionTitle] = [];
                groups[sectionTitle].push(t);
            });
            // Sort by day ascending
            return Object.entries(groups)
                .sort((a, b) => {
                    const aDay = parseInt(a[0]);
                    const bDay = parseInt(b[0]);
                    return aDay - bDay;
                })
                .map(([title, data]) => ({ title, data }));
        } else if (summaryMode === 'Year') {
            // Group by month
            const groups: { [month: string]: Transaction[] } = {};
            transactionsDiTunjukan.forEach(t => {
                const dateObj = dateUtils.parseDate(t.date);
                const month = dateObj.toLocaleDateString(i18n.language, { month: 'long' });
                if (!groups[month]) groups[month] = [];
                groups[month].push(t);
            });
            // Sort by month (Jan, Feb, ...)

            return Object.entries(groups)
                .sort((a, b) => dateUtils.monthOrder.indexOf(a[0]) - dateUtils.monthOrder.indexOf(b[0]))
                .map(([title, data]) => ({ title, data }));
        }
        return [];
    }, [summaryMode, transactionsDiTunjukan]);

    const renderSectionHeader = useCallback(({ section }: { section: { title: string } }) => (
        <View style={styles.fancySectionHeader}>
            <Text style={styles.fancySectionHeaderText}>{section.title}</Text>
        </View>
    ), []);

    const [modalVisible, setModalVisible] = useState(false);

    // Memoize handlers to prevent re-renders
    const handleAddTransaction = async (transaction: Transaction) => {
        tambah(transaction);
        setModalVisible(false);
        setEditingTransaction(null);
    };

    const handleUpdateTransaction = async (transaction: Transaction) => {
        update(transaction);
        setModalVisible(false);
        setEditingTransaction(null);
    };

    const handleDeleteTransaction = useCallback(async (transactionId: string) => {
        Alert.alert(
            'Delete Transaction',
            'Are you sure you want to delete this transaction?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        hapus(transactionId);
                    },
                },
            ]
        );
    }, [hapus]);

    const handleEditTransaction = useCallback((transaction: Transaction) => {
        setEditingTransaction(transaction);
        setModalVisible(true);
    }, []);

    // Memoize render functions
    const renderTransactionItem = useCallback(({ item }: { item: Transaction }) => {
        return <TransactionItem
            transaction={item}
            theme={theme}
            mataUang={mataUang}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
            customKategori={kategori}
        />
    }, [mataUang, theme, kategori, handleDeleteTransaction, handleEditTransaction]);

    const { t, i18n } = useTranslation();
    const renderEmptyList = useCallback(() => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('no_transactions_for_this_summary_mode')}</Text>
            <Text style={styles.emptySubtext}>{t('tap_add_button_to_add_first_transaction')}</Text>
        </View>
    ), [t]);

    // Optimized key extractor
    const keyExtractor = useCallback((item: Transaction) => item.id, []);

    // Fancy Summary Mode Row
    const renderSummaryModeRow = () => (
        <View style={[styles.fancySummaryModeRow, { backgroundColor: theme.card }]}>
            {SUMMARY_MODES.map((mode) => (
                <SummaryModeButton
                    key={mode}
                    mode={t(`summary.${mode}`)}
                    theme={theme}
                    isActive={summaryMode === mode}
                    onPress={() => { if (summaryMode !== mode) { setLoading(true); setSummaryMode(mode) } }}
                />
            ))}
        </View>
    );

    return (
        <LinearGradient
            colors={theme.linearGradientBackground}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                {/* Header with three-dot menu */}
                <View onLayout={onHeaderLayout}>
                    <HeaderAplikasi subtitle={t('daily_expense_tracker')} icon='' pageUtama={true} />
                </View>
                {/* Date Navigation Bar */}
                <View style={styles.dateNavBar}>
                    <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={() => { setLoading(true); setSelectedDate(addToDate(selectedDate, summaryMode, -1)) }}
                    >
                        <Ionicons name="chevron-back" size={28} color="#007bff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => summaryMode === 'Day' && setShowDatePicker(true)}
                        activeOpacity={summaryMode === 'Day' ? 0.7 : 1}
                        style={{ flex: 1 }}
                    >
                        <Text style={[styles.dateNavText, { color: theme.primary }]}>{formatSummaryDate(selectedDate, summaryMode, i18n.language)}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.arrowButton}
                        onPress={() => { setLoading(true); setSelectedDate(addToDate(selectedDate, summaryMode, 1)) }}
                    >
                        <Ionicons name="chevron-forward" size={28} color="#007bff" />
                    </TouchableOpacity>
                </View>
                {/* DateTimePicker Modal */}
                {showDatePicker && summaryMode === 'Day' && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                            setShowDatePicker(false);
                            if (date) setSelectedDate(date);
                        }}
                    />
                )}
                {/* Fancy Summary Mode Row */}
                {renderSummaryModeRow()}
                {/* Summary */}
                <Summary summary={summary} mataUang={mataUang} theme={theme} />
                {/* Transactions List */}
                <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 15 }} onLayout={onContainerLayout}>
                    <Animated.View style={[styles.listContainer, { backgroundColor: theme.card, width: '100%' }, animatedStyle]}>
                        {/* Black bar at the top center, now wrapped in PanGestureHandler */}
                        <GestureDetector gesture={panGesture}>
                            <View style={{ alignItems: 'center' }}>
                                <Animated.View style={[styles.topBar, { backgroundColor: theme.bar }]} />
                            </View>
                        </GestureDetector>
                        <Text style={styles.listTitle}>{t('transactions')}</Text>
                        {loading ? (
                            <FancyLoader />
                        ) : summaryMode === 'Day' ? (
                            <FlashList
                                style={[{ flex: 1 }, animatedStyle]}
                                data={transactionsDiTunjukan}
                                renderItem={renderTransactionItem}
                                keyExtractor={keyExtractor}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={renderEmptyList}
                                contentContainerStyle={styles.listContent}
                                estimatedItemSize={100}
                            // initialNumToRender={5}
                            // maxToRenderPerBatch={5}
                            // updateCellsBatchingPeriod={16}
                            // windowSize={5}
                            // getItemLayout={(data, index) => ({
                            //     length: 80, // Approximate height of TransactionItem
                            //     offset: 80 * index,
                            //     index,
                            // })}
                            />
                        ) : (
                            <SectionList
                                style={[{ flex: 1 }, animatedStyle]}
                                sections={groupTransactionsForSectionList()}
                                renderItem={renderTransactionItem}
                                renderSectionHeader={renderSectionHeader}
                                keyExtractor={keyExtractor}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={renderEmptyList}
                                contentContainerStyle={styles.listContent}
                                stickySectionHeadersEnabled={false}
                            />
                        )}
                    </Animated.View>
                </View>
                {/* Add Transaction Button */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setEditingTransaction(null);
                        setModalVisible(true);
                    }}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
                {/* Add/Edit Transaction Modal */}
                {modalVisible &&
                    <AddTransactionModal
                        visible={modalVisible}
                        onClose={() => {
                            setEditingTransaction(null);
                            setModalVisible(false);
                        }}
                        onSave={handleAddTransaction}
                        selectedDate={selectedDate}
                        transaction={editingTransaction || undefined}
                        onUpdate={handleUpdateTransaction}
                        mataUang={mataUang}
                        kategori={kategori}
                        budgetData={budgetData}
                    />

                }
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        backgroundColor: '#007bff',
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    appTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    appSubtitle: {
        fontSize: 14,
        color: '#e3f2fd',
        fontWeight: '500',
    },
    summaryModeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 0,
        gap: 10,
    },
    summaryModeButton: {
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 20,
        backgroundColor: '#e9ecef',
        marginHorizontal: 5,
    },
    summaryModeButtonActive: {
        backgroundColor: '#007bff',
    },
    summaryModeText: {
        fontSize: 15,
        color: '#495057',
        fontWeight: '500',
    },
    summaryModeTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    listContainer: {
        flex: 1,
        paddingTop: 10,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 8,
    },
    topBar: {
        alignSelf: 'center',
        width: 48,
        height: 6,
        borderRadius: 3,
        marginBottom: 12,
        marginTop: 2,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#007bff',
        marginHorizontal: 20,
        marginBottom: 10,
    },
    listContent: {
        paddingBottom: 100, // Space for floating button
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        marginTop: 50,
    },
    emptyText: {
        fontSize: 18,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#adb5bd',
        textAlign: 'center',
        lineHeight: 20,
    },
    addButton: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    addButtonText: {
        fontSize: 32,
        color: '#ffffff',
        fontWeight: 'bold',
    },
    dateNavBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 18,
        marginBottom: 2,
        gap: 2,
    },
    arrowButton: {
        paddingHorizontal: 22,
        paddingVertical: 8,
        borderRadius: 20,
    },
    dateNavText: {
        fontSize: 18,
        fontWeight: '600',
        marginHorizontal: 2,
        minWidth: 120,
        textAlign: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007bff',
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 10,
    },
    menuButton: {
        padding: 8,
        marginRight: 8,
    },
    // Fancy segmented control styles
    fancySummaryModeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 8,
        padding: 6,
        borderRadius: 32,
        shadowColor: '#e3e6ea',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 2,
        gap: 8,
    },
    fancySummaryModeButton: {
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 24,
        backgroundColor: 'transparent',
        marginHorizontal: 2,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fancySummaryModeButtonActive: {
        backgroundColor: '#007bff',
        shadowColor: '#007bff',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 3,
    },
    fancySummaryModeText: {
        fontSize: 16,
        color: '#495057',
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    fancySummaryModeTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    fancySectionHeader: {
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
    fancySectionHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2',
        letterSpacing: 0.2,
    },
});
