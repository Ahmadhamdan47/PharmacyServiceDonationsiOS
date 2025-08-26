// TokenValidator.js - Utility to validate stored tokens
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';

export const validateStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    if (!token) {
      console.log('No token found in storage');
      return { valid: false, reason: 'NO_TOKEN' };
    }
    
    console.log('Found stored token, validating...');
    
    // Try to access a protected endpoint to validate the token
    try {
      const response = await axios.get('https://apiv2.medleb.org/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Token validation successful:', response.status);
      return { valid: true, data: response.data };
    } catch (error) {
      console.log('Token validation failed:', error.response?.status, error.response?.data);
      
      if (error.response?.status === 401) {
        // Token is invalid or expired
        await AsyncStorage.removeItem('token');
        return { valid: false, reason: 'INVALID_TOKEN' };
      } else if (error.response?.status === 404) {
        // Endpoint might not exist - not necessarily a token issue
        return { valid: false, reason: 'ENDPOINT_NOT_FOUND' };
      }
      
      return { valid: false, reason: 'VALIDATION_ERROR', error: error.message };
    }
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, reason: 'VALIDATION_ERROR', error: error.message };
  }
};

export const clearInvalidTokens = async () => {
  try {
    const tokenKeys = [
      'token',
      'tempToken'
    ];
    
    await AsyncStorage.multiRemove(tokenKeys);
    console.log('Invalid tokens cleared');
    return true;
  } catch (error) {
    console.error('Error clearing invalid tokens:', error);
    return false;
  }
};

export const checkTokenOnAppStart = async () => {
  const validation = await validateStoredToken();
  
  if (!validation.valid) {
    console.log('Stored token is invalid, clearing auth data');
    await clearInvalidTokens();
    
    if (validation.reason === 'INVALID_TOKEN') {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please sign in again.',
        [{ text: 'OK' }]
      );
    }
  }
  
  return validation;
};

export default {
  validateStoredToken,
  clearInvalidTokens,
  checkTokenOnAppStart
};
