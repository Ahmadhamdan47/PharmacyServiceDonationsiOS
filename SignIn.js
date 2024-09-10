import React, { useState, useLayoutEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons'; // Import FontAwesome5 for the eye icon

const SignIn = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const navigation = useNavigation();

    // Customize the navigation header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => (
                <Image
                    source={require('./assets/medleblogo.png')}
                    style={{ width: 166, height: 54 }}
                />
            ),
            headerTitleAlign: 'center',  // Center the logo horizontally
            headerLeft: () => null,      // Remove the back button
            headerStyle: {
                height: 150,             // Adjust the height of the header
                backgroundColor: '#f9f9f9',
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
            <Text style={styles.title}>Welcome to MedLeb</Text>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 0,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f9f9f9',
        paddingBottom:'100%',
    },
    title: {
        fontSize: 14,           // Adjust the title font size as needed
        fontWeight: 'bold',     // Title in bold
        textAlign: 'center',
        marginTop: 47 ,         // 150px from the top border
        marginBottom: 46,       // 46px space between the title and the logo
        color: '#121212',
    },
    paragraph: {
        fontSize: 14,           // Paragraph font size
        fontWeight: '500',      // Medium weight
        textAlign: 'center',
        marginHorizontal: 30,   // Horizontal margin for text width control
        marginBottom: 110,       // 47px space between paragraph and title
        width: 298,             // Set specific width
        height: 54,             // Set specific height
        alignSelf: 'center',    // Center the paragraph horizontally
        color: '#555',          // Set paragraph text color
    },
    label: {
        fontSize: 12,
        marginBottom: 5,        // Distance between label and input field
        color: "#A9A9A9",
        marginLeft: 30,         // Distance between label and the left side
    },
    input: {
        borderWidth: 1,
        borderColor: '#00a651',
        paddingLeft: 15,
        height: 30,             // Set height to 30px for inputs
        borderRadius: 20,
        marginBottom: 10,       // Distance between input fields
        marginLeft: 15,         // Align inputs with labels
        marginRight: 15, 
        fontSize: 12,           // Adjust the font size to fit the 30px height input
        // Add right margin for even spacing
    },
    button: {
        backgroundColor: '#00a651',
        height: 30,             // Set button height to 30px
        justifyContent: 'center',// Center button text vertically
        alignItems: 'center',    // Center button text horizontally
        borderRadius: 25,        // Distance between button and last input field
        marginLeft: 15,          // Align button with input fields
        marginRight: 15,
        marginTop: 10,           // Add right margin for even spacing
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    link: {
        marginTop: 20,
        color: '#00a651',
        textAlign: 'center',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00a651',
        paddingLeft: 15,
        height: 30,
        borderRadius: 20,
        marginBottom: 10,
        marginLeft: 15,
        marginRight: 15,
      },
      showPasswordButton: {
        position: 'absolute',
        right: 15,
        padding: 5,
      },
});

export default SignIn;
