// AuthUtils.js - Utility functions for authentication debugging and recovery
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const clearAuthData = async () => {
  try {
    // Clear all authentication-related data
    const keysToRemove = [
      'token',
      'tempToken',
      'username',
      'tempUsername',
      'userRole',
      'tempUserRole',
      'userId',
      'donorId',
      'recipientId',
      'donorData',
      'tempDonorData',
      'recipientData',
      'tempRecipientData',
      'tempEmail',
      'otpAttempts',
      'lockoutEndTime',
      'timeoutDuration',
      'pinSet'
    ];
    
    await AsyncStorage.multiRemove(keysToRemove);
    console.log('Authentication data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

export const debugAuthState = async () => {
  try {
    const authKeys = [
      'token',
      'tempToken', 
      'username',
      'tempUsername',
      'userRole',
      'tempUserRole',
      'userId',
      'donorId',
      'recipientId'
    ];
    
    const values = await AsyncStorage.multiGet(authKeys);
    const authState = {};
    
    values.forEach(([key, value]) => {
      authState[key] = value;
    });
    
    console.log('Current auth state:', authState);
    return authState;
  } catch (error) {
    console.error('Error debugging auth state:', error);
    return {};
  }
};

export const showAuthTroubleshootingDialog = () => {
  Alert.alert(
    'Authentication Troubleshooting',
    'If you\'re experiencing sign-in issues:\n\n' +
    '1. Check your username and password\n' +
    '2. Ensure you have internet connection\n' +
    '3. Try clearing app data and signing in again\n' +
    '4. Contact support if issues persist',
    [
      { text: 'Clear App Data', onPress: clearAuthData, style: 'destructive' },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};

export default {
  clearAuthData,
  debugAuthState,
  showAuthTroubleshootingDialog
};
