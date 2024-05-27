import { StyleSheet, View, Image, Button } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { DonationProvider } from "./DonationContext";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AddDonor from './AddDonor';
import Donate from './Donate';
import List from './List';
import { enableScreens } from 'react-native-screens';
enableScreens();
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '' }} />
        <Stack.Screen name="AddDonor" component={AddDonor} options={{ title: '' }} />
        <Stack.Screen name="Donate" component={Donate} options={{ title: '' }} />
        <Stack.Screen name="List" component={List} options={{ title: '' }} />      
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function HomeScreen({ navigation }) {
  return (
    <DonationProvider>
      <View style={styles.container}>
        <Image
          source={require("./assets/logo.png")}
          style={styles.image}
        />

        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('AddDonor')}>
            <Image
              source={require("./assets/1.png")}
              style={styles.buttonImage}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('List')}>
            <Image
              source={require("./assets/2.png")}
              style={styles.buttonImage}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.taskBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Image
              source={require("./assets/home.png")}
              style={styles.taskBarButton}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('AddDonor')}>
            <Image
              source={require("./assets/donate.png")}
              style={styles.taskBarButton}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('List')}>
            <Image
              source={require("./assets/list.png")}
              style={styles.taskBarButton}
            />
          </TouchableOpacity>
        </View>
    </DonationProvider>
  );
}


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
