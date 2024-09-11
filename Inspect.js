import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Image, ScrollView, TouchableOpacity, Alert, StyleSheet, Keyboard, BackHandler, StatusBar } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection
import axios from 'axios';
import * as Font from 'expo-font';


const Inspect = ({ route }) => {
    const navigation = useNavigation();
    const scrollViewRef = useRef(null);
    const [batchLot, setBatchLot] = useState(createEmptyBatchLot());
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [type, setType] = useState(CameraType.back);
    const [permission, setPermission] = useState(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [inspectionMessage, setInspectionMessage] = useState('');
    const [username, setUsername] = useState('');
    const [selectedOption, setSelectedOption] = useState('Packs'); // Default to 'Packs'
    const [isFieldsVisible, setIsFieldsVisible] = useState(false); // Show fields after a successful scan
    const [isCheckButtonVisible, setIsCheckButtonVisible] = useState(false); // Show Check button after scanning
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
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setPermission(status === 'granted');
        })();

        const getUsername = async () => {
            try {
                const storedUsername = await AsyncStorage.getItem('username');
                if (storedUsername) {
                    setUsername(storedUsername);
                }
            } catch (error) {
                console.error('Failed to load username:', error);
            }
        };

        getUsername();
    }, []);
    useEffect(() => {
        // Reset fields when 'reset' flag is passed
        if (route.params?.reset) {
            setBatchLot(createEmptyBatchLot());
            setIsFieldsVisible(false);  // Hide the fields
            setIsCheckButtonVisible(false);  // Hide the Check button
        }
    }, [route.params?.reset]);
    useEffect(() => {
        
        navigation.setOptions({
            headerTitle: 'Inspect',

            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                   
                    <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <View style={styles.profileContainer}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.profileText}>{username}</Text>
                </View>
            ),
            headerTitleAlign: 'center',
            headerTitleStyle: 
            {    fontFamily: 'RobotoCondensed-Bold',
            },
            headerStyle: {
          
              backgroundColor: '#f9f9f9', // Set the background color of the whole navigation bar
              elevation: 0,            // Remove shadow on Android
              shadowOpacity: 0,        // Remove shadow on iOS
              borderBottomWidth: 0,  
            },
        });
    }, [navigation, username]);

    useEffect(() => {
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setIsInputFocused(false)
        );

        const backAction = () => {
            navigation.navigate('Landing');
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

        return () => {
            keyboardDidHideListener.remove();
            backHandler.remove();
        };
    }, []);

    const showExitConfirmation = () => {
        Alert.alert(
            'Confirm Exit',
            'Are you sure you want to go back?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes', onPress: () => navigation.navigate('Landing') },
            ],
            { cancelable: false }
        );
    };

    const handleBarcodeDetected = async ({ type, data }) => {
        try {
            if (selectedOption === 'Packs') {
                // Extract data from barcode
                const response = extractDataMatrix(data);
                const updatedBatchLot = {
                    ...batchLot,
                    gtin: response.gtin,
                    lotNumber: response.lot,
                    expiryDate: response.exp ? response.exp.toISOString().split('T')[0] : '',
                    serialNumber: response.sn,
                };

                setBatchLot(updatedBatchLot);
                setIsCameraOpen(false);  // Close the camera after the scan
                setIsFieldsVisible(true); // Show fields after scan
                setIsCheckButtonVisible(true); // Show Check button after scan

            } else if (selectedOption === 'Boxes') {
                const boxId = data;
                setIsCameraOpen(false);
                navigation.navigate('BoxInspection', { boxId });
            }
        } catch (error) {
            console.error("Error processing scanned data:", error);
        }
    };

    const extractDataMatrix = (code) => {
        const response = { gtin: '', lot: '', sn: '', exp: null };
        let responseCode = code;

        const prefixes = [
            { prefix: '01', key: 'gtin', length: 14 },
            { prefix: '17', key: 'exp', length: 6 }
        ];

        prefixes.forEach(({ prefix, key, length }) => {
            const position = responseCode.indexOf(prefix);
            if (position !== -1) {
                const start = position + prefix.length;
                const end = start + length;
                response[key] = key === 'exp' ? parseExpiryDate(responseCode.substring(start, end)) : responseCode.substring(start, end);
                responseCode = responseCode.slice(0, position) + responseCode.slice(end);
            }
        });

        const lotAndSn = extractLotAndSn(responseCode);
        response.lot = lotAndSn.lot;
        response.sn = lotAndSn.sn;

        return response;
    };

    const extractLotAndSn = (responseCode) => {
        const lotPattern = /10([^\u001d]*)/;
        const snPattern = /21([^\u001d]*)/;

        const snMatch = responseCode.match(snPattern);
        let sn = '';
        let lot = '';

        if (snMatch) {
            const snPosition = snMatch.index;
            sn = snMatch[1].trim();
            const remainingCode = responseCode.slice(0, snPosition) + responseCode.slice(snPosition + snMatch[0].length);

            const lotMatch = remainingCode.match(lotPattern);
            if (lotMatch) {
                lot = lotMatch[1].trim();
            }
        } else {
            const lotMatch = responseCode.match(lotPattern);
            if (lotMatch) {
                lot = lotMatch[1].trim();
            }
        }

        return { lot, sn };
    };

    const parseExpiryDate = (expDateString) => {
        const year = parseInt(expDateString.substring(0, 2)) + 2000;
        const month = parseInt(expDateString.substring(2, 4)) - 1;
        const day = parseInt(expDateString.substring(4, 6));
        return new Date(year, month, day);
    };

    const handleOpenCamera = async () => {
        if (permission === null) {
            const { status } = await Camera.requestPermissionsAsync();
            setPermission(status === 'granted');
            setIsCameraOpen(status === 'granted');
            if (!status === 'granted') {
                Alert.alert('Permission denied', 'Camera permission is required to use the camera.');
            }
        } else if (permission === false) {
            Alert.alert('Permission denied', 'Camera permission is required to use the camera.');
        } else {
            setIsCameraOpen(true);
        }
    };

    const handleInspect = async (batchLotData) => {
        try {
            const response = await fetch('https://apiv2.medleb.org/batchserial/checkDonationStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    GTIN: batchLotData.gtin,
                    BatchNumber: batchLotData.lotNumber,
                    SerialNumber: batchLotData.serialNumber,
                    ExpiryDate: batchLotData.expiryDate
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Inspection failed. Please check your inputs.');
            }
    
            const data = await response.json();
            const { isValid, isDonated, batchLot } = data;
    
            if (isValid && isDonated) {
                setInspectionMessage('');
                let boxLabel = '';
                let donationId = '';
                let serialNumberId = '';
    
                if (batchLot.BoxId) {
                    boxLabel = await fetchBoxLabel(batchLot.BoxId);
                    donationId = await fetchDonationId(batchLot.BoxId);
                }
    
                serialNumberId = await fetchSerialNumberId(batchLotData.serialNumber);
    
                navigation.navigate('PackInspection', {
                    batchLot: { 
                        ...batchLotData, 
                        drugName: batchLot.DrugName,
                        donationId: donationId,
                        form: batchLot.Form,
                        presentation: batchLot.Presentation,
                        quantity: batchLot.Quantity,
                        owner: batchLot.Laboratory,
                        country: batchLot.LaboratoryCountry,
                        boxId: batchLot.BoxId,
                        boxLabel: boxLabel,
                        batchLotId: batchLot.BatchLotId,
                        serialNumberId: serialNumberId
                    }
                });
    
            } else if (isValid && !isDonated) {
                Alert.alert('Drug Status', 'This drug is already found in our database but not donated.', [{ text: 'OK' }]);
            } else if (!isValid) {
                Alert.alert('Drug Status', 'This drug is not found in our database.', [{ text: 'OK' }]);
            }
        } catch (error) {
            setInspectionMessage(error.message);
        }
    };
    
    

    const fetchSerialNumberId = async (serialNumber) => {
        try {
            // Make the GET request using axios with the correct URL and string interpolation
            const response = await axios.get(`https://apiv2.medleb.org/batchserial/${serialNumber}`);
            
            // Since axios automatically handles JSON parsing, just access the data
            return response.data.BatchSerialNumberId;
            
        } catch (error) {
            if (error.response) {
                // The request was made and the server responded with a status code not in the 2xx range
                console.error('Error fetching serial number ID:', error.response.data);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
            } else {
                // Something else happened during the request setup
                console.error('Error setting up request:', error.message);
            }
            return null;
        }
    };
    

const fetchBoxLabel = async (boxId) => {
    try {
        const response = await axios.get(`https://apiv2.medleb.org/boxes/${boxId}`);
        console.log('Box Data:', response.data); // Log the data for debugging
        return response.data.BoxLabel;  // axios automatically parses the JSON
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code outside 2xx
            console.error('Error fetching box label:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error: No response from server', error.request);
        } else {
            // Something happened in setting up the request
            console.error('Error setting up request:', error.message);
        }
        return '';
    }
};
const fetchDonationId = async (boxId) => {
    try {
        const response = await axios.get(`https://apiv2.medleb.org/boxes/${boxId}`);
        return response.data.DonationId;  // axios automatically handles JSON parsing
    } catch (error) {
        if (error.response) {
            console.error('Error fetching donation ID:', error.response.data);
        } else if (error.request) {
            console.error('Error: No response from server', error.request);
        } else {
            console.error('Error setting up request:', error.message);
        }
        return '';
    }
};


    
    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#f9f9f9"/>

            {isCameraOpen ? (
                <BarCodeScanner
                    style={StyleSheet.absoluteFillObject}
                    type={type}
                    onBarCodeScanned={handleBarcodeDetected}
                />
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollViewContainer}
                >
                    {/* Show picker and scan button only before the scan */}
                    {!isFieldsVisible && (
                        <>
                            {/* Dropdown Button */}
                            <TouchableOpacity style={styles.dropdownButton} onPress={() => setSelectedOption(selectedOption === 'Packs' ? 'Boxes' : 'Packs')}>
                                <Text style={styles.dropdownButtonText}>{selectedOption}</Text>
                            </TouchableOpacity>

                            {/* Scan Barcode Button */}
                            <TouchableOpacity onPress={handleOpenCamera} style={styles.cameraButton}>
                                <Image source={require("./assets/2dBig.png")} style={styles.cameraImage} />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Show fields and Check button after a successful scan */}
                    {isFieldsVisible && (
                        <>
                            <View style={styles.inputContainer}>
                                <Text>GTIN *</Text>
                                <TextInput 
                                    style={styles.inputField}
                                    value={batchLot.gtin}
                                    onChangeText={text => setBatchLot({ ...batchLot, gtin: text })}
                                />
                                <Text>LOT/Batch Number *</Text>
                                <TextInput 
                                    style={styles.inputField}
                                    value={batchLot.lotNumber}
                                    onChangeText={text => setBatchLot({ ...batchLot, lotNumber: text })}
                                />
                                <Text>Expiry Date *</Text>
                                <TextInput 
                                    style={styles.inputField}
                                    value={batchLot.expiryDate}
                                    onChangeText={text => setBatchLot({ ...batchLot, expiryDate: text })}
                                />
                                <Text>Serial Number *</Text>
                                <TextInput 
                                    style={styles.inputField}
                                    value={batchLot.serialNumber}
                                    onChangeText={text => setBatchLot({ ...batchLot, serialNumber: text })}
                                />
                            </View>

                            {/* Show Check Button after fields are visible */}
                            {isCheckButtonVisible && (
                                <TouchableOpacity style={styles.checkButton} onPress={() => handleInspect(batchLot)}>
                                    <Text style={styles.checkButtonText}>Check</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}

                    {inspectionMessage !== '' && (
                        <View style={styles.inspectionMessageContainer}>
                            <Text style={styles.inspectionMessage}>{inspectionMessage}</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {!isCameraOpen && !isInputFocused && (
                <BottomNavBarInspection currentScreen="Inspect" />
            )}
        </View>
    );
};

const createEmptyBatchLot = () => ({
    gtin: '',
    lotNumber: '',
    expiryDate: '',
    serialNumber: '',
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    scrollViewContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    profileContainer: {
        width: 47,
        height: 16,
        backgroundColor: '#f9f9f9',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
        marginRight:24,
        marginLeft: 103,
        marginBottom:30,
        
        position: 'relative', // Ensure the profile container is the reference for positioning the dropdown
    
      },
      circle: {
        backgroundColor: '#f9f9f9',
        width: 40,
        height: 40,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
        marginLeft:5,
      },
      circleText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
    
        fontSize: 20,
        color: '#00A651',
        fontFamily: 'RobotoCondensed-Bold',
        marginBottom:2,
      },
      profileText: {
        backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background
    
        fontSize: 14,
        color: '#000',
        fontFamily: 'RobotoCondensed-Bold',
        textAlign: 'left',
        
      },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 100,
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#00A651',
        fontFamily: 'RobotoCondensed-Bold',
    },
    dropdownArrow: {
        marginLeft: 10,
        fontSize: 16,
        color: '#00A651',
    },
    inputContainer: {
        width: '90%',
        paddingVertical: 10,
    },
    inputField: {
        borderColor: '#00A651',
        borderWidth: 1,
        borderRadius: 25,
        padding: 10,
        marginBottom: 10,
        height:35,
        fontFamily: 'RobotoCondensed-Bold',

    },
    cameraButton: {
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'visible',
    },
    cameraImage: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
        marginBottom: 130,
    },
    checkButton: {
        backgroundColor: '#00A651',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
    },
    checkButtonText: {
        color: '#fff',
        fontFamily: 'RobotoCondensed-Bold',
        textAlign: 'center',
    },
    inspectionMessageContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    inspectionMessage: {
        fontSize: 18,
        color: '#00A651',
        textAlign: 'center',
        marginHorizontal: 20,
    },
    backButtonImage: {
        width: 41,  // Adjust the size of the back button image
        height: 15,
        marginLeft: 10,
     
      },
});

export default Inspect;
    