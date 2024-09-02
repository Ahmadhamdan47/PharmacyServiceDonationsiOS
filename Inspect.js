import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, StyleSheet, Keyboard, BackHandler } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection

const Inspect = () => {
    const navigation = useNavigation();
    const scrollViewRef = useRef(null);
    const batchLotRefs = useRef([]);
    const [batchLot, setBatchLot] = useState(createEmptyBatchLot());
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [type, setType] = useState(CameraType.back);
    const [permission, setPermission] = useState(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [inspectionMessage, setInspectionMessage] = useState('');
    const [username, setUsername] = useState('');
    const [selectedOption, setSelectedOption] = useState('Packs'); // Default to 'Packs'

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
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.profileContainer}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>{username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.profileText}>{username}</Text>
                </View>
            ),
            headerTitleAlign: 'center',
        });
    }, [navigation, username]);

    useEffect(() => {
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setIsInputFocused(false)
        );

        const backAction = () => {
            showExitConfirmation();
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
                { text: 'Yes', onPress: () => navigation.navigate('AdminLanding') },
            ],
            { cancelable: false }
        );
    };

    const handleBarcodeDetected = async ({ type, data }) => {
        try {
            if (selectedOption === 'Packs') {
                // Existing logic for Packs
                const response = extractDataMatrix(data);
                const updatedBatchLot = {
                    ...batchLot,
                    gtin: response.gtin,
                    lotNumber: response.lot,
                    expiryDate: response.exp ? response.exp.toISOString().split('T')[0] : '',
                    serialNumber: response.sn,
                };
    
                setBatchLot(updatedBatchLot);
                setIsCameraOpen(false);
    
                // Automatically call CheckMate API after extracting data
                await handleInspect(updatedBatchLot);
    
            } else if (selectedOption === 'Boxes') {
                // New logic for Boxes
                const boxId = data; // Assuming the barcode only contains the BoxId
                setIsCameraOpen(false);
                
                // Directly navigate to BoxInspection passing the BoxId
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

    const validateFields = (batchLotData) => {
        const errors = {};
        const requiredFields = ['gtin', 'lotNumber', 'expiryDate', 'serialNumber'];
        requiredFields.forEach(field => {
            if (!batchLotData[field] || batchLotData[field].trim() === '') {
                errors[field] = 'This field is required';
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInspect = async (batchLotData) => {
        if (!validateFields(batchLotData)) {
            return;
        }
        try {
            const response = await fetch('https://apiv2.medleb.org/drugs/checkMate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            setInspectionMessage(data.message.messageEN || 'Inspection successful.');

            if (response.ok && data.message.isValid && data.message.batchLot) {
                // Fetch the BoxLabel using the BoxId
                const boxLabel = await fetchBoxLabel(data.message.batchLot.BoxId);
                const donationId = await fetchDonationId(data.message.batchLot.BoxId)
                console.log(data.message.batchLot.BatchLotId);
                // Navigate to PackInspection with the batch and box information
                navigation.navigate('PackInspection', {
                    batchLot: { 
                        ...batchLotData, 
                        drugName: data.message.batchLot.DrugName,
                        donationId:donationId,
                        form: data.message.batchLot.Form,
                        presentation: data.message.batchLot.Presentation,
                        quantity: data.message.batchLot.Quantity,
                        owner: data.message.batchLot.Laboratory,
                        country: data.message.batchLot.LaboratoryCountry,
                        boxId: data.message.batchLot.BoxId,
                        boxLabel: boxLabel,
                        batchLotId: data.message.batchLot.BatchLotId
                    }
                });
            }
        } catch (error) {
            setInspectionMessage(error.message);
        }
    };

    // Function to fetch the BoxLabel using BoxId
    const fetchBoxLabel = async (boxId) => {
        try {
            const response = await fetch(`https://apiv2.medleb.org/boxes/${boxId}`);
            
            // Log the full response for debugging
            console.log('Full response:', response);
    
            // Check if the response is OK and in JSON format
            const contentType = response.headers.get('content-type');
            if (!response.ok || !contentType || !contentType.includes('application/json')) {
                const textResponse = await response.text();  // Read the text response for debugging
                console.error('Error: Response not JSON or not OK', textResponse);
                throw new Error('Failed to fetch box label or response is not JSON');
            }
    
            const data = await response.json();
            console.log('JSON response data:', data);
            return data.BoxLabel;
        } catch (error) {
            console.error('Error fetching box label:', error);
            return '';
        }
    };
    
const fetchDonationId = async (boxId) => { try {
        const response = await fetch(`https://apiv2.medleb.org/boxes/${boxId}`);
        
        // Log the full response for debugging
        console.log('Full response:', response);

        // Check if the response is OK and in JSON format
        const contentType = response.headers.get('content-type');
        if (!response.ok || !contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();  // Read the text response for debugging
            console.error('Error: Response not JSON or not OK', textResponse);
            throw new Error('Failed to fetch Donation Id or response is not JSON');
        }

        const data = await response.json();
        console.log('JSON response data:', data);
        return data.DonationId;
    } catch (error) {
        console.error('Error fetching Donation ID:', error);
        return '';
    }
};
    return (
        <View style={styles.container}>
            {isCameraOpen ? (
                <BarCodeScanner
                    style={StyleSheet.absoluteFillObject}
                    type={type}
                    onBarCodeScanned={handleBarcodeDetected}
                />
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    onScroll={event => setScrollPosition(event.nativeEvent.contentOffset.y)}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.scrollViewContainer}
                >
                    {/* Dropdown Button */}
                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setSelectedOption(selectedOption === 'Packs' ? 'Boxes' : 'Packs')}>
    <Text style={styles.dropdownButtonText}>{selectedOption}</Text>
    <Text style={styles.dropdownArrow}>▼</Text>
</TouchableOpacity>
                    {/* Barcode Scanner Icon */}
                    <TouchableOpacity onPress={handleOpenCamera} style={styles.cameraButton}>
                        <Image source={require("./assets/2d.png")} style={styles.cameraImage} />
                    </TouchableOpacity>

                    {inspectionMessage !== '' && (
                        <View style={styles.inspectionMessageContainer}>
                            <Text style={styles.inspectionMessage}>{inspectionMessage}</Text>
                        </View>
                    )}
                </ScrollView>
            )}

            {/* Bottom Navigation Bar */}
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
        backgroundColor: '#fff',
    },
    scrollViewContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    profileContainer: {
        alignItems: 'center',
        marginRight: 15,
    },
    circle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#00A651',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    circleText: {
        fontSize: 16,
        color: '#00A651',
        fontWeight: 'bold',
    },
    profileText: {
        fontSize: 14,
        color: '#000',
        fontWeight: 'bold',
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 20,
    },
    dropdownButtonText: {
        fontSize: 16,
        color: '#00A651',
        fontWeight: 'bold',
    },
    dropdownArrow: {
        marginLeft: 10,
        fontSize: 16,
        color: '#00A651',
    },
    cameraButton: {
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'visible',
    },
    cameraImage: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
        marginBottom: 150,
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
});

export default Inspect;
