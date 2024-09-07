import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Table, Row, Rows } from 'react-native-table-component';
import BottomNavBarInspection from './BottomNavBarInspection';

const BoxDetails = ({ route, navigation }) => {
    const { box } = route.params;
    const [batchLots, setBatchLots] = useState([]);  // Initialize as an empty array
    const [loading, setLoading] = useState(true);
    const [tableHead] = useState(['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Status']);
    const [widthArr] = useState([30, 100, 80, 80, 100, 80, 100, 80, 80, 100, 100]);

    useEffect(() => {
        fetchSerialNumbers();
    }, []);

    const fetchSerialNumbers = async () => {
        try {
            const response = await axios.get(`https://apiv2.medleb.org/batchserial/byBox/${box.BoxId}`);
            const data = response.data.data; // Ensure you access the 'data' property correctly
console.log(data);
            if (Array.isArray(data)) {
                setBatchLots(data); // Correctly set the array of batch lots
            } else {
                setBatchLots([]);  // Fallback to an empty array if the response is not an array
            }
        } catch (error) {
            console.error('Error fetching serial numbers:', error);
            Alert.alert('Error', 'Failed to load serial numbers.');
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.title}>Box {box.BoxNumber}</Text>
                    <Text style={styles.subtitle}>Donor: {box.DonorName}</Text>
                    <Text style={styles.subtitle}>Recipient: {box.RecipientName}</Text>
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
                                    index + 1,  // Row index
                                    lot.DrugName || 'N/A',  // Brand Name
                                    lot.Presentation || 'N/A',  // Presentation
                                    lot.Form || 'N/A',  // Form
                                    lot.Laboratory || 'N/A',  // Laboratory
                                    lot.LaboratoryCountry || 'N/A',  // Country
                                    lot.GTIN || 'N/A',  // GTIN
                                    lot.BatchNumber || 'N/A',  // LOT Number
                                    lot.ExpiryDate || 'N/A',  // Expiry Date
                                    lot.SerialNumber || 'N/A',  // Serial Number
                                    lot.Inspection || 'N/A'  // Status (Inspection)
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

export default BoxDetails;
