import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';

// Architecture Note: In a production environment, use expo-secure-store 
// to persist the deviceId so it survives app reinstalls.
const API_BASE_URL = 'https://api.hogicar.com'; 

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
      console.warn('HogiCar: Failed to get push token - Permission not granted');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data;
  } else {
    console.warn('HogiCar: Must use physical device for Push Notifications');
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
    // FALLBACK: Using osBuildId, but SecureStore + UUID is recommended for production consistency
    deviceId: Device.osBuildId || Device.modelId || 'unknown-device',
    platform: Platform.OS.toUpperCase(),
    deviceModel: Device.modelName || 'Unknown Model',
    appVersion: Constants.expoConfig?.version || '1.0.0',
    osVersion: Device.osVersion || 'unknown',
    language: Localization.locale,
    country: Localization.region || 'unknown',
    timezone: Localization.timezone || 'UTC',
    userId: userId
  };

  try {
    const response = await axios.post(`${API_BASE_URL}/api/push/register`, registrationData, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('HogiCar: Push registration successful', response.status);
  } catch (error) {
    console.error('HogiCar: Failed to register for push notifications', error);
    // Exponential backoff or simple retry
    setTimeout(() => registerForPushNotificationsAsync(userId), 15000);
  }

  return token;
}
