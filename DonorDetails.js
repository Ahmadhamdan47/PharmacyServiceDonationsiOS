import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import BottomNavBarInspection from './BottomNavBarInspection'; // Import BottomNavBarInspection

const DonorDetails = ({ route, navigation }) => {
    const { donor } = route.params;
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');

    useEffect(() => {
        getUsername();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: () => <Text style={styles.headerTitle}>Validate</Text>,
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                    <Text style={styles.backButtonText}>Back</Text>
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
        });
    }, [navigation, username]);

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

    const handleApproval = async (isActive) => {
        setIsLoading(true);
        try {
            await axios.put(`https://apiv2.medleb.org/donor/${donor.DonorId}`, {
                IsActive: isActive,
            });
            Alert.alert('Success', isActive ? 'Donor Approved' : 'Donor Rejected');
            navigation.goBack();
        } catch (error) {
            console.error('Error updating donor status:', error);
            Alert.alert('Error', 'Failed to update donor status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Donor Name</Text>
            <TextInput style={styles.input} value={donor.DonorName} editable={false} />

            <Text style={styles.label}>Donor Type</Text>
            <TextInput style={styles.input} value={donor.DonorType} editable={false} />

            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={donor.Address} editable={false} />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={donor.PhoneNumber} editable={false} />

            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={donor.Email} editable={false} />

            <Text style={styles.label}>Country</Text>
            <TextInput style={styles.input} value={donor.DonorCountry} editable={false} />

            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => handleApproval(false)} disabled={isLoading}>
                    <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.approveButton]} onPress={() => handleApproval(true)} disabled={isLoading}>
                    <Text style={styles.buttonText}>Approve</Text>
                </TouchableOpacity>
            </View>
            <BottomNavBarInspection currentScreen="" />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        color: '#A9A9A9',
    },
    input: {
        borderWidth: 1,
        borderColor: '#00A651',
        padding: 10,
        marginBottom: 20,
        borderRadius: 20,
        color: '#000',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        marginHorizontal: 5,
        borderRadius: 10,
        alignItems: 'center',
    },
    rejectButton: {
        backgroundColor: 'red',
    },
    approveButton: {
        backgroundColor: '#00A651',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButtonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    backButtonText: {
        fontSize: 16,
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    profileContainer: {
        alignItems: 'center',
        marginRight: 10,
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
        textAlign: 'center',
    },
});

export default DonorDetails;
