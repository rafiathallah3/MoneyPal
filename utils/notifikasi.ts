import notifee, { AndroidImportance, RepeatFrequency, TimestampTrigger, TriggerType } from '@notifee/react-native';

export async function requestNotificationPermission() {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1;
}

export async function createChannel(): Promise<string> {
    return await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
    });
}

export async function scheduleDailyReminder(hour: number, minute: number) {
    // Cancel previous
    await notifee.cancelAllNotifications();

    const triggerDate = new Date(Date.now());
    triggerDate.setHours(hour);
    triggerDate.setMinutes(minute);
    triggerDate.setSeconds(0);

    if (triggerDate.getTime() < Date.now()) {
        triggerDate.setDate(triggerDate.getDate() + 1); // move to next day if already passed
    }

    const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY, // Daily
        // alarmManager: {
        //     allowWhileIdle: true,
        // },
    };

    const channelId = await createChannel();

    // await notifee.displayNotification({
    //     title: '💸 Track your expenses!',
    //     body: 'Open MoneyPal and add your daily transactions!',
    //     android: {
    //         channelId,
    //         pressAction: {
    //             id: 'default',
    //         },
    //     },
    // })

    await notifee.createTriggerNotification(
        {
            title: '💸 Track your expenses!',
            body: 'Open MoneyPal and add your daily transactions!',
            android: {
                channelId,
                pressAction: {
                    id: 'default',
                },
            },
        },
        trigger
    );
}

export async function cancelDailyReminder() {
    await notifee.cancelAllNotifications();
}
