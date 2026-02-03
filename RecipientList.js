import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar, Alert, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SortToggle from './SortToggle';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarRecipient from './BottomNavBarRecipient'; // Import the BottomNavBar for Recipient
import * as Font from 'expo-font';

const RecipientList = () => {
    const [donations, setDonations] = useState([]);
    const [nonEmptyBoxCounts, setNonEmptyBoxCounts] = useState({});
    const [boxCountsReady, setBoxCountsReady] = useState(false);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [username, setUsername] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const scrollViewRef = useRef(null);
    const navigation = useNavigation();
    const [isFontLoaded, setIsFontLoaded] = useState(false);
    const [status, setStatus] = useState('All');
    const [inspectionStatus, setInspectionStatus] = useState('All');
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showInspectionStatusPicker, setShowInspectionStatusPicker] = useState(false);
    const [sortAsc, setSortAsc] = useState(true);

    // Debug function to check auth state
    const debugAuthState = async () => {
        try {
            const authData = await AsyncStorage.multiGet([
                'token', 'username', 'userRole', 'recipientData', 'recipientId',
                'tempToken', 'tempUsername', 'tempUserRole', 'tempRecipientData'
            ]);
            
            const authState = {};
            authData.forEach(([key, value]) => {
                authState[key] = value;
            });
            
            console.log('=== AUTH STATE DEBUG ===');
            console.log('Token:', !!authState.token ? 'EXISTS' : 'MISSING');
            console.log('Username:', authState.username);
            console.log('User Role:', authState.userRole);
            console.log('Recipient ID:', authState.recipientId);
            console.log('Recipient Data:', !!authState.recipientData ? 'EXISTS' : 'MISSING');
            console.log('Temp Token:', !!authState.tempToken ? 'EXISTS' : 'MISSING');
            console.log('Temp Username:', authState.tempUsername);
            console.log('Temp User Role:', authState.tempUserRole);
            console.log('Temp Recipient Data:', !!authState.tempRecipientData ? 'EXISTS' : 'MISSING');
            console.log('========================');
            
            return authState;
        } catch (error) {
            console.error('Error debugging auth state:', error);
            return null;
        }
    };

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
            headerRight: () => null,
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
        debugAuthState(); // Debug auth state on mount
        getUsername();
        getRecipientId();
    }, []);

    useEffect(() => {
        if (recipientId) {
            console.log('RecipientId is set, fetching donations for recipientId:', recipientId);
            fetchDonations();
        } else {
            console.log('RecipientId not set yet, waiting...');
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
            // First, try to get from AsyncStorage
            const storedRecipientId = await AsyncStorage.getItem('recipientId');
            
            if (storedRecipientId) {
                console.log('Found stored recipientId:', storedRecipientId);
                setRecipientId(storedRecipientId);
                return;
            }

            // If not in storage, fetch from API using username (same as RecipientAgreements.js)
            const storedUsername = await AsyncStorage.getItem('username');
            const token = await AsyncStorage.getItem('token');
            
            if (!token) {
                console.error('No authentication token found');
                Alert.alert(
                    "Authentication Required", 
                    "Please sign in again.",
                    [
                        { 
                            text: "Sign In", 
                            onPress: () => {
                                AsyncStorage.clear();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'SignIn' }],
                                });
                            }
                        }
                    ]
                );
                return;
            }
            
            if (storedUsername) {
                console.log(`Fetching recipient details for username: ${storedUsername}`);
                const headers = { Authorization: `Bearer ${token}` };
                const response = await axios.get(`https://apiv2.medleb.org/users/Recipient/username/${storedUsername}`, { headers });
                console.log('Recipient details response:', response.data);
                
                if (response.data && response.data.RecipientId) {
                    console.log('Recipient ID found:', response.data.RecipientId);
                    const recipientIdStr = response.data.RecipientId.toString();
                    setRecipientId(recipientIdStr);
                    // Store it for future use
                    await AsyncStorage.setItem('recipientId', recipientIdStr);
                    // Also store recipient data if available
                    if (response.data) {
                        await AsyncStorage.setItem('recipientData', JSON.stringify(response.data));
                    }
                } else {
                    console.log('No recipient ID found in response.');
                    Alert.alert(
                        "Account Issue", 
                        "Could not find recipient account details. Please contact support.",
                        [{ text: "OK" }]
                    );
                }
            } else {
                console.error('No username found in storage');
                Alert.alert(
                    "Authentication Required", 
                    "Please sign in again.",
                    [
                        { 
                            text: "Sign In", 
                            onPress: () => {
                                AsyncStorage.clear();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'SignIn' }],
                                });
                            }
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Failed to load recipient ID:', error);
            
            // Handle authentication errors
            if (error.response?.status === 401) {
                Alert.alert(
                    "Authentication Error", 
                    "Your session has expired. Please sign in again.",
                    [
                        { 
                            text: "Sign In", 
                            onPress: () => {
                                AsyncStorage.clear();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'SignIn' }],
                                });
                            }
                        }
                    ]
                );
            } else if (error.response?.status === 404) {
                Alert.alert(
                    "Account Not Found", 
                    "Recipient account not found. Please contact support.",
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert(
                    "Error", 
                    `Failed to load recipient information. ${error.response?.status ? `(HTTP ${error.response.status})` : 'Please try again.'}`,
                    [{ text: "OK" }]
                );
            }
        }
    };

    const fetchDonations = async () => {
        try {
            if (!recipientId) {
                console.error('Cannot fetch donations: recipientId is not set');
                Alert.alert("Error", "Recipient information not available. Please sign in again.");
                return;
            }

            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error('No token found - user needs to login');
                Alert.alert(
                    "Authentication Required", 
                    "Please sign in to view donations.",
                    [
                        { 
                            text: "Sign In", 
                            onPress: () => {
                                AsyncStorage.clear();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'SignIn' }],
                                });
                            }
                        }
                    ]
                );
                return;
            }

            console.log('Fetching donations for recipientId:', recipientId);

            // Always include auth headers to avoid 401 from protected endpoints
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.get(`https://apiv2.medleb.org/donation/byRecipient/${recipientId}` , { headers });

            if (Array.isArray(response.data)) {
                // Apply optional date and status filters if set
                let filteredDonations = response.data;

                if (fromDate || toDate) {
                    filteredDonations = filteredDonations.filter(donation => {
                        const donationDate = new Date(donation.DonationDate || donation.CreatedDate || donation.DateDonated);
                        let matchesDate = true;
                        if (fromDate && donationDate < fromDate) matchesDate = false;
                        if (toDate && donationDate > toDate) matchesDate = false;
                        return matchesDate;
                    });
                }

                if (status && status !== 'All') {
                    const st = status.toLowerCase();
                    if (st === 'processing') {
                        // Processing = backend "pending"
                        filteredDonations = filteredDonations.filter(donation =>
                            (donation.status || '').toLowerCase() === 'pending'
                        );
                    } else if (st === 'sent') {
                        // Sent = any inspection status, filtered by inspectionStatus if specified
                        const ist = (inspectionStatus || 'All').toLowerCase();
                        filteredDonations = filteredDonations.filter(donation => {
                            const ds = (donation.status || '').toLowerCase();
                            const isSent = ds === 'approved' || ds === 'inspect' || ds === 'inspected' || ds === 'refused';
                            if (!isSent) return false;
                            if (ist === 'all') return true;
                            return ds === ist;
                        });
                    } else {
                        // Direct backend status match (for backward compatibility)
                        filteredDonations = filteredDonations.filter(donation =>
                            (donation.status || '').toLowerCase() === st
                        );
                    }
                }

                setDonations(filteredDonations);
                console.log(`Successfully fetched ${filteredDonations.length} donations (${response.data.length} total before filtering)`);

                // Prefetch non-empty box counts for these donations
                try {
                    setBoxCountsReady(false);
                    await prefetchNonEmptyBoxCounts(filteredDonations);
                } catch (e) {
                    console.warn('[RecipientList] prefetchNonEmptyBoxCounts failed:', e?.message);
                } finally {
                    setBoxCountsReady(true);
                }
            } else {
                console.error('Unexpected response structure:', response.data);
                setDonations([]);
            }
        } catch (error) {
            console.error('Error fetching donations:', {
                message: error.message,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                params: error.config?.params
            });
            
            // Handle specific error cases
            if (error.response?.status === 401) {
                Alert.alert(
                    "Authentication Error", 
                    "Your session has expired. Please sign in again.",
                    [
                        { 
                            text: "Sign In", 
                            onPress: () => {
                                AsyncStorage.clear();
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'SignIn' }],
                                });
                            }
                        }
                    ]
                );
            } else if (error.response?.status === 403) {
                Alert.alert(
                    "Access Denied", 
                    "You don't have permission to view these donations. Please contact support.",
                    [{ text: "OK" }]
                );
            } else if (error.response?.status === 404) {
                Alert.alert(
                    "Not Found", 
                    "No donations found for the specified criteria.",
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert(
                    "Error", 
                    `Failed to load donations. ${error.response?.status ? `(HTTP ${error.response.status})` : 'Please check your connection and try again.'}`,
                    [{ text: "OK" }]
                );
            }
            setDonations([]);
        }
    };

    const prefetchNonEmptyBoxCounts = async (donationsList = []) => {
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const ids = Array.from(new Set((donationsList || []).map(d => d?.DonationId).filter(Boolean)));
        if (ids.length === 0) return;
        
        // Backend now returns only non-empty boxes directly
        const boxResults = await Promise.allSettled(
            ids.map(id => axios.get(`https://apiv2.medleb.org/boxes/byDonation/${id}`, { headers }))
        );
        
        const map = {};
        boxResults.forEach((res, idx) => {
            const id = ids[idx];
            if (res.status === 'fulfilled') {
                const boxes = Array.isArray(res.value?.data) ? res.value.data : [];
                // Just count the boxes - backend already filtered non-empty ones
                map[id] = boxes.length;
            }
        });
        
        if (Object.keys(map).length) setNonEmptyBoxCounts(prev => ({ ...prev, ...map }));
    };

    const getComputedBoxCount = (donation) => {
        const id = donation?.DonationId;
        if (id && nonEmptyBoxCounts[id] != null) return nonEmptyBoxCounts[id];
        return null; // unknown until counts ready
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

    // Helper to get primary display status (Processing or Sent)
    const getPrimaryStatus = (backendStatus) => {
        if (!backendStatus) return 'Unknown';
        const status = backendStatus.toLowerCase();
        if (status === 'pending') {
            return 'Processing';
        }
        // approved, inspect, inspected, refused are all "Sent"
        return 'Sent';
    };

    // Helper to get inspection substatus when status is "Sent"
    const getInspectionStatus = (backendStatus) => {
        if (!backendStatus) return null;
        const status = backendStatus.toLowerCase();
        if (status === 'pending') return null; // No inspection status for Processing
        // Map backend status to inspection display
        if (status === 'approved') return 'Approved';
        if (status === 'inspect') return 'Inspected';
        if (status === 'inspected') return 'Inspected';
        if (status === 'refused') return 'Refused';
        return null;
    };

    const getStatusColor = (status) => {
        if (!status) return 'black';
        const st = status.toLowerCase();
        // Processing = orange
        if (st === 'pending') return 'orange';
        // Sent statuses - color by inspection result
        if (st === 'approved') return 'green';
        if (st === 'inspect' || st === 'inspected') return 'blue';
        if (st === 'refused') return 'red';
        return 'black';
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#f9f9f9" barStyle="dark-content" />

            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Date Range Filters */}
                <View style={styles.dateRangeContainer}>
                    <TouchableOpacity style={styles.dateContainer} onPress={() => setShowFromDatePicker(true)}>
                        <Text style={styles.dateText}>From</Text>
                        <Text style={styles.dateValue}>{fromDate ? fromDate.toISOString().split('T')[0] : 'Choose date'}</Text>
                    </TouchableOpacity>

                    <View style={styles.dateIcon}>
                        <Image source={require("./assets/calendar.png")} style={styles.calendarIcon} />
                    </View>

                    <TouchableOpacity style={styles.dateContainer} onPress={() => setShowToDatePicker(true)}>
                        <Text style={styles.dateText}>To</Text>
                        <Text style={styles.dateValue}>{toDate ? toDate.toISOString().split('T')[0] : 'Choose date'}</Text>
                    </TouchableOpacity>
                </View>
                {showFromDatePicker && renderDatePicker('from')}
                {showToDatePicker && renderDatePicker('to')}

                {/* Status + Search inline */}
                <View style={styles.filterRow}>
                    <View style={styles.filterColumnInline}>
                        <Text style={styles.filterLabel}>Status</Text>
                        <TouchableOpacity onPress={() => setShowStatusPicker(!showStatusPicker)} style={styles.filterButton}>
                            <View style={styles.pickerContent}>
                                <Text style={styles.filterText} numberOfLines={1} ellipsizeMode="tail">{status}</Text>
                                <MaterialCommunityIcons name={showStatusPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#000000ff" />
                            </View>
                        </TouchableOpacity>
                        {showStatusPicker && (
                            <View style={styles.dropdown}>
                                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                    {['All', 'Processing', 'Sent'].map((s) => (
                                        <TouchableOpacity key={s} onPress={() => { 
                                            setStatus(s); 
                                            setShowStatusPicker(false);
                                            if (s !== 'Sent') setInspectionStatus('All'); // Reset inspection status if not Sent
                                        }}>
                                            <Text style={styles.dropdownText}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                    {status === 'Sent' && (
                        <View style={styles.filterColumnInline}>
                            <Text style={styles.filterLabel}>Inspection</Text>
                            <TouchableOpacity onPress={() => setShowInspectionStatusPicker(!showInspectionStatusPicker)} style={styles.filterButton}>
                                <View style={styles.pickerContent}>
                                    <Text style={styles.filterText} numberOfLines={1} ellipsizeMode="tail">{inspectionStatus}</Text>
                                    <MaterialCommunityIcons name={showInspectionStatusPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#000000ff" />
                                </View>
                            </TouchableOpacity>
                            {showInspectionStatusPicker && (
                                <View style={styles.dropdown}>
                                    <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                        {['All', 'Approved', 'Inspected', 'Refused'].map((s) => (
                                            <TouchableOpacity key={s} onPress={() => { setInspectionStatus(s); setShowInspectionStatusPicker(false); }}>
                                                <Text style={styles.dropdownText}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                    )}
                    <View style={styles.filterColumnInline}>
                        <Text style={styles.filterLabel}>Search</Text>
                        <TouchableOpacity style={styles.searchButton} onPress={fetchDonations}>
                            <Image source={require('./assets/search.png')} style={[styles.searchIcon, styles.searchIconInline]} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Separator with inline sort toggle (shared) */}
                <View style={styles.separatorRow}>
                    <Image source={require('./assets/separator-green.png')} style={styles.separatorFlex} />
                    <SortToggle sortAsc={sortAsc} onToggle={() => setSortAsc(!sortAsc)} />
                </View>
                <Text style={styles.resultCount}>Number of result(s): {boxCountsReady ? donations.length : '...'}</Text>

                {/* Donations List */}
                {!boxCountsReady ? (
                    <View style={styles.stateContainer}>
                        <ActivityIndicator size="small" color="#00A651" />
                        <Text style={styles.emptyText}>Loading box counts...</Text>
                    </View>
                ) : (
                    <ScrollView>
                        {[...donations]
                            .sort((a,b)=>{
                                const parse=(d)=> (d? Date.parse(d):0);
                                const ad=parse(a?.DonationDate)||parse(a?.CreatedDate)||0;
                                const bd=parse(b?.DonationDate)||parse(b?.CreatedDate)||0;
                                return sortAsc? (ad-bd):(bd-ad);
                            }).map((donation, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.card}
                                    onPress={() => navigation.navigate('DonationDetails', { donation })}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.statusText, { color: getStatusColor(donation.status) }]}>
                                            {getPrimaryStatus(donation.status)}
                                            {getInspectionStatus(donation.status) && ` - ${getInspectionStatus(donation.status)}`}
                                        </Text>
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
                                                <Text style={styles.cardText}>{getComputedBoxCount(donation) ?? 0}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                    </ScrollView>
                )}
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
        marginLeft:30,
        marginRight:30,
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
    },
    filterColumn: {
        flex: 0,
        marginHorizontal: 5,
    },
    filterColumnInline: {
        flex: 1,
        marginHorizontal: 5,
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
        backgroundColor: '#f9f9f9',
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
    filterButtonText: {
        color: '#00A651',
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
    },
    resultCount: {
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 10,
        fontWeight: 'light',
        color: "#121212",
        fontFamily: 'RobotoCondensed-Regular',
    },
    card: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 50,
        padding: 15,
        marginVertical: 10,
        minHeight: 140,
    },
    cardHeader: {
        marginBottom: 10,
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
      dateRangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
       
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 10,
        height:45,
        
    },
    dateContainer: {
        flex: 1,
        alignItems: 'center',
    },
    dateText: {
        fontSize: 13,
        fontFamily: 'RobotoCondensed-Bold',        color: '#707070',
    },
    dateValue: {
        fontSize: 13,
        fontFamily: 'RobotoCondensed-Bold',        color: '#000',
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
        resizeMode:'contain'
    },
    filterContainer: {
        marginVertical: 20,
        paddingHorizontal: 10,
        flexDirection:'row'
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
        backgroundColor: '#f9f9f9',
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
     searchIconInline: {
        width: '100%',
     },
    separator:{
        marginTop:10,
    },
    separatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    separatorFlex: {
        flex: 1,
        resizeMode: 'contain',
    },
    sortInline: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    sortIconButton: {
        paddingHorizontal: 4,
        paddingVertical: 6,
    },
    pickerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 10,
    },
});
export default RecipientList;