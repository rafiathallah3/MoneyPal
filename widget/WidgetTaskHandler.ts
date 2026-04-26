import React from 'react';
import { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { WidgetUI } from './WidgetUI';
import { storageUtils } from '../utils/storage';
import { Transaction } from '../types/types';

const nameToWidgetMap: Record<string, any> = {
  // HelloWidget is the name defined in the config plugin.
  // We'll rename it in app.json if needed, but the default name is 'HelloWidget' 
  // if not specified in the app.json plugin config. Let's assume the default 
  // name provided by the library or "MoneyPalWidget" if we define it.
  // Wait, let's just render WidgetUI for any widget name for now.
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const WidgetComponent = nameToWidgetMap[widgetInfo.widgetName] || WidgetUI;

  // 1. Fetch data
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const transactions: Transaction[] = await storageUtils.getTransactionsForDate(today);
  const currencySymbol = await storageUtils.dapatinMataUang();

  // Calculate totals
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
  });

  // 2. Render Widget
  props.renderWidget(
    React.createElement(WidgetUI, {
      transactions,
      totalIncome,
      totalExpense,
      currencySymbol
    })
  );
}
