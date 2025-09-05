import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar for Donor
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection for Admin
import * as Font from 'expo-font';

const DonationDetails = ({ route, navigation }) => {
    const { donation } = route.params;
    const [boxes, setBoxes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');  // State to store user role
    const [username, setUsername] = useState('');
    const [isFontLoaded, setIsFontLoaded] = useState(false);
    const fetchFonts = async () => {
      await Font.loadAsync({
        'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
        'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
        'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
      });
      setIsFontLoaded(true);
    };
  
    useEffect(() => {
      fetchFonts(); // Load fonts on component mount
    }, []);
  
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
        headerRight: () => null,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          marginTop: 30, // Add margin top of 42px to the header title
          position: 'relative', // Ensure the profile container is the reference for positioning the dropdown
            backgroundColor: '#f9f9f9',
            fontFamily: 'RobotoCondensed-Bold',

            
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
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get(`https://apiv2.medleb.org/boxes/byDonation/${donation.DonationId}`, { headers });
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

    const handleStartDonation = () => {
        // Navigate to Donate screen to continue the donation process
        const selectedRecipientName = donation.RecipientName;
        const donationDate = new Date().toISOString().replace(/:/g, '-');
        
        navigation.navigate('Donate', {
            donorId: donation.DonorId,
            recipientId: donation.RecipientId,
            donorName: donation.DonorName,
            recipientName: selectedRecipientName,
            donationPurpose: donation.DonationPurpose,
            donationTitle: donation.DonationTitle,
            donationDate,
            donationId: donation.DonationId,
        });
    };
    

    return (
        <View style={styles.container}>
            <Text style={styles.subtitle}>To: {donation.RecipientName}</Text>
            <Text style={styles.subtitle}>Date: {donation.DonationDate}</Text>
    
            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <ScrollView style={styles.scrollView}>
                    {/* Show "Start Donation" button for donors when no boxes exist */}
                    {userRole !== 'Admin' && boxes.filter(box => box.NumberOfPacks > 0).length === 0 && (
                        <TouchableOpacity style={styles.startDonationButton} onPress={handleStartDonation}>
                            <Text style={styles.startDonationButtonText}>Start Donation Process</Text>
                        </TouchableOpacity>
                    )}
                    
                    {/* Show "Add More Items" button for donors when boxes exist */}
                    {userRole !== 'Admin' && boxes.filter(box => box.NumberOfPacks > 0).length > 0 && (
                        <TouchableOpacity style={styles.addMoreButton} onPress={handleStartDonation}>
                            <Text style={styles.addMoreButtonText}>Add More Items</Text>
                        </TouchableOpacity>
                    )}

                    {boxes
                        .filter(box => box.NumberOfPacks > 0) // Filter out boxes with 0 packs
                        .map((box, index) => (
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
        fontFamily: 'RobotoCondensed-Bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 5,
        marginLeft:30,
        fontFamily: 'RobotoCondensed-Medium',
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
        backgroundColor: '#f9f9f9',
        marginLeft:30,
        marginRight:30,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
    },
    cardText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Regular',

    },
    profileContainer: {
        width: 47,
        height: 16,
        backgroundColor: '#f9f9f9',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
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
        fontFamily: 'RobotoCondensed-Bold',

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
      startDonationButton: {
        backgroundColor: '#00A651',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginHorizontal: 30,
        marginVertical: 20,
        alignItems: 'center',
      },
      startDonationButtonText: {
        color: '#f9f9f9',
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
        fontWeight: 'bold',
      },
      addMoreButton: {
        backgroundColor: '#00A651',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 20,
        marginHorizontal: 30,
        marginVertical: 10,
        alignItems: 'center',
      },
      addMoreButtonText: {
        color: '#f9f9f9',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        fontWeight: 'bold',
      },
});

export default DonationDetails;
