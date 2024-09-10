import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const PinPage = ({ navigation }) => {
    const [pin, setPin] = useState('');

    // Use useLayoutEffect to modify the navigation options
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingLeft: 20 }}>
                    <Image
                        source={require('./assets/back-green.png')} // Custom back button image
                        style={{ width: 41, height: 15 }}
                    />
                </TouchableOpacity>
            ),
            headerTitle: () => (
                <Text style={styles.headerTitle}>Passcode</Text> // Center title in the navigation
            ),
            headerTitleAlign: 'center', // Align the title in the center
            headerStyle: {
                backgroundColor: '#f9f9f9', // Set background color of navigation
                shadowOpacity: 0, // Remove shadow/border under the navigation
                elevation: 0, // For Android, remove the elevation
            },
            headerTintColor: '#000', // Set color for text and icons in the header
        });
    }, [navigation]);

    const handlePinInput = (value) => {
        if (pin.length < 4) {
            setPin((prevPin) => prevPin + value);
        }
    };

    const handleDelete = () => {
        setPin((prevPin) => prevPin.slice(0, -1));
    };

    const handleCancel = () => {
        setPin('');
    };

    return (
        <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <Image
                    source={require('./assets/passlogo.png')} // Adjust the path as per your directory structure
                    style={styles.logo}
                />
            </View>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>Enter a 4 digits passcode.</Text>

            {/* Pin Indicator */}
            <View style={styles.pinContainer}>
                {Array(4)
                    .fill(0)
                    .map((_, index) => (
                        <View
                            key={index}
                            style={[styles.pinCircle, { borderColor: pin.length > index ? '#00a651' : '#000' }]}
                        />
                    ))}
            </View>

            {/* Number Pad */}
            <View style={styles.numberPad}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.numberButton}
                        onPress={() => handlePinInput(num)}
                    >
                        <Text style={styles.numberText}>{num}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Cancel, 0, and Delete Buttons */}
            <View style={styles.bottomRow}>
                {/* Cancel Button - Just Text */}
                <TouchableOpacity onPress={handleCancel} style={styles.textButton}>
                    <Text style={styles.actionText}>Cancel</Text>
                </TouchableOpacity>

                {/* 0 Button - Circular */}
                <TouchableOpacity style={styles.numberButton} onPress={() => handlePinInput('0')}>
                    <Text style={styles.numberText}>0</Text>
                </TouchableOpacity>

                {/* Delete Button - Just Text */}
                <TouchableOpacity onPress={handleDelete} style={styles.textButton}>
                    <Text style={styles.actionText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    headerTitle: {
        fontSize: 18, // Font size for Passcode title
        fontWeight: '700', // Bold
        color: '#121212', // Dark color for title
    },
    backButton: {
        position: 'absolute',
        top: 40, // Adjust the y-position to match Figma
        left: 20,
    },
    // Logo Container and Logo style
    logoContainer: {
        width: 120, // Exact width of the logo container from Figma (120px)
        height: 120, // Exact height of the logo container from Figma (120px)
        marginBottom: 30, // Space between the logo and "Passcode" text
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: 120, // Ensure logo fills the container
        height: 120,
    },
    instructionText: {
        width: 267, // Exact width from Figma
        fontSize: 14, // Figma font size is 14px
        fontWeight: '500',
        color: '#121212',
        textAlign: 'center',
        marginBottom: 40, // Spacing between instruction text and the pin circles
    },
    pinContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40, // Spacing between the pin container and the number pad
        width: 131, // Exact width from Figma for the 4 circles
    },
    pinCircle: {
        width: 20, // Circle size from Figma (20px)
        height: 20,
        borderRadius: 10, // Making it a perfect circle
        borderWidth: 1.5,
        borderColor: '#000',
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: 240, // Adjusted width to accommodate buttons with spacing
    },
    numberButton: {
        width: 50, // Size from Figma (50px width)
        height: 50, // Size from Figma (50px height)
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30, // 30px margin at the bottom for vertical spacing
        marginHorizontal: 15, // 30px horizontal spacing divided by 2 for equal spacing
        borderRadius: 25, // Half of width/height to create a perfect circle
        borderWidth: 1.5,
        borderColor: '#000',
    },
    numberText: {
        fontSize: 24, // Figma font size
        fontWeight: 'bold',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: 240, // Adjusted width to fit "Cancel", "0", and "Delete" buttons
    },
    textButton: {
        padding: 10, // No border or background, just space for text
        marginBottom: 25,
    },
    actionText: {
        fontSize: 14, // Figma font size for "Cancel" and "Delete"
        color: '#000', // Same color as Figma design
        fontWeight: '500', // Bold for the actions
    },
});

export default PinPage;
