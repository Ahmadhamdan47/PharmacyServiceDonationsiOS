import React, { useEffect, useState, useLayoutEffect} from 'react';
import { View, Text, TextInput, Image, Keyboard, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BottomNavBar from './BottomNavBar';  // Import BottomNavBar

const AddDonor = () => {
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [donationTitle, setDonationTitle] = useState('');
  const [donationPurpose, setDonationPurpose] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorId, setDonorId] = useState(null);
  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      fetchDonorNameAndId();
      fetchRecipients();
    }, [])
  );

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsInputFocused(false));
    return () => {
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
        headerRight: () => (
            <View style={styles.profileContainer}>
                <View style={styles.circle}>
                    <Text style={styles.circleText}>{donorName.charAt(0).toUpperCase()}</Text>  
                </View>
                <Text style={styles.profileText}>{donorName}</Text> 
            </View>
        ),
        headerTitleAlign: 'center',
        headerTitleStyle: {
          marginTop: 30, // Add margin top of 42px to the header title
          position: 'relative', // Ensure the profile container is the reference for positioning the dropdown
            backgroundColor: '#f9f9f9',
            
        },
        headerStyle: {
          height: 100, // Increase the header height to accommodate the margin
          backgroundColor: '#f9f9f9',
      },
        
    });
}, [navigation, donorName]);

  const fetchDonorNameAndId = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      if (storedUsername) {
        setDonorName(storedUsername);
        const response = await axios.get(`https://apiv2.medleb.org/donor/byUsername/${storedUsername}`);
        if (response.data && response.data.DonorId) {
          setDonorId(response.data.DonorId);
        }
      }
    } catch (error) {
      console.error('Failed to load username or donor info:', error);
    }
  };

  const fetchRecipients = async () => {
    try {
      const response = await axios.get("https://apiv2.medleb.org/recipient/all");
      const recipientsData = response.data.map(recipient => ({
        label: recipient.RecipientName,
        value: recipient.RecipientId
      }));
      setRecipients(recipientsData);
      setSelectedRecipient(recipientsData[0]?.value);
    } catch (error) {
      console.error("Error fetching recipients:", error);
    }
  };

  const handleContinue = async () => {
    if (!donationTitle.trim()) {
      Alert.alert('Error', 'Donation title is required.');
      return;  // Prevent further execution
    }
  
    if (!donorId) {
      Alert.alert('Error', 'Failed to load donor information.');
      return;
    }
  
    try {
      const response = await axios.post("https://apiv2.medleb.org/donation/add", {
        DonorId: donorId,
        RecipientId: selectedRecipient,
        DonationTitle: donationTitle,
        DonationPurpose: donationPurpose,
        DonationDate: new Date().toISOString(),
      });
  
      const donationId = response.data.DonationId;
      const selectedRecipientName = recipients.find(recipient => recipient.value === selectedRecipient).label;
      const donationDate = new Date().toISOString().replace(/:/g, '-');
      console.log("Donation created successfully with ID:", donationId);
      
      navigation.navigate('Donate', {
        donorId: donorId,
        recipientId: selectedRecipient,
        donorName: donorName,
        recipientName: selectedRecipientName,
        donationPurpose: donationPurpose,
        donationDate: donationDate,
        donationId: donationId,
      });
    } catch (error) {
      console.error("Error creating donation:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.label}>Donor</Text>
        <TextInput
          style={styles.inputDonor}
          value={donorName}
          editable={false}
        />

        <Text style={styles.label}>Recipient*</Text>
        <View style={{ zIndex: 10 }}>
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
            style={styles.picker}
            dropDownContainerStyle={styles.dropDownContainer}
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
          style={[styles.input, styles.textArea]} // Use the custom text area style
          placeholder="Enter Donation Purpose"
          value={donationPurpose}
          onChangeText={setDonationPurpose}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          multiline={true}
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      {!isInputFocused && <BottomNavBar />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  paddingTop: 20,  // Adjust padding based on the header height to prevent content overlap

  },
  profileContainer: {
    width: 47,
    height: 16,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
    fontFamily: 'Roboto Condensed',
    fontWeight: '400',
    marginRight:24,
    marginLeft: 103,
    
    position: 'relative', // Ensure the profile container is the reference for positioning the dropdown

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
  },
  circleText: {
    backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background

    fontSize: 20,
    color: '#00A651',
    fontWeight: 'bold',
  },
  profileText: {
    backgroundColor: 'transparent', // Ensure the text has no background to see the parent container's background

    fontSize: 14,
    color: '#000',
    fontWeight: '400',
    textAlign: 'center',
    
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 120,
    flex: 1,
    backgroundColor: '#f9f9f9', // Add the background color for consistency
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    marginLeft: 10,
    color: "#A9A9A9",
  },
  inputDonor: {
    borderWidth: 1,
    borderColor: '#00a651',
    borderRadius: 20,
    padding: 5,
    paddingLeft:10,
    height: 30,  // Set height to 30px
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    color: '#00a651',
  },
  input: {
    borderWidth: 1,
    borderColor: '#00a651',
    borderRadius: 20,
    padding: 5,
    paddingLeft:10,
    height: 30,  // Set height to 30px
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 95, // Set specific height for the text area (293x95)
    textAlignVertical: 'top',
    alignSelf: 'left', // Ensure it's centered within the form
  },
  dropdown: {
    marginBottom: 10,
    minHeight:30,
  },
  picker: {
    borderColor: '#00a651',
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 30, // Set height to 30px
  },
  dropDownContainer: {
    borderColor: '#00a651',
    borderWidth: 1,
    borderRadius: 20,
    minHeight:30,
  },
  button: {
    backgroundColor: '#00a651',
    width: 100,  // Set specific width for the button (100x35)
    height: 35,  // Set specific height for the button
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',  // Center the button
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButtonImage: {
    width: 41,  // Adjust the size of the back button image
    height: 15,
    marginLeft: 10,
    marginTop:30,
  },
});

export default AddDonor;
