import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }

  return true;
};

export const scheduleCrowdDensityNotification = async (
  area: string,
  density: 'medium' | 'high' | 'critical'
) => {
  const messages = {
    medium: `Moderate crowd levels detected in ${area}. Consider alternative routes.`,
    high: `High crowd density in ${area}! Please avoid this area if possible.`,
    critical: `⚠️ CRITICAL: Dangerous crowd levels in ${area}! Seek alternative location immediately.`,
  };

  await Notifications.scheduleNotificationAsync({
    content: {
      title: density === 'critical' ? '🚨 Crowd Alert' : '⚠️ Crowd Warning',
      body: messages[density],
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Send immediately
  });
};

export const scheduleEmergencyNotification = async (
  message: string,
  location?: string
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🚨 Emergency Alert',
      body: location ? `${message} - Location: ${location}` : message,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
    },
    trigger: null,
  });
};

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const hasPermission = await requestNotificationPermissions();
  
  if (hasPermission) {
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push notification token:', token);
  }

  return token;
};