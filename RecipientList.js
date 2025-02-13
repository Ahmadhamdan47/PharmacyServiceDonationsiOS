import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarRecipient from './BottomNavBarRecipient'; // Import the BottomNavBar for Recipient
import * as Font from 'expo-font';

const RecipientList = () => {
    const [donations, setDonations] = useState([]);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
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
        
        navigation.setOptions({
            headerTitle: 'Recipient List',

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
        fetchFonts(); // Load fonts on component mount
    }, []);

    useEffect(() => {
        getUsername();
        getRecipientId();
    }, []);

    useEffect(() => {
        if (recipientId) {
            fetchDonations();
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

    const getRecipientId = async () => {
        try {
            const storedRecipientId = await AsyncStorage.getItem('recipientId');
            if (storedRecipientId) {
                setRecipientId(storedRecipientId);
            }
        } catch (error) {
            console.error('Failed to load recipient ID:', error);
        }
    };

    const fetchDonations = async () => {
        try {
            const response = await axios.get('https://apiv2.medleb.org/donation/filtered', {
                params: {
                    recipientId,
                    fromDate: fromDate ? fromDate.toISOString().split('T')[0] : '',
                    toDate: toDate ? toDate.toISOString().split('T')[0] : '',
                },
            });

            if (Array.isArray(response.data)) {
                setDonations(response.data);
            } else {
                console.error('Unexpected response structure:', response.data);
                setDonations([]);
            }
        } catch (error) {
            console.error('Error fetching donations:', error);
            setDonations([]);
        }
    };

    const renderDatePicker = (type) => {
        return (
            <DateTimePicker
                value={type === 'from' ? (fromDate || new Date()) : (toDate || new Date())}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || (type === 'from' ? fromDate : toDate);
                    if (type === 'from') {
                        setShowFromDatePicker(false);
                        setFromDate(currentDate);
                    } else {
                        setShowToDatePicker(false);
                        setToDate(currentDate);
                    }
                }}
            />
        );
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'orange';
            case 'approved':
                return 'green';
            case 'inspect':
                return 'red';
            default:
                return 'black';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#f9f9f9" />

            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Date Range Filters */}
                <View style={styles.dateRangeContainer}>
                    <TouchableOpacity style={styles.dateContainer} onPress={() => setShowFromDatePicker(true)}>
                        <Text style={styles.dateText}>From</Text>
                        <Text style={styles.dateValue}>{fromDate ? fromDate.toISOString().split('T')[0] : '01/01/24'}</Text>
                    </TouchableOpacity>

                    <View style={styles.dateIcon}>
                        <Image source={require("./assets/calendar.png")} style={styles.calendarIcon} />
                    </View>

                    <TouchableOpacity style={styles.dateContainer} onPress={() => setShowToDatePicker(true)}>
                        <Text style={styles.dateText}>To</Text>
                        <Text style={styles.dateValue}>{toDate ? toDate.toISOString().split('T')[0] : '01/08/24'}</Text>
                    </TouchableOpacity>
                </View>
                {showFromDatePicker && renderDatePicker('from')}
                {showToDatePicker && renderDatePicker('to')}

                {/* Search Button */}
                <TouchableOpacity style={styles.searchButton} onPress={fetchDonations}>
                    <Image source={require('./assets/search.png')} style={styles.searchIcon} />
                </TouchableOpacity>

                {/* Results Count */}
                <Image source={require('./assets/separator-green.png')} style={styles.separator} />
                <Text style={styles.resultCount}>Number of result(s): {donations.length}</Text>

                {/* Donations List */}
                <ScrollView>
                    {donations.map((donation, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            onPress={() => navigation.navigate('DonationDetails', { donation })}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={[styles.statusText, { color: getStatusColor(donation.status) }]}>{donation.status}</Text>
                            </View>

                            <View style={styles.cardContent}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    {/* Left Column */}
                                    <View style={{ flex: 1, marginRight: 10, marginLeft: 10 }}>
                                        <Text style={[styles.cardTitle]}>Donation Title</Text>
                                        <Text style={[styles.cardText]}>{donation.DonationTitle}</Text>
                                        <Text style={[styles.cardTitle]}>Date</Text>
                                        <Text style={styles.cardText}>{donation.DonationDate}</Text>
                                    </View>

                                    {/* Right Column */}
                                    <View style={{ flex: 1, marginLeft: 10, paddingBottom: 20 }}>
                                        <Text style={[styles.cardTitle]}>From</Text>
                                        <Text style={[styles.cardText]}>{donation.DonorName}</Text>
                                        <Text style={[styles.cardTitle]}>To</Text>
                                        <Text style={[styles.cardText]}>{donation.RecipientName}</Text>
                                        <Text style={[styles.cardTitle]}>Number of Boxes</Text>
                                        <Text style={styles.cardText}>{donation.NumberOfBoxes || 0}</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <BottomNavBarRecipient currentScreen="RecipientList" />
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
    
});

export default RecipientList;