import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection

const List = () => {
    const [donations, setDonations] = useState([]);
    const [donors, setDonors] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [donorId, setDonorId] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [status, setStatus] = useState('All');
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [showDonorPicker, setShowDonorPicker] = useState(false);
    const [showRecipientPicker, setShowRecipientPicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [username, setUsername] = useState('');
    const scrollViewRef = useRef(null);
    const navigation = useNavigation();

    useEffect(() => {
        fetchDonors();
        fetchRecipients();
        getUsername();
    }, []);

    useEffect(() => {
        
        navigation.setOptions({
            headerTitle: 'List',

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
            headerTitleStyle: {
              marginTop: 30, // Add margin top of 42px to the header title
              position: 'relative', // Ensure the profile container is the reference for positioning the dropdown
                backgroundColor: '#f9f9f9',
                
            },
            headerStyle: {
              height: 100, // Increase the header height to accommodate the margin
              backgroundColor: '#f9f9f9',
          },
        });
    }, [navigation, username]);


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

    const fetchDonations = async () => {
        setDonations([]);
        try {
            const response = await axios.get('https://apiv2.medleb.org/donation/filtered', {
                params: {
                    donorId,
                    recipientId,
                    status: status === 'All' ? '' : status,
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

    const fetchDonors = async () => {
        try {
            const response = await axios.get('https://apiv2.medleb.org/donor/all');
            setDonors(response.data);
        } catch (error) {
            console.error('Error fetching donors:', error);
        }
    };

    const fetchRecipients = async () => {
        try {
            const response = await axios.get('https://apiv2.medleb.org/recipient/all');
            setRecipients(response.data);
        } catch (error) {
            console.error('Error fetching recipients:', error);
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

    // Add this function to determine the color based on status
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
            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* First Row: Date Filters */}
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
           

                {/* Second Row: Donor, Recipient, Status */}
                {/* Donor, Recipient, and Status Fields in a Row */}
                <View style={styles.filterRow}>
                    {/* Donor */}
                    <View style={styles.filterColumn}>
                        <Text style={styles.filterLabel}>Donor</Text>
                        <TouchableOpacity onPress={() => setShowDonorPicker(!showDonorPicker)} style={styles.filterButton}>
                            <Text style={styles.filterText}>
                                {donors.find(d => d.DonorId === donorId)?.DonorName || 'Pick▼'}
                            </Text>
                        </TouchableOpacity>
                        {showDonorPicker && (
                            <View style={styles.dropdown}>
                                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                    <TouchableOpacity onPress={() => { setDonorId(''); setShowDonorPicker(false); }}>
                                        <Text style={styles.dropdownText}>All</Text>
                                    </TouchableOpacity>
                                    {donors.map((d) => (
                                        <TouchableOpacity key={d.DonorId} onPress={() => { setDonorId(d.DonorId); setShowDonorPicker(false); }}>
                                            <Text style={styles.dropdownText}>{d.DonorName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Recipient */}
                    <View style={styles.filterColumn}>
                        <Text style={styles.filterLabel}>Recipient</Text>
                        <TouchableOpacity onPress={() => setShowRecipientPicker(!showRecipientPicker)} style={styles.filterButton}>
                            <Text style={styles.filterText}>
                                {recipients.find(r => r.RecipientId === recipientId)?.RecipientName || 'Pick▼'}
                            </Text>
                        </TouchableOpacity>
                        {showRecipientPicker && (
                            <View style={styles.dropdown}>
                                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                    <TouchableOpacity onPress={() => { setRecipientId(''); setShowRecipientPicker(false); }}>
                                        <Text style={styles.dropdownText}>All</Text>
                                    </TouchableOpacity>
                                    {recipients.map((r) => (
                                        <TouchableOpacity key={r.RecipientId} onPress={() => { setRecipientId(r.RecipientId); setShowRecipientPicker(false); }}>
                                            <Text style={styles.dropdownText}>{r.RecipientName}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Status */}
                    <View style={styles.filterColumn}>
                        <Text style={styles.filterLabel}>Status</Text>
                        <TouchableOpacity onPress={() => setShowStatusPicker(!showStatusPicker)} style={styles.filterButton}>
                            <Text style={styles.filterText}>{status}</Text>
                        </TouchableOpacity>
                        {showStatusPicker && (
                            <View style={styles.dropdown}>
                                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                    {['All', 'Pending', 'Approved', 'Inspect'].map((s) => (
                                        <TouchableOpacity key={s} onPress={() => { setStatus(s); setShowStatusPicker(false); }}>
                                            <Text style={styles.dropdownText}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>


                {/* Third Row: Filter Button */}
                <TouchableOpacity style={styles.searchButton} onPress={fetchDonations}>
    <Image source={require('./assets/search.png')} style={styles.searchIcon} />
</TouchableOpacity>


                {/* Results Count */}
                <Image source={require('./assets/separator-green.png')} style={styles.separator} />
                <Text style={styles.resultCount}>number of result(s): {donations.length}</Text>

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
                                <Text style={styles.cardTitle}>Donation Title: {donation.DonationTitle}</Text>
                                <Text style={styles.cardText}>From: {donation.DonorName}</Text>
                                <Text style={styles.cardText}>To: {donation.RecipientName}</Text>
                                <Text style={styles.cardText}>Date: {donation.DonationDate}</Text>
                                <Text style={styles.cardText}>nb of box(es): {donation.NumberOfBoxes || 0}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </ScrollView>

            {/* Bottom Navigation Bar */}
            <BottomNavBarInspection currentScreen="List" />
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
        marginLeft:55,
        marginRight:55,
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
      },
      circleText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
    
        fontSize: 20,
        color: '#00A651',
        fontWeight: 'bold',
      },
      profileText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
    
        fontSize: 14,
        color: '#000',
        fontWeight: '400',
        textAlign: 'center',
        
      },
    backButton: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 10,
        paddingRight: 100,
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        paddingHorizontal: 10,
        
    },
    filterColumn: {
        flex: 1,
        marginHorizontal: 5,
    },
    
    filterText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
    },
    dropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        position: 'absolute',
        width: '100%',
        maxHeight: 120,
        zIndex: 10,
    },
    dropdownScroll: {
        maxHeight: 120,
    },
    dropdownText: {
        fontSize: 14,
        padding: 10,
        color: '#000',

    },
    filterButtonText: {
        color: '#00A651',
        fontSize: 16,
    },
    resultCount: {
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 10,
        fontWeight: 'light',
        color: "#121212"
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 8,
        padding: 15,
        marginVertical: 10,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'left',
        marginBottom: 5,
    },
    cardContent: {
        marginTop: 5,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
    backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
        marginTop:30,
      },
      dateRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginHorizontal: 10,
        height:39,
        marginBottom:10,
    },
    dateContainer: {
        flex: 1,
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        fontWeight:'bold',
        color: '#707070',
    },
    dateValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    dateIcon: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarIcon: {
        width: 35,
        height: 34,
        tintColor: '#00A651',
    },
    filterContainer: {
        marginVertical: 20,
        paddingHorizontal: 10,
        flexDirection:'row'
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'grey',
        marginBottom: 5,
        textAlign: 'center',
    },
    filterButton: {
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
    },
    searchButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50, // Optional: for round button
    },
    searchIcon: {
        width: 250,  // Set the width of the search icon
        height: 30, // Set the height of the search icon
    },  
    separator:{
        marginTop:10,
        
    }
});

export default List;
