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
import RecipientList from './RecipientList'; // Import RecipientList
import DonorAgreements from './DonorAgreements';
import AgreementDetails from './AgreementDetails';
import RecipientAgreement from './RecipientAgreements';
const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const navigationRef = React.useRef();  // To navigate from anywhere

  // Set up Axios interceptor to handle 404 errors
   // Load custom fonts

  // Set up Axios interceptor to handle 404 errors
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,  // Return the response if it's successful
      async (error) => {
        if (error.response && error.response.status === 404) {
          await AsyncStorage.clear();  // Clear the AsyncStorage session
          setIsLoggedIn(false);  // Set the login state to false

          if (navigationRef.current) {
            navigationRef.current.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          }

          return Promise.reject(error);  // Return the error to handle it locally if needed
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);  // Cleanup interceptor on unmount
    };
  }, []);

  // Fetch donor data
  const fetchDonorData = async (token) => {
    try {
      const response = await axios.get('https://apiv2.medleb.org/donor/byUsername', {
        headers: { Authorization: `Bearer ${token}` },
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

  // Check login status on app load or refresh
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userRole');

        if (token && role) {
          setUserRole(role);

          if (role === 'Donor') {
            await fetchDonorData(token);  // For donors, fetch their data
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

    checkLoginStatus();  // Always check login status on app load or refresh
  }, []);

  // Only return after the fonts are loaded

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'Landing' : 'SignIn'}>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;