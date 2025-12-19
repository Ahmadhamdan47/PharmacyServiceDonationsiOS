import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar for Donor
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection for Admin
import BottomNavBarRecipient from './BottomNavBarRecipient'; // Import Recipient BottomNav
import * as Font from 'expo-font';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

const DonationDetails = ({ route, navigation }) => {
    const { donation } = route.params;
    const [boxes, setBoxes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');  // State to store user role
    const [username, setUsername] = useState('');
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
        fetchUserRole();
        fetchUsername();  // Fetch the username from AsyncStorage
        fetchBoxes();     // Fetch the boxes data
    }, []);

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'List',
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                    <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <TouchableOpacity onPress={handleExportAllBoxes}>
                    <Text style={styles.headerButtonText}>Export as XLS</Text>
                </TouchableOpacity>
            ),
            headerTitleAlign: 'center',
            headerTitleStyle: {
                marginTop: 30,
                position: 'relative',
                backgroundColor: '#f9f9f9',
                fontFamily: 'RobotoCondensed-Bold',
            },
            headerStyle: {
                height: 100,
                backgroundColor: '#f9f9f9',
            },
        });
    }, [navigation, boxes]);
    const fetchUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem('userRole');
            if (role) {
                setUserRole(role);
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
        }
    };
    const fetchUsername = async () => {
        try {
            const storedUsername = await AsyncStorage.getItem('username');
            if (storedUsername) {
                setUsername(storedUsername);  // Set the username in state
            }
        } catch (error) {
            console.error('Error fetching username:', error);
        }
    };
    const normalizeBoxLabels = (boxes = []) => {
        const used = new Set();
        return boxes.map((box) => {
            const raw = typeof box.BoxLabel === 'string' ? box.BoxLabel : '';
            const match = raw.match(/Box\s+(\d+)/i);
            const parsed = match ? parseInt(match[1], 10) : null;

            if (parsed && !Number.isNaN(parsed) && !used.has(parsed)) {
                used.add(parsed);
                return { ...box, DisplayLabel: `Box ${parsed}` };
            }

            let next = 1;
            while (used.has(next)) next += 1;
            used.add(next);
            return { ...box, DisplayLabel: `Box ${next}` };
        });
    };

    const fetchBoxes = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get(`https://apiv2.medleb.org/boxes/byDonation/${donation.DonationId}`, { headers });
            const boxesData = response.data;
            
            // Fetch actual pack counts from batchserial table for each box
            const boxesWithActualCounts = await Promise.all(
                boxesData.map(async (box) => {
                    try {
                        const packsResponse = await axios.get(`https://apiv2.medleb.org/batchserial/byBox/${box.BoxId}`, { headers });
                        const actualPackCount = Array.isArray(packsResponse.data?.data) ? packsResponse.data.data.length : 0;
                        return { ...box, NumberOfPacks: actualPackCount };
                    } catch (error) {
                        console.warn(`Failed to fetch packs for box ${box.BoxId}:`, error);
                        return box; // Keep original count if fetch fails
                    }
                })
            );

            // Ensure unique, sequential labels per donation for legacy data
            // Keep only non-empty boxes, then normalize labels 1..N
            const nonEmpty = boxesWithActualCounts.filter(b => (b.NumberOfPacks || 0) > 0);
            const normalized = normalizeBoxLabels(nonEmpty);
            setBoxes(normalized);
        } catch (error) {
            console.error('Error fetching boxes:', error);
            Alert.alert('Error', 'Failed to load boxes.');
        }
        setLoading(false);
    };

    const handleBoxPress = (box) => {
        // Use normalized label if present
        const displayLabel = box.DisplayLabel || box.BoxLabel;

        // Navigate to different screens based on user role
        if (userRole === 'Admin') {
            navigation.navigate('BoxInspection', { boxId: box.BoxId, displayLabel });
        } else {
            navigation.navigate('BoxDetails', { 
                box: {
                    BoxId: box.BoxId,
                    BoxLabel: box.BoxLabel,
                    DisplayLabel: displayLabel,
                    DonorName: donation.DonorName,
                    RecipientName: donation.RecipientName,
                    DonationTitle: donation.DonationTitle
                }
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (error) {
            return 'N/A';
        }
    };

    const handleExportAllBoxes = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            // Filter to only non-empty boxes
            const nonEmptyBoxes = boxes.filter(box => (box.NumberOfPacks || 0) > 0);
            
            if (nonEmptyBoxes.length === 0) {
                Alert.alert('No Data', 'There are no boxes to export.');
                return;
            }

            // Create a new workbook
            const wb = XLSX.utils.book_new();

            // For each non-empty box, fetch its data and create a sheet
            for (const box of nonEmptyBoxes) {
                try {
                    const response = await axios.get(`https://apiv2.medleb.org/batchserial/byBox/${box.BoxId}`, { headers });
                    const batchLots = response.data.data || [];

                    // Prepare data for this box (same structure as BoxDetails export)
                    const dataForExcel = [
                        ['Donor Name', 'Recipient Name', 'Donation Title', 'Box Label'],
                        [donation.DonorName, donation.RecipientName, donation.DonationTitle, box.DisplayLabel || box.BoxLabel],
                        [],
                        ['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Status', 'Last Updated'],
                        ...batchLots.map((lot, index) => [
                            index + 1,
                            lot.DrugName || 'N/A',
                            lot.Presentation || 'N/A',
                            lot.Form || 'N/A',
                            lot.Laboratory || 'N/A',
                            lot.LaboratoryCountry || 'N/A',
                            `'${lot.GTIN || 'N/A'}`,
                            lot.BatchNumber || 'N/A',
                            lot.ExpiryDate || 'N/A',
                            lot.SerialNumber || 'N/A',
                            lot.Inspection || 'N/A',
                            formatDate(lot.lastUpdated)
                        ])
                    ];

                    // Create worksheet for this box
                    const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
                    
                    // Use DisplayLabel as sheet name (e.g., "Box 1", "Box 2")
                    const sheetName = (box.DisplayLabel || box.BoxLabel || `Box ${box.BoxId}`).substring(0, 31); // Excel sheet names max 31 chars
                    XLSX.utils.book_append_sheet(wb, ws, sheetName);
                } catch (error) {
                    console.warn(`Failed to fetch data for box ${box.BoxId}:`, error);
                    // Continue with other boxes even if one fails
                }
            }

            // Write workbook to file
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const fileName = `${donation.DonorName}_${donation.RecipientName}_${donation.DonationTitle}_AllBoxes.xlsx`.replace(/[/\\?%*:|"<>]/g, '-');
            const uri = `${FileSystem.documentDirectory}${fileName}`;
            
            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: 'base64',
            });
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Success', `File saved to ${uri}`);
            }
        } catch (error) {
            console.error('Error exporting all boxes:', error);
            Alert.alert('Error', 'Failed to export boxes. Please try again.');
        }
    };

    const handleStartDonation = () => {
        // Navigate to Donate screen to continue the donation process
        const selectedRecipientName = donation.RecipientName;
        const donationDate = new Date().toISOString().replace(/:/g, '-');
        
        navigation.navigate('Donate', {
            donorId: donation.DonorId,
            recipientId: donation.RecipientId,
            donorName: donation.DonorName,
            recipientName: selectedRecipientName,
            donationPurpose: donation.DonationPurpose,
            donationTitle: donation.DonationTitle,
            donationDate,
            donationId: donation.DonationId,
        });
    };
    

    return (
        <View style={styles.container}>
            <Text style={styles.subtitle}>To: {donation.RecipientName}</Text>
            <Text style={styles.subtitle}>Date: {donation.DonationDate}</Text>
            <Text style={styles.subtitle}>Total Packs: {(boxes || []).reduce((sum, b) => sum + (b.NumberOfPacks || 0), 0)}</Text>
    
            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <ScrollView style={styles.scrollView}>
                    {/* Show "Start Donation" button for donors when no boxes exist */}
                    {userRole !== 'Admin' && boxes.filter(box => box.NumberOfPacks > 0).length === 0 && (
                        <TouchableOpacity style={styles.startDonationButton} onPress={handleStartDonation}>
                            <Text style={styles.startDonationButtonText}>Start Donation Process</Text>
                        </TouchableOpacity>
                    )}
                    
                    {/* Show "Add More Items" button for donors when boxes exist */}
                    {userRole !== 'Admin' && boxes.filter(box => box.NumberOfPacks > 0).length > 0 && (
                        <TouchableOpacity style={styles.addMoreButton} onPress={handleStartDonation}>
                            <Text style={styles.addMoreButtonText}>Add More Items</Text>
                        </TouchableOpacity>
                    )}

                    {boxes
                        .filter(box => box.NumberOfPacks > 0) // Filter out boxes with 0 packs
                        .map((box, index) => (
                            <TouchableOpacity key={index} style={styles.card} onPress={() => handleBoxPress(box)}>
                                <View style={styles.cardContent}>
                                    <Text style={styles.cardTitle}>{box.DisplayLabel || box.BoxLabel}</Text>
                                    <Text style={styles.cardText}>Number of Packs: {box.NumberOfPacks || 0}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                </ScrollView>
            )}
    
            {/* Conditional Bottom Navigation Bar based on user role */}
            {userRole === 'Admin' ? (
                <BottomNavBarInspection currentScreen="DonationDetails" />
            ) : userRole === 'Recipient' ? (
                <BottomNavBarRecipient />
            ) : (
                <BottomNavBar />
            )}
        </View>
    );
    
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingTop: 50,  // Ensure space for the BottomNavBar
    },
    title: {
        fontSize: 24,
        fontFamily: 'RobotoCondensed-Bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 5,
        marginLeft:30,
        fontFamily: 'RobotoCondensed-Medium',
    },
    scrollView: {
        marginTop: 20,
    },
    card: {
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        marginLeft:30,
        marginRight:30,
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
    },
    cardText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Regular',

    },
    profileContainer: {
        width: 47,
        height: 16,
        backgroundColor: '#f9f9f9',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
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
        fontFamily: 'RobotoCondensed-Bold',

        fontSize: 14,
        color: '#000',
        fontWeight: '400',
        textAlign: 'center',
        
      },
      backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
        marginTop:30,
      },
      headerButtonText: {
        fontSize: 14,
        color: '#00A651',
        marginRight: 15,
        marginTop: 30,
        fontFamily: 'RobotoCondensed-Bold',
      },
      startDonationButton: {
        backgroundColor: '#00A651',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginHorizontal: 30,
        marginVertical: 20,
        alignItems: 'center',
      },
      startDonationButtonText: {
        color: '#f9f9f9',
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
        fontWeight: 'bold',
      },
      addMoreButton: {
        backgroundColor: '#00A651',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 20,
        marginHorizontal: 30,
        marginVertical: 10,
        alignItems: 'center',
      },
      addMoreButtonText: {
        color: '#f9f9f9',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        fontWeight: 'bold',
      },
});

export default DonationDetails;
