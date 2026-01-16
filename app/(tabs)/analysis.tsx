import { useKategori } from '@/hooks/useCategory';
import { useMataUang } from '@/hooks/usePreference';
import { useTransactions } from '@/hooks/useTransactions';
import { uangUtils } from '@/utils/preferences';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import LineChart from 'react-native-simple-line-chart';
import { Transaction } from '../../types/types';
import { getCategoryById, TranslateKategori } from '../../utils/categories';
import BalanceCalendar from '../components/BalanceCalendar';
import FancyLoader from '../components/FancyLoader';
import HeaderAplikasi from '../components/HeaderAplikasi';

const screenWidth = Dimensions.get('window').width;
const SUMMARY_MODES = ['month', 'year', 'all'] as const;
type SummaryMode = typeof SUMMARY_MODES[number];

function formatAnalysisDate(date: Date, mode: SummaryMode, bahasa: string): string {
  if (mode === 'month') {
    return date.toLocaleDateString(bahasa, { month: 'long', year: 'numeric' });
  } else if (mode === 'year') {
    return date.getFullYear().toString();
  } else {
    return 'All Time';
  }
}

function addToDate(date: Date, mode: SummaryMode, amount: number): Date {
  if (mode === 'month') {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + amount);
    return newDate;
  } else if (mode === 'year') {
    const newDate = new Date(date);
    newDate.setFullYear(date.getFullYear() + amount);
    return newDate;
  } else {
    return date;
  }
}

// Animated button for summary mode
function FancySummaryModeButton({ mode, isActive, onPress, label }: { mode: string, isActive: boolean, onPress: () => void, label: string }) {
  const scale = React.useRef(new Animated.Value(isActive ? 1.08 : 1)).current;
  React.useEffect(() => {
    Animated.spring(scale, {
      toValue: isActive ? 1.08 : 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }, [isActive]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          styles.fancySummaryModeButton,
          isActive && styles.fancySummaryModeButtonActive,
        ]}
        activeOpacity={0.85}
        onPress={onPress}
      >
        <Text
          style={[
            styles.fancySummaryModeText,
            isActive && styles.fancySummaryModeTextActive,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AnalysisScreen() {
  // const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { kategori, dapat: dapatKategori } = useKategori();
  const { mataUang, dapat: dapatMataUang } = useMataUang();
  const { transactions, dapat: dapatTransaksi } = useTransactions();
  const [pieData, setPieData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPieIndex, setSelectedPieIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const { t, i18n } = useTranslation();
  const isFocused = useIsFocused();

  useEffect(() => {
    (async () => {
        await dapatMataUang();
        await dapatKategori();
        await dapatTransaksi();
      })();
  }, []);
  
  useEffect(() => {
    if (isFocused) {
      preparePieData(transactions);
      prepareLineData(transactions);
      if (loading) setLoading(false);
    }
  }, [transactions, summaryMode, selectedDate, transactionType, isFocused]);

  // Pie chart: expense/income by category (filtered)
  const preparePieData = (all: Transaction[]) => {
    let filtered = all.filter(t => t.type === transactionType);
    if (summaryMode === 'month') {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      filtered = filtered.filter(t => {
        const [tYear, tMonth] = t.date.split('-');
        return parseInt(tYear) === year && parseInt(tMonth) === month;
      });
    } else if (summaryMode === 'year') {
      const year = selectedDate.getFullYear();
      filtered = filtered.filter(t => {
        const [tYear] = t.date.split('-');
        return parseInt(tYear) === year;
      });
    }
    const categoryTotals: { [cat: string]: number } = {};
    filtered.forEach(t => {
      if (!t.category) return;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const pie = Object.entries(categoryTotals).map(([cat, value], i) => {
      const catObj = getCategoryById(cat, transactionType, kategori.filter((v) => v.type === transactionType)) ?? getCategoryById(transactionType === 'income' ? "other_income" : "other_expense", transactionType);
      return {
        value: value,
        text: catObj ? TranslateKategori[i18n.language][catObj.id] ? TranslateKategori[i18n.language][catObj.id] : catObj.name : cat,
        color: catObj ? catObj.color : '#ccc',
        // category: catObj ? TranslateKategori[i18n.language][catObj.id] ? TranslateKategori[i18n.language][catObj.id] : catObj.name : cat,
      };
    });
    setPieData(pie.sort((a, b) => b.value - a.value));
  };

  // Line chart: total expenses/income by month/year/all
  const prepareLineData = (all: Transaction[]) => {
    if (summaryMode === 'month') {
      // Show daily expenses/income for the selected month
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const labels: string[] = [];
      const data: number[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const tanggal = new Date(year, month, d)
        const bulan = new Intl.DateTimeFormat(i18n.language, { month: 'long' }).format(tanggal);

        let suffix = "";
        if(i18n.language === "en") {
          if (d > 3 && d < 21) {
            suffix = 'th';
          } else {
            switch (d % 10) {
              case 1:
                suffix = 'st';
                break;
              case 2:
                suffix = 'nd';
                break;
              case 3:
                suffix = 'rd';
                break;
              default:
                suffix = 'th';
            }
          }
        }

        labels.push(`${d}${suffix} ${bulan}`);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const total = all.filter(t => t.type === transactionType && t.date === dateStr).reduce((sum, t) => sum + t.amount, 0);
        data.push(total);
      }
      
      setLineData({ labels, data });
    } else if (summaryMode === 'year') {
      // Show monthly expenses/income for the selected year
      const year = selectedDate.getFullYear();
      const labels: string[] = [];
      const data: number[] = [];
      for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, 1);
        const label = d.toLocaleDateString(i18n.language, { month: 'short' }) + ' ' + d.getFullYear().toString().slice(-2);
        labels.push(label);
        const monthStr = `${year}-${String(m + 1).padStart(2, '0')}`;
        const total = all.filter(t => t.type === transactionType && t.date.startsWith(monthStr)).reduce((sum, t) => sum + t.amount, 0);
        data.push(total);
      }
      setLineData({ labels, data });
    } else {
      // All time: last 12 months
      const now = new Date();
      const months: string[] = [];
      const data: number[] = [];
      for (let i = 12; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString(i18n.language, { month: 'short' }) + ' ' + d.getFullYear().toString().slice(-2);
        months.push(label);
        const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const total = all.filter(t => t.type === transactionType && t.date.startsWith(monthStr)).reduce((sum, t) => sum + t.amount, 0);
        data.push(total);
      }
      setLineData({ labels: months, data });
    }
  };

  // Pie chart interactivity
  const totalPie = pieData.reduce((sum, d) => sum + d.value, 0);
  const handlePiePress = (index: number) => setSelectedPieIndex(index);

  return (
    <LinearGradient
      colors={["#f8f9fa", "#e3f2fd", "#f8f9fa"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Fancy Header */}
          <HeaderAplikasi subtitle={transactionType === 'expense' ? t('expense_analysis') : `${t('summary.income')} Analysis`} pageUtama={true} icon='' />
          {/* Income/Expense Toggle Row */}
          <View style={styles.fancySummaryModeRow}>
            <FancySummaryModeButton
              mode="expense"
              isActive={transactionType === 'expense'}
              onPress={() => { if (transactionType !== 'expense') { setLoading(true); setTransactionType('expense'); } }}
              label={t('add_transaction.expense')}
            />
            <FancySummaryModeButton
              mode="income"
              isActive={transactionType === 'income'}
              onPress={() => { if (transactionType !== 'income') { setLoading(true); setTransactionType('income'); } }}
              label={t('add_transaction.income')}
            />
          </View>
          {/* Fancy Summary Mode Row */}
          <View style={styles.fancySummaryModeRow}>
            {SUMMARY_MODES.map(mode => (
              <FancySummaryModeButton
                key={mode}
                mode={mode}
                isActive={summaryMode === mode}
                onPress={() => { if (summaryMode !== mode) { setLoading(true); setSummaryMode(mode); } }}
                label={mode === 'month' ? t('month') : mode === 'year' ? t('year') : t('all_time')}
              />
            ))}
          </View>
          {/* Date Navigation */}
          {(summaryMode === 'month' || summaryMode === 'year') && (
            <View style={styles.dateNavBar}>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => { setLoading(true); setSelectedDate(addToDate(selectedDate, summaryMode, -1)); }}
              >
                <Ionicons name="chevron-back" size={28} color="#007bff" />
              </TouchableOpacity>
              <Text style={styles.dateNavText}>{formatAnalysisDate(selectedDate, summaryMode, i18n.language)}</Text>
              <TouchableOpacity
                style={styles.arrowButton}
                onPress={() => { setLoading(true); setSelectedDate(addToDate(selectedDate, summaryMode, 1)); }}
              >
                <Ionicons name="chevron-forward" size={28} color="#007bff" />
              </TouchableOpacity>
            </View>
          )}
          {/* Loader */}
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
              <FancyLoader />
            </View>
          ) : (
            <>
              {/* Pie Chart Card */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('by_category')} ({formatAnalysisDate(selectedDate, summaryMode, i18n.language)})</Text>
                {pieData.length > 0 ? (
                  <>
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                      <PieChart
                        data={pieData.map((d, idx) => ({
                          value: d.value,
                          color: d.color,
                          text: d.text,
                          onPress: () => handlePiePress(idx),
                        }))}
                        radius={90}
                        innerRadius={60}
                        showGradient
                        sectionAutoFocus
                        donut
                        showValuesAsLabels
                        showTextBackground
                        strokeColor="#fff"
                        strokeWidth={2}
                        centerLabelComponent={() =>
                          selectedPieIndex !== null && pieData[selectedPieIndex] ? (
                            <View style={{ alignItems: 'center', justifyContent: 'center', maxWidth: 100, paddingHorizontal: 4 }}>
                              <Text
                                style={{
                                  fontWeight: 'bold',
                                  color: pieData[selectedPieIndex].color,
                                  fontSize: 16,
                                  textAlign: 'center',
                                  flexWrap: 'wrap',
                                }}
                                numberOfLines={2}
                                ellipsizeMode="tail"
                              >
                                {pieData[selectedPieIndex].text}
                              </Text>
                              <Text style={{ color: '#2c3e50', fontSize: 14, textAlign: 'center' }}>
                                {Math.round((pieData[selectedPieIndex].value / totalPie) * 100)}%
                              </Text>
                            </View>
                          ) : <Text style={{ alignItems: "center", fontWeight: 'bold', textAlign: 'center' }}>{transactionType === 'expense' ? t('expenses') : t('summary.income')}</Text>
                        }
                      />
                    </View>
                    <View style={{ marginTop: 16 }}>
                      {pieData.map((d, _) => {
                        const percent = totalPie > 0 ? d.value / totalPie : 0;
                        return (
                          <View key={d.text} style={styles.pieDetailRow}>
                            <View style={[styles.pieColorDot, { backgroundColor: d.color }]} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.pieDetailName}>{d.text}</Text>
                              <Text style={styles.pieDetailAmount}>{d.value.toLocaleString(undefined, { style: 'currency', currency: 'USD' }).replace("$", mataUang.symbol)}</Text>
                              <View style={styles.pieProgressBarBg}>
                                <View style={[styles.pieProgressBar, { width: `${Math.round(percent * 100)}%`, backgroundColor: d.color, position: 'absolute', left: 0, top: 0, bottom: 0 }]} />
                                <View style={styles.pieProgressBarPercentContainer}>
                                  <Text style={styles.pieDetailPercent}>{Math.round(percent * 100)}%</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </>
                ) : (
                  <Text style={styles.emptyText}>{transactionType === 'expense' ? t('no_expense_data_for_pie_chart') : `No ${t('summary.income').toLowerCase()} data for pie chart.`}</Text>
                )}
              </View>
              {/* Line Chart Card */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {summaryMode === 'month'
                    ? `${transactionType === 'expense' ? t('spending_over_time') : `${t('summary.income')} Over Time`}\n(${t('days_in')}${formatAnalysisDate(selectedDate, 'month', i18n.language)})`
                    : summaryMode === 'year'
                    ? `${transactionType === 'expense' ? t('spending_over_time') : `${t('summary.income')} Over Time`}\n(${t('months_in')}${formatAnalysisDate(selectedDate, 'year', i18n.language)})`
                    : `${transactionType === 'expense' ? t('spending_over_time') : `${t('summary.income')} Over Time`}\n(${t('last_12_months')})`}
                </Text>
                {lineData.data.length > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {/* Y Axis labels */}
                    <View style={{ width: 50, height: 220, justifyContent: 'space-between', alignItems: 'flex-end', paddingVertical: 8 }}>
                      {[...Array(5)].map((_, i) => {
                        // 5 ticks, from max to min
                        const max = Math.max(...lineData.data);
                        const min = Math.min(...lineData.data);
                        const value = max - ((max - min) / 4) * i;
                        return (
                          <Text key={i} style={{ fontSize: 10, color: '#495057', textAlign: 'right' }}>
                            {mataUang.symbol}{Math.round(value)}
                          </Text>
                        );
                      })}
                    </View>
                    <View>
                      <LineChart
                        lines={[
                          {
                            data: lineData.data.map((y, i) => ({
                              y,
                              x: i,
                              extraData: {
                                formattedValue: uangUtils.formatAmount(y, mataUang),
                                formattedTime: lineData.labels[i],
                              },
                            })),
                            lineColor: '#007bff',
                            curve: 'linear',
                            // endPointConfig: {
                            //   color: '#007bff',
                            //   radius: 5,
                            //   animated: true,
                            // },
                            activePointConfig: {
                              color: '#007bff',
                              showVerticalLine: true,
                            },
                            activePointComponent: (point: any) => (
                              <View
                                style={{
                                  backgroundColor: '#007bff',
                                  padding: 10,
                                  borderRadius: 10,
                                }}
                              >
                                <Text style={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
                                  {point?.extraData?.formattedValue}
                                </Text>
                                <Text style={{ color: 'white', textAlign: 'center' }}>
                                  {point?.extraData?.formattedTime}
                                </Text>
                              </View>
                            ),
                          },
                        ]}
                        height={220}
                        width={screenWidth - 110}
                        backgroundColor={'#fff'}
                      />
                      {/* X Axis labels */}
                      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', marginTop: 4, width: screenWidth - 110 }}>
                        {summaryMode === 'month'
                          ? (() => {
                              const daysInMonth = lineData.labels.length;
                              const filteredIndexes = [0, 7, 14, 21, daysInMonth - 1];
                              return lineData.labels.filter((_, i) => filteredIndexes.includes(i)).map((label, i) => {
                                return (
                                  <Text
                                    key={i}
                                    style={{ fontSize: 10, fontWeight: 'bold', color: '#495057', width: (screenWidth - 110) / 5, textAlign: 'center' }}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                  >
                                    {label}
                                  </Text>
                                );
                              });
                            })()
                          : lineData.labels.map((label, i) => (
                              <Text
                                key={i}
                                style={{ fontSize: 9, color: '#495057', width: (screenWidth - 110) / lineData.labels.length, textAlign: 'center', transform: [{ rotate: '30deg' }] }}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {label}
                              </Text>
                            ))}
                      </View>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>{transactionType === 'expense' ? t('no_expense_data_for_line_chart') : `No ${t('summary.income').toLowerCase()} data for line chart.`}</Text>
                )}
              </View>
              
              {/* Balance Calendar Card */}
              {(summaryMode === "month" && 
                <BalanceCalendar
                  transactions={transactions}
                  selectedDate={selectedDate}
                  mataUang={mataUang}
                />
              )}

              <View style={{ marginBottom: 10 }}></View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#007bff',
    paddingTop: 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginHorizontal: 16,
    marginVertical: 14,
    padding: 22,
    shadowColor: '#90caf9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  sectionTitle: {
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
  dateNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 2,
    gap: 10,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 20,
  },
  dateNavText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginHorizontal: 10,
    minWidth: 120,
    textAlign: 'center',
  },
  emptyText: {
    color: '#adb5bd',
    fontSize: 15,
    textAlign: 'center',
    marginVertical: 20,
  },
  pieDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  pieColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  pieDetailName: {
    flex: 1,
    fontSize: 15,
    color: '#2c3e50',
  },
  pieDetailAmount: {
    fontSize: 15,
    color: '#007bff',
    fontWeight: '600',
    marginRight: 8,
  },
  pieProgressBarBg: {
    flex: 2,
    height: 18,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
    marginTop: 2,
    marginBottom: 2,
    justifyContent: 'center',
  },
  pieProgressBar: {
    height: 18,
    borderRadius: 4,
  },
  pieProgressBarPercentContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  pieDetailPercent: {
    fontSize: 13,
    color: '#495057',
    minWidth: 32,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  LineChartLabelBulan: {
    width: 70,
    marginRight: 5,
  },
  LineChartLabelTahun: {
    width: 70,
    marginHorizontal: 15,
    // marginLeft: 15
  },
  LineChartLabelSemua: {
    width: 70,
    marginRight: 5,
    marginLeft: 10
  },
  // Fancy segmented control styles
  fancySummaryModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    padding: 6,
    backgroundColor: '#f1f3f4',
    borderRadius: 32,
    shadowColor: '#e3e6ea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
    gap: 12, // increased gap for more space between buttons
  },
  fancySummaryModeButton: {
    paddingVertical: 7, // reduced from 12
    paddingHorizontal: 16, // reduced from 28
    borderRadius: 20, // slightly smaller radius
    backgroundColor: 'transparent',
    marginHorizontal: 2,
    minWidth: 70, // reduced from 110
    alignItems: 'center',
    justifyContent: 'center',
  },
  fancySummaryModeButtonActive: {
    backgroundColor: '#007bff',
    shadowColor: '#007bff',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#1565c0',
  },
  fancySummaryModeText: {
    fontSize: 17,
    color: '#495057',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  fancySummaryModeTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
}); 