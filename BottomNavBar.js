// BottomNavBar.js
import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const BottomNavBar = () => {
    const navigation = useNavigation();
    const route = useRoute(); // Get the current route

    // Determine the active route to set icon colors
    const isHomeActive = route.name === 'Landing';
    const isDonateActive = route.name === 'Donate' || route.name === 'AddDonor';
    const isListActive = route.name === 'DonorList' || route.name === 'DonationDetails';

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Landing')}>
                <Image 
                    source={isHomeActive ? require('./assets/home-green.png') : require('./assets/home-grey.png')} 
                    style={styles.icon} 
                />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('AddDonor')}>
                <Image 
                    source={isDonateActive ? require('./assets/donate-green.png') : require('./assets/donate-grey.png')} 
                    style={styles.icon} 
                />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DonorList')}>
                <Image 
                    source={isListActive ? require('./assets/list-green.png') : require('./assets/list-grey.png')} 
                    style={styles.icon} 
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
     
        borderTopWidth: 1,
        borderTopColor: '#f9f9f9',
        backgroundColor: '#f9f9f9',
    },
    navItem: {
        alignItems: 'center',
    },
    icon: {
        width: 43,
        height: 60,
        resizeMode: 'contain',
    },
});

export default BottomNavBar;
