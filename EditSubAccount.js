import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Font from 'expo-font';

const EditSubAccount = ({ route }) => {
    const navigation = useNavigation();
    const { subAccount } = route.params;
    
    const [loading, setLoading] = useState(false);
    const [isFontLoaded, setIsFontLoaded] = useState(false);
    const [formData, setFormData] = useState({
        Username: '',
        Email: '',
        Password: '', // Optional - only if user wants to change password
        Permissions: []
    });

    const availablePermissions = [
        { key: 'view_donations', label: 'VIEW DONATIONS' },
        { key: 'add_donations', label: 'ADD DONATIONS' },
        { key: 'edit_donations', label: 'EDIT DONATIONS' }
    ];

    useEffect(() => {
        fetchFonts();
    }, []);

    // Initialize form data when subAccount is available
    useEffect(() => {
        if (subAccount) {
            console.log('Initializing EditSubAccount with data:', subAccount);
            
            // Parse permissions if it's a JSON string
            let permissions = [];
            if (typeof subAccount.Permissions === 'string') {
                try {
                    permissions = JSON.parse(subAccount.Permissions);
                } catch (error) {
                    console.error('Error parsing permissions:', error);
                    permissions = [];
                }
            } else if (Array.isArray(subAccount.Permissions)) {
                permissions = subAccount.Permissions;
            }
            
            setFormData({
                Username: subAccount.Username || '',
                Email: subAccount.Email || '',
                Password: '',
                Permissions: permissions
            });
        }
    }, [subAccount]);

    useEffect(() => {
        navigation.setOptions({
            headerTitle: 'Edit Sub-Account',
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonContainer}>
                    <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
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
    }, [navigation]);

    const fetchFonts = async () => {
        try {
            await Font.loadAsync({
                'RobotoCondensed-Bold': require('./assets/fonts/RobotoCondensed-Bold.ttf'),
                'RobotoCondensed-Medium': require('./assets/fonts/RobotoCondensed-Medium.ttf'),
                'RobotoCondensed-Regular': require('./assets/fonts/RobotoCondensed-Regular.ttf'),
            });
            setIsFontLoaded(true);
        } catch (error) {
            console.error('Error loading fonts:', error);
            setIsFontLoaded(true);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const togglePermission = (permissionKey) => {
        setFormData(prev => {
            const permissions = [...prev.Permissions];
            const index = permissions.indexOf(permissionKey);
            
            if (index > -1) {
                // Remove permission
                permissions.splice(index, 1);
            } else {
                // Add permission
                permissions.push(permissionKey);
            }
            
            return { ...prev, Permissions: permissions };
        });
    };

    const validateForm = () => {
        if (!formData.Username || formData.Username.trim() === '') {
            Alert.alert('Validation Error', 'Username is required');
            return false;
        }

        if (!formData.Email || formData.Email.trim() === '') {
            Alert.alert('Validation Error', 'Email is required');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.Email)) {
            Alert.alert('Validation Error', 'Please enter a valid email address');
            return false;
        }

        if (formData.Permissions.length === 0) {
            Alert.alert('Validation Error', 'At least one permission must be selected');
            return false;
        }

        return true;
    };

    const handleUpdate = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const payload = {
                username: formData.Username.trim(),
                email: formData.Email.trim(),
                permissions: formData.Permissions // Send as array with lowercase key
            };

            console.log('Updating sub-account:', subAccount.UserId);
            console.log('Payload:', JSON.stringify(payload, null, 2));
            console.log('Permissions type:', typeof payload.permissions, 'isArray:', Array.isArray(payload.permissions));

            // Update main account details (username, email, permissions)
            const response = await axios.put(
                `https://apiv2.medleb.org/users/donor-subaccounts/${subAccount.UserId}`,
                payload,
                { headers }
            );

            console.log('Sub-account update response:', response.data);

            // Update password separately if provided
            if (formData.Password && formData.Password.trim() !== '') {
                console.log('Updating password separately...');
                try {
                    const passwordResponse = await axios.patch(
                        `https://apiv2.medleb.org/users/donor-subaccounts/${subAccount.UserId}/password`,
                        { newPassword: formData.Password.trim() },
                        { headers }
                    );
                    console.log('Password update response:', passwordResponse.data);
                } catch (passwordError) {
                    console.error('Error updating password:', passwordError);
                    console.error('Password error response:', passwordError.response?.data);
                    
                    // Show error but don't block the success message for other updates
                    Alert.alert(
                        'Partial Success',
                        'Account details updated successfully, but password update failed. Please try updating the password again.',
                        [{ text: 'OK', onPress: () => navigation.goBack() }]
                    );
                    return;
                }
            }

            Alert.alert(
                'Success',
                'Sub-account updated successfully',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack()
                    }
                ]
            );
        } catch (error) {
            console.error('Error updating sub-account:', error);
            console.error('Error response:', error.response?.data);
            
            let errorMessage = 'Failed to update sub-account. Please try again.';
            
            if (error.response) {
                if (error.response.status === 409) {
                    errorMessage = 'Username or email already exists';
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.status === 400) {
                    errorMessage = 'Invalid data. Please check all fields and try again.';
                }
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isFontLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A651" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <ScrollView 
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Account Information</Text>
                    
                    <Text style={styles.label}>Username*</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.Username}
                        onChangeText={(value) => handleInputChange('Username', value)}
                        placeholder="Enter username"
                        placeholderTextColor="#A9A9A9"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Email*</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.Email}
                        onChangeText={(value) => handleInputChange('Email', value)}
                        placeholder="Enter email"
                        placeholderTextColor="#A9A9A9"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Password (Leave blank to keep current)</Text>
                    <TextInput
                        style={[styles.input, styles.passwordInput]}
                        value={formData.Password}
                        onChangeText={(value) => handleInputChange('Password', value)}
                        placeholder="Enter new password (optional)"
                        placeholderTextColor="#A9A9A9"
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <Text style={styles.sectionTitle}>Permissions*</Text>
                    <Text style={styles.permissionHint}>Select at least one permission</Text>

                    {availablePermissions.map((permission) => {
                        const isSelected = formData.Permissions.includes(permission.key);
                        return (
                            <TouchableOpacity
                                key={permission.key}
                                style={[
                                    styles.permissionToggle,
                                    isSelected && styles.permissionToggleActive
                                ]}
                                onPress={() => togglePermission(permission.key)}
                            >
                                <Text style={[
                                    styles.permissionToggleText,
                                    isSelected && styles.permissionToggleTextActive
                                ]}>
                                    {isSelected ? '✓ ' : '○ '}{permission.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}
                            disabled={loading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
                            onPress={handleUpdate}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.updateButtonText}>Update Sub-Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00A651',
        marginBottom: 15,
        marginTop: 10,
        fontFamily: 'RobotoCondensed-Bold',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        marginTop: 12,
        fontFamily: 'RobotoCondensed-Bold',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        fontSize: 14,
        backgroundColor: '#fff',
        fontFamily: 'RobotoCondensed-Regular',
        color: '#000',
    },
    passwordInput: {
        color: '#000',
    },
    permissionHint: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
        fontStyle: 'italic',
        fontFamily: 'RobotoCondensed-Regular',
    },
    permissionToggle: {
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    permissionToggleActive: {
        backgroundColor: '#00A651',
        borderColor: '#00A651',
    },
    permissionToggleText: {
        color: '#666',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'RobotoCondensed-Bold',
    },
    permissionToggleTextActive: {
        color: '#fff',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        gap: 10,
    },
    cancelButton: {
        backgroundColor: '#ddd',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 25,
        flex: 0.45,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
    },
    updateButton: {
        backgroundColor: '#00A651',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 25,
        flex: 0.45,
        alignItems: 'center',
    },
    updateButtonDisabled: {
        backgroundColor: '#A9A9A9',
    },
    updateButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        fontFamily: 'RobotoCondensed-Bold',
    },
    backButtonImage: {
        width: 41,
        height: 15,
        marginLeft: 10,
    },
    backButtonContainer: {
        padding: 10,
    },
});

export default EditSubAccount;
