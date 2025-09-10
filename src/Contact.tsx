import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { RootParamList } from "../App";

import { ALERT_TYPE, Dialog } from "react-native-alert-notification";

type ContactNavigationProps = NativeStackNavigationProp<
  RootParamList,
  "Contact"
>;

interface ContactForm {
  profileImage?: string;
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  address: string;
}

export function ContactScreen() {
  const navigation = useNavigation<ContactNavigationProps>();
  const [image, setImage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ContactForm>({
    firstName: "",
    lastName: "",
    mobile: "",
    email: "",
    address: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  // Update form field
  const updateField = useCallback((field: keyof ContactForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Pick image
  const pickImage = useCallback(async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      updateField("profileImage", result.assets[0].uri);
    }
  }, [updateField]);

  // Camera
  const openCamera = useCallback(async () => {
    try {
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== "granted") {
        Dialog.show({
          type: ALERT_TYPE.WARNING,
          title: "Permission Required",
          textBody: "Camera permission is needed to take photos!",
          button: "Close",
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        updateField("profileImage", result.assets[0].uri);
      }
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Failed to take photo. Please try again.",
        button: "Close",
      });
    }
  }, [updateField]);

  // Form validation
  const validateForm = useCallback(() => {
    const { firstName, mobile } = formData;

    if (!firstName.trim()) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Error ",
        textBody: " Fname is required  ",
        button: "Close",
      });
      return false;
    }

    if (!mobile.trim()) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Error ",
        textBody: " Mobile is required  ",
        button: "Close ",
      });
      return false;
    }
    if (!/^\d{10}$/.test(mobile)) {
      Dialog.show({
        type: ALERT_TYPE.WARNING,
        title: "Error ",
        textBody: " Invalid Mobile  ",
        button: "Close ",
      });
      return false;
    }
    return true;
  }, [formData]);

  // Save contact
  const saveContact = useCallback(async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append("firstName", formData.firstName);
      formDataObj.append("lastName", formData.lastName);
      formDataObj.append("mobile", formData.mobile);
      formDataObj.append("email", formData.email);
      formDataObj.append("address", formData.address);

      if (image) {
        formDataObj.append("profileImage", {
          uri: image,
          name: "profile.jpg",
          type: "image/jpg",
        } as any);
      }

      const response = await fetch(
        "https://c014101a480d.ngrok-free.app/ContactApp/SaveContact",
        {
          method: "POST",
          body: formDataObj, // no Content-Type for FormData
        }
      );

      const data = await response.json();

      if (data.success) {
        Dialog.show({
          type: ALERT_TYPE.SUCCESS,
          title: "Success",
          textBody: "Contact saved successfully!",
          button: "OK",
          onPressButton: () => {
            Dialog.hide();
            navigation.navigate("Home");
          },
        });

        setFormData({
          firstName: "",
          lastName: "",
          mobile: "",
          email: "",
          address: "",
          profileImage: undefined,
        });
      } else {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Error",
          textBody: data.message || "Failed to save contact",
          button: "Close",
        });
      }
    } catch (error) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Failed to save contact. Please try again.",
        button: "Close",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, navigation, image]);

  return (
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
            <Text style={styles.title}>Add Contact   </Text>
            <Text style={styles.subtitle}>Create a new contact    </Text>
          </View>

          {/* Profile Image */}
          <View style={styles.imageSection}>
            <Pressable onPress={pickImage} style={styles.imagePicker}>
              {image ? (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              ) : (
                <View style={styles.placeholder}>
                  <Text style={styles.plusIcon}>+</Text>
                  <Text style={styles.placeholderText}>Select Image </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChangeText={(text) => updateField("firstName", text)}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.nameField}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChangeText={(text) => updateField("lastName", text)}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput
                placeholder="+94 77 123 4567"
                value={formData.mobile}
                onChangeText={(text) => updateField("mobile", text)}
                style={styles.input}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                placeholder="Enter email address"
                value={formData.email}
                onChangeText={(text) => updateField("email", text)}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                placeholder="Enter address"
                value={formData.address}
                onChangeText={(text) => updateField("address", text)}
                style={[styles.input, styles.addressInput]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveContact}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? "Saving... " : "Save Contact  "}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.navigate("Home")}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 16 },
  header: { marginBottom: 24, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: { fontSize: 16, color: "#666" },
  imageSection: { alignItems: "center", marginBottom: 32 },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  imagePreview: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  plusIcon: { fontSize: 36, color: "#007AFF", fontWeight: "bold" },
  placeholderText: { fontSize: 14, color: "#666", marginTop: 4 },
  formSection: { marginBottom: 24 },
  nameRow: { flexDirection: "row", marginBottom: 16, gap: 12 },
  nameField: { flex: 1 },
  fieldContainer: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressInput: { height: 80, paddingTop: 14 },
  buttonSection: { marginTop: 20, gap: 12 },
  saveButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: { color: "#007AFF", fontSize: 16, fontWeight: "600" },
});
