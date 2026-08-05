import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import * as Localization from 'expo-localization';

const API_BASE_URL = 'https://api.hogicar.com'; // Replace with actual API URL

export interface PushRegistrationData {
  expoToken: string;
  deviceId: string;
  platform: string;
  deviceModel: string;
  appVersion: string;
  osVersion: string;
  language: string;
  country: string;
  timezone: string;
  userId?: number;
}

export async function registerForPushNotificationsAsync(userId?: number) {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
    return;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const registrationData: PushRegistrationData = {
    expoToken: token,
    deviceId: Device.osBuildId || 'unknown',
    platform: Platform.OS.toUpperCase(),
    deviceModel: Device.modelName || 'unknown',
    appVersion: '1.0.0', // Should come from Constants.manifest.version
    osVersion: Device.osVersion || 'unknown',
    language: Localization.locale,
    country: Localization.region || 'unknown',
    timezone: Localization.timezone,
    userId: userId
  };

  try {
    await axios.post(`${API_BASE_URL}/api/push/register`, registrationData);
    console.log('Push notification registration successful');
  } catch (error) {
    console.error('Failed to register for push notifications', error);
    // Retry logic could be implemented here
    setTimeout(() => registerForPushNotificationsAsync(userId), 5000);
  }

  return token;
}
