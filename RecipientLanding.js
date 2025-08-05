import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, BackHandler, ToastAndroid, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar
import axios from 'axios';

const RecipientLanding = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [backPressedOnce, setBackPressedOnce] = useState(false); // To handle back button
    const [dropdownVisible, setDropdownVisible] = useState(false); // To handle the dropdown visibility
    const [donations, setDonations] = useState([]);

    useEffect(() => {
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

        const fetchDonations = async () => {
            try {
                const recipientId = await AsyncStorage.getItem('recipientId');
                const response = await axios.get(`https://apiv2.medleb.org/donation/byRecipient/${recipientId}`);
                setDonations(response.data);
            } catch (error) {
                console.error('Failed to fetch donations:', error);
                Alert.alert('Error', 'Failed to load donations.');
            }
        };

        getUsername();
        fetchDonations();
    }, []);

    // Toggle dropdown visibility when profile is clicked
    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    // Handle back button press logic
    useEffect(() => {
        const backAction = () => {
            if (backPressedOnce) {
                BackHandler.exitApp(); // Close the app on second back press
            } else {
                setBackPressedOnce(true);
                ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);

                setTimeout(() => {
                    setBackPressedOnce(false);
                }, 2000);

                return true; // Prevent default back behavior
            }
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => backHandler.remove(); // Clean up on component unmount
    }, [backPressedOnce]);

    // Use useLayoutEffect to customize header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => null, // Remove the built-in back arrow
            headerTitle: () => (
                <View style={styles.headerContainer}>
                    <Image source={require("./assets/medleblogo.png")} style={styles.logo} />
                    <TouchableOpacity onPress={toggleDropdown} style={styles.profileContainer}>
                        <View style={styles.circle}>
                            <Text style={styles.circleText}>{username.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.profileText}>{username.substring(0, 4)}</Text>
                    </TouchableOpacity>
                </View>
            ),
            headerTitleAlign: 'center', // Center align the custom title
        });
    }, [navigation, username]);

    return (
        <View style={styles.container}>
            {/* Dropdown for profile */}
            {dropdownVisible && (
                <>
                    <TouchableOpacity 
                        style={styles.dropdownOverlay} 
                        onPress={() => setDropdownVisible(false)}
                        activeOpacity={1}
                    />
                    <View style={styles.dropdown}>
                        <TouchableOpacity onPress={() => {
                            setDropdownVisible(false);
                            navigation.navigate('Settings');
                        }} style={styles.dropdownItem}>
                            <Text style={styles.dropdownItemText}>⚙️ Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('SignIn')} style={styles.dropdownItem}>
                            <Text style={[styles.dropdownItemText, { color: '#e74c3c' }]}>🚪 Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <View style={styles.content}>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('DonationAgreement')} style={styles.buttonWrapper}>
                        <Image source={require("./assets/donate.png")} style={styles.buttonImage} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                    {donations.map((donation, index) => (
                        <TouchableOpacity key={index} style={styles.card} onPress={() => navigation.navigate('DonationDetails', { donation })}>
                            <Text style={styles.cardTitle}>{donation.DonationTitle}</Text>
                            <Text style={styles.cardText}>Date: {donation.DonationDate}</Text>
                            <Text style={styles.cardText}>From: {donation.DonorName}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Bottom navigation bar should always be at the bottom */}
            <BottomNavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    logo: {
        marginTop: 50,
        width: 150,
        height: 150,
        resizeMode: "contain",
    },
    profileContainer: {
        alignItems: 'center', // Center align the icon and username
        marginLeft: 'auto',  // Push the profile container to the right
        marginTop: 50,
    },
    circle: {
        width: 40, // Increase the size of the circle
        height: 40,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5, // Space between the circle and the username
    },
    circleText: {
        fontSize: 20, // Increase the font size of the letter in the circle
        color: '#00A651',
        fontWeight: 'bold',
    },
    profileText: {
        fontSize: 14,
        color: '#000',
        fontWeight: 'bold',
    },
    dropdown: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        minWidth: 160,
        paddingVertical: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#e8e8e8',
        zIndex: 1000,
    },
    dropdownOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 999,
    },
    dropdownItem: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#333333',
        fontFamily: 'RobotoCondensed-Medium',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,  // Allows the content to take up available space
        alignItems: 'center',
        justifyContent: 'center',  // Center content vertically in the middle of the available space
        paddingBottom: 0,  // Add padding to avoid overlapping with BottomNavBar
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
        paddingHorizontal: 20,  // Padding to add space from edges
        marginTop: 20,  // Margin to separate from welcome text
    },
    buttonWrapper: {
        alignItems: 'center',
    },
    buttonImage: {
        width: 130,
        height: 130,
        resizeMode: "contain",
        marginBottom: 10,  // Space between the image and text
    },
    scrollViewContainer: {
        paddingBottom: 20,
    },
    card: {
        marginTop: 20,
        marginHorizontal: 35,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 25,
        padding: 10,
        backgroundColor: '#FFFCFC',
        position: 'relative',
        height: 120,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardText: {
        fontSize: 14,
    },
});

export default RecipientLanding;