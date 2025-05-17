import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Image,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useAPI } from '../context/APIContext';
import { USER_ROLES, JOB_CATEGORIES, JOB_STATUS } from '../utils/config';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { jobs } = useAPI();
  
  const [jobList, setJobList] = useState([]);
  const [myJobList, setMyJobList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(user?.role === USER_ROLES.CONTRACTOR ? 'available' : 'myJobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load jobs on initial render and when dependencies change
  useEffect(() => {
    loadJobs();
  }, [user, activeTab, selectedCategory]);

  // Function to load jobs based on active tab
  const loadJobs = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'available') {
        // For contractors, load available jobs (status: open)
        const filters = {
          status: JOB_STATUS.OPEN
        };
        
        // Apply category filter if selected
        if (selectedCategory) {
          filters.category = selectedCategory;
        }
        
        const result = await jobs.getJobs(filters);
        
        if (result.success) {
          setJobList(result.data.jobs);
        } else {
          Alert.alert('Error', result.message || 'Failed to load jobs');
        }
      } else if (activeTab === 'myJobs') {
        // Load user's own jobs
        const result = await jobs.getMyJobs();
        
        if (result.success) {
          setMyJobList(result.data.jobs);
        } else {
          Alert.alert('Error', result.message || 'Failed to load your jobs');
        }
      }
    } catch (error) {
      console.error('Load jobs error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  // Navigate to job details
  const viewJobDetails = (jobId) => {
    navigation.navigate('JobDetail', { jobId });
  };

  // Navigate to create job screen
  const createNewJob = () => {
    navigation.navigate('CreateJob');
  };

  // Navigate to profile screen
  const goToProfile = () => {
    navigation.navigate('Profile');
  };

  // Navigate to chat list
  const goToChats = () => {
    navigation.navigate('ChatList');
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
              // Navigate to Login screen
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

  // Filter jobs based on search query
  const getFilteredJobs = () => {
    const jobsToFilter = activeTab === 'available' ? jobList : myJobList;
    
    if (!searchQuery) return jobsToFilter;
    
    return jobsToFilter.filter(job => 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Render job item
  const renderJobItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.jobCard} 
      onPress={() => viewJobDetails(item.id)}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobBudget}>${item.budget}</Text>
      </View>
      
      <View style={styles.jobMeta}>
        <Text style={styles.jobCategory}>{item.category}</Text>
        <Text style={[styles.jobStatus, getStatusStyle(item.status)]}>
          {item.status.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.jobDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.jobFooter}>
        {item.location && (
          <Text style={styles.jobLocation}>{item.location}</Text>
        )}
        <Text style={styles.jobDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Get style for status label
  const getStatusStyle = (status) => {
    switch (status) {
      case JOB_STATUS.OPEN:
        return styles.statusOpen;
      case JOB_STATUS.IN_PROGRESS:
        return styles.statusInProgress;
      case JOB_STATUS.COMPLETED:
        return styles.statusCompleted;
      case JOB_STATUS.CANCELLED:
        return styles.statusCancelled;
      default:
        return {};
    }
  };

  // Render header component with search and filters
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {activeTab === 'available' && (
        <View style={styles.categoryFilters}>
          <ScrollableCategories
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </View>
      )}
    </View>
  );

  // Scrollable categories component
  const ScrollableCategories = ({ selectedCategory, onSelectCategory }) => (
    <FlatList
      horizontal
      data={['All', ...JOB_CATEGORIES]}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.categoryItem,
            selectedCategory === item && styles.selectedCategory,
            item === 'All' && !selectedCategory && styles.selectedCategory
          ]}
          onPress={() => {
            if (item === 'All') {
              onSelectCategory(null);
            } else {
              onSelectCategory(item === selectedCategory ? null : item);
            }
          }}
        >
          <Text 
            style={[
              styles.categoryText,
              (selectedCategory === item || (item === 'All' && !selectedCategory)) && 
              styles.selectedCategoryText
            ]}
          >
            {item}
          </Text>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {user?.role === USER_ROLES.CONTRACTOR && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'available' && styles.activeTab]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={styles.tabText}>Available Jobs</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'myJobs' && styles.activeTab]}
          onPress={() => setActiveTab('myJobs')}
        >
          <Text style={styles.tabText}>
            {user?.role === USER_ROLES.CUSTOMER ? 'My Jobs' : 'My Assignments'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredJobs()}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {activeTab === 'available' 
                  ? 'No available jobs found'
                  : 'You have no jobs yet'}
              </Text>
              {activeTab === 'myJobs' && user?.role === USER_ROLES.CUSTOMER && (
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={createNewJob}
                >
                  <Text style={styles.emptyButtonText}>Create a Job</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {user?.role === USER_ROLES.CUSTOMER && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={createNewJob}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={goToChats}>
          <Text style={styles.navText}>Messages</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={goToProfile}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <Text style={styles.navText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007BFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  headerContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBar: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  categoryFilters: {
    marginTop: 10,
  },
  categoryItem: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#007BFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 80, // Add padding for bottom nav
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  jobBudget: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobCategory: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  jobStatus: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusInProgress: {
    backgroundColor: '#cce5ff',
    color: '#004085',
  },
  statusCompleted: {
    backgroundColor: '#d1ecf1',
    color: '#0c5460',
  },
  statusCancelled: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  jobDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  jobLocation: {
    fontSize: 14,
    color: '#666',
  },
  jobDate: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  emptyButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 80, // Position above bottom nav
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  floatingButtonText: {
    fontSize: 30,
    color: '#fff',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 14,
    color: '#333',
  },
});

export default HomeScreen;