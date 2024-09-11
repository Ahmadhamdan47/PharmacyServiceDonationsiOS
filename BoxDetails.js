import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity,Image, useWindowDimensions } from 'react-native';
import axios from 'axios';
import { Table, Row, Rows } from 'react-native-table-component';
import BottomNavBar from './BottomNavBar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import * as Font from 'expo-font';

const BoxDetails = ({ route, navigation }) => {
    const { box } = route.params;
    const [batchLots, setBatchLots] = useState([]);  // Initialize as an empty array
    const [loading, setLoading] = useState(true);
    const [tableHead] = useState(['#', 'Brand Name', 'Presentation', 'Form', 'Laboratory', 'Country', 'GTIN', 'LOT Nb', 'Expiry Date', 'Serial Nb', 'Status']);
    const [widthArr] = useState([30, 100, 80, 80, 100, 80, 100, 80, 80, 100, 100]);
    const { height, width } = useWindowDimensions(); // Get device dimensions
const isLandscape = width > height; // Determine if the device is in landscape mode
const [isFontLoaded, setIsFontLoaded] = useState(false);
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
                    <TouchableOpacity onPress={handleExportAsExcel}>
                        <Text style={styles.headerButtonText}>Export as XLS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity >
                        <Text style={styles.headerButtonText}>Box Qr Code</Text>
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
              marginTop: 42, // Add margin top of 42px to the header title
              position: 'relative', // Ensure the profile container is the reference for positioning the dropdown
                backgroundColor: '#f9f9f9',
                
            },
            headerStyle: {
              height: 100, // Increase the header height to accommodate the margin
              backgroundColor: '#f9f9f9',
          },
            
        });

    
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
    const handleExportAsExcel = async () => {
        // Prepare the data to be exported
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
                `'${lot.GTIN || 'N/A'}`,  // GTIN as text (prefix with a single quote to ensure text format in Excel)
                lot.BatchNumber || 'N/A',
                lot.ExpiryDate || 'N/A',
                lot.SerialNumber || 'N/A',
                lot.Inspection || 'N/A'
            ])
        ];
    
        // Create a new workbook and sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(dataForExcel);
    
        // Append the sheet to the workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Box Details');
    
        // Write the Excel file to a buffer
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    
        // Create a meaningful file name using DonorName, RecipientName, DonationTitle, and BoxLabel
        const fileName = `${box.DonorName}_${box.RecipientName}_${box.DonationTitle}_${box.BoxLabel}.xlsx`.replace(/[/\\?%*:|"<>]/g, '-'); // Replace invalid filename characters
    
        // Create a temporary file to store the Excel file
        const uri = `${FileSystem.documentDirectory}${fileName}`;
    
        // Write the buffer to the file
        await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: FileSystem.EncodingType.Base64,
        });
    
        // Share the file
        await Sharing.shareAsync(uri);
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
                    contentContainerStyle={styles.scrollContentContainer} // Wrap content for vertical scrolling
                >
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
                </ScrollView>
            )}
            {/* Conditionally render BottomNavBarInspection based on orientation */}
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
        marginTop:30,
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
    backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
        marginTop:30,
      },
      headerRightContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 10,
        marginTop:30,
    },
    headerButtonText: {
        fontSize: 14,
        color: '#00A651',
        marginLeft: 15,
        fontFamily: 'RobotoCondensed-Bold',
    },
});

export default BoxDetails;
