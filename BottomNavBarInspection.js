// BottomNavBarInspection.js
import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BottomNavBarInspection = ({ currentScreen }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Landing')}>
                <Image
                    source={currentScreen === 'Landing' ? require('./assets/home-green.png') : require('./assets/home-grey.png')}
                    style={styles.icon}
                />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Inspect')}>
                <Image
                    source={currentScreen === 'Inspect' ? require('./assets/Inspect-green.png') : require('./assets/inspect-grey.png')}
                    style={styles.icon}
                />
            </TouchableOpacity>
            <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('List')}>
                <Image
                    source={currentScreen === 'List' ? require('./assets/list-green.png') : require('./assets/list-grey.png')}
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
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f9f9f9',
        backgroundColor: '#f9f9f9',
    },
    navItem: {
        alignItems: 'center',
    },
    icon: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
});

export default BottomNavBarInspection;
