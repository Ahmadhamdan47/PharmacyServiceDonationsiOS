import React, { useState, useLayoutEffect } from 'react';
import { 
    View, 
    TextInput, 
    Text, 
    StyleSheet, 
    Alert, 
    Image, 
    TouchableOpacity, 
    ScrollView, 
    Modal, 
    FlatList, 
    Platform,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Keyboard,
} from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import DropDownPicker from 'react-native-dropdown-picker';
import { CountryPicker } from 'react-native-country-codes-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';

const SignUp = () => {
    const [userType, setUserType] = useState('Donor'); // Toggle between Donor and Recipient
    const [donorName, setDonorName] = useState('');
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [organizationName, setOrganizationName] = useState('');
    const [decreeNumber, setDecreeNumber] = useState('');
    const [registrationDate, setRegistrationDate] = useState('');
    const [website, setWebsite] = useState('');
    const [contactPersonName, setContactPersonName] = useState('');
    const [contactPersonFirstName, setContactPersonFirstName] = useState('');
    const [contactPersonLastName, setContactPersonLastName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [open, setOpen] = useState(false);
    const [organizationType, setOrganizationType] = useState(null);
    const [items, setItems] = useState([
        { label: 'Organization', value: 'organization' },
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
    const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
    const [phoneCountryFlag, setPhoneCountryFlag] = useState('US');
    const [phoneCountryVisible, setPhoneCountryVisible] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentUploading, setDocumentUploading] = useState(false);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Sign Up',
            headerTitleAlign: 'center',
            headerLeft: () => null,
            headerRight: () => null,
            headerStyle: {
                backgroundColor: '#f9f9f9',
            },
            headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
                color: '#333',
                textAlign: 'center',
                alignSelf: 'center',
                flex: 1,
                paddingRight: 60,
                marginTop: 20,
            },
        });
    }, [navigation]);

    const navigation = useNavigation();
    
    const onSelectCountry = (country) => {
        setCountryCode(country.cca2);
        setCountry(country.name);
        setCountryVisible(false);
        clearFieldError('country');
    };

    const onSelectPhoneCountry = (country) => {
        setPhoneCountryCode(country.dial_code);
        setPhoneCountryFlag(country.code);
        setPhoneCountryVisible(false);
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
                                    clearFieldError('organizationCategory');
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
                                    clearFieldError('organizationSubType');
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

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const hasFieldError = (fieldName) => {
        return validationErrors.includes(fieldName);
    };

    const clearFieldError = (fieldName) => {
        setValidationErrors(prev => prev.filter(error => error !== fieldName));
    };

    const clearAllFields = () => {
        // Clear all form fields
        setName('');
        setLastName('');
        setUsername('');
        setOrganizationName('');
        setDecreeNumber('');
        setRegistrationDate('');
        setWebsite('');
        setContactPersonName('');
        setContactPersonFirstName('');
        setContactPersonLastName('');
        setAddress('');
        setCity('');
        setPhoneNumber('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setOrganizationType(null);
        setOrganizationCategory(null);
        setOrganizationSubType(null);
        setCountry('');
        setCountryCode('');
        setPhoneCountryCode('+1');
        setPhoneCountryFlag('US');
        setSelectedDocument(null);
        setDocumentUploading(false);
        setValidationErrors([]);
        setUserAnswer('');
        
        // Reset picker states
        setOpen(false);
        setOrganizationCategoryOpen(false);
        setOrganizationSubTypeOpen(false);
        setCategoryPickerVisible(false);
        setSubTypePickerVisible(false);
        setCountryVisible(false);
        setPhoneCountryVisible(false);
        setShowDatePicker(false);
        setIsCaptchaVisible(false);
        
        // Reset date
        setSelectedDate(new Date());
        
        // Generate new CAPTCHA
        generateCaptcha();
    };

    const selectDocument = async () => {
        try {
            console.log('Starting document selection...');
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
                multiple: false,
            });
            
            console.log('Document picker result:', JSON.stringify(result, null, 2));
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                // For newer versions of expo-document-picker (v11+)
                const selectedFile = result.assets[0];
                console.log('Document selected (new format):', selectedFile.name);
                setSelectedDocument(selectedFile);
                clearFieldError('document');
                Alert.alert('Success', `Document "${selectedFile.name}" selected successfully!`);
            } else if (result.type === 'success') {
                // For older versions of expo-document-picker
                console.log('Document selected (old format):', result.name);
                setSelectedDocument(result);
                clearFieldError('document');
                Alert.alert('Success', `Document "${result.name}" selected successfully!`);
            } else {
                console.log('Document selection cancelled or failed');
            }
        } catch (err) {
            console.error('Document selection error:', err);
            Alert.alert('Error', `Failed to select document: ${err.message}`);
        }
    };

    const uploadDocument = async () => {
        if (!selectedDocument) {
            Alert.alert('Error', 'Please select a document first');
            return null;
        }

        setDocumentUploading(true);
        
        try {
            const formData = new FormData();
            
            // Handle different document structures from expo-document-picker
            const documentUri = selectedDocument.uri;
            const documentType = selectedDocument.mimeType || selectedDocument.type;
            const documentName = selectedDocument.name || selectedDocument.filename || 'document';
            const documentSize = selectedDocument.size;
            
            formData.append('file', {
                uri: documentUri,
                type: documentType,
                name: documentName,
            });
            
            const metadata = {
                originalName: documentName,
                size: documentSize,
                type: documentType,
                uploadedBy: organizationType === 'Individual' ? `${name} ${lastName}` : organizationName,
                purpose: 'registration_document'
            };
            
            formData.append('metadata', JSON.stringify(metadata));

            const response = await axios.post('https://apiv2.medleb.org/files/registration/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setDocumentUploading(false);
            return response.data;
        } catch (error) {
            setDocumentUploading(false);
            console.error('Document upload error:', error);
            
            let errorMessage = 'Failed to upload document';
            if (error.response) {
                if (error.response.status === 400) {
                    errorMessage = 'Invalid file format or file too large';
                } else if (error.response.status === 401) {
                    errorMessage = 'Authentication error - please try again';
                } else if (error.response.status === 403) {
                    errorMessage = 'Access denied for file upload';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            }
            
            Alert.alert('Upload Error', errorMessage);
            return null;
        }
    };

    const validateRequiredFields = () => {
        const missingFields = [];
        const errors = [];
        const invalidFields = [];

        // Common validations for all user types
        if (!organizationType) {
            missingFields.push(`${userType} Type`);
            errors.push('organizationType');
        }
        
        // Only validate country for Donor (Recipients are always Lebanon)
        if (userType === 'Donor') {
            if (!country) {
                missingFields.push('Country');
                errors.push('country');
            }
        } else {
            // For recipients, set country to Lebanon
            setCountry('Lebanon');
            setCountryCode('LB');
        }
        
        if (!email) {
            missingFields.push('Email');
            errors.push('email');
        } else if (!validateEmail(email)) {
            invalidFields.push('Email format is invalid');
            errors.push('email');
        }
        if (!phoneNumber) {
            missingFields.push('Phone Number');
            errors.push('phoneNumber');
        }
        if (!address) {
            missingFields.push('Address');
            errors.push('address');
        }
        if (!password) {
            missingFields.push('Password');
            errors.push('password');
        } else if (password.length < 8) {
            invalidFields.push('Password must be at least 8 characters long');
            errors.push('password');
        }
        if (!confirmPassword) {
            missingFields.push('Confirm Password');
            errors.push('confirmPassword');
        } else if (password !== confirmPassword) {
            invalidFields.push('Passwords do not match');
            errors.push('password', 'confirmPassword');
        }

        // Individual specific validations
        if (organizationType === 'Individual') {
            if (!name) {
                missingFields.push('Name');
                errors.push('name');
            }
            if (!lastName) {
                missingFields.push('Last Name');
                errors.push('lastName');
            }
            if (!username) {
                missingFields.push('Username');
                errors.push('username');
            }
            
            // Recipient Individual specific validation
            if (userType === 'Recipient' && !city) {
                missingFields.push('City');
                errors.push('city');
            }
        }

        // Organization specific validations
        if (organizationType === 'organization') {
            if (!organizationCategory) {
                missingFields.push('Organization Category');
                errors.push('organizationCategory');
            }
            if (!organizationSubType) {
                missingFields.push('Organization Type');
                errors.push('organizationSubType');
            }
            if (!organizationName) {
                missingFields.push('Organization Name');
                errors.push('organizationName');
            }

            // Donor Organization specific validations
            if (userType === 'Donor') {
                if (!decreeNumber) {
                    missingFields.push('Decree Number');
                    errors.push('decreeNumber');
                }
                if (!registrationDate) {
                    missingFields.push('Registration Date');
                    errors.push('registrationDate');
                }
                if (!contactPersonFirstName) {
                    missingFields.push('Contact Person First Name');
                    errors.push('contactPersonFirstName');
                }
                if (!contactPersonLastName) {
                    missingFields.push('Contact Person Last Name');
                    errors.push('contactPersonLastName');
                }
                if (!selectedDocument) {
                    missingFields.push('Document');
                    errors.push('document');
                }
            }

            // Recipient Organization specific validations
            if (userType === 'Recipient') {
                if (!contactPersonFirstName) {
                    missingFields.push('Contact Person First Name');
                    errors.push('contactPersonFirstName');
                }
                if (!contactPersonLastName) {
                    missingFields.push('Contact Person Last Name');
                    errors.push('contactPersonLastName');
                }
                if (!city) {
                    missingFields.push('City');
                    errors.push('city');
                }
            }
        }

        if (missingFields.length > 0 || invalidFields.length > 0) {
            setValidationErrors(errors);
            
            let errorMessage = '';
            if (missingFields.length > 0) {
                errorMessage += `Missing required fields:\n• ${missingFields.join('\n• ')}`;
            }
            if (invalidFields.length > 0) {
                if (errorMessage) errorMessage += '\n\n';
                errorMessage += `Validation errors:\n• ${invalidFields.join('\n• ')}`;
            }
            
            Alert.alert(
                'Validation Errors', 
                errorMessage,
                [{ text: 'OK', style: 'default' }]
            );
            return false;
        }

        setValidationErrors([]);
        return true;
    };
    

    const handleSignUp = () => {
        console.log('🚀 DEBUG - Starting signup process...');
        console.log('Current form validation state before submission');
        
        if (!validateRequiredFields()) {
            console.log('❌ DEBUG - Validation failed, stopping signup process');
            return;
        }
        
        console.log('✅ DEBUG - Validation passed, proceeding to CAPTCHA');
        generateCaptcha(); // Generate a CAPTCHA question
        setIsCaptchaVisible(true); // Show the CAPTCHA modal
    };

    const handleCaptchaSubmit = async () => {
        if (!handleVerifyCaptcha()) return;

        setIsCaptchaVisible(false); // Hide the CAPTCHA modal

        // Debug logs for initial form data validation
        console.log('🔍 DEBUG - Form data at signup submission:');
        console.log('userType:', userType);
        console.log('organizationType:', organizationType);
        console.log('name:', name, '| isEmpty:', !name || name.trim() === '');
        console.log('lastName:', lastName, '| isEmpty:', !lastName || lastName.trim() === '');
        console.log('organizationName:', organizationName, '| isEmpty:', !organizationName || organizationName.trim() === '');
        console.log('email:', email, '| isEmpty:', !email || email.trim() === '');
        console.log('password length:', password ? password.length : 0);
        console.log('address:', address, '| isEmpty:', !address || address.trim() === '');
        console.log('phoneNumber:', phoneNumber, '| isEmpty:', !phoneNumber || phoneNumber.trim() === '');
        console.log('country:', country, '| isEmpty:', !country || country.trim() === '');

        try {
            let uploadedDocumentData = null;
            
            // Upload document if it's a donor organization
            if (userType === 'Donor' && organizationType === 'organization' && selectedDocument) {
                uploadedDocumentData = await uploadDocument();
                if (!uploadedDocumentData) {
                    return; // Stop if document upload failed
                }
            }

            if (userType === 'Donor') {
                const donorData = {
                    DonorName: organizationType === 'Individual' ? `${name} ${lastName}` : organizationName,
                    DonorType: organizationType,
                    Address: address,
                    PhoneNumber: `${phoneCountryCode} ${phoneNumber}`,
                    Email: email,
                    DonorCountry: country,
                    IsActive: null,
                    ...(organizationType === 'organization' && {
                        OrganizationCategory: organizationCategory,
                        OrganizationSubType: organizationSubType,
                        ...(uploadedDocumentData && {
                            DocumentId: uploadedDocumentData.fileId || uploadedDocumentData.id,
                            DocumentUrl: uploadedDocumentData.url || uploadedDocumentData.fileUrl
                        })
                    }),
                };

                // Debug logs for donorData validation
                console.log('🔍 DEBUG - Donor Data validation:');
                console.log('donorData:', JSON.stringify(donorData, null, 2));
                console.log('donorData is null/undefined:', donorData === null || donorData === undefined);
                console.log('donorData is empty object:', Object.keys(donorData).length === 0);
                
                // Check for empty/null critical fields
                const criticalFields = ['DonorName', 'DonorType', 'Email'];
                criticalFields.forEach(field => {
                    const value = donorData[field];
                    console.log(`${field}:`, value, '| isEmpty:', !value || value.trim() === '');
                });

                const accountUsername = organizationType === 'Individual' ? username : organizationName;
                console.log('🔍 DEBUG - Account credentials validation:');
                console.log('accountUsername:', accountUsername, '| isEmpty:', !accountUsername || accountUsername.trim() === '');
                console.log('password:', password ? '***HIDDEN***' : 'EMPTY/NULL', '| isEmpty:', !password || password.trim() === '');

                // Validate data before sending
                if (!donorData || Object.keys(donorData).length === 0) {
                    console.error('❌ ERROR: donorData is null, undefined, or empty');
                    Alert.alert('Error', 'Donor data is missing. Please try again.');
                    return;
                }

                if (!accountUsername || accountUsername.trim() === '') {
                    console.error('❌ ERROR: username is empty or null');
                    Alert.alert('Error', 'Username cannot be empty. Please check your username field.');
                    return;
                }

                if (!password || password.trim() === '') {
                    console.error('❌ ERROR: password is empty or null');
                    Alert.alert('Error', 'Password cannot be empty.');
                    return;
                }

                const endpoint = 'users/Donor/register';

                const requestPayload = {
                    donorData,
                    username: accountUsername,
                    password,
                };

                // Debug log the exact payload being sent
                console.log('🔍 DEBUG - Complete request payload for donor registration:');
                console.log('endpoint:', endpoint);
                console.log('requestPayload:', JSON.stringify(requestPayload, null, 2));
                console.log('donorData.Email vs accountUsername comparison:');
                console.log('donorData.Email:', donorData.Email);
                console.log('accountUsername:', accountUsername);
                console.log('Are they the same?:', donorData.Email === accountUsername);

                await axios.post(`https://apiv2.medleb.org/${endpoint}`, requestPayload);

                console.log('✅ DEBUG - Donor registration successful');
            } else if (userType === 'Recipient') {
                const recipientData = {
                    RecipientName: organizationType === 'Individual' ? `${name} ${lastName}` : organizationName,
                    RecipientType: organizationType,
                    Address: address,
                    City: city,
                    Country: 'Lebanon', // Always Lebanon for recipients
                    Email: email,
                    ContactPerson: organizationType === 'organization' ? `${contactPersonFirstName} ${contactPersonLastName}` : '',
                    ContactNumber: `${phoneCountryCode} ${phoneNumber}`,
                    IsActive: null,
                    ...(organizationType === 'organization' && {
                        OrganizationCategory: organizationCategory,
                        OrganizationSubType: organizationSubType,
                    }),
                };

                // Debug logs for recipientData validation
                console.log('🔍 DEBUG - Recipient Data validation:');
                console.log('recipientData:', JSON.stringify(recipientData, null, 2));
                console.log('recipientData is null/undefined:', recipientData === null || recipientData === undefined);
                console.log('recipientData is empty object:', Object.keys(recipientData).length === 0);
                
                // Check for empty/null critical fields
                const criticalFields = ['RecipientName', 'RecipientType', 'Email'];
                criticalFields.forEach(field => {
                    const value = recipientData[field];
                    console.log(`${field}:`, value, '| isEmpty:', !value || value.trim() === '');
                });

                const accountUsername = organizationType === 'Individual' ? username : organizationName;
                console.log('🔍 DEBUG - Account credentials validation:');
                console.log('accountUsername:', accountUsername, '| isEmpty:', !accountUsername || accountUsername.trim() === '');
                console.log('password:', password ? '***HIDDEN***' : 'EMPTY/NULL', '| isEmpty:', !password || password.trim() === '');

                // Validate data before sending
                if (!recipientData || Object.keys(recipientData).length === 0) {
                    console.error('❌ ERROR: recipientData is null, undefined, or empty');
                    Alert.alert('Error', 'Recipient data is missing. Please try again.');
                    return;
                }

                if (!accountUsername || accountUsername.trim() === '') {
                    console.error('❌ ERROR: username is empty or null');
                    Alert.alert('Error', 'Username cannot be empty. Please check your username field.');
                    return;
                }

                if (!password || password.trim() === '') {
                    console.error('❌ ERROR: password is empty or null');
                    Alert.alert('Error', 'Password cannot be empty.');
                    return;
                }

                const endpoint = 'users/Recipient/register';

                const requestPayload = {
                    recipientData,
                    username: accountUsername,
                    password,
                };

                // Debug log the exact payload being sent
                console.log('🔍 DEBUG - Complete request payload for recipient registration:');
                console.log('endpoint:', endpoint);
                console.log('requestPayload:', JSON.stringify(requestPayload, null, 2));
                console.log('recipientData.Email vs accountUsername comparison:');
                console.log('recipientData.Email:', recipientData.Email);
                console.log('accountUsername:', accountUsername);
                console.log('Are they the same?:', recipientData.Email === accountUsername);

                await axios.post(`https://apiv2.medleb.org/${endpoint}`, requestPayload);

                console.log('✅ DEBUG - Recipient registration successful');
            }

            console.log('🎉 DEBUG - Registration process completed successfully');
            Alert.alert('Success', 'Your Account has been sent for validation', [
                { text: 'OK', onPress: () => navigation.navigate('SignIn') },
            ]);
        } catch (error) {
            console.error(error);
            
            let errorMessage = "Failed to sign up"
            
            if (error.response) {
                // Server responded with error status
                if (error.response.status === 401) {
                    errorMessage = "Authorization failed. Please check your credentials."
                } else if (error.response.status === 400) {
                    errorMessage = error.response.data?.error || error.response.data?.message || "Invalid data provided. Please check all fields."
                } else if (error.response.status === 409) {
                    // Duplicate/Conflict (likely email already used)
                    errorMessage = "This email is already used somewhere else. Please use another email."
                    // Mark email field as invalid to highlight it
                    setValidationErrors(prev => prev.includes('email') ? prev : [...prev, 'email']);
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message
                } else if (error.response.data?.error) {
                    errorMessage = error.response.data.error
                } else {
                    errorMessage = `Server error: ${error.response.status}`
                }

                // Also catch server-provided messages that indicate duplicate email even if status != 409
                const serverMsg = `${error.response.data?.message || error.response.data?.error || ''}`.toLowerCase();
                if (serverMsg.includes('email') && (serverMsg.includes('already') || serverMsg.includes('exists') || serverMsg.includes('taken') || serverMsg.includes('duplicate'))) {
                    errorMessage = "This email is already used somewhere else. Please use another email.";
                    setValidationErrors(prev => prev.includes('email') ? prev : [...prev, 'email']);
                }
            } else if (error.request) {
                // Network error
                errorMessage = "Network error. Please check your connection."
            }
            
            Alert.alert('Sign Up Failed', errorMessage);
        }
    };

    const renderIndividualFields = () => (
        <>
            <Text style={styles.label}>Country*</Text>
            <TouchableOpacity 
                style={hasFieldError('country') ? styles.countryPickerButtonError : styles.countryPickerButton} 
                onPress={() => setCountryVisible(true)}
            >
                <View style={styles.pickerContent}>
                    <Text 
                        style={[styles.countryPickerText, !country && styles.placeholder]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {country || 'Select Country'}
                    </Text>
                    <View style={styles.pickerIconsContainer}>
                        {country && (
                            <TouchableOpacity 
                                onPress={() => {
                                    setCountry('');
                                    setCountryCode('');
                                }}
                                style={styles.clearButton}
                            >
                                <MaterialCommunityIcons name="close" size={16} color="#000000ff" />
                            </TouchableOpacity>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />
                    </View>
                </View>
            </TouchableOpacity>
            
            {countryVisible && (
                <>
                    <CountryPicker
                        show={countryVisible}
                        onBackdropPress={() => setCountryVisible(false)}
                        inputPlaceholder="Search countries..."
                        searchMessage="Search countries..."
                        enableModalAvoiding={true}
                        androidWindowSoftInputMode="adjustResize"
                        excludedCountries={['IL']}
                        style={{
                            modal: {
                                height: '85%',
                                marginTop: '15%',
                            },
                            textInput: { 
                                height: 48, 
                                borderRadius: 12, 
                                paddingHorizontal: 12,
                                marginHorizontal: 10,
                                marginTop: 10,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: '#e0e0e0',
                            },
                            itemsList: { 
                                maxHeight: '90%',
                                paddingHorizontal: 0,
                            },
                            countryButtonStyles: {
                                height: 50,
                                marginHorizontal: 10,
                            },
                        }}
                        pickerButtonOnPress={(item) => {
                            onSelectCountry({ name: item.name.en, cca2: item.code });
                            setCountryVisible(false);
                        }}
                    />

                    {/* Overlay close button above the library's modal */}
                    <Modal visible={countryVisible} transparent animationType="none">
                        <View style={{ flex: 1 }} pointerEvents="box-none">
                            <TouchableOpacity
                                onPress={() => setCountryVisible(false)}
                                style={styles.countryCloseFab}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="close" size={22} color="#f9f9f9" />
                            </TouchableOpacity>
                        </View>
                    </Modal>
                </>
            )}

            <Text style={styles.label}>Name*</Text>
            <TextInput
                style={hasFieldError('name') ? styles.inputError : styles.input}
                value={name}
                onChangeText={(text) => {
                    setName(text);
                    if (text.trim()) clearFieldError('name');
                }}
                placeholder="First Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Last Name*</Text>
            <TextInput
                style={hasFieldError('lastName') ? styles.inputError : styles.input}
                value={lastName}
                onChangeText={(text) => {
                    setLastName(text);
                    if (text.trim()) clearFieldError('lastName');
                }}
                placeholder="Last Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Username*</Text>
            <TextInput
                style={hasFieldError('username') ? styles.inputError : styles.input}
                value={username}
                onChangeText={(text) => {
                    setUsername(text);
                    if (text.trim()) clearFieldError('username');
                }}
                placeholder="Username"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Email*</Text>
            <TextInput
                style={hasFieldError('email') ? styles.inputError : styles.input}
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    if (text.trim()) clearFieldError('email');
                }}
                placeholder="Email"
                placeholderTextColor="#A9A9A9"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <View style={hasFieldError('phoneNumber') ? styles.phoneInputContainerError : styles.phoneInputContainer}>
                <TouchableOpacity 
                    style={styles.countryCodeButton}
                    onPress={() => setPhoneCountryVisible(true)}
                >
                    <Text style={styles.countryCodeText}>{phoneCountryCode}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#000000ff" />
                </TouchableOpacity>
                <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (text.trim()) clearFieldError('phoneNumber');
                    }}
                    placeholder="Phone Number"
                    placeholderTextColor="#A9A9A9"
                    keyboardType="phone-pad"
                />
            </View>

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={hasFieldError('address') ? styles.inputError : styles.input}
                value={address}
                onChangeText={(text) => {
                    setAddress(text);
                    if (text.trim()) clearFieldError('address');
                }}
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
                <View style={styles.pickerContent}>
                    <Text style={[styles.countryPickerText, !country && styles.placeholder]}>
                        {country || 'Select Country'}
                    </Text>
                    <View style={styles.pickerIconsContainer}>
                        {country && (
                            <TouchableOpacity 
                                onPress={() => {
                                    setCountry('');
                                    setCountryCode('');
                                }}
                                style={styles.clearButton}
                            >
                                <MaterialCommunityIcons name="close" size={16} color="#000000ff" />
                            </TouchableOpacity>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />
                    </View>
                </View>
            </TouchableOpacity>
            
            {countryVisible && (
                <>
                    <CountryPicker
                        show={countryVisible}
                        onBackdropPress={() => setCountryVisible(false)}
                        inputPlaceholder="Search countries..."
                        searchMessage="Search countries..."
                        enableModalAvoiding={true}
                        androidWindowSoftInputMode="adjustResize"
                        excludedCountries={['IL']}
                        style={{
                            modal: {
                                height: '85%',
                                marginTop: '15%',
                            },
                            textInput: { 
                                height: 48, 
                                borderRadius: 12, 
                                paddingHorizontal: 12,
                                marginHorizontal: 10,
                                marginTop: 10,
                                marginBottom: 10,
                                borderWidth: 1,
                                borderColor: '#e0e0e0',
                            },
                            itemsList: { 
                                maxHeight: '90%',
                                paddingHorizontal: 0,
                            },
                            countryButtonStyles: {
                                height: 50,
                                marginHorizontal: 10,
                            },
                        }}
                        pickerButtonOnPress={(item) => {
                            onSelectCountry({ name: item.name.en, cca2: item.code });
                            setCountryVisible(false);
                        }}
                    />

                    {/* Overlay close button above the library's modal */}
                    <Modal visible={countryVisible} transparent animationType="none">
                        <View style={{ flex: 1 }} pointerEvents="box-none">
                            <TouchableOpacity
                                onPress={() => setCountryVisible(false)}
                                style={styles.countryCloseFab}
                                activeOpacity={0.8}
                            >
                                <MaterialCommunityIcons name="close" size={22} color="#f9f9f9" />
                            </TouchableOpacity>
                        </View>
                    </Modal>
                </>
            )}

            <Text style={styles.label}>Organization Category*</Text>
            <TouchableOpacity 
                style={styles.pickerButton} 
                onPress={() => setCategoryPickerVisible(true)}
            >
                <View style={styles.pickerContent}>
                    <Text 
                        style={[styles.pickerButtonText, !organizationCategory && styles.placeholder]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {getOrganizationCategoryLabel(organizationCategory)}
                    </Text>
                    <View style={styles.pickerIconsContainer}>
                        {organizationCategory && (
                            <TouchableOpacity 
                                onPress={() => {
                                    setOrganizationCategory(null);
                                    setOrganizationSubType(null);
                                }}
                                style={styles.clearButton}
                            >
                                <MaterialCommunityIcons name="close" size={16} color="#000000ff" />
                            </TouchableOpacity>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />
                    </View>
                </View>
            </TouchableOpacity>

            {organizationCategory && (
                <>
                    <Text style={styles.label}>Organization Type*</Text>
                    <TouchableOpacity 
                        style={styles.pickerButton} 
                        onPress={() => setSubTypePickerVisible(true)}
                    >
                        <View style={styles.pickerContent}>
                            <Text 
                                style={[styles.pickerButtonText, !organizationSubType && styles.placeholder]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {getOrganizationSubTypeLabel(organizationSubType)}
                            </Text>
                            <View style={styles.pickerIconsContainer}>
                                {organizationSubType && (
                                    <TouchableOpacity 
                                        onPress={() => setOrganizationSubType(null)}
                                        style={styles.clearButton}
                                    >
                                        <MaterialCommunityIcons name="close" size={16} color="#000000ff" />
                                    </TouchableOpacity>
                                )}
                                <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                </>
            )}

            <Text style={styles.label}>Organization Name*</Text>
            <TextInput
                style={hasFieldError('organizationName') ? styles.inputError : styles.input}
                value={organizationName}
                onChangeText={(text) => {
                    setOrganizationName(text);
                    if (text.trim()) clearFieldError('organizationName');
                }}
                placeholder="Organization Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Decree Number*</Text>
            <TextInput
                style={hasFieldError('decreeNumber') ? styles.inputError : styles.input}
                value={decreeNumber}
                onChangeText={(text) => {
                    setDecreeNumber(text);
                    if (text.trim()) clearFieldError('decreeNumber');
                }}
                placeholder="Decree Number"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Registration Date*</Text>
            <TouchableOpacity 
                style={hasFieldError('registrationDate') ? styles.datePickerButtonError : styles.datePickerButton} 
                onPress={() => setShowDatePicker(true)}
            >
                <View style={styles.pickerContent}>
                    <Text 
                        style={[styles.datePickerText, !registrationDate && styles.placeholder]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {registrationDate || 'Select Registration Date'}
                    </Text>
                    <View style={styles.pickerIconsContainer}>
                        {registrationDate && (
                            <TouchableOpacity 
                                onPress={() => {
                                    setRegistrationDate('');
                                    clearFieldError('registrationDate');
                                }}
                                style={styles.clearButton}
                            >
                                <MaterialCommunityIcons name="close" size={16} color="#000000ff" />
                            </TouchableOpacity>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />
                    </View>
                </View>
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
            <TouchableOpacity 
                style={[
                    styles.fileUploadButton,
                    hasFieldError('document') && styles.fileUploadButtonError,
                    selectedDocument && styles.fileUploadButtonSelected
                ]} 
                onPress={selectDocument}
                disabled={documentUploading}
            >
                <View style={styles.fileUploadContent}>
                    <MaterialCommunityIcons 
                        name={selectedDocument ? "file-check" : "file-upload"} 
                        size={20} 
                        color={selectedDocument ? "#00a651" : "#666"} 
                        style={styles.fileUploadIcon}
                    />
                    <Text style={[
                        styles.fileUploadText,
                        selectedDocument && styles.fileUploadTextSelected
                    ]}>
                        {selectedDocument ? (selectedDocument.name || selectedDocument.filename || 'File Selected') : 'Choose File'}
                    </Text>
                </View>
                {documentUploading && (
                    <View style={styles.uploadingIndicator}>
                        <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                )}
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

            <Text style={styles.label}>Contact Person First Name*</Text>
            <TextInput
                style={hasFieldError('contactPersonFirstName') ? styles.inputError : styles.input}
                value={contactPersonFirstName}
                onChangeText={(text) => {
                    setContactPersonFirstName(text);
                    if (text.trim()) clearFieldError('contactPersonFirstName');
                }}
                placeholder="Contact Person First Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Contact Person Last Name*</Text>
            <TextInput
                style={hasFieldError('contactPersonLastName') ? styles.inputError : styles.input}
                value={contactPersonLastName}
                onChangeText={(text) => {
                    setContactPersonLastName(text);
                    if (text.trim()) clearFieldError('contactPersonLastName');
                }}
                placeholder="Contact Person Last Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Email*</Text>
            <TextInput
                style={hasFieldError('email') ? styles.inputError : styles.input}
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    if (text.trim()) clearFieldError('email');
                }}
                placeholder="Email"
                placeholderTextColor="#A9A9A9"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <View style={hasFieldError('phoneNumber') ? styles.phoneInputContainerError : styles.phoneInputContainer}>
                <TouchableOpacity 
                    style={styles.countryCodeButton}
                    onPress={() => setPhoneCountryVisible(true)}
                >
                    <Text style={styles.countryCodeText}>{phoneCountryCode}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#000000ff" />
                </TouchableOpacity>
                <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (text.trim()) clearFieldError('phoneNumber');
                    }}
                    placeholder="Phone Number"
                    placeholderTextColor="#A9A9A9"
                    keyboardType="phone-pad"
                />
            </View>

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={hasFieldError('address') ? styles.inputError : styles.input}
                value={address}
                onChangeText={(text) => {
                    setAddress(text);
                    if (text.trim()) clearFieldError('address');
                }}
                placeholder="Address"
                placeholderTextColor="#A9A9A9"
            />
        </>
    );

    const renderRecipientIndividualFields = () => (
        <>
            <Text style={styles.label}>Name*</Text>
            <TextInput
                style={hasFieldError('name') ? styles.inputError : styles.input}
                value={name}
                onChangeText={(text) => {
                    setName(text);
                    if (text.trim()) clearFieldError('name');
                }}
                placeholder="First Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Last Name*</Text>
            <TextInput
                style={hasFieldError('lastName') ? styles.inputError : styles.input}
                value={lastName}
                onChangeText={(text) => {
                    setLastName(text);
                    if (text.trim()) clearFieldError('lastName');
                }}
                placeholder="Last Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Username*</Text>
            <TextInput
                style={hasFieldError('username') ? styles.inputError : styles.input}
                value={username}
                onChangeText={(text) => {
                    setUsername(text);
                    if (text.trim()) clearFieldError('username');
                }}
                placeholder="Username"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Email*</Text>
            <TextInput
                style={hasFieldError('email') ? styles.inputError : styles.input}
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    if (text.trim()) clearFieldError('email');
                }}
                placeholder="Email"
                placeholderTextColor="#A9A9A9"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <View style={hasFieldError('phoneNumber') ? styles.phoneInputContainerError : styles.phoneInputContainer}>
                <TouchableOpacity 
                    style={styles.countryCodeButton}
                    onPress={() => setPhoneCountryVisible(true)}
                >
                    <Text style={styles.countryCodeText}>{phoneCountryCode}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#000000ff" />
                </TouchableOpacity>
                <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (text.trim()) clearFieldError('phoneNumber');
                    }}
                    placeholder="Phone Number"
                    placeholderTextColor="#A9A9A9"
                    keyboardType="phone-pad"
                />
            </View>

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={hasFieldError('address') ? styles.inputError : styles.input}
                value={address}
                onChangeText={(text) => {
                    setAddress(text);
                    if (text.trim()) clearFieldError('address');
                }}
                placeholder="Address"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>City*</Text>
            <TextInput
                style={hasFieldError('city') ? styles.inputError : styles.input}
                value={city}
                onChangeText={(text) => {
                    setCity(text);
                    if (text.trim()) clearFieldError('city');
                }}
                placeholder="City"
                placeholderTextColor="#A9A9A9"
            />
        </>
    );

    const renderRecipientOrganizationFields = () => (
        <>
            <Text style={styles.label}>Organization Category*</Text>
            <TouchableOpacity 
                style={hasFieldError('organizationCategory') ? styles.pickerButtonError : styles.pickerButton} 
                onPress={() => setCategoryPickerVisible(true)}
            >
                <View style={styles.pickerContent}>
                    <Text 
                        style={[styles.pickerButtonText, !organizationCategory && styles.placeholder]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {getOrganizationCategoryLabel(organizationCategory)}
                    </Text>
                    <View style={styles.pickerIconsContainer}>
                        {organizationCategory && (
                            <TouchableOpacity 
                                onPress={() => {
                                    setOrganizationCategory(null);
                                    setOrganizationSubType(null);
                                    clearFieldError('organizationCategory');
                                }}
                                style={styles.clearButton}
                            >
                                <MaterialCommunityIcons name="close" size={16} color="#000000ff" />
                            </TouchableOpacity>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />
                    </View>
                </View>
            </TouchableOpacity>

            {organizationCategory && (
                <>
                    <Text style={styles.label}>Organization Type*</Text>
                    <TouchableOpacity 
                        style={hasFieldError('organizationSubType') ? styles.pickerButtonError : styles.pickerButton} 
                        onPress={() => setSubTypePickerVisible(true)}
                    >
                        <View style={styles.pickerContent}>
                            <Text 
                                style={[styles.pickerButtonText, !organizationSubType && styles.placeholder]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {getOrganizationSubTypeLabel(organizationSubType)}
                            </Text>
                            <View style={styles.pickerIconsContainer}>
                                {organizationSubType && (
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setOrganizationSubType(null);
                                            clearFieldError('organizationSubType');
                                        }}
                                        style={styles.clearButton}
                                    >
                                        <MaterialCommunityIcons name="close" size={16} color="#000000ff" />
                                    </TouchableOpacity>
                                )}
                                <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />
                            </View>
                        </View>
                    </TouchableOpacity>
                </>
            )}

            <Text style={styles.label}>Organization Name*</Text>
            <TextInput
                style={hasFieldError('organizationName') ? styles.inputError : styles.input}
                value={organizationName}
                onChangeText={(text) => {
                    setOrganizationName(text);
                    if (text.trim()) clearFieldError('organizationName');
                }}
                placeholder="Organization Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Contact Person First Name*</Text>
            <TextInput
                style={hasFieldError('contactPersonFirstName') ? styles.inputError : styles.input}
                value={contactPersonFirstName}
                onChangeText={(text) => {
                    setContactPersonFirstName(text);
                    if (text.trim()) clearFieldError('contactPersonFirstName');
                }}
                placeholder="Contact Person First Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Contact Person Last Name*</Text>
            <TextInput
                style={hasFieldError('contactPersonLastName') ? styles.inputError : styles.input}
                value={contactPersonLastName}
                onChangeText={(text) => {
                    setContactPersonLastName(text);
                    if (text.trim()) clearFieldError('contactPersonLastName');
                }}
                placeholder="Contact Person Last Name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Email*</Text>
            <TextInput
                style={hasFieldError('email') ? styles.inputError : styles.input}
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    if (text.trim()) clearFieldError('email');
                }}
                placeholder="Email"
                placeholderTextColor="#A9A9A9"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <View style={hasFieldError('phoneNumber') ? styles.phoneInputContainerError : styles.phoneInputContainer}>
                <TouchableOpacity 
                    style={styles.countryCodeButton}
                    onPress={() => setPhoneCountryVisible(true)}
                >
                    <Text style={styles.countryCodeText}>{phoneCountryCode}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color="#000000ff" />
                </TouchableOpacity>
                <TextInput
                    style={styles.phoneInput}
                    value={phoneNumber}
                    onChangeText={(text) => {
                        setPhoneNumber(text);
                        if (text.trim()) clearFieldError('phoneNumber');
                    }}
                    placeholder="Phone Number"
                    placeholderTextColor="#A9A9A9"
                    keyboardType="phone-pad"
                />
            </View>

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={hasFieldError('address') ? styles.inputError : styles.input}
                value={address}
                onChangeText={(text) => {
                    setAddress(text);
                    if (text.trim()) clearFieldError('address');
                }}
                placeholder="Address"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>City*</Text>
            <TextInput
                style={hasFieldError('city') ? styles.inputError : styles.input}
                value={city}
                onChangeText={(text) => {
                    setCity(text);
                    if (text.trim()) clearFieldError('city');
                }}
                placeholder="City"
                placeholderTextColor="#A9A9A9"
            />
        </>
    );

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <Text style={styles.label}>Sign Up as</Text>
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, userType === 'Donor' && styles.activeToggleButton]}
                        onPress={() => {
                            if (userType !== 'Donor') {
                                clearAllFields();
                                setUserType('Donor');
                            }
                        }}
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
                        onPress={() => {
                            if (userType !== 'Recipient') {
                                clearAllFields();
                                setUserType('Recipient');
                            }
                        }}
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
                            setValue={(callback) => {
                                setOrganizationType(callback);
                                if (callback) clearFieldError('organizationType');
                            }}
                            setItems={setItems}
                            placeholder="Select Donor Type"
                            placeholderStyle={styles.placeholder}
                            style={hasFieldError('organizationType') ? styles.inputError : styles.input}
                            containerStyle={hasFieldError('organizationType') ? styles.dropdownContainerError : styles.dropdownContainer}
                            dropDownContainerStyle={hasFieldError('organizationType') ? styles.dropdownMenuContainerError : styles.dropdownMenuContainer}
                            ArrowDownIconComponent={() => <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />}
                            ArrowUpIconComponent={() => <MaterialCommunityIcons name="chevron-up" size={22} color="#000000ff" />}
                            showTickIcon={false}
                            closeAfterSelecting={true}
                            searchable={false}
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
                            setValue={(callback) => {
                                setOrganizationType(callback);
                                if (callback) clearFieldError('organizationType');
                            }}
                            setItems={setItems}
                            placeholder="Select Recipient Type"
                            placeholderStyle={styles.placeholder}
                            style={hasFieldError('organizationType') ? styles.inputError : styles.input}
                            containerStyle={hasFieldError('organizationType') ? styles.dropdownContainerError : styles.dropdownContainer}
                            dropDownContainerStyle={hasFieldError('organizationType') ? styles.dropdownMenuContainerError : styles.dropdownMenuContainer}
                            ArrowDownIconComponent={() => <MaterialCommunityIcons name="chevron-down" size={22} color="#000000ff" />}
                            ArrowUpIconComponent={() => <MaterialCommunityIcons name="chevron-up" size={22} color="#000000ff" />}
                            showTickIcon={false}
                            closeAfterSelecting={true}
                            searchable={false}
                        />
                    </>
                )}

                {userType === 'Donor' && organizationType === 'Individual' && renderIndividualFields()}
                {userType === 'Donor' && organizationType === 'organization' && renderOrganizationFields()}
                {userType === 'Recipient' && organizationType === 'Individual' && renderRecipientIndividualFields()}
                {userType === 'Recipient' && organizationType === 'organization' && renderRecipientOrganizationFields()}

            <Text style={styles.label}>Password*</Text>
            <TextInput
                style={hasFieldError('password') ? styles.inputError : styles.input}
                value={password}
                onChangeText={(text) => {
                    setPassword(text);
                    if (text.trim()) clearFieldError('password');
                }}
                placeholder="Password (min 8 characters)"
                placeholderTextColor="#A9A9A9"
                secureTextEntry
            />

            <Text style={styles.label}>Confirm Password*</Text>
            <TextInput
                style={hasFieldError('confirmPassword') ? styles.inputError : styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (text.trim()) clearFieldError('confirmPassword');
                }}
                placeholder="Confirm Password"
                placeholderTextColor="#A9A9A9"
                secureTextEntry
            />                <TouchableOpacity style={styles.button} onPress={handleSignUp}>
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

                {/* Phone Country Picker Modal */}
                {phoneCountryVisible && (
                    <>
                        <CountryPicker
                            show={phoneCountryVisible}
                            onBackdropPress={() => setPhoneCountryVisible(false)}
                            inputPlaceholder="Search countries..."
                            searchMessage="Search countries..."
                            enableModalAvoiding={true}
                            androidWindowSoftInputMode="adjustResize"
                            excludedCountries={['IL']}
                            style={{
                                modal: {
                                    height: '85%',
                                    marginTop: '15%',
                                },
                                textInput: { 
                                    height: 48, 
                                    borderRadius: 12, 
                                    paddingHorizontal: 12,
                                    marginHorizontal: 10,
                                    marginTop: 10,
                                    marginBottom: 10,
                                    borderWidth: 1,
                                    borderColor: '#e0e0e0',
                                },
                                itemsList: { 
                                    maxHeight: '90%',
                                    paddingHorizontal: 0,
                                },
                                countryButtonStyles: {
                                    height: 50,
                                    marginHorizontal: 10,
                                },
                            }}
                            pickerButtonOnPress={(item) => {
                                onSelectPhoneCountry({ dial_code: item.dial_code, code: item.code });
                                setPhoneCountryVisible(false);
                            }}
                        />

                        <Modal visible={phoneCountryVisible} transparent animationType="none">
                            <View style={{ flex: 1 }} pointerEvents="box-none">
                                <TouchableOpacity
                                    onPress={() => setPhoneCountryVisible(false)}
                                    style={styles.countryCloseFab}
                                    activeOpacity={0.8}
                                >
                                    <MaterialCommunityIcons name="close" size={22} color="#f9f9f9" />
                                </TouchableOpacity>
                            </View>
                        </Modal>
                    </>
                )}
            </View>
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
        paddingBottom: 130,
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
        height: 50,
        backgroundColor: '#f9f9f9',
        color: '#000000',
    },
    inputError: {
        borderWidth: 2,
        borderColor: '#ff4444',
        padding: 5,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f95f5',
        color: '#000000',
    },
    placeholder: {
        color: '#A9A9A9',
    },
    dropdownContainer: {
        marginBottom: 20,
        height: 40,
    },
    dropdownContainerError: {
        marginBottom: 20,
        height: 40,
    },
    dropdownMenuContainer: {
        borderColor: '#00a651',
        backgroundColor: '#f9f9f9',
    },
    dropdownMenuContainerError: {
        borderColor: '#ff4444',
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#00a651',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
        height: 50,
        alignSelf: 'center',
        minWidth: 150,
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
        color: '#f9f9f9',
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
        height: 50,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileUploadButtonError: {
        borderColor: '#ff4444',
        backgroundColor: '#f9f9f95f5',
    },
    fileUploadButtonSelected: {
        borderStyle: 'solid',
        backgroundColor: '#e8f5e8',
    },
    fileUploadContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fileUploadIcon: {
        marginRight: 8,
    },
    fileUploadText: {
        color: '#00a651',
        fontSize: 14,
        flex: 1,
        textAlign: 'center',
    },
    fileUploadTextSelected: {
        color: '#00a651',
        fontWeight: 'bold',
    },
    uploadingIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 166, 81, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    uploadingText: {
        color: '#00a651',
        fontSize: 12,
        fontWeight: 'bold',
    },
    countryPickerButton: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
    },
    countryPickerButtonError: {
        borderWidth: 2,
        borderColor: '#ff4444',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f95f5',
        justifyContent: 'center',
    },
    countryPickerText: {
        fontSize: 14,
        color: '#000',
        flex: 1,
        marginRight: 8,
        numberOfLines: 1,
    },
    pickerButton: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
    },
    pickerButtonError: {
        borderWidth: 2,
        borderColor: '#ff4444',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f95f5',
        justifyContent: 'center',
    },
    pickerButtonText: {
        fontSize: 13,
        color: '#000',
    },
    pickerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    pickerIconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    pickerButtonText: {
        fontSize: 13,
        color: '#000',
        flex: 1,
        marginRight: 8,
        numberOfLines: 1,
    },
    clearButton: {
        marginRight: 8,
        padding: 2,
        justifySelf: 'flex-start',
    
    },
    datePickerButton: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
    },
    datePickerButtonError: {
        borderWidth: 2,
        borderColor: '#ff4444',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f95f5',
        justifyContent: 'center',
    },
    datePickerText: {
        fontSize: 14,
        color: '#000',
        flex: 1,
        marginRight: 8,
        numberOfLines: 1,
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
        color: '#f9f9f9',
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
        color: '#f9f9f9',
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
    countryCloseFab: {
        position: 'absolute',
        top: 40,
        right: 20,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#00a651',
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f9',
        marginBottom: 20,
        alignItems: 'center',
    },
    phoneInputContainerError: {
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#ff4444',
        borderRadius: 20,
        height: 50,
        backgroundColor: '#f9f9f95f5',
        marginBottom: 20,
        alignItems: 'center',
    },
    countryCodeButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRightWidth: 1,
        borderRightColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 80,
    },
    countryCodeText: {
        fontSize: 14,
        color: '#000000',
        marginRight: 4,
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 10,
        fontSize: 14,
        color: '#000000',
    },
});

export default SignUp;
