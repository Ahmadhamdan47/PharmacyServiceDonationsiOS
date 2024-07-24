import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Keyboard, BackHandler } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import { useNavigation } from '@react-navigation/native';

const Inspect = () => {
    const navigation = useNavigation();
    const scrollViewRef = useRef(null);
    const batchLotRefs = useRef([]);
    const [batchLot, setBatchLot] = useState(createEmptyBatchLot());
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [type, setType] = useState(CameraType.back);
    const [permission, setPermission] = useState(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    const [inspectionMessage, setInspectionMessage] = useState('');

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setPermission(status === 'granted');
        })();
    }, []);

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
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Yes',
                    onPress: () => navigation.navigate('AdminLanding'),
                },
            ],
            { cancelable: false }
        );
    };

    const handleBarcodeDetected = ({ type, data }) => {
        try {
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

            setTimeout(() => {
                const currentRef = batchLotRefs.current[0];
                if (currentRef) {
                    currentRef.measureLayout(scrollViewRef.current, (x, y) => {
                        scrollViewRef.current.scrollTo({ y, animated: true });
                    });
                }
            }, 100);
        } catch (error) {
            console.error("Error parsing scanned data:", error);
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

    const handleFieldChange = (field, value) => {
        setBatchLot(prevBatchLot => ({
            ...prevBatchLot,
            [field]: value
        }));
    };

    const validateFields = () => {
        const errors = {};
        const requiredFields = ['gtin', 'lotNumber', 'expiryDate', 'serialNumber'];
        requiredFields.forEach(field => {
            if (!batchLot[field] || batchLot[field].trim() === '') {
                errors[field] = 'This field is required';
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInspect = async () => {
        if (!validateFields()) {
            return;
        }
        try {
            const response = await fetch('https://apiv2.medleb.org/drugs/checkMate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    GTIN: batchLot.gtin,
                    BatchNumber: batchLot.lotNumber,
                    SerialNumber: batchLot.serialNumber,
                    ExpiryDate: batchLot.expiryDate
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Inspection failed. Please check your inputs.');
            }

            const data = await response.json();
            setInspectionMessage(data.message.messageEN || 'Inspection successful.');
        } catch (error) {
            setInspectionMessage(error.message);
        }
    };

    return (
        <View style={styles.container}>
            {isCameraOpen ? (
                <BarCodeScanner
                    style={{ ...StyleSheet.absoluteFillObject, height: '100%' }}
                    type={type}
                    onBarCodeScanned={handleBarcodeDetected}
                />
            ) : (
                <ScrollView
                    ref={scrollViewRef}
                    onScroll={event => setScrollPosition(event.nativeEvent.contentOffset.y)}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ flexGrow: 1 }}
                >
                    <View style={styles.originalFormContainer}>
                        <TouchableOpacity onPress={() => handleOpenCamera()} activeOpacity={0.6} style={styles.cameraContainer} ref={el => batchLotRefs.current[0] = el}>
                            {batchLot.gtin === '' && (
                                <Image
                                    source={require("./assets/2d.png")}
                                    style={styles.cameraImage}
                                />
                            )}
                        </TouchableOpacity>

                        <View style={styles.barcodeContainer}>
                            <TextInput
                                style={[styles.input, validationErrors.gtin ? styles.inputError : null]}
                                placeholder="GTIN"
                                value={batchLot.gtin}
                                onChangeText={text => handleFieldChange('gtin', text)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                            />
                            {validationErrors.gtin && (
                                <Text style={styles.errorMessage}>{validationErrors.gtin}</Text>
                            )}

                            <FieldLabel label="LOT Number" />
                            <TextInput
                                style={[styles.input, validationErrors.lotNumber ? styles.inputError : null]}
                                placeholder="LOT Number"
                                value={batchLot.lotNumber}
                                onChangeText={text => handleFieldChange('lotNumber', text)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                            />
                            {validationErrors.lotNumber && <Text style={styles.errorMessage}>{validationErrors.lotNumber}</Text>}

                            <FieldLabel label="Expiry Date" />
                            <TextInput
                                style={[styles.input, validationErrors.expiryDate ? styles.inputError : null]}
                                placeholder="Expiry Date"
                                value={batchLot.expiryDate}
                                onChangeText={text => handleFieldChange('expiryDate', text)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                            />
                            {validationErrors.expiryDate && <Text style={styles.errorMessage}>{validationErrors.expiryDate}</Text>}

                            <FieldLabel label="Serial Number" />
                            <TextInput
                                style={[styles.input, validationErrors.serialNumber ? styles.inputError : null]}
                                placeholder="Serial Number"
                                value={batchLot.serialNumber}
                                onChangeText={text => handleFieldChange('serialNumber', text)}
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
                            />
                            {validationErrors.serialNumber && <Text style={styles.errorMessage}>{validationErrors.serialNumber}</Text>}
                        </View>
                    </View>

                    {inspectionMessage !== '' && (
                        <View style={styles.inspectionMessageContainer}>
                            <Text style={styles.inspectionMessage}>{inspectionMessage}</Text>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={handleInspect}>
                            <Text style={styles.buttonText}>Inspect</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}
            {!isCameraOpen && !isInputFocused && (
                <View style={styles.taskBar}>
                    <TouchableOpacity onPress={() => navigation.navigate('AdminLanding')}>
                        <Image
                            source={require("./assets/home.png")}
                            style={styles.taskBarButton}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('List')}>
                        <Image
                            source={require("./assets/list.png")}
                            style={styles.taskBarButton}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('Inspect')}>
                        <Image
                            source={require("./assets/Inspection.png")}
                            style={styles.taskBarButtonInspect}
                        />
                    </TouchableOpacity>
                </View>
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

const FieldLabel = ({ label }) => (
    <Text style={styles.fieldLabel}>{label}</Text>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f0f0',
    },
    cameraContainer: {
        marginBottom: 20,
        alignItems: 'center',
        width: '100%',
    },
    cameraImage: {
        width: 280,
        height: 140,
        resizeMode: "contain",
    },
    barcodeContainer: {
        marginBottom: 20,
    },
    barcodeInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    barcodeIcon: {
        position: 'absolute',
        right: -20,
        top: -5,
        height: 50,
        width: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    barcodeImage: {
        width: '100%',
        height: '100%',
        resizeMode: "contain",
    },
    fieldLabel: {
        color: '#707070',
        fontSize: 16,
        marginBottom: 5,
        marginLeft: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#00a651',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
        width: '90%',
        alignSelf: 'center',
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: 'red',
    },
    errorMessage: {
        color: 'red',
        marginLeft: 20,
        marginBottom: 10,
    },
    separator: {
        height: 2,
        backgroundColor: '#ccc',
        width: '100%',
        marginBottom: 20,
    },
    detailsContainer: {
        padding: 20,
    },
    header: {
        fontSize: 18,
        color: '#00a651',
        fontWeight: 'bold',
        marginBottom: 10,
        alignSelf: 'center',
    },
    buttonContainer: {
        marginHorizontal: 20,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#00a651',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        width: '90%',
        alignSelf: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    taskBar: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        position: 'absolute',
        bottom: '2%',
        backgroundColor: '#f0f0f0',
    },
    taskBarButton: {
        width: 25,
        height: 25,
        resizeMode: "contain",
        marginTop: 6,
    },
    taskBarButtonInspect: {
        width: 30,
        height: 30,
        resizeMode: "contain",
    },
    inspectionMessageContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    inspectionMessage: {
        fontSize: 18,
        color: '#00a651',
        textAlign: 'center',
        marginHorizontal: 20,
    },
});

export default Inspect;
