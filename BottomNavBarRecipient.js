// BottomNavBarRecipient.js
import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const BottomNavBarRecipient = () => {
    const navigation = useNavigation();
    const route = useRoute(); // Get the current route

    // Determine the active route to set icon colors
    const isHomeActive = route.name === 'Landing';
    const isListActive = route.name === 'List';
    const isAgreementsActive = route.name === 'Agreements';

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Landing')}>
                <Image 
                    source={isHomeActive ? require('./assets/home-green.png') : require('./assets/home-grey.png')} 
                    style={styles.icon} 
                />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('List')}>
                <Image 
                    source={isListActive ? require('./assets/list-green.png') : require('./assets/list-grey.png')} 
                    style={styles.icon} 
                />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Agreements')}>
                <Image 
                    source={isAgreementsActive ? require('./assets/agreements-green.png') : require('./assets/agreements-grey.png')} 
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
        height: 60, // Adjust height as needed
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

export default BottomNavBarRecipient;