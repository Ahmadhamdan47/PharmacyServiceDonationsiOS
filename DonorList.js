import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, BackHandler, Image,StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SortToggle from './SortToggle';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useNavigation and useFocusEffect
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar
import * as Font from 'expo-font';
import DateTimePicker from '@react-native-community/datetimepicker';

const DonorList = ({ navigation }) => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [donorId, setDonorId] = useState(null);
    const [username, setUsername] = useState('');
    const [isFontLoaded, setIsFontLoaded] = useState(false);
    const [error, setError] = useState(null); // capture fetch errors for display
    // Filters state
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [status, setStatus] = useState('All');
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [sortAsc, setSortAsc] = useState(true); // true = oldest→newest
    // Keep unfiltered list separate
    const [allDonations, setAllDonations] = useState([]);
    // Map DonationId -> non-empty box count (NumberOfPacks > 0)
    const [nonEmptyBoxCounts, setNonEmptyBoxCounts] = useState({});
    const fetchFonts = async () => {
      await Font.loadAsync({
        'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
        'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
        'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
      });
      setIsFontLoaded(true);
    };
  
        useEffect(() => {
            console.log('[DonorList] mounted');
            fetchFonts(); // Load fonts on component mount
        }, []);
    
    useEffect(() => {
        // Set up the header with the user icon and name
        navigation.setOptions({
            headerTitle: 'List',
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                   
                    <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
                </TouchableOpacity>
            ),
            headerRight: () => null,
            headerTitleAlign: 'center',
           headerTitleStyle:{
            fontFamily: 'RobotoCondensed-Bold',
           },
            headerStyle: {
                backgroundColor: '#f9f9f9', // Set the background color of the whole navigation bar
                elevation: 0,            // Remove shadow on Android
                shadowOpacity: 0,        // Remove shadow on iOS
                borderBottomWidth: 0, 
          },
            
        });

        fetchDonorId();

        // Add event listener for physical back button press
        const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

        // Clean up event listener on component unmount
        return () => backHandler.remove();
    }, [navigation, username]); // Include navigation and username in dependencies to update header

    useEffect(() => {
        if (donorId) {
            console.log('[DonorList] donorId ready, fetching donations for donorId=', donorId);
            fetchDonations();
        } else {
            console.log('[DonorList] donorId not set yet.');
        }
    }, [donorId]);

    // Log donation counts and visibility when donations update
    useEffect(() => {
        if (!donations) return;
        const total = donations.length;
        const visible = donations.filter(d => (d?.NumberOfBoxes ?? 0) > 0 || ((d?.BatchLotTrackings ?? []).length > 0)).length;
        const withBoxes = donations.filter(d => (d?.NumberOfBoxes ?? 0) > 0).length;
        const withPacks = donations.filter(d => ((d?.BatchLotTrackings ?? []).length > 0)).length;
        console.log('[DonorList] donations state updated. total:', total, ' visible:', visible, ' withBoxes:', withBoxes, ' withPacks:', withPacks);
        if (total > 0 && visible === 0) {
            console.log('[DonorList] Note: Donations exist but none have boxes/packs populated. Showing all to avoid empty UI.');
        }
    }, [donations]);

    const handleBackPress = () => {
        navigation.navigate('Landing'); // Navigate back to Landing
        return true; // Prevent default back behavior
    };

    const fetchDonorId = async () => {
        try {
            const storedUsername = await AsyncStorage.getItem('username');
            const storedDonorId = await AsyncStorage.getItem('donorId');
            console.log('[DonorList] fetchDonorId username:', storedUsername, ' donorId:', storedDonorId);
            
            if (storedUsername) {
                setUsername(storedUsername); // Set the username state
            }
            
            if (storedDonorId) {
                setDonorId(parseInt(storedDonorId));
            } else {
                setError('Donor information not found. Please login again.');
                Alert.alert('Error', 'Donor information not found. Please login again.');
            }
        } catch (error) {
            console.error('Failed to load donor info:', error);
            setError('Failed to load donor information.');
            Alert.alert('Error', 'Failed to load donor information.');
        }
    };

    const fetchDonations = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            console.log('[DonorList] Starting donations fetch. donorId=', donorId, ' token?', !!token);
            
            const response = await axios.get(`https://apiv2.medleb.org/donation/byDonor/${donorId}`, { headers });
            console.log('[DonorList] donations GET status:', response.status, ' url:', response.config?.url);
            const allDonations = response.data;
            console.log('[DonorList] donations received count:', Array.isArray(allDonations) ? allDonations.length : 'not array');
            
            // Filter donations to only show those with agreed agreements
            const donationsWithAgreements = [];
            
            try {
                // Check agreements for this donor
                const agreementResponse = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Donor/${donorId}`, { headers });
                console.log('[DonorList] agreements GET status:', agreementResponse.status, ' url:', agreementResponse.config?.url);
                if (agreementResponse.data && Array.isArray(agreementResponse.data.data)) {
                    const agreements = agreementResponse.data.data;
                    console.log('[DonorList] agreements count:', agreements.length);
                    
                    for (const donation of allDonations) {
                        const hasAgreedAgreement = agreements.some(agreement => 
                            agreement.RecipientId === donation.RecipientId && agreement.Agreed_Upon === 'agreed'
                        );
                        
                        if (hasAgreedAgreement) {
                            donationsWithAgreements.push(donation);
                        }
                    }
                }
            } catch (agreementError) {
                // Handle authentication errors specifically
                if (agreementError.response?.status === 401) {
                    Alert.alert(
                        "Authentication Error", 
                        "Your session has expired. Please sign in again.",
                        [
                            { 
                                text: "Sign In", 
                                onPress: () => {
                                    AsyncStorage.clear()
                                    navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'SignIn' }],
                                    })
                                }
                            }
                        ]
                    )
                    return
                }
                // Handle 404 error (no agreements found) as normal case
                else if (agreementError.response && agreementError.response.status === 404) {
                    console.log('[DonorList] No agreements found for this donor - showing no donations');
                } else {
                    console.error('[DonorList] Error checking agreements:', {
                        message: agreementError.message,
                        status: agreementError.response?.status,
                        url: agreementError.config?.url,
                        data: agreementError.response?.data,
                    });
                }
                // If we can't check agreements or no agreements exist, show no donations
            }
            
            console.log('[DonorList] donations after filter by agreed agreements:', donationsWithAgreements.length);
            setAllDonations(donationsWithAgreements);
            // Apply current filters immediately
            const filtered = applyFilters(donationsWithAgreements, { fromDate, toDate, status });
            setDonations(filtered);

            // Prefetch non-empty box counts for these donations
            try {
                await prefetchNonEmptyBoxCounts(filtered);
            } catch (e) {
                console.warn('[DonorList] prefetchNonEmptyBoxCounts failed:', e?.message);
            }
        } catch (error) {
            const errInfo = {
                message: error.message,
                status: error.response?.status,
                url: error.config?.url,
                method: error.config?.method,
                data: error.response?.data,
            };
            console.error('[DonorList] Error fetching donations:', errInfo);
            
            // Handle authentication errors specifically
            if (error.response?.status === 401) {
                Alert.alert(
                    "Authentication Error", 
                    "Your session has expired. Please sign in again.",
                    [
                        { 
                            text: "Sign In", 
                            onPress: () => {
                                AsyncStorage.clear()
                                navigation.reset({
                                    index: 0,
                                    routes: [{ name: 'SignIn' }],
                                })
                            }
                        }
                    ]
                )
                return
            }
            
            setError(`Failed to load donations${errInfo.status ? ` (HTTP ${errInfo.status})` : ''}.`);
            Alert.alert("Error", "Failed to load donations.");
        }
        setLoading(false);
    };

    const prefetchNonEmptyBoxCounts = async (donationsList = []) => {
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const ids = Array.from(new Set((donationsList || []).map(d => d?.DonationId).filter(Boolean)));
        if (ids.length === 0) return;
        const results = await Promise.allSettled(
            ids.map(id => axios.get(`https://apiv2.medleb.org/boxes/byDonation/${id}`, { headers }))
        );
        const map = {};
        results.forEach((res, idx) => {
            const id = ids[idx];
            if (res.status === 'fulfilled') {
                const boxes = Array.isArray(res.value?.data) ? res.value.data : [];
                map[id] = boxes.filter(b => (b?.NumberOfPacks || 0) > 0).length;
            }
        });
        if (Object.keys(map).length) {
            setNonEmptyBoxCounts(prev => ({ ...prev, ...map }));
        }
    };

    const getComputedBoxCount = (donation) => {
        const id = donation?.DonationId;
        if (id && nonEmptyBoxCounts[id] != null) return nonEmptyBoxCounts[id];
        return donation?.NumberOfBoxes ?? 0;
    };

    const parseDateSafe = (value) => {
        if (!value) return null;
        try {
            const d = new Date(value);
            return isNaN(d.getTime()) ? null : d;
        } catch {
            return null;
        }
    };

    const applyFilters = (data, { fromDate, toDate, status }) => {
        let out = Array.isArray(data) ? [...data] : [];
        // Status filter
        const st = (status || 'All').toLowerCase();
        if (st !== 'all') {
            out = out.filter(d => (d?.status || '').toLowerCase() === st);
        }
        // Date range filter on DonationDate
        const start = fromDate ? new Date(new Date(fromDate).setHours(0, 0, 0, 0)) : null;
        const end = toDate ? new Date(new Date(toDate).setHours(23, 59, 59, 999)) : null;
        if (start || end) {
            out = out.filter(d => {
                const dd = parseDateSafe(d?.DonationDate);
                if (!dd) return false; // exclude items without a valid date when filtering by date
                if (start && dd < start) return false;
                if (end && dd > end) return false;
                return true;
            });
        }
        console.log('[DonorList] applyFilters -> input:', data?.length || 0, ' output:', out.length, ' status:', status, ' from:', fromDate, ' to:', toDate);
        return out;
    };

    const onSearch = () => {
        // Validate date range
        if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
            Alert.alert('Invalid range', 'From date cannot be after To date.');
            return;
        }
        const filtered = applyFilters(allDonations, { fromDate, toDate, status });
        setDonations(filtered);
        setShowStatusPicker(false);
    };

    const handlePressDonation = (donation) => {
        navigation.navigate('DonationDetails', { donation });
    };

    const exportToExcel = async () => {
        setLoading(true);
        try {
            const formattedData = donations.flatMap(item =>
                item.BatchLotTrackings.map(batchLot => [
                    item.DonationId || 'N/A',
                    item.DonorName || 'N/A',
                    item.RecipientName || 'N/A',
                    batchLot.DrugName || 'N/A',
                    batchLot.GTIN || 'N/A',
                    batchLot.BatchNumber || 'N/A',
                    batchLot.SerialNumber || 'N/A',
                    batchLot.ExpiryDate || 'N/A',
                    batchLot.Form || 'N/A',
                    batchLot.Presentation || 'N/A',
                    batchLot.Laboratory || 'N/A',
                    batchLot.LaboratoryCountry || 'N/A',
                ])
            ).filter(row => !row.includes('N/A'));

            const ws = XLSX.utils.aoa_to_sheet([[
                'Donation Code', 'Donor Name', 'Recipient Name', 'Drug Name', 'GTIN', 'LOT', 'Serial Number', 'Expiry Date', 'Form', 'Presentation', 'Owner', 'Country'
            ], ...formattedData]);

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Donations");

            const wbout = XLSX.write(wb, { type: 'base64', bookType: "xlsx" });
            const uri = FileSystem.documentDirectory + 'donations.xlsx';

            await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert("Success", "Excel file has been saved to your device's storage.");
            }
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            Alert.alert("Error", "Failed to export to Excel. Please try again.");
        }
        setLoading(false);
    };

    return (
        <View style={styles.fullContainer}>
            <StatusBar backgroundColor="#f9f9f9" barStyle="dark-content" />
    
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                    {/* First Row: Date Filters */}
                    <View style={styles.dateRangeContainer}>
                        <TouchableOpacity style={styles.dateContainer} onPress={() => setShowFromDatePicker(true)}>
                            <Text style={styles.dateText}>From</Text>
                            <Text style={styles.dateValue}>{fromDate ? new Date(fromDate).toISOString().split('T')[0] : '01/01/24'}</Text>
                        </TouchableOpacity>
                        <View style={styles.dateIcon}>
                            <Image source={require('./assets/calendar.png')} style={styles.calendarIcon} />
                        </View>
                        <TouchableOpacity style={styles.dateContainer} onPress={() => setShowToDatePicker(true)}>
                            <Text style={styles.dateText}>To</Text>
                            <Text style={styles.dateValue}>{toDate ? new Date(toDate).toISOString().split('T')[0] : '01/08/24'}</Text>
                        </TouchableOpacity>
                    </View>
                    {showFromDatePicker && (
                        <DateTimePicker
                            value={fromDate ? new Date(fromDate) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowFromDatePicker(false);
                                if (event.type !== 'dismissed') setFromDate(selectedDate);
                            }}
                        />
                    )}
                    {showToDatePicker && (
                        <DateTimePicker
                            value={toDate ? new Date(toDate) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowToDatePicker(false);
                                if (event.type !== 'dismissed') setToDate(selectedDate);
                            }}
                        />
                    )}

                    {/* Second Row: Status + Search (inline) */}
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
                                        {['All', 'Pending', 'Approved', 'Inspected', 'refused'].map((s) => (
                                            <TouchableOpacity key={s} onPress={() => { setStatus(s); setShowStatusPicker(false); }}>
                                                <Text style={styles.dropdownText}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>
                        <View style={styles.filterColumnInline}>
                            <Text style={styles.filterLabel}>Search</Text>
                            <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
                                <Image source={require('./assets/search.png')} style={[styles.searchIcon, styles.searchIconInline]} resizeMode="stretch" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Separator with inline sort toggle (shared) */}
                    <View style={styles.separatorRow}>
                        <Image source={require('./assets/separator-green.png')} style={styles.separatorFlex} />
                        <SortToggle sortAsc={sortAsc} onToggle={() => setSortAsc(!sortAsc)} />
                    </View>
                    <Text style={styles.resultCount}>number of result(s): {donations.length}</Text>

                    {/* Error or Empty Notices */}
                    {error && (
                        <View style={styles.stateContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}
                    {(() => {
                        const filtered = donations.filter(d => (getComputedBoxCount(d) ?? 0) > 0 || ((d?.BatchLotTrackings ?? []).length > 0));
                        const toRenderBase = filtered.length > 0 ? filtered : donations;
                        const parse = (d) => (d ? Date.parse(d) : 0);
                        const getDate = (obj) => parse(obj?.DonationDate) || parse(obj?.CreatedDate) || 0;
                        const toRender = [...toRenderBase].sort((a,b)=>{
                            const ad = getDate(a); const bd = getDate(b);
                            return sortAsc ? (ad - bd) : (bd - ad);
                        });
                        if (!error && donations.length === 0) {
                            return (
                                <View style={styles.stateContainer}>
                                    <Text style={styles.emptyText}>No donations to display.</Text>
                                </View>
                            );
                        }
                        if (!error && donations.length > 0 && filtered.length === 0) {
                            return (
                                <View style={styles.stateContainer}>
                                    <Text style={styles.emptyText}>Donations found but no boxes/packs yet. Displaying all.</Text>
                                </View>
                            );
                        }
                        return (
                            <ScrollView>
                                {toRender.map((donation, index) => (
                                    <View key={index} style={styles.card}>
                                        <TouchableOpacity onPress={() => handlePressDonation(donation)}>
                                            <View style={styles.cardHeader}>
                                                <Text style={[styles.statusText, { color: getStatusColor(donation?.status) }]}>
                                                    {donation?.status || 'N/A'}
                                                </Text>
                                            </View>

                                            <View style={styles.cardContent}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                                    {/* Left Column */}
                                                    <View style={{ flex: 1, marginRight: 10, marginLeft: 10 }}>
                                                        <Text style={[styles.cardTitle]}>Donation Title</Text>
                                                        <Text style={[styles.cardText]}>{donation.DonationTitle || 'Untitled'}</Text>
                                                        <Text style={[styles.cardTitle]}>To</Text>
                                                        <Text style={[styles.cardText]}>{donation.RecipientName || 'N/A'}</Text>
                                                    </View>

                                                    {/* Right Column */}
                                                    <View style={{ flex: 1, marginLeft: 10, paddingBottom: 20 }}>
                                                        <Text style={[styles.cardTitle]}>Date</Text>
                                                        <Text style={[styles.cardText]}>{donation.DonationDate || 'N/A'}</Text>
                                                        <Text style={[styles.cardTitle]}>Boxes/Packs</Text>
                                                        <Text style={[styles.cardText]}>{getComputedBoxCount(donation)}/{(donation.BatchLotTrackings ?? []).length}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        );
                    })()}
                </ScrollView>
            )}
    
            {/* Bottom Navigation Bar */}
            <BottomNavBar style={{ marginTop: 25 }} />
        </View>
    );
    
};

const getStatusColor = (status) => {
    if (!status) return '#121212';
    switch (String(status).toLowerCase()) {
        case 'pending':
            return '#DB7B2B';
        case 'approved':
            return '#00A651';
        case 'inspect':
            return '#B00020';
        default:
            return '#121212';
    }
};

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingTop:10,
        
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
    filterContainer: {
        paddingHorizontal: 30,
        marginTop: 10,
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
        backgroundColor: '#f9f9f9',
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
    },
    statusFilterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    filterColumn: {
        flex: 0,
        marginHorizontal: 5,
    },
    filterColumnInline: {
        flex: 1,
        marginHorizontal: 5,
    },
    filterLabel: {
        fontSize: 12,
        fontFamily: 'RobotoCondensed-Regular',
        color: '#707070',
        textAlign: 'center',
        marginBottom: 4,
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
    filterText: {
        color: '#00A651',
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
        textAlign: 'center',
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
    searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    height: 39,
    width: '110%',
    borderWidth: 1,
    borderColor: '#00A651',
    backgroundColor: '#f9f9f9',
    },
searchIcon: {
        width: 320,
        height: 39,
        borderRadius: 50,
    },
    searchIconInline: {
        width: '100%',
    },
    separator: {
        alignSelf: 'center',
        marginTop: 6,
        marginBottom: 2,
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
    scrollViewContainer: {
        paddingBottom: 20,
    },
    resultCount: {
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 10,
        color: '#121212',
        fontFamily: 'RobotoCondensed-Regular',
    },
    stateContainer: {
        paddingHorizontal: 20,
        marginTop: 20,
        alignItems: 'center',
    },
    errorText: {
        color: '#B00020',
        fontFamily: 'RobotoCondensed-Bold',
        fontSize: 14,
        textAlign: 'center',
    },
    emptyText: {
        color: '#666',
        fontFamily: 'RobotoCondensed-Regular',
        fontSize: 14,
        textAlign: 'center',
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
    backButton: {
        marginLeft: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#000',
        fontFamily: 'RobotoCondensed-Bold',    },
    backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
        
      },
      detailValue: {
        fontSize: 14,
        color: '#000', 
        fontFamily: 'RobotoCondensed-Bold',      },
});

export default DonorList;
