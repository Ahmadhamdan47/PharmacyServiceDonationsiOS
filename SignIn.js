import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignIn = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigation = useNavigation();

    const handleSignIn = async () => {
        try {
            const response = await axios.post('https://apiv2.medleb.org/users/login', { username, password });
            if (response.data.token) {
                const { token, role, donorData } = response.data;
                console.log('Response Data:', response.data);
                console.log('User role:', role);
                console.log('Status:', donorData ? donorData.IsActive : null);
    
                // Store the token, username, and user role
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('username', username);
                await AsyncStorage.setItem('userRole', role); 
    
                if (role === 'Admin') {
                    navigation.navigate('AdminLanding');
                } else if (role === 'Donor') {
                    if (donorData) {
                        if (donorData.IsActive === true) {
                            // Convert boolean to string before storing in AsyncStorage
                            await AsyncStorage.setItem('status', 'true');
                            // Navigate to DonorLanding
                            navigation.navigate('DonorLanding');
                        } else if (donorData.IsActive === false) {
                            await AsyncStorage.setItem('status', 'false');
                            Alert.alert('Account Banned', 'Your account has been banned. Please contact support.');
                        } else if (donorData.IsActive === null) {
                            await AsyncStorage.setItem('status', 'null');
                            Alert.alert('Account Not Validated', 'Your account is still not validated.');
                        }
                    } else {
                        Alert.alert('Error', 'No donor data found.');
                    }
                } else {
                    Alert.alert('Error', 'Invalid role');
                }
            } else {
                Alert.alert('Error', 'Invalid credentials');
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Error', 'Failed to sign in');
        }
    };
    
    return (
        <View style={styles.container}>
            <Image source={require('./assets/medleblogo.png')} style={styles.logo} />
            <Text style={styles.label}>Username</Text>
            <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
            />
            <TouchableOpacity style={styles.button} onPress={handleSignIn}>
                <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
                Don't have an account? Sign Up
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    logo: {
        width: 400,
        height: 160,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        color: "#A9A9A9",
    },
    input: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        marginBottom: 20,
        borderRadius: 20,
    },
    button: {
        backgroundColor: '#00a651',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    link: {
        marginTop: 20,
        color: '#00a651',
        textAlign: 'center',
    },
});

export default SignIn;
