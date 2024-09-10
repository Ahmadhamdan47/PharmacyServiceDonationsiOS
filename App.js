import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BackHandler, ToastAndroid } from 'react-native';

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
import LoadingScreen from './LoadingScreen'; // For loading state

const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [donorDataFetched, setDonorDataFetched] = useState(false);
  const [backPressedOnce, setBackPressedOnce] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // Re-check the token and user role from AsyncStorage
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userRole');

        if (token && role) {
          setUserRole(role);

          if (role === 'Donor') {
            await fetchDonorData(token);  // Fetch donor data if user is a donor
          } else {
            setIsLoggedIn(true);  // If token exists and role is Admin, user is logged in
          }
        } else {
          setIsLoggedIn(false);  // If no token is found, user is not logged in
        }
      } catch (error) {
        console.error('Error checking login state:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();  // Always check login status on app load or refresh
  }, []);

  const fetchDonorData = async (token) => {
    try {
      const response = await axios.get('https://apiv2.medleb.org/donor/byUsername', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const donorData = response.data;
      if (donorData && donorData.IsActive) {
        await AsyncStorage.setItem('status', 'true');
        setIsLoggedIn(true);
      } else if (donorData.IsActive === false) {
        await AsyncStorage.setItem('status', 'false');
        setIsLoggedIn(false);
      } else {
        await AsyncStorage.setItem('status', 'null');
        setIsLoggedIn(false);
      }

      setDonorDataFetched(true);
    } catch (error) {
      console.error('Error fetching donor data:', error);
      setIsLoggedIn(false);
    }
  };

  // Handle back button press to exit the app without logging out
  useEffect(() => {
    const backAction = () => {
      if (backPressedOnce) {
        BackHandler.exitApp();  // Exit the app if back is pressed twice
      } else {
        setBackPressedOnce(true);
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);

        setTimeout(() => {
          setBackPressedOnce(false);
        }, 2000);

        return true;  // Prevent default back behavior
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();  // Clean up back handler on unmount
  }, [backPressedOnce]);

  if (isLoggedIn === null || (userRole === 'Donor' && !donorDataFetched)) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isLoggedIn ? 'Landing' : 'SignIn'}>
        {/* Add all screens here */}
        <Stack.Screen name="Landing" component={Landing} options={{ title: 'Home' }} />
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
