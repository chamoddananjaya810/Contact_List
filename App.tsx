import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import { SplashScreen } from './Splash';
import { HomeScreen } from './src/Home';
import { ContactScreen } from './src/Contact';
import { SignInScreen } from './SignIn';


export type RootParamList = {
  Splash: undefined;
  Home: undefined;
  Contact: undefined;
  SignIn: undefined;
  Profile: { userId: number; name: string };
};

const Stack = createNativeStackNavigator<RootParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        {/* 🚀 Splash Screen */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />

        {/* 🏠 Home Screen */}
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerTitle: "Home",
            headerLeft: () => (
              <Ionicons
                name="home-outline"
                size={24}
                color="black"
                style={{ marginLeft: 10 }}
              />
            ),
            headerRight: () => (
              <TouchableOpacity onPress={() => alert("Profile pressed!")}>
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color="black"
                  style={{ marginRight: 10 }}
                />
              </TouchableOpacity>
            ),
          }}
        />

        {/* 📞 Contact Screen */}
        <Stack.Screen
          name="Contact"
          component={ContactScreen}
          options={{
            headerTitle: "Contact",
            headerRight: () => (
              <Ionicons
                name="call-outline"
                size={24}
                color="black"
                style={{ marginRight: 10 }}
              />
            ),
          }}
        />

        {/* 🔑 Sign In */}
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{
            headerTitle: "Sign In",
          }}
        />

     
      </Stack.Navigator>
    </NavigationContainer>
  );
}
