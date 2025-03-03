"use client"

import { useState, useEffect } from "react"
import { View, TextInput, Text, StyleSheet, Alert, Image, TouchableOpacity, StatusBar } from "react-native"
import axios from "axios"
import { useNavigation } from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { FontAwesome5 } from "@expo/vector-icons"
import * as Font from "expo-font"

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
        const { token, role, email } = response.data
  
        // Store the token, username, and user role temporarily
        await AsyncStorage.setItem("tempToken", token)
        await AsyncStorage.setItem("tempUsername", username)
        await AsyncStorage.setItem("tempUserRole", role)
  
        if (email) {
          // Store email for OTP verification
          await AsyncStorage.setItem("tempEmail", email)
  
          // Send OTP to the user's email
          const otpResponse = await axios.post("https://apiv2.medleb.org/users/send-otp", { email })
          console.log("OTP sent response:", otpResponse.data)
          setShowOtpInput(true)
        } else {
          Alert.alert("Error", "Email information missing in response. Please try again.")
        }
      } else {
        Alert.alert("Error", "Invalid credentials")
      }
    } catch (error) {
      console.log(error)
      Alert.alert("Error", "Failed to sign in")
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
  
        // Move from temp storage to actual storage
        await AsyncStorage.setItem("token", tempToken)
        await AsyncStorage.setItem("username", tempUsername)
        await AsyncStorage.setItem("userRole", tempUserRole)
        await AsyncStorage.setItem("pinSet", "true")
  
        // Clear temp and OTP-related data
        await AsyncStorage.removeItem("tempToken")
        await AsyncStorage.removeItem("tempUsername")
        await AsyncStorage.removeItem("tempUserRole")
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

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#f9f9f9" />

      {/* Title */}
      <Text style={styles.title}>Drug Donation To Lebanon</Text>

      {/* Paragraph */}
      <Text style={styles.paragraph}>
        This application is developed for the Pharmacy Service at the Ministry of Public Health, to manage the drug
        donation procedure to Lebanon.
      </Text>

      {isLocked ? (
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedText}>Account temporarily locked due to too many failed attempts.</Text>
          <Text style={styles.timerText}>Try again in: {formatTime(remainingTime)}</Text>
        </View>
      ) : showOtpInput ? (
        <View style={styles.otpContainer}>
          <Text style={styles.otpTitle}>Enter Verification Code</Text>
          <Text style={styles.otpDescription}>
            A verification code has been sent to your email. Please enter it below.
          </Text>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="Enter 6-digit code"
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
        <>
          {/* Username Label and Input */}
          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} />

          {/* Password Label and Input */}
          <Text style={styles.label}>Password</Text>
          <View>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
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
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
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
    marginBottom: 55,
    width: 315,
    height: 67,
    alignSelf: "center",
    color: "#555",
    fontStyle: "italic",
  },
  label: {
    fontFamily: "RobotoCondensed-Bold",
    fontSize: 12,
    marginBottom: 5,
    color: "#A9A9A9",
    marginLeft: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#00a651",
    paddingLeft: 15,
    height: 35,
    borderRadius: 20,
    marginBottom: 10,
    marginLeft: 15,
    marginRight: 15,
    fontSize: 12,
  },
  button: {
    backgroundColor: "#00a651",
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginLeft: 15,
    marginRight: 15,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontFamily: "RobotoCondensed-Bold",
    fontSize: 16,
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
    padding: 7,
  },
  otpContainer: {
    alignItems: "center",
    marginTop: -40,
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
    paddingLeft: 15,
    height: 45,
    borderRadius: 20,
    marginBottom: 20,
    width: "80%",
    fontSize: 16,
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
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginLeft: 15,
    marginRight: 15,
    marginTop: 10,
    width: "80%",
  },
})

export default SignIn

