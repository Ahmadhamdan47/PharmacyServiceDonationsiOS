import React, { createContext, useContext, useEffect, useState } from "react";
import { Alert, Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const DonationContext = createContext();

export const useDonationContext = () => useContext(DonationContext);

export const DonationProvider = ({ children }) => {
  const [donations, setDonations] = useState([]);
  const [donors, setDonors] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedDonorId, setSelectedDonorId] = useState("");
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [drugs, setDrugs] = useState([]);
  const [Presentation, setPresentation] = useState("");
  const [Form, setForm] = useState("");
  const [DrugName, setDrugName] = useState("");
  const [drugNames, setDrugNames] = useState([]);
  const [selectedDrugName, setSelectedDrugName] = useState("");
  const [barcodeData, setBarcodeData] = useState([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [scanBarcodeVisible, setScanBarcodeVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  // const [scannedData, setScannedData] = useState(null);
  const [resetForm, setResetForm] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState("");
  const [DonationPurpose, setDonationPurpose] = useState("");
  const [Quantity, setQuantity] = useState("");
  const [DonationDate, setDonationDate] = useState(new Date().toISOString());
  const [ProductionDate, setProductionDate] = useState("");
  const [Laboratory, setLaboratory] = useState("");
  const [LaboratoryCountry, setLaboratoryCountry] = useState("");
  const [LOT, setLOT] = useState("");
  const [GTIN, setGTIN] = useState("");
  const [Serial, setSerial] = useState("");
  const [ExpiryDate, setExpiryDate] = useState("");
  const [medicationDetails, setmedicationDetails] = useState([]);
  const [scannedData, setScannedData] = useState([]);

  const [donationForm, setDonationForm] = useState({
    DonorId: "",
    DrugId: "",
    DonorName: "",
    DonorType: "Individual",
    selectedDrugName: "",
    medicationDetails: [],
    scannedData: [],
    DrugName: "",
    Quantity: "",
    Presentation: "",
    Form: "",
    DonationPurpose: "",
    DonationDate: new Date().toISOString(),
    ProductionDate: "2024-03-31",
    Laboratory: "",
    LaboratoryCountry: "",
    LOT: "",
    ExpiryDate: "",
    GTIN: "",
    Serial: "",
  });

  // Function to toggle edit mode
  const toggleEditMode = () => {
    setEditMode((prevMode) => !prevMode);
  };

  useEffect(() => {
    const loadDonations = async () => {
      try {
        const storedDonations = await AsyncStorage.getItem("donations");
        if (storedDonations) {
          setDonations(JSON.parse(storedDonations));
        }
      } catch (error) {
        handleAsyncStorageError(
          "Error loading donations from AsyncStorage:",
          error
        );
      }
    };

    const fetchData = async () => {
      try {
        // Fetch recipients, drugs, drug names, and donors
        await Promise.all([
          fetchRecipients(),
          fetchDrugs(),
          fetchDrugNames(),
          fetchDonors(),
        ]);
      } catch (error) {
        handleFetchDataError(error);
      }
    };

    loadDonations();
    fetchData();
  }, []);

  const fetchDrugNames = async () => {
    try {
      const response = await axios.get("https://apiv2.medleb.org/drugs/all");
      const drugsData = response.data;
      const drugNames = drugsData.map((drug) => drug.DrugName);

      setDrugNames(drugNames);
      if (drugNames.length > 0) {
        setSelectedDrugName();
        setDonationForm((prevState) => ({
          ...prevState,
          DrugName: drugNames[0],
        }));
      }
    } catch (error) {
      handleAxiosError("Error fetching drug names:", error);
    }
  };

  const handleDrugNameChange = (drugName) => {
    setSelectedDrugName(drugName);
    setDonationForm({ ...donationForm, DrugName: drugName });
  };

  // Function to handle onChangeText for any field
  const handleFieldChange = (fieldName, value) => {
    setDonationForm((prevForm) => ({
      ...prevForm,
      [fieldName]: value,
    }));
  };

  useEffect(() => {
    const saveDonations = async () => {
      try {
        await AsyncStorage.setItem("donations", JSON.stringify(donations));
      } catch (error) {
        handleAsyncStorageError(
          "Error saving donations to AsyncStorage:",
          error
        );
      }
    };

    saveDonations();
  }, [donations]);

  const fetchDonations = async () => {
    try {
      const response = await axios.get("https://apiv2.medleb.org/donation/all");
      const data = response.data.map((donation) => ({
        ...donation,
        DonationDate: new Date(donation.DonationDate).toLocaleDateString(
          "en-GB"
        ),
        ExpiryDate: new Date(donation.ExpiryDate).toLocaleDateString("en-GB"),
      }));
      setDonations(data);
    } catch (error) {
      handleAxiosError("Error fetching donations:", error);
      handleFetchDonationsError(error);
    }
  };

  const showAlert = (title, message) => {
    Alert.alert(title, message, [{ text: "OK" }], { cancelable: false });
  };

  const fetchDonors = async () => {
    try {
      const response = await axios.get("https://apiv2.medleb.org/donor/all");
      const donorsData = response.data;

      setDonors(donorsData);
      setSelectedDonorId(donorsData[0]?.DonorId || null);

      if (donorsData.length > 0) {
        setDonationForm((prevState) => ({
          ...prevState,
          DonorId: donorsData[0]?.DonorId || "",
          DonorName: donorsData[0]?.DonorName || "",
        }));
      }
    } catch (error) {
      handleAxiosError("Error fetching donors:", error);
    }
  };

  const fetchRecipients = async () => {
    try {
      const response = await axios.get("https://apiv2.medleb.org/recipient/all");
      const recipientsData = response.data;

      const mappedRecipients = recipientsData.map((recipient) => ({
        RecipientId: recipient.RecipientId,
        RecipientName: recipient.RecipientName,
      }));

      setRecipients(mappedRecipients);
      setSelectedRecipient(recipientsData[0]?.RecipientId || null);

      if (mappedRecipients.length > 0) {
        setDonationForm((prevState) => ({
          ...prevState,
          RecipientId: mappedRecipients[0].RecipientId,
          RecipientName: mappedRecipients[0].RecipientName,
        }));
      }
    } catch (error) {
      handleAxiosError("Error fetching recipients:", error);
    }
  };

  const addDonation = async () => {
    try {
      const requiredFields = [
        "DrugName",
        "RecipientId",
        "GTIN",
        "LOT",
        "ExpiryDate",
        "Serial",
      ];

      // Check for missing required fields
      const missingFields = requiredFields.filter(
        (field) => !donationForm.hasOwnProperty(field)
      );

      if (missingFields.length > 0) {
        throw new Error(
          `Missing required field(s): ${missingFields.join(", ")}`
        );
      }

      // Get the selected drug object
      const selectedDrug = drugs.find(
        (drug) => drug.DrugName === selectedDrugName
      );

      if (!selectedDrug) {
        throw new Error("Selected drug not found");
      }

      // Find the selected donor
      const selectedDonor = donors.find(
        (donor) => donor.DonorId === selectedDonorId
      );

      console.log("Selected donor:", selectedDonor);

      if (!selectedDonor) {
        throw new Error("Selected donor not found");
      }

      // Format the ExpiryDate to the expected format (YYYY-MM-DD)
      const formattedExpiryDate = new Date(donationForm.ExpiryDate)
        .toISOString()
        .split("T")[0];

      // Prepare data for the donation
      const data = {
        ...donationForm,
        DonorId: selectedDonorId,
        DrugId: selectedDrug._id,
        ExpiryDate: formattedExpiryDate, // Use the formatted ExpiryDate
      };

      // Send POST request to add donation
      const response = await axios.post(
        "https://apiv2.medleb.org/donation/add",
        data,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Check if donation was added successfully
      if (response.status === 201) {
        console.log("Donation added successfully");
        // Fetch donations after adding a new one
        fetchDonations();
      } else {
        throw new Error("Failed to add donation");
      }
    } catch (error) {
      // console.error("Error adding donation:", error);
      // Handle errors
    }
  };

  const fetchDrugs = async () => {
    try {
      const response = await axios.get("https://apiv2.medleb.org/drugs/all");
      const drugsData = response.data;

      setDrugs(drugsData);

      if (drugsData.length > 0) {
        setDonationForm((prevState) => ({
          ...prevState,
          DrugName: drugsData[0].DrugID,
        }));
      }
    } catch (error) {
      handleAxiosError("Error fetching drugs:", error);
    }
  };

  const updateDonation = async (donationId, updatedData) => {
    try {
      const response = await fetch(`/donation/${donationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      // Check if the response status is not ok
      if (!response.ok) {
        // Throw an error with a custom message
        throw new Error("Failed to update donation");
      }

      // Parse the response data
      const responseData = await response.json();
      console.log("Donation updated successfully:", responseData);
      // Return the response data
      return responseData;
    } catch (error) {
      // Log the error
      console.error("Error updating donation:", error);
      // Throw the error again to propagate it to the caller
      throw error;
    }
  };

  const handleAxiosError = (message, error) => {
    console.error(message, error);
    if (error.response) {
      console.error("Server responded with error:", error.response.status);
    } else if (error.request) {
      console.error("No response received from server:", error.request);
    } else {
      console.error("Error setting up the request:", error.message);
    }
  };

  const handleAsyncStorageError = (message, error) => {
    console.error(message, error);
    if (error.code === "ERR_STORAGE_FULL") {
      console.error("Storage is full. Please free up space.");
    } else if (error.code === "ERR_STORAGE_PERMISSION_DENIED") {
      console.error("Storage permission denied. Please grant permission.");
    } else {
      console.error("Failed to save donations to AsyncStorage:", error.message);
    }
  };

  const handleFetchDataError = (error) => {
    console.error("Error fetching data:", error);
    showAlert("Error", "Failed to fetch data. Please try again later.");
  };

  const handleFetchDonationsError = (error) => {
    if (error.response && error.response.status === 404) {
      console.error("Donations not found. The server returned a 404 error.");
    } else if (error.code === "ECONNREFUSED") {
      console.error(
        "Connection refused. Please check your network connection."
      );
    } else {
      console.error("Failed to fetch donations:", error.message);
    }
  };

  // Function to handle submission confirmation
  const handleConfirmation = () => {
    setConfirmationVisible(true);
  };

  // Function to open the camera modal and initiate scanning
  const openCamera = () => {
    setCameraVisible(true);
  };

  // Function to add more barcode input sections
  const addMoreSections = () => {
    openCamera();
  };

  // const handleBarcodeScanned = ({ type, data }) => {
  //   console.log(`Barcode with type ${type} and data ${data} has been scanned!`);
  //   try {
  //     // Parse scanned data
  //     const response = { GTIN: "", LOT: "", ExpiryDate: "", Serial: "" };
  //     let responseCode = data;

  //     const prefixes = [
  //       { prefix: "01", key: "GTIN", length: 14 },
  //       { prefix: "10", key: "LOT" },
  //       { prefix: "17", key: "ExpiryDate", length: 6 },
  //       { prefix: "21", key: "Serial" },
  //     ];

  //     prefixes.forEach(({ prefix, key, length }) => {
  //       const position = responseCode.indexOf(prefix);

  //       if (position !== -1) {
  //         const start = position + prefix.length;
  //         let end;

  //         if (length) {
  //           end = start + length;
  //         } else {
  //           const gsPosition = responseCode.indexOf(
  //             String.fromCharCode(29),
  //             start
  //           );
  //           end = gsPosition !== -1 ? gsPosition : responseCode.length;
  //         }

  //         response[key] = responseCode.substring(start, end);
  //         responseCode =
  //           responseCode.slice(0, position) + responseCode.slice(end);
  //       }
  //     });

  //     console.log("Scanned data:", response); // Additional logging

  //     // Update scannedData state immutably
  //     setScannedData((prevData) => [...(prevData || []), response]);
  //     setBarcodeData((prevBarcodeData) => [
  //       ...(prevBarcodeData || []),
  //       response,
  //     ]);
  //     setCameraVisible(false); // Close camera modal after scanning
  //     setModalVisible(true);

  //     console.log("Donation Form before update:", donationForm);

  //     // Update the donationForm with scanned barcode data
  //     setDonationForm((prevForm) => ({
  //       ...prevForm,
  //       LOT: response.LOT || prevForm.LOT,
  //       ExpiryDate: response.ExpiryDate || prevForm.ExpiryDate,
  //       GTIN: response.GTIN || prevForm.GTIN,
  //     }));

  //     console.log("Donation Form after update:", donationForm);
  //   } catch (error) {
  //     console.error("Error parsing scanned data:", error);
  //     // Handle error
  //   }
  // };

  const handleBarcodeScanned = ({ type, data }) => {
    console.log(`Barcode with type ${type} and data ${data} has been scanned!`);

    // Log the raw data to ensure it's in the expected format
    console.log("Raw barcode data:", data);

    try {
      // Parse scanned data
      const response = { GTIN: "", LOT: "", ExpiryDate: "", Serial: "" };
      let responseCode = data;

      const prefixes = [
        { prefix: "01", key: "GTIN", length: 14 },
        { prefix: "10", key: "LOT" },
        { prefix: "17", key: "ExpiryDate", length: 6 },
        { prefix: "21", key: "Serial" },
      ];

      prefixes.forEach(({ prefix, key, length }) => {
        const position = responseCode.indexOf(prefix);

        if (position !== -1) {
          const start = position + prefix.length;
          let end;

          if (length) {
            end = start + length;
          } else {
            const gsPosition = responseCode.indexOf(
              String.fromCharCode(29),
              start
            );
            end = gsPosition !== -1 ? gsPosition : responseCode.length;
          }

          response[key] = responseCode.substring(start, end);
          responseCode =
            responseCode.slice(0, position) + responseCode.slice(end);
        }
      });

      console.log("Scanned data:", response); // Additional logging

      // Update scannedData state immutably
      setScannedData((prevData) => [...(prevData || []), response]);
      setBarcodeData((prevBarcodeData) => [
        ...(prevBarcodeData || []),
        response,
      ]);
      setCameraVisible(false); // Close camera modal after scanning
      setModalVisible(true);

      console.log("Donation Form before update:", donationForm);

      // Update the donationForm with scanned barcode data
      setDonationForm((prevForm) => ({
        ...prevForm,
        LOT: response.LOT || prevForm.LOT,
        ExpiryDate: response.ExpiryDate || prevForm.ExpiryDate,
        GTIN: response.GTIN || prevForm.GTIN,
      }));

      console.log("Donation Form after update:", donationForm);
    } catch (error) {
      console.error("Error parsing scanned data:", error);
      // Handle error
    }
  };

  // const handleSubmit = async () => {
  //   try {
  //     console.log("Submitting donation...");
  //     Keyboard.dismiss();

  //     console.log("Donation Form Data before update:", donationForm);

  //     // Logging selectedDrugName before updating the form
  //     console.log("Selected Drug Name before update:", selectedDrugName);

  //     // Update the donationForm with the necessary fields
  //     const updatedForm = {
  //       ...donationForm, // Copy the existing donation form data
  //       RecipientId: selectedRecipient, // Update RecipientId
  //       Presentation: Presentation, // Update Presentation
  //       Form: Form, // Update Form
  //       Quantity: Quantity, // Update Quantity
  //       DonationPurpose: DonationPurpose, // Update DonationPurpose
  //       DonationDate: DonationDate, // Update DonationDate
  //       ProductionDate: ProductionDate, // Update ProductionDate
  //       Laboratory: Laboratory, // Update Laboratory
  //       LaboratoryCountry: LaboratoryCountry, // Update LaboratoryCountry
  //       GTIN: undefined, // Reset GTIN
  //       LOT: undefined, // Reset LOT
  //       Serial: undefined, // Reset Serial
  //       ExpiryDate: undefined, // Reset ExpiryDate
  //       scannedData: scannedData, // Update scannedData
  //       medicationDetails: medicationDetails, // Update medicationDetails
  //       selectedDrugName: selectedDrugName, // Update selectedDrugName
  //     };

  //     console.log("Donation Form Data after update:", updatedForm);

  //     // Logging selectedDrugName after updating the form
  //     console.log("Selected Drug Name after update:", selectedDrugName);

  //     // Add barcode data to the donationForm
  //     const lastBarcode = barcodeData[barcodeData.length - 1];
  //     console.log("Last Barcode Data:", lastBarcode);
  //     if (lastBarcode) {
  //       updatedForm.LOT = lastBarcode.LOT || updatedForm.LOT;
  //       updatedForm.ExpiryDate =
  //         lastBarcode.ExpiryDate || updatedForm.ExpiryDate;
  //       updatedForm.GTIN = lastBarcode.GTIN || updatedForm.GTIN;
  //       updatedForm.Serial = lastBarcode.Serial || updatedForm.Serial;
  //     }

  //     // Add donation
  //     await addDonation(updatedForm);

  //     // Clear form fields only if submission is successful
  //     setDonationForm({
  //       DonorId: "",
  //       RecipientId: "",
  //       DrugName: "",
  //       Quantity: "",
  //       Presentation: "",
  //       Form: "",
  //       DonationPurpose: "",
  //       DonationDate: "",
  //       ProductionDate: "2024-03-31",
  //       Laboratory: "",
  //       LaboratoryCountry: "",
  //       LOT: "",
  //       ExpiryDate: "",
  //       GTIN: "",
  //       Serial: "",
  //       scannedData: [],
  //       medicationDetails: [],
  //       selectedDrugName: "",
  //     });

  //     // Toggle the reset flag to force reset the form fields
  //     setResetForm(true);

  //     // Clear barcode data
  //     setBarcodeData([]);

  //     // Display success message
  //     setSuccessVisible(true);

  //     // Display confirmation modal
  //     handleConfirmation();

  //     // Hide the success message after 2 seconds
  //     setTimeout(() => {
  //       setSuccessVisible(false);
  //     }, 2000);

  //     console.log("Donation submitted successfully");
  //   } catch (error) {
  //     console.error("Error submitting donation:", error);
  //     if (error.message === "Failed to add donation") {
  //       setErrorMessage("Failed to add donation.");
  //     } else {
  //       // setErrorMessage(error.message);
  //     }
  //     setErrorVisible(true);
  //   }
  // };

  const handleSubmit = async () => {
    try {
      console.log("Submitting donation...");
      Keyboard.dismiss();

      console.log("Donation Form Data before update:", donationForm);

      // Update the donationForm with the necessary fields
      const updatedForm = {
        ...donationForm,
        RecipientId: selectedRecipient,
        Presentation: Presentation,
        Form: Form,
        Quantity: Quantity,
        DonationPurpose: DonationPurpose, // Ensure that this is correctly set
        DonationDate: DonationDate,
        ProductionDate: ProductionDate,
        Laboratory: Laboratory,
        LaboratoryCountry: LaboratoryCountry,
      };

      console.log("Donation Form Data after update:", updatedForm);

      // Add barcode data to the donationForm
      const lastBarcode = barcodeData[barcodeData.length - 1];
      console.log("Last Barcode Data:", lastBarcode);
      if (lastBarcode) {
        updatedForm.LOT = lastBarcode.LOT || updatedForm.LOT;
        updatedForm.ExpiryDate =
          lastBarcode.ExpiryDate || updatedForm.ExpiryDate;
        updatedForm.GTIN = lastBarcode.GTIN || updatedForm.GTIN;
        updatedForm.Serial = lastBarcode.Serial || updatedForm.Serial;
      }

      console.log("Donation Form Data after update:", updatedForm);

      // Add donation
      await addDonation(updatedForm);

      // Clear barcode data
      setBarcodeData([]);

      // Display success message
      setSuccessVisible(true);

      // Display confirmation modal
      handleConfirmation();

      console.log("Donation submitted successfully");
    } catch (error) {
      console.error("Error submitting donation:", error);
      if (error.message === "Failed to add donation") {
        setErrorMessage("Failed to add donation.");
      } else {
        // setErrorMessage(error.message);
      }
      setErrorVisible(true);
    }
  };

  // const handleAddToDonation = () => {
  //   console.log("Donation Form Data:", donationForm);
  //   console.log("Barcode Data:", barcodeData);

  //   try {
  //     const scannedData = barcodeData.map((data) => ({
  //       GTIN: data.GTIN,
  //       LOT: data.LOT,
  //       ExpiryDate: data.ExpiryDate,
  //       Serial: data.Serial,
  //     }));
  //     const medicationDetails = barcodeData.map((data) => ({
  //       DrugName: data.DrugName,
  //       Presentation: data.Presentation,
  //       Form: data.Form,
  //       Laboratory: data.Laboratory,
  //       LaboratoryCountry: data.LaboratoryCountry,
  //       Quantity: data.Quantity,
  //     }));

  //     console.log("Medication Details:", scannedData, medicationDetails);

  //     setDonationForm((prevForm) => ({
  //       ...prevForm,
  //       scannedData: [...prevForm.scannedData, ...scannedData],
  //       medicationDetails: [
  //         ...prevForm.medicationDetails,
  //         ...medicationDetails,
  //       ],
  //     }));
  //     setBarcodeData([]);
  //     setScannedData(null);
  //   } catch (error) {
  //     console.error("Error adding medication details to donation:", error);
  //   }
  // };

  const handleAddToDonation = () => {
    console.log("Barcode Data:", barcodeData);

    try {
      const updatedScannedData = barcodeData.map((data) => ({
        GTIN: data.GTIN,
        LOT: data.LOT,
        ExpiryDate: data.ExpiryDate,
        Serial: data.Serial,
      }));
      const updatedMedicationDetails = barcodeData.map((data) => ({
        DrugName: data.DrugName,
        Presentation: data.Presentation,
        Form: data.Form,
        Laboratory: data.Laboratory,
        LaboratoryCountry: data.LaboratoryCountry,
        Quantity: data.Quantity,
      }));

      console.log(
        "Updated Medication Details:",
        updatedScannedData,
        updatedMedicationDetails
      );

      setDonationForm((prevForm) => ({
        ...prevForm,
        scannedData: [...prevForm.scannedData, ...updatedScannedData],
        medicationDetails: [
          ...prevForm.medicationDetails,
          ...updatedMedicationDetails,
        ],
      }));
      setBarcodeData([]);
      setScannedData(null);
    } catch (error) {
      console.error("Error adding medication details to donation:", error);
    }
  };

  // Handler for input focus
  const handleFocus = (inputName) => {
    setFocusedInput(inputName);
  };

  // Handler for input blur
  const handleBlur = () => {
    setFocusedInput("");
  };

  return (
    <DonationContext.Provider
      value={{
        donations,
        handleFocus,
        handleBlur,
        fetchDrugs,
        editMode,
        toggleEditMode,
        drugs,
        donors,
        drugNames,
        setDrugNames,
        selectedDrugName,
        setSelectedDrugName,
        fetchDrugNames,
        handleDrugNameChange,
        recipients,
        setRecipients,
        fetchDonors,
        fetchDonations,
        selectedDonorId,
        setSelectedDonorId,
        fetchRecipients,
        donationForm,
        setDonationForm,
        addDonation,
        updateDonation,
        setDonations,
        addMoreSections,
        openCamera,
        setCameraVisible,
        handleBarcodeScanned,
        setBarcodeData,
        setModalVisible,
        handleSubmit,
        modalVisible,
        setModalVisible,
        scannedData,
        setScannedData,
        handleAddToDonation,
        selectedRecipient,
        setSelectedRecipient,
        Presentation,
        setPresentation,
        Form,
        setForm,
        Laboratory,
        setLaboratory,
        LaboratoryCountry,
        setLaboratoryCountry,
        Quantity,
        setQuantity,
        LOT,
        setLOT,
        GTIN,
        setGTIN,
        ExpiryDate,
        setExpiryDate,
        Serial,
        setSerial,
        DonationPurpose,
        setDonationPurpose,
        handleFieldChange,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
};
