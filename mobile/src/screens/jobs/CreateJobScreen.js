import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAPI } from '../../context/APIContext';
import { JOB_CATEGORIES } from '../../utils/config';

const CreateJobScreen = ({ navigation }) => {
  const { jobs } = useAPI();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(JOB_CATEGORIES[0]);
  const [budget, setBudget] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Validate form fields
  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a job title');
      return false;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a job description');
      return false;
    }
    
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    
    if (!budget || isNaN(parseFloat(budget)) || parseFloat(budget) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const jobData = {
        title: title.trim(),
        description: description.trim(),
        category,
        budget: parseFloat(budget),
        location: location.trim() || null
      };
      
      const result = await jobs.createJob(jobData);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          'Your job has been posted successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.navigate('Home', { refresh: true }) 
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to create job');
      }
    } catch (error) {
      console.error('Create job error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle category picker
  const toggleCategoryPicker = () => {
    setShowCategoryPicker(!showCategoryPicker);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Post a New Job</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Job Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a descriptive title"
            maxLength={100}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity 
            style={styles.categorySelector}
            onPress={toggleCategoryPicker}
          >
            <Text style={styles.categoryText}>{category}</Text>
          </TouchableOpacity>
          
          {showCategoryPicker && (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => {
                  setCategory(itemValue);
                  setShowCategoryPicker(false);
                }}
                style={styles.picker}
              >
                {JOB_CATEGORIES.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the job in detail. Include specific requirements, timeline, and any other relevant information."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Budget ($) *</Text>
          <TextInput
            style={styles.input}
            value={budget}
            onChangeText={setBudget}
            placeholder="Enter your budget"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location (optional)"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Post Job</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categorySelector: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#333',
  },
  pickerContainer: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 5,
  },
  picker: {
    height: 150,
  },
  submitButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CreateJobScreen;