import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widget/WidgetTaskHandler';

// Register the widget task handler for headless JS
registerWidgetTaskHandler(widgetTaskHandler);

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
