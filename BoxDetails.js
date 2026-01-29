import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Image, useWindowDimensions, Platform, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Table, Row, Rows } from 'react-native-table-component';
import BottomNavBar from './BottomNavBar';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import * as Font from 'expo-font';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from "react-native-view-shot"; // Import view-shot to capture QR code

const BoxDetails = ({ route, navigation }) => {
    const { box } = route.params;
    const [batchLots, setBatchLots] = useState([]);  // Initialize as an empty array
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [tableHead] = useState(['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Last Updated']);
    const [widthArr] = useState([30, 100, 80, 80, 100, 80, 100, 80, 80, 100, 120]);
    const { height, width } = useWindowDimensions(); // Get device dimensions
    const isLandscape = width > height; // Determine if the device is in landscape mode
    const [isFontLoaded, setIsFontLoaded] = useState(false);
    const [isQrCodeVisible, setIsQrCodeVisible] = useState(false); // Start with the QR code hidden
    const qrCodeRef = useRef(); // Reference for capturing QR code
    const insets = useSafeAreaInsets(); // Get safe area insets

    const fetchFonts = async () => {
        await Font.loadAsync({
            'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
            'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
            'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
        });
        setIsFontLoaded(true);
    };

    useEffect(() => {
        fetchFonts(); // Load fonts on component mount
    }, []);

    useEffect(() => {
        fetchSerialNumbers();
    }, []);

    navigation.setOptions({
        headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
            </TouchableOpacity>
        ),
        headerRight: () => null,
        headerTitle: () => (
            <View style={styles.headerContainer}>
                <Text style={styles.headerTitleText}>{box.DonationTitle} - {box.BoxLabel}</Text>
                <View style={styles.headerButtonsRow}>
                    <TouchableOpacity onPress={handleQrCodeShare} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>Box QR Code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleExportAsExcel} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>Export as XLS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDeleteBox} style={styles.headerButton}>
                        <Text style={[styles.headerButtonText, styles.deleteButtonText]}>Delete Box</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ),
        headerTitleAlign: 'center',
        headerStyle: {
            height: 120,
            backgroundColor: '#f9f9f9',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 0,
        },
    });

    const fetchSerialNumbers = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const response = await axios.get(`https://apiv2.medleb.org/batchserial/byBox/${box.BoxId}`, { headers });
            const data = response.data.data;
            console.log(data);
            if (Array.isArray(data)) {
                setBatchLots(data);
            } else {
                setBatchLots([]);
            }
        } catch (error) {
            console.error('Error fetching serial numbers:', error);
            Alert.alert('Error', 'Failed to load serial numbers.');
        }
        setLoading(false);
    };

    const handleDeleteBox = async () => {
        Alert.alert(
            'Delete Box',
            `Are you sure you want to delete ${box.BoxLabel || box.DisplayLabel}? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const headers = token ? { Authorization: `Bearer ${token}` } : {};
                            
                            await axios.delete(`https://apiv2.medleb.org/boxes/${box.BoxId}`, { headers });
                            
                            Alert.alert('Success', 'Box deleted successfully.');
                            // Navigate back - DonationDetails will auto-refresh via useFocusEffect
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting box:', error);
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete box. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (error) {
            return 'N/A';
        }
    };

    const handleExportAsExcel = async () => {
        try {
            const dataForExcel = [
                ['Donor Name', 'Recipient Name', 'Donation Title', 'Box Label'],
                [box.DonorName, box.RecipientName, box.DonationTitle, box.BoxLabel],
                [],
                ['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Last Updated'],
                ...batchLots.map((lot, index) => [
                    index + 1,
                    lot.DrugName || 'N/A',
                    lot.Presentation || 'N/A',
                    lot.Form || 'N/A',
                    lot.Laboratory || 'N/A',
                    lot.LaboratoryCountry || 'N/A',
                    `'${lot.GTIN || 'N/A'}`,
                    lot.BatchNumber || 'N/A',
                    lot.ExpiryDate || 'N/A',
                    lot.SerialNumber || 'N/A',
                    formatDate(lot.lastUpdated)
                ])
            ];

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
            XLSX.utils.book_append_sheet(wb, ws, 'Box Details');

            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            const fileName = `${box.DonorName}_${box.RecipientName}_${box.DonationTitle}_${box.BoxLabel}.xlsx`.replace(/[/\\?%*:|"<>]/g, '-');
            const uri = `${FileSystem.documentDirectory}${fileName}`;
            
            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: 'base64',
            });
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
            } else {
                Alert.alert('Success', `File saved to ${uri}`);
            }
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            Alert.alert('Error', 'Failed to export to Excel. Please try again.');
        }
    };

    const handleQrCodeShare = async () => {
        setIsQrCodeVisible(true); // Make QR code visible

        // Wait a moment to ensure QR code is rendered
        setTimeout(async () => {
            try {
                // Capture the QR code as an image
                const uri = await qrCodeRef.current.capture();

                // Share the captured image
                await Sharing.shareAsync(uri);
            } catch (error) {
                console.error('Error sharing QR code:', error);
                Alert.alert('Error', 'Failed to share QR code.');
            }

            setIsQrCodeVisible(false); // Hide the QR code again after sharing
        }, 500); // 500ms delay to ensure the QR code is rendered
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <View style={styles.headerTextContainer}>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <ScrollView
                    style={styles.verticalScroll}
                    contentContainerStyle={styles.scrollContentContainer}
                >
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search by brand name..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <ScrollView horizontal>
                        <View>
                            <Table borderStyle={{ borderWidth: 1, borderColor: '#C1C0B9' }}>
                                <Row data={tableHead} style={styles.head} textStyle={styles.headText} widthArr={widthArr} />
                                <Rows
                                    data={batchLots.filter(lot => 
                                        !searchQuery || 
                                        (lot.DrugName && lot.DrugName.toLowerCase().includes(searchQuery.toLowerCase()))
                                    ).map((lot, index) => [
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
                                        formatDate(lot.lastUpdated)
                                    ])}
                                    textStyle={styles.text}
                                    widthArr={widthArr}
                                />
                            </Table>
                        </View>
                    </ScrollView>

                    {isQrCodeVisible && (
                        <View style={styles.qrCodeContainer}>
                            <ViewShot ref={qrCodeRef} options={{ format: "png", quality: 0.9 }}>
                                <View style={styles.qrCodeContent}>
                                    <QRCode 
                                        value={`https://pharmacy.com/api/box/${box.BoxId}/download`} 
                                        size={150} 
                                    />
                                    <View style={styles.qrCodeInfo}>
                                        <Text style={styles.qrCodeText}>Donation: {box.DonationTitle}</Text>
                                        <Text style={styles.qrCodeText}>Box: {box.BoxLabel}</Text>
                                        <Text style={styles.qrCodeText}>Packs: {batchLots.length}</Text>
                                        <Text style={styles.qrCodeText}>Donor: {box.DonorName}</Text>
                                        <Text style={styles.qrCodeText}>Recipient: {box.RecipientName}</Text>
                                    </View>
                                </View>
                            </ViewShot>
                        </View>
                    )}
                </ScrollView>
            )}
            {!isLandscape && <BottomNavBar currentScreen="List" />}
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
    title: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
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
        color: '#f9f9f9',
        fontFamily: 'RobotoCondensed-Bold',
        fontSize: 12,
    },
    text: {
        margin: 6,
        textAlign: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    qrCodeContent: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    qrCodeInfo: {
        marginTop: 15,
        alignItems: 'center',
    },
    qrCodeText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        marginVertical: 3,
        textAlign: 'center',
        color: '#000',
    },
    searchBar: {
        height: 40,
        borderColor: '#C1C0B9',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
        fontFamily: 'RobotoCondensed-Regular',
    },
    qrCodeText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        marginBottom: 5,
        color:'#f9f9f9'
    },
    backButtonImage: {
        width: 41,
        height: 15,
        marginLeft: 10,
    },
    backButtonContainer: {
  
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 10,
    },
    headerTitleText: {
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
        color: '#000',
        marginBottom: 10,
    },
    headerButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButton: {
        marginHorizontal: 10,
    },
    headerButtonText: {
        fontSize: 14,
        color: '#00A651',
        fontFamily: 'RobotoCondensed-Bold',
    },
    deleteButtonText: {
        color: '#DC3545',
    },
});

export default BoxDetails;
