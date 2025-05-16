import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAPI } from '../../context/APIContext';

const EditBidScreen = ({ route, navigation }) => {
  const { bidId } = route.params;
  const { bids } = useAPI();
  
  const [bidData, setBidData] = useState(null);
  const [amount, setAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load bid data
  useEffect(() => {
    const loadBid = async () => {
      try {
        // In a real app, we would have an API endpoint to get a specific bid
        // For now, we'll get all bids and find the one we need
        const result = await bids.getMyBids();
        
        if (result.success) {
          const bid = result.data.bids.find(b => b.id === bidId);
          
          if (bid) {
            setBidData(bid);
            setAmount(bid.amount.toString());
            setProposal(bid.proposal || '');
            setEstimatedDays(bid.estimated_days ? bid.estimated_days.toString() : '');
          } else {
            Alert.alert('Error', 'Bid not found');
            navigation.goBack();
          }
        } else {
          Alert.alert('Error', result.message || 'Failed to load bid details');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Load bid error:', error);
        Alert.alert('Error', 'An unexpected error occurred');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBid();
  }, [bidId]);
  
  // Validate form
  const validateForm = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return false;
    }
    
    if (estimatedDays && (isNaN(parseInt(estimatedDays)) || parseInt(estimatedDays) <= 0)) {
      Alert.alert('Error', 'Please enter a valid number of days');
      return false;
    }
    
    return true;
  };
  
  // Submit updated bid
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const updatedBid = {
        amount: parseFloat(amount),
        proposal: proposal.trim(),
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : undefined
      };
      
      const result = await bids.updateBid(bidId, updatedBid);
      
      if (result.success) {
        Alert.alert(
          'Success', 
          'Your bid has been updated successfully',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to update bid');
      }
    } catch (error) {
      console.error('Update bid error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading bid details...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Bid</Text>
        <Text style={styles.jobTitle}>{bidData?.job?.title}</Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Bid Amount ($) *</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter your bid amount"
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>Estimated Days to Complete</Text>
        <TextInput
          style={styles.input}
          value={estimatedDays}
          onChangeText={setEstimatedDays}
          placeholder="Enter estimated days to complete"
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>Proposal</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={proposal}
          onChangeText={setProposal}
          placeholder="Describe your proposal and approach"
          multiline
          textAlignVertical="top"
        />
        
        <TouchableOpacity 
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Bid</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 18,
    color: '#666',
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
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
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EditBidScreen;