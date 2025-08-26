import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import BottomNavBar from './BottomNavBar'; // Import the BottomNavBar for Donor
import HeaderProfile from './HeaderProfile'; // Import HeaderProfile component
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
    const [statusFilter, setStatusFilter] = useState('All');
    const [showStatusPicker, setShowStatusPicker] = useState(false);

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
                <HeaderProfile username={username} />
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
            const storedDonorId = await AsyncStorage.getItem('donorId');
            console.log('Getting donor ID from storage:', storedDonorId);
            
            if (storedDonorId) {
                setDonorId(parseInt(storedDonorId));
                console.log('Donor ID found in storage:', storedDonorId);
            } else {
                console.log('No donor ID found in storage.');
            }
        } catch (error) {
            console.error('Failed to fetch donor details:', error);
        }
    };

    const fetchAgreements = async () => {
        try {
            console.log(`Fetching agreements for donor ID: ${donorId}`);
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Donor/${donorId}`, { headers });
            console.log('Agreements response:', response);
            if (response.data && Array.isArray(response.data.data)) {
                const items = response.data.data;
                // Sort newest first by Donation.DonationDate (fallbacks applied)
                const sorted = [...items].sort((a, b) => {
                    const parse = (d) => (d ? Date.parse(d) : 0);
                    const aDate = parse(a?.Donation?.DonationDate) || parse(a?.CreatedDate) || parse(a?.created_at);
                    const bDate = parse(b?.Donation?.DonationDate) || parse(b?.CreatedDate) || parse(b?.created_at);
                    return (bDate || 0) - (aDate || 0);
                });
                setAgreements(sorted);
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

    const handleStartDonation = (agreement) => {
        // Navigate to Donate screen with the agreement details
        navigation.navigate('Donate', {
            donationId: agreement.DonationId,
            donorId: agreement.DonorId,
            recipientId: agreement.RecipientId,
            donorName: agreement.donor.DonorName,
            recipientName: agreement.Recipient.RecipientName,
            donationTitle: agreement.Donation?.DonationTitle || 'Donation',
            donationPurpose: agreement.Donation?.DonationPurpose || '',
            donationDate: new Date().toISOString().replace(/:/g, '-'),
            fromAgreement: true
        });
    };

    // Apply status filtering and sort newest first safekeeping
    const filteredAgreements = (agreements || []).filter(a => {
        if (!statusFilter || statusFilter === 'All') return true;
        return (a?.Agreed_Upon || '').toLowerCase() === statusFilter.toLowerCase();
    });

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#f9f9f9" barStyle="dark-content" />

            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Filters Row: Status */}
                <View style={styles.filterRow}>
                    <View style={styles.filterColumn}>
                        <Text style={styles.filterLabel}>Status</Text>
                        <TouchableOpacity onPress={() => setShowStatusPicker(!showStatusPicker)} style={styles.filterButton}>
                            <Text style={styles.filterText}>{statusFilter}</Text>
                        </TouchableOpacity>
                        {showStatusPicker && (
                            <View style={styles.dropdown}>
                                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                    {['All', 'Pending', 'Agreed', 'Refused'].map((s) => (
                                        <TouchableOpacity key={s} onPress={() => { setStatusFilter(s); setShowStatusPicker(false); }}>
                                            <Text style={styles.dropdownText}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>
    
                {/* Search Button */}
                <TouchableOpacity style={styles.searchButton} onPress={fetchAgreements}>
                    <Image source={require('./assets/search.png')} style={styles.searchIcon} />
                </TouchableOpacity>

                {/* Results Count */}
                <Image source={require('./assets/separator-green.png')} style={styles.separator} />
                <Text style={styles.resultCount}>Number of result(s): {filteredAgreements.length}</Text>

                {/* Agreements List */}
                <ScrollView>
                    {filteredAgreements.map((agreement, index) => (
                        <View key={index} style={styles.card}>
                            <TouchableOpacity
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
                                            <Text style={[styles.cardTitle]}>Donation Title</Text>
                                            <Text style={[styles.cardText]}>{agreement?.Donation?.DonationTitle || 'N/A'}</Text>
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
                            
                            {/* Start Donation Process Button - Only show for agreed agreements */}
                            {agreement.Agreed_Upon === 'agreed' && (
                                <TouchableOpacity 
                                    style={styles.startDonationButton}
                                    onPress={() => handleStartDonation(agreement)}
                                >
                                    <Text style={styles.startDonationButtonText}>Start Donation Process</Text>
                                </TouchableOpacity>
                            )}
                        </View>
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
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    filterColumn: {
        flex: 1,
        marginHorizontal: 5,
    },
    filterLabel: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        color: '#A9A9A9',
        marginLeft: 10,
        marginBottom: 5,
    },
    filterButton: {
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 20,
        paddingVertical: 10,
        alignItems: 'center',
        height: 45,
        backgroundColor: '#fff',
    },
    filterText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Regular',
        color: '#121212',
    },
    dropdown: {
        position: 'absolute',
        top: 75,
        left: 0,
        right: 0,
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
    dropdownScroll: {
        maxHeight: 200,
        paddingHorizontal: 10,
    },
    dropdownText: {
        paddingVertical: 12,
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Regular',
        color: '#121212',
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 50,
        padding: 15,
        marginVertical: 10,
        minHeight: 140,
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
    backButton: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 10,
        paddingRight: 100,
    },
    startDonationButton: {
        backgroundColor: '#00a651',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginHorizontal: 15,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startDonationButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        fontWeight: 'bold',
    },
});

export default DonorAgreement;