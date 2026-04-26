import React from 'react';
import { FlexWidget, ImageWidget, TextWidget } from 'react-native-android-widget';
import { Transaction } from '../types/types';
import { getCategoryById, TranslateKategori } from '../utils/categories';

interface WidgetUIProps {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  currencySymbol: string;
  language: string;
  widgetTranslations: {
    today: string;
    transactions: string;
    noTransactions: string;
  };
}

export function WidgetUI({ transactions, totalIncome, totalExpense, currencySymbol, language, widgetTranslations }: WidgetUIProps) {
  const netTotal = totalIncome - totalExpense;
  const isPositive = netTotal >= 0;

  const recentTransactions = [...transactions].sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        flexDirection: 'row',
      }}
    >
      {/* Left Side: Logo and Summary (Dark Blue to match icon) */}
      <FlexWidget
        style={{
          width: 80,
          height: 'match_parent',
          backgroundColor: '#2480e8',
          borderTopLeftRadius: 20,
          borderBottomLeftRadius: 20,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 12,
        }}
      >
        <ImageWidget
          image={require('../assets/images/icon.png')}
          imageWidth={48}
          imageHeight={48}
          style={{ width: 48, height: 48, marginBottom: 2 }}
        />
        <TextWidget
          text={widgetTranslations.today}
          style={{ fontSize: 16, color: '#ffffff', fontWeight: 'bold' }}
        />
      </FlexWidget>

      {/* Right Side: Transactions List (White) */}
      <FlexWidget
        style={{
          flex: 1,
          height: 'match_parent',
          padding: 12,
          flexDirection: 'column',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderColor: '#e9ecef', paddingBottom: 6 }}>
          <TextWidget
            text={widgetTranslations.transactions}
            style={{ fontSize: 14, color: '#2c3e50', fontWeight: 'bold', width: 100 }}
            maxLines={1}
          />
          <TextWidget
            text={`${isPositive ? '+ ' : '- '}${currencySymbol}${Math.abs(netTotal).toLocaleString()}`}
            style={{ fontSize: 13, color: isPositive ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}
            maxLines={1}
          />
        </FlexWidget>

        <FlexWidget style={{ flexDirection: 'column', flex: 1 }}>
          {recentTransactions.length === 0 ? (
            <FlexWidget style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <TextWidget
                text={widgetTranslations.noTransactions}
                style={{ fontSize: 13, color: '#adb5bd' }}
              />
            </FlexWidget>
          ) : (
            recentTransactions.slice(0, 1).map((t, index) => (
              <FlexWidget
                key={t.id || index.toString()}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 4,
                  borderBottomWidth: 0,
                  borderColor: '#f8f9fa',
                }}
              >
                <FlexWidget style={{ flexDirection: 'column', width: 100, paddingRight: 4 }}>
                  <TextWidget
                    text={t.category && TranslateKategori[language]?.[t.category] ? TranslateKategori[language][t.category] : getCategoryById(t.category || '', t.type)?.name || t.category || 'Unknown'}
                    style={{ fontSize: 13, color: '#495057', fontWeight: 'bold' }}
                    maxLines={1}
                  />
                  {t.description ? (
                    <TextWidget
                      text={t.description || ''}
                      style={{ fontSize: 11, color: '#6c757d' }}
                      maxLines={1}
                    />
                  ) : null}
                </FlexWidget>
                <TextWidget
                  text={`${t.type === 'income' ? '+' : '-'}${currencySymbol}${t.amount.toLocaleString()}`}
                  style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: t.type === 'income' ? '#4CAF50' : '#F44336',
                  }}
                  maxLines={1}
                />
              </FlexWidget>
            ))
          )}

          {recentTransactions.length > 1 && (
            <FlexWidget style={{ alignItems: 'center' }}>
              <TextWidget
                text={`+${recentTransactions.length - 1}`}
                style={{ fontSize: 11, color: '#007bff', fontWeight: 'bold' }}
              />
            </FlexWidget>
          )}
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
