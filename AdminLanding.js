import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminLanding = () => {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');

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

    const handleInspect = () => {
        navigation.navigate('Inspect');
    };

    return (
        <View style={styles.container}>
            <Image source={require("./assets/medleblogo.png")} style={styles.logo} />

            <Text style={styles.welcomeText}>Welcome, {username}!</Text>

            <View style={styles.buttonsContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('List')}>
                    <Image source={require("./assets/2.png")} style={styles.buttonImage} />
                </TouchableOpacity>

                <TouchableOpacity onPress={handleInspect}>
                    <Image source={require("./assets/Inspection.jpg")} style={styles.buttonImage} />
                  
                </TouchableOpacity>
            </View>

            <View style={styles.taskBar}>
                <TouchableOpacity onPress={() => navigation.navigate('AdminLanding')}>
                    <Image source={require("./assets/home.png")} style={styles.taskBarButton} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('List')}>
                    <Image source={require("./assets/list.png")} style={styles.taskBarButton} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleInspect}>
                    <Image source={require("./assets/donate.png")} style={styles.taskBarButtonInspect} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 10,
    },
    logo: {
        top: 10,
        left: 10,
        width: 200,
        height: 80,
        resizeMode: "contain",
    },
    welcomeText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginRight: 150,
        marginBottom: 30,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingTop: 200,
    },
    buttonImage: {
        width: 120,
        height: 120,
        resizeMode: "contain",
    },
    buttonImageInspect: {
        width: 90,
        height: 87,
        resizeMode: "contain",
    },
    taskBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        position: 'absolute',
        bottom: '2%',
    },
    taskBarButton: {
        width: 25,
        height: 25,
        resizeMode: "contain",
    },
    taskBarButtonInspect: {
        width: 30,
        height: 30,
        resizeMode: "contain",
    },
    inspectionText: {
        fontFamily: 'Roboto Condensed',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 20,
        lineHeight: 50,
        textAlign: 'center',
        color: '#121212',
    },
});

export default AdminLanding;
