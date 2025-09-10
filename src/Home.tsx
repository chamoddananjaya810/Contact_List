// HomeScreen.tsx
import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { RootParamList } from "../App";

type HomeNavigationProps = NativeStackNavigationProp<RootParamList, "Home">;

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  profileImage?: string;
  initials?: string;
}

type ApiContact = {
  id?: string | number;
  firstName?: string;
  last_name?: string;
  mobile?: string;
  email?: string;
  image_path?: string;
  // other fields possible
};

const BASE_URL = "https://c014101a480d.ngrok-free.app/ContactApp/";
const API_URL = `${BASE_URL}Contacts`;

export function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProps>();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const mapToContact = useCallback((c: ApiContact): Contact => {
    // Construct the full name from firstName and last_name
    const name = [c.firstName, c.last_name].filter(Boolean).join(" ") || "Unknown";
    
    // Construct the full image URL
    const imageUrl = c.image_path ? `${BASE_URL}${c.image_path}` : undefined;

    return {
      id: String(c.id ?? name + Math.random().toString(36).slice(2, 8)),
      name,
      phone: c.mobile, // Use 'mobile' field from API for phone
      email: c.email,
      profileImage: imageUrl,
      initials: (name !== "Unknown" ? name.slice(0, 2).toUpperCase() : undefined),
    };
  }, []);

  const loadContacts = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      // abort previous
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(API_URL, {
          method: "GET",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status}${text ? `: ${text}` : ""}`);
        }

        const json = await response.json().catch(() => null);

        let list: ApiContact[] = [];
        console.log(json.ContactList);
        if (Array.isArray(json)) {
          list = json;
        } else if (json && Array.isArray((json as any).ContactList)) {
          list = (json as any).ContactList;
        } else if (json && Array.isArray((json as any).data)) {
          list = (json as any).data;
        } else if (json && typeof json === "object" && (json.id || json.firstName)) {
          list = [json as ApiContact];
        } else {
          list = [];
        }

        setContacts(list.map(mapToContact));
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // ignore
        } else {
          console.error("loadContacts error:", err);
          setError(err?.message ?? "Failed to load contacts");
          setContacts([]); // fallback to empty
        }
      } finally {
        if (!silent) setLoading(false);
        setRefreshing(false);
      }
    },
    [mapToContact]
  );

  useEffect(() => {
    loadContacts();
    return () => abortRef.current?.abort();
  }, [loadContacts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContacts(true);
  }, [loadContacts]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const s = search.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(s) ||
        (contact.phone ?? "").includes(search) ||
        (contact.email ?? "").toLowerCase().includes(s)
    );
  }, [contacts, search]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to select images!"
      );
      return false;
    }
    return true;
  }, []);

  const updateContactImage = useCallback((contactId: string, imageUri: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, profileImage: imageUri } : c))
    );
  }, []);

  const pickImage = useCallback(
    async (contactId: string) => {
      const has = await requestPermissions();
      if (!has) return;

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if ((result as any).canceled === true) return;
        if ((result as any).cancelled === true) return;

        const assets = (result as any).assets ?? (result as any).selected ?? null;
        const uri =
          assets && assets.length > 0
            ? assets[0].uri
            : (result as any).uri ?? null;

        if (uri) {
          updateContactImage(contactId, uri);
        }
      } catch (err) {
        console.error("pickImage error:", err);
        Alert.alert("Error", "Failed to pick image. Please try again.");
      }
    },
    [requestPermissions, updateContactImage]
  );

  const handleContactPress = useCallback((contact: Contact) => {
    Alert.alert(
      "Contact selected",
      `${contact.name}\n${contact.phone ?? ""}\n${contact.email ?? ""}`
    );
  }, []);

  const handleAvatarPress = useCallback(
    (contact: Contact) => {
      Alert.alert("Profile Picture", "What would you like to do?", [
        { text: "View Contact", onPress: () => handleContactPress(contact) },
        { text: "Change Picture", onPress: () => pickImage(contact.id) },
        { text: "Cancel", style: "cancel" },
      ]);
    },
    [handleContactPress, pickImage]
  );

  const ProfileAvatar = useCallback(
    ({ contact }: { contact: Contact }) => {
      if (contact.profileImage) {
        return (
          <TouchableOpacity onPress={() => handleAvatarPress(contact)}>
            <Image source={{ uri: contact.profileImage }} style={styles.profileImage} />
          </TouchableOpacity>
        );
      }
      return (
        <TouchableOpacity onPress={() => handleAvatarPress(contact)}>
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>
              {contact.initials ?? contact.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleAvatarPress]
  );

  const renderContact = useCallback(
    ({ item }: { item: Contact }) => (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleContactPress(item)}
        activeOpacity={0.7}
      >
        <ProfileAvatar contact={item} />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          {item.phone && <Text style={styles.contactDetails}>{item.phone}</Text>}
          {item.email && <Text style={styles.contactDetails}>{item.email}</Text>}
        </View>
      </TouchableOpacity>
    ),
    [handleContactPress, ProfileAvatar]
  );

  const renderEmptyState = useCallback(
    () => (
      <View style={styles.emptyState}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <>
            <Text style={styles.emptyStateText}>
              {search ? "No contacts found" : "No contacts available"}
            </Text>
            {!loading && !error && (
              <TouchableOpacity onPress={() => loadContacts()} style={[styles.createContactButton, { marginTop: 12 }]}>
                <Text style={styles.createContactButtonText}>Reload</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    ),
    [search, loading, error, loadContacts]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Contacts</Text>
          <Text style={styles.subtitle}>
            {filteredContacts.length} contact{filteredContacts.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search by name, phone, or email..."
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />

        {/* Create */}
        <TouchableOpacity
          style={styles.createContactButton}
          onPress={() => navigation.navigate("Contact")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.createContactButtonText}>Create New Contact</Text>
        </TouchableOpacity>

        {/* Loading & Error */}
        {loading && !refreshing && (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <ActivityIndicator />
            <Text style={{ marginTop: 8, color: "#666" }}>Loading contacts…</Text>
          </View>
        )}
        {error && (
          <View style={{ paddingVertical: 12, alignItems: "center" }}>
            <Text style={{ color: "crimson", textAlign: "center" }}>{`Error: ${error}`}</Text>
            <TouchableOpacity onPress={() => loadContacts()} style={[styles.createContactButton, { backgroundColor: "#ff3b30", marginTop: 8 }]}>
              <Text style={styles.createContactButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* List */}
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={filteredContacts.length === 0 ? styles.emptyListContainer : undefined}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />

        {/* Navigation */}
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={() => navigation.navigate("SignIn")}
          activeOpacity={0.8}
        >
          <Text style={styles.navigationButtonText}>Go to Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* Styles (kept largely the same as your original) */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e1e5e9",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  createContactButton: {
    backgroundColor: "#34C759",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#34C759",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  createContactButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  contactItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: "#f0f0f0",
  },
  initialsContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  initialsText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  contactDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  navigationButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#007AFF",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  navigationButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});