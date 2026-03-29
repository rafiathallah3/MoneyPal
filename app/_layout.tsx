import { Text, TextInput } from '@/app/components/StyledText';
import { useTransactions } from '@/hooks/useTransactions';
import { storageUtils } from '@/utils/storage';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import '../utils/i18n';
import DrawerContent from './components/DrawerContent';
import LockScreen from './components/LockScreen';
import Welcome from './welcome';

const Drawer = createDrawerNavigator();

// Cleaned up scaling code

if ((TextInput as any).render) {
    const TextInputRender = (TextInput as any).render;
    (TextInput as any).render = function (...args: any[]) {
        const origin = TextInputRender.call(this, ...args);
        return React.cloneElement(origin, {
            allowFontScaling: false,
        });
    };
} else {
    // Fallback if render is not available
    (TextInput as any).defaultProps = { ...((TextInput as any).defaultProps || {}), allowFontScaling: false };
}

function TabsStack() {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="preferences" options={{ headerShown: false }} />
            <Stack.Screen name="exportRecord" options={{ headerShown: false }} />
            <Stack.Screen name="backup" options={{ headerShown: false }} />
            <Stack.Screen name="restore" options={{ headerShown: false }} />
            <Stack.Screen name="allTransactions" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack>
    );
}

export default function RootLayout() {
    const { hapusSemua } = useTransactions();
    const router = useRouter();
    const { t } = useTranslation();

    const [pinAsli, setPin] = React.useState("");
    const [isUnlocked, setIsUnlocked] = React.useState(true);
    const [showWelcome, setShowWelcome] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    useEffect(() => {
        (async () => {
            try {
                // Check if first launch
                const isFirstLaunch = await storageUtils.checkIsFirstLaunch();
                if (isFirstLaunch) {
                    setShowWelcome(true);
                    setIsLoading(false);
                    return;
                }

                const storedPin = await storageUtils.dapatinPin();
                setPin(storedPin);
                setIsUnlocked(storedPin === "");
            } catch (e) {
                console.error("Error in RootLayout init", e);
            } finally {
                setIsLoading(false);
            }
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

    const onWelcomeFinish = async () => {
        const storedPin = await storageUtils.dapatinPin();
        setPin(storedPin);
        setIsUnlocked(true); // Unlock automatically after setup
        setShowWelcome(false);
    }

    if (isLoading) {
        return null; // Or a splash screen
    }

    if (showWelcome) {
        return <Welcome onDismiss={onWelcomeFinish} />;
    }

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