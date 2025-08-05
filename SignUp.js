import React, { useState, useLayoutEffect } from 'react';
import { View, TextInput, Text, StyleSheet, Alert, Image, TouchableOpacity, ScrollView, Modal, FlatList, Platform } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import CountryPicker from '@realtril/react-native-country-picker-modal';
import DateTimePicker from '@react-native-community/datetimepicker';

const SignUp = () => {
    const [userType, setUserType] = useState('Donor'); // Toggle between Donor and Recipient
    const [donorName, setDonorName] = useState('');
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [decreeNumber, setDecreeNumber] = useState('');
    const [registrationDate, setRegistrationDate] = useState('');
    const [website, setWebsite] = useState('');
    const [contactPersonName, setContactPersonName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [open, setOpen] = useState(false);
    const [organizationType, setOrganizationType] = useState(null);
    const [items, setItems] = useState([
        { label: 'Organisation', value: 'Organisation' },
        { label: 'Individual', value: 'Individual' },
    ]);
    const [organizationCategoryOpen, setOrganizationCategoryOpen] = useState(false);
    const [organizationCategory, setOrganizationCategory] = useState(null);
    const [organizationCategories, setOrganizationCategories] = useState([
        { label: 'International Development and Financing Institutions', value: 'international_development' },
        { label: 'Government Bodies / Institutions', value: 'government_bodies' },
        { label: 'Public Service Providers', value: 'public_service' },
        { label: 'Private Sector', value: 'private_sector' },
        { label: 'Nonprofit Organizations, Networks & Associations', value: 'nonprofit' },
    ]);
    const [organizationSubTypeOpen, setOrganizationSubTypeOpen] = useState(false);
    const [organizationSubType, setOrganizationSubType] = useState(null);
    const [organizationSubTypes, setOrganizationSubTypes] = useState([]);
    const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
    const [subTypePickerVisible, setSubTypePickerVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [userAnswer, setUserAnswer] = useState('');
    const [captchaQuestion, setCaptchaQuestion] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState(null);
    const [isCaptchaVisible, setIsCaptchaVisible] = useState(false);
    const [countryCode, setCountryCode] = useState('');
    const [country, setCountry] = useState('');
    const [countryVisible, setCountryVisible] = useState(false);

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
    
    const onSelectCountry = (country) => {
        setCountryCode(country.cca2);
        setCountry(country.name);
        setCountryVisible(false);
    };

    const getOrganizationCategoryLabel = (value) => {
        const category = organizationCategories.find(cat => cat.value === value);
        return category ? category.label : 'Select Organization Category';
    };

    const getOrganizationSubTypeLabel = (value) => {
        const subType = organizationSubTypes.find(sub => sub.value === value);
        return subType ? subType.label : 'Select Organization Type';
    };

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
        setShowDatePicker(Platform.OS === 'ios');
        setSelectedDate(currentDate);
        setRegistrationDate(formatDate(currentDate));
    };

    const renderCategoryPicker = () => (
        <Modal
            visible={categoryPickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setCategoryPickerVisible(false)}
        >
            <View style={styles.pickerModalContainer}>
                <View style={styles.pickerModalContent}>
                    <View style={styles.pickerHeader}>
                        <Text style={styles.pickerTitle}>Select Organization Category</Text>
                        <TouchableOpacity 
                            onPress={() => setCategoryPickerVisible(false)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={organizationCategories}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.pickerItem,
                                    organizationCategory === item.value && styles.selectedPickerItem
                                ]}
                                onPress={() => {
                                    setOrganizationCategory(item.value);
                                    setCategoryPickerVisible(false);
                                }}
                            >
                                <Text style={[
                                    styles.pickerItemText,
                                    organizationCategory === item.value && styles.selectedPickerItemText
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={true}
                        style={styles.pickerList}
                    />
                </View>
            </View>
        </Modal>
    );

    const renderSubTypePicker = () => (
        <Modal
            visible={subTypePickerVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setSubTypePickerVisible(false)}
        >
            <View style={styles.pickerModalContainer}>
                <View style={styles.pickerModalContent}>
                    <View style={styles.pickerHeader}>
                        <Text style={styles.pickerTitle}>Select Organization Type</Text>
                        <TouchableOpacity 
                            onPress={() => setSubTypePickerVisible(false)}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={organizationSubTypes}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.pickerItem,
                                    organizationSubType === item.value && styles.selectedPickerItem
                                ]}
                                onPress={() => {
                                    setOrganizationSubType(item.value);
                                    setSubTypePickerVisible(false);
                                }}
                            >
                                <Text style={[
                                    styles.pickerItemText,
                                    organizationSubType === item.value && styles.selectedPickerItemText
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        )}
                        showsVerticalScrollIndicator={true}
                        style={styles.pickerList}
                    />
                </View>
            </View>
        </Modal>
    );
    
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

    // Update organization sub-types based on selected category
    React.useEffect(() => {
        if (organizationCategory) {
            let subTypes = [];
            switch (organizationCategory) {
                case 'international_development':
                    subTypes = [
                        { label: 'Multilateral Organizations', value: 'multilateral_organizations' },
                        { label: 'Bilateral Development', value: 'bilateral_development' },
                        { label: 'Development Fund', value: 'development_fund' },
                        { label: 'Other Financing Mechanism', value: 'other_financing_mechanism' },
                    ];
                    break;
                case 'government_bodies':
                    subTypes = [
                        { label: 'Central / Federal Government Body', value: 'central_federal_government' },
                        { label: 'Regional/local authority', value: 'regional_local_authority' },
                        { label: 'Government agency', value: 'government_agency' },
                        { label: 'National Bank', value: 'national_bank' },
                        { label: 'Trade / Export promotion agency', value: 'trade_export_agency' },
                        { label: 'Other government entity', value: 'other_government_entity' },
                    ];
                    break;
                case 'public_service':
                    subTypes = [
                        { label: 'Academic institution', value: 'academic_institution' },
                        { label: 'Healthcare institution', value: 'healthcare_institution' },
                        { label: 'Utility', value: 'utility' },
                        { label: 'Other public service entity', value: 'other_public_service' },
                    ];
                    break;
                case 'private_sector':
                    subTypes = [
                        { label: 'Consulting organization', value: 'consulting_organization' },
                        { label: 'Engineering firm', value: 'engineering_firm' },
                        { label: 'Supplier/manufacturer', value: 'supplier_manufacturer' },
                        { label: 'Financial service provider/bank', value: 'financial_service_provider' },
                        { label: 'Other business entity', value: 'other_business_entity' },
                    ];
                    break;
                case 'nonprofit':
                    subTypes = [
                        { label: 'NGO (Non-Governmental Organization)', value: 'ngo' },
                        { label: 'Foundation/charity', value: 'foundation_charity' },
                        { label: 'Nonprofit institute/think tank', value: 'nonprofit_institute' },
                        { label: 'Chamber of Commerce', value: 'chamber_of_commerce' },
                        { label: 'Professional / trade association', value: 'professional_trade_association' },
                        { label: 'Other nonprofit entity', value: 'other_nonprofit_entity' },
                    ];
                    break;
                default:
                    subTypes = [];
            }
            setOrganizationSubTypes(subTypes);
            setOrganizationSubType(null); // Reset sub-type when category changes
        }
    }, [organizationCategory]);
   
    const handleVerifyCaptcha = () => {
        if (parseInt(userAnswer) === correctAnswer) {
            return true;
        } else {
            Alert.alert('Error', 'Incorrect CAPTCHA. Please try again.');
            return false;
        }
    };

    const validatePassword = () => {
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return false;
        }
        return true;
    };
    

    const handleSignUp = () => {
        if (!validatePassword()) return;
        
        // Validate organization fields if organization type is selected
        if (organizationType === 'Organisation') {
            if (!organizationCategory) {
                Alert.alert('Error', 'Please select an organization category');
                return;
            }
            if (!organizationSubType) {
                Alert.alert('Error', 'Please select an organization type');
                return;
            }
        }
        
        generateCaptcha(); // Generate a CAPTCHA question
        setIsCaptchaVisible(true); // Show the CAPTCHA modal
    };

    const handleCaptchaSubmit = async () => {
        if (!handleVerifyCaptcha()) return;

        setIsCaptchaVisible(false); // Hide the CAPTCHA modal

        try {
            if (userType === 'Donor') {
                const donorData = {
                    DonorName: organizationType === 'Individual' ? `${name} ${lastName}` : organizationName,
                    DonorType: organizationType,
                    Address: address,
                    PhoneNumber: phoneNumber,
                    Email: email,
                    DonorCountry: country,
                    IsActive: null,
                    ...(organizationType === 'Organisation' && {
                        OrganizationCategory: organizationCategory,
                        OrganizationSubType: organizationSubType,
                    }),
                };

                const endpoint = 'users/Donor/register';

                await axios.post(`https://apiv2.medleb.org/${endpoint}`, {
                    donorData,
                    username: organizationType === 'Individual' ? `${name} ${lastName}` : organizationName,
                    password,
                });
            } else if (userType === 'Recipient') {
                const recipientData = {
                    RecipientName: organizationType === 'Individual' ? `${name} ${lastName}` : organizationName,
                    RecipientType: organizationType,
                    Address: address,
                    City: city,
                    Country: country,
                    ContactPerson: organizationType === 'Organisation' ? contactPersonName : '',
                    ContactNumber: phoneNumber,
                    IsActive: null,
                    ...(organizationType === 'Organisation' && {
                        OrganizationCategory: organizationCategory,
                        OrganizationSubType: organizationSubType,
                    }),
                };

                const endpoint = 'users/Recipient/register';

                await axios.post(`https://apiv2.medleb.org/${endpoint}`, {
                    recipientData,
                    username: organizationType === 'Individual' ? `${name} ${lastName}` : organizationName,
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

    const renderIndividualFields = () => (
        <>
            <Text style={styles.label}>Country*</Text>
            <TouchableOpacity 
                style={styles.countryPickerButton} 
                onPress={() => setCountryVisible(true)}
            >
                <Text style={[styles.countryPickerText, !country && styles.placeholder]}>
                    {country || 'Select Country'}
                </Text>
            </TouchableOpacity>
            
            {countryVisible && (
                <CountryPicker
                    visible={countryVisible}
                    onSelect={onSelectCountry}
                    onClose={() => setCountryVisible(false)}
                    withFilter
                    withFlag
                    withCountryNameButton
                    withAlphaFilter
                    withCallingCode
                    countryCode={countryCode || 'LB'}
                    excludeCountries={['IL']}
                />
            )}

            <Text style={styles.label}>Name*</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="First Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Last Name*</Text>
            <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Email*</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#A9A9A9"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone Number"
                placeholderTextColor="#A9A9A9"
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Address"
                placeholderTextColor="#A9A9A9"
            />
        </>
    );

    const renderOrganizationFields = () => (
        <>
            <Text style={styles.label}>Country*</Text>
            <TouchableOpacity 
                style={styles.countryPickerButton} 
                onPress={() => setCountryVisible(true)}
            >
                <Text style={[styles.countryPickerText, !country && styles.placeholder]}>
                    {country || 'Select Country'}
                </Text>
            </TouchableOpacity>
            
            {countryVisible && (
                <CountryPicker
                    visible={countryVisible}
                    onSelect={onSelectCountry}
                    onClose={() => setCountryVisible(false)}
                    withFilter
                    withFlag
                    withCountryNameButton
                    withAlphaFilter
                    withCallingCode
                    countryCode={countryCode || 'LB'}
                    excludeCountries={['IL']}
                />
            )}

            <Text style={styles.label}>Organization Category*</Text>
            <TouchableOpacity 
                style={styles.pickerButton} 
                onPress={() => setCategoryPickerVisible(true)}
            >
                <Text style={[styles.pickerButtonText, !organizationCategory && styles.placeholder]}>
                    {getOrganizationCategoryLabel(organizationCategory)}
                </Text>
            </TouchableOpacity>

            {organizationCategory && (
                <>
                    <Text style={styles.label}>Organization Type*</Text>
                    <TouchableOpacity 
                        style={styles.pickerButton} 
                        onPress={() => setSubTypePickerVisible(true)}
                    >
                        <Text style={[styles.pickerButtonText, !organizationSubType && styles.placeholder]}>
                            {getOrganizationSubTypeLabel(organizationSubType)}
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            <Text style={styles.label}>Organization Name*</Text>
            <TextInput
                style={styles.input}
                value={organizationName}
                onChangeText={setOrganizationName}
                placeholder="Organization Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Decree Number*</Text>
            <TextInput
                style={styles.input}
                value={decreeNumber}
                onChangeText={setDecreeNumber}
                placeholder="Decree Number"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Registration Date*</Text>
            <TouchableOpacity 
                style={styles.datePickerButton} 
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={[styles.datePickerText, !registrationDate && styles.placeholder]}>
                    {registrationDate || 'Select Registration Date'}
                </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                />
            )}

            <Text style={styles.label}>Attach Document*</Text>
            <TouchableOpacity style={styles.fileUploadButton}>
                <Text style={styles.fileUploadText}>Choose File</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Website (Optional)</Text>
            <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="Website URL"
                placeholderTextColor="#A9A9A9"
                keyboardType="url"
            />

            <Text style={styles.label}>Contact Person Name*</Text>
            <TextInput
                style={styles.input}
                value={contactPersonName}
                onChangeText={setContactPersonName}
                placeholder="Contact Person Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Email*</Text>
            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#A9A9A9"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone Number"
                placeholderTextColor="#A9A9A9"
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Address"
                placeholderTextColor="#A9A9A9"
            />
        </>
    );

    const renderRecipientIndividualFields = () => (
        <>
            <Text style={styles.label}>Country*</Text>
            <TouchableOpacity 
                style={styles.countryPickerButton} 
                onPress={() => setCountryVisible(true)}
            >
                <Text style={[styles.countryPickerText, !country && styles.placeholder]}>
                    {country || 'Select Country'}
                </Text>
            </TouchableOpacity>
            
            {countryVisible && (
                <CountryPicker
                    visible={countryVisible}
                    onSelect={onSelectCountry}
                    onClose={() => setCountryVisible(false)}
                    withFilter
                    withFlag
                    withCountryNameButton
                    withAlphaFilter
                    withCallingCode
                    countryCode={countryCode || 'LB'}
                    excludeCountries={['IL']}
                />
            )}

            <Text style={styles.label}>Name*</Text>
            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="First Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Last Name*</Text>
            <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone Number"
                placeholderTextColor="#A9A9A9"
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Address"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>City*</Text>
            <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#A9A9A9"
            />
        </>
    );

    const renderRecipientOrganizationFields = () => (
        <>
            <Text style={styles.label}>Country*</Text>
            <TouchableOpacity 
                style={styles.countryPickerButton} 
                onPress={() => setCountryVisible(true)}
            >
                <Text style={[styles.countryPickerText, !country && styles.placeholder]}>
                    {country || 'Select Country'}
                </Text>
            </TouchableOpacity>
            
            {countryVisible && (
                <CountryPicker
                    visible={countryVisible}
                    onSelect={onSelectCountry}
                    onClose={() => setCountryVisible(false)}
                    withFilter
                    withFlag
                    withCountryNameButton
                    withAlphaFilter
                    withCallingCode
                    countryCode={countryCode || 'LB'}
                    excludeCountries={['IL']}
                />
            )}

            <Text style={styles.label}>Organization Category*</Text>
            <TouchableOpacity 
                style={styles.pickerButton} 
                onPress={() => setCategoryPickerVisible(true)}
            >
                <Text style={[styles.pickerButtonText, !organizationCategory && styles.placeholder]}>
                    {getOrganizationCategoryLabel(organizationCategory)}
                </Text>
            </TouchableOpacity>

            {organizationCategory && (
                <>
                    <Text style={styles.label}>Organization Type*</Text>
                    <TouchableOpacity 
                        style={styles.pickerButton} 
                        onPress={() => setSubTypePickerVisible(true)}
                    >
                        <Text style={[styles.pickerButtonText, !organizationSubType && styles.placeholder]}>
                            {getOrganizationSubTypeLabel(organizationSubType)}
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            <Text style={styles.label}>Organization Name*</Text>
            <TextInput
                style={styles.input}
                value={organizationName}
                onChangeText={setOrganizationName}
                placeholder="Organization Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Contact Person Name*</Text>
            <TextInput
                style={styles.input}
                value={contactPersonName}
                onChangeText={setContactPersonName}
                placeholder="Contact Person Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone Number"
                placeholderTextColor="#A9A9A9"
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Address"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>City*</Text>
            <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#A9A9A9"
            />
        </>
    );

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
                            style={styles.input}
                            containerStyle={styles.dropdownContainer}
                            dropDownContainerStyle={styles.dropdownMenuContainer}
                        />
                    </>
                )}

                {userType === 'Recipient' && (
                    <>
                        <Text style={styles.label}>Recipient Type*</Text>
                        <DropDownPicker
                            open={open}
                            value={organizationType}
                            items={items}
                            setOpen={setOpen}
                            setValue={setOrganizationType}
                            setItems={setItems}
                            placeholder="Select Recipient Type"
                            placeholderStyle={styles.placeholder}
                            style={styles.input}
                            containerStyle={styles.dropdownContainer}
                            dropDownContainerStyle={styles.dropdownMenuContainer}
                        />
                    </>
                )}

                {userType === 'Donor' && organizationType === 'Individual' && renderIndividualFields()}
                {userType === 'Donor' && organizationType === 'Organisation' && renderOrganizationFields()}
                {userType === 'Recipient' && organizationType === 'Individual' && renderRecipientIndividualFields()}
                {userType === 'Recipient' && organizationType === 'Organisation' && renderRecipientOrganizationFields()}

                <Text style={styles.label}>Password*</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Password (min 8 characters)"
                    placeholderTextColor="#A9A9A9"
                    secureTextEntry
                />

                <Text style={styles.label}>Confirm Password*</Text>
                <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm Password"
                    placeholderTextColor="#A9A9A9"
                    secureTextEntry
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

                {/* Organization Category Picker Modal */}
                {renderCategoryPicker()}

                {/* Organization Sub-Type Picker Modal */}
                {renderSubTypePicker()}
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
        marginBottom: 20,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
    },
    placeholder: {
        color: '#A9A9A9',
    },
    dropdownContainer: {
        marginBottom: 20,
        height: 40,
    },
    dropdownMenuContainer: {
        borderColor: '#00a651',
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
    fileUploadButton: {
        borderWidth: 1,
        borderColor: '#00a651',
        borderStyle: 'dashed',
        padding: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileUploadText: {
        color: '#00a651',
        fontSize: 14,
    },
    countryPickerButton: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
    },
    countryPickerText: {
        fontSize: 14,
        color: '#000',
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
    },
    pickerButtonText: {
        fontSize: 14,
        color: '#000',
    },
    datePickerButton: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
    },
    datePickerText: {
        fontSize: 14,
        color: '#000',
    },
    pickerModalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    pickerModalContent: {
        width: '85%',
        maxHeight: '70%',
        backgroundColor: '#f9f9f9',
        borderRadius: 20,
        overflow: 'hidden',
    },
    pickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#00a651',
    },
    pickerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    pickerList: {
        maxHeight: 400,
    },
    pickerItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#f9f9f9',
    },
    selectedPickerItem: {
        backgroundColor: '#e8f5e8',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#333',
    },
    selectedPickerItemText: {
        color: '#00a651',
        fontWeight: 'bold',
    },
});

export default SignUp;