import React, { useEffect, useState } from 'react';
import { ScrollView, View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Table, Row, Rows } from 'react-native-table-component';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import axios from 'axios';

const ListDonations = () => {
    const [tableHead, setTableHead] = useState(['Drug Name','GTIN', 'LOT', 'Serial Number', 'Expiry Date', 'Form', 'Presentation','Owner', 'Country', 'Quantity']);
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        fetchDonations();
    }, []);

const fetchDonations = async () => {
  try {
    const response = await axios.get("https://apiv2.medleb.org/donation/all");
    const data = response.data.map(item => [
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].DrugName : 'N/A',
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].GTIN : 'N/A',
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].BatchNumber : 'N/A', // Added LOT
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].SerialNumber : 'N/A', // Added Serial Number
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].ExpiryDate : 'N/A', // Added Expiry Date
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].Form : 'N/A', // Added Form
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].Presentation : 'N/A', // Added Presentation
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].Laboratory : 'N/A', // This is now the 'Owner'
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].LaboratoryCountry : 'N/A',
      item.BatchLotTrackings[0] ? item.BatchLotTrackings[0].Quantity : 'N/A',
    ]).filter(row => !row.includes('N/A')); // Filter out rows with 'N/A' fields

    setTableData(data);
  } catch (error) {
    console.error("Error fetching donations:", error);
  }
};

    const exportToExcel = async () => {
        try {
            const filteredData = tableData.filter(row => !row.includes('N/A')); // Filter out rows with 'N/A' fields
            const ws = XLSX.utils.aoa_to_sheet([tableHead, ...filteredData]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Donations");

            // Set column widths for better readability
            const wscols = [
                { wch: 20 }, // Drug Name
                { wch: 20 }, // GTIN
                { wch: 15 }, // LOT
                { wch: 20 }, // Serial Number
                { wch: 15 }, // Expiry Date
                { wch: 15 }, // Form
                { wch: 20 }, // Presentation
                { wch: 15 }, // Owner
                { wch: 15 }, // Country
                { wch: 10 }, // Quantity
            ];
            ws['!cols'] = wscols;

            // Apply number format to GTIN column (second column)
            ws['!ref'] = XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: tableHead.length - 1, r: filteredData.length } });
            for (let R = 1; R <= filteredData.length; ++R) {
                ws[XLSX.utils.encode_cell({ c: 1, r: R })].z = '0';
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
    };

    return (
        <View style={styles.fullContainer}>
            <ScrollView horizontal style={styles.container}>
                <ScrollView>
                    <Table borderStyle={{ borderWidth: 2, borderColor: '#c8e1ff' }}>
                        <Row data={tableHead} style={styles.head} widthArr={[120, 120, 120, 120, 120, 120, 120, 120, 120, 120]} textStyle={styles.text} />
                        <Rows data={tableData} widthArr={[120, 120, 120, 120, 120, 120, 120, 120, 120, 120]} textStyle={styles.text} />
                    </Table>
                </ScrollView>
            </ScrollView>
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
