import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet,Image,BackHandler } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';

const Validate = () => {
    const [donors, setDonors] = useState([]);
    const [filteredDonors, setFilteredDonors] = useState([]);
    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);
    const [status, setStatus] = useState('All');
    const [selectedDonor, setSelectedDonor] = useState('All');
    const [showFromDatePicker, setShowFromDatePicker] = useState(false);
    const [showToDatePicker, setShowToDatePicker] = useState(false);
    const [showStatusPicker, setShowStatusPicker] = useState(false);
    const [showDonorPicker, setShowDonorPicker] = useState(false);
    const [username, setUsername] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
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
        getUsername();
    }, []);

    useEffect(() => {
        const backAction = () => {
            navigation.navigate('Landing'); // Navigate to "Landing" when back button is pressed
            return true; // Prevent default back button behavior
        };
    
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    
        return () => {
            backHandler.remove(); // Clean up the listener when the component is unmounted
        };
    }, [navigation]);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Validate',
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
            setDonors(response.data);
            setFilteredDonors(response.data); // Initialize with all donors
        } catch (error) {
            console.error('Error fetching donors:', error);
        }
    };

    const filterDonors = () => {
        let filtered = donors;

        if (status !== 'All') {
            filtered = filtered.filter(donor => (status === 'Active' ? donor.IsActive : !donor.IsActive));
        }

        if (selectedDonor !== 'All') {
            filtered = filtered.filter(donor => donor.DonorName === selectedDonor);
        }

        if (fromDate) {
            filtered = filtered.filter(donor => new Date(donor.CreatedDate) >= fromDate);
        }

        if (toDate) {
            filtered = filtered.filter(donor => new Date(donor.CreatedDate) <= toDate);
        }

        setFilteredDonors(filtered);
        setCurrentPage(1);
    };

    const getPaginatedDonors = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredDonors.slice(startIndex, endIndex);
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
            return 'Rejected';
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


                <View style={styles.filterRow}>
                    {/* Donor Dropdown */}
                    <TouchableOpacity onPress={() => setShowDonorPicker(!showDonorPicker)} style={styles.filterButton}>
                        <Text style={styles.filterText}>{selectedDonor}</Text>
                    </TouchableOpacity>
                    {showDonorPicker && (
                        <View style={styles.dropdown}>
                            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                {['All', ...donors.map(donor => donor.DonorName)].map(donorName => (
                                    <TouchableOpacity key={donorName} onPress={() => { setSelectedDonor(donorName); setShowDonorPicker(false); filterDonors(); }}>
                                        <Text style={styles.dropdownText}>{donorName}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Status Dropdown */}
                    <TouchableOpacity onPress={() => setShowStatusPicker(!showStatusPicker)} style={styles.filterButton}>
                        <Text style={styles.filterText}>{status}</Text>
                    </TouchableOpacity>
                    {showStatusPicker && (
                        <View style={styles.dropdown}>
                            <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
                                {['All', 'Active', 'Inactive'].map(s => (
                                    <TouchableOpacity key={s} onPress={() => { setStatus(s); setShowStatusPicker(false); filterDonors(); }}>
                                        <Text style={styles.dropdownText}>{s}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>

                {/* Filter Button */}
                <TouchableOpacity style={styles.searchButton} onPress={filterDonors}>
    <Image source={require('./assets/search.png')} style={styles.searchIcon} />
</TouchableOpacity>

                {/* Results Count */}
                <Text style={styles.resultCount}>number of result(s): {filteredDonors.length}</Text>

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
                            getStatusText(donor.IsActive) === 'Rejected' ? 'red' : 'orange' 
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
        width: 47,
        height: 16,
        backgroundColor: '#f9f9f9',
        fontSize: 14,
        marginRight:10,
        marginLeft: 103,
        marginBottom:30,
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
                
        fontFamily: 'RobotoCondensed-Bold',    
        fontSize: 14,
        color: '#000',
        textAlign: 'center',
        
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
    filterText: {
        fontSize: 14,
        color: '#00A651',
        fontFamily: 'RobotoCondensed-Bold',
    },
    dropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginTop: 5,
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
        fontFamily: 'RobotoCondensed-Bold',
    },
    resultCount: {
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 12,
        fontFamily: 'RobotoCondensed-Regular',     
           color: "#121212"
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 15,
        marginVertical: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        borderColor:'green',
        borderWidth:1,
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
        width: 35,
        height: 34,
        tintColor: '#00A651',
    },
    searchButton: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 100, // Optional: for round button
    },
    searchIcon: {
        width: 280,  // Set the width of the search icon
        height: 35, // Set the height of the search icon
        borderRadius: 100, // Optional: for round button

    },  
});

export default Validate;
