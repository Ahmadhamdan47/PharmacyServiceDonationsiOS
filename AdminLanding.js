import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBarInspection from './BottomNavBarInspection';  // Import BottomNavBarInspection

const AdminLanding = () => {
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

    const handleInspect = () => {
        navigation.navigate('Inspect');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image source={require("./assets/medleblogo.png")} style={styles.logo} />
                <View style={styles.profileContainer}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>{username ? username.charAt(0).toUpperCase() : ''}</Text>
                    </View>
                    <Text style={styles.profileText}>{username}</Text>
                </View>
            </View>

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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    logo: {
        width: 150,
        height: 100,
        resizeMode: "contain",
    },
    profileContainer: {
        alignItems: 'center', // Center align items in profile container
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,  // Space between circle and username
    },
    circleText: {
        fontSize: 16,
        color: '#00A651',
        fontWeight: 'bold',
    },
    profileText: {
        fontSize: 14,
        color: '#00A651',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,  // Allows the content to take up available space
        alignItems: 'center',
        justifyContent: 'center',  // Center content vertically in the middle of the available space
        paddingBottom: 60,  // Add padding to avoid overlapping with BottomNavBar
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,  // Adjust margin to move text down for better spacing
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
        width: 120,
        height: 120,
        resizeMode: "contain",
        marginBottom: 10,  // Space between the image and text
    },
    buttonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#00A651',
    },
});

export default AdminLanding;
