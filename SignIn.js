import { useState, useEffect } from "react"
import { View, TextInput, Text, StyleSheet, Alert, Image, TouchableOpacity, StatusBar, KeyboardAvoidingView, ScrollView, Platform, Keyboard } from "react-native"
import axios from "axios"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { FontAwesome5 } from "@expo/vector-icons"
import * as Font from "expo-font"
import { showAuthTroubleshootingDialog, debugAuthState } from './AuthUtils'

const SignIn = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isFontLoaded, setIsFontLoaded] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpAttempts, setOtpAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockoutEndTime, setLockoutEndTime] = useState(0)
  const [timeoutDuration, setTimeoutDuration] = useState(5 * 60 * 1000) // 5 minutes in milliseconds
  const [remainingTime, setRemainingTime] = useState(0)
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  const navigation = useNavigation()

  const fetchFonts = async () => {
    await Font.loadAsync({
      "RobotoCondensed-Bold": require("./assets/fonts/RobotoCondensed-Bold.ttf"),
      "RobotoCondensed-Medium": require("./assets/fonts/RobotoCondensed-Medium.ttf"),
      "RobotoCondensed-Regular": require("./assets/fonts/RobotoCondensed-Regular.ttf"),
    })
    setIsFontLoaded(true)
  }

  useEffect(() => {
    fetchFonts() // Load fonts on component mount
  }, [])

  // Keyboard visibility listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true)
      }
    )
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false)
      }
    )

    return () => {
      keyboardDidHideListener?.remove()
      keyboardDidShowListener?.remove()
    }
  }, [])

  // Check if user is locked out
  useEffect(() => {
    const checkLockStatus = async () => {
      const storedLockoutEndTime = await AsyncStorage.getItem("lockoutEndTime")
      const storedTimeoutDuration = await AsyncStorage.getItem("timeoutDuration")

      if (storedLockoutEndTime) {
        const endTime = Number.parseInt(storedLockoutEndTime)
        if (endTime > Date.now()) {
          setIsLocked(true)
          setLockoutEndTime(endTime)
          if (storedTimeoutDuration) {
            setTimeoutDuration(Number.parseInt(storedTimeoutDuration))
          }
        } else {
          // Lock period has expired
          await AsyncStorage.removeItem("lockoutEndTime")
          await AsyncStorage.removeItem("otpAttempts")
          setIsLocked(false)
        }
      }
    }

    checkLockStatus()
  }, [])

  // Timer for lockout countdown
  useEffect(() => {
    let interval

    if (isLocked) {
      interval = setInterval(() => {
        const remaining = lockoutEndTime - Date.now()
        if (remaining <= 0) {
          clearInterval(interval)
          setIsLocked(false)
          setRemainingTime(0)
        } else {
          setRemainingTime(remaining)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLocked, lockoutEndTime])

  // Customize the navigation header
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image source={require("./assets/medleblogo.png")} style={{ width: 164, height: 50, marginTop: 10 }} />
      ),
      headerTitleAlign: "center",
      headerLeft: () => null,
      headerStyle: {
        height: 150,
        backgroundColor: "#f9f9f9",
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTitleStyle: {
        marginTop: 50,
      },
    })
  }, [navigation])

  const handleSignIn = async () => {
    if (isLocked) {
      const minutes = Math.floor(remainingTime / 60000)
      const seconds = Math.floor((remainingTime % 60000) / 1000)
      Alert.alert(
        "Account Locked",
        `Too many failed attempts. Please try again in ${minutes}:${seconds.toString().padStart(2, "0")}`,
      )
      return
    }
  
    try {
      const response = await axios.post("https://apiv2.medleb.org/users/login", { username, password })
      console.log(response.data)
      if (response.data.token) {
        const { token, role, email, donorData, recipientData } = response.data
  
        // Store the token, username, and user role temporarily
        await AsyncStorage.setItem("tempToken", token)
        await AsyncStorage.setItem("tempUsername", username)
        await AsyncStorage.setItem("tempUserRole", role)

        // Store donor or recipient data if available
        if (donorData) {
          await AsyncStorage.setItem("tempDonorData", JSON.stringify(donorData))
        }
        if (recipientData) {
          await AsyncStorage.setItem("tempRecipientData", JSON.stringify(recipientData))
        }
  
        if (email) {
          // Store email for OTP verification
          await AsyncStorage.setItem("tempEmail", email)
  
          try {
            // Send OTP to the user's email
            const otpResponse = await axios.post("https://apiv2.medleb.org/users/send-otp", { email })
            console.log("OTP sent response:", otpResponse.data)
            setShowOtpInput(true)
          } catch (otpError) {
            console.error("OTP sending error:", otpError)
            let otpErrorMessage = "Failed to send OTP"
            
            if (otpError.response) {
              if (otpError.response.status === 401) {
                otpErrorMessage = "Authorization failed for OTP sending"
              } else if (otpError.response.data?.message) {
                otpErrorMessage = otpError.response.data.message
              } else if (otpError.response.data?.error) {
                otpErrorMessage = otpError.response.data.error
              }
            } else if (otpError.request) {
              otpErrorMessage = "Network error while sending OTP"
            }
            
            Alert.alert("OTP Error", otpErrorMessage + ". Please try again.")
          }
        } else {
          Alert.alert("Error", "Email information missing in response. Please try again.")
        }
      } else {
        Alert.alert("Error", "Invalid credentials")
      }
    } catch (error) {
      console.log(error)
      await debugAuthState() // Log current auth state for debugging
      
      let errorMessage = "Failed to sign in"
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = "Invalid username or password"
        } else if (error.response.status === 403) {
          errorMessage = "Account may be locked or not activated"
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error
        } else {
          errorMessage = `Server error: ${error.response.status}`
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection."
      }
      
      // Show troubleshooting option for authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        Alert.alert(
          "Sign In Failed", 
          errorMessage,
          [
            { text: 'OK', style: 'default' },
            { text: 'Troubleshoot', onPress: showAuthTroubleshootingDialog }
          ]
        )
      } else {
        Alert.alert("Sign In Failed", errorMessage)
      }
    }
  }
  
  const verifyOtp = async () => {
    if (isLocked) return
  
    try {
      // Get the stored email for verification
      const userEmail = await AsyncStorage.getItem("tempEmail")
  
      if (!userEmail) {
        Alert.alert("Error", "Email information missing. Please try logging in again.")
        setShowOtpInput(false)
        return
      }
  
      console.log("Verifying OTP:", otp)
      const response = await axios.post("https://apiv2.medleb.org/users/verify-otp", {
        email: userEmail,
        otp: otp,
      })
      console.log("OTP verification response:", response.data)
  
      if (response.data.success || response.data.message === "OTP verified successfully") {
        // OTP verification successful, complete login
        const tempToken = await AsyncStorage.getItem("tempToken")
        const tempUsername = await AsyncStorage.getItem("tempUsername")
        const tempUserRole = await AsyncStorage.getItem("tempUserRole")
        const tempDonorData = await AsyncStorage.getItem("tempDonorData")
        const tempRecipientData = await AsyncStorage.getItem("tempRecipientData")
  
        // Move from temp storage to actual storage
        await AsyncStorage.setItem("token", tempToken)
        await AsyncStorage.setItem("username", tempUsername)
        await AsyncStorage.setItem("userRole", tempUserRole)
        await AsyncStorage.setItem("pinSet", "true")

        // Store donor or recipient data permanently
        if (tempDonorData) {
          await AsyncStorage.setItem("donorData", tempDonorData)
          const parsedDonorData = JSON.parse(tempDonorData)
          if (parsedDonorData.DonorId) {
            await AsyncStorage.setItem("donorId", parsedDonorData.DonorId.toString())
          }
        }
        if (tempRecipientData) {
          await AsyncStorage.setItem("recipientData", tempRecipientData)
          const parsedRecipientData = JSON.parse(tempRecipientData)
          if (parsedRecipientData.RecipientId) {
            await AsyncStorage.setItem("recipientId", parsedRecipientData.RecipientId.toString())
          }
        }
  
        // Clear temp and OTP-related data
        await AsyncStorage.removeItem("tempToken")
        await AsyncStorage.removeItem("tempUsername")
        await AsyncStorage.removeItem("tempUserRole")
        await AsyncStorage.removeItem("tempDonorData")
        await AsyncStorage.removeItem("tempRecipientData")
        await AsyncStorage.removeItem("tempEmail")
        await AsyncStorage.removeItem("otpAttempts")
        await AsyncStorage.removeItem("lockoutEndTime")
        await AsyncStorage.removeItem("timeoutDuration")
  
        setOtpAttempts(0)
        navigation.navigate("Landing")
      } else {
        handleFailedOtpAttempt()
      }
    } catch (error) {
      console.error("OTP verification error:", error)
      
      let errorMessage = "OTP verification failed"
      
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          errorMessage = "Invalid OTP code"
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error
        } else {
          errorMessage = `Server error: ${error.response.status}`
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection."
      }
      
      Alert.alert("OTP Verification Failed", errorMessage)
      handleFailedOtpAttempt()
    }
  }
  
  const handleFailedOtpAttempt = async () => {
    const newAttempts = otpAttempts + 1
    setOtpAttempts(newAttempts)
    await AsyncStorage.setItem("otpAttempts", newAttempts.toString())
  
    if (newAttempts >= 3) {
      // Lock the account after 3 failed attempts
      const newLockoutEndTime = Date.now() + timeoutDuration
      setIsLocked(true)
      setLockoutEndTime(newLockoutEndTime)
      await AsyncStorage.setItem("lockoutEndTime", newLockoutEndTime.toString())
  
      // Increase timeout for next lockout
      const newTimeoutDuration = timeoutDuration * 2 // Double the timeout duration
      setTimeoutDuration(newTimeoutDuration)
      await AsyncStorage.setItem("timeoutDuration", newTimeoutDuration.toString())
  
      // Reset attempts counter
      setOtpAttempts(0)
      await AsyncStorage.setItem("otpAttempts", "0")
  
      const minutes = Math.floor(timeoutDuration / 60000)
      Alert.alert("Too Many Failed Attempts", `Your account has been locked for ${minutes} minutes.`)
  
      // Clear temp credentials
      await AsyncStorage.removeItem("tempToken")
      await AsyncStorage.removeItem("tempUsername")
      await AsyncStorage.removeItem("tempUserRole")
      await AsyncStorage.removeItem("tempEmail")
  
      setShowOtpInput(false)
      setOtp("")
    } else {
      Alert.alert("Invalid OTP", `Verification failed. You have ${3 - newAttempts} attempts remaining.`)
    }
  }

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible)
  }

  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const resendOtp = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("tempEmail")

      if (!userEmail) {
        Alert.alert("Error", "Email information missing. Please try logging in again.")
        setShowOtpInput(false)
        return
      }

      await axios.post("https://apiv2.medleb.org/users/send-otp", { email: userEmail })
      Alert.alert("OTP Sent", "A new OTP has been sent to your email.")
    } catch (error) {
      console.error("Error resending OTP:", error)
      Alert.alert("Error", "Failed to resend OTP. Please try again.")
    }
  }

  const KEYBOARD_VERTICAL_OFFSET =
    Platform.OS === "ios" ? (showOtpInput ? 60 : 0) : (StatusBar.currentHeight ?? 0) + (showOtpInput ? 50 : 100);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={KEYBOARD_VERTICAL_OFFSET}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
      <View style={[styles.container, isKeyboardVisible && showOtpInput && styles.containerKeyboard]}>
        <StatusBar backgroundColor="#f9f9f9" barStyle="dark-content" />

        {/* Title */}
        <Text style={[
          styles.title, 
          isKeyboardVisible && showOtpInput && { marginTop: 10, marginBottom: 10, fontSize: 14 },
          isKeyboardVisible && !showOtpInput && { marginTop: 20, marginBottom: 20 }
        ]}>
          Medication Donation To Lebanon
        </Text>

        {/* Paragraph - Hide when keyboard is visible or showing OTP */}
        {!isKeyboardVisible && !showOtpInput && (
          <Text style={styles.paragraph}>
            This application is developed for the Pharmacy Service at the Ministry of Public Health, to manage the drug
            donation procedure to Lebanon.
          </Text>
        )}

        {isLocked ? (
          <View style={styles.lockedContainer}>
            <Text style={styles.lockedText}>Account temporarily locked due to too many failed attempts.</Text>
            <Text style={styles.timerText}>Try again in: {formatTime(remainingTime)}</Text>
          </View>
        ) : showOtpInput ? (
          <View style={[styles.otpContainer, isKeyboardVisible && styles.otpContainerKeyboard]}>
            <Text style={[styles.otpTitle, isKeyboardVisible && { fontSize: 16, marginBottom: 8 }]}>
              Enter Verification Code
            </Text>
            <Text style={[styles.otpDescription, isKeyboardVisible && { fontSize: 12, marginBottom: 15 }]}>
              A verification code has been sent to your email. Please enter it below.
            </Text>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="Enter 6-digit code"
              placeholderTextColor="#A9A9A9"
            />
            <TouchableOpacity style={styles.verifyButton} onPress={verifyOtp}>
              <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendLink} onPress={resendOtp}>
              <Text style={styles.linkText}>Resend Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => {
                setShowOtpInput(false)
                setOtp("")
              }}
            >
              <Text style={styles.linkText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginForm}>
            {/* Username Label and Input */}
            <Text style={styles.label}>Username</Text>
            <TextInput 
              style={styles.input} 
              value={username} 
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="#A9A9A9"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password Label and Input */}
            <Text style={styles.label}>Password</Text>
            <View>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                placeholder="Enter your password"
                placeholderTextColor="#A9A9A9"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.showPasswordButton} onPress={togglePasswordVisibility}>
                <FontAwesome5 name={isPasswordVisible ? "eye-slash" : "eye"} size={20} color="#ccc" />
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity style={styles.button} onPress={handleSignIn}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <Text style={styles.link} onPress={() => navigation.navigate("SignUp")}>
              Don't have an account? Sign Up
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#f9f9f9",
    paddingBottom: 100,
    justifyContent: "center",   // so the form stays centered when there's room
  },
  container: {
    flex: 1,                    // let KeyboardAvoidingView control height
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  containerKeyboard: {
    paddingTop: 10,
    justifyContent: "flex-start",
  },
  title: {
    fontFamily: "RobotoCondensed-Bold",
    fontSize: 16,
    textAlign: "center",
    marginTop: 60,
    marginBottom: 46,
    color: "#121212",
  },
  paragraph: {
    fontFamily: "RobotoCondensed-Medium",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "left",
    marginHorizontal: 10,
    marginBottom: 60,
    width: 315,
    height: 73,
    alignSelf: "center",
    color: "#555",
    fontStyle: "italic",
  },
  loginForm: {
    flex: 1,
    justifyContent: "center",
    minHeight: 300,
  },
  label: {
    fontFamily: "RobotoCondensed-Bold",
    fontSize: 14,
    marginBottom: 5,
    color: "#A9A9A9",
    marginLeft: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#00a651",
    padding: 5,
    paddingLeft: 10,
    height: 50,
    borderRadius: 20,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    backgroundColor: '#f9f9f9',
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: "#00a651",
    padding: 5,
    paddingLeft: 10,
    height: 50,
    borderRadius: 20,
    marginBottom: 15,
    marginLeft: 15,
    marginRight: 15,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  button: {
    backgroundColor: "#00a651",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    alignSelf: "center",
    minWidth: 150,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  link: {
    fontFamily: "RobotoCondensed-Regular",
    marginTop: 20,
    color: "#00a651",
    textAlign: "center",
  },
  showPasswordButton: {
    position: "absolute",
    right: 15,
    padding: 9,
    marginTop: 8,
  },
  otpContainer: {
    alignItems: "center",
    marginTop: -40,
  },
  otpContainerKeyboard: {
    marginTop: 10,
  },
  otpTitle: {
    fontFamily: "RobotoCondensed-Bold",
    fontSize: 18,
    marginBottom: 10,
    color: "#121212",
  },
  otpDescription: {
    fontFamily: "RobotoCondensed-Regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
    paddingHorizontal: 20,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: "#00a651",
    padding: 5,
    paddingLeft: 10,
    height: 50,
    borderRadius: 20,
    marginBottom: 20,
    width: "80%",
    backgroundColor: '#f9f9f9',
    textAlign: "center",
    letterSpacing: 5,
  },
  resendLink: {
    marginTop: 25,
  },
  backLink: {
    marginTop: 25,
  },
  linkText: {
    fontFamily: "RobotoCondensed-Bold",
    color: "#00a651",
    fontSize: 16,
  },
  lockedContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff8e1",
    borderRadius: 10,
    marginVertical: 20,
  },
  lockedText: {
    fontFamily: "RobotoCondensed-Medium",
    fontSize: 16,
    textAlign: "center",
    color: "#ff6d00",
    marginBottom: 10,
  },
  timerText: {
    fontFamily: "RobotoCondensed-Bold",
    fontSize: 18,
    color: "#ff6d00",
  },
  verifyButton: {
    backgroundColor: "#00a651",
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    alignSelf: "center",
    minWidth: 150,
  },
})

export default SignIn

