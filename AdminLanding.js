import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text,  BackHandler, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminLanding = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [userRole, setUserRole] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false); // To handle the dropdown visibility
    const [backPressedOnce, setBackPressedOnce] = useState(false); // To handle back button

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

        getUsername();
    }, []);

    useEffect(() => {
        fetchUserRole();
    }, []);

    const fetchUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem('userRole');
            if (role) {
                setUserRole(role);
            }
        } catch (error) {
            console.error('Error fetching user role or username:', error);
        }
    };
    const handleInspect = () => {
        navigation.navigate('Inspect'); // Define this function to navigate to the 'Inspect' screen
    };
    const handleSignOut = async () => {
        try {
            await AsyncStorage.clear(); // Clear all stored data (token, username, etc.)
            navigation.navigate('SignIn'); // Navigate to SignIn screen
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handleValidate = () => {
        navigation.navigate('Validate'); // Navigate to Validate screen
    };

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
            headerLeft: () => (
                <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            ),
            headerTitle: () => (
                <View style={styles.headerContainer}>
                    <Image source={require("./assets/medleblogo.png")} style={styles.logo} />
                    <TouchableOpacity onPress={toggleDropdown} style={styles.profileContainer}>
                        <View style={styles.circle}>
                            <Text style={styles.circleText}>{username.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.profileText}>{username}</Text>
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
                <View style={styles.dropdown}>
                    <TouchableOpacity onPress={handleValidate} style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>Validate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSignOut} style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText}>Sign Out</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.content}>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('List')} style={styles.buttonWrapper}>
                        <Image source={require("./assets/list.png")} style={styles.buttonImage} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleInspect} style={styles.buttonWrapper}>
                        <Image source={require("./assets/Inspection.png")} style={styles.buttonImage} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom navigation bar should always be at the bottom */}
            <BottomNavBarInspection currentScreen="AdminLanding" />
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
        marginTop: 5,
        width: 150,
        height: 150,
        resizeMode: "contain",
    },
    profileContainer: {
        marginTop: 10,
        flexDirection: 'column',
        alignItems: 'center',
        marginLeft: 110,
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleText: {
        fontSize: 16,
        color: '#00A651',
        fontWeight: 'bold',
    },
    profileText: {
        fontSize: 10,
        color: '#000',
        fontWeight: 'bold',
    },
    dropdown: {
        position: 'absolute',
        top: 100,
        right: 10,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 5,
        elevation: 5, // For Android shadow
        shadowColor: '#000', // For iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    dropdownItem: {
        paddingVertical: 10,
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#000', // Default color for validate
        fontWeight: 'bold',
    },
    signOutButton: {
        marginLeft: 20,
        padding: 10,
    },
    signOutText: {
        fontSize: 16,
        color: '#FF0000',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 0,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
        paddingHorizontal: 20,
        marginTop: 40,
    },
    buttonWrapper: {
        alignItems: 'center',
    },
    buttonImage: {
        width: 120,
        height: 130,
        resizeMode: "contain",
        marginBottom: 10,
    },
});

export default AdminLanding;
