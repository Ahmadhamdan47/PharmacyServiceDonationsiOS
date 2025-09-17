import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * SortToggle component
 * Props:
 * - sortAsc: boolean (true = oldest→newest, false = newest→oldest)
 * - onToggle: () => void
 * - size?: number (icon size, default 18)
 * - showLabel?: boolean (default true)
 * - style?: any (container style override)
 */
const SortToggle = ({ sortAsc, onToggle, size = 18, showLabel = true, style }) => {
  const color = sortAsc ? '#FF8C00' : '#00A651';
  const iconName = sortAsc ? 'sort-calendar-descending' : 'sort-calendar-ascending';

  return (
    <TouchableOpacity onPress={onToggle} style={[styles.sortToggleButton, style]}
      accessibilityRole="button"
      accessibilityLabel={`Toggle sort order to ${sortAsc ? 'newest first' : 'oldest first'}`}
      testID="sort-toggle"
    >
      <MaterialCommunityIcons name={iconName} size={size} color={color} />
      {showLabel && (
        <Text style={[styles.sortToggleText, { color }]}>{sortAsc ? 'Oldest' : 'Newest'}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sortToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginLeft: 8,
  },
  sortToggleText: {
    fontSize: 12,
    fontFamily: 'RobotoCondensed-Medium',
    marginLeft: 4,
  },
});

export default SortToggle;
