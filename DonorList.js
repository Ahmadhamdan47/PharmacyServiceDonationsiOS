import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, BackHandler, Image,StatusBar } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useNavigation and useFocusEffect
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar

const DonorList = ({ navigation }) => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [donorId, setDonorId] = useState(null);
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Set up the header with the user icon and name
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
            fetchDonations();
        }
    }, [donorId]);

    const handleBackPress = () => {
        navigation.navigate('Landing'); // Navigate back to Landing
        return true; // Prevent default back behavior
    };

    const fetchDonorId = async () => {
        try {
        const storedUsername = await AsyncStorage.getItem('username');
            if (storedUsername) {
                setUsername(storedUsername); // Set the username state
                const response = await axios.get(`https://apiv2.medleb.org/donor/byUsername/${storedUsername}`);
                if (response.data && response.data.DonorId) {
                    setDonorId(response.data.DonorId);
                }
            }
        } catch (error) {
            console.error('Failed to load donor info:', error);
            Alert.alert('Error', 'Failed to load donor information.');
        }
    };

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://apiv2.medleb.org/donation/byDonor/${donorId}`);
            setDonations(response.data);
        } catch (error) {
            console.error("Error fetching donations:", error);
            Alert.alert("Error", "Failed to load donations.");
        }
        setLoading(false);
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
            <StatusBar backgroundColor="#f9f9f9" />
    
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                    {donations
                        .filter(donation => donation.NumberOfBoxes > 0 && donation.BatchLotTrackings.length > 0) // Filter donations
                        .map((donation, index) => (
                            <TouchableOpacity key={index} style={styles.cardContainer} onPress={() => handlePressDonation(donation)}>
                                <Text style={[styles.statusText, donation.status === 'pending' ? styles.pendingText : styles.approvedText]}>
                                    {donation.status === 'pending' ? 'Pending' : 'Approved'}
                                </Text>
                                <View style={styles.cardContent}>
                                    <View style={styles.infoContainer}>
                                        <Text style={styles.infoTitle}>Donation Title:</Text>
                                        <Text style={styles.infoText}>{donation.DonationTitle}</Text>
                                        <Text style={styles.infoTo}>To:</Text>
                                        <Text style={styles.infoText}>{donation.RecipientName}</Text>
                                    </View>
                                    <View style={styles.detailsContainer}>
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailsText}>Date:</Text>
                                            <Text style={styles.detailValue}>{donation.DonationDate}</Text>
                                        </View>
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailsText}>nb of box(es):</Text>
                                            <Text style={styles.detailValue}>{donation.NumberOfBoxes}</Text>
                                        </View>
                                        <View style={styles.detailItem}>
                                            <Text style={styles.detailsText}>nb of pack(s):</Text>
                                            <Text style={styles.detailValue}>{donation.BatchLotTrackings.length}</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                </ScrollView>
            )}
    
            {/* Bottom Navigation Bar */}
            <BottomNavBar style={{ marginTop: 25 }} />
        </View>
    );
    
};

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingTop:10,
        
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
        marginLeft:5,
      },
      circleText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
    
        fontSize: 20,
        color: '#00A651',
        fontWeight: 'bold',
        marginBottom:2,
      },
      profileText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
    
        fontSize: 14,
        color: '#000',
        fontWeight: '400',
        textAlign: 'left',
        
      },   
    scrollViewContainer: {
        paddingBottom: 20,
    },
    cardContainer: {
        marginTop:20,
        marginHorizontal: 35,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 25,
        padding: 10,
        backgroundColor: '#FFFCFC',
        position: 'relative',
        height:120,
        
    },
    statusText: {
        position: 'absolute',
        left: 20,
        top: 10,
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: '700',
        zIndex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 10,
        
    },
    pendingText: {
        color: '#DB7B2B',
    },
    approvedText: {
        color: '#00A651',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        
        marginHorizontal:20,
        
    },
    infoContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 12,
        fontWeight: '300',
        color: '#121212',
        marginTop:25,
    },
    infoTo: {
        fontSize: 12,
        fontWeight: '300',
        color: '#121212',
       
    },
    infoText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#121212',
    },
    detailsContainer: {
        alignItems: 'flex-end',
    },
    detailsText: {
        fontSize: 12,
        fontWeight: '300',
        color: '#121212',
    },
    backButton: {
        marginLeft: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
    },
    backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
        
      },
      detailValue: {
        fontSize: 14,
        color: '#000', 
        fontWeight:'bold'     // Make values green or any color you prefer
      },
});

export default DonorList;
