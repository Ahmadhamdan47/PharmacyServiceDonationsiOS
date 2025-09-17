import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, BackHandler, ToastAndroid, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar
import HeaderProfile from './HeaderProfile'; // Import HeaderProfile component

const Landing = () => {
    console.log('🚀 DonorLanding: Component initialized');
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [donorId, setDonorId] = useState(null);
    const [backPressedOnce, setBackPressedOnce] = useState(false); // To handle back button
    const [dropdownVisible, setDropdownVisible] = useState(false); // To handle the dropdown visibility
    const [pendingAgreementsCount, setPendingAgreementsCount] = useState(0);

    const fetchDonorIdFromAPI = async (username) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            console.log('Attempting to fetch donor ID from API for username:', username);
            const response = await axios.get(`https://apiv2.medleb.org/donor/byUsername/${username}`, { headers });
            
            if (response.data && response.data.DonorId) {
                console.log('Successfully fetched donor ID from API:', response.data.DonorId);
                await AsyncStorage.setItem('donorId', response.data.DonorId.toString());
                return response.data.DonorId;
            } else {
                console.warn('API response did not contain DonorId:', response.data);
                return null;
            }
        } catch (error) {
            console.error('Failed to fetch donor ID from API:', error);
            return null;
        }
    };

    useEffect(() => {
        const getUsername = async () => {
            try {
                const storedUsername = await AsyncStorage.getItem('username');
                const storedDonorId = await AsyncStorage.getItem('donorId');
                
                if (storedUsername) {
                    setUsername(storedUsername);
                }
                
                if (storedDonorId) {
                    setDonorId(parseInt(storedDonorId));
                } else {
                    console.warn('No donor ID found in storage, attempting to fetch from API');
                    
                    if (storedUsername) {
                        const fetchedDonorId = await fetchDonorIdFromAPI(storedUsername);
                        if (fetchedDonorId) {
                            setDonorId(fetchedDonorId);
                            console.log('Successfully recovered donor ID:', fetchedDonorId);
                        } else {
                            console.error('Failed to fetch donor ID from API');
                            // Don't show alert here as this is a background operation
                            // The user will see the error when they try to access features that need donorId
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load username:', error);
            }
        };

        getUsername();
    }, []);

    useEffect(() => {
        if (donorId) {
            checkPendingAgreements();
        }
    }, [donorId]);

    const checkPendingAgreements = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Donor/${donorId}`, { headers });
            if (response.data && Array.isArray(response.data.data)) {
                const agreements = response.data.data;
                const pendingCount = agreements.filter(agreement => agreement.Agreed_Upon === 'pending').length;
                setPendingAgreementsCount(pendingCount);
            }
        } catch (error) {
            console.error('Error checking pending agreements:', error);
        }
    };

    useEffect(() => {
        const backAction = () => {
            if (backPressedOnce) {
                // This will exit the app without resetting the login state
                BackHandler.exitApp();
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

    const handleSignOut = async () => {
        try {
            await AsyncStorage.clear(); // Clear all stored data (token, username, etc.)
            navigation.navigate('SignIn'); // Navigate to SignIn screen
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Toggle dropdown visibility when profile is clicked
    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    // Use useLayoutEffect to customize header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => null, // Remove the built-in back arrow
            headerTitle: () => (
                <View style={styles.headerContainer}>
                    <Image source={require("./assets/medleblogo.png")} style={styles.logo} />
                </View>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={toggleDropdown}>
                    <HeaderProfile username={username} notificationCount={pendingAgreementsCount} />
                </TouchableOpacity>
            ),
            headerTitleAlign: 'center', // Center align the custom title
        });
    }, [navigation, username, pendingAgreementsCount]);

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
                        <TouchableOpacity onPress={handleSignOut} style={styles.dropdownItem}>
                            <Text style={[styles.dropdownItemText, { color: '#e74c3c' }]}>🚪 Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <View style={styles.content}>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={() => {
                        console.log('🚀 DonorLanding: Navigating to AddDonor. Current donorId:', donorId, 'username:', username);
                        navigation.navigate('AddDonor');
                    }} style={styles.buttonWrapper}>
                        <Image source={require("./assets/donate.png")} style={styles.buttonImage} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('DonorList')} style={styles.buttonWrapper}>
                        <Image source={require("./assets/list.png")} style={styles.buttonImage} />
                    </TouchableOpacity>
                </View>
                
                {/* Add Agreements button with pending indicator */}
                <View style={styles.agreementsContainer}>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('DonorAgreements')} 
                        style={styles.agreementsButton}
                    >
                        <Image source={require("./assets/agreements.png")} style={styles.agreementsImage} />
                        <Text style={styles.agreementsText}>Agreements</Text>
                        {pendingAgreementsCount > 0 && (
                            <View style={styles.pendingBadge}>
                                <Text style={styles.pendingBadgeText}>{pendingAgreementsCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom navigation bar should always be at the bottom */}
            <BottomNavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f9f9",
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
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
        backgroundColor: '#f9f9f9',
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
    agreementsContainer: {
        marginTop: 30,
        alignItems: 'center',
    },
    agreementsButton: {
        alignItems: 'center',
        position: 'relative',
    },
    agreementsImage: {
        width: 60,
        height: 60,
        resizeMode: "contain",
        marginBottom: 5,
    },
    agreementsText: {
        fontSize: 14,
        color: '#00A651',
        fontWeight: 'bold',
    },
    pendingBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f9f9f9',
    },
    pendingBadgeText: {
    color: '#f9f9f9',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'RobotoCondensed-Bold',
    },
});

export default Landing;
