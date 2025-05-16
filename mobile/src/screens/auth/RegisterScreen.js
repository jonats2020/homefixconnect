import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/config';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState(USER_ROLES.CUSTOMER);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();

  const validateInputs = () => {
    if (!email || !password || !confirmPassword || !fullName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) return;
    
    setIsLoading(true);
    
    try {
      const result = await register(email, password, fullName, role, phone, address);
      
      if (!result.success) {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = () => {
    setRole(role === USER_ROLES.CUSTOMER ? USER_ROLES.CONTRACTOR : USER_ROLES.CUSTOMER);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Create Account</Text>
        
        <View style={styles.roleToggleContainer}>
          <Text style={styles.roleLabel}>I am a:</Text>
          <View style={styles.roleButtons}>
            <TouchableOpacity 
              style={[
                styles.roleButton, 
                role === USER_ROLES.CUSTOMER && styles.roleButtonActive
              ]}
              onPress={() => setRole(USER_ROLES.CUSTOMER)}
            >
              <Text style={[
                styles.roleButtonText,
                role === USER_ROLES.CUSTOMER && styles.roleButtonTextActive
              ]}>Customer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.roleButton, 
                role === USER_ROLES.CONTRACTOR && styles.roleButtonActive
              ]}
              onPress={() => setRole(USER_ROLES.CONTRACTOR)}
            >
              <Text style={[
                styles.roleButtonText,
                role === USER_ROLES.CONTRACTOR && styles.roleButtonTextActive
              ]}>Contractor</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          value={fullName}
          onChangeText={setFullName}
        />
        
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your address"
          value={address}
          onChangeText={setAddress}
          multiline
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleToggleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  roleButtons: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  roleButtonActive: {
    backgroundColor: '#007BFF',
  },
  roleButtonText: {
    fontSize: 16,
    color: '#333',
  },
  roleButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  loginText: {
    fontSize: 16,
    color: '#007BFF',
    fontWeight: '600',
    marginLeft: 5,
  }
});

export default RegisterScreen;