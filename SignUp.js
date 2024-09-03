import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';

const SignUp = () => {
    const [donorName, setDonorName] = useState('');
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
        { label: 'Israel', value: 'Israel' },
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
    
    const navigation = useNavigation();

    const handleSignUp = async () => {
        try {
            const donorData = {
                DonorName: donorName,
                DonorType: organizationType,
                Address: address,
                PhoneNumber: phoneNumber,
                Email: email,
                DonorCountry: country,
                IsActive: null,
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
                <DropDownPicker
                    open={countryOpen}
                    value={country}
                    items={countries}
                    setOpen={setCountryOpen}
                    setValue={setCountry}
                    setItems={setCountries}
                    placeholder="Select Country"
                    searchable={true}
                    searchPlaceholder="Search country..."
                    style={styles.dropdown}
                    containerStyle={{ marginBottom: 20 }}
                    dropDownContainerStyle={styles.dropdownContainer}
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
    dropdownContainer: {
        borderColor: '#00a651',
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
