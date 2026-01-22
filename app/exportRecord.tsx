import { useKategori } from '@/hooks/useCategory';
import { useMataUang } from '@/hooks/usePreference';
import { useTransactions } from '@/hooks/useTransactions';
import { getCategoryById } from '@/utils/categories';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Category, Transaction } from '../types/types';
import { dateUtils } from '../utils/dateUtils';
import { uangUtils } from '../utils/preferences';
import HeaderAplikasi from './components/HeaderAplikasi';

const directories = [
  { name: 'Documents', path: RNFS.DocumentDirectoryPath },
  { name: 'Downloads', path: RNFS.DownloadDirectoryPath },
];

const headers = [
  'Date',
  'Title',
  'Type',
  'Amount',
  'Category',
  'Description',
  'Created At'
];

const generateCSV = (transactions: Transaction[], customKategori: Category[] = []): string => {
  const rows = transactions.map(transaction => [
    transaction.date,
    `"${transaction.title}"`,
    `${transaction.type} (${(transaction.type === "income" ? "+" : "-")})`,
    transaction.amount.toString(),
    transaction.category ? getCategoryById(transaction.category, transaction.type, customKategori)?.name : '',
    transaction.description ? `"${transaction.description}"` : '',
    transaction.createdAt
  ]);

  const totalTransactions = transactions.length;
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const summaryRows = [
    [],
    ['Summary'],
    ['Total Transactions', totalTransactions.toString()],
    ['Total Income', totalIncome.toString()],
    ['Total Expenses', totalExpenses.toString()],
    ['Net Balance', netBalance.toString()]
  ];

  const mainContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const summaryContent = summaryRows.map(row => row.join(',')).join('\n');

  return `${mainContent}\n${summaryContent}`;
};

export default function ExportRecord() {
  const { kategori, dapat: dapatKategori } = useKategori();
  const { transactions, dapat: dapatTransaction } = useTransactions();
  const { mataUang, dapat: dapatMataUang } = useMataUang();
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [directoryModalVisible, setDirectoryModalVisible] = useState(false);
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [selectedDirectory, setSelectedDirectory] = useState('Documents');
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });
  // Track which quick range is selected
  const [selectedQuickRange, setSelectedQuickRange] = useState<'all' | '7days' | 'month' | 'custom'>('all');
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const { t, i18n } = useTranslation();
  useEffect(() => {
    dapatTransaction();
    dapatMataUang();
    dapatKategori();
  }, []);

  const getFilteredTransactions = () => {
    const startDateStr = dateUtils.formatDate(dateRange.startDate);
    const endDateStr = dateUtils.formatDate(dateRange.endDate);

    return transactions.filter(transaction => {
      const transactionDate = transaction.date;
      return transactionDate >= startDateStr && transactionDate <= endDateStr;
    });
  };

  const exportToCSV = async () => {
    const filteredTransactions = getFilteredTransactions();

    if (filteredTransactions.length === 0) {
      Alert.alert(t('export.no_data_title'), t('export.no_data_message'));
      return;
    }

    setIsExporting(true);
    const csvContent = generateCSV(filteredTransactions, kategori);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const fileName = `transactions_${timestamp}.csv`;
    let apakahExporBerhasil = false;
    try {
      let filePath = '';
      if (selectedDirectory === 'App Data') {
        // Create exports directory if it doesn't exist
        const exportsDir = RNFS.DocumentDirectoryPath + '/exports';
        const dirExists = await RNFS.exists(exportsDir);
        if (!dirExists) {
          await RNFS.mkdir(exportsDir);
        }
        filePath = `${exportsDir}/${fileName}`;
      } else {
        const dir = directories.find(d => d.name === selectedDirectory);
        filePath = `${dir?.path}/${fileName}`;
      }

      await RNFS.writeFile(filePath, csvContent, 'utf8');
      apakahExporBerhasil = true;

      // Share the file
      const shareOptions = {
        title: t('export.share_title'),
        message: t('export.share_message'),
        url: `file://${filePath}`,
        type: 'text/csv',
        filename: fileName
      };

      await Share.open(shareOptions);

      Alert.alert(
        t('export.success_title'),
        t('export.success_message', { fileName, selectedDirectory }),
        [{ text: 'OK' }]
      );
      setExportModalVisible(false);
    } catch (error: any) {
      if (error.message === 'User did not share') {
        setExportModalVisible(false);
        if (apakahExporBerhasil) {
          Alert.alert(
            t('export.success_title'),
            t('export.success_message', { fileName, selectedDirectory }),
            [{ text: 'OK' }]
          );
        }
      } else {
        console.error('Export error:', error);
        Alert.alert(t('export.failed_title'), t('export.failed_message'));
      }
    } finally {
      setIsExporting(false);
    }
  };

  const getTransactionStats = () => {
    const filteredTransactions = getFilteredTransactions();
    const totalTransactions = filteredTransactions.length;
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalTransactions, totalIncome, totalExpenses };
  };

  const stats = getTransactionStats();

  const handleDateChange = (type: 'start' | 'end', date: Date) => {
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: date
    }));
    setSelectedQuickRange('custom');
  };

  // Handle date picker changes
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setTempStartDate(selectedDate);
      handleDateChange('start', selectedDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setTempEndDate(selectedDate);
      handleDateChange('end', selectedDate);
    }
  };

  // Initialize temp dates when modal opens
  useEffect(() => {
    if (dateRangeModalVisible) {
      setTempStartDate(dateRange.startDate);
      setTempEndDate(dateRange.endDate);
    }
  }, [dateRangeModalVisible, dateRange]);

  // Add a function to get the label for the selected quick range
  const getQuickRangeLabel = () => {
    switch (selectedQuickRange) {
      case '7days': return t('export.quick_range.7days');
      case 'month': return t('export.quick_range.month');
      case 'all': return t('export.quick_range.all');
      case 'custom': return t('export.quick_range.custom');
      default: return '';
    }
  };

  return (
    <LinearGradient colors={["#f8f9fa", "#e3f2fd", "#f8f9fa"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Header with Back Button */}
          <HeaderAplikasi subtitle={t('export.export_records')} pageUtama={false} icon='download-outline' />

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="document-text-outline" size={24} color="#007bff" />
                </View>
                <Text style={styles.statNumber}>{stats.totalTransactions}</Text>
                <Text style={styles.statLabel}>{t('export.total_transactions')}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#e8f5e8' }]}>
                  <Ionicons name="trending-up-outline" size={24} color="#28a745" />
                </View>
                <Text style={[styles.statNumber, { color: '#28a745' }]}>
                  {uangUtils.formatAmount(stats.totalIncome, mataUang)}
                </Text>
                <Text style={styles.statLabel}>{t('export.total_income')}</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconContainer, { backgroundColor: '#ffeaea' }]}>
                  <Ionicons name="trending-down-outline" size={24} color="#dc3545" />
                </View>
                <Text style={[styles.statNumber, { color: '#dc3545' }]}>
                  {uangUtils.formatAmount(stats.totalExpenses, mataUang)}
                </Text>
                <Text style={styles.statLabel}>{t('export.total_expenses')}</Text>
              </View>
            </View>

            {/* Export Options */}
            <View style={styles.optionsContainer}>
              <View style={styles.sectionTitle}>
                <Ionicons name="settings-outline" size={20} color="#007bff" />
                <Text style={styles.sectionTitleText}>{t('export.export_settings')}</Text>
              </View>

              {/* Directory Selection */}
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={() => { setDirectoryModalVisible(true) }}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="folder-outline" size={24} color="#007bff" />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{t('export.export_directory')}</Text>
                      <Text style={styles.cardSubtitle}>{t('export.choose_directory')}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.directoryValue}>{selectedDirectory}</Text>
                    <Ionicons name="chevron-forward" size={20} color="#bdbdbd" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Date Range Selection */}
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.cardContent}
                  onPress={() => setDateRangeModalVisible(true)}
                >
                  <View style={styles.cardLeft}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="calendar-outline" size={24} color="#007bff" />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{t('export.date_range')}</Text>
                      <Text style={styles.cardSubtitle}>
                        {dateUtils.formatDateShort(dateRange.startDate, i18n.language)} - {dateUtils.formatDateShort(dateRange.endDate, i18n.language)}
                      </Text>
                      <Text style={styles.quickRangeLabel}>{getQuickRangeLabel()}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#bdbdbd" />
                </TouchableOpacity>
              </View>

              {/* Export Button */}
              <TouchableOpacity
                style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
                onPress={() => setExportModalVisible(true)}
                disabled={isExporting}
              >
                <View style={styles.exportButtonContent}>
                  <Ionicons
                    name={isExporting ? "hourglass-outline" : "download-outline"}
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.exportButtonText}>
                    {isExporting ? t('export.exporting') : t('export.export_to_csv')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Directory Selection Modal */}
          <Modal
            visible={directoryModalVisible}
            animationType="slide"
            backdropColor={"transparent"}
            onRequestClose={() => setDirectoryModalVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setDirectoryModalVisible(false)}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('export.select_directory')}</Text>
                  <TouchableOpacity onPress={() => setDirectoryModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                {directories.map((dir) => (
                  <TouchableOpacity
                    key={dir.name}
                    style={[
                      styles.directoryOption,
                      selectedDirectory === dir.name && styles.directoryOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedDirectory(dir.name);
                      setDirectoryModalVisible(false);
                    }}
                  >
                    <View style={styles.directoryInfo}>
                      <Ionicons name="folder-outline" size={20} color="#007bff" />
                      <Text style={styles.directoryName}>{dir.name}</Text>
                    </View>
                    {selectedDirectory === dir.name && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={20} color="#007bff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Modal>

          {/* Date Range Selection Modal */}
          <Modal
            visible={dateRangeModalVisible}
            animationType="slide"
            backdropColor={"transparent"}
            onRequestClose={() => setDateRangeModalVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setDateRangeModalVisible(false)}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('export.select_date_range')}</Text>
                  <TouchableOpacity onPress={() => setDateRangeModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.dateRangeContent}>
                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>{t('export.start_date')}</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowStartDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {dateUtils.formatDateShort(tempStartDate, i18n.language)}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#007bff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateInputContainer}>
                    <Text style={styles.dateLabel}>{t('export.end_date')}</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {dateUtils.formatDateShort(tempEndDate, i18n.language)}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#007bff" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.quickDateButtons}>
                    <TouchableOpacity
                      style={[styles.quickDateButton, selectedQuickRange === '7days' && styles.quickDateButtonSelected]}
                      onPress={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(start.getDate() - 7);
                        setDateRange({ startDate: start, endDate: end });
                        setSelectedQuickRange('7days');
                      }}
                    >
                      <Text style={[styles.quickDateButtonText, selectedQuickRange === '7days' && styles.quickDateButtonTextSelected]}>{t('export.quick_range.7days')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickDateButton, selectedQuickRange === 'month' && styles.quickDateButtonSelected]}
                      onPress={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setMonth(start.getMonth() - 1);
                        setDateRange({ startDate: start, endDate: end });
                        setSelectedQuickRange('month');
                      }}
                    >
                      <Text style={[styles.quickDateButtonText, selectedQuickRange === 'month' && styles.quickDateButtonTextSelected]}>{t('export.quick_range.month')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickDateButton, selectedQuickRange === 'all' && styles.quickDateButtonSelected]}
                      onPress={() => {
                        if (transactions.length === 0) return;
                        // Find min and max date from transactions
                        let minDate = new Date(transactions[0].date);
                        let maxDate = new Date(transactions[0].date);
                        transactions.forEach(t => {
                          const d = new Date(t.date);
                          if (d < minDate) minDate = d;
                          if (d > maxDate) maxDate = d;
                        });
                        setDateRange({ startDate: minDate, endDate: maxDate });
                        setSelectedQuickRange('all');
                      }}
                    >
                      <Text style={[styles.quickDateButtonText, selectedQuickRange === 'all' && styles.quickDateButtonTextSelected]}>{t('export.quick_range.all')}</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.confirmDateButton}
                    onPress={() => setDateRangeModalVisible(false)}
                  >
                    <Text style={styles.confirmDateButtonText}>{t('export.confirm_range')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Modal>

          {/* Export Confirmation Modal */}
          <Modal
            visible={exportModalVisible}
            animationType="slide"
            backdropColor={"transparent"}
            onRequestClose={() => setExportModalVisible(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setExportModalVisible(false)}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('export.confirm_export')}</Text>
                  <TouchableOpacity onPress={() => setExportModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.confirmationContent}>
                  <View style={styles.confirmationIconContainer}>
                    <Ionicons name="document-text-outline" size={48} color="#007bff" />
                  </View>

                  <Text style={styles.confirmationTitle}>{t('export.export_transactions')}</Text>

                  <View style={styles.exportDetailsContainer}>
                    <View style={styles.exportDetailRow}>
                      <Ionicons name="stats-chart-outline" size={20} color="#666" />
                      <Text style={styles.exportDetailText}>
                        <Text style={styles.exportDetailLabel}>{t('export.transactions')}: </Text>
                        {stats.totalTransactions} {t('export.records')}
                      </Text>
                    </View>

                    <View style={styles.exportDetailRow}>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                      <Text style={styles.exportDetailText}>
                        <Text style={styles.exportDetailLabel}>{t('export.date_range')}: </Text>
                        {dateUtils.formatDateShort(dateRange.startDate, i18n.language)} - {dateUtils.formatDateShort(dateRange.endDate, i18n.language)}
                      </Text>
                    </View>

                    <View style={styles.exportDetailRow}>
                      <Ionicons name="folder-outline" size={20} color="#666" />
                      <Text style={styles.exportDetailText}>
                        <Text style={styles.exportDetailLabel}>{t('export.location')}: </Text>
                        {selectedDirectory}
                      </Text>
                    </View>

                    <View style={styles.exportDetailRow}>
                      <Ionicons name="trending-up-outline" size={20} color="#28a745" />
                      <Text style={styles.exportDetailText}>
                        <Text style={styles.exportDetailLabel}>{t('export.total_income')}: </Text>
                        {uangUtils.formatAmount(stats.totalIncome, mataUang)}
                      </Text>
                    </View>

                    <View style={styles.exportDetailRow}>
                      <Ionicons name="trending-down-outline" size={20} color="#dc3545" />
                      <Text style={styles.exportDetailText}>
                        <Text style={styles.exportDetailLabel}>{t('export.total_expenses')}: </Text>
                        {uangUtils.formatAmount(stats.totalExpenses, mataUang)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.confirmationText}>
                    {t('export.csv_file_message')}
                  </Text>

                  <View style={styles.confirmationButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setExportModalVisible(false)}
                    >
                      <Ionicons name="close-outline" size={20} color="#666" style={styles.buttonIcon} />
                      <Text style={styles.cancelButtonText}>{t('export.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={exportToCSV}
                    >
                      <Ionicons name="download-outline" size={20} color="#fff" style={styles.buttonIcon} />
                      <Text style={styles.confirmButtonText}>{t('export.export')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Pressable>
          </Modal>

          {/* Date Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={tempStartDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              maximumDate={tempEndDate}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={tempEndDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              minimumDate={tempStartDate}
            />
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f8f9fa', // Remove this line
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 100,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    flexWrap: 'nowrap',
    lineHeight: 14,
  },
  optionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  quickRangeLabel: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
    marginRight: 8,
  },
  exportButton: {
    backgroundColor: '#007bff',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  exportButtonDisabled: {
    backgroundColor: '#ccc',
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  directoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  directoryOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  directoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  directoryName: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRangeContent: {
    padding: 20,
  },
  dateInputContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  quickDateButton: {
    flex: 1,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickDateButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  quickDateButtonText: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
  quickDateButtonTextSelected: {
    color: '#fff',
  },
  confirmDateButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  confirmDateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmationContent: {
    alignItems: 'center',
    padding: 20,
  },
  confirmationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportDetailsContainer: {
    width: '100%',
    marginBottom: 20,
  },
  exportDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exportDetailText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  exportDetailLabel: {
    fontWeight: '600',
    color: '#666',
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonIcon: {
    marginRight: 4,
  },
});