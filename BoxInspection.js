import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import axios from 'axios';
import { Table, Row } from 'react-native-table-component';
import BottomNavBarInspection from './BottomNavBarInspection';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

const BoxInspection = ({ route, navigation }) => {
    const { boxId } = route.params;
    const [boxLabel, setBoxLabel] = useState('');
    const [donationTitle, setDonationTitle] = useState('');
    const [donorName, setDonorName] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [batchLots, setBatchLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState([]); // To track selected rows
    const [tableHead] = useState(['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Status']);
    const [widthArr] = useState([30, 100, 80, 80, 100, 80, 100, 80, 80, 100, 100]);

    useEffect(() => {
        const fetchBoxDetails = async () => {
            try {
                const boxResponse = await axios.get(`https://apiv2.medleb.org/boxes/${boxId}`);
                const boxData = boxResponse.data;
                setBoxLabel(boxData.BoxLabel);

                const donationResponse = await axios.get(`https://apiv2.medleb.org/donation/${boxData.DonationId}`);
                const donationData = donationResponse.data;
                setDonationTitle(donationData.DonationTitle);
                setDonorName(donationData.DonorName);
                setRecipientName(donationData.RecipientName);

                const batchesResponse = await axios.get(`https://apiv2.medleb.org/batchserial/byBox/${boxId}`);
                const batchesData = batchesResponse.data.data;
                setBatchLots(batchesData);

                const allInspected = batchesData.every(batch => batch.Inspection === 'inspected');
                if (allInspected) {
                    await markBoxAsInspected(boxId);
                }

            } catch (error) {
                console.error('Error fetching box details:', error);
                Alert.alert('Error', 'Failed to load box details.');
            }
            setLoading(false);
            navigation.setOptions({
                headerLeft: () => (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                        <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <View style={styles.headerRightContainer}>
                        <TouchableOpacity onPress={exportToExcel} >
                            <Text style={styles.headerButtonText}>Export</Text>
                        </TouchableOpacity>
                        
                    </View>
                ),
                headerTitle: () => (
                    <View>
                    <Text style={styles.title}>{donationTitle}-{boxLabel}-{donorName}-{recipientName}</Text>
                    
                    </View>
                ),
                headerTitleAlign: 'left',
                headerTitleStyle: {
                    marginTop: 42, // Add margin top of 42px to the header title
                    position: 'relative', // Ensure the profile container is the reference for positioning the dropdown
                    backgroundColor: '#f9f9f9',
                },
                headerStyle: {
                    height: 100, // Increase the header height to accommodate the margin
                    backgroundColor: '#f9f9f9',
                },
            });
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

    const toggleSelectRow = (index) => {
        setSelectedRows(prevSelectedRows => {
            if (prevSelectedRows.includes(index)) {
                return prevSelectedRows.filter(row => row !== index);
            } else {
                return [...prevSelectedRows, index];
            }
        });
    };

    const handleInspect = async () => {
        try {
            let alreadyRejected = false;
    
            for (let index of selectedRows) {
                const batchLot = batchLots[index];
    
                if (batchLot.Inspection === 'rejected') {
                    alreadyRejected = true;
                    break;
                }
    
                // Call the API to inspect each selected pack using batchSerialNumberId
                const response = await axios.put(`https://apiv2.medleb.org/batchserial/inspect/${batchLot.BatchSerialNumberId}`);
                
                if (response.data.message) {
                    Alert.alert('Notice', response.data.message); 
                } else {
                    batchLot.Inspection = 'inspected';
                }
            }
    
            if (alreadyRejected) {
                Alert.alert('Error', 'You have some already rejected packs.');
            } else {
                await markBoxAsInspected(boxId);
                Alert.alert('Success', 'Selected packs inspected successfully.');
            }
    
        } catch (error) {
            console.error('Error inspecting packs:', error);
            Alert.alert('Error', 'Failed to inspect selected packs.');
        }
    };
    
    const handleReject = async () => {
        try {
            for (let index of selectedRows) {
                const batchLot = batchLots[index];
    
                // Call the API to reject each selected pack using batchSerialNumberId
                const response = await axios.put(`https://apiv2.medleb.org/batchserial/reject/${batchLot.BatchSerialNumberId}`);
    
                if (response.data.message) {
                    Alert.alert('Notice', response.data.message); 
                } else {
                    batchLot.Inspection = 'rejected';
                }
            }
    
            Alert.alert('Success', 'Selected packs rejected successfully.');
        } catch (error) {
            console.error('Error rejecting packs:', error);
            Alert.alert('Error', 'Failed to reject selected packs.');
        }
    };

    const handleReport = async () => {
        try {
            for (let index of selectedRows) {
                const batchLot = batchLots[index];
    
                // Call the API to report each selected pack using batchSerialNumberId
                const response = await axios.put(`https://apiv2.medleb.org/batchserial/report/${batchLot.BatchSerialNumberId}`);
    
                if (response.data.message) {
                    Alert.alert('Notice', response.data.message); 
                } else {
                    batchLot.Inspection = 'underReport';
                }
            }
    
            Alert.alert('Success', 'Selected packs reported successfully.');
        } catch (error) {
            console.error('Error reporting packs:', error);
            Alert.alert('Error', 'Failed to report selected packs.');
        }
    };

    const selectAllRows = () => {
        const allIndexes = batchLots.map((_, index) => index);
        setSelectedRows(allIndexes);
    };
    const exportToExcel = async () => {
        try {
            // Prepare the data for Excel
            const wb = XLSX.utils.book_new();
            const ws_data = [
                ['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Status'], // Table header
                ...batchLots.map((lot, index) => [
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
                    lot.Inspection || 'N/A',
                ]),
            ];
    
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            XLSX.utils.book_append_sheet(wb, ws, 'Batch Lots');
    
            // Generate the file
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    
            // File path for the export
            const fileName = `${donorName}_${recipientName}_${donationTitle}_${boxLabel}.xlsx`.replace(/[/\\?%*:|"<>]/g, '-'); // Replace illegal characters for file names
            const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
            // Write the file to the file system
            await FileSystem.writeAsStringAsync(fileUri, wbout, {
                encoding: FileSystem.EncodingType.Base64,
            });
    
            // Share the file
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Share your Excel file',
                UTI: 'com.microsoft.excel.xlsx',
            });
    
            Alert.alert('Success', 'Excel file created and shared successfully!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            Alert.alert('Error', 'Failed to export to Excel.');
        }
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
            <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={handleInspect}>
                        <Text style={styles.inspectText}>Inspect</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleReject}>
                        <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleReport}>
                        <Text style={styles.reportText}>Report</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={selectAllRows}>
                    <Text style={styles.selectAllButton}>Select All</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView horizontal>
                    <View>
                        <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>
                            <Row data={tableHead} style={styles.head} textStyle={styles.headText} widthArr={widthArr} />
                            {batchLots.map((lot, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => toggleSelectRow(index)}
                                    style={[
                                        styles.row,
                                        selectedRows.includes(index) && styles.selectedRow
                                    ]}
                                >
                                    <Row
                                        data={[
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
                                        ]}
                                        widthArr={widthArr}
                                        textStyle={styles.text}
                                    />
                                </TouchableOpacity>
                            ))}
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
        backgroundColor: '#f9f9f9',
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
    backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
        marginTop: 30,
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
    row: {
        backgroundColor: '#fff',
    },
    selectedRow: {
        backgroundColor: '#d0f0c0', // Light green color for selected rows
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    inspectText: {
        color: 'green',
        fontWeight: 'bold',
        fontSize: 16,
        marginHorizontal: 10, // 10px distance from the other buttons
    },
    rejectText: {
        color: 'red',
        fontWeight: 'bold',
        fontSize: 16,
        marginHorizontal: 10, // 10px distance from the other buttons
    },
    reportText: {
        color: 'orange',
        fontWeight: 'bold',
        fontSize: 16,
        marginHorizontal: 10, // 10px distance from the other buttons
    },
    inspectButton: {
        backgroundColor: 'green',
        padding: 10,
        borderRadius: 5,
    },
    rejectButton: {
        backgroundColor: 'red',
        padding: 10,
        borderRadius: 5,
    },
    reportButton: {
        backgroundColor: 'orange',
        padding: 10,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    selectAllButton: {
        color: 'green',
        fontWeight: 'bold',
        fontSize: 16,
        marginTop:20,
    },
    headerRightContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 30,
    },
    headerButtonText: {
        fontSize: 14,
        color: '#00A651',
       
        fontWeight: 'bold',


    },
    title: {
        marginTop: 30,
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default BoxInspection;
