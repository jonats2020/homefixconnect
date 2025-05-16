import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './src/context/AuthContext';
import { APIProvider } from './src/context/APIContext';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';

// Job Screens
import JobDetailScreen from './src/screens/jobs/JobDetailScreen';
import CreateJobScreen from './src/screens/jobs/CreateJobScreen';

// Bid Screens
import MyBidsScreen from './src/screens/bids/MyBidsScreen';
import EditBidScreen from './src/screens/bids/EditBidScreen';

// Chat Screens
import ChatListScreen from './src/screens/chat/ChatListScreen';
import ChatScreen from './src/screens/chat/ChatScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <APIProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator 
            initialRouteName="Login"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#007BFF',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              }
            }}
          >
            {/* Auth Routes */}
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Register" 
              component={RegisterScreen} 
              options={{ title: 'Create Account' }}
            />
            
            {/* Main Routes */}
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: 'Home Services' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: 'My Profile' }}
            />
            
            {/* Job Routes */}
            <Stack.Screen 
              name="JobDetail" 
              component={JobDetailScreen} 
              options={{ title: 'Job Details' }}
            />
            <Stack.Screen 
              name="CreateJob" 
              component={CreateJobScreen} 
              options={{ title: 'Post a New Job' }}
            />
            
            {/* Bid Routes */}
            <Stack.Screen 
              name="MyBids" 
              component={MyBidsScreen} 
              options={{ title: 'My Bids' }}
            />
            <Stack.Screen 
              name="EditBid" 
              component={EditBidScreen} 
              options={{ title: 'Edit Bid' }}
            />
            
            {/* Chat Routes */}
            <Stack.Screen 
              name="ChatList" 
              component={ChatListScreen} 
              options={{ title: 'Messages' }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen} 
              options={({ route }) => ({ title: route.params.name })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </APIProvider>
    </AuthProvider>
  );
}