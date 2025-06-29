import React, { useState, useLayoutEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, Image, TouchableOpacity, ScrollView, Modal } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';

const SignUp = () => {
    const [userType, setUserType] = useState('Donor'); // Toggle between Donor and Recipient
    const [donorName, setDonorName] = useState('');
    const [name, setName] = useState('');

    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [open, setOpen] = useState(false);
    const [organizationType, setOrganizationType] = useState(null);
    const [items, setItems] = useState([
        { label: 'Organisation', value: 'Organisation' },
        { label: 'Individual', value: 'Individual' },
    ]);
    const [userAnswer, setUserAnswer] = useState('');
    const [captchaQuestion, setCaptchaQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [isCaptchaVisible, setIsCaptchaVisible] = useState(false);
    const [countryOpen, setCountryOpen] = useState(false);
    const [country, setCountry] = useState(null);
    const [countries, setCountries] = useState([
        { label: 'Afghanistan', value: 'Afghanistan' },
        { label: 'Albania', value: 'Albania' },
        { label: 'Algeria', value: 'Algeria' },
        { label: 'Andorra', value: 'Andorra' },
        { label: 'Angola', value: 'Angola' },
        { label: 'Antigua and Barbuda', value: 'Antigua and Barbuda' },
        { label: 'Argentina', value: 'Argentina' },
        { label: 'Armenia', value: 'Armenia' },
        { label: 'Australia', value: 'Australia' },
        { label: 'Austria', value: 'Austria' },
        { label: 'Azerbaijan', value: 'Azerbaijan' },
        { label: 'Bahamas', value: 'Bahamas' },
        { label: 'Bahrain', value: 'Bahrain' },
        { label: 'Bangladesh', value: 'Bangladesh' },
        { label: 'Barbados', value: 'Barbados' },
        { label: 'Belarus', value: 'Belarus' },
        { label: 'Belgium', value: 'Belgium' },
        { label: 'Belize', value: 'Belize' },
        { label: 'Benin', value: 'Benin' },
        { label: 'Bhutan', value: 'Bhutan' },
        { label: 'Bolivia', value: 'Bolivia' },
        { label: 'Bosnia and Herzegovina', value: 'Bosnia and Herzegovina' },
        { label: 'Botswana', value: 'Botswana' },
        { label: 'Brazil', value: 'Brazil' },
        { label: 'Brunei', value: 'Brunei' },
        { label: 'Bulgaria', value: 'Bulgaria' },
        { label: 'Burkina Faso', value: 'Burkina Faso' },
        { label: 'Burundi', value: 'Burundi' },
        { label: 'Cabo Verde', value: 'Cabo Verde' },
        { label: 'Cambodia', value: 'Cambodia' },
        { label: 'Cameroon', value: 'Cameroon' },
        { label: 'Canada', value: 'Canada' },
        { label: 'Central African Republic', value: 'Central African Republic' },
        { label: 'Chad', value: 'Chad' },
        { label: 'Chile', value: 'Chile' },
        { label: 'China', value: 'China' },
        { label: 'Colombia', value: 'Colombia' },
        { label: 'Comoros', value: 'Comoros' },
        { label: 'Congo, Democratic Republic of the', value: 'Congo, Democratic Republic of the' },
        { label: 'Congo, Republic of the', value: 'Congo, Republic of the' },
        { label: 'Costa Rica', value: 'Costa Rica' },
        { label: 'Croatia', value: 'Croatia' },
        { label: 'Cuba', value: 'Cuba' },
        { label: 'Cyprus', value: 'Cyprus' },
        { label: 'Czech Republic', value: 'Czech Republic' },
        { label: 'Denmark', value: 'Denmark' },
        { label: 'Djibouti', value: 'Djibouti' },
        { label: 'Dominica', value: 'Dominica' },
        { label: 'Dominican Republic', value: 'Dominican Republic' },
        { label: 'Ecuador', value: 'Ecuador' },
        { label: 'Egypt', value: 'Egypt' },
        { label: 'El Salvador', value: 'El Salvador' },
        { label: 'Equatorial Guinea', value: 'Equatorial Guinea' },
        { label: 'Eritrea', value: 'Eritrea' },
        { label: 'Estonia', value: 'Estonia' },
        { label: 'Eswatini', value: 'Eswatini' },
        { label: 'Ethiopia', value: 'Ethiopia' },
        { label: 'Fiji', value: 'Fiji' },
        { label: 'Finland', value: 'Finland' },
        { label: 'France', value: 'France' },
        { label: 'Gabon', value: 'Gabon' },
        { label: 'Gambia', value: 'Gambia' },
        { label: 'Georgia', value: 'Georgia' },
        { label: 'Germany', value: 'Germany' },
        { label: 'Ghana', value: 'Ghana' },
        { label: 'Greece', value: 'Greece' },
        { label: 'Grenada', value: 'Grenada' },
        { label: 'Guatemala', value: 'Guatemala' },
        { label: 'Guinea', value: 'Guinea' },
        { label: 'Guinea-Bissau', value: 'Guinea-Bissau' },
        { label: 'Guyana', value: 'Guyana' },
        { label: 'Haiti', value: 'Haiti' },
        { label: 'Honduras', value: 'Honduras' },
        { label: 'Hungary', value: 'Hungary' },
        { label: 'Iceland', value: 'Iceland' },
        { label: 'India', value: 'India' },
        { label: 'Indonesia', value: 'Indonesia' },
        { label: 'Iran', value: 'Iran' },
        { label: 'Iraq', value: 'Iraq' },
        { label: 'Ireland', value: 'Ireland' },
        { label: 'Italy', value: 'Italy' },
        { label: 'Jamaica', value: 'Jamaica' },
        { label: 'Japan', value: 'Japan' },
        { label: 'Jordan', value: 'Jordan' },
        { label: 'Kazakhstan', value: 'Kazakhstan' },
        { label: 'Kenya', value: 'Kenya' },
        { label: 'Kiribati', value: 'Kiribati' },
        { label: 'Kuwait', value: 'Kuwait' },
        { label: 'Kyrgyzstan', value: 'Kyrgyzstan' },
        { label: 'Laos', value: 'Laos' },
        { label: 'Latvia', value: 'Latvia' },
        { label: 'Lebanon', value: 'Lebanon' },
        { label: 'Lesotho', value: 'Lesotho' },
        { label: 'Liberia', value: 'Liberia' },
        { label: 'Libya', value: 'Libya' },
        { label: 'Liechtenstein', value: 'Liechtenstein' },
        { label: 'Lithuania', value: 'Lithuania' },
        { label: 'Luxembourg', value: 'Luxembourg' },
        { label: 'Madagascar', value: 'Madagascar' },
        { label: 'Malawi', value: 'Malawi' },
        { label: 'Malaysia', value: 'Malaysia' },
        { label: 'Maldives', value: 'Maldives' },
        { label: 'Mali', value: 'Mali' },
        { label: 'Malta', value: 'Malta' },
        { label: 'Marshall Islands', value: 'Marshall Islands' },
        { label: 'Mauritania', value: 'Mauritania' },
        { label: 'Mauritius', value: 'Mauritius' },
        { label: 'Mexico', value: 'Mexico' },
        { label: 'Micronesia', value: 'Micronesia' },
        { label: 'Moldova', value: 'Moldova' },
        { label: 'Monaco', value: 'Monaco' },
        { label: 'Mongolia', value: 'Mongolia' },
        { label: 'Montenegro', value: 'Montenegro' },
        { label: 'Morocco', value: 'Morocco' },
        { label: 'Mozambique', value: 'Mozambique' },
        { label: 'Myanmar', value: 'Myanmar' },
        { label: 'Namibia', value: 'Namibia' },
        { label: 'Nauru', value: 'Nauru' },
        { label: 'Nepal', value: 'Nepal' },
        { label: 'Netherlands', value: 'Netherlands' },
        { label: 'New Zealand', value: 'New Zealand' },
        { label: 'Nicaragua', value: 'Nicaragua' },
        { label: 'Niger', value: 'Niger' },
        { label: 'Nigeria', value: 'Nigeria' },
        { label: 'North Korea', value: 'North Korea' },
        { label: 'North Macedonia', value: 'North Macedonia' },
        { label: 'Norway', value: 'Norway' },
        { label: 'Oman', value: 'Oman' },
        { label: 'Pakistan', value: 'Pakistan' },
        { label: 'Palau', value: 'Palau' },
        { label: 'Palestine', value: 'Palestine' },
        { label: 'Panama', value: 'Panama' },
        { label: 'Papua New Guinea', value: 'Papua New Guinea' },
        { label: 'Paraguay', value: 'Paraguay' },
        { label: 'Peru', value: 'Peru' },
        { label: 'Philippines', value: 'Philippines' },
        { label: 'Poland', value: 'Poland' },
        { label: 'Portugal', value: 'Portugal' },
        { label: 'Qatar', value: 'Qatar' },
        { label: 'Romania', value: 'Romania' },
        { label: 'Russia', value: 'Russia' },
        { label: 'Rwanda', value: 'Rwanda' },
        { label: 'Saint Kitts and Nevis', value: 'Saint Kitts and Nevis' },
        { label: 'Saint Lucia', value: 'Saint Lucia' },
        { label: 'Saint Vincent and the Grenadines', value: 'Saint Vincent and the Grenadines' },
        { label: 'Samoa', value: 'Samoa' },
        { label: 'San Marino', value: 'San Marino' },
        { label: 'Sao Tome and Principe', value: 'Sao Tome and Principe' },
        { label: 'Saudi Arabia', value: 'Saudi Arabia' },
        { label: 'Senegal', value: 'Senegal' },
        { label: 'Serbia', value: 'Serbia' },
        { label: 'Seychelles', value: 'Seychelles' },
        { label: 'Sierra Leone', value: 'Sierra Leone' },
        { label: 'Singapore', value: 'Singapore' },
        { label: 'Slovakia', value: 'Slovakia' },
        { label: 'Slovenia', value: 'Slovenia' },
        { label: 'Solomon Islands', value: 'Solomon Islands' },
        { label: 'Somalia', value: 'Somalia' },
        { label: 'South Africa', value: 'South Africa' },
        { label: 'South Korea', value: 'South Korea' },
        { label: 'South Sudan', value: 'South Sudan' },
        { label: 'Spain', value: 'Spain' },
        { label: 'Sri Lanka', value: 'Sri Lanka' },
        { label: 'Sudan', value: 'Sudan' },
        { label: 'Suriname', value: 'Suriname' },
        { label: 'Sweden', value: 'Sweden' },
        { label: 'Switzerland', value: 'Switzerland' },
        { label: 'Syria', value: 'Syria' },
        { label: 'Taiwan', value: 'Taiwan' },
        { label: 'Tajikistan', value: 'Tajikistan' },
        { label: 'Tanzania', value: 'Tanzania' },
        { label: 'Thailand', value: 'Thailand' },
        { label: 'Timor-Leste', value: 'Timor-Leste' },
        { label: 'Togo', value: 'Togo' },
        { label: 'Tonga', value: 'Tonga' },
        { label: 'Trinidad and Tobago', value: 'Trinidad and Tobago' },
        { label: 'Tunisia', value: 'Tunisia' },
        { label: 'Turkey', value: 'Turkey' },
        { label: 'Turkmenistan', value: 'Turkmenistan' },
        { label: 'Tuvalu', value: 'Tuvalu' },
        { label: 'Uganda', value: 'Uganda' },
        { label: 'Ukraine', value: 'Ukraine' },
        { label: 'United Arab Emirates', value: 'United Arab Emirates' },
        { label: 'United Kingdom', value: 'United Kingdom' },
        { label: 'United States', value: 'United States' },
        { label: 'Uruguay', value: 'Uruguay' },
        { label: 'Uzbekistan', value: 'Uzbekistan' },
        { label: 'Vanuatu', value: 'Vanuatu' },
        { label: 'Vatican City', value: 'Vatican City' },
        { label: 'Venezuela', value: 'Venezuela' },
        { label: 'Vietnam', value: 'Vietnam' },
        { label: 'Yemen', value: 'Yemen' },
        { label: 'Zambia', value: 'Zambia' },
        { label: 'Zimbabwe', value: 'Zimbabwe' },
    ]);
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Sign Up',
            headerTitleAlign: 'center',  // Center the logo horizontally
            headerLeft: () => null,      // Remove the back button
            headerStyle: {
                           // Adjust the height of the header
                backgroundColor: '#f9f9f9',
            },
            headerTitleStyle: {
                         // Distance from the top (50px)
            },
        });
    }, [navigation]);

    const navigation = useNavigation();
    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10);
        const num2 = Math.floor(Math.random() * 10);
        setCorrectAnswer(num1 + num2);
        setCaptchaQuestion(`What is ${num1} + ${num2}?`);
    };

    // Run CAPTCHA generation on component mount
    React.useEffect(() => {
        generateCaptcha();
    }, []);
   
    const handleVerifyCaptcha = () => {
        if (parseInt(userAnswer) === correctAnswer) {
            return true;
        } else {
            Alert.alert('Error', 'Incorrect CAPTCHA. Please try again.');
            return false;
        }
    };
    

    const handleSignUp = () => {
        generateCaptcha(); // Generate a CAPTCHA question
        setIsCaptchaVisible(true); // Show the CAPTCHA modal
    };

    const handleCaptchaSubmit = async () => {
        if (!handleVerifyCaptcha()) return;

        setIsCaptchaVisible(false); // Hide the CAPTCHA modal

        try {
            if (userType === 'Donor') {
                const donorData = {
                    DonorName: name,
                    DonorType: organizationType,
                    Address: address,
                    PhoneNumber: phoneNumber,
                    Email: email,
                    DonorCountry: country,
                    IsActive: null,
                };

                const endpoint = 'users/Donor/register';

                await axios.post(`https://apiv2.medleb.org/${endpoint}`, {
                    donorData,
                    username: name,
                    password,
                });
            } else if (userType === 'Recipient') {
                const recipientData = {
                    RecipientName: name,
                    RecipientType: organizationType,
                    Address: address,
                    City: '',
                    Country: country,
                    ContactPerson: '',
                    ContactNumber: phoneNumber,
                    IsActive: null,
                };

                const endpoint = 'users/Recipient/register';

                await axios.post(`https://apiv2.medleb.org/${endpoint}`, {
                    recipientData,
                    username: name,
                    password,
                });
            }

            Alert.alert('Success', 'Your Account has been sent for validation', [
                { text: 'OK', onPress: () => navigation.navigate('SignIn') },
            ]);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to sign up');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.label}>Sign Up as</Text>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, userType === 'Donor' && styles.activeToggleButton]}
                        onPress={() => setUserType('Donor')}
                    >
                        <Text
                            style={[
                                styles.toggleButtonText,
                                userType === 'Donor' && styles.activeToggleButtonText,
                            ]}
                        >
                            Donor
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, userType === 'Recipient' && styles.activeToggleButton]}
                        onPress={() => setUserType('Recipient')}
                    >
                        <Text
                            style={[
                                styles.toggleButtonText,
                                userType === 'Recipient' && styles.activeToggleButtonText,
                            ]}
                        >
                            Recipient
                        </Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>{userType} Name*</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={`${userType} Name`}
                    placeholderTextColor="#A9A9A9"
                />
                {userType === 'Donor' && (
                    <>
                        <Text style={styles.label}>Donor Type*</Text>
                        <DropDownPicker
                            open={open}
                            value={organizationType}
                            items={items}
                            setOpen={setOpen}
                            setValue={setOrganizationType}
                            setItems={setItems}
                            placeholder="Select Donor Type"
                            placeholderStyle={styles.placeholder}
<<<<<<< HEAD
                            style={styles.dropdownInput }
=======
                            style={styles.input}
>>>>>>> 2c17bcbc2f9294663fa9f922974886a98acccf2e
                            containerStyle={styles.dropdownContainer}
                            dropDownContainerStyle={styles.dropdownMenuContainer}
                        />
                    </>
                )}
                <Text style={styles.label}>Password*</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password"
                    placeholderTextColor="#A9A9A9"
                    secureTextEntry
                />
                <Text style={styles.label}>Address*</Text>
                <TextInput
                    style={styles.input}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Address"
                    placeholderTextColor="#A9A9A9"
                />
                <Text style={styles.label}>Phone Number*</Text>
                <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="Phone Number"
                    placeholderTextColor="#A9A9A9"
                />
                <Text style={styles.label}>Email*</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Email"
                    placeholderTextColor="#A9A9A9"
                />
                <Text style={styles.label}>Country*</Text>
                <DropDownPicker
                    open={countryOpen}
                    value={country}
                    items={countries}
                    setOpen={setCountryOpen}
                    setValue={setCountry}
                    setItems={setCountries}
                    placeholder="Select Country"
                    placeholderStyle={styles.placeholder}
                    searchable={true}
                    searchPlaceholder="Search country..."
<<<<<<< HEAD
                    style={styles.dropdownInput}
=======
                    style={styles.input}
>>>>>>> 2c17bcbc2f9294663fa9f922974886a98acccf2e
                    containerStyle={styles.dropdownContainer}
                    dropDownContainerStyle={styles.dropdownMenuContainer}
                />

                <TouchableOpacity style={styles.button} onPress={handleSignUp}>
                    <Text style={styles.buttonText}>Sign Up</Text>
                </TouchableOpacity>

                {/* CAPTCHA Modal */}
                <Modal
                    visible={isCaptchaVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setIsCaptchaVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.captchaLabel}>{captchaQuestion}</Text>
                            <TextInput
                                style={styles.input}
                                value={userAnswer}
                                onChangeText={setUserAnswer}
                                keyboardType="numeric"
                                placeholder="Enter your answer"
                                placeholderTextColor="#A9A9A9"
                            />
                            <TouchableOpacity style={styles.button} onPress={handleCaptchaSubmit}>
                                <Text style={styles.buttonText}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
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
<<<<<<< HEAD
        padding: 30,
=======
        padding: 20,
>>>>>>> 2c17bcbc2f9294663fa9f922974886a98acccf2e
        backgroundColor: '#f9f9f9',
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        color: '#A9A9A9',
        marginLeft: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 5,
        paddingLeft: 10,
<<<<<<< HEAD
        marginBottom: 10,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
    },
    dropdownInput: {
        borderWidth: 1,
        borderColor: '#00a651',
        paddingLeft: 10,
=======
>>>>>>> 2c17bcbc2f9294663fa9f922974886a98acccf2e
        marginBottom: 20,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
<<<<<<< HEAD
        minHeight: 40,
        maxHeight: 40,
=======
>>>>>>> 2c17bcbc2f9294663fa9f922974886a98acccf2e
    },
    placeholder: {
        color: '#A9A9A9',
    },
    dropdownContainer: {
<<<<<<< HEAD
        marginBottom: 10,
=======
        marginBottom: 20,
>>>>>>> 2c17bcbc2f9294663fa9f922974886a98acccf2e
        height: 40,
    },
    dropdownMenuContainer: {
        borderColor: '#00a651',
<<<<<<< HEAD
        borderRadius: 20,
=======
>>>>>>> 2c17bcbc2f9294663fa9f922974886a98acccf2e
    },
    button: {
        backgroundColor: '#00a651',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#00a651',
        borderRadius: 20,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    activeToggleButton: {
        backgroundColor: '#00a651',
    },
    toggleButtonText: {
        color: '#00a651',
        fontWeight: 'bold',
    },
    activeToggleButtonText: {
        color: '#fff',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#f9f9f9',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    captchaLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#00a651',
        marginBottom: 10,
    },
});

export default SignUp;