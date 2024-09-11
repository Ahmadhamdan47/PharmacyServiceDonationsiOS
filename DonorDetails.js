import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection

const DonorDetails = ({ route, navigation }) => {
    const { donor } = route.params;
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        getUsername();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Validate',
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                    <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <View style={styles.profileContainer}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.profileText}>{username}</Text>
                </View>
            ),
            headerTitleAlign: 'center',
            headerStyle: {
                backgroundColor: '#f9f9f9', // Set the background color of the whole navigation bar
                elevation: 0,            // Remove shadow on Android
                shadowOpacity: 0,        // Remove shadow on iOS
                borderBottomWidth: 0, 
          },
        });
    
    }, [navigation, username]);

    const getUsername = async () => {
        try {
            const storedUsername = await AsyncStorage.getItem('username');
            if (storedUsername) {
                setUsername(storedUsername);
            }
        } catch (error) {
            console.error('Failed to load username:', error);
        }
    };

    const handleApproval = async (isActive) => {
        setIsLoading(true);
        try {
            await axios.put(`https://apiv2.medleb.org/donor/${donor.DonorId}`, {
                IsActive: isActive,
            });
            Alert.alert('Success', isActive ? 'Donor Approved' : 'Donor Rejected');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating donor status:', error);
            Alert.alert('Error', 'Failed to update donor status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Donor Name</Text>
            <TextInput style={styles.input} value={donor.DonorName} editable={false} />

            <Text style={styles.label}>Donor Type</Text>
            <TextInput style={styles.input} value={donor.DonorType} editable={false} />

            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={donor.Address} editable={false} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={donor.PhoneNumber} editable={false} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={donor.Email} editable={false} />

            <Text style={styles.label}>Country</Text>
            <TextInput style={styles.input} value={donor.DonorCountry} editable={false} />

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleApproval(false)} disabled={isLoading}>
                    <Text style={styles.rejectbuttonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApproval(true)} disabled={isLoading}>
                    <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
            </View>
            <BottomNavBarInspection currentScreen="" />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
        
    },
    label: {
        fontSize: 16,
        marginTop: 5,

        color: '#A9A9A9',
        marginLeft:40,
    },
    input: {
        borderWidth: 1,
        borderColor: '#00a651',
        borderRadius: 20,
        padding: 5,
        paddingLeft:10,
        height: 35,  // Set height to 30px
        marginBottom: 20,
        marginTop: 5,
        backgroundColor: '#FFFCFC',
        marginLeft:35,
        marginRight:35,
  
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 45,
        marginBottom:20,
        
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        marginHorizontal: 5,
        borderRadius: 10,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: '#fff',          // White background
        borderColor: 'red',           // Green border
        borderWidth: 2,                   // Border width of 2px
        borderRadius: 20,                 // Same border radius as the original button
        paddingVertical: 10,              // Same padding as original button
        paddingHorizontal: 10,            // Same padding as original button
        width: '35%',                     // Same width as original button
        alignSelf: 'center',              // Center the button horizontally
        alignItems: 'center',             // Center the text inside the button
        // Same margin as original button
        marginHorizontal: 5, 
                  },
    approveButton: {
        backgroundColor: '#00a651',
        paddingVertical: 10, // Reduced padding
        paddingHorizontal: 10, // Reduced padding
        borderRadius: 20, // Reduced border radius
        width: '35%',
        alignSelf: 'center',
        alignItems: 'center',
         // Reduced margin
        marginHorizontal: 5, // Add
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    rejectbuttonText: {
        color: 'red',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    profileContainer: {
        width: 47,
        height: 16,
        backgroundColor: '#f9f9f9',
        fontSize: 14,
        fontFamily: 'Roboto Condensed',
        fontWeight: '400',
        marginRight:24,
        marginLeft: 103,
        
        position: 'relative', // Ensure the profile container is the reference for positioning the dropdown
    
      },
      circle: {
        backgroundColor: '#f9f9f9',
        width: 40,
        height: 40,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
      },
      circleText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
    
        fontSize: 25,
        color: '#00A651',
        fontWeight: 'bold',
      },
      profileText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
    
        fontSize: 14,
        color: '#000',
        fontWeight: '400',
        textAlign: 'center',
        
      },
      backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
        marginTop:30,
      },
});

export default DonorDetails;
