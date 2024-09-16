import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import axios from 'axios';
import { Table, Row, Rows } from 'react-native-table-component';
import BottomNavBar from './BottomNavBar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import * as Font from 'expo-font';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from "react-native-view-shot"; // Import view-shot to capture QR code

const BoxDetails = ({ route, navigation }) => {
    const { box } = route.params;
    const [batchLots, setBatchLots] = useState([]);  // Initialize as an empty array
    const [loading, setLoading] = useState(true);
    const [tableHead] = useState(['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Status']);
    const [widthArr] = useState([30, 100, 80, 80, 100, 80, 100, 80, 80, 100, 100]);
    const { height, width } = useWindowDimensions(); // Get device dimensions
    const isLandscape = width > height; // Determine if the device is in landscape mode
    const [isFontLoaded, setIsFontLoaded] = useState(false);
    const [isQrCodeVisible, setIsQrCodeVisible] = useState(false); // Start with the QR code hidden
    const qrCodeRef = useRef(); // Reference for capturing QR code

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
        headerRight: () => (
            <View style={styles.headerRightContainer}>
                <TouchableOpacity onPress={handleQrCodeShare}>
                    <Text style={styles.headerButtonText}>Box QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleExportAsExcel}>
                    <Text style={styles.headerButtonText}>Export as XLS</Text>
                </TouchableOpacity>
            </View>
        ),
        headerTitle: () => (
            <View>
                <Text style={styles.title}> {box.DonationTitle} - {box.BoxLabel} </Text>
            </View>
        ),
        headerTitleAlign: 'left',
        headerTitleStyle: {
            marginTop: 42,
            position: 'relative',
            backgroundColor: '#f9f9f9',
        },
        headerStyle: {
            height: 100,
            backgroundColor: '#f9f9f9',
        },
    });

    const fetchSerialNumbers = async () => {
        try {
            const response = await axios.get(`https://apiv2.medleb.org/batchserial/byBox/${box.BoxId}`);
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

    const handleExportAsExcel = async () => {
        const dataForExcel = [
            ['Donor Name', 'Recipient Name', 'Donation Title', 'Box Label'],
            [box.DonorName, box.RecipientName, box.DonationTitle, box.BoxLabel],
            [],
            ['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Status'],
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
                lot.Inspection || 'N/A'
            ])
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
        XLSX.utils.book_append_sheet(wb, ws, 'Box Details');

        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileName = `${box.DonorName}_${box.RecipientName}_${box.DonationTitle}_${box.BoxLabel}.xlsx`.replace(/[/\\?%*:|"<>]/g, '-');
        const uri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: FileSystem.EncodingType.Base64,
        });
        await Sharing.shareAsync(uri);
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
                                        lot.Inspection === 'inspected' ? (
                                            <Image
                                                source={lot.inspectedBy === 'Pack' ? require('./assets/checkGreen.png') : require('./assets/checkWhite.png')}
                                                style={{ width: 11, height: 11, alignSelf: 'center' }}
                                            />
                                        ) : lot.Inspection || 'N/A'
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
                                <QRCode value={box.BoxId.toString()} size={150} />
                                <View style={styles.qrCodeInfo}>
                                <Text style={styles.qrCodeText}>Donation Title: {box.DonationTitle}</Text>
                                <Text style={styles.qrCodeText}>Box Number: {box.BoxLabel}</Text>
                                <Text style={styles.qrCodeText}>Donor: {box.DonorName}</Text>
                                <Text style={styles.qrCodeText}>Recipient: {box.RecipientName}</Text>
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
        marginTop: 30,
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
        fontSize: 10,
        fontFamily: 'RobotoCondensed-Regular',
    },
    qrCodeContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    qrCodeInfo: {
        marginTop: 10,
        alignItems: 'center',
    },
    qrCodeText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        marginBottom: 5,
        color:'#fff'
    },
    backButtonImage: {
        width: 41,
        height: 15,
        marginLeft: 10,
        marginTop: 30,
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
        marginLeft: 15,
        fontFamily: 'RobotoCondensed-Bold',
    },
});

export default BoxDetails;
