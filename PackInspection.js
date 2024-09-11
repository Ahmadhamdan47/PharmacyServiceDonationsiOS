import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, StatusBar   } from 'react-native';
import axios from 'axios';
import BottomNavBarInspection from './BottomNavBarInspection';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Font from 'expo-font';

const PackInspection = ({ route }) => {
    const { batchLot } = route.params;
    const [donationTitle, setDonationTitle] = useState('');
    const [donorName, setDonorName] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [username, setUsername] = useState('');
    const navigation = useNavigation();
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
        const fetchDonationDetails = async () => {
            try {
                // Fetch donation details to get DonorId and RecipientId
                const donationResponse = await fetch(`https://apiv2.medleb.org/donation/${batchLot.donationId}`);
                const donationData = await donationResponse.json();
                setDonationTitle(donationData.DonationTitle);

                // Fetch DonorName
                if (donationData.DonorId) {
                    const donorResponse = await fetch(`https://apiv2.medleb.org/donor/${donationData.DonorId}`);
                    const donorData = await donorResponse.json();
                    setDonorName(donorData.DonorName);
                }

                // Fetch RecipientName
                if (donationData.RecipientId) {
                    const recipientResponse = await fetch(`https://apiv2.medleb.org/recipient/${donationData.RecipientId}`);
                    const recipientData = await recipientResponse.json();
                    setRecipientName(recipientData.RecipientName);
                }
            } catch (error) {
                console.error('Error fetching donation, donor, or recipient details:', error);
            }
        };

        if (batchLot.donationId) {
            fetchDonationDetails();
        }
    }, [batchLot.donationId]);

    useEffect(() => {
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
            headerTitle: '',

            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                    <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>{donorName}</Text>
                    <Text style={styles.headerTitle}>{recipientName}</Text>
                    <Text style={styles.headerTitle}>{batchLot.boxLabel}</Text>
                    <Text style={styles.headerTitle}>{donationTitle}</Text>
                    
                </View>
            ),
           
            headerTitleAlign: 'left',

          
           
            headerStyle: {
                backgroundColor: '#f9f9f9', // Set the background color of the whole navigation bar
                elevation: 0,            // Remove shadow on Android
                shadowOpacity: 0,        // Remove shadow on iOS
                borderBottomWidth: 0, 
          },
          headerTitleStyle: {
            fontSize: 16,
            fontFamily: 'RobotoCondensed-Bold',
            marginRight:12,
        },
        });
    }, [navigation, username, donationTitle, donorName, recipientName]);

    const handleInspect = async () => {
        try {
            const response = await axios.put(`https://apiv2.medleb.org/batchserial/inspect/${batchLot.serialNumberId}`);
            if (response.status === 200) {
                Alert.alert('Success', 'Pack marked as inspected.', [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset the Inspect page to initial state
                            navigation.navigate('Inspect', {
                                reset: true,  // Send a flag to reset the page
                            });
                        },
                    }
                ]);
            } else {
                throw new Error('Failed to update status to inspected.');
            }
        } catch (error) {
            console.error('Error inspecting Pack:', error);
            Alert.alert('Alert', 'This drug was already inspected.', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Reset the Inspect page to initial state
                        navigation.navigate('Inspect', {
                            reset: true,  // Send a flag to reset the page
                        });
                    },
                }
            ]);
        }
    };
    
    const handleReject = async () => {
        try {
            const response = await axios.put(`https://apiv2.medleb.org/batchserial/reject/${batchLot.serialNumberId}`);
            if (response.status === 200) {
                Alert.alert('Success', 'Pack marked as rejected.', [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset the Inspect page to initial state
                            navigation.navigate('Inspect', {
                                reset: true,  // Send a flag to reset the page
                            });
                        },
                    }
                ]);
            } else {
                throw new Error('Failed to update status to rejected.');
            }
        } catch (error) {
            console.error('Error rejecting Pack:', error);
            Alert.alert('Alert', 'This pack was already rejected.', [
                {
                    text: 'OK',
                    onPress: () => {
                        // Reset the Inspect page to initial state
                        navigation.navigate('Inspect', {
                            reset: true,  // Send a flag to reset the page
                        });
                    },
                }
            ]);
        }
    };
    
    
    
    
    return (
        <View style={styles.container}> 
            <StatusBar backgroundColor="#f9f9f9"/>
            <View style={styles.infoContainer}>
            
            <View style={styles.BarcodeDetailsContainer}>
    <View style={styles.line} />
    <Text style={styles.detailsText}>2d Barcode Details</Text>
    <View style={styles.line} />
</View>

                {/* Display all batch lot info */}
                <Text style={styles.label}>GTIN *</Text>
                <Text style={styles.info}>{batchLot.gtin}</Text>

                <Text style={styles.label}>LOT/Batch Number *</Text>
                <Text style={styles.info}>{batchLot.lotNumber}</Text>

                <Text style={styles.label}>Expiry Date *</Text>
                <Text style={styles.info}>{batchLot.expiryDate}</Text>

                <Text style={styles.label}>Serial Number *</Text>
                <Text style={styles.info}>{batchLot.serialNumber}</Text>

                <View style={styles.medicationDetailsContainer}>
    <View style={styles.line} />
    <Text style={styles.detailsText}>Medication Details</Text>
    <View style={styles.line} />
</View>
                <Text style={styles.label}>Brand Name *</Text>
                <Text style={styles.info}>{batchLot.drugName}</Text>

                <View style={styles.row}>
                    <View style={styles.halfWidthLeft}>
                        <Text style={styles.label}>Presentation *</Text>
                        <Text style={styles.info}>{batchLot.presentation}</Text>
                    </View>
                    <View style={styles.halfWidthRight}>
                        <Text style={styles.label}>Form *</Text>
                        <Text style={styles.info}>{batchLot.form}</Text>
                    </View>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfWidthLeft}>
                        <Text style={styles.label}>Laboratory *</Text>
                        <Text style={styles.info}>{batchLot.owner}</Text>
                    </View>
                    <View style={styles.halfWidthRight}>
                        <Text style={styles.label}>Country *</Text>
                        <Text style={styles.info}>{batchLot.country}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                    <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.inspectButton} onPress={handleInspect}>
                    <Text style={styles.inspectButtonText}>Inspect</Text>
                </TouchableOpacity>
            </View>

            <BottomNavBarInspection currentScreen="Inspect" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    header: {
        alignItems: 'right',
        marginTop: 20,
        marginRight: 25,
    },
    headerTitle: {
        fontSize: 12,
        fontFamily: 'RobotoCondensed-Bold',
        
        color: 'red',
        textAlign:'right'
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'red',
    },
    infoContainer: {
        flex: 1,
        marginTop:40,
    },
    label: {
        color: '#707070',
        fontSize: 12,
        marginBottom: 3,
        marginLeft: 40,
        fontFamily: 'RobotoCondensed-Medium',

    },
    info: {
        borderWidth: 1,
        borderColor: '#00a651',
        borderRadius: 20,
        padding: 10,
        paddingLeft:15,
        paddingBottom:5,
        height: 35,
        marginBottom: 5,
        backgroundColor: '#FFFCFC',
        marginLeft: 35,
        marginRight: 35,
        fontFamily: 'RobotoCondensed-Bold',

    },
    sectionHeader: {
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
        color: '#000',
        marginVertical: 10,
        textAlign: 'center',
        paddingBottom: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    halfWidthLeft: {
        width: '48%',
    },
    halfWidthRight: {
        width: '48%',
    },
    buttonsContainer: {
    marginLeft:50,
    marginBottom: 10, // Reduced margin
    flexDirection: 'row', // Align items horizontally (in a row)
    marginTop:20,
    },
    rejectButton: {
        backgroundColor: '#f9f9f9',
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        width: '35%',
        marginHorizontal:10,
        borderColor:'red',
        borderWidth:2,
    },
    rejectButtonText: {
        color: 'red',
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
    },
    inspectButton: {
        backgroundColor: '#00A651',
        paddingVertical: 10,
        borderRadius: 25,
        alignItems: 'center',
        width: '35%',
        marginHorizontal:10,
    },
    inspectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'RobotoCondensed-Bold',
    },
    backButtonImage: {
        width: 41,
        height: 15,
        marginLeft: 10,
    },
    medicationDetailsContainer: {
        flexDirection: 'row', // Arrange the line and text horizontally
        alignItems: 'center', // Aligns the text vertically in the center of the lines
        justifyContent: 'center',
        marginBottom: 15,
        marginTop:10,
      },
      BarcodeDetailsContainer: {
        flexDirection: 'row', // Arrange the line and text horizontally
        alignItems: 'center', // Aligns the text vertically in the center of the lines
        justifyContent: 'center',
        marginBottom: 5,
       
      },
      line: {
        flex: 1, // Ensures the line stretches to the available width
        height: 1, // The height of the line
        backgroundColor: '#000', // The color of the line
        marginHorizontal: 10, // Adds space between the text and the lines
      },
      detailsText: {
        fontSize: 16, // Adjust for text size
        fontFamily: 'RobotoCondensed-Bold',
        textAlign: 'center',
        color: '#000', // Ensures the text is black
         // Adjusts the space between characters
      },
});

export default PackInspection;
