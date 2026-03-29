import { Text } from '@/app/components/StyledText';
import { useBudget } from '@/hooks/useBudget';
import { useKategori } from '@/hooks/useCategory';
import { useMataUang, useNotifikasi } from '@/hooks/usePreference';
import { useTransactions } from '@/hooks/useTransactions';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import HeaderAplikasi from './components/HeaderAplikasi';
import { StatusBar } from 'expo-status-bar';
async function getImageBase64(uri: string): Promise<string | null> {
    try {
        if (!uri) return null;
        // Remove file:// if present
        const cleanUri = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
        const base64 = await RNFS.readFile(cleanUri, 'base64');
        return base64;
    } catch (e) {
        return null;
    }
}

export default function Backup() {
    const { opsi, waktu, dapat: dapatNotifikasi } = useNotifikasi();
    const { transactions, dapat: dapatTransaction } = useTransactions();
    const { kategori, dapat: dapatKategori } = useKategori();
    const { mataUang, dapat: dapatMataUang } = useMataUang();
    const { budgetData, dapat: dapatBudget } = useBudget();
    const [isBackingUp, setIsBackingUp] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        dapatKategori();
        dapatMataUang();
        dapatNotifikasi();
        dapatBudget();
        dapatTransaction();
    }, []);

    const handleBackup = async () => {
        setIsBackingUp(true);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const fileName = `moneypal-backup-${timestamp}.json`;

        try {
            // Gather all image URIs
            const imageUris = Array.from(new Set(transactions.map(t => t.imageUri).filter(Boolean))) as string[];
            // Read and encode images
            const images: Record<string, string> = {};
            for (const uri of imageUris) {
                const base64 = await getImageBase64(uri);
                if (base64) images[uri] = base64;
            }
            // Bundle data
            const backupData = {
                transactions,
                categories: kategori,
                images, // { uri: base64 }
                budget: budgetData,
                preference: {
                    mataUang,
                    notifikasi: { opsi, waktu }
                },
                backupCreatedAt: new Date().toISOString(),
                version: 1,
            };

            // Save as JSON
            const json = JSON.stringify(backupData, null, 2);
            const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
            await RNFS.writeFile(filePath, json, 'utf8');
            // Share the file
            await Share.open({
                title: 'Share Backup',
                message: 'Your MoneyPal backup file',
                url: `file://${filePath}`,
                type: 'application/json',
                filename: fileName,
            });

            Alert.alert(t('backup.success_title'), t('backup.success_message', { fileName }));
        } catch (error: any) {
            if (error.message === 'User did not share') {
                Alert.alert(t('backup.success_title'), t('backup.success_message', { fileName }));
            } else {
                Alert.alert(t('backup.failed_title'), t('backup.failed_message'));
            }
        } finally {
            setIsBackingUp(false);
        }
    };

    return (
        <LinearGradient colors={["#f8f9fa", "#e3f2fd", "#f8f9fa"]} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar style="dark" />
                {/* Header with Back Button */}
                <HeaderAplikasi subtitle={t('backup.backup_data')} pageUtama={false} icon='cloud-upload-outline' />

                <View style={styles.centered}>
                    <View style={styles.card}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="cloud-upload-outline" size={44} color="#00b894" />
                        </View>
                        <Text style={styles.title}>{t('backup.backup_your_data')}</Text>
                        <Text style={styles.desc}>{t('backup.backup_desc')}</Text>
                        <View style={styles.infoRow}>
                            <Ionicons name="folder-outline" size={20} color="#007bff" style={{ marginRight: 6 }} />
                            <Text style={styles.infoText}>{t('backup.export_file_location')}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.button, isBackingUp && styles.buttonDisabled]}
                            onPress={handleBackup}
                            disabled={isBackingUp}
                        >
                            <Ionicons name={isBackingUp ? 'hourglass-outline' : 'cloud-upload-outline'} size={24} color="#fff" />
                            <Text style={styles.buttonText}>{isBackingUp ? t('backup.backing_up') : t('backup.backup_now')}</Text>
                        </TouchableOpacity>
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
        backgroundColor: '#e3fcec',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#007bff',
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f3f4',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginBottom: 24,
    },
    infoText: {
        fontSize: 14,
        color: '#495057',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00b894',
        borderRadius: 20,
        paddingVertical: 14,
        paddingHorizontal: 32,
        shadowColor: '#00b894',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
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
});