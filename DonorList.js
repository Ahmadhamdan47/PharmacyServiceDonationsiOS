import React, { useEffect, useState } from 'react';
import { ScrollView, View, TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Table, Row, Rows } from 'react-native-table-component';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

const DonorList = () => {
    const [tableHead] = useState(['Donation Code', 'Donor Name', 'Recipient Name', 'Drug Name', 'GTIN', 'LOT', 'Serial Number', 'Expiry Date', 'Form', 'Presentation', 'Owner', 'Country']);
    const [tableData, setTableData] = useState([]);
    const [allData, setAllData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);
    const [loading, setLoading] = useState(false);
    const [donorId, setDonorId] = useState(null);

    

    useEffect(() => {
        fetchDonorId();
    }, []);

    useEffect(() => {
        if (donorId) {
            fetchDonations();
        }
    }, [donorId]);

    const fetchDonorId = async () => {
        try {
            const storedUsername = await AsyncStorage.getItem('username');
            if (storedUsername) {
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
            const formattedData = response.data.flatMap(item =>
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
            setAllData(formattedData);
            setTableData(formattedData.slice(0, itemsPerPage));
        } catch (error) {
            console.error("Error fetching donations:", error);
            Alert.alert("Error", "Failed to load donations.");
        }
        setLoading(false);
    };

    const handleNextPage = () => {
        const nextPage = currentPage + 1;
        const totalPages = Math.ceil(allData.length / itemsPerPage);
        if (nextPage <= totalPages) {
            setCurrentPage(nextPage);
            const startIndex = (nextPage - 1) * itemsPerPage;
            setTableData(allData.slice(startIndex, startIndex + itemsPerPage));
        }
    };

    const handlePreviousPage = () => {
        const previousPage = currentPage - 1;
        if (previousPage > 0) {
            setCurrentPage(previousPage);
            const startIndex = (previousPage - 1) * itemsPerPage;
            setTableData(allData.slice(startIndex, startIndex + itemsPerPage));
        }
    };

    const exportToExcel = async () => {
        setLoading(true);
        try {
            const filteredData = allData.filter(row => !row.includes('N/A')); // Filter out rows with 'N/A' fields
            const ws = XLSX.utils.aoa_to_sheet([tableHead, ...filteredData]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Donations");

            // Set column widths for better readability
            const wscols = [
                { wch: 15 }, // Donation ID
                { wch: 20 }, // Donor Name
                { wch: 20 }, // Recipient Name
                { wch: 20 }, // Drug Name
                { wch: 20 }, // GTIN
                { wch: 15 }, // LOT
                { wch: 20 }, // Serial Number
                { wch: 15 }, // Expiry Date
                { wch: 15 }, // Form
                { wch: 20 }, // Presentation
                { wch: 15 }, // Owner
                { wch: 15 }, // Country
            ];
            ws['!cols'] = wscols;

            // Apply number formatting for the GTIN and Serial Number columns
            ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: tableHead.length - 1, r: filteredData.length } });
            for (let R = 1; R <= filteredData.length; ++R) {
                ws[XLSX.utils.encode_cell({ c: 4, r: R })].t = 's'; // GTIN column
                ws[XLSX.utils.encode_cell({ c: 6, r: R })].t = 's'; // Serial Number column
            }

            const wbout = XLSX.write(wb, { type: 'base64', bookType: "xlsx" });

            const uri = FileSystem.documentDirectory + 'donations.xlsx';
            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: FileSystem.EncodingType.Base64
            });

            const shareOptions = {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Share Donations Excel',
                UTI: 'com.microsoft.excel.xlsx',
            };

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, shareOptions);
            } else {
                Alert.alert("Success", "Excel file has been saved to your device's storage.", [{ text: "OK" }]);
            }
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            Alert.alert("Error", "Failed to export to Excel. Please try again.", [{ text: "OK" }]);
        }
        setLoading(false);
    };

    return (
        <View style={styles.fullContainer}>
            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView horizontal style={styles.container}>
                    <ScrollView>
                        <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
                            <Row data={tableHead} style={styles.head} textStyle={styles.text} widthArr={[120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120]} />
                            <Rows data={tableData} textStyle={styles.text} widthArr={[120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120]} />
                        </Table>
                    </ScrollView>
                </ScrollView>
            )}
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={handlePreviousPage} style={styles.button}>
                    <Text style={styles.buttonText}>Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleNextPage} style={styles.button}>
                    <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={exportToExcel} style={styles.button}>
                <Text style={styles.buttonText}>Export to Excel</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    fullContainer: {
        flex: 1,
        paddingTop: 30,
        backgroundColor: '#fff'
    },
    container: {
        flex: 1,
        padding: 16,
    },
    head: {
        height: 40,
        backgroundColor: '#f1f8ff',
    },
    text: {
        margin: 6,
        fontSize: 10,
        color: 'black'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 5
    },
    button: {
        padding: 5,
        margin: 5,
        backgroundColor: 'green',
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
    },
});

export default DonorList;
