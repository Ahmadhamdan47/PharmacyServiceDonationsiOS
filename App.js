import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AddDonor from './AddDonor';
import Donate from './Donate';
import List from './List';
import { enableScreens } from 'react-native-screens';
import Icon from 'react-native-vector-icons/Ionicons';
import { DonationProvider } from './DonationContext';  // Make sure this path is correct

enableScreens();
const Stack = createStackNavigator();

export default function App() {
  return (
    <DonationProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: '' }} />
          <Stack.Screen name="AddDonor" component={AddDonor} options={{ title: '' }} />
          <Stack.Screen name="Donate" component={Donate} options={({ navigation }) => ({
            title: '',
            headerLeft: () => (
              <TouchableOpacity onPress={() => showExitConfirmation(navigation)}>
                <Icon name="arrow-back" size={25} color="#000" style={{ marginLeft: 15 }} />
              </TouchableOpacity>
            ),
          })} />
          <Stack.Screen
            name="List"
            component={List}
            options={({ navigation }) => ({
              title: '',
              headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.navigate('AddDonor')}>
                  <Icon name="arrow-back" size={25} color="#000" style={{ marginLeft: 15 }} />
                </TouchableOpacity>
              ),
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </DonationProvider>
  );
}

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image source={require("./assets/medleblogo.png")}   style={{...styles.image, width: 166, height: 54}}  />

      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('AddDonor')}>
          <Image source={require("./assets/1.png")} style={styles.buttonImage} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('List')}>
          <Image source={require("./assets/2.png")} style={styles.buttonImage} />
        </TouchableOpacity>
      </View>

      <View style={styles.taskBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Image source={require("./assets/home.png")} style={styles.taskBarButton} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('AddDonor')}>
          <Image source={require("./assets/donate.png")} style={styles.taskBarButton} />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('List')}>
          <Image source={require("./assets/list.png")} style={styles.taskBarButton} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const showExitConfirmation = (navigation) => {
  Alert.alert(
    'Confirm Exit',
    'Are you sure you want to go back?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: () => navigation.goBack(),
      },
    ],
    { cancelable: false }
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
  },
  logo: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 166,
    height: 54,
    resizeMode: "contain",
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 250,
  },
  buttonImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  taskBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: '2%',
  },
  taskBarButton: {
    width: 25,
    height: 25,
    resizeMode: "contain",
  },
});
