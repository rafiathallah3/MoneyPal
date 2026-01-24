import { lightTheme as theme } from '@/utils/themes';
import { Ionicons } from '@expo/vector-icons';
import { Router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, InteractionManager, Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

interface DrawerContentProps {
  navigation: any;
  onResetExpenses: () => void;
  router: Router
}

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.anonymous.MoneyPal'; // Replace with your app's Play Store URL
const adUnitId = __DEV__ ? TestIds.REWARDED : 'ca-app-pub-8697291704601178/8757284692';
const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'clothing'],
});

const DrawerContent: React.FC<DrawerContentProps> = ({ navigation, onResetExpenses }) => {
  const [loaded, setLoaded] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setLoaded(true);
        console.log("Sudah siap");
      }
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      reward => {
        // Alert.alert('Thank You!', 'Thanks for the support!');
        setShowThankYouModal(true);
        setLoaded(false);
        console.log('Dapat!', reward);
        rewarded.load();
      }
    );

    console.log('Dapatin');
    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
    };
  }, []);

  const showAd = () => {
    if (loaded) {
      rewarded.show();
    } else {
      Alert.alert('Not Ready', 'The ad is still loading. Please try again in a moment.');
    }
  };

  const KePage = (arah: string) => {
    navigation.closeDrawer();
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('TabsStack', { screen: arah });
    })
  }

  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.card }]}>
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.appIconContainer}>
          <View style={[styles.appIcon]}>
            <Image
              source={require('../../assets/images/revert-icon.png')}
              style={{ width: 40, height: 40, resizeMode: 'contain' }}
            />
          </View>
        </View>
        <Text style={[styles.appTitle, { color: theme.textColorInBackground }]}>MoneyPal</Text>
        <Text style={[styles.appSubtitle, { color: theme.lightTextSecondary }]}>{t('drawer.smart_expense_tracker')}</Text>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('drawer.main_menu')}</Text>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => KePage('preferences')}>
          <View style={[styles.iconContainer, { backgroundColor: theme.bar }]}>
            <Ionicons name="settings-outline" size={20} color={theme.primary} />
          </View>
          <Text style={[styles.menuItemText, { color: theme.text }]}>{t('drawer.preference')}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.divider} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={onResetExpenses}>
          <View style={[styles.iconContainer, { backgroundColor: '#ffebee' }]}>
            <Ionicons name="trash-outline" size={20} color="#dc3545" />
          </View>
          <Text style={[styles.menuItemText, { color: theme.text }]}>{t('drawer.reset_records')}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.divider} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => KePage('exportRecord')}>
          <View style={[styles.iconContainer, { backgroundColor: '#e8f5e8' }]}>
            <Ionicons name="download-outline" size={20} color="#28a745" />
          </View>
          <Text style={[styles.menuItemText, { color: theme.text }]}>{t('drawer.export_records')}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.divider} />
        </TouchableOpacity>

        {/* Backup Button */}
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => { KePage('backup') }}>
          <View style={[styles.iconContainer, { backgroundColor: '#e3fcec' }]}>
            <Ionicons name="cloud-upload-outline" size={20} color="#00b894" />
          </View>
          <Text style={[styles.menuItemText, { color: theme.text }]}>{t('drawer.backup')}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.divider} />
        </TouchableOpacity>

        {/* Restore Button */}
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => { KePage('restore') }}>
          <View style={[styles.iconContainer, { backgroundColor: '#e3f0fc' }]}>
            <Ionicons name="cloud-download-outline" size={20} color="#0984e3" />
          </View>
          <Text style={[styles.menuItemText, { color: theme.text }]}>{t('drawer.restore')}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.divider} />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.divider }]} />

      {/* Support Section */}
      <View style={styles.menuSection}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('drawer.support')}</Text>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={() => Linking.openURL(PLAY_STORE_URL)}>
          <View style={[styles.iconContainer, { backgroundColor: '#fce4ec' }]}>
            <Ionicons name="heart-outline" size={20} color="#ff4081" />
          </View>
          <Text style={[styles.menuItemText, { color: theme.text }]}>{t('drawer.rate_app')}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.divider} />
        </TouchableOpacity>

        {/* Support Button, add feature to watch an ad once the button is clicked  */}
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.card }]} onPress={showAd} disabled={!loaded}>
          <View style={[styles.iconContainer, { backgroundColor: '#e0f7fa' }]}>
            <Ionicons name="star-outline" size={20} color="#00bcd4" />
          </View>
          <Text style={[styles.menuItemText, { color: theme.text }]}>{t('drawer.support')}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.divider} />
        </TouchableOpacity>
      </View>

      {/* Thank You Modal */}
      <Modal
        visible={showThankYouModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowThankYouModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.iconContainerModal}>
              <Ionicons name="heart" size={50} color="#ff4081" />
            </View>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{t('drawer.thank_you') || 'Thank You!'}</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              {t('drawer.thank_you_desc') || 'Thanks for the support! Your contribution helps us improve the app.'}
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
              onPress={() => setShowThankYouModal(false)}
            >
              <Text style={styles.closeButtonText}>{t('general.close') || 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#007bff',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  appIconContainer: {
    marginBottom: 16,
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
    fontWeight: '500',
    marginBottom: 8,
  },
  versionText: {
    fontSize: 12,
    color: '#bbdefb',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 0,
  },
  menuSection: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#757575',
    marginHorizontal: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '400',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconContainerModal: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fce4ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DrawerContent; 