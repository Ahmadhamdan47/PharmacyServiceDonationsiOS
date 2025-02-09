import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
import RecipientLanding from './RecipientLanding';  // Recipient landing screen

const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigationRef = React.useRef();  // To navigate programmatically

  // Set up Axios interceptor to handle 404 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async (error) => {
        if (error.response && error.response.status === 404) {
          await AsyncStorage.clear();  // Clear AsyncStorage session
          setIsLoggedIn(false);  // Reset login state

          if (navigationRef.current) {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          }

          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);  // Cleanup interceptor on unmount
    };
  }, []);

  // Fetch recipient data
  const fetchRecipientData = async (token, recipientId) => {
    try {
      const response = await axios.get(`https://apiv2.medleb.org/recipient/byId/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        const recipientData = response.data;

        await AsyncStorage.setItem('recipientName', recipientData.name);
        await AsyncStorage.setItem('recipientEmail', recipientData.email);
        await AsyncStorage.setItem('recipientPhone', recipientData.phoneNumber);
        await AsyncStorage.setItem('recipientAddress', recipientData.address);
      }
    } catch (error) {
      console.error('Error fetching recipient data:', error);
    }
  };

  // Fetch donor data
  const fetchDonorData = async (token) => {
    try {
      const response = await axios.get('https://apiv2.medleb.org/donor/byUsername', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 2000,
      });

      const donorData = response.data;
      if (donorData && donorData.IsActive) {
        await AsyncStorage.setItem('status', 'true');
        setIsLoggedIn(true);
      } else {
        await AsyncStorage.setItem('status', 'false');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error fetching donor data:', error);
      setIsLoggedIn(false);
    }
  };

  // Check login status when the app loads
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userRole');
        const recipientId = await AsyncStorage.getItem('recipientId');

        if (token && role) {
          setUserRole(role);

          if (role === 'Recipient' && recipientId) {
            await fetchRecipientData(token, recipientId);
            setIsLoggedIn(true);

            // Navigate to RecipientLanding
            navigationRef.current?.reset({
              index: 0,
              routes: [{ name: 'RecipientLanding' }],
            });

          } else if (role === 'Donor') {
            await fetchDonorData(token);
          } else {
            setIsLoggedIn(true);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error checking login state:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={isLoggedIn ? (userRole === 'Recipient' ? 'RecipientLanding' : 'Landing') : 'SignIn'}>
        <Stack.Screen name="Landing" component={Landing} options={{ title: 'Home' }} />
        <Stack.Screen name="RecipientLanding" component={RecipientLanding} options={{ title: 'Recipient Home' }} />
        <Stack.Screen name="SignIn" component={SignIn} options={{ title: 'Sign In' }} />
        <Stack.Screen name="SignUp" component={SignUp} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="AddDonor" component={AddDonor} options={{ title: 'Donate' }} />
        <Stack.Screen name="Donate" component={Donate} options={{ title: 'Donate' }} />
        <Stack.Screen name="List" component={List} options={{ title: 'List' }} />
        <Stack.Screen name="Inspect" component={Inspect} options={{ title: 'Inspect' }} />
        <Stack.Screen name="DonorList" component={DonorList} options={{ title: 'Donor List' }} />
        <Stack.Screen name="DonationDetails" component={DonationDetails} options={{ title: 'Donation Details' }} />
        <Stack.Screen name="BoxDetails" component={BoxDetails} options={{ title: 'Boxes List' }} />
        <Stack.Screen name="PackInspection" component={PackInspection} options={{ title: 'Pack Inspection' }} />
        <Stack.Screen name="BoxInspection" component={BoxInspection} options={{ title: 'Box Inspection' }} />
        <Stack.Screen name="Validate" component={Validate} options={{ title: 'Validate' }} />
        <Stack.Screen name="DonorDetails" component={DonorDetails} options={{ title: 'Donor Details' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
