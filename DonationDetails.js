import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import BottomNavBar from './BottomNavBar'; // Import BottomNavBar

const DonationDetails = ({ route, navigation }) => {
    const { donation } = route.params;
    const [boxes, setBoxes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBoxes();
    }, []);

    const fetchBoxes = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://apiv2.medleb.org/boxes/byDonation/${donation.DonationId}`);
            setBoxes(response.data);
        } catch (error) {
            console.error('Error fetching boxes:', error);
            Alert.alert('Error', 'Failed to load boxes.');
        }
        setLoading(false);
    };

    const handleBoxPress = (box) => {
        navigation.navigate('BoxDetails', { box });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Donation Details</Text>
            <Text style={styles.subtitle}>To: {donation.RecipientName}</Text>
            <Text style={styles.subtitle}>Date: {donation.DonationDate}</Text>

            {loading ? (
                <Text>Loading...</Text>
            ) : (
                <ScrollView style={styles.scrollView}>
                    {boxes.map((box, index) => (
                        <TouchableOpacity key={index} style={styles.card} onPress={() => handleBoxPress(box)}>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>{box.BoxLabel}</Text>
                                <Text style={styles.cardText}>Number of Packs: {box.NumberOfPacks || 0}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}

            {/* Bottom Navigation Bar */}
            <BottomNavBar />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10 // Ensure space for the BottomNavBar
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 5,
    },
    scrollView: {
        marginTop: 20,
    },
    card: {
        borderWidth: 1,
        borderColor: '#00A651',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardText: {
        fontSize: 14,
    },
});

export default DonationDetails;
