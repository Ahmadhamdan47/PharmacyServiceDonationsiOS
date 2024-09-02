import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import axios from 'axios';  // Import axios for API calls
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection


const PackInspection = ({ route, navigation }) => {
    const { batchLot } = route.params;
    const [donationTitle, setDonationTitle] = useState('');
console.log(batchLot.batchLotId);
    useEffect(() => {
        const fetchDonationTitle = async () => {
            try {
                const response = await fetch(`https://apiv2.medleb.org/donation/${batchLot.donationId}`);
                const data = await response.json();
                console.log(data.DonationTitle);
                setDonationTitle(data.DonationTitle);
            } catch (error) {
                console.error('Error fetching donation details:', error);
            }
        };

        if (batchLot.donationId) {
            fetchDonationTitle();
        }
    }, [batchLot.donationId]);

    const handleInspect = async () => {
        try {
            const response = await axios.post(`https://apiv2.medleb.org/batchLots/inspected/${batchLot.batchLotId}`);
            if (response.status === 200) {
                Alert.alert('Success', 'Batch lot marked as inspected.');
                // You can navigate or update the state here if needed
            } else {
                throw new Error('Failed to update status to inspected.');
            }
        } catch (error) {
            console.error('Error inspecting batch lot:', error);
            Alert.alert('Error', 'Failed to mark batch lot as inspected.');
        }
    };

    const handleReject = async () => {
        try {
            const response = await axios.post(`https://apiv2.medleb.org/batchLots/rejected/${batchLot.batchLotId}`);
            if (response.status === 200) {
                Alert.alert('Success', 'Batch lot marked as rejected.');
                // You can navigate or update the state here if needed
            } else {
                throw new Error('Failed to update status to rejected.');
            }
        } catch (error) {
            console.error('Error rejecting batch lot:', error);
            Alert.alert('Error', 'Failed to mark batch lot as rejected.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{batchLot.boxLabel}</Text>
                    <Text style={styles.headerSubtitle}>{donationTitle}</Text>
                </View>
            </View>

            {/* Scrollable Content Section */}
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Display all batch lot info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.label}>GTIN *</Text>
                    <Text style={styles.info}>{batchLot.gtin}</Text>

                    <Text style={styles.label}>LOT/Batch Number *</Text>
                    <Text style={styles.info}>{batchLot.lotNumber}</Text>

                    <Text style={styles.label}>Expiry Date *</Text>
                    <Text style={styles.info}>{batchLot.expiryDate}</Text>

                    <Text style={styles.label}>Serial Number *</Text>
                    <Text style={styles.info}>{batchLot.serialNumber}</Text>

                    <Text style={styles.sectionHeader}>Medication Details</Text>

                    <Text style={styles.label}>Brand Name *</Text>
                    <Text style={styles.info}>{batchLot.drugName}</Text>

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Presentation *</Text>
                            <Text style={styles.info}>{batchLot.presentation}</Text>
                        </View>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Form *</Text>
                            <Text style={styles.info}>{batchLot.form}</Text>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Laboratory *</Text>
                            <Text style={styles.info}>{batchLot.owner}</Text>
                        </View>
                        <View style={styles.halfWidth}>
                            <Text style={styles.label}>Country *</Text>
                            <Text style={styles.info}>{batchLot.country}</Text>
                        </View>
                    </View>
                </View>

                {/* Buttons Section */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                        <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inspectButton} onPress={handleInspect}>
                        <Text style={styles.inspectButtonText}>Inspect</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            {/* Bottom Navigation Bar */}
<BottomNavBarInspection currentScreen="PackInspection" />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    infoContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    info: {
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        color: '#000',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 10,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 5,
        marginTop: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
    },
    rejectButton: {
        backgroundColor: '#FF0000',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        width: '45%',
    },
    rejectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    inspectButton: {
        backgroundColor: '#00A651',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        width: '45%',
    },
    inspectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PackInspection;
