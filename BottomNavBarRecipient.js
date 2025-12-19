// BottomNavBarRecipient.js
import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

const BottomNavBarRecipient = () => {
    const navigation = useNavigation();
    const route = useRoute(); // Get the current route

    // Determine the active route to set icon colors
    const isHomeActive = route.name === 'Landing';
    const isListActive = route.name === 'RecipientList';
    const isAgreementsActive = route.name === 'RecipientAgreements';

    return (
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <View style={styles.container}>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Landing')}>
                    <Image 
                        source={isHomeActive ? require('./assets/home-green.png') : require('./assets/home-grey.png')} 
                        style={styles.icon} 
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RecipientList')}>
                    <Image 
                        source={isListActive ? require('./assets/list-green.png') : require('./assets/list-grey.png')} 
                        style={styles.icon} 
                    />
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('RecipientAgreements')}>
                    <Image 
                        source={isAgreementsActive ? require('./assets/agreements-green.png') : require('./assets/agreements-grey.png')} 
                        style={styles.icon} 
                    />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#f9f9f9',
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 60,
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