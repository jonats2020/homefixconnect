import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import JobDetailScreen from './src/screens/jobs/JobDetailScreen';
import CreateJobScreen from './src/screens/jobs/CreateJobScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import BidListScreen from './src/screens/bids/BidListScreen';
import ChatListScreen from './src/screens/chat/ChatListScreen';
import ChatScreen from './src/screens/chat/ChatScreen';

// Import contexts
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { APIProvider } from './src/context/APIContext';

const Stack = createStackNavigator();

// Main navigation component with authentication logic
const Navigation = () => {
  const { user, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        {!user ? (
          // Auth screens
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ title: "Create Account" }}
            />
          </>
        ) : (
          // App screens
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: "Home Services" }}
            />
            <Stack.Screen 
              name="JobDetail" 
              component={JobDetailScreen} 
              options={{ title: "Job Details" }}
            />
            <Stack.Screen 
              name="CreateJob" 
              component={CreateJobScreen} 
              options={{ title: "Post a Job" }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: "Profile" }}
            />
            <Stack.Screen 
              name="BidList" 
              component={BidListScreen} 
              options={{ title: "Bids" }}
            />
            <Stack.Screen 
              name="ChatList" 
              component={ChatListScreen} 
              options={{ title: "Messages" }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={({ route }) => ({ title: route.params?.name || "Chat" })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Main App component with providers
export default function App() {
  return (
    <AuthProvider>
      <APIProvider>
        <Navigation />
        <StatusBar style="auto" />
      </APIProvider>
    </AuthProvider>
  );
}