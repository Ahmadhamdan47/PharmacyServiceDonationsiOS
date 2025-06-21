import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import BottomNavBar from './BottomNavBar'; // Import the BottomNavBar for Donor
import * as Font from 'expo-font';

const DonorAgreement = () => {
    const [agreements, setAgreements] = useState([]);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [username, setUsername] = useState('');
    const [donorId, setDonorId] = useState('');
    const scrollViewRef = useRef(null);
    const navigation = useNavigation();
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
        getUsername();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Agreements',
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

    useEffect(() => {
        if (username) {
            fetchDonorDetails();
        }
    }, [username]);

    useEffect(() => {
        if (donorId) {
            fetchAgreements();
        }
    }, [donorId]);

    const getUsername = async () => {
        try {
            console.log('Fetching username from AsyncStorage...');
            const storedUsername = await AsyncStorage.getItem('username');
            if (storedUsername) {
                console.log('Username found:', storedUsername);
                setUsername(storedUsername);
            } else {
                console.log('No username found in AsyncStorage.');
            }
        } catch (error) {
            console.error('Failed to load username:', error);
        }
    };

    const fetchDonorDetails = async () => {
        try {
            console.log(`Fetching donor details for username: ${username}`);
            const response = await axios.get(`https://apiv2.medleb.org/users/Donor/username/${username}`);
            console.log('Donor details response:', response);
            if (response.data && response.data.DonorId) {
                console.log('Donor ID found:', response.data.DonorId);
                setDonorId(response.data.DonorId);
            } else {
                console.log('No donor ID found in response.');
            }
        } catch (error) {
            console.error('Failed to fetch donor details:', error);
        }
    };

    const fetchAgreements = async () => {
        try {
            console.log(`Fetching agreements for donor ID: ${donorId}`);
            const response = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Donor/${donorId}`);
            console.log('Agreements response:', response);
            if (response.data && Array.isArray(response.data.data)) {
                console.log('Agreements found:', response.data.data);
                setAgreements(response.data.data);
            } else {
                console.error('Unexpected response structure:', response.data);
                setAgreements([]);
            }
        } catch (error) {
            console.error('Error fetching agreements:', error);
            setAgreements([]);
        }
    };

    const getAgreedUponText = (agreedUpon) => {
        if (agreedUpon === 'agreed') return 'Agreed';
        if (agreedUpon === 'refused') return 'Refused';
        return 'Pending';
    };

    const getAgreedUponColor = (agreedUpon) => {
        if (agreedUpon === 'agreed') return 'green';
        if (agreedUpon === 'refused') return 'red';
        return 'orange';
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#f9f9f9" />

            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Date Range Filters */}
    
                {/* Search Button */}
                <TouchableOpacity style={styles.searchButton} onPress={fetchAgreements}>
                    <Image source={require('./assets/search.png')} style={styles.searchIcon} />
                </TouchableOpacity>

                {/* Results Count */}
                <Image source={require('./assets/separator-green.png')} style={styles.separator} />
                <Text style={styles.resultCount}>Number of result(s): {agreements.length}</Text>

                {/* Agreements List */}
                <ScrollView>
                    {agreements.map((agreement, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            onPress={() => navigation.navigate('AgreementDetails', { agreement })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={[styles.statusText, { color: getAgreedUponColor(agreement.Agreed_Upon) }]}>
                                    {getAgreedUponText(agreement.Agreed_Upon)}
                                </Text>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {/* Left Column */}
                                    <View style={{ flex: 1, marginRight: 10, marginLeft: 10 }}>
                                        <Text style={[styles.cardTitle]}>Donor</Text>
                                        <Text style={[styles.cardText]}>{agreement.donor.DonorName}</Text>
                                    </View>

                                    {/* Right Column */}
                                    <View style={{ flex: 1, marginLeft: 10, paddingBottom: 20 }}>
                                        <Text style={[styles.cardTitle]}>Recipient</Text>
                                        <Text style={[styles.cardText]}>{agreement.Recipient.RecipientName}</Text>
                                        <Text style={[styles.cardTitle]}>Agreed Upon</Text>
                                        <Text style={[styles.cardText, { color: getAgreedUponColor(agreement.Agreed_Upon) }]}>
                                            {getAgreedUponText(agreement.Agreed_Upon)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <BottomNavBar currentScreen="DonorAgreement" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 80,
        marginTop: 40,
        marginLeft: 30,
        marginRight: 30,
    },
    dateRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 10,
        height: 45,
    },
    dateContainer: {
        flex: 1,
        alignItems: 'center',
    },
    dateText: {
        fontSize: 13,
        fontFamily: 'RobotoCondensed-Bold',
        color: '#707070',
    },
    dateValue: {
        fontSize: 13,
        fontFamily: 'RobotoCondensed-Bold',
        color: '#000',
    },
    dateIcon: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarIcon: {
        width: 45,
        height: 44,
        tintColor: '#00A651',
        resizeMode: 'contain',
    },
    searchButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
    },
    searchIcon: {
        width: 320,
        height: 39,
        borderRadius: 50,
    },
    separator: {
        marginTop: 10,
    },
    resultCount: {
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 10,
        fontWeight: 'light',
        color: '#121212',
        fontFamily: 'RobotoCondensed-Regular',
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 50,
        padding: 15,
        marginVertical: 10,
        height: 140,
    },
    statusText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'left',
        marginLeft: 10,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 12,
        fontFamily: 'RobotoCondensed-Bold',
    },
    cardText: {
        fontSize: 12,
        color: '#333',
        fontFamily: 'RobotoCondensed-Regular',
    },
    backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
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
        marginBottom:30,
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
        marginLeft:5,
    },
    circleText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
        fontSize: 20,
        color: '#00A651',
        fontWeight: 'bold',
        marginBottom:2,
    },
    profileText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
        fontFamily: 'RobotoCondensed-Bold',
        fontSize: 14,
        color: '#000',
        fontWeight: '400',
        textAlign: 'left',
    },
    backButton: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 10,
        paddingRight: 100,
    },
});

export default DonorAgreement;