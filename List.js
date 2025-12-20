import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, StatusBar } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SortToggle from './SortToggle';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarInspection from './BottomNavBarInspection'; // Admin/Inspector nav
import BottomNavBarRecipient from './BottomNavBarRecipient'; // Recipient nav
import BottomNavBar from './BottomNavBar'; // Donor nav
import * as Font from 'expo-font';

const List = () => {
    const [donations, setDonations] = useState([]);
    const [importations, setImportations] = useState([]);
    const [nonEmptyBoxCounts, setNonEmptyBoxCounts] = useState({}); // DonationId -> count of boxes with packs
    const [boxCountsReady, setBoxCountsReady] = useState(false);
    const [donors, setDonors] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [selectedType, setSelectedType] = useState('Donations'); // New: Donations or Importations
    const [donorId, setDonorId] = useState('');
    const [recipientId, setRecipientId] = useState('');
    const [status, setStatus] = useState('All');
    // Removed date filtering per requirement
    const [showDonorPicker, setShowDonorPicker] = useState(false);
    const [showRecipientPicker, setShowRecipientPicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [username, setUsername] = useState('');
    // Default to newest first (descending)
    const [sortAsc, setSortAsc] = useState(false);
    const [userRole, setUserRole] = useState('');
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
        fetchDonors();
        fetchRecipients();
        getUsername();
        (async () => {
            try { const role = await AsyncStorage.getItem('userRole'); if (role) setUserRole(role); } catch {}
        })();
    }, []);

    // If a recipient lands on this screen, send them to RecipientList which uses the proper endpoint and UI
    useEffect(() => {
        if (userRole === 'Recipient') {
            // Navigate after mount to avoid updating during render
            try { navigation.replace('RecipientList'); } catch (_) { /* noop */ }
        }
    }, [userRole]);

    useEffect(() => {
        
        navigation.setOptions({
            headerTitle: 'List',

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

    // Auto-fetch on mount and whenever filters change (for non-recipient roles)
    useEffect(() => {
        if (!userRole || userRole === 'Recipient') return;
        const id = setTimeout(() => {
            fetchData();
        }, 150);
        return () => clearTimeout(id);
    }, [userRole, selectedType, donorId, recipientId, status]);


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

    const fetchData = async () => {
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        if (selectedType === 'Donations') {
            setDonations([]);
            try {
                const response = await axios.get('https://apiv2.medleb.org/donation/filtered', {
                    headers,
                    params: {
                        donorId,
                        recipientId,
                        status: status === 'All' ? '' : status,
                        // Date filters removed
                    },
                });

                if (Array.isArray(response.data)) {
                    setDonations(response.data);
                    // Prefetch non-empty box counts for display
                    try {
                        setBoxCountsReady(false);
                        await prefetchNonEmptyBoxCounts(response.data);
                    } catch (e) {
                        console.warn('[List] prefetchNonEmptyBoxCounts failed:', e?.message);
                    } finally {
                        setBoxCountsReady(true);
                    }
                } else {
                    console.error('Unexpected response format:', response.data);
                    setDonations([]);
                }
            } catch (error) {
                console.error('Error fetching donations:', error);
                if (error.response?.status === 403) {
                    // If the user is a Recipient, they don't have access to this endpoint
                    if (userRole === 'Recipient') {
                        try {
                            alert("You don't have permission to view this list. Redirecting to your donations.");
                        } catch {}
                        try { navigation.replace('RecipientList'); } catch {}
                    }
                }
                setDonations([]);
            }
        } else {
            setImportations([]);
            try {
                const response = await axios.get('https://apiv2.medleb.org/importation/filtered', {
                    headers,
                    params: {
                        status: status === 'All' ? '' : status,
                        // Date filters removed
                    },
                });

                if (Array.isArray(response.data)) {
                    setImportations(response.data);
                } else {
                    console.error('Unexpected response format:', response.data);
                    setImportations([]);
                }
            } catch (error) {
                console.error('Error fetching importations:', error);
                setImportations([]);
            }
        }
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
                // Backend now returns only non-empty boxes with correct pack counts
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
                        

    const fetchDonors = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get('https://apiv2.medleb.org/donor/all', { headers });
            setDonors(response.data);
        } catch (error) {
            console.error('Error fetching donors:', error);
        }
    };

    const fetchRecipients = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get('https://apiv2.medleb.org/recipient/all', { headers });
            setRecipients(response.data);
        } catch (error) {
            console.error('Error fetching recipients:', error);
        }
    };

    // Date pickers removed

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
            <StatusBar backgroundColor="#f9f9f9" barStyle="dark-content"/>

            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Type Selection */}
                <TouchableOpacity style={styles.typeButton} onPress={() => setSelectedType(selectedType === 'Donations' ? 'Importations' : 'Donations')}>
                    <Text style={styles.typeButtonText}>{selectedType}</Text>
                </TouchableOpacity>
                {/* Date filters removed */}
           

                {/* Second Row: Donor & Recipient (for Donations) */}
                <View style={styles.filterRow}>
                    {/* Donor - Only show for Donations */}
                    {selectedType === 'Donations' && (
                        <View style={styles.filterColumn}>
                            <Text style={styles.filterLabel}>Donor</Text>
                            <TouchableOpacity onPress={() => setShowDonorPicker(!showDonorPicker)} style={styles.filterButton}>
                                <Text style={styles.filterText}>
                                    {donors.find(d => d.DonorId === donorId)?.DonorName || 'All'}
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
                    )}

                    {/* Recipient - Only show for Donations */}
                    {selectedType === 'Donations' && (
                        <View style={styles.filterColumn}>
                            <Text style={styles.filterLabel}>Recipient</Text>
                            <TouchableOpacity onPress={() => setShowRecipientPicker(!showRecipientPicker)} style={styles.filterButton}>
                                <Text style={styles.filterText}>
                                    {recipients.find(r => r.RecipientId === recipientId)?.RecipientName || 'All'}
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
                    )}

                </View>

                {/* Third Row: Status + Search (inline, like DonorAgreements) */}
                <View style={styles.filterRow}>
                    <View style={styles.filterColumnInline}>
                        <Text style={styles.filterLabel}>Status</Text>
                        <TouchableOpacity onPress={() => setShowStatusPicker(!showStatusPicker)} style={styles.filterButton}>
                            <View style={styles.pickerContent}>
                                <Text style={styles.filterText} numberOfLines={1} ellipsizeMode='tail'>{status}</Text>
                                <MaterialCommunityIcons name={showStatusPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#000000ff" />
                            </View>
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
                    <View style={styles.filterColumnInline}>
                        <Text style={styles.filterLabel}>Refresh</Text>
                        <TouchableOpacity style={styles.searchButton} onPress={fetchData}>
                            <Image source={require('./assets/search.png')} style={[styles.searchIcon, styles.searchIconInline]} />
                        </TouchableOpacity>
                    </View>
                </View>


                {/* Separator with inline sort toggle (shared) */}
                <View style={styles.separatorRow}>
                    <Image source={require('./assets/separator-green.png')} style={styles.separatorFlex} />
                    <SortToggle sortAsc={sortAsc} onToggle={() => setSortAsc(!sortAsc)} />
                </View>
                {selectedType === 'Donations' ? (
                    <Text style={styles.resultCount}>
                        Number of result(s): {boxCountsReady ? donations.length : '...'}
                    </Text>
                ) : (
                    <Text style={styles.resultCount}>
                        Number of result(s): {importations.filter(i => (i?.NumberOfBoxes || 0) > 0).length}
                    </Text>
                )}

                {/* Data List */}
                {!boxCountsReady && selectedType === 'Donations' ? (
                    <View style={styles.stateContainer}>
                        <Text style={styles.emptyText}>Loading box counts...</Text>
                    </View>
                ) : (
                    <ScrollView>
                        {selectedType === 'Donations' ? (
                            [...donations]
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
                                        <Text style={[styles.statusText, { color: getStatusColor(donation.status) }]}>{donation.status}</Text>
                                    </View>
                                    
                                    <View style={styles.cardContent}>
                                        {/* Two columns: left for Donation Title and Date, right for From, To, and Number of boxes */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            
                                            {/* Left column */}
                                            <View style={{ flex: 1, marginRight: 10, marginLeft: 10,}}>
                                                <Text style={[styles.cardTitle, ]}>Donation Title</Text>
                                                <Text style={[styles.cardText, ]}>{donation.DonationTitle}</Text>
                                                <Text style={[styles.cardTitle, ]}>Date</Text>
                                                <Text style={styles.cardText}>{donation.DonationDate}</Text>
                                            </View>
                                
                                            {/* Right column */}
                                            <View style={{ flex: 1, marginLeft: 10, paddingBottom:20, }}>
                                                <Text style={[styles.cardTitle, ]}>From</Text>
                                                <Text style={[styles.cardText, ]}>{donation.DonorName}</Text>
                                                <Text style={[styles.cardTitle, ]}>To</Text>
                                                <Text style={[styles.cardText, ]}>{donation.RecipientName}</Text>
                                                <Text style={[styles.cardTitle,]}>nb of box(es)</Text>
                                                <Text style={styles.cardText}>{getComputedBoxCount(donation) ?? 0}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            [...importations]
                            .filter(i => (i?.NumberOfBoxes || 0) > 0)
                            .sort((a,b)=>{
                                const parse=(d)=> (d? Date.parse(d):0);
                                const ad=parse(a?.ImportationDate)||parse(a?.CreatedDate)||0;
                                const bd=parse(b?.ImportationDate)||parse(b?.CreatedDate)||0;
                                return sortAsc? (ad-bd):(bd-ad);
                            }).map((importation, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.card} 
                                    onPress={() => navigation.navigate('ImportationDetails', { importation })}
                                >
                                    <View style={styles.cardHeader}>
                                        <Text style={[styles.statusText, { color: getStatusColor(importation.status) }]}>{importation.status}</Text>
                                    </View>
                                    
                                    <View style={styles.cardContent}>
                                        {/* Two columns: left for Importation Title and Date, right for Company and Number of boxes */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            
                                            {/* Left column */}
                                            <View style={{ flex: 1, marginRight: 10, marginLeft: 10,}}>
                                                <Text style={[styles.cardTitle, ]}>Importation Title</Text>
                                                <Text style={[styles.cardText, ]}>{importation.ImportationTitle || 'N/A'}</Text>
                                                <Text style={[styles.cardTitle, ]}>Date</Text>
                                                <Text style={styles.cardText}>{importation.ImportationDate || importation.CreatedDate}</Text>
                                            </View>
                                
                                            {/* Right column */}
                                            <View style={{ flex: 1, marginLeft: 10, paddingBottom:20, }}>
                                                <Text style={[styles.cardTitle, ]}>Company</Text>
                                                <Text style={[styles.cardText, ]}>{importation.CompanyName || 'N/A'}</Text>
                                                <Text style={[styles.cardTitle, ]}>Country</Text>
                                                <Text style={[styles.cardText, ]}>{importation.CountryName || 'N/A'}</Text>
                                                <Text style={[styles.cardTitle,]}>nb of box(es)</Text>
                                                <Text style={styles.cardText}>{importation.NumberOfBoxes || 0}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                )}
            </ScrollView>

            {/* Bottom Navigation Bar by role */}
            {userRole === 'Donor' ? (
                <BottomNavBar />
            ) : userRole === 'Recipient' ? (
                <BottomNavBarRecipient />
            ) : (
                <BottomNavBarInspection currentScreen="List" />
            )}
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
    // Date UI removed
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
    typeButton: {
        backgroundColor: '#00A651',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 15,
        alignSelf: 'center',
    },
    typeButtonText: {
        fontSize: 16,
        color: '#f9f9f9',
        fontFamily: 'RobotoCondensed-Bold',
        textAlign: 'center',
    },
    pickerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 10,
    },
});

export default List;
