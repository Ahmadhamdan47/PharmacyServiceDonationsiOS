import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarRecipient from './BottomNavBarRecipient'; // Import the BottomNavBar for Recipient
import HeaderProfile from './HeaderProfile'; // Import HeaderProfile component
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
                const items = response.data.data;
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
        alignItems: 'center',
        marginRight: 20,
        position: 'relative',
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
        marginBottom: 4,
    },
    circleText: {
        fontSize: 18,
        color: '#00A651',
        fontFamily: 'RobotoCondensed-Bold',
        fontWeight: 'bold',
    },
    profileText: {
        fontFamily: 'RobotoCondensed-Bold',
        fontSize: 12,
        color: '#000',
        textAlign: 'center',
        maxWidth: 60,
    },
});

export default RecipientAgreements;