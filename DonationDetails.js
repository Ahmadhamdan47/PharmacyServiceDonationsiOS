import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar for Donor
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection for Admin

const DonationDetails = ({ route, navigation }) => {
    const { donation } = route.params;
    const [boxes, setBoxes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');  // State to store user role
    const [username, setUsername] = useState('');

    useEffect(() => {
        fetchUserRole();
        fetchUsername();  // Fetch the username from AsyncStorage
        // Fetch the user role from AsyncStorage
        fetchBoxes();     // Fetch the boxes data
    }, []);
    navigation.setOptions({
        headerTitle: 'List',
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
        headerTitleStyle: {
          marginTop: 30, // Add margin top of 42px to the header title
          position: 'relative', // Ensure the profile container is the reference for positioning the dropdown
            backgroundColor: '#f9f9f9',
            
        },
        headerStyle: {
          height: 100, // Increase the header height to accommodate the margin
          backgroundColor: '#f9f9f9',
      },
        
    });
    const fetchUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem('userRole');
            if (role) {
                setUserRole(role);
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
        }
    };
    const fetchUsername = async () => {
        try {
            const storedUsername = await AsyncStorage.getItem('username');
            if (storedUsername) {
                setUsername(storedUsername);  // Set the username in state
            }
        } catch (error) {
            console.error('Error fetching username:', error);
        }
    };
    const fetchBoxes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://apiv2.medleb.org/boxes/byDonation/${donation.DonationId}`);
            setBoxes(response.data);
        } catch (error) {
            console.error('Error fetching boxes:', error);
            Alert.alert('Error', 'Failed to load boxes.');
        }
        setLoading(false);
    };

    const handleBoxPress = (box) => {
        // Navigate to different screens based on user role
        if (userRole === 'Admin') {
            navigation.navigate('BoxInspection', { boxId: box.BoxId });
        } else {
            navigation.navigate('BoxDetails', { 
                box: {
                    BoxId: box.BoxId,
                    BoxLabel: box.BoxLabel,  // Pass BoxLabel
                    DonorName: donation.DonorName,  // Assuming donation has DonorName
                    RecipientName: donation.RecipientName,
                    DonationTitle: donation.DonationTitle// Pass RecipientName
                }
            });
        }
    };
    

    return (
        <View style={styles.container}>
            <Text style={styles.subtitle}>To: {donation.RecipientName}</Text>
            <Text style={styles.subtitle}>Date: {donation.DonationDate}</Text>

            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <ScrollView style={styles.scrollView}>
                    {boxes.map((box, index) => (
                        <TouchableOpacity key={index} style={styles.card} onPress={() => handleBoxPress(box)}>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{box.BoxLabel}</Text>
                                <Text style={styles.cardText}>Number of Packs: {box.NumberOfPacks || 0}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Conditional Bottom Navigation Bar based on user role */}
            {userRole === 'Admin' ? (
                <BottomNavBarInspection currentScreen="DonationDetails" />
            ) : (
                <BottomNavBar />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingTop: 50,  // Ensure space for the BottomNavBar
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 5,
        marginLeft:30,
        fontWeight:'bold'
    },
    scrollView: {
        marginTop: 20,
    },
    card: {
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
        marginLeft:30,
        marginRight:30,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardText: {
        fontSize: 14,
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
    
        fontSize: 20,
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

export default DonationDetails;
