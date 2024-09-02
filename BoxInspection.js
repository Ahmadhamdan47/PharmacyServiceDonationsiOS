import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Table, Row, Rows } from 'react-native-table-component';
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection

const BoxInspection = ({ route, navigation }) => {
    const { boxId } = route.params;
    const [boxLabel, setBoxLabel] = useState('');
    const [donationTitle, setDonationTitle] = useState('');
    const [donorName, setDonorName] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [batchLots, setBatchLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableHead] = useState(['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Status']);
    const [widthArr] = useState([30, 100, 80, 80, 100, 80, 100, 80, 80, 100, 100]);

    useEffect(() => {
        const fetchBoxDetails = async () => {
            try {
                // Fetch BoxLabel and DonationId using BoxId
                const boxResponse = await fetch(`https://apiv2.medleb.org/boxes/${boxId}`);
                const boxData = await boxResponse.json();
                setBoxLabel(boxData.BoxLabel);

                // Fetch DonationTitle, Donor, and Recipient using DonationId
                const donationResponse = await fetch(`https://apiv2.medleb.org/donation/${boxData.DonationId}`);
                const donationData = await donationResponse.json();
                setDonationTitle(donationData.DonationTitle);
                setDonorName(donationData.DonorName);
                setRecipientName(donationData.RecipientName);

                // Fetch all batches related to BoxId
                const batchesResponse = await fetch(`https://apiv2.medleb.org/batchLots/byBox/${boxId}`);
                const batchesData = await batchesResponse.json();
                setBatchLots(batchesData);

                // Check if all batch lots are inspected
                const allInspected = batchesData.every(batch => batch.Inspection === 'inspected');
                if (allInspected) {
                    // Call inspect box API
                    await markBoxAsInspected(boxId);
                }

            } catch (error) {
                console.error('Error fetching box details:', error);
                Alert.alert('Error', 'Failed to load box details.');
            }
            setLoading(false);
        };

        fetchBoxDetails();
    }, [boxId]);

    const markBoxAsInspected = async (boxId) => {
        try {
            await axios.put(`https://apiv2.medleb.org/boxes/inspected/${boxId}`);
            Alert.alert('Success', 'Box marked as inspected.');
        } catch (error) {
            console.error('Error marking box as inspected:', error);
            Alert.alert('Error', 'Failed to mark box as inspected.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
    
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>{boxLabel}</Text>
                    <Text style={styles.subtitle}>{donationTitle}</Text>
                    <Text style={styles.subtitle}>Donor: {donorName}</Text>
                    <Text style={styles.subtitle}>Recipient: {recipientName}</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView horizontal>
                    <View>
                        <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>
                            <Row data={tableHead} style={styles.head} textStyle={styles.headText} widthArr={widthArr} />
                            <Rows
                                data={batchLots.map((lot, index) => [
                                    index + 1,
                                    lot.DrugName || 'N/A',
                                    lot.Presentation || 'N/A',
                                    lot.Form || 'N/A',
                                    lot.Laboratory || 'N/A',
                                    lot.LaboratoryCountry || 'N/A',
                                    lot.GTIN || 'N/A',
                                    lot.BatchNumber || 'N/A',
                                    lot.ExpiryDate || 'N/A',
                                    lot.SerialNumber || 'N/A',
                                    lot.Inspection || 'N/A'
                                ])}
                                textStyle={styles.text}
                                widthArr={widthArr}
                            />
                        </Table>
                    </View>
                </ScrollView>
            )}
                    <BottomNavBarInspection currentScreen="PackInspection" />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    backButtonText: {
        color: '#000',
        fontSize: 16,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    head: {
        height: 40,
        backgroundColor: '#00A651',
    },
    headText: {
        margin: 6,
        textAlign: 'center',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    text: {
        margin: 6,
        textAlign: 'center',
        fontSize: 10,
    },
});

export default BoxInspection;
