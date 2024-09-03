import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import BottomNavBarInspection from './BottomNavBarInspection';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PackInspection = ({ route }) => {
    const { batchLot } = route.params;
    const [donationTitle, setDonationTitle] = useState('');
    const [username, setUsername] = useState('');
    const navigation = useNavigation();

    useEffect(() => {
        const fetchDonationTitle = async () => {
            try {
                const response = await fetch(`https://apiv2.medleb.org/donation/${batchLot.donationId}`);
                const data = await response.json();
                setDonationTitle(data.DonationTitle);
            } catch (error) {
                console.error('Error fetching donation details:', error);
            }
        };

        if (batchLot.donationId) {
            fetchDonationTitle();
        }
    }, [batchLot.donationId]);

    useEffect(() => {
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

        getUsername();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity style={styles.headerLeft} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>&lt; Back</Text>
                </TouchableOpacity>
            ),
            headerTitle: 'Pack Inspection',
            headerTitleAlign: 'center',
            headerRight: () => (
                <View style={styles.profileContainer}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.profileText}>{username}</Text>
                </View>
            ),
        });
    }, [navigation, username]);

    const handleInspect = async () => {
        try {
            const response = await axios.post(`https://apiv2.medleb.org/batchLots/inspected/${batchLot.batchLotId}`);
            if (response.status === 200) {
                Alert.alert('Success', 'Batch lot marked as inspected.');
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
                <Text style={styles.headerTitle}>{batchLot.boxLabel}</Text>
                <Text style={styles.headerSubtitle}>{donationTitle}</Text>
            </View>

            {/* Content Section */}
            <View style={styles.infoContainer}>
                {/* Display all batch lot info */}
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

            {/* Bottom Navigation Bar */}
            <BottomNavBarInspection currentScreen="Inspect" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    infoContainer: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    info: {
        fontSize: 10,
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 10,
        padding: 8,
        marginBottom: 5,
        color: '#000',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        marginVertical: 10,
        textAlign: 'center',
        paddingBottom: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    halfWidth: {
        width: '48%',
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    rejectButton: {
        backgroundColor: '#FF0000',
        paddingVertical: 10,
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
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        width: '45%',
    },
    inspectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15,
    },
    backButtonText: {
        fontSize: 16,
        color: '#000',
    },
    profileContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginRight: 15,
        marginTop:10,
    },
    circle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    circleText: {
        fontSize: 16,
        color: '#00A651',
        fontWeight: 'bold',
    },
    profileText: {
        fontSize: 10,
        color: '#000',
        fontWeight: 'bold',
    },
});

export default PackInspection;
