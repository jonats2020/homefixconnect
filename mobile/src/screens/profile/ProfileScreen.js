import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAPI } from '../../context/APIContext';
import { USER_ROLES } from '../../utils/config';

const ProfileScreen = ({ navigation }) => {
  const { user, updateUserProfile, logout } = useAuth();
  const { users, ratings } = useAPI();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRatings, setUserRatings] = useState([]);
  
  // Editable profile fields
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  
  // Stats for contractors
  const [stats, setStats] = useState({
    completedJobs: 0,
    ongoingJobs: 0,
    averageRating: 0,
    totalReviews: 0
  });
  
  // Load profile data
  useEffect(() => {
    loadProfileData();
  }, [user?.id]);
  
  const loadProfileData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get user ratings
      const ratingResult = await ratings.getUserRatings(user.id);
      
      if (ratingResult.success) {
        setUserRatings(ratingResult.data.ratings);
        
        // Calculate average rating
        if (ratingResult.data.ratings.length > 0) {
          const totalRating = ratingResult.data.ratings.reduce((sum, rating) => sum + rating.rating, 0);
          const averageRating = totalRating / ratingResult.data.ratings.length;
          
          setStats(prev => ({
            ...prev,
            averageRating: parseFloat(averageRating.toFixed(1)),
            totalReviews: ratingResult.data.ratings.length
          }));
        }
      }
      
      // If this is a contractor, load additional stats
      if (user.role === USER_ROLES.CONTRACTOR) {
        // In a real app, we would fetch job stats here
        // For now, we'll use placeholder values
        setStats(prev => ({
          ...prev,
          completedJobs: 5,
          ongoingJobs: 2
        }));
      }
    } catch (error) {
      console.error('Load profile data error:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save profile changes
  const saveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }
    
    setIsSaving(true);
    try {
      const profileData = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim()
      };
      
      const result = await users.updateProfile(profileData);
      
      if (result.success) {
        // Update local user state
        await updateUserProfile(profileData);
        
        Alert.alert('Success', 'Profile updated successfully');
        setIsEditing(false);
      } else {
        Alert.alert('Error', result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              // Navigate back to Login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } else {
              Alert.alert('Error', result.message || 'Failed to logout');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  // Calculate star display from rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Text key={i} style={styles.star}>★</Text>); // Full star
      } else if (i === fullStars + 1 && halfStar) {
        stars.push(<Text key={i} style={styles.star}>✭</Text>); // Half star
      } else {
        stars.push(<Text key={i} style={styles.emptyStar}>☆</Text>); // Empty star
      }
    }
    
    return <View style={styles.starsContainer}>{stars}</View>;
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitials}>
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          {isEditing ? (
            <TextInput
              style={styles.nameInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your name"
            />
          ) : (
            <Text style={styles.name}>{user?.full_name}</Text>
          )}
          
          <Text style={styles.role}>
            {user?.role === USER_ROLES.CUSTOMER ? 'Customer' : 'Contractor'}
          </Text>
          
          <Text style={styles.email}>{user?.email}</Text>
        </View>
      </View>
      
      {/* Contractor Stats Section */}
      {user?.role === USER_ROLES.CONTRACTOR && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Contractor Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.completedJobs}</Text>
              <Text style={styles.statLabel}>Completed Jobs</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.ongoingJobs}</Text>
              <Text style={styles.statLabel}>Ongoing Jobs</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.averageRating}</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalReviews}</Text>
              <Text style={styles.statLabel}>Total Reviews</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Profile Details Section */}
      <View style={styles.detailsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Details</Text>
          
          {!isEditing && (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Phone Number</Text>
          {isEditing ? (
            <TextInput
              style={styles.detailInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.detailValue}>
              {user?.phone || 'Not provided'}
            </Text>
          )}
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Address</Text>
          {isEditing ? (
            <TextInput
              style={[styles.detailInput, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              placeholder="Your address"
              multiline
            />
          ) : (
            <Text style={styles.detailValue}>
              {user?.address || 'Not provided'}
            </Text>
          )}
        </View>
        
        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setIsEditing(false);
                setFullName(user?.full_name || '');
                setPhone(user?.phone || '');
                setAddress(user?.address || '');
              }}
              disabled={isSaving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Ratings Section */}
      <View style={styles.ratingsSection}>
        <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
        
        {userRatings.length > 0 ? (
          userRatings.map(rating => (
            <View key={rating.id} style={styles.ratingItem}>
              <View style={styles.ratingHeader}>
                <Text style={styles.ratingName}>{rating.from_user.full_name}</Text>
                {renderStars(rating.rating)}
              </View>
              
              {rating.comment && (
                <Text style={styles.ratingComment}>"{rating.comment}"</Text>
              )}
              
              <Text style={styles.ratingDate}>
                {new Date(rating.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noRatings}>No ratings yet</Text>
        )}
      </View>
      
      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  nameInput: {
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  statsSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  statItem: {
    width: '50%',
    padding: 5,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007BFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  detailItem: {
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 16,
    color: '#666',
  },
  detailInput: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007BFF',
    borderRadius: 4,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  ratingsSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ratingItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 15,
  },
  ratingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    color: '#FFD700',
    fontSize: 18,
  },
  emptyStar: {
    color: '#ddd',
    fontSize: 18,
  },
  ratingComment: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 5,
  },
  ratingDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  noRatings: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;