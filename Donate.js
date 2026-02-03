import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Keyboard,
  BackHandler,
  Modal,
  StatusBar,
  Linking,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { CameraView, useCameraPermissions } from "expo-camera"
import DateTimePicker from "@react-native-community/datetimepicker"
import axios from "axios"
import Icon from "react-native-vector-icons/FontAwesome"
import { useNavigation } from "@react-navigation/native"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import XLSX from "xlsx"
import BottomNavBar from "./BottomNavBar" // Import BottomNavBar
import * as Font from "expo-font"

const createEmptyBatchLot = () => ({
  gtin: "",
  lotNumber: "",
  expiryDate: "",
  serialNumber: "",
  drugName: "",
  presentation: "",
  form: "",
  owner: "",
  country: "",
  open: false,
  drugValid: null,
  drugValidationMessage: "",
  donationDate: new Date().toISOString(),
  isNotFoundInFrenchDB: false,
})

const FieldLabel = ({ label }) => <Text style={styles.fieldLabel}>{label}</Text>

const BatchLotForm = React.forwardRef(
  (
    {
      form,
      index,
      handleFieldChange,
      drugItems,
      checkDrugNameInAPI,
      openCamera,
      fetchDrugNames,
      searchDrugByNameInstamed,
      setIsInputFocused,
      setIsDropDownOpen,
      validationErrors,
      onRemove,
    },
    ref,
  ) => {
    const inputRefs = {
      gtin: useRef(null),
      lotNumber: useRef(null),
      expiryDate: useRef(null),
      serialNumber: useRef(null),
      drugName: useRef(null),
      presentation: useRef(null),
      form: useRef(null),
      owner: useRef(null),
      country: useRef(null),
    }

    return (
      <View ref={ref} key={index} style={styles.formContainer}>
        <StatusBar backgroundColor="#f9f9f9" barStyle="dark-content" />

        {index > 0 && (
          <View style={styles.newDrugSeparator}>
            <Text style={styles.newDrugTitle}>New Drug</Text>
            <TouchableOpacity
              style={styles.removeFormButton}
              onPress={() => onRemove && onRemove(index)}
            >
              <Text style={styles.removeFormButtonText}>✕ Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        <FieldLabel label="GTIN" />
        <View style={styles.barcodeInputContainer}>
          <TextInput
            ref={inputRefs.gtin}
            style={[styles.input, validationErrors[index]?.gtin ? styles.inputError : null]}
            value={form.gtin}
            onChangeText={(text) => handleFieldChange(index, "gtin", text)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
          />
          <TouchableOpacity onPress={() => openCamera(index)} style={styles.barcodeIcon}>
            <Image source={require("./assets/2d.png")} style={styles.barcodeImage} />
          </TouchableOpacity>
        </View>
        {validationErrors[index]?.gtin && <Text style={styles.errorMessage}>{validationErrors[index].gtin}</Text>}

        <FieldLabel label="Batch Lot Number" />
        <TextInput
          ref={inputRefs.lotNumber}
          style={[styles.input, validationErrors[index]?.lotNumber ? styles.inputError : null]}
          value={form.lotNumber}
          onChangeText={(text) => handleFieldChange(index, "lotNumber", text)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
        {validationErrors[index]?.lotNumber && (
          <Text style={styles.errorMessage}>{validationErrors[index].lotNumber}</Text>
        )}

        <FieldLabel label="Expiry Date" />
        <TextInput
          ref={inputRefs.expiryDate}
          style={[styles.input, validationErrors[index]?.expiryDate ? styles.inputError : null]}
          value={form.expiryDate}
          onChangeText={(text) => handleFieldChange(index, "expiryDate", text)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
        {validationErrors[index]?.expiryDate && (
          <Text style={styles.errorMessage}>{validationErrors[index].expiryDate}</Text>
        )}

        <FieldLabel label="Serial Number" />
        <TextInput
          ref={inputRefs.serialNumber}
          style={[styles.input, validationErrors[index]?.serialNumber ? styles.inputError : null]}
          value={form.serialNumber}
          onChangeText={(text) => handleFieldChange(index, "serialNumber", text)}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
        />
        {validationErrors[index]?.serialNumber && (
          <Text style={styles.errorMessage}>{validationErrors[index].serialNumber}</Text>
        )}
        {form.isSerialNumberGenerated && <Text style={styles.generatedMessage}>Generated by the system</Text>}

        <View style={styles.medicationDetailsContainer}>
          <View style={styles.line} />
          <Text style={styles.detailsText}>Medication Details</Text>
          <View style={styles.line} />
        </View>

        <FieldLabel label="Drug Name" />
        <TextInput
          ref={inputRefs.drugName}
          style={[styles.input, validationErrors[index]?.drugName ? styles.inputError : null]}
          value={form.drugName}
          onChangeText={(text) => handleFieldChange(index, "drugName", text)}
          onBlur={() => searchDrugByNameInstamed(index, form.drugName)}
          onFocus={() => setIsInputFocused(true)}
          editable={!form.isNotFoundInFrenchDB}
        />
        {validationErrors[index]?.drugName && (
          <Text style={styles.errorMessage}>{validationErrors[index].drugName}</Text>
        )}
        {form.drugValid && <Icon name="check" size={30} color="green" style={{ marginLeft: 270 }} />}
        {form.drugValid === false && (
          <View style={styles.tevaWarning}>
            <Text style={styles.tevaWarningText}>{form.drugValidationMessage}</Text>
          </View>
        )}

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <FieldLabel label="Presentation *" />
            <TextInput
              style={[
                styles.input,
                { fontSize: 12 }, // Override the font size here directly
              ]}
              value={form.presentation}
              onChangeText={(text) => handleFieldChange(index, "presentation", text)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              editable={!form.isNotFoundInFrenchDB}
            />
          </View>
          <View style={styles.halfWidth}>
            <FieldLabel label="Form *" />
            <TextInput
              style={[
                styles.input,
                { fontSize: 12 }, // Override the font size here directly
              ]}
              value={form.form}
              onChangeText={(text) => handleFieldChange(index, "form", text)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              editable={!form.isNotFoundInFrenchDB}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <FieldLabel label="Laboratory *" />
            <TextInput
              style={[
                styles.input,
                { fontSize: 12 }, // Override the font size here directly
              ]}
              value={form.owner}
              onChangeText={(text) => handleFieldChange(index, "owner", text)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              editable={!form.isNotFoundInFrenchDB}
            />
          </View>
          <View style={styles.halfWidth}>
            <FieldLabel label="Country *" />
            <TextInput
              style={[
                styles.input,
                { fontSize: 12 }, // Override the font size here directly
              ]}
              value={form.country}
              onChangeText={(text) => handleFieldChange(index, "country", text)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              editable={!form.isNotFoundInFrenchDB}
            />
          </View>
        </View>
      </View>
    )
  },
)

const Donate = ({ route }) => {
  const [username, setUsername] = useState("")
  const [permission, requestPermission] = useCameraPermissions()

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem("username")
        if (storedUsername) {
          setUsername(storedUsername)
        }
      } catch (error) {
        console.error("Failed to load username:", error)
      }
    }

    fetchUsername()
  }, [])

  // Proactively request camera permission on mount/open
  useEffect(() => {
    (async () => {
      try {
        if (!permission || (!permission.granted && permission.canAskAgain !== false)) {
          await requestPermission()
        }
      } catch (e) {
        console.warn("Camera permission request failed:", e)
      }
    })()
  }, [permission])

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => {
            if (isCameraOpen) {
              setIsCameraOpen(false)
            } else {
              showExitConfirmation()
            }
          }} 
          style={styles.backButtonContainer}
        >
          <Image source={require("./assets/back.png")} style={styles.backButtonImage} />
        </TouchableOpacity>
      ),

      headerTitleAlign: "center",
      headerTitle: "Donate",
      headerTitleStyle: {
        fontFamily: "RobotoCondensed-Bold",
      },
      headerStyle: {
        // Increase the header height to accommodate the margin
        backgroundColor: "#f9f9f9",
        elevation: 0, // Remove shadow on Android
        shadowOpacity: 0, // Remove shadow on iOS
        borderBottomWidth: 0,
      },
    })
  }, [navigation, isCameraOpen]) // Add isCameraOpen to dependencies

  const { donorId, recipientId, donationPurpose, donationId } = route.params || {}
  const navigation = useNavigation()
  const scrollViewRef = useRef(null)
  const batchLotRefs = useRef([])
  const [batchLots, setBatchLots] = useState([createEmptyBatchLot()])
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [cameraIndex, setCameraIndex] = useState(null)
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [drugItems, setDrugItems] = useState([])
  const [scrollEnabled, setScrollEnabled] = useState(true)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isDropDownOpen, setIsDropDownOpen] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [validationErrors, setValidationErrors] = useState([])
  const [isFormValid, setIsFormValid] = useState(false)
  const [currentBox, setCurrentBox] = useState(null)
  const [packCount, setPackCount] = useState(0)
  const [boxLabelCounter, setBoxLabelCounter] = useState(1)
  const [customBoxLabel, setCustomBoxLabel] = useState('') // Custom box name
  const [packCounter, setPackCounter] = useState(1) // Initialize packCounter with 1
  const [finishModalVisible, setFinishModalVisible] = useState(false)
  const [newPackCount, setNewPackCount] = useState(0)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false)
  const [isFontLoaded, setIsFontLoaded] = useState(false)
  const [boxCreatedDate, setBoxCreatedDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const fetchFonts = async () => {
    await Font.loadAsync({
      "RobotoCondensed-Bold": require("./assets/fonts/RobotoCondensed-Bold.ttf"),
      "RobotoCondensed-Medium": require("./assets/fonts/RobotoCondensed-Medium.ttf"),
      "RobotoCondensed-Regular": require("./assets/fonts/RobotoCondensed-Regular.ttf"),
    })
    setIsFontLoaded(true)
  }

  // French BDPM GF API base (specialites)
  const BDPM_BASE = "https://bdpmgf.vedielaute.fr/api/"

  // Detect disallowed manufacturer (TEVA)
  const isTeva = (owner) => typeof owner === "string" && /teva/i.test(owner)

  // Extract country in parentheses from owner like: "LAB NAME (France)"
  const parseOwnerCountry = (owner) => {
    if (!owner) return { owner: "", country: "France" }
    const match = String(owner).match(/\(([^)]+)\)/)
    if (match) {
      return { owner: String(owner).replace(match[0], "").trim(), country: match[1] }
    }
    return { owner: String(owner).trim(), country: "France" }
  }

  // Heuristic to convert GTIN to CIP13 used by French DB
  const toCip13 = (gtin) => {
    if (!gtin) return ""
    const digits = String(gtin).replace(/\D/g, "")
    if (digits.length === 14) return digits.slice(1) // drop packaging indicator
    if (digits.length >= 13) return digits.slice(-13)
    return digits
  }

  // Query BDPM GF API by GTIN (cip13) strictly via presentations -> CIS -> specialite
  const fetchSpecialiteByCip13 = async (code) => {
    if (!code) return null
    const raw = String(code).trim()
    const candidates = [raw]
    const normalized = toCip13(raw)
    if (normalized && normalized !== raw) candidates.push(normalized)

    for (const candidate of candidates) {
      try {
        console.log("BDPM: querying presentations with", candidate)
        const presResp = await axios.get(`${BDPM_BASE}medicaments/presentations`, {
          params: { q: candidate, limit: 10 },
        })
        const dataArr = presResp?.data?.data || presResp?.data || []
        if (!Array.isArray(dataArr) || dataArr.length === 0) {
          continue
        }

        // Only accept exact match on cip13/code (never fallback to cip7)
        const exact = dataArr.find((item) => {
          const cip13 = String(item?.cip13 || "").trim()
          const itemCode = String(item?.code || "").trim()
          return cip13 === candidate || itemCode === candidate
        })

        const chosen = exact || dataArr[0]
        const cis = chosen?.cis
        if (!cis) continue

        const url = `${BDPM_BASE}medicaments/specialites/${encodeURIComponent(cis)}`
        console.log("BDPM: fetching specialite URL:", url)
        const byCis = await axios.get(url)
        if (byCis?.data) {
          return { ...byCis.data, matchedPresentationCip: exact?.cip13 || candidate }
        }
      } catch (e) {
        console.error("BDPM fetch (presentations -> CIS -> specialite) failed:", e?.message)
      }
    }
    return null
  }

  // Apply specialite fields to a batchLot row, matching the scanned GTIN to the correct presentation
  const applySpecialiteToForm = (index, sp, scannedGtin) => {
    if (!sp) return
    const denomination = sp.denomination || ""
    const form = sp.forme_pharma || ""
    const titulaire = sp.titulaire || ""

    const preferredCodes = [String(scannedGtin || "").trim(), toCip13(scannedGtin), String(sp.matchedPresentationCip || "").trim()].filter(Boolean)

    let presentation = sp.libelle || ""
    if (Array.isArray(sp.presentations) && sp.presentations.length > 0) {
      const matchedPresentation = sp.presentations.find((p) => {
        const codes = [String(p?.cip13 || "").trim(), String(p?.code || "").trim()]
        return preferredCodes.some((c) => codes.includes(c))
      })
      presentation = matchedPresentation?.libelle || presentation || sp.presentations[0]?.libelle || ""
    }

    if (isTeva(titulaire)) {
      Alert.alert(
        "Not Allowed", 
        "This drug is not allowed to be donated (TEVA manufacturer blocked)",
        [
          {
            text: "OK",
            onPress: () => {
              if (index === 0) {
                // Main pack form - just clear fields
                clearPackForm(index);
              } else {
                // Additional pack form - remove entirely
                removePack(index);
              }
            }
          }
        ]
      );
      return;
    }

    const parsed = parseOwnerCountry(titulaire)
    setBatchLots((prev) => {
      const updated = [...prev]
      if (!updated[index]) return prev
      updated[index].drugName = denomination
      updated[index].form = form
      updated[index].presentation = presentation
      updated[index].owner = parsed.owner
      updated[index].country = parsed.country
      updated[index].drugValid = true
      updated[index].drugValidationMessage = ""
      return updated
    })
  }

  useEffect(() => {
    fetchFonts() // Load fonts on component mount
  }, [fetchFonts])

  // Fetch existing boxes when continuing a donation to set correct box counter
  useEffect(() => {
    const fetchExistingBoxes = async () => {
      if (!donationId) return;
      
      try {
        const token = await AsyncStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(
          `https://apiv2.medleb.org/boxes/byDonation/${donationId}`,
          { headers }
        );
        
        const existing = Array.isArray(response.data) ? response.data : [];
        let nextNumber = 1;
        
        existing.forEach(b => {
          const match = typeof b.BoxLabel === 'string' && b.BoxLabel.match(/Box\s+(\d+)/i);
          if (match) {
            const n = parseInt(match[1], 10);
            if (!Number.isNaN(n)) {
              nextNumber = Math.max(nextNumber, n + 1);
            }
          }
        });
        
        setBoxLabelCounter(nextNumber);
        setCustomBoxLabel(`Box ${nextNumber}`);
      } catch (error) {
        console.error('Error fetching existing boxes:', error);
      }
    };
    
    fetchExistingBoxes();
  }, [donationId]);

  // Calculate filled packs count
  const getFilledPacksCount = () => {
    return batchLots.filter(pack => 
      pack.gtin || pack.lotNumber || pack.serialNumber
    ).length;
  };

  useEffect(() => {
    const filledCount = getFilledPacksCount();
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.packContainer}>
          <Text style={styles.packText}>{filledCount}</Text>
          <Text style={styles.packText2}>Pack(s)</Text>
        </View>
      ),
    })
  }, [navigation, batchLots])

  useEffect(() => {
    fetchDrugNames()
  }, [])

  // Do NOT auto-create a box on donation start. Boxes are created
  // only when the user actually submits packs, or explicitly adds a box.

  useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setIsInputFocused(false))

    const backAction = () => {
      // If camera is open, close it and go back to Donate page
      if (isCameraOpen) {
        setIsCameraOpen(false)
        return true
      }
      // Otherwise show exit confirmation
      showExitConfirmation()
      return true
    }

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction)

    return () => {
      keyboardDidHideListener.remove()
      backHandler.remove()
    }
  }, [isCameraOpen])

  const showExitConfirmation = () => {
    Alert.alert(
      "Confirm Exit",
      "Do you want to discard changes or go back to the donation?",
      [
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            // Navigate back to DonationDetails page if we have donation params
            if (donationId) {
              navigation.navigate('DonationDetails', {
                donation: {
                  DonationId: donationId,
                  DonorId: donorId,
                  RecipientId: recipientId,
                  DonorName: route.params?.donorName || '',
                  RecipientName: route.params?.recipientName || '',
                  DonationPurpose: donationPurpose || '',
                  DonationTitle: route.params?.donationTitle || '',
                  DonationDate: route.params?.donationDate || new Date().toISOString(),
                }
              });
            } else {
              navigation.goBack();
            }
          },
        },
        {
          text: "Back",
          onPress: () => {
            // Navigate back to DonationDetails page if we have donation params
            if (donationId) {
              navigation.navigate('DonationDetails', {
                donation: {
                  DonationId: donationId,
                  DonorId: donorId,
                  RecipientId: recipientId,
                  DonorName: route.params?.donorName || '',
                  RecipientName: route.params?.recipientName || '',
                  DonationPurpose: donationPurpose || '',
                  DonationTitle: route.params?.donationTitle || '',
                  DonationDate: route.params?.donationDate || new Date().toISOString(),
                }
              });
            } else {
              navigation.goBack();
            }
          },
        },
      ],
      { cancelable: false },
    )
  }
  const generateUniqueSerialNumber = () => {
    // Generate truly unique serial number using:
    // - Timestamp (milliseconds since epoch)
    // - DonorId (from route params)
    // - Random suffix for additional uniqueness
    const timestamp = Date.now().toString(36) // Convert to base36 for shorter string
    const donorIdPart = (donorId || 'UNK').toString().slice(-4) // Last 4 chars of donorId
    const randomSuffix = Math.random().toString(36).substring(2, 8) // 6 random chars
    
    return `${timestamp}-${donorIdPart}-${randomSuffix}`.toUpperCase()
  }

  // Validate serial numbers against the database and auto-regenerate duplicates if app-generated
  const validateSerialNumbers = async (batchLotsToValidate) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      let updatedBatchLots = [...batchLotsToValidate];
      let hasChanges = false;
      const maxRetries = 5; // Prevent infinite loops
      
      // Keep checking and regenerating until all serial numbers are unique
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const validationResults = await Promise.all(
          updatedBatchLots.map(async (batchLot, index) => {
            try {
              const response = await axios.post(
                "https://apiv2.medleb.org/batchserial/checkDonationStatus",
                {
                  GTIN: batchLot.gtin,
                  BatchNumber: batchLot.lotNumber,
                  SerialNumber: batchLot.serialNumber,
                  ExpiryDate: batchLot.expiryDate,
                },
                { headers }
              );
              
              const { isValid, isDonated, messageEN } = response.data;
              
              if (isValid || isDonated) {
                return {
                  index,
                  valid: false,
                  isDuplicate: true,
                  isGenerated: batchLot.isSerialNumberGenerated,
                  message: messageEN || 'Serial number already exists in database',
                  serialNumber: batchLot.serialNumber
                };
              }
              
              return { index, valid: true };
            } catch (error) {
              // If the API call fails (e.g., 404 meaning not found), consider it valid
              if (error.response?.status === 404) {
                return { index, valid: true };
              }
              console.error('Error validating serial number:', error);
              return { 
                index, 
                valid: false,
                isDuplicate: false,
                isGenerated: batchLot.isSerialNumberGenerated,
                message: 'Error validating serial number',
                serialNumber: batchLot.serialNumber
              };
            }
          })
        );
        
        // Find invalid results
        const invalidResults = validationResults.filter(r => !r.valid);
        
        if (invalidResults.length === 0) {
          // All serial numbers are valid
          if (hasChanges) {
            // Update the state with the regenerated serial numbers
            setBatchLots(updatedBatchLots);
            console.log('Auto-regenerated duplicate serial numbers successfully');
          }
          return true;
        }
        
        // Separate duplicates by whether they were generated or scanned
        const scannedDuplicates = invalidResults.filter(r => r.isDuplicate && !r.isGenerated);
        const generatedDuplicates = invalidResults.filter(r => r.isDuplicate && r.isGenerated);
        const errors = invalidResults.filter(r => !r.isDuplicate);
        
        // If there are scanned duplicates or errors, block submission and clear/remove forms
        if (scannedDuplicates.length > 0 || errors.length > 0) {
          const messages = [];
          
          if (scannedDuplicates.length > 0) {
            messages.push('❌ This drug has already been donated in this donation or a previous one:');
            scannedDuplicates.forEach(r => {
              messages.push(`  Pack ${r.index + 1}: ${r.message}`);
              messages.push(`  Serial Number: ${r.serialNumber}`);
            });
          }
          
          if (errors.length > 0) {
            messages.push('\n⚠️ Validation Errors:');
            errors.forEach(r => {
              messages.push(`  Pack ${r.index + 1}: ${r.message}`);
            });
          }
          
          Alert.alert(
            'Cannot Submit Donation',
            messages.join('\n'),
            [{ 
              text: 'OK',
              onPress: () => {
                // Clear or remove problematic packs
                const problematicIndices = [...scannedDuplicates, ...errors].map(r => r.index);
                problematicIndices.sort((a, b) => b - a); // Sort in descending order to avoid index issues
                
                problematicIndices.forEach(idx => {
                  if (idx === 0) {
                    // Main pack form - just clear fields
                    clearPackForm(idx);
                  } else {
                    // Additional pack form - remove entirely
                    removePack(idx);
                  }
                });
              }
            }]
          );
          
          return false;
        }
        
        // Regenerate serial numbers for app-generated duplicates
        if (generatedDuplicates.length > 0) {
          console.log(`Found ${generatedDuplicates.length} app-generated duplicate(s). Auto-regenerating...`);
          
          generatedDuplicates.forEach(r => {
            const newSerialNumber = generateUniqueSerialNumber();
            console.log(`Regenerating Pack ${r.index + 1}: ${r.serialNumber} → ${newSerialNumber}`);
            updatedBatchLots[r.index] = {
              ...updatedBatchLots[r.index],
              serialNumber: newSerialNumber,
              isSerialNumberGenerated: true
            };
          });
          
          hasChanges = true;
          // Continue to next iteration to validate the new serial numbers
          continue;
        }
      }
      
      // If we exhausted retries
      Alert.alert(
        'Validation Error',
        'Unable to generate unique serial numbers after multiple attempts. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
      
    } catch (error) {
      console.error('Error during serial number validation:', error);
      Alert.alert(
        'Validation Error',
        'Unable to validate serial numbers. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  const excludedOwners = []

  const fetchDrugNames = async (query = "") => {
    try {
      // Avoid hitting API with empty query (returns 404 on this API)
      if (!query || query.trim().length < 2) {
        setDrugItems([])
        return
      }
      const resp = await axios.get(`${BDPM_BASE}specialites/?denomination=${encodeURIComponent(query)}`)
      const drugsData = Array.isArray(resp.data)
        ? resp.data
        : resp.data?.items || resp.data?.results || resp.data?.["hydra:member"] || []
      const filteredDrugsData = (drugsData || []).filter((drug) => !isTeva(drug?.titulaire))
      const dropdownItems = filteredDrugsData.map((drug, index) => ({
        label: drug.denomination,
        value: `${drug.denomination}-${index}`,
        drug,
      }))
      setDrugItems(dropdownItems)
    } catch (error) {
      // Gracefully handle 404/no results
      if (error?.response?.status === 404) {
        setDrugItems([])
        return
      }
      console.error("Error fetching drug names:", error)
    }
  }

  // Manual search by drug name using Instamed API when user types name
  const searchDrugByNameInstamed = async (index, name) => {
    if (!name || !name.trim()) return
    try {
      const resp = await axios.get(`https://data.instamed.fr/api/drugs?name=${encodeURIComponent(name.trim())}`)
      const items = resp?.data?.["hydra:member"] || []
      if (!items.length) return
      // pick the first non-TEVA item
      const found = items.find((d) => !isTeva(d?.owner)) || items[0]
      if (!found) return
      if (isTeva(found.owner)) {
        // Show styled TEVA message; block auto-fill
        setBatchLots((prev) => {
          const updated = [...prev]
          if (!updated[index]) return prev
          updated[index].drugValid = false
          updated[index].drugValidationMessage = "This product is not accepted in Lebanese territory (TEVA)."
          return updated
        })
        Alert.alert(
          "Not allowed",
          "The selected manufacturer (TEVA) is not accepted in Lebanese territory. Please choose a different product.",
        )
        return
      }
      const parsed = parseOwnerCountry(found.owner)
      setBatchLots((prev) => {
        const updated = [...prev]
        if (!updated[index]) return prev
        updated[index].drugName = found.name || name
        updated[index].form = found.pharmaceuticalForm || updated[index].form
        updated[index].presentation = found.presentationLabel || updated[index].presentation
        updated[index].owner = parsed.owner || updated[index].owner
        updated[index].country = parsed.country || updated[index].country
        updated[index].drugValid = true
        updated[index].drugValidationMessage = ""
        return updated
      })
    } catch (e) {
      console.error("Instamed name search failed:", e)
    }
  }

  const handleBarcodeDetected = async ({ type, data }) => {
    try {
      const response = extractDataMatrix(data)

      // Close the camera immediately after scanning
      setIsCameraOpen(false)
      // Show loading animation
      setIsProcessingScan(true)

      // Get the auth token for API calls
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const gtinTrimmed = String(response.gtin || "").trim();
      const serialTrimmed = String(response.sn || "").trim();

      // FIRST: Check for duplicates in forms above the current one
      if (gtinTrimmed && serialTrimmed) {
        const duplicateIndex = batchLots.findIndex((lot, idx) => {
          if (idx >= cameraIndex) return false; // Only check forms above
          return String(lot.gtin || "").trim() === gtinTrimmed && 
                 String(lot.serialNumber || "").trim() === serialTrimmed;
        });

        if (duplicateIndex !== -1) {
          // Found duplicate in forms above - prevent scan
          setIsProcessingScan(false)
          setTimeout(() => {
            Alert.alert(
              "Duplicate Pack Detected",
              `This pack has already been scanned in Pack ${duplicateIndex + 1} above.\n\nGTIN: ${gtinTrimmed}\nSerial Number: ${serialTrimmed}\n\nPlease scan a different pack.`,
              [{ text: "OK" }]
            );
          }, 100);
          return; // Stop processing
        }
      }

      // SECOND: Check the database for already donated packs
      const donationStatusResponse = await axios.post("https://apiv2.medleb.org/batchserial/checkDonationStatus", {
        GTIN: response.gtin,
        BatchNumber: response.lot,
        SerialNumber: response.sn,
        ExpiryDate: response.exp ? response.exp.toISOString().split("T")[0] : "",
      }, { headers })

      const { isValid, isDonated, messageEN } = donationStatusResponse.data

      if (isDonated) {
        setIsProcessingScan(false)
        setTimeout(() => {
          Alert.alert(
            "Drug Already Donated",
            `${messageEN}\n\nPlease scan a different pack.`, // Display the message from the API response
            [{ 
              text: "OK",
              onPress: () => {
                // Clear form if it's the initial one, or remove if it's a dynamic form
                if (cameraIndex === 0) {
                  clearPackForm(cameraIndex);
                } else {
                  removePack(cameraIndex);
                }
              }
            }]
          )
        }, 100)

        setIsFormValid(false) // Disable form submission
        return
      }

      // If the drug is found but not donated, continue with the donation process
      const updatedBatchLots = [...batchLots]
      
      // PRIORITY: Use serial number from barcode if available, only generate if missing
      const serialNumber = response.sn && response.sn.trim() 
        ? response.sn.trim() // Use scanned serial number
        : generateUniqueSerialNumber(); // Generate only if barcode has no serial number
      
      updatedBatchLots[cameraIndex] = {
        ...updatedBatchLots[cameraIndex],
        gtin: response.gtin,
        lotNumber: response.lot,
        expiryDate: response.exp ? response.exp.toISOString().split("T")[0] : "",
        serialNumber: serialNumber,
        isSerialNumberGenerated: !response.sn, // Flag to indicate if the serial number was generated
      }

      setBatchLots(updatedBatchLots)

      setTimeout(() => {
        const currentRef = batchLotRefs.current[cameraIndex]
        if (currentRef) {
          currentRef.measureLayout(scrollViewRef.current, (x, y) => {
            scrollViewRef.current.scrollTo({ y, animated: true })
          })
        }
      }, 100)

      // Auto-fill from French DB using raw GTIN directly as cip13
      const codeForLookup = response.gtin
      if (codeForLookup) {
        console.log("BDPM: starting lookup with GTIN:", codeForLookup)
        const specialite = await fetchSpecialiteByCip13(codeForLookup)
        if (specialite) {
          console.log("BDPM: specialite found for GTIN:", codeForLookup)
          applySpecialiteToForm(cameraIndex, specialite, codeForLookup)
          // Hide loading animation after successful processing
          setTimeout(() => setIsProcessingScan(false), 500)
        } else {
          console.log("BDPM: no specialite found for GTIN:", codeForLookup)
          
          // Mark this form as not found in French DB to disable field editing
          setBatchLots((prev) => {
            const updated = [...prev]
            if (updated[cameraIndex]) {
              updated[cameraIndex].isNotFoundInFrenchDB = true
            }
            return updated
          })
          
          // Hide loading animation
          setIsProcessingScan(false)
          
          Alert.alert(
            "Not Found in Database",
            "This GTIN was not found in the French database. Please scan again.",
            [
              {
                text: "Scan Again",
                onPress: () => {
                  // Clear the not found flag and re-open camera
                  setBatchLots((prev) => {
                    const updated = [...prev]
                    if (updated[cameraIndex]) {
                      updated[cameraIndex].isNotFoundInFrenchDB = false
                    }
                    return updated
                  })
                  handleOpenCamera(cameraIndex)
                },
              },
            ],
            { cancelable: false }
          )
        }
      }
    } catch (error) {
      setIsProcessingScan(false)
      console.error("Error checking donation status or parsing scanned data:", error)
      
      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        Alert.alert(
          "Authentication Error", 
          "Your session has expired. Please sign in again.",
          [
            { 
              text: "Sign In", 
              onPress: () => {
                AsyncStorage.clear()
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SignIn' }],
                })
              }
            }
          ]
        )
      } else {
        Alert.alert("Error", "Failed to check donation status. Please try again.")
      }
    }
  }

  const extractDataMatrix = (code) => {
    const response = { gtin: "", lot: "", sn: "", exp: null }
    let responseCode = code

    const prefixes = [
      { prefix: "01", key: "gtin", length: 14 },
      { prefix: "17", key: "exp", length: 6 },
    ]

    prefixes.forEach(({ prefix, key, length }) => {
      const position = responseCode.indexOf(prefix)

      if (position !== -1) {
        const start = position + prefix.length
        const end = start + length

        response[key] =
          key === "exp" ? parseExpiryDate(responseCode.substring(start, end)) : responseCode.substring(start, end)
        responseCode = responseCode.slice(0, position) + responseCode.slice(end)
      }
    })

    const lotAndSn = extractLotAndSn(responseCode)
    response.lot = lotAndSn.lot
    response.sn = lotAndSn.sn

    return response
  }

  const extractLotAndSn = (responseCode) => {
    const lotPattern = /10([^\u001d]*)/
    const snPattern = /21([^\u001d]*)/

    const snMatch = responseCode.match(snPattern)
    let sn = ""
    let lot = ""

    if (snMatch) {
      const snPosition = snMatch.index
      sn = snMatch[1].trim()
      const remainingCode = responseCode.slice(0, snPosition) + responseCode.slice(snPosition + snMatch[0].length)

      const lotMatch = remainingCode.match(lotPattern)
      if (lotMatch) {
        lot = lotMatch[1].trim()
      }
    } else {
      const lotMatch = responseCode.match(lotPattern)
      if (lotMatch) {
        lot = lotMatch[1].trim()
      }
    }

    return { lot, sn }
  }

  const parseExpiryDate = (expDateString) => {
    const year = Number.parseInt(expDateString.substring(0, 2)) + 2000
    const month = Number.parseInt(expDateString.substring(2, 4)) - 1
    const day = Number.parseInt(expDateString.substring(4, 6))
    return new Date(year, month, day)
  }

  const handleOpenCamera = async (index) => {
    try {
      // If already granted, open camera directly
      if (permission?.granted) {
        const currentRef = batchLotRefs.current[index]
        if (currentRef) {
          currentRef.measureLayout(scrollViewRef.current, (x, y) => {
            setScrollPosition(y)
          })
        }
        setIsCameraOpen(true)
        setCameraIndex(index)
        return
      }

      // Request permission when not granted yet
      console.log("Requesting camera permission...")
      const result = await requestPermission()

      if (result?.granted) {
        const currentRef = batchLotRefs.current[index]
        if (currentRef) {
          currentRef.measureLayout(scrollViewRef.current, (x, y) => {
            setScrollPosition(y)
          })
        }
        setIsCameraOpen(true)
        setCameraIndex(index)
      } else {
        const actions = []
        if (result && result.canAskAgain === false) {
          actions.push({ text: "Open Settings", onPress: () => Linking.openSettings() })
        }
        actions.push({ text: "OK" })
        Alert.alert(
          "Camera Permission Required",
          "Please allow camera access to scan barcodes.",
          actions
        )
      }
    } catch (error) {
      console.error("Error opening camera:", error)
      Alert.alert("Error", "Failed to open camera. Please try again.")
    }
  }

  const checkDrugNameInAPI = async (index, selectedValue) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`https://apiv2.medleb.org/drugs/checkDrugNameInAPI/${selectedValue}`, { headers })
      const drugExists = response.data.exists
      const updatedBatchLots = [...batchLots]
      updatedBatchLots[index].drugValid = drugExists

      if (drugExists) {
        updatedBatchLots[index].drugName = selectedValue
        updatedBatchLots[index].drugValidationMessage = ""
      } else {
        updatedBatchLots[index].drugValidationMessage = "This drug isn't found in your country's database"
      }
      setBatchLots(updatedBatchLots)
    } catch (error) {
      console.error("Error checking drug name:", error)
      const updatedBatchLots = [...batchLots]
      updatedBatchLots[index].drugValidationMessage = "Error checking the database"
      updatedBatchLots[index].drugValid = false
      setBatchLots(updatedBatchLots)
    }
  }

  const checkFormValidity = () => {
    const allFilled = batchLots.every((batchLot) => {
      const requiredFields = [
        "gtin",
        "lotNumber",
        "expiryDate",
        "serialNumber",
        "drugName",
        "presentation",
        "form",
        "owner",
        "country",
      ]
      return requiredFields.every((field) => batchLot[field] && batchLot[field].trim() !== "")
    })

    setIsFormValid(allFilled)
  }

  // Check for duplicate packets in current batch (same GTIN + serial number)
  const checkForDuplicateInBatch = async (index, gtin, serialNumber) => {
    // Skip if either field is empty
    if (!gtin || !serialNumber) return;

    const gtinTrimmed = String(gtin).trim();
    const serialTrimmed = String(serialNumber).trim();

    // Check against forms above this one (previously scanned packs)
    const duplicateIndex = batchLots.findIndex((lot, idx) => {
      if (idx >= index) return false; // Only check forms above (with lower index)
      return String(lot.gtin || "").trim() === gtinTrimmed && 
             String(lot.serialNumber || "").trim() === serialTrimmed;
    });

    if (duplicateIndex !== -1) {
      // Found duplicate in forms above
      Alert.alert(
        "Duplicate Pack Detected",
        `This pack has already been scanned in Pack ${duplicateIndex + 1} above.\n\nGTIN: ${gtinTrimmed}\nSerial Number: ${serialTrimmed}\n\nWould you like to clear this duplicate entry?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Clear Data",
            onPress: () => {
              if (index === 0) {
                clearPackForm(index);
              } else {
                removePack(index);
              }
            }
          }
        ]
      );
      return true; // Is duplicate
    }

    // Check against database for already donated packets
    try {
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(
        "https://apiv2.medleb.org/batchserial/checkDonationStatus",
        {
          GTIN: gtinTrimmed,
          SerialNumber: serialTrimmed,
          BatchNumber: batchLots[index]?.lotNumber || "",
          ExpiryDate: batchLots[index]?.expiryDate || "",
        },
        { headers }
      );

      const { isDonated, messageEN } = response.data;

      if (isDonated) {
        Alert.alert(
          "Drug Already Donated",
          `${messageEN || "This pack has already been donated."}\n\nGTIN: ${gtinTrimmed}\nSerial Number: ${serialTrimmed}\n\nWould you like to clear this entry?`,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Clear Data",
              onPress: () => {
                if (index === 0) {
                  clearPackForm(index);
                } else {
                  removePack(index);
                }
              }
            }
          ]
        );
        return true; // Is already donated
      }
    } catch (error) {
      // Only log errors, don't block if API check fails
      if (error.response?.status !== 404) {
        console.error("Error checking for duplicate:", error);
      }
    }

    return false; // Not a duplicate
  };

  const handleFieldChange = async (index, field, value) => {
    setBatchLots((prevBatchLots) => {
      const updatedBatchLots = [...prevBatchLots]
      updatedBatchLots[index][field] = value

      const updatedValidationErrors = [...validationErrors]
      if (updatedValidationErrors[index]) {
        delete updatedValidationErrors[index][field]
      }
      setValidationErrors(updatedValidationErrors)

      return updatedBatchLots
    })

    // After updating the field, check for duplicates if both GTIN and serial number are filled
    // Wait a bit to allow state to update
    setTimeout(async () => {
      const currentBatch = batchLots[index] || {};
      const updatedValue = field === 'gtin' || field === 'serialNumber' ? value : currentBatch[field];
      
      const gtin = field === 'gtin' ? value : currentBatch.gtin;
      const serialNumber = field === 'serialNumber' ? value : currentBatch.serialNumber;

      // Only check when both GTIN and serial number are present
      if (gtin && serialNumber && (field === 'gtin' || field === 'serialNumber')) {
        await checkForDuplicateInBatch(index, gtin, serialNumber);
      }
    }, 300);
  }

  useEffect(() => {
    checkFormValidity()
  }, [batchLots])

  const addBatchLotForm = () => {
    setBatchLots([...batchLots, createEmptyBatchLot()])
    setPackCounter(packCounter + 1) // Increment packCounter on adding more batch lots
    console.log(packCounter)
  }

  // Clear pack form (for main pack or any pack)
  const clearPackForm = (index) => {
    setBatchLots((prev) => {
      const updated = [...prev];
      updated[index] = createEmptyBatchLot();
      return updated;
    });
    // Clear validation errors for this pack
    setValidationErrors((prev) => {
      const updated = [...prev];
      updated[index] = {};
      return updated;
    });
  };

  // Remove pack form (for additional packs only)
  const removePack = (index) => {
    if (index === 0) return; // Never remove the first pack
    
    Alert.alert(
      "Remove Pack",
      "Are you sure you want to remove this pack form?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setBatchLots((prev) => prev.filter((_, i) => i !== index));
            setValidationErrors((prev) => prev.filter((_, i) => i !== index));
            setPackCounter(prev => Math.max(1, prev - 1));
            // Update refs array
            batchLotRefs.current = batchLotRefs.current.filter((_, i) => i !== index);
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Validate required fields and set field-level errors
  const validateFields = () => {
    let isAllFieldsValid = true
    const updatedValidationErrors = batchLots.map((batchLot) => {
      const errors = {}
      const requiredFields = [
        "gtin",
        "lotNumber",
        "expiryDate",
        "serialNumber",
        "drugName",
        "presentation",
        "form",
        "owner",
        "country",
      ]
      requiredFields.forEach((field) => {
        const value = batchLot[field]
        if (!value || (typeof value === "string" && value.trim() === "")) {
          errors[field] = "This field is required"
          isAllFieldsValid = false
        }
      })
      return errors
    })

    setValidationErrors(updatedValidationErrors)
    return isAllFieldsValid
  }

  const scrollToField = (index, field) => {
    const currentRef = batchLotRefs.current[index]
    if (currentRef && currentRef[field]) {
      currentRef[field].current.measureLayout(scrollViewRef.current, (x, y) => {
        scrollViewRef.current.scrollTo({ y, animated: true })
      })
    }
  }

  // ...existing code...

  const submitBatchLot = async () => {
    if (!validateFields()) {
      return
    }

    // Block TEVA-owned products
    const tevaFound = batchLots.some((b) => isTeva(b.owner))
    if (tevaFound) {
      Alert.alert("Not Allowed", "This is not accepted to be entered on Lebanese territory.")
      return
    }

    // Guard: the same GTIN must always map to the same drug/presentation/owner to avoid cross-contamination on rapid scans
    const gtinSignatureMap = new Map()
    for (let i = 0; i < batchLots.length; i++) {
      const lot = batchLots[i]
      const gtin = String(lot.gtin || "").trim()
      if (!gtin) continue
      const signature = [lot.drugName, lot.form, lot.presentation, lot.owner]
        .map((v) => String(v || "").trim())
        .join(" | ")
      const existing = gtinSignatureMap.get(gtin)
      if (existing && existing !== signature) {
        Alert.alert(
          "Data mismatch detected",
          `GTIN ${gtin} has conflicting data between entries.\n\nPrevious: ${existing}\nCurrent: ${signature}\n\nPlease rescan to ensure the correct drug is associated with this GTIN.`,
        )
        return
      }
      gtinSignatureMap.set(gtin, signature)
    }

    try {
      console.log("Submitting batch lots...")
      
      // Get the authentication token
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // CRITICAL: Validate all serial numbers before submission to prevent duplicates
      console.log('Validating serial numbers before submission...');
      const isValid = await validateSerialNumbers(batchLots);
      
      if (!isValid) {
        console.log('Serial number validation failed. Aborting submission.');
        return; // Stop submission if validation fails
      }
      
      console.log('Serial number validation passed. Proceeding with submission.');
      
      // Ensure we have a box created for this donation before submitting packs
      const ensureCurrentBox = async () => {
        if (currentBox) return currentBox
        // Compute next unique label from server state
        const boxesResp = await axios.get(`https://apiv2.medleb.org/boxes/byDonation/${donationId}`, { headers })
        const existing = Array.isArray(boxesResp.data) ? boxesResp.data : []
        let nextNumber = 1
        existing.forEach(b => {
          const match = typeof b.BoxLabel === 'string' && b.BoxLabel.match(/Box\s+(\d+)/i)
          if (match) {
            const n = parseInt(match[1], 10)
            if (!Number.isNaN(n)) nextNumber = Math.max(nextNumber, n + 1)
          }
        })
        const label = customBoxLabel.trim() || `Box ${nextNumber}`
        const createResp = await axios.post("https://apiv2.medleb.org/boxes/add", {
          DonationId: donationId,
          BoxLabel: label,
          CreatedDate: boxCreatedDate.toISOString(),
        }, { headers })
        if (createResp.status === 201) {
          setCurrentBox(createResp.data.BoxId)
          setBoxLabelCounter(nextNumber + 1)
          setCustomBoxLabel(`Box ${nextNumber + 1}`)
          return createResp.data.BoxId
        }
        throw new Error('Failed to create box')
      }

      const boxIdToUse = await ensureCurrentBox()

      const responses = await Promise.all(
        batchLots.map((batchLot) =>
          axios.post("https://apiv2.medleb.org/donation/batchlot", {
            DonationId: donationId,
            DrugName: batchLot.drugName,
            GTIN: batchLot.gtin,
            LOT: batchLot.lotNumber,
            ProductionDate: new Date().toISOString(),
            ExpiryDate: batchLot.expiryDate,
            Presentation: batchLot.presentation,
            Form: batchLot.form,
            Laboratory: batchLot.owner,
            LaboratoryCountry: batchLot.country,
            SerialNumber: batchLot.serialNumber,
            DonationDate: batchLot.donationDate,
            BoxId: boxIdToUse,
          }, { headers }),
        ),
      )

      if (responses.every((response) => response.status === 200)) {
        console.log("Batch lots submitted successfully.")
        
        // Query the database to get the actual total count of packs in this box
        const packsResponse = await axios.get(`https://apiv2.medleb.org/batchserial/byBox/${boxIdToUse}`, { headers });
        const actualPackCount = Array.isArray(packsResponse.data?.data) ? packsResponse.data.data.length : 0;
        
        // Update the box with the actual count from the database
        await axios.put(`https://apiv2.medleb.org/boxes/${boxIdToUse}`, { NumberOfPacks: actualPackCount }, { headers })
        console.log(`Box updated with actual pack count: ${actualPackCount}`)

        setPackCount(actualPackCount) // Update local state with actual count
        setNewPackCount(actualPackCount) // Store actual pack count in state
        setFinishModalVisible(true) // Show the custom modal
      } else {
        console.warn("Some batch lots were not submitted successfully.")
        Alert.alert("Warning", "Make sure you entered all of the required fields correctly")
      }
    } catch (error) {
      console.error("Error creating batch lot or recipient agreement:", error)
      
      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        Alert.alert(
          "Authentication Error", 
          "Your session has expired. Please sign in again.",
          [
            { 
              text: "Sign In", 
              onPress: () => {
                AsyncStorage.clear()
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SignIn' }],
                })
              }
            }
          ]
        )
      } else {
        Alert.alert("Warning", "Make sure you scanned the barcode and entered all of the fields correctly")
      }
    }
  }

  // ...existing code...

  const handleAddAnotherBox = async () => {
    try {
      // Get the authentication token
      const token = await AsyncStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Compute next unique label from server state to avoid duplicates
      const boxesResp = await axios.get(`https://apiv2.medleb.org/boxes/byDonation/${donationId}`, { headers })
      const existing = Array.isArray(boxesResp.data) ? boxesResp.data : []
      let nextNumber = 1
      existing.forEach(b => {
        const match = typeof b.BoxLabel === 'string' && b.BoxLabel.match(/Box\s+(\d+)/i)
        if (match) {
          const n = parseInt(match[1], 10)
          if (!Number.isNaN(n)) nextNumber = Math.max(nextNumber, n + 1)
        }
      })
      const label = `Box ${nextNumber}`

      const response = await axios.post("https://apiv2.medleb.org/boxes/add", {
        DonationId: donationId,
        BoxLabel: label,
        CreatedDate: boxCreatedDate.toISOString(),
      }, { headers })

      if (response.status === 201) {
        setCurrentBox(response.data.BoxId)
        setBoxLabelCounter(nextNumber + 1)
        setCustomBoxLabel(`Box ${nextNumber + 1}`)
        setBatchLots([createEmptyBatchLot()])
        setBoxCreatedDate(new Date()) // Reset date to current date for new box
      } else {
        Alert.alert("Error", "Failed to add a new box.")
      }
    } catch (error) {
      console.error("Error adding new box:", error)
      
      // Handle authentication errors specifically
      if (error.response?.status === 401) {
        Alert.alert(
          "Authentication Error", 
          "Your session has expired. Please sign in again.",
          [
            { 
              text: "Sign In", 
              onPress: () => {
                AsyncStorage.clear()
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'SignIn' }],
                })
              }
            }
          ]
        )
      } else {
        Alert.alert("Error", "An error occurred while adding a new box.")
      }
    }
  }

  const handleFinishDonation = () => {
    setConfirmModalVisible(true)
  }
  
  const handleNavigation = (routeName) => {
    Alert.alert(
      "Confirm Navigation",
      "Are you sure you want to leave this page?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => navigation.navigate(routeName),
        },
      ],
      { cancelable: false },
    )
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
      {isCameraOpen ? (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ ...StyleSheet.absoluteFillObject, height: "100%" }}
            facing="back"
            onBarcodeScanned={handleBarcodeDetected}
            barcodeScannerSettings={{
              barcodeTypes: ["datamatrix", "qr", "code128", "code39", "ean13", "ean8", "upc_a", "upc_e"],
            }}
          />
          <TouchableOpacity
            style={styles.closeCameraButton}
            onPress={() => setIsCameraOpen(false)}
          >
            <Text style={styles.closeCameraButtonText}>✕ Close Camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {isProcessingScan && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00a651" />
                <Text style={styles.loadingText}>Processing scan...</Text>
                <Text style={styles.loadingSubText}>Verifying product information</Text>
              </View>
            </View>
          )}
        <ScrollView
          ref={scrollViewRef}
          onScroll={(event) => setScrollPosition(event.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between" }}
          scrollEnabled={scrollEnabled}
        >
          <View style={styles.originalFormContainer}>
            <View style={styles.boxInfoContainer}>
              <Text style={styles.boxTitleText}>Box {boxLabelCounter}</Text>
              
              {/* Custom Box Name Input */}
              <View style={styles.boxNameInputContainer}>
                <Text style={styles.boxNameLabel}>Box Name:</Text>
                <TextInput
                  style={styles.boxNameInput}
                  value={customBoxLabel}
                  onChangeText={setCustomBoxLabel}
                  placeholder={`Box ${boxLabelCounter}`}
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Box Created Date:</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {boxCreatedDate.toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
              {showDatePicker && (
                <DateTimePicker
                  value={boxCreatedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setBoxCreatedDate(selectedDate);
                    }
                  }}
                  maximumDate={new Date()}
                />
              )}
            </View>
            <TouchableOpacity
              onPress={() => handleOpenCamera(0)}
              activeOpacity={0.6}
              style={styles.cameraContainer}
              ref={(el) => (batchLotRefs.current[0] = el)}
            >
              {batchLots[0].gtin === "" && <Image source={require("./assets/2d.png")} style={styles.cameraImage} />}
            </TouchableOpacity>

            <View style={styles.barcodeContainer}>
              <FieldLabel label="GTIN*" />
              <TextInput
                style={[styles.input, validationErrors[0] && validationErrors[0].gtin ? styles.inputError : null]}
                value={batchLots[0].gtin}
                onChangeText={(text) => handleFieldChange(0, "gtin", text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => {
                  setIsInputFocused(false)
                  validateFields()
                }}
              />
              {validationErrors[0] && validationErrors[0].gtin && (
                <Text style={styles.errorMessage}>{validationErrors[0].gtin}</Text>
              )}

              <FieldLabel label="Batch Lot Number*" />
              <TextInput
                style={[styles.input, validationErrors[0]?.lotNumber ? styles.inputError : null]}
                value={batchLots[0].lotNumber}
                onChangeText={(text) => handleFieldChange(0, "lotNumber", text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              {validationErrors[0]?.lotNumber && (
                <Text style={styles.errorMessage}>{validationErrors[0].lotNumber}</Text>
              )}
              <FieldLabel label="Expiry Date*" />
              <TextInput
                style={[styles.input, validationErrors[0]?.expiryDate ? styles.inputError : null]}
                value={batchLots[0].expiryDate}
                onChangeText={(text) => handleFieldChange(0, "expiryDate", text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              {validationErrors[0]?.expiryDate && (
                <Text style={styles.errorMessage}>{validationErrors[0].expiryDate}</Text>
              )}
              <FieldLabel label="Serial Number*" />
              <TextInput
                style={[styles.input, validationErrors[0]?.serialNumber ? styles.inputError : null]}
                value={batchLots[0].serialNumber}
                onChangeText={(text) => handleFieldChange(0, "serialNumber", text)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
              {validationErrors[0]?.serialNumber && (
                <Text style={styles.errorMessage}>{validationErrors[0].serialNumber}</Text>
              )}
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.medicationDetailsContainer}>
                <View style={styles.line} />
                <Text style={styles.detailsText}>Medication Details</Text>
                <View style={styles.line} />
              </View>

              <FieldLabel label="Drug Name" />
              <TextInput
                style={[styles.input, validationErrors[0]?.drugName ? styles.inputError : null]}
                value={batchLots[0].drugName}
                onChangeText={(text) => handleFieldChange(0, "drugName", text)}
                onBlur={() => searchDrugByNameInstamed(0, batchLots[0].drugName)}
                onFocus={() => setIsInputFocused(true)}
                editable={!batchLots[0].isNotFoundInFrenchDB}
              />

              {batchLots[0].drugValid && <Icon name="check" size={30} color="green" style={{ marginLeft: 270 }} />}
              {batchLots[0].drugValid === false && (
                <View style={styles.tevaWarning}>
                  <Text style={styles.tevaWarningText}>{batchLots[0].drugValidationMessage}</Text>
                </View>
              )}

              <View style={styles.detailsContainer}>
                {/* Presentation and Form side by side */}
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <FieldLabel label="Presentation *" />
                    <TextInput
                      style={styles.input}
                      value={batchLots[0].presentation}
                      onChangeText={(text) => handleFieldChange(0, "presentation", text)}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      editable={!batchLots[0].isNotFoundInFrenchDB}
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <FieldLabel label="Form *" />
                    <TextInput
                      style={styles.input}
                      value={batchLots[0].form}
                      onChangeText={(text) => handleFieldChange(0, "form", text)}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      editable={!batchLots[0].isNotFoundInFrenchDB}
                    />
                  </View>
                </View>

                {/* Laboratory and Country side by side */}
                <View style={styles.row}>
                  <View style={styles.halfWidth}>
                    <FieldLabel label="Laboratory *" />
                    <TextInput
                      style={styles.input}
                      value={batchLots[0].owner}
                      onChangeText={(text) => handleFieldChange(0, "owner", text)}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      editable={!batchLots[0].isNotFoundInFrenchDB}
                    />
                  </View>
                  <View style={styles.halfWidth}>
                    <FieldLabel label="Country *" />
                    <TextInput
                      style={styles.input}
                      value={batchLots[0].country}
                      onChangeText={(text) => handleFieldChange(0, "country", text)}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                      editable={!batchLots[0].isNotFoundInFrenchDB}
                    />
                  </View>
                </View>
              </View>
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
              searchDrugByNameInstamed={searchDrugByNameInstamed}
              setIsInputFocused={setIsInputFocused}
              setIsDropDownOpen={setIsDropDownOpen}
              validationErrors={validationErrors}
              onRemove={removePack}
              ref={(el) => (batchLotRefs.current[index + 1] = el)}
            />
          ))}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.addMoreButton,
                !isFormValid && styles.disabledAddMoreButton, // Apply disabled style when form is not valid
              ]}
              onPress={() => (isFormValid ? addBatchLotForm() : validateFields())}
            >
              <Text style={[styles.addMoreButtonText, !isFormValid && styles.disabledAddMoreButtonText]}>Add More Packs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, !isFormValid ? { backgroundColor: "grey" } : {}]}
              onPress={() => (isFormValid ? submitBatchLot() : validateFields())}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </>
      )}
      {!isCameraOpen && !isInputFocused && !isDropDownOpen && <BottomNavBar />}
      <Modal
        animationType="fade"
        transparent={true}
        visible={finishModalVisible}
        onRequestClose={() => setFinishModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setFinishModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{newPackCount} Packs in this box</Text>
            <Text style={styles.modalSubtitle}>{`"${customBoxLabel || `Box ${boxLabelCounter - 1}`}"`}</Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.addBoxButton]}
                onPress={() => {
                  setFinishModalVisible(false)
                  handleAddAnotherBox()
                  setPackCount(0) // Reset pack count
                }}
              >
                <Text style={styles.AddBoxButtonText}>Add More Boxes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.finishButton]}
                onPress={() => {
                  setFinishModalVisible(false)
                  handleFinishDonation()
                }}
              >
                <Text style={styles.modalButtonText}>Finish</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmModalVisible}
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setConfirmModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Confirm finish</Text>
            <Text style={styles.modalSubtitle}>Are you sure you want to finish the donation?</Text>

            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.addBoxButton]}
                onPress={() => {
                  setConfirmModalVisible(false)
                  navigation.navigate("DonorList")
                }}
              >
                <Text style={styles.AddBoxButtonText}>Yes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.finishButton]}
                onPress={() => {
                  setConfirmModalVisible(false)
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  cameraContainer: {
    marginBottom: 10, // Reduced margin
    alignItems: "center",
    width: "100%",
  },
  cameraImage: {
    width: 200, // Reduced width
    height: 100, // Reduced height
    resizeMode: "contain",
  },
  barcodeContainer: {
    marginBottom: 10, // Reduced margin
  },
  barcodeInputContainer: {
    position: "relative",
  },
  barcodeIcon: {
    position: "absolute",
    right: 3,
    top: 10,
    height: 35, // Reduced height
    width: 30, // Reduced width
    justifyContent: "center",
    alignItems: "center",
  },
  barcodeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  fieldLabel: {
    color: "#707070",
    fontSize: 12, // Reduced font size
    marginBottom: 3, // Reduced margin
    marginLeft: 40, // Reduced margin
    fontFamily: "RobotoCondensed-Bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#00a651",
    borderRadius: 20,
    padding: 5,
    paddingLeft: 10,
    height: 50, // Set height to 50px
    marginBottom: 5,
    backgroundColor: "#F9f9f9",
    color: "#000000",
    marginLeft: 35,
    marginRight: 35,
    fontFamily: "RobotoCondensed-Medium",
  },
  inputError: {
    borderColor: "red",
  },
  errorMessage: {
    color: "red",
    marginLeft: 20, // Adjusted margin
    marginBottom: 5, // Reduced margin
  },
  separator: {
    height: 1, // Reduced height
    backgroundColor: "#ccc",
    width: "100%",
    marginBottom: 5, // Reduced margin
  },
  detailsContainer: {
    padding: 0,
  },
  header: {
    fontSize: 14, // Reduced font size
    color: "#000",
    fontFamily: "RobotoCondensed-Bold",
    marginBottom: 8, // Reduced margin
    alignSelf: "center",
  },
  buttonContainer: {
    marginLeft: 75,
    marginBottom: 65, // Reduced margin
    flexDirection: "row", // Align items horizontally (in a row)
    marginTop: 20,
  },
  button: {
    backgroundColor: "#00a651",
    paddingVertical: 10, // Reduced padding
    paddingHorizontal: 10, // Reduced padding
    borderRadius: 20, // Reduced border radius
    width: "35%",
    alignSelf: "center",
    alignItems: "center",
    marginTop: 10, // Reduced margin
    marginHorizontal: 5, // Add space between buttons
  },
  buttonText: {
    color: "white",
    fontFamily: "RobotoCondensed-Bold",
    fontSize: 16, // Reduced font size
  },
  addMoreButton: {
    backgroundColor: "#f9f9f9", // White background
    borderColor: "#00a651", // Green border
    borderWidth: 2, // Border width of 2px
    borderRadius: 20, // Same border radius as the original button
    paddingVertical: 10, // Same padding as original button
    paddingHorizontal: 10, // Same padding as original button
    width: "35%", // Same width as original button
    alignSelf: "center", // Center the button horizontally
    alignItems: "center", // Center the text inside the button
    marginTop: 10, // Same margin as original button
    marginHorizontal: 5, // Same margin as original button
  },
  addMoreButtonText: {
    color: "#00a651", // Green text color
    fontFamily: "RobotoCondensed-Bold",
    fontSize: 16, // Same font size as original button
  },
  newDrugSeparator: {
    backgroundColor: "#f9f9f9",
    padding: 5, // Reduced padding
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newDrugTitle: {
    color: "#00a651",
    fontSize: 14, // Reduced font size
    fontFamily: "RobotoCondensed-Bold",
    marginLeft: 35,
    backgroundColor: "#f9f9f9",
    flex: 1,
  },
  removeFormButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 35,
  },
  removeFormButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "RobotoCondensed-Bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8, // Reduced margin
  },
  halfWidth: {
    width: "49%", // Adjusted width to create space between fields
  },
  backButton: {
    fontSize: 14, // Reduced font size
    fontWeight: "bold",
    color: "#000",
    marginLeft: 10,
  },
  profileContainer: {
    alignItems: "center",
    marginRight: 10,
  },
  circle: {
    width: 30, // Reduced size
    height: 30, // Reduced size
    borderRadius: 15, // Adjusted for reduced size
    borderWidth: 2,
    borderColor: "#00A651",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  circleText: {
    fontSize: 12, // Reduced font size
    color: "#00A651",
    fontWeight: "bold",
  },
  profileText: {
    fontSize: 12, // Reduced font size
    color: "#000",
    fontFamily: "RobotoCondensed-Bold",
  },
  packContainer: {
    alignItems: "center",
    marginRight: 15,
    flexDirection: "column", // Ensure items are stacked vertically
  },
  packText: {
    fontSize: 18,
    color: "red",
    fontFamily: "RobotoCondensed-Bold",
  },
  packText2: {
    fontSize: 12,
    color: "red",
    fontFamily: "RobotoCondensed-Bold",
  },
  backButtonImage: {
    width: 41, // Adjust the size of the back button image
    height: 15,
    marginLeft: 10,
  },
  detailsImage: {
    width: 291, // Adjust the width as needed
    height: 19, // Adjust the height as needed
    resizeMode: "contain", // Ensure the image maintains its aspect ratio
    marginBottom: 10, // Add space between the image and the next elements
    marginLeft: 45,
  },
  disabledAddMoreButton: {
    backgroundColor: "#f9f9f9", // White background
    borderColor: "grey", // Grey border when form is invalid
    borderWidth: 2,
  },
  disabledAddMoreButtonText: {
    color: "grey", // Grey text color when form is invalid
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Darken background
  },
  modalContainer: {
    width: 300,
    backgroundColor: "#00a651", // Green background
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    height: 300,
    position: "relative",
  },
  modalCloseButton: {
    position: "absolute",
    top: 10,
    right: 15,
    zIndex: 1,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    color: "#f9f9f9",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalTitle: {
    color: "#f9f9f9",
    fontSize: 24,
    fontFamily: "RobotoCondensed-Bold",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 50,
  },
  modalSubtitle: {
    color: "#f9f9f9",
    fontSize: 18,
    fontFamily: "RobotoCondensed-Bold",
    textAlign: "center",
    marginBottom: 55,
  },
  modalButtonContainer: {
    flexDirection: "row",
    width: "100%",
  },
  modalButton: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "45%", // Two buttons should take 45% of the modal's width
    alignItems: "center",
  },
  addBoxButton: {
    backgroundColor: "#00a651",
    borderWidth: 2,
    borderColor: "#f9f9f9",
    marginRight: 5,
    marginLeft: 10,
  },
  finishButton: {
    backgroundColor: "#f9f9f9",
    marginRight: 10,
    marginLeft: 5,
  },
  modalButtonText: {
    color: "#00a651",
    fontFamily: "RobotoCondensed-Bold",
  },
  AddBoxButtonText: {
    color: "#f9f9f9",
  },
  smallinput: {
    borderWidth: 1,
    borderColor: "#00a651",
    borderRadius: 20,
    padding: 5,
    paddingLeft: 10,
    height: 50, // Keep height as 50px
    marginBottom: 10,
    backgroundColor: "#ffffff",
    color: "#000000",
    marginLeft: 35,
    marginRight: 35,
    fontFamily: "RobotoCondensed-Medium",
    // Smaller font size for short fields
  },
  medicationDetailsContainer: {
    flexDirection: "row", // Arrange the line and text horizontally
    alignItems: "center", // Aligns the text vertically in the center of the lines
    justifyContent: "center",
    marginBottom: 10,
  },
  line: {
    flex: 1, // Ensures the line stretches to the available width
    height: 1, // The height of the line
    backgroundColor: "#000", // The color of the line
    marginHorizontal: 10, // Adds space between the text and the lines
  },
  detailsText: {
    fontSize: 16, // Adjust for text size
    fontFamily: "RobotoCondensed-Bold",
    textAlign: "center",
    color: "#000", // Ensures the text is black
    // Adjusts the space between characters
  },
  generatedMessage: {
    color: "00a651",
    marginLeft: 20,
    marginBottom: 5,
  },
  tevaWarning: {
    backgroundColor: "#ffe6e6",
    borderColor: "#e60000",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 35,
    marginTop: 4,
  },
  tevaWarningText: {
    color: "#e60000",
    fontFamily: "RobotoCondensed-Bold",
  },
  boxInfoContainer: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    marginHorizontal: 10,
  },
  boxTitleText: {
    fontSize: 20,
    fontFamily: "RobotoCondensed-Bold",
    color: "#00a651",
    marginBottom: 10,
    textAlign: "center",
  },
  boxNameInputContainer: {
    marginBottom: 15,
  },
  boxNameLabel: {
    fontSize: 14,
    fontFamily: "RobotoCondensed-Medium",
    color: "#333",
    marginBottom: 5,
  },
  boxNameInput: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#00a651",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: "RobotoCondensed-Regular",
    color: "#333",
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateLabel: {
    fontSize: 14,
    fontFamily: "RobotoCondensed-Medium",
    color: "#333",
  },
  dateButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#00a651",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: "RobotoCondensed-Medium",
    color: "#333",
  },
  closeCameraButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    zIndex: 10,
  },
  closeCameraButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "RobotoCondensed-Bold",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    fontFamily: "RobotoCondensed-Bold",
    color: "#333",
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "RobotoCondensed-Regular",
    color: "#666",
    textAlign: "center",
  },
})

export default Donate

