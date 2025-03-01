import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Font from 'expo-font';
import { FontAwesome5 } from '@expo/vector-icons';

const AgreementDetails = ({ route }) => {
  const { agreement } = route.params;
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [agreementStatus, setAgreementStatus] = useState(agreement.Agreed_Upon);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFonts = useCallback(async () => {
    await Font.loadAsync({
      'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
      'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
      'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
    });
    setIsFontLoaded(true);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await fetchFonts();
      await getUsername();
      console.log('Agreement:', agreement);
    };

    loadData();

    // Format current date as DD/MM/YYYY
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    setCurrentDate(formattedDate);
  }, [fetchFonts]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Agreement Details',
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
          <Image source={require('./assets/back.png')} style={styles.backButtonImage} />
        </TouchableOpacity>
      ),
      headerTitleAlign: 'center',
      headerStyle: {
        backgroundColor: '#f9f9f9',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
    });
  }, [navigation, username]);

  const getUsername = async () => {
    try {
      const storedUsername = await AsyncStorage.getItem('username');
      const storedUserRole = await AsyncStorage.getItem('userRole');
      if (storedUsername) {
        setUsername(storedUsername);
      }
      if (storedUserRole) {
        setUserRole(storedUserRole);
      }
    } catch (error) {
      console.error('Failed to load username or user role:', error);
    }
  };

  const updateAgreementStatus = async (status) => {
    try {
      setIsLoading(true);
      console.log(`Updating agreement ${agreement.AgreementId} status to ${status}`);

      const response = await axios.put(`https://apiv2.medleb.org/recipientAgreements/${agreement.AgreementId}`, {
        Agreed_Upon: status,
      });

      console.log('Response data:', response.data);

      if (response.status === 200) {
        Alert.alert('Success', `Agreement status updated to ${status}`, [{ text: 'OK' }]);
        setAgreementStatus(status);
      } else {
        Alert.alert('Error', 'Failed to update agreement status');
      }
    } catch (error) {
      console.error('Error updating agreement status:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request data:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      Alert.alert('Error', `Failed to update agreement status: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureBoxPress = () => {
    if (userRole === 'Recipient') {
      Alert.alert(
        'Update Agreement Status',
        agreementStatus === 'pending'
          ? 'Do you want to accept or refuse the agreement?'
          : 'Do you want to change your decision?',
        [
          {
            text: 'Accept',
            onPress: () => updateAgreementStatus('agreed'),
            style: 'default',
          },
          {
            text: 'Refuse',
            onPress: () => updateAgreementStatus('refused'),
            style: 'destructive',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true },
      );
    } else {
      // If not a recipient, show the current status
      Alert.alert(
        'Agreement Status',
        `The recipient has ${
          agreementStatus === 'agreed' ? 'accepted' : agreementStatus === 'refused' ? 'refused' : 'not yet responded to'
        } this agreement.`,
        [{ text: 'OK' }],
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.agreementContainer}>
          <Text style={styles.agreementTitle}>Medication Donation Agreement</Text>

          <Text style={styles.agreementText}>
            This Agreement is entered into on{' '}
            {agreement.createdAt ? new Date(agreement.createdAt).toLocaleDateString() : currentDate} between:
          </Text>

          <View style={styles.partiesContainer}>
            <Text style={styles.partyLabel}>Donor:</Text>
            <Text style={styles.partyText}>{agreement.donor.DonorName}</Text>

            <Text style={styles.partyLabel}>Receiver:</Text>
            <Text style={styles.partyText}>{agreement.Recipient.RecipientName}</Text>
          </View>

          <Text style={styles.sectionTitle}>Terms and Conditions</Text>

          <Text style={styles.sectionSubtitle}>Compliance with Regulations:</Text>
          <Text style={styles.agreementText}>
            • The Donor ensures all donated medications are included in the list posted by the Lebanese Ministry of
            Public Health.
          </Text>
          <Text style={styles.agreementText}>
            • The Donor confirms that no prohibited medications, including but not limited to those manufactured or
            packaged in Israel, are included in the donation as per the regulations of the Ministry of Public Health.
          </Text>

          <Text style={styles.sectionSubtitle}>Costs and Responsibilities:</Text>
          <Text style={styles.agreementText}>
            • The Donor agrees to pay all expenses related to the donation, including shipping, cargo handling, and any
            other associated costs.
          </Text>
          <Text style={styles.agreementText}>
            • If the donated medications need to be removed or exported from the country, the responsible party agrees
            to bear all associated costs and facilitate the process.
          </Text>

          <Text style={styles.sectionSubtitle}>Termination:</Text>
          <Text style={styles.agreementText}>
            • This agreement is terminated with this current donation, and must be renewed when sending a new donation.
          </Text>

          <Text style={styles.sectionSubtitle}>Responsibilities:</Text>
          <Text style={styles.agreementText}>
            • If any issue arises as a result of the actions of one party, the Ministry of Public Health will coordinate
            follow-up efforts with the other party which will be responsible to take full accountability for resolving
            the issue, including rectifying or mitigating any harm caused.
          </Text>

          <Text style={styles.sectionTitle}>Signatures</Text>

          <View style={styles.signatureContainer}>
            <View style={styles.signatureRow}>
              <Text style={styles.signatureLabel}>Donor:</Text>
              <View style={styles.signatureContent}>
                <Text style={styles.signatureName}>{agreement.donor.DonorName}</Text>
                <View style={styles.signatureBox}>
                  <FontAwesome5 name="check" size={24} color="#00A651" />
                </View>
                <Text style={styles.signatureDate}>{currentDate}</Text>
              </View>
            </View>

            <View style={styles.signatureRow}>
              <Text style={styles.signatureLabel}>Receiver:</Text>
              <View style={styles.signatureContent}>
                <Text style={styles.signatureName}>{agreement.Recipient.RecipientName}</Text>
                <TouchableOpacity style={styles.signatureBox} onPress={handleSignatureBoxPress} disabled={isLoading}>
                  {agreementStatus === 'agreed' ? (
                    <FontAwesome5 name="check" size={24} color="#00A651" />
                  ) : agreementStatus === 'refused' ? (
                    <Text style={styles.refusedText}>Refused</Text>
                  ) : (
                    <Text style={styles.pendingText}>{userRole === 'Recipient' ? 'Tap to respond' : 'Pending'}</Text>
                  )}
                </TouchableOpacity>
                <Text style={styles.signatureDate}>{agreementStatus !== 'pending' ? currentDate : 'Pending'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 20,
    paddingBottom: 40, // Add padding to the bottom
  },
  agreementContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00A651',
    marginBottom: 20,
  },
  agreementTitle: {
    fontSize: 20,
    fontFamily: 'RobotoCondensed-Bold',
    color: '#00A651',
    textAlign: 'center',
    marginBottom: 20,
  },
  agreementText: {
    fontSize: 14,
    fontFamily: 'RobotoCondensed-Regular',
    marginBottom: 10,
    lineHeight: 20,
  },
  partiesContainer: {
    marginVertical: 15,
  },
  partyLabel: {
    fontSize: 16,
    fontFamily: 'RobotoCondensed-Bold',
    marginBottom: 5,
  },
  partyText: {
    fontSize: 14,
    fontFamily: 'RobotoCondensed-Regular',
    marginBottom: 15,
    marginLeft: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'RobotoCondensed-Bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#00A651',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: 'RobotoCondensed-Bold',
    marginTop: 10,
    marginBottom: 5,
  },
  signatureContainer: {
    marginTop: 20,
  },
  signatureRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  signatureLabel: {
    fontSize: 16,
    fontFamily: 'RobotoCondensed-Bold',
    width: 80,
  },
  signatureContent: {
    flex: 1,
  },
  signatureName: {
    fontSize: 14,
    fontFamily: 'RobotoCondensed-Regular',
    marginBottom: 5,
  },
  signatureBox: {
    height: 40,
    borderWidth: 1,
    borderColor: '#00A651',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  checkImage: {
    width: 24,
    height: 24,
    tintColor: '#00A651',
  },
  signatureDate: {
    fontSize: 12,
    fontFamily: 'RobotoCondensed-Regular',
    color: '#666',
  },
  refusedText: {
    color: 'red',
    fontFamily: 'RobotoCondensed-Bold',
  },
  pendingText: {
    color: 'orange',
    fontFamily: 'RobotoCondensed-Bold',
  },
  backButtonImage: {
    width: 41,
    height: 15,
    marginLeft: 10,
  },
  profileContainer: {
    width: 47,
    height: 16,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
    fontFamily: 'RobotoCondensed-Bold',
    fontWeight: '400',
    marginRight: 20,
    marginLeft: 103,
    marginBottom: 20,
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
  },
  circleText: {
    backgroundColor: 'transparent',
    fontSize: 20,
    color: '#00A651',
    fontWeight: 'bold',
  },
  profileText: {
    backgroundColor: 'transparent',
    fontFamily: 'RobotoCondensed-Bold',
    fontSize: 14,
    color: '#000',
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default AgreementDetails;