import React, { useState, useCallback } from "react";
import {
  ALERT_TYPE,
  Dialog,
  AlertNotificationRoot,
  Toast,
} from "react-native-alert-notification";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootParamList } from "./App";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SignNavigationProps = NativeStackNavigationProp<RootParamList, "SignIn">;

interface SignInForm {
  email: string;
  password: string;
}

export function SignInScreen() {
  const navigation = useNavigation<SignNavigationProps>();

  const [formData, setFormData] = useState<SignInForm>({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignInForm>>({});

  const updateField = useCallback(
    (field: keyof SignInForm, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Partial<SignInForm> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);


  const handleSignIn = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        "https://c014101a480d.ngrok-free.app/ContactApp/SignIn",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          await AsyncStorage.setItem("userEmail", formData.email);

        
          Dialog.show({
            type: ALERT_TYPE.SUCCESS,
            title: "Success",
            textBody: "Sign in successful!   ",
            button: "OK",
            onPressButton: () => {
              Dialog.hide();
              navigation.navigate("Home");
            },
          });
        } else {
     
          Dialog.show({
            type: ALERT_TYPE.DANGER,
            title: "Error",
            textBody: data.message || "Invalid email or password",
            button: "Close",
          });
        }
      } else {
     
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Server Error",
          textBody: "Please try again later.",
          button: "Close",
        });
      }
    } catch (error) {
      console.error(error);
   
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Something went wrong. Please try again.",
        button: "Close",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, navigation]);

  const handleForgotPassword = useCallback(() => {
    Dialog.show({
      type: ALERT_TYPE.WARNING,
      title: "Forgot Password",
      textBody: "Password reset flow will be here.",
      button: "OK",
    });
  }, []);

  const handleCreateAccount = useCallback(() => {
    Dialog.show({
      type: ALERT_TYPE.INFO,
      title: "Create Account",
      textBody: "Registration flow will be here.",
      button: "OK",
    });
  }, []);

  return (
    <AlertNotificationRoot>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome  </Text>
              <Text style={styles.subtitle}>Sign In  </Text>
            </View>

            {/* Form */}
            <View style={styles.formSection}>
              {/* Email Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(text) => updateField("email", text)}
                  style={[styles.input, errors.email && styles.inputError]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              {/* Password Field */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    placeholder="Enter your password"
                    value={formData.password}
                    onChangeText={(text) => updateField("password", text)}
                    style={[
                      styles.passwordInput,
                      errors.password && styles.inputError,
                    ]}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    style={styles.passwordToggle}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.passwordToggleText}>
                      {showPassword ? "Hide " : "Show "}
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={styles.forgotPasswordContainer}
              >
                {/* <Text style={styles.forgotPasswordText}>Forgot Password?</Text> */}
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[
                styles.signInButton,
                isLoading && styles.signInButtonDisabled,
              ]}
              onPress={handleSignIn}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AlertNotificationRoot>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: "center" },
  header: { marginBottom: 32, alignItems: "center" },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: { fontSize: 18, color: "#666", textAlign: "center" },
  formSection: { marginBottom: 24 },
  fieldContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1a1a1a",
  },
  inputError: { borderColor: "#f44336", borderWidth: 2 },
  passwordContainer: { position: "relative" },
  passwordInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 12,
    padding: 12,
    paddingRight: 50,
    fontSize: 16,
    color: "#1a1a1a",
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  passwordToggleText: { color: "#007AFF", fontSize: 15, fontWeight: "600" },
  errorText: { color: "#f44336", fontSize: 14, marginTop: 6, marginLeft: 4 },
  forgotPasswordContainer: { alignItems: "flex-end", marginTop: 8 },
  forgotPasswordText: { color: "#007AFF", fontSize: 15, fontWeight: "500" },
  signInButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 24,
  },
  signInButtonDisabled: { backgroundColor: "#ccc" },
  signInButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  backButton: { alignItems: "center", paddingVertical: 12 },
  backButtonText: { color: "#666", fontSize: 16, fontWeight: "500" },
});
