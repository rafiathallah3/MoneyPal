import { useMataUang } from '@/hooks/usePreference';
import { cancelDailyReminder, requestNotificationPermission, scheduleDailyReminder } from '@/utils/notifikasi';
import { CURRENCIES, LANGUAGES } from '@/utils/preferences';
import { storageUtils } from '@/utils/storage';
import { lightTheme as theme } from '@/utils/themes';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Localization from 'expo-localization';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import i18n from '../utils/i18n';
import HeaderAplikasi from './components/HeaderAplikasi';

const APP_NAME = 'MoneyPal';
const APP_VERSION = 'v1.0.9';

const bahasaTeknologi = Localization.getLocales()[0]?.languageCode || 'en';

export default function Preferences() {
  // const colorScheme = useColorScheme();

  // const { tema, theme, dapat: dapatTema, ganti: gantiTema } = useTheme();
  const { mataUang, ganti } = useMataUang();
  const [settingNotifikasi, setSettingNotifikasi] = useState<{ opsi: boolean, waktu: { hour: number, minute: number } }>({
    opsi: false,
    waktu: { hour: 20, minute: 0 }
  })
  const [pin, setPinAsli] = useState("");
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [lockScreenEnabled, setLockScreenEnabled] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'setup' | 'verify'>('setup');
  const [currentPin, setCurrentPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(bahasaTeknologi); // default English
  // const [themeModalVisible, setThemeModalVisible] = useState(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    // Load preferences from AsyncStorage
    (async () => {
      // await dapatTema(colorScheme);
      const lang = await storageUtils.dapatinBahasa();
      if (lang) {
        setSelectedLanguage(lang);
      }

      const [opsi, waktu] = await storageUtils.dapatinNotifikasi();
      setSettingNotifikasi({ opsi, waktu });

      const pinnya = await storageUtils.dapatinPin();
      setPinAsli(pinnya);
      setLockScreenEnabled(pinnya !== "");
    })();
  }, []);

  const toggleReminder = async (value: boolean) => {
    setSettingNotifikasi({ ...settingNotifikasi, opsi: value });
    await storageUtils.simpanOpsiNotifikasi(value);

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    if (value) {
      await scheduleDailyReminder(settingNotifikasi.waktu.hour, settingNotifikasi.waktu.minute);
    } else {
      await cancelDailyReminder();
    }
  };

  const handleTimeChange = async (_: any, date?: Date) => {
    setShowTimePicker(false);

    if (date) {
      const hour = date.getHours();
      const minute = date.getMinutes();

      setSettingNotifikasi({ ...settingNotifikasi, waktu: { hour: hour, minute: minute } });
      await storageUtils.simpanWaktuNotifikasi({ hour: hour, minute: minute });

      if (settingNotifikasi.opsi) {
        await scheduleDailyReminder(hour, minute);
      }
    }
  };

  // const handleThemeChange = async (option: Tipe_WarnaTema) => {
  //   await gantiTema(option);

  //   setThemeModalVisible(false);
  // };

  return (
    <LinearGradient colors={theme.linearGradientBackground} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header with Back Button */}
        <HeaderAplikasi subtitle={t('preferences.title')} pageUtama={false} icon='settings-outline' />

        {/* Settings Cards */}
        <View style={styles.settingsContainer}>
          {/* Theme Card */}
          {/* <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider }]}> 
            <TouchableOpacity style={styles.cardContent} onPress={() => setThemeModalVisible(true)}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.bar }]}> 
                  <Ionicons name="color-palette-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Theme</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Choose app appearance</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.currencyValue, { color: theme.primary }]}> 
                  {tema === 'sistem' ? 'System Default' : tema.charAt(0).toUpperCase() + tema.slice(1)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.lightTextSecondary} />
              </View>
            </TouchableOpacity>
          </View> */}
          {/* Currency Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => setCurrencyModalVisible(true)}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.bar }]}>
                  <Ionicons name="cash-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('preferences.currency')}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{t('preferences.currency_sub')}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.currencyValue, { color: theme.primary }]}>{mataUang.symbol}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.lightTextSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Translation Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => setLanguageModalVisible(true)}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.bar }]}>
                  <Ionicons name="language-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('preferences.translation')}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{t('preferences.translation_sub')}</Text>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.currencyValue, { color: theme.primary }]}>{LANGUAGES.find(l => l.code === selectedLanguage)?.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.lightTextSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Notification Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.bar }]}>
                  <Ionicons name="notifications-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('preferences.notification')}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{t('preferences.notification_sub')}</Text>
                </View>
              </View>
              <Switch
                value={settingNotifikasi.opsi}
                onValueChange={toggleReminder}
                thumbColor={settingNotifikasi.opsi ? theme.primary : theme.card}
                trackColor={{ false: theme.divider, true: theme.bar }}
                style={styles.switch}
              />
            </View>
            {settingNotifikasi.opsi && (
              <TouchableOpacity style={[styles.timePickerButton, { backgroundColor: theme.bar }]} onPress={() => setShowTimePicker(true)}>
                <Text style={[styles.timePickerText, { color: theme.primary }]}>
                  Notification Time: {settingNotifikasi.waktu.hour.toString().padStart(2, '0')}:{settingNotifikasi.waktu.minute.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            )}
            {showTimePicker && (
              <DateTimePicker
                value={new Date(2025, 2, 2, settingNotifikasi.waktu.hour, settingNotifikasi.waktu.minute)}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Lock Screen Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
            <View style={styles.cardContent}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.bar }]}>
                  <Ionicons name="lock-closed-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('preferences.lock_screen')}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{t('preferences.lock_screen_sub')}</Text>
                </View>
              </View>
              <Switch
                value={lockScreenEnabled}
                onValueChange={(value) => {
                  setLockScreenEnabled(value);

                  if (value) {
                    // Enable lock screen - show PIN setup modal
                    setPinModalMode('setup');
                    setPinModalVisible(true);
                    setCurrentPin('');
                    setPinError('');
                  } else {
                    // Disable lock screen - show PIN verification modal
                    if (pin !== "") {
                      setPinModalMode('verify');
                      setPinModalVisible(true);
                      setCurrentPin('');
                      setPinError('');
                    }
                  }
                }}
                thumbColor={lockScreenEnabled ? theme.primary : theme.card}
                trackColor={{ false: theme.divider, true: theme.bar }}
                style={styles.switch}
              />
            </View>
          </View>

          {/* Privacy Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.divider }]}>
            <TouchableOpacity style={styles.cardContent} onPress={() => setPrivacyModalVisible(true)}>
              <View style={styles.cardLeft}>
                <View style={[styles.iconContainer, { backgroundColor: theme.bar }]}>
                  <Ionicons name="document-text-outline" size={24} color={theme.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>{t('preferences.privacy')}</Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{t('preferences.privacy_sub')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.divider} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency Modal */}
        <Modal
          visible={currencyModalVisible}
          animationType="slide"
          backdropColor={'transparent'}
          onRequestClose={() => setCurrencyModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setCurrencyModalVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.modalTitle, { color: theme.primary }]}>{t('preferences.select_currency')}</Text>
                <TouchableOpacity onPress={() => setCurrencyModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={CURRENCIES}
                keyExtractor={item => item.symbol}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.currencyOption,
                      { borderTopColor: theme.divider },
                      mataUang.symbol === item.symbol && { backgroundColor: theme.bar }
                    ]}
                    onPress={() => {
                      ganti(item.symbol);
                      setCurrencyModalVisible(false);
                    }}
                  >
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencySymbol, { color: theme.primary }]}>{item.symbol}</Text>
                      <Text style={[styles.currencyName, { color: theme.text }]}>{item.name}</Text>
                    </View>
                    {mataUang.symbol === item.symbol && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={20} color={theme.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {/* PIN Modal (Setup or Verification) */}
        <Modal
          visible={pinModalVisible}
          animationType="slide"
          backdropColor={'transparent'}
          onRequestClose={() => {
            setPinModalVisible(false);
            setLockScreenEnabled(pin !== "");
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setPinModalVisible(false);
              setLockScreenEnabled(pin !== "");
            }}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.modalTitle, { color: theme.primary }]}>
                  {pinModalMode === 'setup' ? 'Set PIN' : 'Verify PIN'}
                </Text>
                <TouchableOpacity onPress={() => {
                  setPinModalVisible(false);
                  setLockScreenEnabled(pin !== "");
                }}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.pinSetupContainer}>
                <Text style={[styles.pinSetupText, { color: theme.text }]}>
                  {pinModalMode === 'setup'
                    ? 'Enter a 4-digit PIN to lock your app'
                    : 'Enter your current PIN to disable lock screen'}
                </Text>

                <View style={styles.pinDotsContainer}>
                  {[...Array(4)].map((_, index) => {
                    const isFilled = currentPin.length > index;
                    const hasError = pinError !== '';
                    return (
                      <View
                        key={index}
                        style={[
                          styles.pinDot,
                          {
                            borderColor: hasError ? '#E74C3C' : theme.divider,
                            backgroundColor: isFilled
                              ? (hasError ? '#E74C3C' : theme.primary)
                              : theme.bar
                          }
                        ]}
                      >
                        {isFilled && (
                          <Text style={styles.pinDotText}>
                            {currentPin[index]}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>

                {pinError !== '' && (
                  <Text style={styles.pinErrorText}>{pinError}</Text>
                )}

                <View style={styles.pinKeypad}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'clear', 0, 'delete'].map((key, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.pinKey,
                        { backgroundColor: theme.bar },
                        typeof key === 'number' && styles.pinKeyNumber
                      ]}
                      onPress={() => {
                        if (key === 'delete') {
                          setCurrentPin(prev => prev.slice(0, -1));
                          setPinError('');
                        } else if (key === 'clear') {
                          setCurrentPin('');
                          setPinError('');
                        } else if (typeof key === 'number') {
                          if (currentPin.length < 4) {
                            const updatedPin = currentPin + key.toString();
                            setCurrentPin(updatedPin);
                            setPinError('');

                            // If PIN is complete
                            if (updatedPin.length === 4) {
                              setTimeout(async () => {
                                if (pinModalMode === 'setup') {
                                  // Save the new PIN
                                  await storageUtils.simpanPin(updatedPin);
                                  setPinModalVisible(false);
                                  setLockScreenEnabled(true);
                                } else {
                                  // Verify the PIN
                                  if (updatedPin === pin) {
                                    // PIN is correct, disable lock screen
                                    await storageUtils.simpanPin("");
                                    setPinModalVisible(false);
                                    setLockScreenEnabled(false);
                                  } else {
                                    // PIN is incorrect
                                    setPinError('Incorrect PIN. Try again.');
                                    setCurrentPin('');
                                  }
                                }
                              }, 300);
                            }
                          }
                        }
                      }}
                    >
                      {typeof key === 'number' ? (
                        <Text style={[styles.pinKeyText, { color: theme.text }]}>{key}</Text>
                      ) : key === 'delete' ? (
                        <Ionicons name="backspace-outline" size={24} color={theme.text} />
                      ) : (
                        <Ionicons name="close-circle-outline" size={24} color={theme.text} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </Pressable>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal
          visible={privacyModalVisible}
          animationType="slide"
          backdropColor={'transparent'}
          onRequestClose={() => setPrivacyModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setPrivacyModalVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.modalTitle, { color: theme.primary }]}>{t('preferences.privacy')}</Text>
                <TouchableOpacity onPress={() => setPrivacyModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.privacyText, { color: theme.text }]}>
                {t('preferences.privacy_text')}
              </Text>
              <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.primary }]} onPress={() => setPrivacyModalVisible(false)}>
                <Text style={[styles.closeButtonText, { color: theme.textColorInBackground }]}>{t('general.close')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Language Modal */}
        <Modal
          visible={languageModalVisible}
          animationType="slide"
          backdropColor={'transparent'}
          onRequestClose={() => setLanguageModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setLanguageModalVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.modalTitle, { color: theme.primary }]}>{t('preferences.select_language')}</Text>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={LANGUAGES}
                keyExtractor={item => item.code}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.currencyOption,
                      { borderTopColor: theme.divider },
                      selectedLanguage === item.code && { backgroundColor: theme.bar }
                    ]}
                    onPress={() => {
                      setSelectedLanguage(item.code);
                      storageUtils.simpanBahasa(item.code);
                      i18n.changeLanguage(item.code);
                      setLanguageModalVisible(false);
                    }}
                  >
                    <View style={styles.currencyInfo}>
                      <Text style={[styles.currencySymbol, { color: theme.primary }]}>{item.label}</Text>
                    </View>
                    {selectedLanguage === item.code && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark" size={20} color={theme.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        {/* Theme Modal */}
        {/* <Modal
          visible={themeModalVisible}
          animationType="slide"
          backdropColor={'transparent'}
          onRequestClose={() => setThemeModalVisible(false)}
        >
          <Pressable style={[styles.modalOverlay ]} onPress={() => setThemeModalVisible(false)}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.divider }]}>
                <Text style={[styles.modalTitle, { color: theme.primary }]}>Select Theme</Text>
                <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.currencyOption, { borderBottomColor: theme.divider }, tema === 'sistem' && { backgroundColor: theme.bar }]}
                onPress={() => handleThemeChange('sistem')}
              >
                <View style={styles.currencyInfo}>
                  <Ionicons name="phone-portrait-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
                  <Text style={[styles.currencyName, { color: theme.text }]}>System Default</Text>
                </View>
                {tema === 'sistem' && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyOption, { borderBottomColor: theme.divider }, tema === 'light' && { backgroundColor: theme.bar }]}
                onPress={() => handleThemeChange('light')}
              >
                <View style={styles.currencyInfo}>
                  <Ionicons name="sunny-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
                  <Text style={[styles.currencyName, { color: theme.text }]}>Light</Text>
                </View>
                {tema === 'light' && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.currencyOption, { borderBottomColor: theme.divider }, tema === 'dark' && { backgroundColor: theme.bar }]}
                onPress={() => handleThemeChange('dark')}
              >
                <View style={styles.currencyInfo}>
                  <Ionicons name="moon-outline" size={20} color={theme.primary} style={{ marginRight: 12 }} />
                  <Text style={[styles.currencyName, { color: theme.text }]}>Dark</Text>
                </View>
                {tema === 'dark' && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal> */}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <Text style={[styles.footerAppName, { color: theme.primary }]}>{APP_NAME}</Text>
            <Text style={[styles.footerVersion, { color: theme.textSecondary }]}>{t('general.version')} {APP_VERSION}</Text>
            <Text style={[styles.footerDev, { color: theme.textSecondary }]}>{t('general.developed_by')}</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f8f9fa',
  },
  settingsContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 18,
    shadowColor: '#90caf9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e3f2fd',
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
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginRight: 8,
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
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
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    // borderBottomWidth: 1,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  currencyOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
    color: '#007bff',
  },
  currencyName: {
    fontSize: 16,
    color: '#333',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    padding: 20,
  },
  closeButton: {
    alignSelf: 'center',
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    marginTop: 'auto',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  footerContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerAppName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  footerDev: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  timePickerButton: {
    alignSelf: 'flex-end',
    marginRight: 24,
    marginBottom: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  timePickerText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  pinSetupContainer: {
    padding: 20,
    alignItems: 'center',
  },
  pinSetupText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pinDot: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    margin: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  pinErrorText: {
    color: '#E74C3C',
    marginBottom: 20,
    fontSize: 14,
  },
  pinKeypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  pinKey: {
    width: '30%',
    aspectRatio: 1,
    margin: '1.5%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinKeyNumber: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pinKeyText: {
    fontSize: 24,
    fontWeight: '500',
  },
});