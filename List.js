import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import axios from 'axios';
import BottomNavBarInspection from './BottomNavBarInspection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const List = () => {
    const [donations, setDonations] = useState([]);
    const [donors, setDonors] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [donorId, setDonorId] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [status, setStatus] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [showDonorPicker, setShowDonorPicker] = useState(false);
    const [showRecipientPicker, setShowRecipientPicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
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
            headerTitle: '',
            headerLeft: null,
            headerRight: () => (
                <View style={styles.profileContainer}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.profileText}>{username}</Text>
                </View>
            ),
            headerTitleAlign: 'left',
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
                    status,
                    fromDate,
                    toDate,
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

    const handleDateSelect = (type, date) => {
        if (type === 'from') {
            setFromDate(date);
        } else {
            setToDate(date);
        }
    };

    const renderDatePicker = (type) => {
        const today = new Date();
        let dates = [];
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }

        return (
            <View style={styles.datePicker}>
                {dates.map((date) => (
                    <TouchableOpacity key={date} onPress={() => handleDateSelect(type, date)}>
                        <Text style={styles.dateText}>{date}</Text>
                    </TouchableOpacity>
                ))}
            </View>
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

    const handleDropdownOpen = (dropdownRef) => {
        setTimeout(() => {
            if (dropdownRef && scrollViewRef.current) {
                dropdownRef.measureLayout(
                    scrollViewRef.current,
                    (x, y) => {
                        scrollViewRef.current.scrollTo({ y: y - 20, animated: true });
                    },
                    () => {}
                );
            }
        }, 100);
    };

    let donorDropdownRef;
    let recipientDropdownRef;
    let statusDropdownRef;

    return (
        <View style={styles.container}>
            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Filters Section */}
                <View style={styles.filterRow}>
                    {/* Donor Dropdown */}
                    <TouchableOpacity 
                        onPress={() => {
                            setShowDonorPicker(!showDonorPicker);
                            handleDropdownOpen(donorDropdownRef);
                        }} 
                        style={styles.filterButton}
                        ref={ref => donorDropdownRef = ref}
                    >
                        <Text style={styles.filterText}>{donors.find(d => d.DonorId === donorId)?.DonorName || 'Donor'}</Text>
                    </TouchableOpacity>
                    {showDonorPicker && (
                        <View style={styles.dropdown}>
                            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                {donors.map((d) => (
                                    <TouchableOpacity key={d.DonorId} onPress={() => { 
                                        setDonorId(d.DonorId); 
                                        setShowDonorPicker(false); 
                                    }}>
                                        <Text style={styles.dropdownText}>{d.DonorName}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Recipient Dropdown */}
                    <TouchableOpacity 
                        onPress={() => {
                            setShowRecipientPicker(!showRecipientPicker);
                            handleDropdownOpen(recipientDropdownRef);
                        }} 
                        style={styles.filterButton}
                        ref={ref => recipientDropdownRef = ref}
                    >
                        <Text style={styles.filterText}>{recipients.find(r => r.RecipientId === recipientId)?.RecipientName || 'Recipient'}</Text>
                    </TouchableOpacity>
                    {showRecipientPicker && (
                        <View style={styles.dropdown}>
                            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                {recipients.map((r) => (
                                    <TouchableOpacity key={r.RecipientId} onPress={() => { 
                                        setRecipientId(r.RecipientId); 
                                        setShowRecipientPicker(false); 
                                    }}>
                                        <Text style={styles.dropdownText}>{r.RecipientName}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Status Dropdown */}
                    <TouchableOpacity 
                        onPress={() => {
                            setShowStatusPicker(!showStatusPicker);
                            handleDropdownOpen(statusDropdownRef);
                        }} 
                        style={styles.filterButton}
                        ref={ref => statusDropdownRef = ref}
                    >
                        <Text style={styles.filterText}>{status || 'Status'}</Text>
                    </TouchableOpacity>
                    {showStatusPicker && (
                        <View style={styles.dropdown}>
                            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                {['Pending', 'Approved', 'Inspect'].map((s) => (
                                    <TouchableOpacity key={s} onPress={() => { 
                                        setStatus(s); 
                                        setShowStatusPicker(false); 
                                    }}>
                                        <Text style={styles.dropdownText}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Date Pickers Row */}
                <View style={styles.dateRow}>
                    <TouchableOpacity onPress={() => setShowFromDatePicker(!showFromDatePicker)} style={styles.datePickerButton}>
                        <Text style={styles.filterText}>From {fromDate || 'Select'}</Text>
                    </TouchableOpacity>
                    {showFromDatePicker && renderDatePicker('from')}

                    <TouchableOpacity onPress={() => setShowToDatePicker(!showToDatePicker)} style={styles.datePickerButton}>
                        <Text style={styles.filterText}>To {toDate || 'Select'}</Text>
                    </TouchableOpacity>
                    {showToDatePicker && renderDatePicker('to')}
                </View>

                {/* Filter Button */}
                <TouchableOpacity style={styles.filterButton} onPress={fetchDonations}>
                    <Text style={styles.filterButtonText}>Filter</Text>
                </TouchableOpacity>

                {/* Results Count */}
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
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 80,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 10,
    },
    profileContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        marginRight: 10,
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 5,
    },
    circleText: {
        fontSize: 16,
        color: '#00A651',
        fontWeight: 'bold',
    },
    profileText: {
        fontSize: 14,
        color: '#000',
    },
    filterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    filterButton: {
        borderColor: '#00A651',
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 10,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    datePickerButton: {
        flex: 1,
        borderColor: '#00A651',
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 10,
        marginHorizontal: 5,
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
    },
    filterText: {
        fontSize: 14,
        color: '#00A651',
    },
    dropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginTop: 5,
        position: 'absolute',
        width: '100%',
        maxHeight: 120, // Limit height for scrolling
        zIndex: 10,
    },
    dropdownScroll: {
        maxHeight: 120, // Set max height for scrolling
    },
    dropdownText: {
        fontSize: 14,
        padding: 10,
    },
    filterButtonText: {
        color: '#00A651',
        fontSize: 16,
    },
    resultCount: {
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 16,
        fontWeight: 'bold',
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
    navBarContainer: {
        paddingBottom: 10,
    },
});

export default List;
