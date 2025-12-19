import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import SignIn from './SignIn';
import SignUp from './SignUp';
import Landing from './Landing';  // Unified Landing screen
import AddDonor from './AddDonor';
import Donate from './Donate';
import List from './List';
import Inspect from './Inspect';
import DonorList from './DonorList';
import DonationDetails from './DonationDetails';
import BoxDetails from './BoxDetails';
import PackInspection from './PackInspection';
import BoxInspection from './BoxInspection';
import Validate from './Validate';
import DonorDetails from './DonorDetails';
import RecipientList from './RecipientList'; // Import RecipientList
import DonorAgreements from './DonorAgreements';
import AgreementDetails from './AgreementDetails';
import RecipientAgreement from './RecipientAgreements';
import Settings from './Settings';
const Stack = createStackNavigator();

// Keep the native splash screen visible until we manually hide it
SplashScreen.preventAutoHideAsync().catch(() => {});

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [appIsReady, setAppIsReady] = useState(false);
  const navigationRef = React.useRef();  // To navigate from anywhere

  // Preload custom fonts (optional but prevents font swap flicker)
  const [fontsLoaded] = useFonts({
    'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
    'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
    'RobotoCondensed-SemiBold': require('./assets/fonts/RobotoCondensed-SemiBold.ttf'),
    'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
    'RobotoCondensed-ExtraBold': require('./assets/fonts/RobotoCondensed-ExtraBold.ttf'),
  });

  // Set up Axios interceptor to handle 404 errors
   // Load custom fonts

  // Set up Axios interceptor to handle authentication errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,  // Return the response if it's successful
      async (error) => {
        console.log('🔍 App.js Interceptor: Caught error:', error.response?.status, error.config?.url);
        
        // Only logout on 401 (Unauthorized) or specific 404 errors that indicate invalid user/token
        if (error.response && error.response.status === 401) {
          // If the original request didn't include an Authorization header, don't treat it as a session failure
          const hadAuthHeader = !!error.config?.headers?.Authorization;
          if (!hadAuthHeader) {
            console.log('🔐 App.js Interceptor: 401 on unauthenticated request - skipping global logout');
            return Promise.reject(error);
          }

          console.log('🔐 App.js Interceptor: 401 Unauthorized - logging out user');
          await AsyncStorage.clear();  // Clear the AsyncStorage session
          setIsLoggedIn(false);  // Set the login state to false

          if (navigationRef.current) {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          }

          return Promise.reject(error);
        }
        
        // Only logout on 404 for critical endpoints (user/donor validation)
        if (error.response && error.response.status === 404) {
          const url = error.config?.url || '';
          const isCriticalEndpoint = url.includes('/Donor/') && !url.includes('/RecipientAgreements/');
          
          if (isCriticalEndpoint) {
            console.log('🔐 App.js Interceptor: 404 on critical endpoint - logging out user');
            await AsyncStorage.clear();
            setIsLoggedIn(false);

            if (navigationRef.current) {
              navigationRef.current.reset({
                index: 0,
                routes: [{ name: 'SignIn' }],
              });
            }
          } else {
            console.log('📱 App.js Interceptor: 404 on non-critical endpoint - allowing local handling');
          }
        }
        
        return Promise.reject(error);  // Always return the error for local handling
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);  // Cleanup interceptor on unmount
    };
  }, []);

  // Fetch donor data
  const fetchDonorData = async () => {
    try {
      const storedDonorId = await AsyncStorage.getItem('donorId');
      const token = await AsyncStorage.getItem('token');
      
      if (!storedDonorId) {
        setIsLoggedIn(false);
        return;
      }

      const response = await axios.get(`https://apiv2.medleb.org/Donor/${storedDonorId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 2000,  // 2-second timeout
      });

      const donorData = response.data;
      if (donorData && donorData.IsActive) {
        await AsyncStorage.setItem('status', 'true');
        setIsLoggedIn(true); // Donor is active, log in
      } else {
        await AsyncStorage.setItem('status', 'false');
        setIsLoggedIn(false); // Donor not active, log out
      }
    } catch (error) {
      console.error('Error fetching donor data:', error);
      setIsLoggedIn(false);  // Log out on error
    }
  };

  // Check login status helper
  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const role = await AsyncStorage.getItem('userRole');

      if (token && role) {
        setUserRole(role);

        if (role === 'Donor') {
          await fetchDonorData();  // For donors, fetch their data
        } else {
          setIsLoggedIn(true);  // Admin or other roles, assume logged in
        }
      } else {
        setIsLoggedIn(false);  // If no token is found, set to not logged in
      }
    } catch (error) {
      console.error('Error checking login state:', error);
      setIsLoggedIn(false);
    }
  };

  // Prepare app: wait for auth check (and fonts) before hiding splash
  useEffect(() => {
    const prepare = async () => {
      try {
        await checkLoginStatus();
      } finally {
        setAppIsReady(true);
      }
    };
    prepare();
  }, []);

  // Hide splash when everything is ready
  useEffect(() => {
    if (appIsReady && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appIsReady, fontsLoaded]);

  // Only return after the fonts are loaded
  if (!appIsReady || !fontsLoaded) {
    // Keep native splash visible
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={isLoggedIn ? 'Landing' : 'SignIn'}
          screenOptions={{ headerTitleAlign: 'center' }}
        >
          <Stack.Screen name="Landing" component={Landing} options={{ title: 'Home' }} />
          <Stack.Screen name="SignIn" component={SignIn} options={{ title: 'Sign In' }} />
          <Stack.Screen name="SignUp" component={SignUp} options={{ title: 'Sign Up' }} />
          <Stack.Screen name="AddDonor" component={AddDonor} options={{ title: 'Donate' }} />
          <Stack.Screen name="Donate" component={Donate} options={{ title: 'Donate' }} />
          <Stack.Screen name="List" component={List} options={{ title: 'List' }} />
          <Stack.Screen name="Inspect" component={Inspect} options={{ title: 'Inspect' }} />
          <Stack.Screen name="DonorList" component={DonorList} options={{ title: 'Donor List' }} />
          <Stack.Screen name="RecipientList" component={RecipientList} options={{ title: 'Recipient List' }} />
          <Stack.Screen name="DonationDetails" component={DonationDetails} options={{ title: 'Donation Details' }} />
          <Stack.Screen name="BoxDetails" component={BoxDetails} options={{ title: 'Boxes List' }} />
          <Stack.Screen name="PackInspection" component={PackInspection} options={{ title: 'Pack Inspection' }} />
          <Stack.Screen name="BoxInspection" component={BoxInspection} options={{ title: 'Box Inspection' }} />
          <Stack.Screen name="Validate" component={Validate} options={{ title: 'Validate' }} />
          <Stack.Screen name="DonorDetails" component={DonorDetails} options={{ title: 'Donor Details' }} />
          <Stack.Screen name="DonorAgreements" component={DonorAgreements} options={{ title: 'Donor Agreements' }} />
          <Stack.Screen name="AgreementDetails" component={AgreementDetails} options={{ title: 'Agreement Details' }} />
          <Stack.Screen name="RecipientAgreements" component={RecipientAgreement} options={{ title: 'Recipient Agreement' }} />
          <Stack.Screen name="Settings" component={Settings} options={{ title: 'Settings' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;