import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation hook
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar

const DonorList = ({ navigation }) => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [donorId, setDonorId] = useState(null);
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Set up the header with the user icon and name
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.userInfo}>
                    {/* User Icon */}
                    <View style={styles.userIconContainer}>
                        <Text style={styles.userIconText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    {/* Username */}
                    <Text style={styles.usernameText}>{username}</Text>
                </View>
            ),
        });

        fetchDonorId();
    }, [navigation, username]); // Include navigation and username in dependencies to update header

    useEffect(() => {
        if (donorId) {
            fetchDonations();
        }
    }, [donorId]);

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
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollViewContainer}>
                    {donations.map((donation, index) => (
                        <TouchableOpacity key={index} style={styles.cardContainer} onPress={() => handlePressDonation(donation)}>
                            <Text style={[styles.statusText, donation.status === 'pending' ? styles.pendingText : styles.approvedText]}>
                                {donation.status === 'pending' ? 'Pending' : 'Approved'}
                            </Text>
                            <View style={styles.cardContent}>
                                <View style={styles.infoContainer}>
                                    <Text style={styles.infoTitle}>Donation Title:</Text>
                                    <Text style={styles.infoText}>{donation.DonationPurpose}</Text>
                                    <Text style={styles.infoTitle}>To:</Text>
                                    <Text style={styles.infoText}>{donation.RecipientName}</Text>
                                </View>
                                <View style={styles.detailsContainer}>
                                    <Text style={styles.detailsText}>Date: {donation.DonationDate}</Text>
                                    <Text style={styles.detailsText}>nb of box(es): {donation.NumberOfBoxes}</Text>
                                    <Text style={styles.detailsText}>nb of pack(s): {donation.BatchLotTrackings.length}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Bottom Navigation Bar */}
            <BottomNavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    userInfo: {
        alignItems: 'center',
        marginRight: 10,
    },
    userIconContainer: {
        width: 40, // Increased size of the circle
        height: 40,
        borderRadius: 25,
        backgroundColor: '#fff', // White inside the circle
        borderWidth: 2,
        borderColor: '#00A651', // Green border
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5, // Space between the circle and the username
    },
    userIconText: {
        color: '#00A651', // Green text
        fontWeight: 'bold',
        fontSize: 20, // Increased font size for the circle text
    },
    usernameText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#121212',
    },
    scrollViewContainer: {
        paddingBottom: 20,
    },
    cardContainer: {
        marginHorizontal: 20,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff',
        position: 'relative',
    },
    statusText: {
        position: 'absolute',
        left: 10,
        top: 10,
        fontSize: 14,
        fontStyle: 'italic',
        fontWeight: '700',
        zIndex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 5,
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
        marginTop: 20,
    },
    infoContainer: {
        flex: 1,
    },
    infoTitle: {
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
});

export default DonorList;
