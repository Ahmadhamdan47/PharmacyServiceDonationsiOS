import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import axios from 'axios';
import BottomNavBarInspection from './BottomNavBarInspection';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PackInspection = ({ route }) => {
    const { batchLot } = route.params;
    const [donationTitle, setDonationTitle] = useState('');
    const [donorName, setDonorName] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [username, setUsername] = useState('');
    const navigation = useNavigation();

    useEffect(() => {
        const fetchDonationDetails = async () => {
            try {
                // Fetch donation details to get DonorId and RecipientId
                const donationResponse = await fetch(`https://apiv2.medleb.org/donation/${batchLot.donationId}`);
                const donationData = await donationResponse.json();
                setDonationTitle(donationData.DonationTitle);

                // Fetch DonorName
                if (donationData.DonorId) {
                    const donorResponse = await fetch(`https://apiv2.medleb.org/donor/${donationData.DonorId}`);
                    const donorData = await donorResponse.json();
                    setDonorName(donorData.DonorName);
                }

                // Fetch RecipientName
                if (donationData.RecipientId) {
                    const recipientResponse = await fetch(`https://apiv2.medleb.org/recipient/${donationData.RecipientId}`);
                    const recipientData = await recipientResponse.json();
                    setRecipientName(recipientData.RecipientName);
                }
            } catch (error) {
                console.error('Error fetching donation, donor, or recipient details:', error);
            }
        };

        if (batchLot.donationId) {
            fetchDonationDetails();
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
            headerTitle: '',

            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                    <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{donorName}/ {recipientName}</Text>
                   
                    <Text style={styles.headerTitle}>{batchLot.boxLabel}</Text>
                    <Text style={styles.headerTitle}>{donationTitle}</Text>
                    
                </View>
            ),
           
            headerStyle: {
                height: 100,
                backgroundColor: '#f9f9f9',
            },
        });
    }, [navigation, username, donationTitle, donorName, recipientName]);

    const handleInspect = async () => {
        try {
            console.log(batchLot.serialNumberId);
            const response = await axios.put(`https://apiv2.medleb.org/batchserial/inspect/${batchLot.serialNumberId}`);
            if (response.status === 200) {
                Alert.alert('Success', 'Batch serial number marked as inspected.');
            } else {
                throw new Error('Failed to update status to inspected.');
            }
        } catch (error) {
            console.error('Error inspecting batch serial number:', error);
            Alert.alert('Alert', 'this drug was already inspected.');
        }
    };

    const handleReject = async () => {
        try {
            const response = await axios.put(`https://apiv2.medleb.org/batchserial/reject/${batchLot.serialNumberId}`);
            if (response.status === 200) {
                Alert.alert('Success', 'Batch serial number marked as rejected.');
            } else {
                throw new Error('Failed to update status to rejected.');
            }
        } catch (error) {
            console.error('Error rejecting batch serial number:', error);
            Alert.alert('Alert', 'this pack was already inspected.');
        }
    };

    return (
        <View style={styles.container}>
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
                    <View style={styles.halfWidthLeft}>
                        <Text style={styles.label}>Presentation *</Text>
                        <Text style={styles.info}>{batchLot.presentation}</Text>
                    </View>
                    <View style={styles.halfWidthRight}>
                        <Text style={styles.label}>Form *</Text>
                        <Text style={styles.info}>{batchLot.form}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfWidthLeft}>
                        <Text style={styles.label}>Laboratory *</Text>
                        <Text style={styles.info}>{batchLot.owner}</Text>
                    </View>
                    <View style={styles.halfWidthRight}>
                        <Text style={styles.label}>Country *</Text>
                        <Text style={styles.info}>{batchLot.country}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                    <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inspectButton} onPress={handleInspect}>
                    <Text style={styles.inspectButtonText}>Inspect</Text>
                </TouchableOpacity>
            </View>

            <BottomNavBarInspection currentScreen="Inspect" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    header: {
        alignItems: 'center',
        marginTop: 30,
        marginRight: 25,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        
        color: 'red',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'red',
    },
    infoContainer: {
        flex: 1,
    },
    label: {
        color: '#707070',
        fontSize: 12,
        marginBottom: 3,
        marginLeft: 40,
    },
    info: {
        borderWidth: 1,
        borderColor: '#00a651',
        borderRadius: 20,
        padding: 5,
        paddingLeft: 10,
        height: 30,
        marginBottom: 10,
        backgroundColor: '#FFFCFC',
        marginLeft: 35,
        marginRight: 35,
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
    halfWidthLeft: {
        width: '48%',
    },
    halfWidthRight: {
        width: '48%',
    },
    buttonsContainer: {
    marginLeft:50,
    marginBottom: 60, // Reduced margin
    flexDirection: 'row', // Align items horizontally (in a row)
    marginTop:20,
    },
    rejectButton: {
        backgroundColor: '#FF0000',
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        width: '35%',
        marginHorizontal:10,
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
        width: '35%',
        marginHorizontal:10,
    },
    inspectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButtonImage: {
        width: 41,
        height: 15,
        marginLeft: 10,
        marginTop: 30,
    },
});

export default PackInspection;
