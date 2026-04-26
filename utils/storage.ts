import AsyncStorage from '@react-native-async-storage/async-storage';
import { Category, Tipe_MataUang, Tipe_WarnaTema, TipeBudget, Transaction } from '../types/types';
import { CURRENCIES } from './preferences';

const TRANSACTIONS_KEY = 'moneypal_transactions';
const WARNATEMA_KEY = 'moneypal_theme';
const MATAUANG_KEY = 'moneypal_matauang';
const CUSTOM_CATEGORIES_KEY = 'moneypal_custom_categories';
const BUDGET_KEY = 'moneypal_budget';
const NOTIFIKASI_KEY = "moneypal_daily_reminder";
const WAKTU_NOTIFIKASI_KEY = "moneypal_daily_reminder_time";
const PIN_KEY = "moneypal_pin";
const HINT_KEY = "moneypal_pin_hint";
const LANG_KEY = 'moneypal_language';
const HAS_LAUNCHED_KEY = 'moneypal_has_launched';

export const storageUtils = {
  // Save all transactions
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      
      // Attempt to update the Android widget
      try {
        await this.updateWidget();
      } catch (e) {
        console.error('Error updating widget:', e);
      }
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  },

  // Load all transactions
  async loadTransactions(): Promise<Transaction[]> {
    try {
      return await this.processRecurringTransactions();
    } catch (error) {
      console.error('Error loading transactions:', error);
      return [];
    }
  },

  // Add a new transaction
  async addTransaction(transaction: Transaction): Promise<Transaction[]> {
    try {
      const existingTransactions = await this.loadTransactions();
      const updatedTransactions = [...existingTransactions, transaction];
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Error adding transaction:', error);
      return [];
    }
  },

  // Delete a transaction
  async deleteTransaction(transactionId: string): Promise<Transaction[]> {
    try {
      const existingTransactions = await this.loadTransactions();
      const updatedTransactions = existingTransactions.filter(
        transaction => transaction.id !== transactionId
      );
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return [];
    }
  },

  // Get transactions for a specific date
  async getTransactionsForDate(date: string): Promise<Transaction[]> {
    try {
      const allTransactions = await this.loadTransactions();
      return allTransactions.filter(transaction => transaction.date === date);
    } catch (error) {
      console.error('Error getting transactions for date:', error);
      return [];
    }
  },

  // Update a transaction
  async updateTransaction(updated: Transaction): Promise<Transaction[]> {
    try {
      const existingTransactions = await this.loadTransactions();
      const updatedTransactions = existingTransactions.map(transaction =>
        transaction.id === updated.id ? { ...transaction, ...updated } : transaction
      );
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return [];
    }
  },

  async clearAllTransactions(): Promise<void> {
    try {
      await this.saveTransactions([]);
    } catch (error) {
      console.error('Error clearing transaction:', error);
    }
  },

  async dapatinWarnaTema(): Promise<Tipe_WarnaTema> {
    try {
      const data = await AsyncStorage.getItem(WARNATEMA_KEY);
      if (data) {
        return data as "sistem";
      }

      return "sistem";
    } catch (e) {
      console.error("Error saat mendapatkan warna tema", e);
      return "sistem";
    }
  },

  async simpanWarnaTema(warna: Tipe_WarnaTema): Promise<void> {
    try {
      await AsyncStorage.setItem(WARNATEMA_KEY, warna);
    } catch (e) {
      console.error("Error saat menyimpan warna tema", e);
    }
  },

  async simpanMataUang(mataUang: Tipe_MataUang): Promise<void> {
    try {
      await AsyncStorage.setItem(MATAUANG_KEY, mataUang)
    } catch (error) {
      console.error('Error simpan mata uang:', error);
    }
  },

  async dapatinMataUang(): Promise<Tipe_MataUang> {
    try {
      const data = await AsyncStorage.getItem(MATAUANG_KEY);

      if (CURRENCIES.find((v) => v.symbol === data) === undefined) {
        return "$";
      }

      return data as Tipe_MataUang;
    } catch (error) {
      console.error('Error dapatin mata uang:', error);
      return "$";
    }
  },

  async dapatinCustomKategori(): Promise<Category[]> {
    try {
      const kategori = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return kategori ? JSON.parse(kategori) : [];
    } catch (error) {
      console.error("Error dapatin custom kategori", error);
      return [];
    }
  },

  async simpanCustomKategori(kategori: Category): Promise<Category[]> {
    try {
      const semuaKategori = await this.dapatinCustomKategori();
      const updateKategori = [...semuaKategori, kategori];
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updateKategori));
      return updateKategori;
    } catch (error) {
      console.error("ERror simpan custom kategori", error);
      return [];
    }
  },

  async updateCustomKategori(kategori: Category): Promise<Category[]> {
    try {
      const semuaKategori = await this.dapatinCustomKategori();
      const updateKategori = semuaKategori.map(dalamKategori =>
        dalamKategori.id === kategori.id ? { ...dalamKategori, ...kategori } : dalamKategori
      );
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updateKategori));
      return updateKategori;
    } catch (error) {
      console.error("Error update custom kategori", error);
      return [];
    }
  },

  async hapusCustomKategori(id: string): Promise<Category[]> {
    try {
      const existingTransactions = await this.loadTransactions();
      existingTransactions.map((v) => {
        if (v.id === id) {
          v.category = v.type === "expense" ? "other_expense" : "other_income";
        }

        return v;
      });
      await this.saveTransactions(existingTransactions);

      const semuaKategori = await this.dapatinCustomKategori();
      const updateKategori = semuaKategori.filter((val) => val.id !== id);
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(updateKategori));
      return updateKategori;
    } catch (error) {
      console.error("Error hapus custom kategori", error);
      return [];
    }
  },

  async hapusSemuaCustomKategori(): Promise<void> {
    try {
      await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  },

  async dapatinNotifikasi(): Promise<[boolean, { hour: number; minute: number }]> {
    try {
      const value = await AsyncStorage.getItem(NOTIFIKASI_KEY);
      const waktuRaw = await AsyncStorage.getItem(WAKTU_NOTIFIKASI_KEY);

      const waktu = { hour: 20, minute: 0 };
      if (waktuRaw !== null) {
        const { hour, minute } = JSON.parse(waktuRaw);
        waktu.hour = hour;
        waktu.minute = minute;
      }

      return [value === 'true', waktu];
    } catch (e: any) {
      console.log("Error saat ingin load notifikasi", e);
      return [false, { hour: 20, minute: 0 }]
    }
  },

  async simpanOpsiNotifikasi(opsi: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFIKASI_KEY, opsi.toString());
    } catch (error) {
      console.log("Error saat ingin simpan opsi notifikasi", error);
    }
  },

  async simpanWaktuNotifikasi(waktu: { hour: number, minute: number }): Promise<void> {
    try {
      await AsyncStorage.setItem(WAKTU_NOTIFIKASI_KEY, JSON.stringify(waktu));
    } catch (error) {
      console.log("Error saat ingin simpan waktu notifikasi", error);
    }
  },

  async dapatinPin(): Promise<string> {
    try {
      const pin = await AsyncStorage.getItem(PIN_KEY);
      return pin || "";
    } catch (error) {
      console.error('Error dapatin pin:', error);
      return "";
    }
  },

  async simpanPin(pin: string): Promise<void> {
    try {
      await AsyncStorage.setItem(PIN_KEY, pin);
    } catch (error) {
      console.error('Error simpan pin:', error);
    }
  },

  async dapatinHint(): Promise<string> {
    try {
      const hint = await AsyncStorage.getItem(HINT_KEY);
      return hint || "";
    } catch (error) {
      console.error('Error dapatin pin hint:', error);
      return "";
    }
  },

  async simpanHint(hint: string): Promise<void> {
    try {
      await AsyncStorage.setItem(HINT_KEY, hint);
    } catch (error) {
      console.error('Error simpan pin hint:', error);
    }
  },

  async saveBudgetData(data: TipeBudget): Promise<void> {
    try {
      await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving budget data:', error);
    }
  },

  async loadBudgetData(): Promise<TipeBudget> {
    try {
      const data = await AsyncStorage.getItem(BUDGET_KEY);
      return data ? JSON.parse(data) : { budget: {}, default: {} };
    } catch (error) {
      console.error('Error loading budget data:', error);
      return { budget: {}, default: {} };
    }
  },

  async dapatinBahasa(): Promise<string> {
    try {
      const data = await AsyncStorage.getItem(LANG_KEY);
      return data || 'en';
    } catch (error) {
      console.error('Error loading language:', error);
      return 'en';
    }
  },

  async simpanBahasa(bahasa: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LANG_KEY, bahasa);
      await this.updateWidget();
    } catch (error) {
      console.error('Error saving language:', error);
    }
  },

  async updateWidget(): Promise<void> {
    try {
      const { requestWidgetUpdate } = require('react-native-android-widget');
      const React = require('react');
      const { WidgetUI } = require('../widget/WidgetUI');

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const transactions = await this.getTransactionsForDate(today);
      const currencySymbol = await this.dapatinMataUang();
      
      const language = await this.dapatinBahasa();
      const locales: Record<string, any> = {
        en: require('../locales/en.json'),
        id: require('../locales/id.json'),
        ja: require('../locales/ja.json'),
        zh: require('../locales/zh.json'),
        tl: require('../locales/tl.json'),
        mm: require('../locales/mm.json'),
        jv: require('../locales/jv.json'),
        sn: require('../locales/sn.json')
      };
      const translations = locales[language] || locales['en'];
      const todayStrings: Record<string, string> = {
        en: "Today", id: "Hari Ini", ja: "今日", zh: "今天", tl: "Ohin", mm: "ယနေ့", jv: "Dina Iki", sn: "Dinten Ieu"
      };
      const widgetTranslations = {
        today: todayStrings[language] || "Today",
        transactions: translations.transactions || "Transactions",
        noTransactions: translations.no_transactions_for_this_summary_mode || "No transactions today"
      };

      let totalIncome = 0;
      let totalExpense = 0;
      transactions.forEach((t) => {
        if (t.type === 'income') totalIncome += t.amount;
        if (t.type === 'expense') totalExpense += t.amount;
      });

      await requestWidgetUpdate({
        widgetName: 'HelloWidget',
        renderWidget: () => React.createElement(WidgetUI, {
          transactions,
          totalIncome,
          totalExpense,
          currencySymbol,
          language,
          widgetTranslations
        }),
      });
    } catch (e) {
      console.error('Error updating widget:', e);
    }
  },

  async processRecurringTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      const allTransactions: Transaction[] = data ? JSON.parse(data) : [];
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      let updatedTransactions = [...allTransactions];
      let hasOverallChanges = false;

      // Find original recurring templates
      const recurringTemplates = allTransactions.filter(t => t.isRecurring && !t.parentId);

      for (const template of recurringTemplates) {
        let lastDateStr = template.lastRecurrenceDate || template.date;
        const { dateUtils } = require('./dateUtils');
        let lastDate = dateUtils.parseDate(lastDateStr);
        let remaining = template.recurrenceRemaining ?? 0;
        let nextDate = dateUtils.addInterval(lastDate, template.recurrenceInterval!);
        let hasTemplateChanges = false;

        while (
          dateUtils.formatDate(nextDate) <= todayStr && 
          (template.recurrenceEndType === 'forever' || remaining > 0)
        ) {
          // Create new transaction
          const newTransaction: Transaction = {
            ...template,
            id: `rec_${template.id}_${nextDate.getTime()}`,
            date: dateUtils.formatDate(nextDate),
            createdAt: new Date().toISOString(),
            isRecurring: false, // Instances are not recurring templates themselves
            parentId: template.id,
          };
          delete newTransaction.recurrenceInterval;
          delete newTransaction.recurrenceEndType;
          delete newTransaction.recurrenceCount;
          delete newTransaction.recurrenceRemaining;
          delete newTransaction.lastRecurrenceDate;

          updatedTransactions.push(newTransaction);
          
          lastDate = nextDate;
          if (template.recurrenceEndType === 'count') {
            remaining--;
          }
          nextDate = dateUtils.addInterval(lastDate, template.recurrenceInterval!);
          hasTemplateChanges = true;
          hasOverallChanges = true;
        }

        if (hasTemplateChanges) {
          // Update the template in the list
          updatedTransactions = updatedTransactions.map(t => 
            t.id === template.id 
              ? { ...t, lastRecurrenceDate: dateUtils.formatDate(lastDate), recurrenceRemaining: remaining }
              : t
          );
        }
      }

      if (hasOverallChanges) {
        await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
      }
      return updatedTransactions;
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      return [];
    }
  },

  async checkIsFirstLaunch(): Promise<boolean> {
    try {
      const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED_KEY);
      return hasLaunched === null;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return false; // Assume not first launch on error to be safe
    }
  },

  async setHasLaunched(): Promise<void> {
    try {
      await AsyncStorage.setItem(HAS_LAUNCHED_KEY, 'true');
    } catch (error) {
      console.error('Error setting has launched:', error);
    }
  }
}; 