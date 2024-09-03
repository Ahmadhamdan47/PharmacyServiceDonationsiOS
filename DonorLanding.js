import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from './BottomNavBar';  // Import BottomNavBar

const DonorLanding = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');

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

    // Extract the first letter of the username for the circle icon
    const firstLetter = username ? username.charAt(0).toUpperCase() : '';

    // Use useLayoutEffect to customize header
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => null, // Remove the built-in back arrow
            headerTitle: () => (
                <View style={styles.headerContainer}>
                    <Image source={require("./assets/medleblogo.png")} style={styles.logo} />
                    <TouchableOpacity style={styles.profileContainer}>
                        <View style={styles.circle}>
                            <Text style={styles.circleText}>{firstLetter}</Text>
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
            <View style={styles.content}>
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('AddDonor')} style={styles.buttonWrapper}>
                        <Image source={require("./assets/donate.png")} style={styles.buttonImage} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('DonorList')} style={styles.buttonWrapper}>
                        <Image source={require("./assets/list.png")} style={styles.buttonImage} />
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
        marginTop:50,
        width: 150,
        height: 150,
        resizeMode: "contain",
    },
    profileContainer: {
        alignItems: 'center', // Center align the icon and username
        marginLeft: 'auto',  // Push the profile container to the right
        marginTop:50,
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
        color: '#000',  // Changed to black
        fontWeight: 'bold',
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
});

export default DonorLanding;
