import React, { useEffect, useState } from 'react';
import { Button, View, Text, TextInput, Image, Keyboard, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const AddDonor = () => {
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [donationPurpose, setDonationPurpose] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorId, setDonorId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchDonorNameAndId();
    fetchRecipients();
  }, []);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsInputFocused(false));
    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

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
    if (!donorId) {
      Alert.alert('Error', 'Failed to load donor information.');
      return;
    }
    try {
      const response = await axios.post("https://apiv2.medleb.org/donation/add", {
        DonorId: donorId,
        RecipientId: selectedRecipient,
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
      <Image source={require('./assets/medleblogo.png')} style={styles.logo} />

      <Text style={styles.label}>Donor Name</Text>
      <TextInput
        style={styles.inputDonor}
        value={donorName}
        editable={false}
      />

      <Text style={styles.label}>Select Recipient</Text>
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

      <Text style={styles.label}>Donation Purpose</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Donation Purpose"
        value={donationPurpose}
        onChangeText={setDonationPurpose}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
      />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      {!isInputFocused && (
        <View style={styles.taskBar}>
          <TouchableOpacity onPress={() => navigation.navigate('DonorLanding')}>
            <Image source={require("./assets/home.png")} style={styles.taskBarButton} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('AddDonor')}>
            <Image source={require("./assets/donate.png")} style={styles.taskBarButton} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('DonorList')}>
            <Image source={require("./assets/list.png")} style={styles.taskBarButton} />
          </TouchableOpacity>
        </View>
      )}
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
    width: 200,
    height: 80,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: "#A9A9A9",
  },
  inputDonor: {
    borderWidth: 1,
    borderColor: '#00a651',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#00a651',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
  },
  dropdown: {
    marginBottom: 20,
  },
  picker: {
    borderColor: '#00a651',
    borderWidth: 1,
    borderRadius: 20,
  },
  dropDownContainer: {
    borderColor: '#00a651',
    borderWidth: 1,
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
});

export default AddDonor;
