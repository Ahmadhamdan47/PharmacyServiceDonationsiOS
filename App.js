import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SignIn from './SignIn';
import SignUp from './SignUp';
import AdminLanding from './AdminLanding';
import DonorLanding from './DonorLanding';
import AddDonor from './AddDonor';
import Donate from './Donate';
import List from './List';
import Inspect from './Inspect';
import DonorList from './DonorList';
import DonationDetails from './DonationDetails'; // Import the DonationDetails component
import BoxDetails from './BoxDetails';
import PackInspection from './PackInspection'; // Import the PackInspection component
import BoxInspection from './BoxInspection';
const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen name="SignIn" component={SignIn} options={{ title: '' }} />
        <Stack.Screen name="SignUp" component={SignUp} options={{ title: '' }} />
        <Stack.Screen name="AdminLanding" component={AdminLanding} options={{ title: '' }} />
        <Stack.Screen name="DonorLanding" component={DonorLanding} options={{ title: '' }} />
        <Stack.Screen name="AddDonor" component={AddDonor} options={{ title: '' }} />
        <Stack.Screen name="Donate" component={Donate} options={{ title: '' }} />
        <Stack.Screen name="List" component={List} options={{ title: '' }} />
        <Stack.Screen name="Inspect" component={Inspect} options={{ title: '' }} />
        <Stack.Screen name="DonorList" component={DonorList} options={{ title: '' }} />
        <Stack.Screen name="DonationDetails" component={DonationDetails} options={{ title: 'Donation Details' }} />
        <Stack.Screen name="BoxDetails" component={BoxDetails} options={{ title: '' }} />
        <Stack.Screen name="PackInspection" component={PackInspection} options={{ title: 'Pack Inspection' }} />
        <Stack.Screen name="BoxInspection" component={BoxInspection} options={{ title: 'Box Inspection' }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
