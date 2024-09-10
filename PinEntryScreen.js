import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PinEntryScreen = ({ navigation }) => {
    const [enteredPin, setEnteredPin] = useState('');
    const [savedPin, setSavedPin] = useState(null);

    // Fetch the saved PIN when the component mounts
    useEffect(() => {
        const fetchSavedPin = async () => {
            const pin = await AsyncStorage.getItem('userPin');
            setSavedPin(pin);
        };
        fetchSavedPin();
    }, []);

    const handlePinPress = (value) => {
        if (enteredPin.length < 4) {
            setEnteredPin(enteredPin + value);
        }
    };

    const handleDelete = () => {
        setEnteredPin(enteredPin.slice(0, -1));
    };

    const handleSubmit = async () => {
        if (enteredPin === savedPin) {
            // Check if the user is signed in by looking for a token
            const token = await AsyncStorage.getItem('token');
            if (token) {
                // If signed in, navigate to the correct landing page
                const userRole = await AsyncStorage.getItem('userRole');
                if (userRole === 'Admin') {
                    navigation.navigate('Landing');
                } else if (userRole === 'Donor') {
                    navigation.navigate('Landing');
                }
            } else {
                // If not signed in, take the user to the SignIn screen
                navigation.navigate('SignIn');
            }
        } else {
            Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.');
            setEnteredPin('');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter Your PIN</Text>

            <View style={styles.pinContainer}>
                {[0, 1, 2, 3].map((index) => (
                    <Text key={index} style={styles.pinDigit}>
                        {enteredPin[index] ? '●' : '○'}
                    </Text>
                ))}
            </View>

            <View style={styles.numPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <TouchableOpacity key={num} style={styles.numButton} onPress={() => handlePinPress(num.toString())}>
                        <Text style={styles.numText}>{num}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                    <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>

                {enteredPin.length === 4 && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleSubmit}>
                        <Text style={styles.actionText}>Submit</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '60%',
        marginBottom: 30,
    },
    pinDigit: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#000',
    },
    numPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '60%',
    },
    numButton: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 10,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 40,
    },
    numText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    actions: {
        marginTop: 30,
    },
    actionButton: {
        marginTop: 10,
    },
    actionText: {
        fontSize: 18,
        color: '#000',
    },
});

export default PinEntryScreen;
