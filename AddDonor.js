import React, { useEffect, useState, useLayoutEffect} from 'react';
import { View, Text, TextInput, Image, Keyboard, StyleSheet, TouchableOpacity, Alert, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomNavBar from './BottomNavBar';  // Import BottomNavBar
import * as Font from 'expo-font';

const AddDonor = () => {
  console.log('🚀 AddDonor component initialized');
  
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [donationTitle, setDonationTitle] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorId, setDonorId] = useState(null);
  const [pendingAgreementsCount, setPendingAgreementsCount] = useState(0);
  const navigation = useNavigation();
  const [keyboardVisible, setKeyboardVisible] = useState(false);  // Track keyboard visibility
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const fetchFonts = async () => {
    console.log('📱 AddDonor: Loading fonts...');
    try {
      await Font.loadAsync({
        'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
        'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
        'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
      });
      setIsFontLoaded(true);
      console.log('✅ AddDonor: Fonts loaded successfully');
    } catch (error) {
      console.error('❌ AddDonor: Error loading fonts:', error);
      setIsFontLoaded(true); // Set to true anyway to prevent blocking
    }
  };

  useEffect(() => {
    console.log('📱 AddDonor: useEffect for fetchFonts triggered');
    fetchFonts(); // Load fonts on component mount
  }, []);
  
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 AddDonor: useFocusEffect triggered - component focused');
      console.log('📱 AddDonor: About to call fetchDonorNameAndId');
      fetchDonorNameAndId();
      console.log('📱 AddDonor: About to call fetchRecipients');
      fetchRecipients();
    }, [])
  );

  useEffect(() => {
    console.log('📱 AddDonor: useEffect for donorId triggered, donorId:', donorId);
    if (donorId) {
      console.log('📱 AddDonor: DonorId exists, calling checkPendingAgreements');
      checkPendingAgreements();
    } else {
      console.log('📱 AddDonor: DonorId is null/undefined, skipping checkPendingAgreements');
    }
  }, [donorId]);

  const checkPendingAgreements = async () => {
    console.log('📱 AddDonor: checkPendingAgreements started for donorId:', donorId);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('📱 AddDonor: Making pending agreements API call...');
      const response = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Donor/${donorId}`, { headers });
      console.log('📱 AddDonor: Pending agreements API response received');
      
      if (response.data && Array.isArray(response.data.data)) {
        const agreements = response.data.data;
        const pendingCount = agreements.filter(agreement => agreement.Agreed_Upon === 'pending').length;
        setPendingAgreementsCount(pendingCount);
        console.log('✅ AddDonor: Pending agreements count set to:', pendingCount);
      }
    } catch (error) {
      console.error('❌ AddDonor: Error in checkPendingAgreements:', error);
      // Handle 404 error (no agreements found) as normal case
      if (error.response && error.response.status === 404) {
        console.log('📱 AddDonor: No pending agreements found (404), setting count to 0');
        setPendingAgreementsCount(0);
      } else if (error.response && error.response.status === 401) {
        console.error('🔐 AddDonor: Authentication error (401) in checkPendingAgreements - token might be invalid');
        // Don't auto-logout here, let user continue with the form
        setPendingAgreementsCount(0);
      } else {
        console.error('❌ AddDonor: Other error in checkPendingAgreements:', error.response?.status, error.message);
        setPendingAgreementsCount(0);
      }
    }
  };

  useEffect(() => {
    // Listen for keyboard show and hide events
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
    };
}, []);

  useLayoutEffect(() => {
    navigation.setOptions({
        headerTitle: 'Donate',
        headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
            </TouchableOpacity>
        ),
        headerRight: () => null,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          position: 'relative', 
          backgroundColor: '#f9f9f9',
          marginBottom: 20,
          fontFamily: 'RobotoCondensed-Bold',

        },
        headerStyle: {
 
          backgroundColor: '#f9f9f9',
          elevation: 0, 
          shadowOpacity: 0, 
          borderBottomWidth: 0,  
      },
    });
}, [navigation, donorName, pendingAgreementsCount]);

  const fetchDonorIdFromAPI = async (username) => {
    console.log('📱 AddDonor: fetchDonorIdFromAPI started for username:', username);
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('📱 AddDonor: Attempting to fetch donor ID from API for username:', username);
      const response = await axios.get(`https://apiv2.medleb.org/donor/byUsername/${username}`, { headers });
      
      if (response.data && response.data.DonorId) {
        console.log('✅ AddDonor: Successfully fetched donor ID from API:', response.data.DonorId);
        await AsyncStorage.setItem('donorId', response.data.DonorId.toString());
        return response.data.DonorId;
      } else {
        console.warn('⚠️ AddDonor: API response did not contain DonorId:', response.data);
        return null;
      }
    } catch (error) {
      console.error('❌ AddDonor: Failed to fetch donor ID from API:', error);
      return null;
    }
  };

  const fetchDonorNameAndId = async () => {
    console.log('📱 AddDonor: fetchDonorNameAndId started');
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedDonorId = await AsyncStorage.getItem('donorId');
      
      console.log('📱 AddDonor: Retrieved from storage - username:', storedUsername, 'donorId:', storedDonorId);
      
      if (storedUsername) {
        setDonorName(storedUsername);
        console.log('📱 AddDonor: Set donor name to:', storedUsername);
      }
      
      if (storedDonorId) {
        const parsedDonorId = parseInt(storedDonorId);
        setDonorId(parsedDonorId);
        console.log('✅ AddDonor: Donor ID loaded from storage:', storedDonorId, 'parsed to:', parsedDonorId);
      } else {
        console.warn('⚠️ AddDonor: No donor ID found in storage, attempting to fetch from API');
        
        if (storedUsername) {
          const fetchedDonorId = await fetchDonorIdFromAPI(storedUsername);
          if (fetchedDonorId) {
            setDonorId(fetchedDonorId);
            console.log('✅ AddDonor: Successfully recovered donor ID:', fetchedDonorId);
          } else {
            console.error('❌ AddDonor: Failed to fetch donor ID from API');
            Alert.alert('Error', 'Unable to retrieve donor information. Please login again.');
          }
        } else {
          console.error('❌ AddDonor: Username not found in storage');
          Alert.alert('Error', 'Username not found. Please login again.');
        }
      }
      console.log('📱 AddDonor: fetchDonorNameAndId completed');
    } catch (error) {
      console.error('❌ AddDonor: Failed to load donor information:', error);
      Alert.alert('Error', 'Failed to load donor information. Please login again.');
    }
  };

  const fetchRecipients = async () => {
    console.log('📱 AddDonor: fetchRecipients started');
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('📱 AddDonor: Making API call to fetch recipients...');
      const response = await axios.get("https://apiv2.medleb.org/recipient/all", { headers });
      console.log('📱 AddDonor: Recipients API response received, data length:', response.data?.length);
      
      const recipientsData = response.data.map(recipient => ({
        label: recipient.RecipientName,
        value: recipient.RecipientId
      }));
      
      setRecipients(recipientsData);
      console.log('✅ AddDonor: Recipients set successfully, count:', recipientsData.length);
    } catch (error) {
      console.error("❌ AddDonor: Error fetching recipients:", error);
      if (error.response && error.response.status === 401) {
        console.error('🔐 AddDonor: Authentication error (401) in fetchRecipients - token might be invalid');
        // Don't auto-logout here, let the app handle it globally
      } else {
        console.error('❌ AddDonor: Other error in fetchRecipients:', error.response?.status, error.message);
      }
    }
  };

  const checkExistingAgreement = async (donorId, recipientId, headers = {}) => {
    try {
      const response = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Donor/${donorId}`, { headers });
      if (response.data && Array.isArray(response.data.data)) {
        const agreements = response.data.data;
        // Find agreement between this donor and recipient
        const existingAgreement = agreements.find(agreement => 
          agreement.RecipientId === recipientId
        );
        return existingAgreement;
      }
      return null;
    } catch (error) {
      // Handle 404 error (no agreements found) as normal case
      if (error.response && error.response.status === 404) {
        console.log('No existing agreements found for this donor');
        return null;
      }
      console.error('Error checking existing agreement:', error);
      return null;
    }
  };

  const createNewAgreement = async (donorId, recipientId, donationId, headers = {}) => {
    try {
      const agreementResponse = await axios.post("https://apiv2.medleb.org/RecipientAgreements/add", {
        DonationId: donationId,
        DonorId: donorId,
        RecipientId: recipientId,
        Agreed_Upon: "pending",
        expenses_on: "donor", // Add the required expenses_on field
      }, { headers });
      return agreementResponse.data;
    } catch (error) {
      console.error("Error creating agreement:", error);
      throw error;
    }
  };

  const handleContinue = async () => {
    console.log('📱 AddDonor: handleContinue started');
    if (!donationTitle.trim()) {
      Alert.alert('Error', 'Donation title is required.');
      return;
    }

    if (!selectedRecipient) {
      Alert.alert('Error', 'Please select a recipient.');
      return;
    }

    if (!donorId) {
      console.error('❌ AddDonor: DonorId is missing in handleContinue:', donorId);
      Alert.alert('Error', 'Failed to load donor information.');
      return;
    }

    console.log('📱 AddDonor: Creating donation with donorId:', donorId, 'recipientId:', selectedRecipient);
    try {
      // Get the authentication token
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Create the donation first
      const response = await axios.post("https://apiv2.medleb.org/donation/add", {
        DonorId: donorId,
        RecipientId: selectedRecipient,
        DonationTitle: donationTitle,
        DonationPurpose: donationPurpose,
        DonationDate: new Date().toISOString(),
      }, { headers });
      
      const donationId = response.data.DonationId;
      console.log('✅ AddDonor: Donation created successfully with ID:', donationId);

      // Always create a new agreement for each donation
      const createdAgreement = await createNewAgreement(donorId, selectedRecipient, donationId, headers);

      // Build minimal agreement object compatible with AgreementDetails UI
      const selectedRecipientName = (recipients.find(r => r.value === selectedRecipient)?.label) || '';
      const agreementForDetails = {
        ...(createdAgreement || {}),
        DonationId: donationId,
        DonorId: donorId,
        RecipientId: selectedRecipient,
        Agreed_Upon: 'pending',
        expenses_on: 'donor',
        Donation: { DonationTitle: donationTitle },
        donor: { DonorName: donorName, DonorId: donorId },
        Recipient: { RecipientName: selectedRecipientName, RecipientId: selectedRecipient },
      };

      console.log('📱 AddDonor: Navigating to AgreementDetails...');
      // Navigate donor directly to Agreement Details to sign
      navigation.navigate('AgreementDetails', { agreement: agreementForDetails, requireDonorSign: true });
    } catch (error) {
      console.error("❌ AddDonor: Error creating donation or agreement:", error);
      Alert.alert('Error', 'Failed to create donation. Please try again.');
    }
  };

  console.log('📱 AddDonor: About to render component. DonorId:', donorId, 'DonorName:', donorName, 'Recipients count:', recipients.length);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <Text style={styles.label}>Donor</Text>
          <TextInput
            style={styles.inputDonor}
            value={donorName}
            editable={false}
          />
          <StatusBar backgroundColor="#f9f9f9" barStyle="dark-content" />

          <Text style={styles.label}>Recipient*</Text>
          <View style={{ zIndex: 3000 }}>
            <DropDownPicker
              open={recipientOpen}
              value={selectedRecipient}
              items={recipients}
              setOpen={setRecipientOpen}
              setValue={setSelectedRecipient}
              setItems={setRecipients}
              placeholder="Select a recipient"
              containerStyle={styles.dropdown}
              onOpen={() => setIsInputFocused(true)}
              onClose={() => setIsInputFocused(false)}
              style={[
                styles.picker,
                { backgroundColor: '#f9f9f9' }, // Always set background
              ]}
              dropDownContainerStyle={[
                styles.dropDownContainer,
                { backgroundColor: '#f9f9f9' }, // Always set background
              ]}
              searchable={true}
              searchPlaceholder="Search recipients..."
              listMode="MODAL"
              modalProps={{ animationType: 'slide' }}
              modalTitle="Select Recipient"
              modalTitleStyle={styles.modalTitle}
              textStyle={styles.dropdownText}
              listItemLabelStyle={styles.dropdownText}
              selectedItemLabelStyle={[
                styles.dropdownSelectedText,
                { backgroundColor: '#f9f9f9' }, // Always set background
              ]}
              placeholderStyle={styles.dropdownPlaceholder}
              searchTextInputStyle={styles.searchInput}
              searchPlaceholderTextColor="#A9A9A9"
              dropDownDirection="AUTO"
            />
          </View>

          <Text style={styles.label}>Donation Title*</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Donation Title"
            value={donationTitle}
            onChangeText={setDonationTitle}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />

          <Text style={styles.label}>Purpose</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter Donation Purpose"
            value={donationPurpose}
            onChangeText={setDonationPurpose}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity style={styles.button} onPress={handleContinue}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {!keyboardVisible && <BottomNavBar />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  profileContainer: {
    width: 47,
    height: 16,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
    fontFamily: 'RobotoCondensed-Bold',
    marginRight: 24,
    marginLeft: 103,
    marginBottom: 50,
    position: 'relative',
  },
  circle: {
    backgroundColor: '#f9f9f9',
    width: 40,
    height: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginLeft: 5,
  },
  circleText: {
    backgroundColor: 'transparent',
    fontSize: 25,
    color: '#00A651',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  profileText:{
    fontFamily: 'RobotoCondensed-Bold',

  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  label: {
    fontSize: 14,
    fontFamily: 'RobotoCondensed-Bold',
    marginBottom: 5,
    marginLeft: 10,
    color: "#A9A9A9",
    backgroundColor: '#f9f9f9',
  },
  inputDonor: {
    borderWidth: 1,
    borderColor: '#00a651',
    borderRadius: 20,
    padding: 5,
    paddingLeft: 10,
    height: 50,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    color: '#00a651',
    fontFamily: 'RobotoCondensed-Bold',

  },
  input: {
    borderWidth: 1,
    borderColor: '#00a651',
    borderRadius: 20,
    padding: 5,
    paddingLeft: 10,
    height: 50,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    fontFamily: 'RobotoCondensed-Regular',

  },
  textArea: {
    height: 95,
    textAlignVertical: 'top',
  },
  dropdown: {
    marginBottom: 10,
    minHeight: 50,
  zIndex: 3000,
  },
  picker: {
    borderColor: '#00a651',
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 50,
    
    
  },
  dropDownContainer: {
    borderColor: '#00a651',
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 50,
  maxHeight: 250,
  zIndex: 3000,
  elevation: 1000,
  backgroundColor: '#f9f9f9',

  // Typography for dropdown modal
  modalTitle: {
    fontFamily: 'RobotoCondensed-Bold',
    fontSize: 16,
    color: '#121212',
  },
  dropdownText: {
    fontFamily: 'RobotoCondensed-Regular',
    fontSize: 14,
    color: '#121212',
  },
  dropdownSelectedText: {
    fontFamily: 'RobotoCondensed-Bold',
    fontSize: 14,
    color: '#121212',
    backgroundColor: '#f9f9f9',
  },
  dropdownPlaceholder: {
    fontFamily: 'RobotoCondensed-Regular',
    fontSize: 14,
    color: '#A9A9A9',
  },
  searchInput: {
    fontFamily: 'RobotoCondensed-Regular',
    fontSize: 14,
    color: '#121212',
  },
  },
  button: {
    backgroundColor: '#00a651',
    width: 100,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontFamily: 'RobotoCondensed-Bold',
    fontSize: 14,
  },
  backButtonImage: {
    width: 41,
    height: 15,
    marginLeft: 10,
    marginBottom: 20,
  },
});

export default AddDonor;
