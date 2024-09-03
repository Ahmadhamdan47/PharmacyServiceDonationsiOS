import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection

const AdminLanding = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [userRole, setUserRole] = useState('');

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
        navigation.navigate('Inspect');
    };

    const handleProfileIconClick = () => {
        if (userRole === 'Admin') {
            navigation.navigate('Validate');
        }
    };

    // Use useLayoutEffect to customize header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => null, // Remove the built-in back arrow
            headerTitle: () => (
                <View style={styles.headerContainer}>
                    <Image source={require("./assets/medleblogo.png")} style={styles.logo} />
                    <TouchableOpacity onPress={handleProfileIconClick} style={styles.profileContainer}>
                        <View style={styles.circle}>
                            <Text style={styles.circleText}>{username.charAt(0).toUpperCase()}</Text>
                        </View>
                        <Text style={styles.profileText}>{username}</Text>
                    </TouchableOpacity>
                </View>
            ),
            headerTitleAlign: 'center', // Center align the custom title
        });
    }, [navigation, username, userRole]);

    return (
        <View style={styles.container}>
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
        marginTop:5,
        width: 150,
        height: 150,
        resizeMode: "contain",
    },
    profileContainer: {
        marginTop:10,
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
        color: '#000',  // Changed to black
        fontWeight: 'bold',
    },
    content: {
        flex: 1,  // Allows the content to take up available space
        alignItems: 'center',
        justifyContent: 'center',  // Center content vertically in the middle of the available space
        paddingBottom: 0,
        paddingtop:'100%'  // Add padding to avoid overlapping with BottomNavBar
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '80%',
        paddingHorizontal: 20,  // Padding to add space from edges
        marginTop: 40,  // Margin to separate from welcome text
    },
    buttonWrapper: {
        alignItems: 'center',
    },
    buttonImage: {
        width: 120,
        height: 130,
        resizeMode: "contain",
        marginBottom: 10,  // Space between the image and text
    },
});

export default AdminLanding;
