import { useTransactions } from '@/hooks/useTransactions';
import { storageUtils } from '@/utils/storage';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, TextInput } from 'react-native';
import '../utils/i18n';
import DrawerContent from './components/DrawerContent';
import LockScreen from './components/LockScreen';

const Drawer = createDrawerNavigator();

// Disable font scaling globally for Text and TextInput components
interface TextWithDefaultProps extends Text {
    defaultProps?: { allowFontScaling?: boolean };
}

interface TextInputWithDefaultProps extends TextInput {
    defaultProps?: { allowFontScaling?: boolean };
}

(Text as unknown as TextWithDefaultProps).defaultProps = {
    ...((Text as unknown as TextWithDefaultProps).defaultProps || {}),
    allowFontScaling: false,
};

(TextInput as unknown as TextInputWithDefaultProps).defaultProps = {
    ...((TextInput as unknown as TextInputWithDefaultProps).defaultProps || {}),
    allowFontScaling: false,
};

function TabsStack() {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="preferences" options={{ headerShown: false }} />
            <Stack.Screen name="exportRecord" options={{ headerShown: false }} />
            <Stack.Screen name="backup" options={{ headerShown: false }} />
            <Stack.Screen name="restore" options={{ headerShown: false }} />
        </Stack>
    );
}

export default function RootLayout() {
    const { hapusSemua } = useTransactions();
    const router = useRouter();
    const { t } = useTranslation();

    const [pinAsli, setPin] = React.useState("");
    const [isUnlocked, setIsUnlocked] = React.useState(true);

    useEffect(() => {
        (async () => {
            setPin(await storageUtils.dapatinPin());
            setIsUnlocked(pinAsli !== "");
        })();
    }, []);


    // Handler for resetting expenses
    const handleResetExpenses = () => {
        Alert.alert(t('reset_expenses.title'), t('reset_expenses.message'), [
            { text: t('reset_expenses.cancel'), style: 'cancel' },
            {
                text: t('reset_expenses.reset'), style: 'destructive', onPress: () => {
                    hapusSemua();
                }
            },
        ]);
    };

    if (!isUnlocked && pinAsli !== "") {
        return <LockScreen pinAsli={pinAsli} onUnlock={() => setIsUnlocked(true)} />;
    }

    return (
        <Drawer.Navigator
            initialRouteName="TabsStack"
            drawerContent={(props) => (
                <DrawerContent
                    {...props}
                    router={router}
                    onResetExpenses={handleResetExpenses}
                />
            )}
            screenOptions={{ headerShown: false, drawerType: 'front' }}
        >
            <Drawer.Screen name="TabsStack" component={TabsStack} options={{ title: 'Home' }} />
        </Drawer.Navigator>
    );
}