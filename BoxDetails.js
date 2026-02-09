import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Image, useWindowDimensions, Platform, TextInput, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
    const [uploadedFileUrl, setUploadedFileUrl] = useState(null); // Store uploaded Excel file URL
    const [isUploadingFile, setIsUploadingFile] = useState(false); // Track upload progress
    
    // Edit box name state
    const [editNameModalVisible, setEditNameModalVisible] = useState(false);
    const [currentBoxLabel, setCurrentBoxLabel] = useState(box.BoxLabel || ''); // State for current box label
    const [newBoxLabel, setNewBoxLabel] = useState(box.BoxLabel || '');
    
    // Delete pack state
    const [deletePackModalVisible, setDeletePackModalVisible] = useState(false);
    const [confirmDeleteModalVisible, setConfirmDeleteModalVisible] = useState(false);
    const [selectedPackForDeletion, setSelectedPackForDeletion] = useState(null);

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
    
    // Sync newBoxLabel when modal opens
    useEffect(() => {
        if (editNameModalVisible) {
            setNewBoxLabel(currentBoxLabel);
        }
    }, [editNameModalVisible, currentBoxLabel]);
    
    // Refresh data when screen gains focus (after adding packs from Donate.js)
    useFocusEffect(
        useCallback(() => {
            fetchSerialNumbers();
        }, [])
    );

    // Auto-regenerate Excel file when batchLots data changes
    useFocusEffect(
        useCallback(() => {
            if (batchLots.length > 0 && !loading) {
                // Regenerate file when data changes (after manual edits)
                uploadExcelFile();
            }
        }, [batchLots])
    );

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                    <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
                </TouchableOpacity>
            ),
            headerRight: () => null,
            headerTitle: () => (
                <View style={styles.headerContainer}>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitleText}>{box.DonationTitle} - {currentBoxLabel}</Text>
                        <TouchableOpacity onPress={() => setEditNameModalVisible(true)} style={styles.editIconButton}>
                            <MaterialCommunityIcons name="pencil" size={18} color="#00A651" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerButtonsRow}>
                        <TouchableOpacity onPress={handleAddPack} style={styles.headerButton}>
                            <Text style={styles.headerButtonText}>Add Pack</Text>
                        </TouchableOpacity>
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
    }, [currentBoxLabel]); // Re-render header when box label changes

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

    const handleEditBoxName = async () => {
        if (!newBoxLabel.trim()) {
            Alert.alert('Error', 'Box name cannot be empty.');
            return;
        }
        
        // Check if nothing has changed
        if (newBoxLabel.trim() === currentBoxLabel.trim()) {
            Alert.alert('No Changes', 'You didn\'t make any changes to the box name.');
            setEditNameModalVisible(false);
            return;
        }
        
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            await axios.put(`https://apiv2.medleb.org/boxes/${box.BoxId}`, 
                { BoxLabel: newBoxLabel.trim() }, 
                { headers }
            );
            
            // Update local box object and state
            box.BoxLabel = newBoxLabel.trim();
            setCurrentBoxLabel(newBoxLabel.trim());
            setEditNameModalVisible(false);
            Alert.alert('Success', 'Box name updated successfully.');
        } catch (error) {
            console.error('Error updating box name:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update box name. Please try again.');
        }
    };
    
    const handleAddPack = () => {
        // Navigate to Donate.js with existing donation and box context
        navigation.navigate('Donate', {
            donationId: box.DonationId || route.params.donationId,
            donorId: box.DonorId || route.params.donorId,
            recipientId: box.RecipientId || route.params.recipientId,
            donationPurpose: box.DonationPurpose || route.params.donationPurpose,
            donationTitle: box.DonationTitle,
            donorName: box.DonorName,
            recipientName: box.RecipientName,
            existingBoxId: box.BoxId,
            existingBoxLabel: currentBoxLabel,
            addToExistingBox: true,
        });
    };
    
    const handleLongPressPack = (pack, index) => {
        setSelectedPackForDeletion({ ...pack, displayIndex: index + 1 });
        setDeletePackModalVisible(true);
    };
    
    const handleDeletePack = async () => {
        if (!selectedPackForDeletion) return;
        
        // Check if this is the last pack in the box
        if (batchLots.length === 1) {
            Alert.alert(
                'Cannot Delete Last Pack',
                'This is the last pack in the box. Please delete the entire box instead.',
                [{ text: 'OK' }]
            );
            setConfirmDeleteModalVisible(false);
            setDeletePackModalVisible(false);
            setSelectedPackForDeletion(null);
            return;
        }
        
        try {
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            // Delete the pack
            await axios.delete(
                `https://apiv2.medleb.org/batchserial/${selectedPackForDeletion.BatchSerialNumberId}`,
                { headers }
            );
            
            // Update box NumberOfPacks
            const newPackCount = batchLots.length - 1;
            await axios.put(
                `https://apiv2.medleb.org/boxes/${box.BoxId}`,
                { NumberOfPacks: newPackCount },
                { headers }
            );
            
            // Close modals
            setConfirmDeleteModalVisible(false);
            setDeletePackModalVisible(false);
            setSelectedPackForDeletion(null);
            
            // Refresh data
            await fetchSerialNumbers();
            
            Alert.alert('Success', 'Pack deleted successfully.');
        } catch (error) {
            console.error('Error deleting pack:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete pack. Please try again.');
        }
    };
    
    const handleDeleteBox = async () => {
        Alert.alert(
            'Delete Box',
            `Are you sure you want to delete ${currentBoxLabel || box.DisplayLabel}? This action cannot be undone.`,
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

    const uploadExcelFile = async () => {
        try {
            setIsUploadingFile(true);
            
            // Generate Excel file
            const dataForExcel = [
                ['Donor Name', 'Recipient Name', 'Donation Title', 'Box Label'],
                [box.DonorName, box.RecipientName, box.DonationTitle, currentBoxLabel],
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

            // Prepare FormData for upload
            const formData = new FormData();
            formData.append('file', {
                uri: uri,
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                name: fileName,
            });

            const metadata = {
                originalName: fileName,
                boxId: box.BoxId,
                donationTitle: box.DonationTitle,
                boxLabel: currentBoxLabel || box.DisplayLabel,
                donorName: box.DonorName,
                recipientName: box.RecipientName,
                numberOfPacks: batchLots.length,
                purpose: 'box_export'
            };
            
            formData.append('metadata', JSON.stringify(metadata));

            // Get auth token and upload
            const token = await AsyncStorage.getItem('token');
            const headers = {
                'Content-Type': 'multipart/form-data',
            };
            
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios.post('https://apiv2.medleb.org/files/upload', formData, { headers });
            
            let fileUrl = response.data.downloadUrl || response.data.url || response.data.fileUrl;
            
            // If the URL is relative, prepend the base URL
            if (fileUrl && !fileUrl.startsWith('http')) {
                fileUrl = `https://apiv2.medleb.org${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
            }
            
            setUploadedFileUrl(fileUrl);
            setIsUploadingFile(false);
            
            return fileUrl;
        } catch (error) {
            setIsUploadingFile(false);
            console.error('Error uploading Excel file:', error);
            Alert.alert('Upload Error', 'Failed to upload box file. Please try again.');
            return null;
        }
    };

    const handleExportAsExcel = async () => {
        try {
            const dataForExcel = [
                ['Donor Name', 'Recipient Name', 'Donation Title', 'Box Label'],
                [box.DonorName, box.RecipientName, box.DonationTitle, currentBoxLabel],
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
            const fileName = `${box.DonorName}_${box.RecipientName}_${box.DonationTitle}_${currentBoxLabel}.xlsx`.replace(/[/\\?%*:|"<>]/g, '-');
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
        try {
            // Upload Excel file first if not already uploaded
            let fileUrl = uploadedFileUrl;
            if (!fileUrl) {
                fileUrl = await uploadExcelFile();
                if (!fileUrl) {
                    return; // Upload failed, error already shown
                }
            }

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
        } catch (error) {
            console.error('Error preparing QR code:', error);
            Alert.alert('Error', 'Failed to prepare QR code.');
        }
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
                                {batchLots.filter(lot => 
                                    !searchQuery || 
                                    (lot.DrugName && lot.DrugName.toLowerCase().includes(searchQuery.toLowerCase()))
                                ).map((lot, index) => (
                                    <TouchableOpacity
                                        key={lot.BatchSerialNumberId || index}
                                        onLongPress={() => handleLongPressPack(lot, index)}
                                        activeOpacity={0.7}
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
                                                formatDate(lot.lastUpdated)
                                            ]}
                                            textStyle={styles.text}
                                            widthArr={widthArr}
                                            style={styles.row}
                                        />
                                    </TouchableOpacity>
                                ))}
                            </Table>
                        </View>
                    </ScrollView>

                    {isQrCodeVisible && (
                        <View style={styles.qrCodeContainer}>
                            <ViewShot ref={qrCodeRef} options={{ format: "png", quality: 0.9 }}>
                                <View style={styles.qrCodeContent}>
                                    <QRCode 
                                        value={uploadedFileUrl || `https://apiv2.medleb.org/files/box/${box.BoxId}`} 
                                        size={150} 
                                    />
                                    <View style={styles.qrCodeInfo}>
                                        <Text style={styles.qrCodeText}>Donation: {box.DonationTitle}</Text>
                                        <Text style={styles.qrCodeText}>Box: {currentBoxLabel}</Text>
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
            
            {/* Edit Box Name Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={editNameModalVisible}
                onRequestClose={() => setEditNameModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setEditNameModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Edit Box Name</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={newBoxLabel}
                            onChangeText={setNewBoxLabel}
                            placeholder="Enter box name"
                            placeholderTextColor="#999"
                        />
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setNewBoxLabel(currentBoxLabel || '');
                                    setEditNameModalVisible(false);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleEditBoxName}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Delete Pack Modal - First Confirmation */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={deletePackModalVisible}
                onRequestClose={() => setDeletePackModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => {
                                setDeletePackModalVisible(false);
                                setSelectedPackForDeletion(null);
                            }}
                        >
                            <Text style={styles.modalCloseText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Delete Pack?</Text>
                        {selectedPackForDeletion && (
                            <View style={styles.packDetailsContainer}>
                                <Text style={styles.packDetailLabel}>Pack #{selectedPackForDeletion.displayIndex}</Text>
                                <Text style={styles.packDetailText}>Brand: {selectedPackForDeletion.DrugName || 'N/A'}</Text>
                                <Text style={styles.packDetailText}>GTIN: {selectedPackForDeletion.GTIN || 'N/A'}</Text>
                                <Text style={styles.packDetailText}>LOT: {selectedPackForDeletion.BatchNumber || 'N/A'}</Text>
                                <Text style={styles.packDetailText}>Serial: {selectedPackForDeletion.SerialNumber || 'N/A'}</Text>
                                <Text style={styles.packDetailText}>Expiry: {selectedPackForDeletion.ExpiryDate || 'N/A'}</Text>
                            </View>
                        )}
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setDeletePackModalVisible(false);
                                    setSelectedPackForDeletion(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={() => {
                                    setDeletePackModalVisible(false);
                                    setConfirmDeleteModalVisible(true);
                                }}
                            >
                                <Text style={styles.deleteButtonText2}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            {/* Delete Pack Modal - Second Confirmation */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={confirmDeleteModalVisible}
                onRequestClose={() => setConfirmDeleteModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => {
                                setConfirmDeleteModalVisible(false);
                                setDeletePackModalVisible(false);
                                setSelectedPackForDeletion(null);
                            }}
                        >
                            <Text style={styles.modalCloseText}>✕</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Are You Sure?</Text>
                        <Text style={styles.modalSubtitle}>This action cannot be undone.</Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setConfirmDeleteModalVisible(false);
                                    setDeletePackModalVisible(false);
                                    setSelectedPackForDeletion(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.deleteButton]}
                                onPress={handleDeletePack}
                            >
                                <Text style={styles.deleteButtonText2}>Yes, Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        backgroundColor: '#fff',
        color: '#000',
        fontFamily: 'RobotoCondensed-Regular',
        fontSize: 12,
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
        color:'#000'
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
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    headerTitleText: {
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
        color: '#000',
    },
    editIconButton: {
        marginLeft: 8,
        padding: 4,
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
    row: {
        height: 40,
        backgroundColor: '#fff',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    modalCloseText: {
        fontSize: 24,
        color: '#666',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'RobotoCondensed-Bold',
        marginBottom: 15,
        marginTop: 10,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Regular',
        marginBottom: 20,
        textAlign: 'center',
        color: '#666',
    },
    modalInput: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#C1C0B9',
        borderRadius: 5,
        paddingHorizontal: 15,
        fontFamily: 'RobotoCondensed-Regular',
        fontSize: 16,
        marginBottom: 20,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 5,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#f0f0f0',
    },
    cancelButtonText: {
        color: '#333',
        fontFamily: 'RobotoCondensed-Bold',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#00A651',
    },
    saveButtonText: {
        color: '#fff',
        fontFamily: 'RobotoCondensed-Bold',
        fontSize: 16,
    },
    deleteButton: {
        backgroundColor: '#DC3545',
    },
    deleteButtonText2: {
        color: '#fff',
        fontFamily: 'RobotoCondensed-Bold',
        fontSize: 16,
    },
    packDetailsContainer: {
        width: '100%',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
    },
    packDetailLabel: {
        fontSize: 18,
        fontFamily: 'RobotoCondensed-Bold',
        marginBottom: 10,
        color: '#333',
    },
    packDetailText: {
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Regular',
        marginBottom: 5,
        color: '#666',
    },
});

export default BoxDetails;
