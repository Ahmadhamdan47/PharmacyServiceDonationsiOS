import React, { useEffect, useState } from 'react';
import { Button, View, Text, TextInput, Image, Keyboard, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';

const AddDonor = ({ navigation }) => {
  const [donors, setDonors] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [donationPurpose, setDonationPurpose] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [donorOpen, setDonorOpen] = useState(false);
  const [recipientOpen, setRecipientOpen] = useState(false);

  useEffect(() => {
    fetchDonors();
    fetchRecipients();
  }, []);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setIsInputFocused(false));
    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchDonors = async () => {
    try {
      const response = await axios.get("https://apiv2.medleb.org/donor/all");
      const donorsData = response.data.map(donor => ({
        label: donor.DonorName,
        value: donor.DonorId
      }));
      setDonors(donorsData);
      setSelectedDonor(donorsData[0]?.value);
    } catch (error) {
      console.error("Error fetching donors:", error);
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
    try {
      const response = await axios.post("https://apiv2.medleb.org/donation/add", {
        DonorId: selectedDonor,
        RecipientId: selectedRecipient,
        DonationPurpose: donationPurpose,
        DonationDate: new Date().toISOString(),
      });
      const donationId = response.data.DonationId;
      console.log("Donation created successfully with ID:", donationId);
      navigation.navigate('Donate', {
        donorId: selectedDonor,
        recipientId: selectedRecipient,
        donationPurpose: donationPurpose,
        donationId: donationId,
      });
    } catch (error) {
      console.error("Error creating donation:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Donor</Text>
      <DropDownPicker
  open={donorOpen}
  value={selectedDonor}
  items={donors}
  setOpen={setDonorOpen}
  setValue={setSelectedDonor}
  setItems={setDonors}
  placeholder="Select a donor"
  containerStyle={styles.dropdown}
  onOpen={() => setIsInputFocused(true)}
  onClose={() => setIsInputFocused(false)}
  style={styles.picker}
  dropDownContainerStyle={styles.dropDownContainer}
/>

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
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Image
              source={require("./assets/home.png")}
              style={styles.taskBarButton}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('AddDonor')}>
            <Image
              source={require("./assets/donate.png")}
              style={styles.taskBarButton}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('List')}>
            <Image
              source={require("./assets/list.png")}
              style={styles.taskBarButton}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  picker: {
    borderColor: '#00a651', // Green border
    borderWidth: 1,
    borderRadius: 20,
  },
  dropDownContainer: {
    borderColor: '#00a651', // Green border for dropdown container
    borderWidth: 1,
    borderRadius: 20,
  },
  container: {
    flex: 1,
    paddingTop: '20%',
    paddingHorizontal: '10%',
  },
  dropdown: {
    marginBottom: 20,
    
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: "#A9A9A9",
    
  },
  button: {
    width: 130,
    alignSelf: "center",
    paddingHorizontal: 23,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: 60,
    borderColor: "#00a651",
    marginTop: 10,
  },
  buttonText: {
    color: "#00a651",
    fontSize: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#00a651",
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    height: 150,
  },
  taskBar: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    bottom: '2%',
    backgroundColor: '#f0f0f0',
    paddingLeft: 60,
  },
  taskBarButton: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    marginTop: 6,
  },
});

export default AddDonor;
