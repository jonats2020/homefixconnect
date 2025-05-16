import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAPI } from '../../context/APIContext';
import { BID_STATUS } from '../../utils/config';

const MyBidsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { bids } = useAPI();
  
  const [myBids, setMyBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load bids on initial render
  useEffect(() => {
    loadBids();
    
    // Set up listener for when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadBids();
    });
    
    // Clean up listener on unmount
    return unsubscribe;
  }, [navigation]);
  
  // Load user's bids
  const loadBids = async () => {
    setIsLoading(true);
    try {
      const result = await bids.getMyBids();
      
      if (result.success) {
        setMyBids(result.data.bids);
      } else {
        Alert.alert('Error', result.message || 'Failed to load your bids');
      }
    } catch (error) {
      console.error('Load bids error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadBids();
  };
  
  // Navigate to bid detail (job detail)
  const viewBidDetail = (jobId) => {
    navigation.navigate('JobDetail', { jobId });
  };
  
  // Get status badge style
  const getStatusStyle = (status) => {
    switch (status) {
      case BID_STATUS.PENDING:
        return styles.statusPending;
      case BID_STATUS.ACCEPTED:
        return styles.statusAccepted;
      case BID_STATUS.REJECTED:
        return styles.statusRejected;
      default:
        return {};
    }
  };
  
  // Render bid item
  const renderBidItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bidCard} 
      onPress={() => viewBidDetail(item.job_id)}
    >
      <View style={styles.bidHeader}>
        <Text style={styles.jobTitle}>{item.job.title}</Text>
        <Text style={styles.bidAmount}>${item.amount}</Text>
      </View>
      
      <View style={styles.bidDetails}>
        <Text style={styles.bidDetail}>
          <Text style={styles.bidLabel}>Customer: </Text>
          {item.job.customer.full_name}
        </Text>
        
        {item.estimated_days && (
          <Text style={styles.bidDetail}>
            <Text style={styles.bidLabel}>Estimated days: </Text>
            {item.estimated_days}
          </Text>
        )}
        
        <Text style={styles.bidDetail}>
          <Text style={styles.bidLabel}>Bid date: </Text>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      
      {item.proposal && (
        <View style={styles.proposalContainer}>
          <Text style={styles.proposalLabel}>Your Proposal:</Text>
          <Text style={styles.proposalText}>{item.proposal}</Text>
        </View>
      )}
      
      <View style={styles.bidFooter}>
        <Text style={[
          styles.bidStatus,
          getStatusStyle(item.status)
        ]}>
          {item.status.toUpperCase()}
        </Text>
        
        {item.status === BID_STATUS.PENDING && (
          <View style={styles.bidActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => navigation.navigate('EditBid', { bidId: item.id })}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => {
                Alert.alert(
                  'Withdraw Bid',
                  'Are you sure you want to withdraw this bid?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Withdraw', 
                      onPress: async () => {
                        try {
                          const result = await bids.deleteBid(item.id);
                          
                          if (result.success) {
                            loadBids(); // Reload bids after deletion
                          } else {
                            Alert.alert('Error', result.message || 'Failed to withdraw bid');
                          }
                        } catch (error) {
                          console.error('Delete bid error:', error);
                          Alert.alert('Error', 'An unexpected error occurred');
                        }
                      },
                      style: 'destructive'
                    }
                  ]
                );
              }}
            >
              <Text style={styles.deleteButtonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading your bids...</Text>
        </View>
      ) : (
        <FlatList
          data={myBids}
          renderItem={renderBidItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't placed any bids yet</Text>
              <Text style={styles.emptySubtext}>
                Browse jobs and place bids to win contracts
              </Text>
              
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.browseButtonText}>Browse Jobs</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
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
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  bidCard: {
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
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  bidDetails: {
    marginBottom: 10,
  },
  bidDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bidLabel: {
    fontWeight: '500',
    color: '#333',
  },
  proposalContainer: {
    marginBottom: 10,
  },
  proposalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  proposalText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  bidFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  bidStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  statusAccepted: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  statusRejected: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  bidActions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MyBidsScreen;