import React, { useState, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, Image, TouchableOpacity, StatusBar } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons'; // Import FontAwesome5 for the eye icon
import * as Font from 'expo-font';

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  const navigation = useNavigation();

  // Load custom fonts

  const fetchFonts = async () => {
    await Font.loadAsync({
      'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
      'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
      'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
    });
    setIsFontLoaded(true);
    console.log('font loaded:',isFontLoaded)
  };

  useEffect(() => {
    fetchFonts(); // Load fonts on component mount
  }, []);
  // Customize the navigation header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={require('./assets/medleblogo.png')}
          style={{ width: 164, height: 50, marginTop: 10 }}
        />
      ),
      headerTitleAlign: 'center',  // Center the logo horizontally
      headerLeft: () => null,      // Remove the back button
      headerStyle: {
        height: 150,             // Adjust the height of the header
        backgroundColor: '#f9f9f9',
        elevation: 0,            // Remove shadow on Android
        shadowOpacity: 0,        // Remove shadow on iOS
        borderBottomWidth: 0,    // Remove border at the bottom
      },
      headerTitleStyle: {
        marginTop: 50,           // Distance from the top (50px)
      },
    });

    
  }, [navigation]);

  const handleSignIn = async () => {
    try {
      const response = await axios.post('https://apiv2.medleb.org/users/login', { username, password });
      if (response.data.token) {
        const { token, role } = response.data;

        // Store the token, username, and user role
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('username', username);
        await AsyncStorage.setItem('userRole', role);
        await AsyncStorage.setItem('pinSet', 'true');

        navigation.navigate('Landing'); // Navigate to the unified Landing screen
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to sign in');
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
 
  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Drug Donation To Lebanon</Text>

      {/* Paragraph */}
      <Text style={styles.paragraph}>
        This application is developed for the Pharmacy Service at the Ministry of Public Health, to manage the drug donation procedure to Lebanon.
      </Text>

      {/* Username Label and Input */}
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      {/* Password Label and Input */}
      <Text style={styles.label}>Password</Text>
      <View>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!isPasswordVisible}
        />
        <TouchableOpacity style={styles.showPasswordButton} onPress={togglePasswordVisibility}>
          <FontAwesome5 name={isPasswordVisible ? 'eye-slash' : 'eye'} size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Sign In Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      {/* Sign Up Link */}
      <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
        Don't have an account? Sign Up
      </Text>
      <StatusBar backgroundColor="#f9f9f9" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontFamily: 'RobotoCondensed-Bold',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 46,
    color: '#121212',
  },
  paragraph: {
    fontFamily:'RobotoCondensed-Medium',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    marginHorizontal: 10,
    marginBottom: 55,
    width: 315,
    height: 67,
    alignSelf: 'center',
    color: '#555',
    fontStyle: 'italic',
  },
  label: {
    fontFamily: 'RobotoCondensed-Bold',

    fontSize: 12,
    marginBottom: 5,
    color: "#A9A9A9",
    marginLeft: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#00a651',
    paddingLeft: 15,
    height: 35,
    borderRadius: 20,
    marginBottom: 10,
    marginLeft: 15,
    marginRight: 15,
    fontSize: 12,
  },
  button: {
    backgroundColor: '#00a651',
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginLeft: 15,
    marginRight: 15,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontFamily: 'RobotoCondensed-Bold',
    fontSize: 16,
  },
  link: {
  
    fontFamily: 'RobotoCondensed-Regular',
    marginTop: 20,
    color: '#00a651',
    textAlign: 'center',
  },
  showPasswordButton: {
    position: 'absolute',
    right: 15,
    padding: 7,
  },
});

export default SignIn;