# Feature Implementation Plan - Pharmacy Donation App

**Last Updated:** January 29, 2026  
**Status:** Ready for Implementation

---

## Table of Contents
1. [Manage Subaccount](#1-manage-subaccount)
2. [List (Donation Page & Process)](#2-list-donation-page--process)
3. [Box Features](#3-box-features)
4. [Generate QR Code](#4-generate-qr-code)
5. [Date Filter](#5-date-filter)
6. [Agreements](#6-agreements)
7. [Implementation Checklist](#implementation-checklist)

---

## 1. Manage Subaccount

### Current State
- **File:** `Settings.js`
- **Implementation:** FlatList with `maxHeight: 400` showing subaccounts
- **Edit Method:** Alert dialogs for permission editing
- **API Endpoints:** 
  - GET `/users/donor-subaccounts`
  - POST `/users/donor-subaccounts`
  - PUT `/users/donor-subaccounts/:id/permissions`
  - DELETE `/users/donor-subaccounts/:id`

### Required Changes

#### 1.1 Fix Scrolling Issue
**Problem:** FlatList only shows 3 subaccounts due to height constraint  
**Solution:**
- Remove `maxHeight: 400` from FlatList container
- Add `flex: 1` to allow natural scrolling
- Remove `nestedScrollEnabled={true}` (causes conflicts)
- Ensure parent ScrollView has proper `contentContainerStyle`

**Files to Modify:**
- `Settings.js` - FlatList styling

**Implementation:**
```javascript
<FlatList
  data={subAccounts}
  keyExtractor={(item) => item.SubAccountId.toString()}
  style={{ flex: 1 }} // Remove maxHeight
  renderItem={({ item }) => (
    // ... existing render logic
  )}
/>
```

#### 1.2 Create Dedicated Edit Screen
**Problem:** No dedicated edit page, only Alert dialogs  
**Solution:**
- Create new screen: `EditSubAccount.js` (mirror `AddDonor.js` structure)
- Enable editing of all fields:
  - Username (editable)
  - Email (editable)
  - Permissions (VIEW_DONATIONS, ADD_DONATIONS, EDIT_DONATIONS)
  - Password reset option
- Pre-populate form with existing subaccount data
- Update API call to `PUT /users/donor-subaccounts/:id`

**Files to Create:**
- `EditSubAccount.js` - New screen for editing

**Files to Modify:**
- `Settings.js` - Add navigation to edit screen instead of Alert
- `App.js` - Register new EditSubAccount screen in navigation stack

**Form Fields:**
- Username: TextInput (required, editable)
- Email: TextInput (required, editable, email validation)
- Permissions: Checkbox group (VIEW_DONATIONS, ADD_DONATIONS, EDIT_DONATIONS)
- Password: TextInput (optional, only if user wants to reset)
- Status: Active/Inactive toggle

**API Payload:**
```javascript
PUT /users/donor-subaccounts/:id
{
  "username": "updated_username",
  "email": "updated@email.com",
  "permissions": ["VIEW_DONATIONS", "ADD_DONATIONS"],
  "password": "newPassword123" // optional
}
```

---

## 2. List (Donation Page & Process)

### Current State
- **Files:** `List.js`, `Donate.js`, `DonationDetails.js`
- **Search:** Refresh button only, no brand name search
- **Export:** Individual box export in `BoxDetails.js`, no full donation export
- **Add Boxes:** "Add more" (adds pack) vs "Add Box" (creates new box)
- **Pack Counter:** Shows in header, increments with each pack

### Required Changes

#### 2.1 Search by Brand Name (Whole Donation)
**Problem:** No search functionality in donation list  
**Solution:**
- Add search bar at top of `List.js`
- Search should filter donations that contain ANY box with matching brand name
- Search API endpoint: `GET /donations?search=brandName`
- Real-time search with debounce (500ms)

**Files to Modify:**
- `List.js` - Add SearchBar component, implement search state and API call

**Implementation:**
```javascript
// State
const [searchQuery, setSearchQuery] = useState('');

// Debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchQuery) {
      fetchDonationsWithSearch(searchQuery);
    } else {
      fetchDonations();
    }
  }, 500);
  return () => clearTimeout(timer);
}, [searchQuery]);

// UI Component
<TextInput
  placeholder="Search by brand name..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  style={styles.searchBar}
/>
```

**API Requirements:**
- Backend needs to implement search across all boxes/packs in donation
- Search should be case-insensitive
- Return donations containing matching brand names

#### 2.2 Extract XLS for Specific Donation (All Boxes)
**Problem:** No export for entire donation with all boxes  
**Solution:**
- Add "Export Donation as XLS" button in `DonationDetails.js` header
- Export should create multi-sheet Excel file:
  - **Sheet 1 "Summary":** Donation info (title, donor, recipient, date, total boxes, total packs)
  - **Sheet 2+ "Box 1", "Box 2", etc.:** Each box as separate sheet with all packs
- Use existing `xlsx` library

**Files to Modify:**
- `DonationDetails.js` - Add export button and logic

**Implementation:**
```javascript
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const exportDonationAsXLS = async () => {
  // Fetch all boxes for donation
  const boxes = await fetchAllBoxesForDonation(donationId);
  
  const workbook = XLSX.utils.book_new();
  
  // Summary Sheet
  const summaryData = [
    ['Donation Title', donation.Title],
    ['Donor', donation.DonorName],
    ['Recipient', donation.RecipientName],
    ['Date', donation.CreatedDate],
    ['Total Boxes', boxes.length],
    ['Total Packs', boxes.reduce((sum, box) => sum + box.NumberOfPacks, 0)],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  
  // Box Sheets
  boxes.forEach((box, index) => {
    const packData = box.packs.map(pack => ({
      'Brand Name': pack.BrandName,
      'Presentation': pack.Presentation,
      'Form': pack.Form,
      'Laboratory': pack.Laboratory,
      'Country': pack.Country,
      'GTIN': pack.GTIN,
      'LOT Number': pack.LotNumber,
      'Expiry Date': pack.ExpiryDate,
      'Serial Number': pack.SerialNumber,
    }));
    const boxSheet = XLSX.utils.json_to_sheet(packData);
    XLSX.utils.book_append_sheet(workbook, boxSheet, `Box ${index + 1}`);
  });
  
  // Save and share
  const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const uri = FileSystem.documentDirectory + `Donation_${donationId}.xlsx`;
  await FileSystem.writeAsStringAsync(uri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });
  await Sharing.shareAsync(uri);
};
```

**Button Placement:**
- `DonationDetails.js` header, next to existing buttons
- Icon: Download or Excel icon
- Label: "Export Donation"

#### 2.3 Change "Add More Items" to "Add More Boxes"
**Problem:** Button text says "Add more" which is unclear  
**Solution:**
- Update button text in `Donate.js`
- "Add more" → "Add More Boxes"
- "Add Box" → Keep as is (or rename to "Next Box" for clarity)

**Files to Modify:**
- `Donate.js` - Button text

**Current:**
```javascript
<Button title="Add more" onPress={handleAddMore} />
<Button title="Add Box" onPress={handleAddBox} />
```

**Updated:**
```javascript
<Button title="Add More Packs" onPress={handleAddMore} />
<Button title="Add More Boxes" onPress={handleAddBox} />
```

**Note:** Clarify terminology:
- "Add More Packs" = adds another pack to current box (packCounter++)
- "Add More Boxes" = saves current box and creates new box

#### 2.4 Box Name Automatic +1 Rule
**Problem:** Box names may not auto-increment properly  
**Solution:**
- Track box counter in state: `const [boxCounter, setBoxCounter] = useState(1);`
- When "Add More Boxes" clicked: increment counter
- Box name format: `Box ${boxCounter}`
- API call to create box with label

**Files to Modify:**
- `Donate.js` - Box creation logic

**Implementation:**
```javascript
const [boxCounter, setBoxCounter] = useState(1);

const handleAddBox = async () => {
  // Save current packs to box
  await axios.post(`${API_BASE_URL}/donation/box`, {
    donationId: selectedAgreement.DonationId,
    boxLabel: `Box ${boxCounter}`,
    numberOfPacks: packs.length,
  });
  
  // Increment box counter
  setBoxCounter(prev => prev + 1);
  
  // Reset pack state
  setPacks([]);
  setPackCounter(1);
};
```

#### 2.5 Pack Counter - Count Only Filled Fields
**Problem:** Pack counter counts all packs including blank ones  
**Solution:**
- Update counter logic to only count packs with data
- A pack is "filled" if it has at least: GTIN, LOT Number, or Serial Number
- Update header display in real-time

**Files to Modify:**
- `Donate.js` - Pack counter logic

**Implementation:**
```javascript
// Filter filled packs
const filledPacks = packs.filter(pack => 
  pack.GTIN || pack.LotNumber || pack.SerialNumber
);

// Display in header
<Text style={styles.packCounter}>
  {filledPacks.length}
</Text>
```

#### 2.6 Back Button Popup (Discard or Back)
**Problem:** Need confirmation when leaving donation in progress  
**Solution:**
- Already implemented: `Alert.alert("Are you sure you want to cancel the Donation?")`
- Update to show two options:
  - "Discard" - Clear all data and go back to Donation Page
  - "Save Draft" - Save progress and go back (future feature)
  - "Cancel" - Stay on current page
- Navigate to `DonorLanding` or `List` screen

**Files to Modify:**
- `Donate.js` - Back button handler

**Current Implementation:**
```javascript
const handleBack = () => {
  Alert.alert(
    "Are you sure you want to cancel the Donation?",
    "",
    [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => navigation.goBack() }
    ]
  );
};
```

**Updated Implementation:**
```javascript
const handleBack = () => {
  if (packs.length > 0) {
    Alert.alert(
      "Unsaved Changes",
      "You have unsaved packs. What would you like to do?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Discard", 
          style: "destructive",
          onPress: () => navigation.navigate('DonorLanding')
        },
      ]
    );
  } else {
    navigation.navigate('DonorLanding');
  }
};
```

**Navigation Target:** `DonorLanding` or `List` screen (Donation Page)

#### 2.7 Clear Action for Non-Allowed Drugs
**Problem:** When drug validation fails, unclear what happens  
**Solution:**

**Case 1: Drug Not Allowed to be Donated**
- Show alert: "This drug is not allowed to be donated (TEVA manufacturer blocked)"
- **Action:**
  - If this is an additional pack form (packCounter > 1): Remove the pack form entirely
  - If this is the main pack form (packCounter === 1): Just clear all fields
  - Allow user to scan again

**Case 2: Drug Already Donated (Duplicate Serial)**
- Show alert: "This drug has already been donated in this donation or a previous one"
- **Action:**
  - If auto-generated serial: Regenerate and continue (current behavior)
  - If manual serial or GTIN duplicate: Same as Case 1 (clear/remove)

**Files to Modify:**
- `Donate.js` - Drug validation handlers

**Implementation:**
```javascript
const handleDrugValidationFailed = (reason, packIndex) => {
  let message = '';
  
  if (reason === 'BLOCKED_MANUFACTURER') {
    message = 'This drug is not allowed to be donated (TEVA manufacturer blocked)';
  } else if (reason === 'DUPLICATE_SERIAL') {
    message = 'This drug has already been donated in this donation or a previous one';
  }
  
  Alert.alert(
    'Validation Failed',
    message,
    [
      {
        text: 'OK',
        onPress: () => {
          if (packIndex === 0) {
            // Main pack form - just clear fields
            clearPackForm(packIndex);
          } else {
            // Additional pack form - remove entirely
            removePack(packIndex);
          }
        }
      }
    ]
  );
};

const clearPackForm = (index) => {
  const updatedPacks = [...packs];
  updatedPacks[index] = {
    GTIN: '',
    BrandName: '',
    Presentation: '',
    Form: '',
    Laboratory: '',
    Country: '',
    LotNumber: '',
    ExpiryDate: '',
    SerialNumber: '',
  };
  setPacks(updatedPacks);
};

const removePack = (index) => {
  const updatedPacks = packs.filter((_, i) => i !== index);
  setPacks(updatedPacks);
  setPackCounter(prev => prev - 1);
};
```

**Validation Points:**
- After barcode scan
- After manual GTIN entry
- Before submitting pack

---

## 3. Box Features

### Current State
- **File:** `BoxDetails.js`
- **Display:** Table with columns including Status
- **Export:** Individual box as XLS
- **Actions:** QR Code, Export, Delete buttons
- **Search:** None

### Required Changes

#### 3.1 Hide Status Column
**Problem:** Status column visible in app and XLS  
**Solution:**
- Remove Status column from table display
- Remove Status from XLS export data

**Files to Modify:**
- `BoxDetails.js` - Table columns and XLS export logic

**Implementation:**
```javascript
// Table Headers (Remove Status)
const columns = [
  '#',
  'Brand Name',
  'Presentation',
  'Form',
  'Laboratory',
  'Country',
  'GTIN',
  'LOT Nb',
  'Expiry Date',
  'Serial Nb',
  // 'Status', // REMOVED
  'Last Updated'
];

// XLS Export (Remove Status)
const packData = packs.map((pack, index) => ({
  '#': index + 1,
  'Brand Name': pack.BrandName,
  'Presentation': pack.Presentation,
  'Form': pack.Form,
  'Laboratory': pack.Laboratory,
  'Country': pack.Country,
  'GTIN': pack.GTIN,
  'LOT Number': pack.LotNumber,
  'Expiry Date': pack.ExpiryDate,
  'Serial Number': pack.SerialNumber,
  // 'Status': pack.Status, // REMOVED
  'Last Updated': pack.UpdatedDate,
}));
```

#### 3.2 Search by Brand Name in Box
**Problem:** No search within box packs  
**Solution:**
- Add search bar at top of pack list
- Filter packs by brand name (case-insensitive)
- Client-side filtering (no API call needed)

**Files to Modify:**
- `BoxDetails.js` - Add search state and filter logic

**Implementation:**
```javascript
const [searchQuery, setSearchQuery] = useState('');

// Filter packs
const filteredPacks = packs.filter(pack =>
  pack.BrandName.toLowerCase().includes(searchQuery.toLowerCase())
);

// Render
<TextInput
  placeholder="Search by brand name..."
  value={searchQuery}
  onChangeText={setSearchQuery}
  style={styles.searchBar}
/>

<FlatList
  data={filteredPacks}
  // ... rest of props
/>
```

#### 3.3 Button Visibility (Portrait & Landscape)
**Problem:** QR/XLS/Delete buttons may not be visible in all orientations  
**Solution:**
- Ensure buttons are in a fixed header or sticky section
- Use responsive layout with `flexDirection: 'row'` and `flexWrap: 'wrap'`
- Test in both orientations

**Files to Modify:**
- `BoxDetails.js` - Header button layout

**Implementation:**
```javascript
<View style={styles.buttonContainer}>
  <TouchableOpacity onPress={handleGenerateQR} style={styles.button}>
    <Text>Box QR Code</Text>
  </TouchableOpacity>
  
  <TouchableOpacity onPress={handleExportXLS} style={styles.button}>
    <Text>Export as XLS</Text>
  </TouchableOpacity>
  
  <TouchableOpacity onPress={handleDeleteBox} style={styles.button}>
    <Text>Delete Box</Text>
  </TouchableOpacity>
</View>

// Styles
buttonContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-around',
  padding: 10,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#ddd',
},
button: {
  padding: 10,
  margin: 5,
  minWidth: 120,
  alignItems: 'center',
},
```

---

## 4. Generate QR Code

### Current State
- **File:** `BoxDetails.js`
- **QR Value:** `box.BoxId.toString()` (just the numeric ID)
- **Purpose:** Internal inspection tracking
- **Libraries:** `react-native-qrcode-svg`, `react-native-view-shot`

### Required Changes

#### 4.1 QR Code Dual Purpose
**Problem:** QR code only contains BoxId, doesn't work externally  
**Solution:**
- **Keep current behavior:** App can scan QR code and open BoxInspection screen
- **Add external functionality:** External users can scan QR code to download Box XLS file

**QR Code Structure:**
- Use deep link format: `pharmacyapp://box/${BoxId}?action=view`
- Backend should also provide public URL: `https://pharmacy.com/box/${BoxId}/download`
- QR code should contain the web URL for universal access
- App intercepts custom scheme, web browsers download XLS

**Implementation:**
```javascript
// QR Code Value
const qrValue = `https://pharmacy.com/api/box/${box.BoxId}/download`;

<QRCode
  value={qrValue}
  size={150}
  logo={require('./assets/icon/logo.png')} // Optional
/>
```

**Backend Requirements:**
- Create public endpoint: `GET /api/box/:boxId/download`
- Return XLS file with box data
- Add authentication token in URL for security: `?token=<jwt_token>`
- Token should have limited lifespan (24 hours)

**App Deep Linking:**
- Configure app to handle custom scheme in `app.json`
- Intercept QR scan in app to navigate to `BoxInspection` screen
- Use `Linking` API to handle URLs

```javascript
// app.json
{
  "expo": {
    "scheme": "pharmacyapp",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [
            { "scheme": "https", "host": "pharmacy.com", "pathPrefix": "/box" }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

#### 4.2 Center Align QR Code
**Problem:** QR code not centered  
**Solution:**
- Update container styles to center QR code
- Use `alignItems: 'center'` and `justifyContent: 'center'`

**Files to Modify:**
- `BoxDetails.js` - QR code container styles

**Implementation:**
```javascript
<View style={styles.qrCodeContainer}>
  <QRCode value={qrValue} size={150} />
  <View style={styles.qrCodeInfo}>
    <Text style={styles.qrCodeText}>Donation: {box.DonationTitle}</Text>
    <Text style={styles.qrCodeText}>Box: {box.BoxLabel}</Text>
    <Text style={styles.qrCodeText}>Packs: {box.NumberOfPacks}</Text>
    <Text style={styles.qrCodeText}>Donor: {box.DonorName}</Text>
    <Text style={styles.qrCodeText}>Recipient: {box.RecipientName}</Text>
  </View>
</View>

// Styles
qrCodeContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  backgroundColor: '#fff',
},
qrCodeInfo: {
  marginTop: 15,
  alignItems: 'center',
},
qrCodeText: {
  fontSize: 14,
  marginVertical: 3,
  textAlign: 'center',
},
```

#### 4.3 Add Number of Packs to Donation Title
**Problem:** Pack count not shown in QR info  
**Solution:**
- Add pack count below box label
- Format: "Packs: {NumberOfPacks}"

**Files to Modify:**
- `BoxDetails.js` - QR code info display

**Implementation:** (included in 4.2 above)

---

## 5. Date Filter

### Current State
- **File:** `List.js` - Date filters removed (commented out)
- **File:** `Validate.js` - Has working date pickers
- DateTimePicker component available

### Required Changes

#### 5.1 Re-add Date Filters to List Screen
**Problem:** Date filters removed from donation list  
**Solution:**
- Re-implement date filters in `List.js`
- Add "From Date" and "To Date" pickers
- Filter API call: `GET /donations?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`

**Files to Modify:**
- `List.js` - Add date filter UI and logic

**Implementation:**
```javascript
const [fromDate, setFromDate] = useState(null);
const [toDate, setToDate] = useState(null);
const [showFromPicker, setShowFromPicker] = useState(false);
const [showToPicker, setShowToPicker] = useState(false);

// Fetch with date filters
const fetchDonations = async () => {
  let url = `${API_BASE_URL}/donations`;
  const params = [];
  
  if (fromDate) params.push(`fromDate=${fromDate.toISOString().split('T')[0]}`);
  if (toDate) params.push(`toDate=${toDate.toISOString().split('T')[0]}`);
  
  if (params.length > 0) url += `?${params.join('&')}`;
  
  const response = await axios.get(url);
  setDonations(response.data);
};

// UI
<View style={styles.dateFilterContainer}>
  <TouchableOpacity onPress={() => setShowFromPicker(true)}>
    <Text>From: {fromDate ? fromDate.toLocaleDateString() : 'Select'}</Text>
  </TouchableOpacity>
  
  <TouchableOpacity onPress={() => setShowToPicker(true)}>
    <Text>To: {toDate ? toDate.toLocaleDateString() : 'Select'}</Text>
  </TouchableOpacity>
</View>

{showFromPicker && (
  <DateTimePicker
    value={fromDate || new Date()}
    mode="date"
    display="default"
    onChange={(event, date) => {
      setShowFromPicker(false);
      if (date) setFromDate(date);
    }}
  />
)}

{showToPicker && (
  <DateTimePicker
    value={toDate || new Date()}
    mode="date"
    display="default"
    onChange={(event, date) => {
      setShowToPicker(false);
      if (date) setToDate(date);
    }}
    maximumDate={new Date()} // Prevent future dates
  />
)}
```

#### 5.2 Same Day Selection (From & To)
**Problem:** May not allow selecting same date for both fields  
**Solution:**
- Allow From and To to be the same date
- Validation: From date should be <= To date
- If From > To, show error and reset

**Files to Modify:**
- `List.js` - Date validation logic

**Implementation:**
```javascript
const validateDates = (from, to) => {
  if (from && to && from > to) {
    Alert.alert(
      'Invalid Date Range',
      'From date cannot be after To date',
      [{ text: 'OK', onPress: () => setToDate(null) }]
    );
    return false;
  }
  return true;
};

// In DateTimePicker onChange
onChange={(event, date) => {
  setShowFromPicker(false);
  if (date) {
    setFromDate(date);
    if (toDate && !validateDates(date, toDate)) {
      setFromDate(null);
    }
  }
}}
```

#### 5.3 Prevent Future Date in To Field
**Problem:** Users can select future dates  
**Solution:**
- Add `maximumDate={new Date()}` to To date picker
- From date picker can also have same restriction

**Files to Modify:**
- `List.js` - DateTimePicker props

**Implementation:** (included in 5.1 above)

---

## 6. Agreements

### Current State
- **Files:** `DonorAgreements.js`, `RecipientAgreements.js`, `AgreementDetails.js`
- **Button:** Fixed text "Start Donation Process"
- **Status Check:** Filters by agreement status only

### Required Changes

#### 6.1 Conditional Button Text Based on Donation Status
**Problem:** Button always says "Start Donation Process"  
**Solution:**
- Check if donation already exists for agreement
- If agreed and no donation started: "Start Donation"
- If agreed and donation in progress: "Continue Donation"
- Button should still navigate to `Donate` screen with agreement data

**Files to Modify:**
- `DonorAgreements.js` - Button text logic
- `RecipientAgreements.js` - Button text logic (if applicable)

**API Requirements:**
- Need endpoint to check donation status: `GET /agreements/:id/donation-status`
- Returns: `{ hasStarted: true/false, donationId: number }`

**Implementation:**
```javascript
const [donationStatus, setDonationStatus] = useState({});

// Fetch donation status for each agreement
const fetchDonationStatus = async (agreementId) => {
  const response = await axios.get(
    `${API_BASE_URL}/agreements/${agreementId}/donation-status`
  );
  return response.data;
};

useEffect(() => {
  // Fetch status for all agreed agreements
  const fetchAllStatuses = async () => {
    const statuses = {};
    for (const agreement of agreements.filter(a => a.Status === 'Agreed')) {
      const status = await fetchDonationStatus(agreement.AgreementId);
      statuses[agreement.AgreementId] = status;
    }
    setDonationStatus(statuses);
  };
  
  if (agreements.length > 0) {
    fetchAllStatuses();
  }
}, [agreements]);

// Render button with conditional text
const getButtonText = (agreementId) => {
  const status = donationStatus[agreementId];
  if (status?.hasStarted) {
    return 'Continue Donation';
  }
  return 'Start Donation';
};

// UI
{agreement.Status === 'Agreed' && (
  <TouchableOpacity
    style={styles.startButton}
    onPress={() => handleStartDonation(agreement)}
  >
    <Text style={styles.startButtonText}>
      {getButtonText(agreement.AgreementId)}
    </Text>
  </TouchableOpacity>
)}
```

**Navigation Behavior:**
- "Start Donation": Navigate to `Donate` screen with empty state
- "Continue Donation": Navigate to `DonationDetails` or `Donate` with existing donation data

---

## Implementation Checklist

### Phase 1: Core List & Donation Features
- [ ] Add brand name search to donation list (`List.js`)
- [ ] Implement full donation XLS export (`DonationDetails.js`)
- [ ] Update "Add More Items" to "Add More Boxes" text (`Donate.js`)
- [ ] Fix box auto-increment naming (`Donate.js`)
- [ ] Update pack counter to count only filled fields (`Donate.js`)
- [ ] Implement clear action for blocked/duplicate drugs (`Donate.js`)
- [ ] Test back button discard popup navigation

### Phase 2: Box Features
- [ ] Hide status column in box table (`BoxDetails.js`)
- [ ] Hide status column in box XLS export (`BoxDetails.js`)
- [ ] Add brand name search within box (`BoxDetails.js`)
- [ ] Ensure QR/XLS/Delete buttons visible in portrait mode
- [ ] Ensure QR/XLS/Delete buttons visible in landscape mode

### Phase 3: QR Code & Deep Linking
- [ ] Update QR code to use web URL format (`BoxDetails.js`)
- [ ] Center align QR code container (`BoxDetails.js`)
- [ ] Add pack count to QR info display (`BoxDetails.js`)
- [ ] Configure deep linking in `app.json`
- [ ] Test QR scanning within app (internal inspection)
- [ ] Backend: Create public box download endpoint
- [ ] Test QR scanning externally (web browser XLS download)

### Phase 4: Date Filters
- [ ] Re-add date filter UI to donation list (`List.js`)
- [ ] Implement date filter API integration (`List.js`)
- [ ] Add same-day selection validation (`List.js`)
- [ ] Add future date prevention for To field (`List.js`)
- [ ] Test date range filtering

### Phase 5: Agreements
- [ ] Create API endpoint for donation status check
- [ ] Implement donation status fetch in `DonorAgreements.js`
- [ ] Add conditional button text logic (`DonorAgreements.js`)
- [ ] Update navigation for "Continue Donation" (`DonorAgreements.js`)
- [ ] Apply same logic to `RecipientAgreements.js` if needed
- [ ] Test both "Start" and "Continue" flows

### Phase 6: Subaccount Management
- [ ] Fix FlatList scrolling in `Settings.js`
- [ ] Create `EditSubAccount.js` screen
- [ ] Add form fields (username, email, permissions)
- [ ] Implement PUT API call for updating subaccount
- [ ] Update navigation in `Settings.js` to use edit screen
- [ ] Register `EditSubAccount` screen in `App.js`
- [ ] Test edit all fields functionality
- [ ] Test scrolling with 10+ subaccounts

### Testing Checklist
- [ ] Test on iOS device/simulator
- [ ] Test on Android device/emulator
- [ ] Test in portrait orientation
- [ ] Test in landscape orientation
- [ ] Test with large datasets (100+ donations, 50+ packs per box)
- [ ] Test offline behavior (graceful error handling)
- [ ] Test permissions (donor vs admin vs recipient views)
- [ ] Test QR code scanning in-app and externally
- [ ] Test XLS file generation and sharing
- [ ] Performance testing (search, filtering, export)

---

## Technical Dependencies

### Required Libraries
- `react-native-qrcode-svg` - QR code generation ✅ (Already installed)
- `react-native-view-shot` - Screenshot for QR sharing ✅ (Already installed)
- `xlsx` - Excel file generation ✅ (Already installed)
- `expo-file-system` - File operations ✅ (Already installed)
- `expo-sharing` - Share functionality ✅ (Already installed)
- `@react-native-community/datetimepicker` - Date picker (Check if installed)

### Backend API Requirements
- `GET /donations?search=brandName` - Search donations by brand name
- `GET /donations?fromDate=X&toDate=Y` - Filter donations by date range
- `GET /agreements/:id/donation-status` - Check if donation started
- `GET /api/box/:boxId/download?token=X` - Public box XLS download
- `PUT /users/donor-subaccounts/:id` - Update subaccount (all fields)

### Configuration Changes
- `app.json` - Add deep linking scheme and intent filters
- Backend - Configure CORS for public XLS download endpoint
- Backend - Generate JWT tokens for secure public links

---

## Notes & Considerations

### Performance
- Donation search should be server-side with pagination
- XLS export for large datasets may take time - add loading indicator
- Consider caching donation status to avoid repeated API calls

### Security
- Public QR code URLs should use time-limited tokens
- Validate permissions before allowing subaccount edits
- Sanitize search queries to prevent injection

### UX Improvements
- Add loading spinners for all async operations
- Add success/error toasts for user feedback
- Consider offline mode with local storage sync
- Add empty states for lists with no data

### Future Enhancements
- Save donation drafts for "Continue Later" functionality
- Batch QR code generation for multiple boxes
- Print-friendly QR code layout
- Export donations as PDF (in addition to XLS)
- Advanced search filters (date range, recipient, status)
- Push notifications for agreement status changes

---

## File Structure Changes

### New Files to Create
```
EditSubAccount.js          # New screen for editing subaccount details
```

### Files to Modify
```
Settings.js                # Fix scrolling, add edit navigation
List.js                    # Add search, date filters
Donate.js                  # Update buttons, counters, validation, clear actions
DonationDetails.js         # Add full donation XLS export
BoxDetails.js              # Hide status, add search, fix QR code
DonorAgreements.js         # Conditional button text
RecipientAgreements.js     # Conditional button text (if needed)
App.js                     # Register new EditSubAccount screen
app.json                   # Add deep linking configuration
```

### No Changes Required
```
AdminLanding.js
AuthUtils.js
BottomNavBar.js
BottomNavBarInspection.js
BottomNavBarRecipient.js
BoxInspection.js
debug-api.js
DonationContext.js
DonorDetails.js
DonorLanding.js
DonorList.js
HeaderProfile.js
index.js
Inspect.js
Landing.js
LoadingScreen.js
PackInspection.js
PinEntryScreen.js
PinPage.js
RecipientLanding.js
RecipientList.js
SignIn.js
SignUp.js
SortToggle.js
TokenValidator.js
Validate.js
```

---

## Estimated Implementation Time

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Core List & Donation Features | 8-12 hours |
| Phase 2 | Box Features | 4-6 hours |
| Phase 3 | QR Code & Deep Linking | 6-8 hours |
| Phase 4 | Date Filters | 3-4 hours |
| Phase 5 | Agreements | 4-6 hours |
| Phase 6 | Subaccount Management | 6-8 hours |
| Testing | Comprehensive Testing | 8-10 hours |
| **Total** | | **39-54 hours** |

---

## Priority Order (Recommended)

1. **HIGH PRIORITY** (Critical for daily operations)
   - Drug validation clear actions (Phase 1)
   - Pack counter fix (Phase 1)
   - Box status column hiding (Phase 2)
   - Subaccount scrolling fix (Phase 6)

2. **MEDIUM PRIORITY** (Improves workflow)
   - Donation XLS export (Phase 1)
   - Brand name search in donations (Phase 1)
   - Brand name search in boxes (Phase 2)
   - Button text updates (Phase 1)
   - QR code improvements (Phase 3)

3. **LOW PRIORITY** (Nice to have)
   - Date filters (Phase 4)
   - Agreement conditional buttons (Phase 5)
   - Subaccount edit page (Phase 6)
   - Deep linking for external QR (Phase 3)

---

**End of Implementation Plan**
