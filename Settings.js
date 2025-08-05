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
    Modal,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CountryPicker from '@realtril/react-native-country-picker-modal';

const Settings = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userId, setUserId] = useState('');
    const [userData, setUserData] = useState({});
    const [formData, setFormData] = useState({});
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [countryVisible, setCountryVisible] = useState(false);
    const [recipientCountryVisible, setRecipientCountryVisible] = useState(false);
    
    // Sub-account management states
    const [subAccounts, setSubAccounts] = useState([]);
    const [loadingSubAccounts, setLoadingSubAccounts] = useState(false);
    const [showSubAccountModal, setShowSubAccountModal] = useState(false);
    const [showSubAccountSection, setShowSubAccountSection] = useState(false);
    const [newSubAccount, setNewSubAccount] = useState({
        Username: '',
        Password: '',
        Email: '',
        Permissions: ['view_donations']
    });
    const [creatingSubAccount, setCreatingSubAccount] = useState(false);
    const [isMainAccount, setIsMainAccount] = useState(true);

    useEffect(() => {
        loadUserData();
    }, []);

    useEffect(() => {
        if (userRole === 'Donor') {
            checkMainAccountStatus();
        }
    }, [userRole]);

    useEffect(() => {
        if (isMainAccount && userRole === 'Donor') {
            loadSubAccounts();
        }
    }, [isMainAccount, userRole]);

    const loadUserData = async () => {
        try {
            const role = await AsyncStorage.getItem('userRole');
            const username = await AsyncStorage.getItem('username');
            const storedUserId = await AsyncStorage.getItem('userId');
            const donorId = await AsyncStorage.getItem('donorId');
            const recipientId = await AsyncStorage.getItem('recipientId');
            
            console.log('Settings - Loading user data:', { role, username, storedUserId, donorId, recipientId });
            
            setUserRole(role);

            let endpoint = '';
            let actualId = '';

            if (role === 'Donor') {
                // First try to get donor data from the login response that should be stored
                try {
                    // Check if we have donor data from login response
                    const loginDonorData = await AsyncStorage.getItem('donorData');
                    if (loginDonorData) {
                        const parsedDonorData = JSON.parse(loginDonorData);
                        console.log('Found stored donor data:', parsedDonorData);
                        if (parsedDonorData && parsedDonorData.DonorId) {
                            actualId = parsedDonorData.DonorId;
                            endpoint = `https://apiv2.medleb.org/Donor/${actualId}`;
                            console.log('Using donor data from login response');
                        }
                    }
                } catch (error) {
                    console.log('No stored donor data found or error parsing:', error);
                }

                // If no donor data from login, try username lookup instead of stored donorId
                if (!actualId && username) {
                    console.log('Getting donor ID via username lookup');
                    // Get donor ID via username API call using the correct endpoint
                    const donorResponse = await axios.get(`https://apiv2.medleb.org/donor/byUsername/${username}`);
                    if (donorResponse.data && donorResponse.data.DonorId) {
                        actualId = donorResponse.data.DonorId;
                        await AsyncStorage.setItem('donorId', actualId.toString());
                        endpoint = `https://apiv2.medleb.org/Donor/${actualId}`;
                        console.log('Found donor ID via username:', actualId);
                    } else {
                        // Fallback to user endpoint
                        endpoint = `https://apiv2.medleb.org/users/donor/${storedUserId}`;
                        actualId = storedUserId;
                        console.log('Using fallback user endpoint');
                    }
                } else if (!actualId && donorId) {
                    // Only use stored donorId as last resort
                    console.log('Using stored donorId as fallback:', donorId);
                    actualId = donorId;
                    endpoint = `https://apiv2.medleb.org/Donor/${actualId}`;
                } else if (!actualId) {
                    // Use user endpoint as fallback
                    endpoint = `https://apiv2.medleb.org/users/donor/${storedUserId}`;
                    actualId = storedUserId;
                    console.log('Using user endpoint as final fallback');
                }
            } else if (role === 'Recipient') {
                // For recipients, try stored recipientId first, then fallback to user endpoint
                if (recipientId) {
                    actualId = recipientId;
                    endpoint = `https://apiv2.medleb.org/recipient/${actualId}`;
                } else if (username) {
                    // Try to fetch recipient info by username
                    try {
                        const recipientResponse = await axios.get(`https://apiv2.medleb.org/users/recipient/byUsername/${username}`);
                        if (recipientResponse.data && (recipientResponse.data.RecipientId || recipientResponse.data.id)) {
                            actualId = recipientResponse.data.RecipientId || recipientResponse.data.id;
                            await AsyncStorage.setItem('recipientId', actualId.toString());
                            endpoint = `https://apiv2.medleb.org/recipient/${actualId}`;
                        }
                    } catch (error) {
                        console.log('Recipient byUsername endpoint not available, using user endpoint');
                        // Use user endpoint as fallback
                        endpoint = `https://apiv2.medleb.org/users/recipient/${storedUserId}`;
                        actualId = storedUserId;
                    }
                } else {
                    // Use user endpoint as fallback
                    endpoint = `https://apiv2.medleb.org/users/recipient/${storedUserId}`;
                    actualId = storedUserId;
                }
            }

            console.log('Settings - Using endpoint:', endpoint, 'with ID:', actualId);
            setUserId(actualId);

            if (endpoint && actualId) {
                const response = await axios.get(endpoint);
                console.log('API Response:', response.data);
                console.log('Email from response:', response.data.Email);
                setUserData(response.data);
                setFormData(response.data);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            Alert.alert('Error', 'Failed to load user data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const onSelectDonorCountry = (country) => {
        handleInputChange('DonorCountry', country.name);
        setCountryVisible(false);
    };

    const onSelectRecipientCountry = (country) => {
        handleInputChange('Country', country.name);
        setRecipientCountryVisible(false);
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Prepare the data according to API schema
            let updateData = { ...formData };
            
            // For donors, ensure IsActive is preserved if it exists
            if (userRole === 'Donor') {
                updateData = {
                    DonorName: formData.DonorName || '',
                    DonorType: formData.DonorType || 'Individual',
                    Address: formData.Address || '',
                    PhoneNumber: formData.PhoneNumber || '',
                    Email: formData.Email || '',
                    DonorCountry: formData.DonorCountry || '',
                    IsActive: formData.IsActive !== undefined ? formData.IsActive : true
                };
            } else if (userRole === 'Recipient') {
                updateData = {
                    RecipientName: formData.RecipientName || '',
                    RecipientType: formData.RecipientType || '',
                    Address: formData.Address || '',
                    City: formData.City || '',
                    Country: formData.Country || '',
                    ContactPerson: formData.ContactPerson || '',
                    ContactNumber: formData.ContactNumber || '',
                    IsActive: formData.IsActive !== undefined ? formData.IsActive : true
                };
            }

            let endpoint = '';
            if (userRole === 'Donor') {
                endpoint = `https://apiv2.medleb.org/Donor/${userId}`;
            } else if (userRole === 'Recipient') {
                endpoint = `https://apiv2.medleb.org/recipient/${userId}`;
            }

            if (endpoint) {
                await axios.put(endpoint, updateData);
                Alert.alert('Success', 'Settings updated successfully!', [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Update the local userData with the new data
                            setUserData(updateData);
                            setFormData(updateData);
                        }
                    }
                ]);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            let errorMessage = 'Failed to save settings. Please try again.';
            
            if (error.response) {
                // Server responded with error status
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Network error
                errorMessage = 'Network error. Please check your connection.';
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields.');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            Alert.alert('Error', 'New password and confirm password do not match.');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 6 characters long.');
            return;
        }

        try {
            setChangingPassword(true);

            await axios.post('https://apiv2.medleb.org/users/me/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            Alert.alert('Success', 'Password changed successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setShowPasswordSection(false);
                    }
                }
            ]);
        } catch (error) {
            console.error('Error changing password:', error);
            let errorMessage = 'Failed to change password. Please try again.';
            
            if (error.response?.status === 400) {
                errorMessage = 'Current password is incorrect.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setChangingPassword(false);
        }
    };

    // Sub-account management functions
    const checkMainAccountStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log('No auth token found, defaulting to main account');
                setIsMainAccount(true);
                return;
            }

            const response = await axios.get('https://apiv2.medleb.org/users/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            // Assume main account if IsMainAccount is not false
            setIsMainAccount(response.data.IsMainAccount !== false);
        } catch (error) {
            console.log('Error checking main account status (defaulting to main account):', error.response?.status || error.message);
            // Default to true for existing accounts or if API doesn't support this feature yet
            setIsMainAccount(true);
        }
    };

    const loadSubAccounts = async () => {
        if (!isMainAccount) return;
        
        try {
            setLoadingSubAccounts(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log('No auth token found for sub-accounts');
                setSubAccounts([]);
                return;
            }

            const response = await axios.get('https://apiv2.medleb.org/users/donor-subaccounts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setSubAccounts(response.data.data || []);
        } catch (error) {
            console.log('Error loading sub-accounts:', error.response?.status || error.message);
            // Don't show error for 401/403 - just means no sub-accounts or feature not available
            if (error.response?.status !== 401 && error.response?.status !== 403 && error.response?.status !== 404) {
                Alert.alert('Error', 'Failed to load sub-accounts. Please try again.');
            }
            // Set empty array for any error - no sub-accounts to show
            setSubAccounts([]);
        } finally {
            setLoadingSubAccounts(false);
        }
    };

    const createSubAccount = async () => {
        if (!newSubAccount.Username || !newSubAccount.Password || !newSubAccount.Email) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (newSubAccount.Password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newSubAccount.Email)) {
            Alert.alert('Error', 'Please enter a valid email address.');
            return;
        }

        try {
            setCreatingSubAccount(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Authentication required. Please sign in again.');
                return;
            }

            await axios.post('https://apiv2.medleb.org/users/donor-subaccounts', newSubAccount, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            Alert.alert('Success', 'Sub-account created successfully!', [
                {
                    text: 'OK',
                    onPress: () => {
                        setNewSubAccount({
                            Username: '',
                            Password: '',
                            Email: '',
                            Permissions: ['view_donations']
                        });
                        setShowSubAccountModal(false);
                        loadSubAccounts();
                    }
                }
            ]);
        } catch (error) {
            console.error('Error creating sub-account:', error);
            let errorMessage = 'Failed to create sub-account. Please try again.';
            
            if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.status === 400) {
                errorMessage = 'Invalid data provided. Please check all fields.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Authentication required. Please sign in again.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Only main accounts can create sub-accounts.';
            }
            
            Alert.alert('Error', errorMessage);
        } finally {
            setCreatingSubAccount(false);
        }
    };

    const updateSubAccountPermissions = async (userId, permissions) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'Authentication required. Please sign in again.');
                return;
            }

            await axios.put(`https://apiv2.medleb.org/users/donor-subaccounts/${userId}`, {
                permissions: permissions
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            Alert.alert('Success', 'Permissions updated successfully!');
            loadSubAccounts();
        } catch (error) {
            console.error('Error updating permissions:', error);
            let errorMessage = 'Failed to update permissions. Please try again.';
            
            if (error.response?.status === 401) {
                errorMessage = 'Authentication required. Please sign in again.';
            } else if (error.response?.status === 403) {
                errorMessage = 'Only main accounts can update sub-account permissions.';
            }
            
            Alert.alert('Error', errorMessage);
        }
    };

    const deactivateSubAccount = async (userId, username) => {
        Alert.alert(
            'Confirm Deactivation',
            `Are you sure you want to deactivate the sub-account "${username}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deactivate',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            if (!token) {
                                Alert.alert('Error', 'Authentication required. Please sign in again.');
                                return;
                            }

                            await axios.delete(`https://apiv2.medleb.org/users/donor-subaccounts/${userId}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            Alert.alert('Success', 'Sub-account deactivated successfully!');
                            loadSubAccounts();
                        } catch (error) {
                            console.error('Error deactivating sub-account:', error);
                            let errorMessage = 'Failed to deactivate sub-account. Please try again.';
                            
                            if (error.response?.status === 401) {
                                errorMessage = 'Authentication required. Please sign in again.';
                            } else if (error.response?.status === 403) {
                                errorMessage = 'Only main accounts can deactivate sub-accounts.';
                            }
                            
                            Alert.alert('Error', errorMessage);
                        }
                    }
                }
            ]
        );
    };

    const togglePermission = (permission) => {
        const currentPermissions = newSubAccount.Permissions;
        let updatedPermissions;
        
        if (currentPermissions.includes(permission)) {
            updatedPermissions = currentPermissions.filter(p => p !== permission);
        } else {
            updatedPermissions = [...currentPermissions, permission];
        }
        
        setNewSubAccount(prev => ({
            ...prev,
            Permissions: updatedPermissions
        }));
    };

    const renderPasswordSection = () => (
        <View style={styles.passwordSection}>
            <TouchableOpacity 
                style={styles.passwordToggleButton}
                onPress={() => setShowPasswordSection(!showPasswordSection)}
            >
                <Text style={styles.passwordToggleText}>
                    {showPasswordSection ? '🔒 Hide Password Change' : '🔒 Change Password'}
                </Text>
            </TouchableOpacity>

            {showPasswordSection && (
                <View style={styles.passwordForm}>
                    <Text style={styles.label}>Current Password*</Text>
                    <TextInput
                        style={styles.input}
                        value={passwordData.currentPassword}
                        onChangeText={(value) => setPasswordData(prev => ({ ...prev, currentPassword: value }))}
                        placeholder="Enter current password"
                        placeholderTextColor="#A9A9A9"
                        secureTextEntry
                    />

                    <Text style={styles.label}>New Password*</Text>
                    <TextInput
                        style={styles.input}
                        value={passwordData.newPassword}
                        onChangeText={(value) => setPasswordData(prev => ({ ...prev, newPassword: value }))}
                        placeholder="Enter new password (min 6 characters)"
                        placeholderTextColor="#A9A9A9"
                        secureTextEntry
                    />

                    <Text style={styles.label}>Confirm New Password*</Text>
                    <TextInput
                        style={styles.input}
                        value={passwordData.confirmPassword}
                        onChangeText={(value) => setPasswordData(prev => ({ ...prev, confirmPassword: value }))}
                        placeholder="Confirm new password"
                        placeholderTextColor="#A9A9A9"
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.passwordChangeButton, changingPassword && styles.buttonDisabled]}
                        onPress={handlePasswordChange}
                        disabled={changingPassword}
                    >
                        {changingPassword ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Change Password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderSubAccountSection = () => {
        if (userRole !== 'Donor' || !isMainAccount) return null;

        return (
            <View style={styles.subAccountSection}>
                <TouchableOpacity 
                    style={styles.subAccountToggleButton}
                    onPress={() => setShowSubAccountSection(!showSubAccountSection)}
                >
                    <Text style={styles.subAccountToggleText}>
                        {showSubAccountSection ? '👥 Hide Sub-Accounts' : '👥 Manage Sub-Accounts'}
                    </Text>
                </TouchableOpacity>

                {showSubAccountSection && (
                    <View style={styles.subAccountContent}>
                        <View style={styles.subAccountHeader}>
                            <Text style={styles.subAccountTitle}>Sub-Accounts</Text>
                            <TouchableOpacity
                                style={styles.addSubAccountButton}
                                onPress={() => setShowSubAccountModal(true)}
                            >
                                <Text style={styles.addSubAccountButtonText}>+ Add Sub-Account</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingSubAccounts ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#00A651" />
                                <Text style={styles.loadingText}>Loading sub-accounts...</Text>
                            </View>
                        ) : subAccounts.length > 0 ? (
                            <FlatList
                                data={subAccounts}
                                keyExtractor={(item) => item.UserId.toString()}
                                renderItem={renderSubAccountItem}
                                style={styles.subAccountList}
                            />
                        ) : (
                            <Text style={styles.noSubAccountsText}>
                                No sub-accounts created yet. Create sub-accounts to allow other users to access your donor account with limited permissions.
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    };

    const renderSubAccountItem = ({ item }) => (
        <View style={styles.subAccountItem}>
            <View style={styles.subAccountInfo}>
                <Text style={styles.subAccountUsername}>{item.Username}</Text>
                <Text style={styles.subAccountEmail}>{item.Email}</Text>
                <View style={styles.permissionsContainer}>
                    {item.Permissions?.map((permission) => (
                        <View key={permission} style={styles.permissionChip}>
                            <Text style={styles.permissionText}>
                                {permission.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
            <View style={styles.subAccountActions}>
                <TouchableOpacity
                    style={styles.editPermissionsButton}
                    onPress={() => showPermissionsModal(item)}
                >
                    <Text style={styles.editPermissionsText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deactivateButton}
                    onPress={() => deactivateSubAccount(item.UserId, item.Username)}
                >
                    <Text style={styles.deactivateText}>Deactivate</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const showPermissionsModal = (subAccount) => {
        const availablePermissions = ['view_donations', 'add_donations', 'edit_donations'];
        
        Alert.alert(
            'Edit Permissions',
            `Update permissions for ${subAccount.Username}`,
            [
                ...availablePermissions.map(permission => ({
                    text: `${subAccount.Permissions?.includes(permission) ? '✓' : '○'} ${permission.replace('_', ' ').toUpperCase()}`,
                    onPress: () => {
                        const currentPermissions = subAccount.Permissions || [];
                        let newPermissions;
                        
                        if (currentPermissions.includes(permission)) {
                            newPermissions = currentPermissions.filter(p => p !== permission);
                        } else {
                            newPermissions = [...currentPermissions, permission];
                        }
                        
                        updateSubAccountPermissions(subAccount.UserId, newPermissions);
                    }
                })),
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const renderSubAccountModal = () => (
        <Modal
            visible={showSubAccountModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowSubAccountModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Create Sub-Account</Text>
                    
                    <Text style={styles.label}>Username*</Text>
                    <TextInput
                        style={styles.input}
                        value={newSubAccount.Username}
                        onChangeText={(value) => setNewSubAccount(prev => ({ ...prev, Username: value }))}
                        placeholder="Enter username"
                        placeholderTextColor="#A9A9A9"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Password*</Text>
                    <TextInput
                        style={styles.input}
                        value={newSubAccount.Password}
                        onChangeText={(value) => setNewSubAccount(prev => ({ ...prev, Password: value }))}
                        placeholder="Enter password (min 6 characters)"
                        placeholderTextColor="#A9A9A9"
                        secureTextEntry
                    />

                    <Text style={styles.label}>Email*</Text>
                    <TextInput
                        style={styles.input}
                        value={newSubAccount.Email}
                        onChangeText={(value) => setNewSubAccount(prev => ({ ...prev, Email: value }))}
                        placeholder="Enter email"
                        placeholderTextColor="#A9A9A9"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Permissions</Text>
                    <View style={styles.permissionsSection}>
                        {['view_donations', 'add_donations', 'edit_donations'].map((permission) => (
                            <TouchableOpacity
                                key={permission}
                                style={[
                                    styles.permissionToggle,
                                    newSubAccount.Permissions.includes(permission) && styles.permissionToggleActive
                                ]}
                                onPress={() => togglePermission(permission)}
                            >
                                <Text style={[
                                    styles.permissionToggleText,
                                    newSubAccount.Permissions.includes(permission) && styles.permissionToggleTextActive
                                ]}>
                                    {permission.replace('_', ' ').toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setShowSubAccountModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.createButton, creatingSubAccount && styles.buttonDisabled]}
                            onPress={createSubAccount}
                            disabled={creatingSubAccount}
                        >
                            {creatingSubAccount ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.createButtonText}>Create</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    const renderDonorFields = () => (
        <>
            <Text style={styles.label}>Donor Name*</Text>
            <TextInput
                style={styles.input}
                value={formData.DonorName || ''}
                onChangeText={(value) => handleInputChange('DonorName', value)}
                placeholder="Enter donor name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Donor Type*</Text>
            <View style={styles.toggleContainer}>
                <TouchableOpacity 
                    style={[
                        styles.toggleButton, 
                        formData.DonorType === 'Individual' && styles.activeToggleButton
                    ]}
                    onPress={() => handleInputChange('DonorType', 'Individual')}
                >
                    <Text style={[
                        styles.toggleButtonText, 
                        formData.DonorType === 'Individual' && styles.activeToggleButtonText
                    ]}>
                        Individual
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[
                        styles.toggleButton, 
                        formData.DonorType === 'Organisation' && styles.activeToggleButton
                    ]}
                    onPress={() => handleInputChange('DonorType', 'Organisation')}
                >
                    <Text style={[
                        styles.toggleButtonText, 
                        formData.DonorType === 'Organisation' && styles.activeToggleButtonText
                    ]}>
                        Organisation
                    </Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>Email*</Text>
            <TextInput
                style={styles.input}
                value={formData.Email || ''}
                onChangeText={(value) => handleInputChange('Email', value)}
                placeholder="Enter email"
                placeholderTextColor="#A9A9A9"
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <Text style={styles.label}>Phone Number*</Text>
            <TextInput
                style={styles.input}
                value={formData.PhoneNumber || ''}
                onChangeText={(value) => handleInputChange('PhoneNumber', value)}
                placeholder="Enter phone number"
                placeholderTextColor="#A9A9A9"
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={styles.input}
                value={formData.Address || ''}
                onChangeText={(value) => handleInputChange('Address', value)}
                placeholder="Enter address"
                placeholderTextColor="#A9A9A9"
                multiline
            />

            <Text style={styles.label}>Country*</Text>
            <TouchableOpacity 
                style={styles.countryPickerButton} 
                onPress={() => setCountryVisible(true)}
            >
                <Text style={[styles.countryPickerText, !formData.DonorCountry && styles.placeholder]}>
                    {formData.DonorCountry || 'Select Country'}
                </Text>
            </TouchableOpacity>
            
            {countryVisible && (
                <CountryPicker
                    visible={countryVisible}
                    onSelect={onSelectDonorCountry}
                    onClose={() => setCountryVisible(false)}
                    withFilter
                    withFlag
                    withCountryNameButton
                />
            )}
        </>
    );

    const renderRecipientFields = () => (
        <>
            <Text style={styles.label}>Recipient Name*</Text>
            <TextInput
                style={styles.input}
                value={formData.RecipientName || ''}
                onChangeText={(value) => handleInputChange('RecipientName', value)}
                placeholder="Enter recipient name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Recipient Type*</Text>
            <TextInput
                style={styles.input}
                value={formData.RecipientType || ''}
                onChangeText={(value) => handleInputChange('RecipientType', value)}
                placeholder="Enter recipient type (e.g., Hospital, Clinic, Pharmacy)"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Contact Person*</Text>
            <TextInput
                style={styles.input}
                value={formData.ContactPerson || ''}
                onChangeText={(value) => handleInputChange('ContactPerson', value)}
                placeholder="Enter contact person name"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Contact Number*</Text>
            <TextInput
                style={styles.input}
                value={formData.ContactNumber || ''}
                onChangeText={(value) => handleInputChange('ContactNumber', value)}
                placeholder="Enter contact number"
                placeholderTextColor="#A9A9A9"
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address*</Text>
            <TextInput
                style={styles.input}
                value={formData.Address || ''}
                onChangeText={(value) => handleInputChange('Address', value)}
                placeholder="Enter address"
                placeholderTextColor="#A9A9A9"
                multiline
            />

            <Text style={styles.label}>City*</Text>
            <TextInput
                style={styles.input}
                value={formData.City || ''}
                onChangeText={(value) => handleInputChange('City', value)}
                placeholder="Enter city"
                placeholderTextColor="#A9A9A9"
            />

            <Text style={styles.label}>Country*</Text>
            <TouchableOpacity 
                style={styles.countryPickerButton} 
                onPress={() => setRecipientCountryVisible(true)}
            >
                <Text style={[styles.countryPickerText, !formData.Country && styles.placeholder]}>
                    {formData.Country || 'Select Country'}
                </Text>
            </TouchableOpacity>
            
            {recipientCountryVisible && (
                <CountryPicker
                    visible={recipientCountryVisible}
                    onSelect={onSelectRecipientCountry}
                    onClose={() => setRecipientCountryVisible(false)}
                    withFilter
                    withFlag
                    withCountryNameButton
                />
            )}
        </>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00A651" />
                <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Settings</Text>
                    <Text style={styles.subtitle}>Update your {userRole.toLowerCase()} information</Text>
                </View>

                <View style={styles.form}>
                    {userRole === 'Donor' ? renderDonorFields() : renderRecipientFields()}

                    <TouchableOpacity
                        style={[styles.button, saving && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.buttonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>

                    {renderPasswordSection()}
                    {renderSubAccountSection()}
                </View>
            </ScrollView>
            {renderSubAccountModal()}
        </>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666666',
        fontFamily: 'RobotoCondensed-Medium',
    },
    header: {
        padding: 20,
        backgroundColor: '#f9f9f9',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#00a651',
        fontFamily: 'RobotoCondensed-Bold',
    },
    subtitle: {
        fontSize: 16,
        color: '#A9A9A9',
        marginTop: 5,
        fontFamily: 'RobotoCondensed-Medium',
    },
    form: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        color: '#A9A9A9',
        marginLeft: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 5,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
    },
    placeholder: {
        color: '#A9A9A9',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        padding: 10,
        borderWidth: 1,
        borderColor: '#00a651',
        borderRadius: 20,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    activeToggleButton: {
        backgroundColor: '#00a651',
    },
    toggleButtonText: {
        color: '#00a651',
        fontWeight: 'bold',
    },
    activeToggleButtonText: {
        color: '#fff',
    },
    countryPickerButton: {
        borderWidth: 1,
        borderColor: '#00a651',
        padding: 10,
        paddingLeft: 10,
        marginBottom: 20,
        borderRadius: 20,
        height: 40,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
    },
    countryPickerText: {
        fontSize: 14,
        color: '#000',
    },
    button: {
        backgroundColor: '#00a651',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#CCCCCC',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    passwordSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    passwordToggleButton: {
        backgroundColor: '#f9f9f9',
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00a651',
    },
    passwordToggleText: {
        fontSize: 16,
        color: '#00a651',
        fontFamily: 'RobotoCondensed-Medium',
        fontWeight: 'bold',
    },
    passwordForm: {
        marginTop: 15,
    },
    passwordChangeButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        marginTop: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Sub-account management styles
    subAccountSection: {
        marginTop: 30,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#E9ECEF',
    },
    subAccountToggleButton: {
        backgroundColor: '#f9f9f9',
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#00a651',
    },
    subAccountToggleText: {
        fontSize: 16,
        color: '#00a651',
        fontFamily: 'RobotoCondensed-Medium',
        fontWeight: 'bold',
    },
    subAccountContent: {
        marginTop: 15,
    },
    subAccountHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    subAccountTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'RobotoCondensed-Bold',
    },
    addSubAccountButton: {
        backgroundColor: '#00a651',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    addSubAccountButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    subAccountList: {
        maxHeight: 300,
    },
    subAccountItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    subAccountInfo: {
        flex: 1,
    },
    subAccountUsername: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    subAccountEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    permissionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    permissionChip: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 5,
        marginBottom: 2,
    },
    permissionText: {
        fontSize: 10,
        color: '#1976D2',
        fontWeight: 'bold',
    },
    subAccountActions: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    editPermissionsButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 5,
    },
    editPermissionsText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    deactivateButton: {
        backgroundColor: '#F44336',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    deactivateText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    noSubAccountsText: {
        textAlign: 'center',
        color: '#666',
        fontStyle: 'italic',
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#00a651',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'RobotoCondensed-Bold',
    },
    permissionsSection: {
        marginBottom: 20,
    },
    permissionToggle: {
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
        marginBottom: 8,
        alignItems: 'center',
    },
    permissionToggleActive: {
        backgroundColor: '#00a651',
        borderColor: '#00a651',
    },
    permissionToggleText: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'bold',
    },
    permissionToggleTextActive: {
        color: 'white',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelButton: {
        backgroundColor: '#ddd',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        flex: 0.45,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: 'bold',
    },
    createButton: {
        backgroundColor: '#00a651',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        flex: 0.45,
        alignItems: 'center',
    },
    createButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default Settings;
