import React, { useEffect, useState } from 'react';
import { Button, View, Text, TextInput, Image, Keyboard, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const AddDonor = ({ navigation }) => {
  const [donors, setDonors] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [donationPurpose, setDonationPurpose] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [DonationDate, setDonationDate] = useState(new Date().toISOString());

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
        DonorId: donor.DonorId,
        DonorName: donor.DonorName
      }));
      setDonors(donorsData);
      setSelectedDonor(donorsData[0]?.DonorId);
    } catch (error) {
      console.error("Error fetching donors:", error);
    }
  };

  const fetchRecipients = async () => {
    try {
      const response = await axios.get("https://apiv2.medleb.org/recipient/all");
      const recipientsData = response.data.map(recipient => ({
        RecipientId: recipient.RecipientId,
        RecipientName: recipient.RecipientName
      }));
      setRecipients(recipientsData);
      setSelectedRecipient(recipientsData[0]?.RecipientId);
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
        DonationDate : new Date().toISOString(),
      });
      const donationId = response.data.DonationId;
      console.log("Donation created successfully with ID:", donationId, DonationDate);
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
      <View style={styles.dropdown}>
        <Picker
          selectedValue={selectedDonor}
          onValueChange={(itemValue) => setSelectedDonor(itemValue)}
          itemStyle={styles.pickerItem}
        >
          {donors.map(donor => <Picker.Item key={donor.DonorId} label={donor.DonorName} value={donor.DonorId} />)}
        </Picker>
      </View>

      <Text style={styles.label}>Select Recipient</Text>
      <View style={styles.dropdown}>
        <Picker
          selectedValue={selectedRecipient}
          onValueChange={(itemValue) => setSelectedRecipient(itemValue)}
          itemStyle={styles.pickerItem}
        >
          {recipients.map(recipient => <Picker.Item key={recipient.RecipientId} label={recipient.RecipientName} value={recipient.RecipientId} />)}
        </Picker>
      </View>
      <Text style={styles.label}>Donation Purpose</Text>

      <View>
        <TextInput
          style={styles.input}
          placeholder="Enter Donation Purpose"
          value={donationPurpose}
          onChangeText={setDonationPurpose}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
      </View>

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
  container: {
    flex: 1,
    paddingTop: '20%',
    paddingHorizontal: '10%',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#00a651",
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    height: 50,
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: "#A9A9A9",
  },
  pickerItem: {
    fontSize: 16,
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
