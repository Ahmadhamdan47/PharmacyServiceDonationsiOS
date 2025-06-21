import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarRecipient from './BottomNavBarRecipient'; // Import the BottomNavBar for Recipient
import * as Font from 'expo-font';

const RecipientAgreements = () => {
    const [agreements, setAgreements] = useState([]);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [username, setUsername] = useState('');
    const [recipientId, setRecipientId] = useState('');
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
                backgroundColor: '#f9f9f9',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
            },
        });
    }, [navigation, username]);

    useEffect(() => {
        if (username) {
            fetchRecipientDetails();
        }
    }, [username]);

    useEffect(() => {
        if (recipientId) {
            fetchAgreements();
        }
    }, [recipientId]);

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

    const fetchRecipientDetails = async () => {
        try {
            console.log(`Fetching recipient details for username: ${username}`);
            const response = await axios.get(`https://apiv2.medleb.org/users/Recipient/username/${username}`);
            console.log('Recipient details response:', response);
            if (response.data && response.data.RecipientId) {
                console.log('Recipient ID found:', response.data.RecipientId);
                setRecipientId(response.data.RecipientId);
            } else {
                console.log('No recipient ID found in response.');
            }
        } catch (error) {
            console.error('Failed to fetch recipient details:', error);
        }
    };

    const fetchAgreements = async () => {
        try {
            console.log(`Fetching agreements for recipient ID: ${recipientId}`);
            const response = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Recipient/${recipientId}`);
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
            <BottomNavBarRecipient currentScreen="RecipientAgreement" />
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
        padding: 10,
        marginBottom: 20,
    },
    datePickerButton: {
        flex: 1,
        alignItems: 'center',
    },
    datePickerText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Regular',
        color: '#707070',
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
    backButtonContainer: {
        marginLeft: 10,
    },
    backButtonImage: {
        width: 41,
        height: 15,
    },
    profileContainer: {
        width: 47,
        height: 16,
        backgroundColor: '#f9f9f9',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        fontWeight: '400',
        marginRight: 24,
        marginLeft: 103,
        position: 'relative',
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
        backgroundColor: 'transparent',
        fontSize: 20,
        color: '#00A651',
        fontWeight: 'bold',
    },
    profileText: {
        backgroundColor: 'transparent',
        fontFamily: 'RobotoCondensed-Bold',
        fontSize: 14,
        color: '#000',
        fontWeight: '400',
        textAlign: 'center',
    },
});

export default RecipientAgreements;