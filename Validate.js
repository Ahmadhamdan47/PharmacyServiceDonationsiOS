import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, BackHandler, TextInput, Modal } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Font from 'expo-font';

const Validate = () => {
    const [donors, setDonors] = useState([]);
    const [filteredDonors, setFilteredDonors] = useState([]);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [status, setStatus] = useState('All');
    const [selectedDonor, setSelectedDonor] = useState('All');
    const [donorSearch, setDonorSearch] = useState('');
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showDonorPicker, setShowDonorPicker] = useState(false);
    const [username, setUsername] = useState('');
    const [sortAsc, setSortAsc] = useState(false); // false = newest first
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const scrollViewRef = useRef(null);
    const navigation = useNavigation();
    const [isFontLoaded, setIsFontLoaded] = useState(false);
        // Helper: get a precise timestamp for a donor (prefer created_at if present, then CreatedDate)
        const getTime = (obj) => {
            const tCreatedAt = obj?.created_at ? Date.parse(obj.created_at) : NaN;
            const tCreatedDate = obj?.CreatedDate ? Date.parse(obj.CreatedDate) : NaN;
            return Number.isFinite(tCreatedAt)
                ? tCreatedAt
                : Number.isFinite(tCreatedDate)
                ? tCreatedDate
                : 0;
        };

        // Helper: get a numeric id for tie-breaking (higher id assumed newer)
        const getId = (obj) => {
            const idCandidate = obj?.DonorId ?? obj?.id ?? obj?.ID;
            if (typeof idCandidate === 'number') return idCandidate;
            const parsed = parseInt(idCandidate, 10);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        // Comparator with tie-breakers: by time, then id, then name (stable)
        const compareByTime = (a, b, asc = false) => {
            const ta = getTime(a);
            const tb = getTime(b);
            if (ta !== tb) return asc ? ta - tb : tb - ta;
            const ia = getId(a);
            const ib = getId(b);
            if (ia !== ib) return asc ? ia - ib : ib - ia;
            const na = (a?.DonorName || '').toLowerCase();
            const nb = (b?.DonorName || '').toLowerCase();
            if (na < nb) return -1;
            if (na > nb) return 1;
            return 0;
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
      fetchFonts(); // Load fonts on component mount
    }, []);
  
    useEffect(() => {
        fetchDonors();
        getUsername();
    }, []);

    // Auto-apply filters whenever inputs change
    useEffect(() => {
        filterDonors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, selectedDonor, fromDate, toDate, donors]);

    // Refresh donor list when screen comes into focus (e.g., returning from DonorDetails)
    useFocusEffect(
        React.useCallback(() => {
            fetchDonors();
        }, [])
    );

    useEffect(() => {
        const backAction = () => {
            // Close donor modal first if open
            if (showDonorPicker) {
                setShowDonorPicker(false);
                return true;
            }
            navigation.navigate('Landing'); // Navigate to "Landing" when back button is pressed
            return true; // Prevent default back button behavior
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => {
            backHandler.remove(); // Clean up the listener when the component is unmounted
        };
    }, [navigation, showDonorPicker]);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Validate',
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
    
    }, [navigation]);

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

    const fetchDonors = async () => {
        try {
            const response = await axios.get('https://apiv2.medleb.org/donor/all');
            // Sort newest -> oldest using precise timestamp with tie-breakers
            const sorted = [...(response.data || [])].sort((a, b) => compareByTime(a, b, false));
            setDonors(sorted);
            setFilteredDonors(sorted); // Initialize with all donors (newest first)
        } catch (error) {
            console.error('Error fetching donors:', error);
        }
    };

    const filterDonors = () => {
        let filtered = donors;

        if (status !== 'All') {
            // Map UI labels to IsActive values: Validated -> true, Not validated -> false, Pending -> null/undefined
            filtered = filtered.filter(donor => {
                if (status === 'Validated') {
                    return donor.IsActive === true;
                } else if (status === 'Not validated') {
                    return donor.IsActive === false;
                } else if (status === 'Pending') {
                    return donor.IsActive === null || donor.IsActive === undefined;
                }
                return true;
            });
        }

        if (selectedDonor !== 'All') {
            filtered = filtered.filter(donor => donor.DonorName === selectedDonor);
        }

        if (fromDate) {
            const fromMs = fromDate.getTime();
            filtered = filtered.filter(donor => getTime(donor) >= fromMs);
        }

        if (toDate) {
            const toMs = toDate.getTime();
            filtered = filtered.filter(donor => getTime(donor) <= toMs);
        }

        // Always keep newest -> oldest after filtering (stable with tie-breakers)
        filtered = [...filtered].sort((a, b) => compareByTime(a, b, false));

        setFilteredDonors(filtered);
        setCurrentPage(1);
    };

    const getPaginatedDonors = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const sorted = [...filteredDonors].sort((a, b) => compareByTime(a, b, sortAsc));
        return sorted.slice(startIndex, endIndex);
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

    const getStatusText = (isActive) => {
        if (isActive === true) {
            return 'Validated';
        } else if (isActive === false) {
            return 'Not validated';
        } else {
            return 'Pending';
        }
    };

    const handleDonorClick = (donor) => {
        navigation.navigate('DonorDetails', { donor });
    };

    return (
        <View style={styles.container}>
            <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Filters */}
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


                {/* Auto filtering enabled; manual search button removed */}


                <View style={styles.filterRow}>
                    {/* Account Picker Column */}
                    <View style={styles.filterColumn}>
                        <Text style={styles.filterLabel}>Account</Text>
                        <TouchableOpacity onPress={() => setShowDonorPicker(true)} style={styles.filterButton}>
                            <View style={styles.pickerContent}>
                                <Text
                                    style={[
                                        styles.filterText,
                                        selectedDonor === 'All' && styles.placeholderBoldGreen,
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {selectedDonor === 'All' ? 'Search for account' : selectedDonor}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Status Dropdown Column */}
                    <View style={styles.filterColumn}>
                        <Text style={styles.filterLabel}>Status</Text>
                        <TouchableOpacity onPress={() => setShowStatusPicker(!showStatusPicker)} style={styles.filterButton}>
                            <View style={styles.pickerContent}>
                                <Text style={[styles.filterText, styles.filterTextBoldGreen]}>{status}</Text>
                                <MaterialCommunityIcons name={showStatusPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#000000ff" />
                            </View>
                        </TouchableOpacity>
                        {showStatusPicker && (
                            <View style={styles.dropdown}>
                                <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                    {['All', 'Validated', 'Not validated', 'Pending'].map(s => (
                                        <TouchableOpacity key={s} onPress={() => { setStatus(s); setShowStatusPicker(false); }}>
                                            <Text style={styles.dropdownText}>{s}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                </View>

                {/* Separator with inline sort toggle */}
                <View style={styles.separatorRow}>
                    <Image source={require('./assets/separator-green.png')} style={styles.separatorFlex} />
                    <TouchableOpacity 
                        onPress={() => setSortAsc(!sortAsc)} 
                        style={styles.sortToggleButton}
                    >
                        <MaterialCommunityIcons
                            name={sortAsc ? 'sort-calendar-descending' : 'sort-calendar-ascending'}
                            size={18}
                            color={sortAsc ? '#FF8C00' : '#00A651'}
                        />
                        <Text style={[styles.sortToggleText, { color: sortAsc ? '#FF8C00' : '#00A651' }]}>
                            {sortAsc ? 'Oldest' : 'Newest'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Donor Modal Picker */}
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={showDonorPicker}
                    onRequestClose={() => setShowDonorPicker(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Select Account</Text>
                                <TouchableOpacity onPress={() => setShowDonorPicker(false)} style={styles.closeButton}>
                                    <MaterialCommunityIcons name="close" size={22} color="#121212" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.searchInputWrapper}>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search for account"
                                    placeholderTextColor="#A9A9A9"
                                    value={donorSearch}
                                    onChangeText={setDonorSearch}
                                    autoFocus
                                />
                            </View>
                            <ScrollView style={styles.modalList}>
                                {['All', ...Array.from(new Set((donors || []).map(d => d.DonorName)))]
                                    .filter(name => !donorSearch || name.toLowerCase().includes(donorSearch.toLowerCase()))
                                    .map((donorName, idx) => (
                                        <TouchableOpacity key={`${donorName}-${idx}`} style={styles.modalItem} onPress={() => { setSelectedDonor(donorName); setShowDonorPicker(false); setDonorSearch(''); }}>
                                            <Text style={styles.modalItemText}>{donorName}</Text>
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>

                {/* Filter Button moved above under calendar */}

                {/* Results Count */}
                <Text style={styles.resultCount}>Number of result(s): {filteredDonors.length}</Text>

                {/* Display Donors */}
                <ScrollView>
    {getPaginatedDonors().map((donor, index) => (
        <TouchableOpacity 
            key={index} 
            style={styles.card} 
            onPress={() => handleDonorClick(donor)}
        >
            {/* Status text */}
            <Text 
                style={[styles.statusText, { 
                    color: getStatusText(donor.IsActive) === 'Validated' ? 'green' : 
                            getStatusText(donor.IsActive) === 'Not validated' ? 'red' : 'orange' 
                }]}
            >
                {getStatusText(donor.IsActive)}
            </Text>
            
            {/* Card content divided into two columns */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                
                {/* Left column: Donor and Date */}
                <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.cardLabel}>Donor</Text>
                    <Text style={[styles.cardText, { marginBottom: 15 }]}>{donor.DonorName}</Text>
                    
                    <Text style={styles.cardLabel}>Date</Text>
                    <Text style={styles.cardText}>{donor.CreatedDate}</Text>
                </View>

                {/* Right column: Country and Donor Type */}
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardLabel}>Country</Text>
                    <Text style={[styles.cardText, { marginBottom: 15 }]}>{donor.DonorCountry}</Text>
                    
                    <Text style={styles.cardLabel}>Donor Type</Text>
                    <Text style={styles.cardText}>{donor.DonorType}</Text>
                </View>
            </View>
        </TouchableOpacity>
    ))}
</ScrollView>


                {/* Pagination Controls */}
                <View style={styles.paginationContainer}>
                    <TouchableOpacity
                        disabled={currentPage === 1}
                        onPress={() => setCurrentPage(currentPage - 1)}
                    >
                        <Text style={[styles.paginationText, currentPage === 1 && styles.disabledText]}>Previous</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationText}>{currentPage}</Text>
                    <TouchableOpacity
                        disabled={currentPage * itemsPerPage >= filteredDonors.length}
                        onPress={() => setCurrentPage(currentPage + 1)}
                    >
                        <Text style={[styles.paginationText, currentPage * itemsPerPage >= filteredDonors.length && styles.disabledText]}>Next</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 20,
        fontFamily: 'RobotoCondensed-Bold',
                marginRight: 25,
    },
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        padding: 20,
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
        borderColor: '#00A651',
        borderWidth: 1,
        borderRadius: 20,
            paddingVertical: 10,
        paddingHorizontal: 10,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
    },
    filterText: {
        fontSize: 14,
        color: '#121212',
        fontFamily: 'RobotoCondensed-Regular',
    },
    placeholderBoldGreen: {
        color: '#00A651',
        fontFamily: 'RobotoCondensed-Bold',
    },
    filterTextBoldGreen: {
        color: '#00A651',
        fontFamily: 'RobotoCondensed-Bold',
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
        maxHeight: 260,
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
    separatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    separatorFlex: {
        flex: 1,
        resizeMode: 'contain',
    },
    sortToggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginLeft: 8,
    },
    sortToggleText: {
        fontSize: 12,
        fontFamily: 'RobotoCondensed-Medium',
        marginLeft: 4,
    },
    searchInputWrapper: {
        paddingHorizontal: 10,
        paddingBottom: 6,
    },
    searchInput: {
        height: 36,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        fontFamily: 'RobotoCondensed-Regular',
        color: '#121212',
    },
    pickerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingHorizontal: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#f9f9f9',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
        color: '#121212',
    },
    closeButton: {
        padding: 6,
        borderRadius: 16,
    },
    modalList: {
        maxHeight: 400,
        paddingHorizontal: 10,
    },
    modalItem: {
        paddingVertical: 12,
        borderBottomColor: '#e8e8e8',
        borderBottomWidth: 1,
    },
    modalItemText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Regular',
        color: '#121212',
        textAlign: 'center',
    },
    resultCount: {
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 10,
        color: '#121212',
        fontFamily: 'RobotoCondensed-Regular',
    },
    card: {
        backgroundColor: '#f9f9f9',
        borderRadius: 25,
        padding: 15,
        marginVertical: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        borderColor: 'green',
        borderWidth: 1,
    },
    statusText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
                marginBottom: 5,
    },
    cardText: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'RobotoCondensed-Medium',
    },
    cardLabel: {
        fontFamily: 'RobotoCondensed-Bold',   
     },
    boldText: {
        fontFamily: 'RobotoCondensed-Bold',
        },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
    },
    paginationText: {
        fontSize: 16,
        color: '#00A651',
        fontFamily: 'RobotoCondensed-Bold', 
       },
    disabledText: {
        color: '#ccc',
    },
    backButton: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 10,
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
        
        marginBottom:10,
        
    },
    dateContainer: {
        flex: 1,
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold', 
        color: '#707070',
    },
    dateValue: {
        fontSize: 14,
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
});

export default Validate;
