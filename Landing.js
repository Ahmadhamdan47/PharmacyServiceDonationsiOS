import React, { useEffect, useState, useLayoutEffect } from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Text, BackHandler, ToastAndroid, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNavBar from './BottomNavBar';
import BottomNavBarInspection from './BottomNavBarInspection';
import BottomNavBarRecipient from './BottomNavBarRecipient'; // Import the new BottomNavBar for Recipient
import HeaderProfile from './HeaderProfile'; // Import the new HeaderProfile component
import * as Font from 'expo-font';
import axios from 'axios'; // Import axios

const Landing = () => {
  const navigation = useNavigation();
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(''); // Add userId state
  const [backPressedOnce, setBackPressedOnce] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [isFontLoaded, setIsFontLoaded] = useState(false);
  const [pendingAgreement, setPendingAgreement] = useState(false); // Add state for pending agreement
  const [pendingAgreementCount, setPendingAgreementCount] = useState(0); // Add state for pending agreement count

  const fetchFonts = async () => {
    await Font.loadAsync({
      'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
      'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
      'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
    });
    setIsFontLoaded(true);
  };

  useEffect(() => {
    fetchFonts(); // Load fonts on component mount
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        const role = await AsyncStorage.getItem('userRole');
        const id = await AsyncStorage.getItem('userId'); // Fetch userId from AsyncStorage
        if (storedUsername) setUsername(storedUsername);
        if (role) setUserRole(role);
        if (id) setUserId(id); // Set userId state
      } catch (error) {
        console.error('Failed to load username or user role:', error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const backAction = () => {
      if (backPressedOnce) {
        BackHandler.exitApp();
      } else {
        setBackPressedOnce(true);
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        setTimeout(() => setBackPressedOnce(false), 2000);
        return true;
      }
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [backPressedOnce]);

  useEffect(() => {
    const checkRecipientAgreement = async () => {
      try {
        const response = await axios.get('https://apiv2.medleb.org/RecipientAgreements/all');
        const agreements = response.data.data; // Access the nested data property

        if (!Array.isArray(agreements)) {
          throw new Error('Invalid agreements data');
        }

        let isPartOfAgreement = false;
        let pendingCount = 0;

        if (userRole === 'Donor') {
          const donorResponse = await axios.get('https://apiv2.medleb.org/donor/all');
          const donors = donorResponse.data;

          if (!Array.isArray(donors)) {
            throw new Error('Invalid donors data');
          }

          const donor = donors.find(d => d.DonorName === username);

          if (donor) {
            isPartOfAgreement = agreements.some(agreement => agreement.DonorId === donor.DonorId && agreement.Agreed_Upon === 'pending');
            pendingCount = agreements.filter(agreement => agreement.DonorId === donor.DonorId && agreement.Agreed_Upon === 'pending').length;
            if (isPartOfAgreement) {
              setPendingAgreement(true);
              setPendingAgreementCount(pendingCount);
            }
          }
        } else if (userRole === 'Recipient') {
          console.log('Checking agreements for recipient');
          const recipientResponse = await axios.get('https://apiv2.medleb.org/recipient/all');
          const recipients = recipientResponse.data;

          if (!Array.isArray(recipients)) {
            throw new Error('Invalid recipients data');
          }

          const recipient = recipients.find(r => 
            r.name === username || 
            r.RecipientName === username || 
            r.recipientName === username ||
            r.Name === username ||
            r.username === username
          );
          
          console.log('Recipient found:', recipient);
          console.log('Current username:', username);
        

          if (recipient) {
            console.log('Recipient:', agreements, recipient.RecipientId);
            isPartOfAgreement = agreements.some(
              agreement => agreement.RecipientId === recipient.RecipientId && agreement.Agreed_Upon === 'pending'
            );
          
            pendingCount = agreements.filter(
              agreement => agreement.RecipientId === recipient.RecipientId && agreement.Agreed_Upon === 'pending'
            ).length; // Change recipient.id to recipient.RecipientId
          
            if (isPartOfAgreement) {
              setPendingAgreement(true);
              setPendingAgreementCount(pendingCount);
            } else {
              setPendingAgreement(false); // Ensure badge hides when no pending agreements exist
              setPendingAgreementCount(0);
            }
          }
          
        }
      } catch (error) {
        console.error('Error checking recipient agreement:', error);
      }
    };

    if (username && userRole) {
      checkRecipientAgreement();
    }
  }, [username, userRole]);

  const handleSignOut = async () => {
    try {
      // Clear all relevant AsyncStorage data
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userRole');
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('userId'); // Remove userId from AsyncStorage

      // Clear user role
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      }); // Navigate to SignIn screen
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleInspect = () => navigation.navigate('Inspect');
  const handleValidate = () => navigation.navigate('Validate');
  const handleAgreements = () => {
    if (userRole === 'Donor') {
      navigation.navigate('DonorAgreements');
    } else if (userRole === 'Recipient') {
      navigation.navigate('RecipientAgreements');
    }
  }; // Updated function for Agreements

  const toggleDropdown = () => setDropdownVisible(!dropdownVisible);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
      <View style={styles.containerLeft}>
        <Image source={require("./assets/medleblogo.png")} style={styles.logo} />
      </View>
      ),
      headerRight: () => (
      <TouchableOpacity onPress={toggleDropdown}>
        <HeaderProfile username={username} />
        {userRole === 'Donor' && pendingAgreement && (
          <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>{pendingAgreementCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      ),
      headerTitle: '',  // Leave the header title empty
      headerTitleAlign: 'center',
      headerStyle: {
      backgroundColor: '#f9f9f9', // Set the background color of the whole navigation bar
      elevation: 0,            // Remove shadow on Android
      shadowOpacity: 0,        // Remove shadow on iOS
      borderBottomWidth: 0,
      },
    });
  }, [navigation, username, dropdownVisible, pendingAgreement, pendingAgreementCount]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f9f9f9" />
      {dropdownVisible && (
        <>
          <TouchableOpacity 
            style={styles.dropdownOverlay} 
            onPress={() => setDropdownVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.dropdown}>
            <TouchableOpacity onPress={() => {
              setDropdownVisible(false);
              navigation.navigate('Settings');
            }} style={styles.dropdownItem}>
              <Text style={[styles.dropdownItemText, { color: '#00A651' }]}>⚙️ Settings</Text>
            </TouchableOpacity>
            {userRole === 'Admin' && (
              <TouchableOpacity onPress={handleValidate} style={styles.dropdownItem}>
                <Text style={[styles.dropdownItemText, { color: '#00A651' }]}>✓ Validate</Text>
              </TouchableOpacity>
            )}
            {userRole === 'Donor' && (
              <TouchableOpacity onPress={handleAgreements} style={styles.dropdownItem}>
                <Text style={[styles.dropdownItemText, { color: '#00A651' }]}>📋 Agreements</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSignOut} style={styles.dropdownItem}>
              <Text style={[styles.dropdownItemText, { color: '#e74c3c' }]}>🚪 Sign Out</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.content}>
        <View style={styles.buttonsContainer}>
          {userRole === 'Donor' ? (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('AddDonor')} style={styles.buttonWrapper}>
                <Image source={require("./assets/donate.png")} style={styles.buttonImage} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('DonorList')} style={styles.buttonWrapper}>
                <Image source={require("./assets/list.png")} style={styles.buttonImage} />
              </TouchableOpacity>
            </>
          ) : userRole === 'Recipient' ? (
            <>
              <TouchableOpacity onPress={() => navigation.navigate('RecipientList')} style={styles.buttonWrapper}>
                <Image source={require("./assets/list.png")} style={styles.buttonImage} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAgreements} style={styles.buttonWrapper}>
                <Image source={require("./assets/agreements.png")} style={styles.buttonImage} />
                {pendingAgreement && (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>{pendingAgreementCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={handleInspect} style={styles.buttonWrapper}>
                <Image source={require("./assets/Inspection.png")} style={styles.buttonImage} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('List')} style={styles.buttonWrapper}>
                <Image source={require("./assets/list.png")} style={styles.buttonImage} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {userRole === 'Donor' ? <BottomNavBar /> : userRole === 'Recipient' ? <BottomNavBarRecipient currentScreen="Landing" /> : <BottomNavBarInspection currentScreen="Landing" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  containerLeft: {
    marginLeft: 20,
    marginTop: 49,
    width: 200,
    height: 108,
    backgroundColor: '#f9f9f9',
    marginRight: 103,
  },
  logo: {
    width: 166,
    height: 108,
    resizeMode: 'contain',
  },
  dropdown: {
    position: 'absolute',
    top: 10,
    right: 5,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    minWidth: 180,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e8e8',
    zIndex: 1000,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: 'RobotoCondensed-Medium',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 20,
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  buttonImage: {
    width: 130,
    height: 130,
    resizeMode: "contain",
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 24,
    color: '#121212',
    textAlign: 'center',
    fontFamily: 'Roboto Condensed',
  },
  pendingBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#00A651',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Landing;