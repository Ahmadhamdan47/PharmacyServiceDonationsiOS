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

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen name="SignIn" component={SignIn} options={{ title: '' }}/>
        <Stack.Screen name="SignUp" component={SignUp} options={{ title: '' }} />
        <Stack.Screen name="AdminLanding" component={AdminLanding} options={{ title: '' }} />
        <Stack.Screen name="DonorLanding" component={DonorLanding}  options={{ title: '' }}/>
        <Stack.Screen name="AddDonor" component={AddDonor} options={{ title: '' }} />
        <Stack.Screen name="Donate" component={Donate}options={{ title: '' }} />
        <Stack.Screen name="List" component={List} options={{ title: '' }}/>
        <Stack.Screen name="Inspect" component={Inspect} options={{ title: '' }}/>
        <Stack.Screen name="DonorList" component={DonorList}options={{ title: '' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
