// Test script to debug API endpoints
// Run this with node to test the API responses

const axios = require('axios');

async function testAPI() {
    console.log('Testing API endpoints...\n');

    // Test 1: Basic connectivity
    try {
        console.log('1. Testing basic connectivity to API...');
        const response = await axios.get('https://apiv2.medleb.org/');
        console.log('✓ API is reachable');
    } catch (error) {
        console.log('✗ API is not reachable:', error.message);
        return;
    }

    // Test 2: Login with invalid credentials
    try {
        console.log('\n2. Testing login with invalid credentials...');
        const response = await axios.post('https://apiv2.medleb.org/users/login', {
            username: 'test',
            password: 'test'
        });
        console.log('✓ Login response:', response.data);
    } catch (error) {
        console.log('✗ Login error:', error.response?.status, error.response?.data || error.message);
    }

    // Test 3: Try to register a test user (Donor)
    try {
        console.log('\n3. Testing donor registration...');
        const testDonorData = {
            donorData: {
                DonorName: 'Test User',
                DonorType: 'Individual',
                Address: 'Test Address',
                PhoneNumber: '1234567890',
                Email: 'test@example.com',
                DonorCountry: 'Lebanon',
                IsActive: null
            },
            username: 'testuser123',
            password: 'testpass123'
        };
        
        const response = await axios.post('https://apiv2.medleb.org/users/Donor/register', testDonorData);
        console.log('✓ Donor registration response:', response.data);
    } catch (error) {
        console.log('✗ Donor registration error:', error.response?.status, error.response?.data || error.message);
    }

    // Test 4: Try to register a test user (Recipient)
    try {
        console.log('\n4. Testing recipient registration...');
        const testRecipientData = {
            recipientData: {
                RecipientName: 'Test Hospital',
                RecipientType: 'Individual',
                Address: 'Test Address',
                City: 'Test City',
                Country: 'Lebanon',
                ContactPerson: 'Test Person',
                ContactNumber: '1234567890',
                IsActive: null
            },
            username: 'testrecipient123',
            password: 'testpass123'
        };
        
        const response = await axios.post('https://apiv2.medleb.org/users/Recipient/register', testRecipientData);
        console.log('✓ Recipient registration response:', response.data);
    } catch (error) {
        console.log('✗ Recipient registration error:', error.response?.status, error.response?.data || error.message);
    }

    // Test 5: Try to send OTP without authentication
    try {
        console.log('\n5. Testing OTP sending without authentication...');
        const response = await axios.post('https://apiv2.medleb.org/users/send-otp', {
            email: 'test@example.com'
        });
        console.log('✓ OTP send response:', response.data);
    } catch (error) {
        console.log('✗ OTP send error:', error.response?.status, error.response?.data || error.message);
    }
}

testAPI().catch(console.error);
