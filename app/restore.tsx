import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useBudget } from '@/hooks/useBudget';
import { useKategori } from '@/hooks/useCategory';
import { useMataUang, useNotifikasi } from '@/hooks/usePreference';
import { useTransactions } from '@/hooks/useTransactions';
import { Category, MataUang, TipeBudget, Transaction } from '@/types/types';
import { storageUtils } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { types as DocumentPickerTypes, pick } from '@react-native-documents/picker';
import { useTranslation } from 'react-i18next';
import RNFS from 'react-native-fs';
import HeaderAplikasi from './components/HeaderAplikasi';

export default function Restore({ onBack, onDone }: { onBack?: () => void, onDone?: () => void }) {
  const { mataUang, ganti: gantiMataUang } = useMataUang();
  const { opsi: opsiNotifikasi, waktu: waktuNotifikasi, ganti: gantiNotifikasi } = useNotifikasi();
  const { simpan: simpanBudget, hapusSemuaBudget } = useBudget();
  const { hapusSemua: hapusSemuaTransaction, dapat: dapatTransaksi } = useTransactions();
  const { simpan: simpanKategori, hapusSemua: hapusSemuaKategori } = useKategori();
  const [isRestoring, setIsRestoring] = useState(false);
  const [parsedData, setParsedData] = useState<{ transactions: Transaction[], categories: Category[], images: Record<string, string>, budget: TipeBudget, preference: { mataUang: MataUang, notifikasi: { opsi: boolean, waktu: { hour: number, minute: number } } }, backupCreatedAt: string, version: number } | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const { t } = useTranslation();

  const handlePickFile = async () => {
    try {
      const [res] = await pick({ type: [DocumentPickerTypes.allFiles] });
      if (!res || !res.uri) return;

      const fileContent = await RNFS.readFile(res.uri.replace('file://', ''), 'utf8');
      let data;
      try {
        data = JSON.parse(fileContent);
      } catch (e) {
        Alert.alert(t('restore.invalid_file_title'), t('restore.invalid_file_desc'));
        return;
      }
      // Validate structure
      if (!data.transactions || !data.categories || !data.images || !data.version) {
        Alert.alert(t('restore.invalid_backup_title'), t('restore.invalid_backup_desc'));
        return;
      }

      setParsedData(data);
      Alert.alert(t('restore.loaded_title'), t('restore.loaded_desc'));
    } catch (e: any) {
      console.log(e, "ERROR SAAT PICKING FILE");
      Alert.alert(t('restore.error_title'), t('restore.error_desc'));
    }
  };

  const handleRestore = async () => {
    if (!parsedData) return;

    setIsRestoring(true);
    try {
      const imageUriMap: Record<string, string> = {}; // oldUri -> newUri
      for (const [oldUri, base64] of Object.entries(parsedData.images || {})) {
        const ext = oldUri.split('.').pop() || 'jpg';
        const newUri = `${RNFS.DocumentDirectoryPath}/restored_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
        await RNFS.writeFile(newUri, base64 as string, 'base64');
        imageUriMap[oldUri] = 'file://' + newUri;
      }

      await gantiMataUang(parsedData.preference.mataUang.symbol);
      await gantiNotifikasi(parsedData.preference.notifikasi.opsi, parsedData.preference.notifikasi.waktu);

      await hapusSemuaBudget();
      await simpanBudget(parsedData.budget);

      await hapusSemuaKategori(); // clear and reload
      for (const cat of parsedData.categories) {
        await simpanKategori(cat);
      }
      await hapusSemuaTransaction();
      const totalTransactions = parsedData.transactions.length;
      const newTransactions: Transaction[] = [];
      setProgress({ current: 0, total: totalTransactions });

      console.log("Mengalokasi transaksi")
      for (let i = 0; i < totalTransactions; i++) {
        const t = parsedData.transactions[i];
        const newT: Transaction = { ...t };
        if (newT.imageUri && imageUriMap[newT.imageUri]) {
          newT.imageUri = imageUriMap[newT.imageUri];
        }
        newTransactions.push(newT);
        setProgress({ current: i + 1, total: totalTransactions });
      }
      console.log("Sudah selesai");

      // Bulk save all restored transactions at once for better performance
      await storageUtils.saveTransactions(newTransactions);
      // Refresh in-memory store so other screens see the restored data
      await dapatTransaksi();

      console.log("ALERT!!");
      Alert.alert(t('restore.restore_successful_title'), t('restore.restore_successful_desc'));
      setParsedData(null);
      onDone?.();
    } catch (e: any) {
      Alert.alert(t('restore.restore_failed_title'), `${t('restore.restore_failed_desc')} ${e}`);
    } finally {
      setIsRestoring(false);
      setProgress(null);
    }
  };

  return (
    <LinearGradient colors={["#f8f9fa", "#e3f2fd", "#f8f9fa"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header with Back Button */}
        <HeaderAplikasi subtitle={t('restore.restore_data')} pageUtama={false} icon='cloud-download-outline' onBack={onBack} />

        <View style={styles.centered}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-download-outline" size={44} color="#0984e3" />
            </View>
            <Text style={styles.title}>{t('restore.restore_your_data')}</Text>
            <Text style={styles.desc}>
              {t('restore.restore_desc')}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handlePickFile}
              disabled={isRestoring}
            >
              <Ionicons name="folder-open-outline" size={22} color="#fff" />
              <Text style={styles.buttonText}>{t('restore.choose_backup_file')}</Text>
            </TouchableOpacity>
            {parsedData && (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>{t('restore.backup_summary')}</Text>
                <Text style={styles.summaryText}>{t('restore.total_transactions')}: {parsedData.transactions.length}</Text>
                <Text style={styles.summaryText}>{t('restore.categories')}: {parsedData.categories.length}</Text>
                <Text style={styles.summaryText}>{t('restore.total_budgets')}: {Object.keys(parsedData.budget.budget).length}</Text>
                <Text style={styles.summaryText}>{t('restore.images')}: {Object.keys(parsedData.images).length}</Text>
                <Text style={styles.summaryText}>{t('restore.currency')}: {parsedData.preference.mataUang.name ?? "US Dollar"}</Text>
                <TouchableOpacity
                  style={[styles.button, isRestoring && styles.buttonDisabled, { marginTop: 18 }]}
                  onPress={handleRestore}
                  disabled={isRestoring}
                >
                  <Ionicons name={isRestoring ? 'hourglass-outline' : 'cloud-download-outline'} size={22} color="#fff" />
                  <Text style={styles.buttonText}>{isRestoring ? t('restore.restoring') : t('restore.restore_now')}</Text>
                </TouchableOpacity>
                {progress && (
                  <Text style={[styles.summaryText, { marginTop: 8 }]}>
                    {`Adding transaction: ${progress.current}/${progress.total}`}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#90caf9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e3f2fd',
    width: 340,
    maxWidth: '100%',
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e3f0fc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 22,
    lineHeight: 22,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0984e3',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: '#0984e3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#b2bec3',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 12,
  },
  summaryBox: {
    marginTop: 24,
    backgroundColor: '#f1f3f4',
    borderRadius: 14,
    padding: 18,
    width: '100%',
    alignItems: 'center',
  },
  summaryTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1976d2',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 2,
  },
});