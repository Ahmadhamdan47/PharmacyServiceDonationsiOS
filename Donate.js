import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Dimensions, Keyboard } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { CameraType } from 'expo-camera/build/legacy/Camera.types';
import axios from 'axios';
import DropDownPicker from 'react-native-dropdown-picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

const createEmptyBatchLot = () => ({
  gtin: '',
  lotNumber: '',
  expiryDate: '',
  serialNumber: '',
  drugName: '',
  presentation: '',
  form: '',
  owner: '',
  country: '',
  quantity: '',
  open: false,
  drugValid: null,
  drugValidationMessage: '',
  donationDate: new Date().toISOString(),  // Adding DonationDate with full timestamp
});

const FieldLabel = ({ label }) => (
  <Text style={styles.fieldLabel}>{label}</Text>
);

const BatchLotForm = React.forwardRef(({ form, index, handleFieldChange, drugItems, checkDrugNameInAPI, openCamera, fetchDrugNames, setIsInputFocused, setIsDropDownOpen }, ref) => (
  <View ref={ref} key={index} style={styles.detailsContainer}>
    {index > 0 && (
      <View style={styles.newDrugSeparator}>
        <Text style={styles.newDrugTitle}>New Drug</Text>
      </View>
    )}
    <FieldLabel label="GTIN" />
    <View style={styles.barcodeInputContainer}>
      <TextInput 
        style={styles.input} 
        placeholder="GTIN" 
        value={form.gtin} 
        onChangeText={text => handleFieldChange(index, 'gtin', text)} 
        onFocus={() => setIsInputFocused(true)} 
        onBlur={() => setIsInputFocused(false)}
      />
      <TouchableOpacity onPress={() => openCamera(index)} style={styles.barcodeIcon}>
        <Image source={require("./assets/2d.png")} style={styles.barcodeImage} />
      </TouchableOpacity>
    </View>
    <FieldLabel label="LOT Number" />
    <TextInput 
      style={[styles.input, { marginRight: 30 }]} 
      placeholder="LOT number" 
      value={form.lotNumber} 
      onChangeText={text => handleFieldChange(index, 'lotNumber', text)} 
      onFocus={() => setIsInputFocused(true)} 
      onBlur={() => setIsInputFocused(false)}
    />
    <FieldLabel label="Expiry Date" />
    <TextInput 
      style={[styles.input, { marginRight: 30 }]} 
      placeholder="Expiry Date" 
      value={form.expiryDate} 
      onChangeText={text => handleFieldChange(index, 'expiryDate', text)} 
      onFocus={() => setIsInputFocused(true)} 
      onBlur={() => setIsInputFocused(false)}
    />
    <FieldLabel label="Serial Number" />
    <TextInput 
      style={[styles.input, { marginRight: 30 }]} 
      placeholder="Serial Number" 
      value={form.serialNumber} 
      onChangeText={text => handleFieldChange(index, 'serialNumber', text)} 
      onFocus={() => setIsInputFocused(true)} 
      onBlur={() => setIsInputFocused(false)}
    />
    <View style={styles.separator} />
    <View style={styles.detailsContainer}>
      <Text style={styles.header}>Medication Details</Text>
    </View>
    <FieldLabel label="Drug Name" />
    <DropDownPicker
      open={form.open}
      value={form.drugName}
      items={drugItems}
      setOpen={(open) => {
        handleFieldChange(index, 'open', open);
        setIsDropDownOpen(open);
      }}
      setValue={(callback) => {
        const originalValue = callback(form.drugName);
        handleFieldChange(index, 'drugName', originalValue);
        handleFieldChange(index, 'drugValid', null);

        const selectedDrug = drugItems.find(item => item.value === originalValue);
        if (selectedDrug) {
          handleFieldChange(index, 'form', selectedDrug.drug.pharmaceuticalForm);
          handleFieldChange(index, 'presentation', selectedDrug.drug.presentationLabel);

          const owner = selectedDrug.drug.owner;
          const countryMatch = owner.match(/\(([^)]+)\)/);
          if (countryMatch) {
            handleFieldChange(index, 'owner', owner.replace(countryMatch[0], '').trim());
            handleFieldChange(index, 'country', countryMatch[1]);
          } else {
            handleFieldChange(index, 'owner', owner.trim());
            handleFieldChange(index, 'country', 'France');
          }
        }
      }}
      onChangeSearchText={(text) => {
        fetchDrugNames(text);
      }}
      setItems={() => {}}
      searchable={true}
      placeholder="Select a drug"
      searchPlaceholder="Search..."
      style={[styles.input, form.drugValid === false ? { borderColor: 'red' } : {}]}
      dropDownContainerStyle={{
        backgroundColor: "#fff"
      }}
    />

    {form.drugValid && <Icon name="check" size={30} color="green" style={{ marginLeft: 270 }} />}
    {form.drugValid === false && <Text style={{ color: 'red' }}>{form.drugValidationMessage}</Text>}

    <FieldLabel label="Presentation" />
    <TextInput 
      style={styles.input} 
      placeholder="Presentation" 
      value={form.presentation} 
      onChangeText={text => handleFieldChange(index, 'presentation', text)} 
      onFocus={() => setIsInputFocused(true)} 
      onBlur={() => setIsInputFocused(false)}
    />
    <FieldLabel label="Form" />
    <TextInput 
      style={styles.input} 
      placeholder="Form" 
      value={form.form} 
      onChangeText={text => handleFieldChange(index, 'form', text)} 
      onFocus={() => setIsInputFocused(true)} 
      onBlur={() => setIsInputFocused(false)}
    />

    <FieldLabel label="Owner" />
    <TextInput 
      style={styles.input} 
      placeholder="Owner" 
      value={form.owner} 
      onChangeText={text => handleFieldChange(index, 'owner', text)} 
      onFocus={() => setIsInputFocused(true)} 
      onBlur={() => setIsInputFocused(false)}
    />
    <FieldLabel label="Country" />
    <TextInput 
      style={styles.input} 
      placeholder="Country" 
      value={form.country} 
      onChangeText={text => handleFieldChange(index, 'country', text)} 
      onFocus={() => setIsInputFocused(true)} 
      onBlur={() => setIsInputFocused(false)}
    />
    
    <FieldLabel label="Quantity" />
    <TextInput 
      style={styles.input} 
      placeholder="Quantity" 
      value={form.quantity} 
      onChangeText={text => handleFieldChange(index, 'quantity', text)} 
      onFocus={() => setIsInputFocused(true)} 
      onBlur={() => setIsInputFocused(false)}
    />
  </View>
));

const Donate = ({ route }) => {
  const { donorId, recipientId, donationPurpose, donationId } = route.params || {};
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const batchLotRefs = useRef([]);
  const [batchLots, setBatchLots] = useState([createEmptyBatchLot()]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [type, setType] = useState(CameraType.back);
  const [permission, setPermission] = useState(null);
  const [cameraIndex, setCameraIndex] = useState(null);
  const [drugItems, setDrugItems] = useState([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    fetchDrugNames();
  }, []);

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setIsInputFocused(false)
    );

    return () => {
      keyboardDidHideListener.remove();
    };
  }, []);

  const fetchDrugNames = async (query = '') => {
    try {
      const response = await axios.get(`https://data.instamed.fr/api/drugs?name=${query}`);
      const drugsData = response.data["hydra:member"];
      const dropdownItems = drugsData.map((drug, index) => ({
        label: drug.name,
        value: `${drug.name}-${index}`, // Ensure unique value
        drug // Include the full drug object to access all its properties
      }));
      setDrugItems(dropdownItems);
    } catch (error) {
      console.error("Error fetching drug names:", error);
    }
  };

  const handleBarcodeDetected = ({ type, data }) => {
    try {
        const response = extractDataMatrix(data);
        const updatedBatchLots = [...batchLots];
        updatedBatchLots[cameraIndex] = {
            ...updatedBatchLots[cameraIndex],
            gtin: response.gtin,
            lotNumber: response.lot,
            expiryDate: response.exp ? response.exp.toISOString().split('T')[0] : '',
            serialNumber: response.sn,
        };

        setBatchLots(updatedBatchLots);
        setIsCameraOpen(false);

        // Restore the scroll position after closing the camera
        setTimeout(() => {
            const currentRef = batchLotRefs.current[cameraIndex];
            if (currentRef) {
                currentRef.measureLayout(scrollViewRef.current, (x, y) => {
                  scrollViewRef.current.scrollTo({ y, animated: true });
                });
            }
        }, 100);
    } catch (error) {
        console.error("Error parsing scanned data:", error);
    }
  };

  const extractDataMatrix = (code) => {
    const response = { gtin: '', lot: '', sn: '', exp: null };
    let responseCode = code;
  
    const prefixes = [
      { prefix: '01', key: 'gtin', length: 14 },
      { prefix: '17', key: 'exp', length: 6 }
    ];
  
    prefixes.forEach(({ prefix, key, length }) => {
      const position = responseCode.indexOf(prefix);
  
      if (position !== -1) {
        const start = position + prefix.length;
        const end = start + length;
  
        response[key] = key === 'exp' ? parseExpiryDate(responseCode.substring(start, end)) : responseCode.substring(start, end);
        responseCode = responseCode.slice(0, position) + responseCode.slice(end);
      }
    });
  
    const lotAndSn = extractLotAndSn(responseCode);
    response.lot = lotAndSn.lot;
    response.sn = lotAndSn.sn;
  
    return response;
  };
  
  const extractLotAndSn = (responseCode) => {
    const lotPattern = /10([^\u001d]*)/;
    const snPattern = /21([^\u001d]*)/;
  
    const snMatch = responseCode.match(snPattern);
    let sn = '';
    let lot = '';
  
    if (snMatch) {
      const snPosition = snMatch.index;
      sn = snMatch[1].trim();
      const remainingCode = responseCode.slice(0, snPosition) + responseCode.slice(snPosition + snMatch[0].length);
  
      // Find the `10` prefix that does not immediately follow `21`
      const lotMatch = remainingCode.match(lotPattern);
      if (lotMatch) {
        lot = lotMatch[1].trim();
      }
    } else {
      // If no `sn` is found, directly look for `lot`
      const lotMatch = responseCode.match(lotPattern);
      if (lotMatch) {
        lot = lotMatch[1].trim();
      }
    }
  
    return { lot, sn };
  };
  
  const parseExpiryDate = (expDateString) => {
    const year = parseInt(expDateString.substring(0, 2)) + 2000;
    const month = parseInt(expDateString.substring(2, 4)) - 1;
    const day = parseInt(expDateString.substring(4, 6));
    return new Date(year, month, day);
  };
  
  const handleOpenCamera = async (index) => {
    if (permission === null) {
        const { status } = await Camera.requestPermissionsAsync();
        setPermission(status === 'granted');
        setIsCameraOpen(status === 'granted');
        setCameraIndex(index);
        if (!status === 'granted') {
            Alert.alert('Permission denied', 'Camera permission is required to use the camera.');
        }
    } else if (permission === false) {
        Alert.alert('Permission denied', 'Camera permission is required to use the camera.');
    } else {
        // Track the current scroll position before opening the camera
        const currentRef = batchLotRefs.current[index];
        if (currentRef) {
            currentRef.measureLayout(scrollViewRef.current, (x, y) => {
                setScrollPosition(y);
            });
        }
        setIsCameraOpen(true);
        setCameraIndex(index);
    }
  };

  const checkDrugNameInAPI = async (index, selectedValue) => {
    try {
      const response = await axios.get(`https://apiv2.medleb.org/drugs/checkDrugNameInAPI/${selectedValue}`);
      console.log(selectedValue);
      console.log(response.data.exists);
      const drugExists = response.data.exists;
      const updatedBatchLots = [...batchLots];
      updatedBatchLots[index].drugValid = drugExists;

      if (drugExists) {
        updatedBatchLots[index].drugName = selectedValue;
        updatedBatchLots[index].drugValidationMessage = '';
      } else {
        updatedBatchLots[index].drugValidationMessage = "This drug isn't found in your country's database";
      }
      setBatchLots(updatedBatchLots);
    } catch (error) {
      console.error("Error checking drug name:", error);
      const updatedBatchLots = [...batchLots];
      updatedBatchLots[index].drugValidationMessage = "Error checking the database";
      updatedBatchLots[index].drugValid = false;
      setBatchLots(updatedBatchLots);
    }
  };

  const handleFieldChange = (index, field, value) => {
    setBatchLots(prevBatchLots => {
      const updatedBatchLots = [...prevBatchLots];
      updatedBatchLots[index][field] = value;
      return updatedBatchLots;
    });
  };

  const addBatchLotForm = () => {
    setBatchLots([...batchLots, createEmptyBatchLot()]);
  };

  const exportToExcel = async (donationData, donorName, recipientName, donationDate) => {
    try {
        const tableHead = ['Drug Name', 'GTIN', 'LOT', 'Serial Number', 'Expiry Date', 'Form', 'Presentation', 'Owner', 'Country', 'Quantity', 'Donation Date'];
        const filteredData = donationData.map(batchLot => [
            batchLot.drugName,
            batchLot.gtin,
            batchLot.lotNumber,
            batchLot.serialNumber,
            batchLot.expiryDate,
            batchLot.form,
            batchLot.presentation,
            batchLot.owner,
            batchLot.country,
            batchLot.quantity,
            batchLot.donationDate
        ]);

        const ws = XLSX.utils.aoa_to_sheet([tableHead, ...filteredData]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Donations");

        const wscols = [
            { wch: 20 }, // Drug Name
            { wch: 20 }, // GTIN
            { wch: 15 }, // LOT
            { wch: 20 }, // Serial Number
            { wch: 15 }, // Expiry Date
            { wch: 15 }, // Form
            { wch: 20 }, // Presentation
            { wch: 15 }, // Owner
            { wch: 15 }, // Country
            { wch: 10 }, // Quantity
            { wch: 20 }, // Donation Date
        ];
        ws['!cols'] = wscols;

        const wbout = XLSX.write(wb, { type: 'base64', bookType: "xlsx" });

        const fileName = `${donorName}_${recipientName}_${donationDate}.xlsx`;
        const uri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(uri, wbout, {
            encoding: FileSystem.EncodingType.Base64
        });

        const shareOptions = {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Share Donations Excel',
            UTI: 'com.microsoft.excel.xlsx',
        };

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri, shareOptions);
        } else {
            Alert.alert("Success", "Excel file has been saved to your device's storage.", [{ text: "OK" }]);
        }
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        Alert.alert("Error", "Failed to export to Excel. Please try again.", [{ text: "OK" }]);
    }
};

const submitBatchLot = async () => {
    try {
        const responses = await Promise.all(batchLots.map(batchLot =>
            axios.post('https://apiv2.medleb.org/donation/batchlot', {
                DonationId: donationId,
                DrugName: batchLot.drugName,
                GTIN: batchLot.gtin,
                LOT: batchLot.lotNumber,
                ProductionDate: new Date().toISOString(),
                ExpiryDate: batchLot.expiryDate,
                Quantity: batchLot.quantity,
                Presentation: batchLot.presentation,
                Form: batchLot.form,
                Laboratory: batchLot.owner,
                LaboratoryCountry: batchLot.country,
                SerialNumber: batchLot.serialNumber,
                DonationDate: batchLot.donationDate
            })
        ));

        if (responses.every(response => response.status === 200)) {
            Alert.alert('Success', 'Donations Added Successfully');
            const { donorName, recipientName, donationDate } = route.params;
            await exportToExcel(batchLots, donorName, recipientName, donationDate);
            navigation.navigate('List');
        } else {
            Alert.alert('Warning', 'Make sure you entered all of the required fields correctly');
        }
    } catch (error) {
        console.error('Error creating batch lot:', error);
        Alert.alert('Warning', 'Make sure you scanned the barcode and entered all of the fields correctly');
    }
};

return (
    <View style={styles.container}>
      {isCameraOpen ? (
        <BarCodeScanner
          style={{ ...StyleSheet.absoluteFillObject, height: '100%' }}
          type={type}
          onBarCodeScanned={handleBarcodeDetected}
        />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          onScroll={event => setScrollPosition(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16} // This prop ensures the onScroll event is fired about every 16ms to ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
          scrollEnabled={scrollEnabled}
        >
          <View style={styles.originalFormContainer}>
            <TouchableOpacity onPress={() => handleOpenCamera(0)} activeOpacity={0.6} style={styles.cameraContainer} ref={el => batchLotRefs.current[0] = el}>
              {batchLots[0].gtin === '' && (
                <Image
                  source={require("./assets/2d.png")}
                  style={styles.cameraImage}
                />
              )}
            </TouchableOpacity>

            <View style={styles.barcodeContainer}>
              <FieldLabel label="GTIN" />
              <TextInput
                style={styles.input}
                placeholder="GTIN"
                value={batchLots[0].gtin}
                onChangeText={text => handleFieldChange(0, 'gtin', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              <FieldLabel label="LOT" />
              <TextInput
                style={styles.input}
                placeholder="LOT number"
                value={batchLots[0].lotNumber}
                onChangeText={text => handleFieldChange(0, 'lotNumber', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              <FieldLabel label="Expiry Date" />
              <TextInput
                style={styles.input}
                placeholder="Expiry Date"
                value={batchLots[0].expiryDate}
                onChangeText={text => handleFieldChange(0, 'expiryDate', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              <FieldLabel label="Serial Number" />
              <TextInput
                style={styles.input}
                placeholder="Serial Number"
                value={batchLots[0].serialNumber}
                onChangeText={text => handleFieldChange(0, 'serialNumber', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </View>

            <View style={styles.separator} />

            <View style={styles.detailsContainer}>
              <Text style={styles.header}>Medication Details</Text>
              <DropDownPicker
                open={batchLots[0].open}
                value={batchLots[0].drugName}
                items={drugItems}
                setOpen={(open) => {
                  handleFieldChange(0, 'open', open);
                  setIsDropDownOpen(open);
                }}
                setValue={(callback) => {
                  const originalValue = callback(batchLots[0].drugName);
                  handleFieldChange(0, 'drugName', originalValue);
                  handleFieldChange(0, 'drugValid', null);

                  const selectedDrug = drugItems.find(item => item.value === originalValue);
                  if (selectedDrug) {
                    handleFieldChange(0, 'form', selectedDrug.drug.pharmaceuticalForm);
                    handleFieldChange(0, 'presentation', selectedDrug.drug.presentationLabel);

                    const owner = selectedDrug.drug.owner;
                    const countryMatch = owner.match(/\(([^)]+)\)/);
                    if (countryMatch) {
                      handleFieldChange(0, 'owner', owner.replace(countryMatch[0], '').trim());
                      handleFieldChange(0, 'country', countryMatch[1]);
                    } else {
                      handleFieldChange(0, 'owner', owner.trim());
                      handleFieldChange(0, 'country', 'France');
                    }
                  }
                }}
                onChangeSearchText={(text) => {
                  fetchDrugNames(text);
                }}
                setItems={() => {}}
                searchable={true}
                placeholder="Select a drug"
                searchPlaceholder="Search..."
                style={[styles.input, batchLots[0].drugValid === false ? { borderColor: 'red' } : {}]}
                dropDownContainerStyle={{
                  backgroundColor: "#fff"
                }}
              />

              {batchLots[0].drugValid && <Icon name="check" size={30} color="green" style={{ marginLeft: 270 }} />}
              {batchLots[0].drugValid === false && <Text style={{ color: 'red' }}>{batchLots[0].drugValidationMessage}</Text>}

              <FieldLabel label="Presentation" />
              <TextInput
                style={styles.input}
                placeholder="Presentation"
                value={batchLots[0].presentation}
                onChangeText={text => handleFieldChange(0, 'presentation', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />

              <FieldLabel label="Form" />
              <TextInput
                style={styles.input}
                placeholder="Form"
                value={batchLots[0].form}
                onChangeText={text => handleFieldChange(0, 'form', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />

              <FieldLabel label="Owner" />
              <TextInput
                style={styles.input}
                placeholder="Owner"
                value={batchLots[0].owner}
                onChangeText={text => handleFieldChange(0, 'owner', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />

              <FieldLabel label="Country" />
              <TextInput
                style={styles.input}
                placeholder="Country"
                value={batchLots[0].country}
                onChangeText={text => handleFieldChange(0, 'country', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />

              <FieldLabel label="Quantity" />
              <TextInput
                style={styles.input}
                placeholder="Quantity"
                value={batchLots[0].quantity}
                onChangeText={text => handleFieldChange(0, 'quantity', text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </View>
          </View>

          {batchLots.slice(1).map((form, index) => (
            <BatchLotForm
              key={index + 1}
              form={form}
              index={index + 1}
              handleFieldChange={handleFieldChange}
              drugItems={drugItems}
              checkDrugNameInAPI={checkDrugNameInAPI}
              openCamera={handleOpenCamera}
              fetchDrugNames={fetchDrugNames}
              setIsInputFocused={setIsInputFocused}
              setIsDropDownOpen={setIsDropDownOpen}
              ref={el => batchLotRefs.current[index + 1] = el}
            />
          ))}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={addBatchLotForm}>
              <Text style={styles.buttonText}>Add more</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={submitBatchLot}>
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      {!isCameraOpen && !isInputFocused && !isDropDownOpen && (
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
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  cameraContainer: {
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  cameraImage: {
    width: 280,
    height: 140,
    resizeMode: "contain",
  },
  barcodeContainer: {
    marginBottom: 20,
  },
  barcodeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  barcodeIcon: {
    position: 'absolute',
    right: -20,
    top: -5,
    height: 50,  // Ensure icon size is reasonable
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeImage: {
    width: '100%',
    height: '100%',
    resizeMode: "contain",
  },
  fieldLabel: {
    color: '#707070',  // Adjusted to match the screenshot
    fontSize: 16,  // Adjusted size for visibility
    marginBottom: 5,
    marginLeft: 20,  // Reduced left margin
  },
  input: {
    borderWidth: 1,
    borderColor: '#00a651',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#fff',
  },
  separator: {
    height: 2,
    backgroundColor: '#ccc',
    width: '100%',
    marginBottom: 20,
  },
  detailsContainer: {
    padding: 20,
  },
  header: {
    fontSize: 18,
    color: '#00a651',
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'center',
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00a651',  // Green background
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    width: '90%',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 20,  // Added margin at the top for spacing
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  barcodeIcon: {
    position: 'absolute',
    right: -20,
    top: -5,
    height: 50,  // Ensure icon size is reasonable
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  barcodeImage: {
    width: '100%',
    height: '100%',
    resizeMode: "contain",
  },
  newDrugSeparator: {
    backgroundColor: '#f0f0f0',
    padding: 10,
  },
  newDrugTitle: {
    color: '#00a651',
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskBar: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    bottom: '2%',
    backgroundColor: '#f0f0f0',
  },
  taskBarButton: {
    width: 25,
    height: 25,
    resizeMode: "contain",
    marginTop: 6,
  },
});

export default Donate;
