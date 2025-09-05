import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const HeaderProfile = ({ username, notificationCount }) => {
  const [autoCount, setAutoCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchCount = async () => {
      try {
        const [token, donorId, recipientId] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('donorId'),
          AsyncStorage.getItem('recipientId'),
        ]);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        let count = 0;
        if (donorId) {
          const resp = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Donor/${parseInt(donorId, 10)}`, { headers });
          if (resp.data && Array.isArray(resp.data.data)) {
            count = resp.data.data.filter(a => a.Agreed_Upon === 'pending').length;
          }
        } else if (recipientId) {
          const resp = await axios.get(`https://apiv2.medleb.org/RecipientAgreements/Recipient/${parseInt(recipientId, 10)}`);
          if (resp.data && Array.isArray(resp.data.data)) {
            count = resp.data.data.filter(a => a.Agreed_Upon === 'pending').length;
          }
        }
        if (!cancelled) setAutoCount(count);
      } catch (e) {
        if (!cancelled) setAutoCount(0);
      }
    };

    // Only auto-fetch if a count wasn't explicitly provided
    if (notificationCount == null) {
      fetchCount();
    }
    return () => {
      cancelled = true;
    };
  }, [notificationCount, username]);

  const shownCount = notificationCount == null ? autoCount : notificationCount;

  return (
    <View style={styles.profileContainer}>
      <View style={styles.circle}>
        <Text style={styles.circleText}>
          {username ? username.charAt(0).toUpperCase() : ''}
        </Text>
        {shownCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>
              {shownCount > 99 ? '99+' : shownCount}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.profileText}>
        {username ? username.substring(0, 4) : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    alignItems: 'center',
    marginRight: 20,
    position: 'relative',
    marginTop: 10,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#00A651',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
    position: 'relative',
  },
  circleText: {
    fontSize: 18,
    color: '#00A651',
    fontFamily: 'RobotoCondensed-Bold',
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f9f9f9',
  },
  notificationText: {
    color: '#f9f9f9',
    fontSize: 12,
    fontFamily: 'RobotoCondensed-Bold',
    fontWeight: 'bold',
  },
  profileText: {
    fontFamily: 'RobotoCondensed-Bold',
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    maxWidth: 60,
  },
});

export default HeaderProfile;
