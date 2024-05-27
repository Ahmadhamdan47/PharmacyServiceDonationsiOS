import React, { useEffect, useState } from 'react';
import { ScrollView, View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Table, Row, Rows } from 'react-native-table-component';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import axios from 'axios';

const ListDonations = () => {
    const [tableHead, setTableHead] = useState(['Donor', 'Recipient', 'Date', 'Quantity', 'Laboratory', 'Country', 'GTIN']);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
            const response = await axios.get("https://apiv2.medleb.org/donation/all");
            const data = response.data.map(item => [
                item.DonorName,
                item.RecipientName,
                item.DonationDate ? new Date(item.DonationDate).toLocaleDateString() : new Date().toLocaleDateString(),
                item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].Quantity : 'N/A',
                item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].Laboratory : 'N/A',
                item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].LaboratoryCountry : 'N/A',
                item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].GTIN : 'N/A'
            ]);
            setTableData(data);
        } catch (error) {
            console.error("Error fetching donations:", error);
        }
    };

    const exportToExcel = async () => {
        try {
            const ws = XLSX.utils.aoa_to_sheet([tableHead, ...tableData]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Donations");

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
    };

    return (
        <View style={styles.fullContainer}>
            <ScrollView style={styles.container}>
                <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
                    <Row data={tableHead} style={styles.head} textStyle={styles.text} />
                    <Rows data={tableData} textStyle={styles.text} />
                </Table>
            </ScrollView>
            <TouchableOpacity onPress={exportToExcel} style={styles.button}>
                <Text style={styles.buttonText}>Export to Excel</Text>
            </TouchableOpacity>
            {/* Custom Taskbar omitted for brevity */}
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
    button: {
        padding: 10,
        margin: 10,
        backgroundColor: 'green',
        borderRadius: 5,
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
    },
});

export default ListDonations;
