import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HeaderProfile = ({ username, notificationCount = 0 }) => {
  return (
    <View style={styles.profileContainer}>
      <View style={styles.circle}>
        <Text style={styles.circleText}>
          {username ? username.charAt(0).toUpperCase() : ''}
        </Text>
        {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationText}>
              {notificationCount > 99 ? '99+' : notificationCount}
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
    borderColor: '#FFFFFF',
  },
  notificationText: {
    color: '#FFFFFF',
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
