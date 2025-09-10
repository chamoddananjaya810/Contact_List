import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Animated, 
  StatusBar,
  Platform
} from "react-native";
import { useEffect, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from 'expo-linear-gradient';
import { RootParamList } from "./App";

type SplashNavigation = NativeStackNavigationProp<RootParamList, "Splash">;

export function SplashScreen() {
  const navigation = useNavigation<SplashNavigation>();
  
  // Simple animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Simple entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace("SignIn");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, scaleAnim]);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Simple Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>👥</Text>
          </View>

          {/* App Name */}
          <Text style={styles.appName}>Contactt</Text>
       

          {/* Simple Loading */}
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </Animated.View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  logoIcon: {
    fontSize: 50,
    textAlign: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 50,
  },
  loadingContainer: {
    alignItems: 'center',
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    letterSpacing: 0.5,
  },
});