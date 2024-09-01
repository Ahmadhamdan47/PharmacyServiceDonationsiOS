import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Table, Row, Rows } from 'react-native-table-component';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

const BoxDetails = ({ route, navigation }) => {
    const { box } = route.params;
    const [batchLots, setBatchLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tableHead] = useState(['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb']);
    const [widthArr] = useState([30, 100, 80, 80, 100, 80, 100, 80, 80, 100]);

    useEffect(() => {
        fetchBatchLots();
    }, []);

    const fetchBatchLots = async () => {
        try {
            const response = await axios.get(`https://apiv2.medleb.org/batchlots/byBox/${box.BoxId}`);
            setBatchLots(response.data);
        } catch (error) {
            console.error('Error fetching batch lots:', error);
            Alert.alert('Error', 'Failed to load batch lots.');
        }
        setLoading(false);
    };

    const exportToExcel = async () => {
        try {
            const formattedData = batchLots.map((lot, index) => [
                index + 1,
                lot.DrugName || 'N/A',
                lot.Presentation || 'N/A',
                lot.Form || 'N/A',
                lot.Laboratory || 'N/A',
                lot.LaboratoryCountry || 'N/A',
                lot.GTIN || 'N/A',
                lot.BatchNumber || 'N/A',
                lot.ExpiryDate || 'N/A',
                lot.SerialNumber || 'N/A'
            ]);

            const ws = XLSX.utils.aoa_to_sheet([tableHead, ...formattedData]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Batch Lots");

            const wbout = XLSX.write(wb, { type: 'base64', bookType: "xlsx" });
            const uri = FileSystem.documentDirectory + 'batch_lots.xlsx';

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
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backButton}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Support Lebanon - Box {box.BoxNumber} - {box.NumberOfPacks} Packs</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.exportLink} onPress={exportToExcel}>
                        <Text style={styles.exportLinkText}>Export .xlsx</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.qrCodeLink}>
                        <Text style={styles.qrCodeText}>Box QR Code</Text>
                    </TouchableOpacity>
                </View>
            </View>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView horizontal>
                    <View>
                        <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>
                            <Row data={tableHead} style={styles.head} textStyle={styles.headText} widthArr={widthArr} />
                            <Rows data={batchLots.map((lot, index) => [
                                index + 1,
                                lot.DrugName,
                                lot.Presentation,
                                lot.Form,
                                lot.Laboratory,
                                lot.LaboratoryCountry,
                                lot.GTIN,
                                lot.BatchNumber,
                                lot.ExpiryDate,
                                lot.SerialNumber
                            ])} textStyle={styles.text} widthArr={widthArr} />
                        </Table>
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    backButton: {
        fontSize: 16,
        color: '#000',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    exportLink: {
        marginRight: 15,
    },
    exportLinkText: {
        color: '#00A651',
        fontSize: 16,
        fontWeight: 'bold',
    },
    qrCodeLink: {},
    qrCodeText: {
        color: '#00A651',
        fontSize: 16,
        fontWeight: 'bold',
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
