import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';

const SignUp = () => {
    const [donorName, setDonorName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [donorCountry, setDonorCountry] = useState('');
    const [password, setPassword] = useState('');
    const [open, setOpen] = useState(false);
    const [organizationType, setOrganizationType] = useState(null);
    const [items, setItems] = useState([
        { label: 'Organisation', value: 'Organisation' },
        { label: 'Individual', value: 'Individual' },
    ]);
    const navigation = useNavigation();

    const handleSignUp = async () => {
        try {
            const donorData = {
                DonorName: donorName,
                DonorType: organizationType,
                Address: address,
                PhoneNumber: phoneNumber,
                Email: email,
                DonorCountry: donorCountry,
                IsActive: true,
            };
            await axios.post('https://apiv2.medleb.org/users/Donor/register', { donorData, username: donorName, password });
            Alert.alert('Success', 'Your Account has been sent to validation', [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }]);
        } catch (error) {
            Alert.alert('Error', 'Failed to sign up');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Image source={require('./assets/medleblogo.png')} style={styles.logo} />
                <Text style={styles.label}>Donor Name</Text>
                <TextInput
                    style={styles.input}
                    value={donorName}
                    onChangeText={setDonorName}
                    placeholder="Donor Name"
                />
                <Text style={styles.label}>Donor Type</Text>
                <DropDownPicker
                    open={open}
                    value={organizationType}
                    items={items}
                    setOpen={setOpen}
                    setValue={setOrganizationType}
                    setItems={setItems}
                    placeholder="Select Donor Type"
                    style={styles.dropdown}
                    dropDownStyle={styles.dropdown}
                    containerStyle={{ marginBottom: 20 }}
                />
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    secureTextEntry
                />
                <Text style={styles.label}>Address</Text>
                <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Address"
                />
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Phone Number"
                />
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                />
                <Text style={styles.label}>Country</Text>
                <TextInput
                    style={styles.input}
                    value={donorCountry}
                    onChangeText={setDonorCountry}
                    placeholder="Country"
                />

                <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    logo: {
        width: 200,
        height: 80,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 30,
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
        color: "#A9A9A9",
    },
    input: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        marginBottom: 20,
        borderRadius: 20,
    },
    dropdown: {
        borderColor: '#00a651',
        borderRadius: 20,
    },
    button: {
        backgroundColor: '#00a651',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default SignUp;
