import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SignIn from './SignIn';
import SignUp from './SignUp';
import AdminLanding from './AdminLanding';  // Check if this import is correct
import DonorLanding from './DonorLanding';
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
import LoadingScreen from './LoadingScreen';

const Stack = createStackNavigator();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // null indicates loading state
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const role = await AsyncStorage.getItem('userRole');
        const status = await AsyncStorage.getItem('status'); // Donor status (if applicable)

        if (token && role) {
          setUserRole(role);

          // Check donor account status if role is Donor
          if (role === 'Donor' && status !== 'true') {
            // If the donor account is not active or banned
            setIsLoggedIn(false);
          } else {
            // User is logged in
            setIsLoggedIn(true);
          }
        } else {
          setIsLoggedIn(false); // User not logged in
        }
      } catch (error) {
        console.error('Error checking login state:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) {
    // Show a loading screen or splash screen while checking login status
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Register SignIn and SignUp first to ensure they are always available */}
        <Stack.Screen name="SignIn" component={SignIn} options={{ title: '' }} />
        <Stack.Screen name="SignUp" component={SignUp} options={{ title: '' }} />

        {/* Conditionally render the main screen based on login state */}
        {isLoggedIn ? (
          userRole === 'Admin' ? (
            <Stack.Screen name="AdminLanding" component={AdminLanding} options={{ title: '' }} /> // Ensure this name matches your navigate call
          ) : (
            <Stack.Screen name="DonorLanding" component={DonorLanding} options={{ title: '' }} />
          )
        ) : null}

        {/* Other screens */}
        <Stack.Screen name="AddDonor" component={AddDonor} options={{ title: 'Donate' }} />
        <Stack.Screen name="Donate" component={Donate} options={{ title: 'Donate' }} />
        <Stack.Screen name="List" component={List} options={{ title: 'List' }} />
        <Stack.Screen name="Inspect" component={Inspect} options={{ title: 'Inspect' }} />
        <Stack.Screen name="DonorList" component={DonorList} options={{ title: 'List' }} />
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
