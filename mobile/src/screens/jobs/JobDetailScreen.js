import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAPI } from '../../context/APIContext';
import { USER_ROLES, JOB_STATUS, BID_STATUS } from '../../utils/config';

const JobDetailScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const { user } = useAuth();
  const { jobs, bids, chat } = useAPI();

  const [job, setJob] = useState(null);
  const [jobBids, setJobBids] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBidModalVisible, setBidModalVisible] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidProposal, setBidProposal] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [userBid, setUserBid] = useState(null);

  // Load job data
  useEffect(() => {
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    setIsLoading(true);
    try {
      // Load job details
      const jobResult = await jobs.getJobById(jobId);

      if (jobResult.success) {
        setJob(jobResult.data.job);

        // Load bids for this job
        const bidsResult = await bids.getBidsForJob(jobId);

        if (bidsResult.success) {
          setJobBids(bidsResult.data.bids);

          // Check if current user has already placed a bid
          if (user.role === USER_ROLES.CONTRACTOR) {
            const userPlacedBid = bidsResult.data.bids.find(
              (bid) => bid.contractor_id === user.id
            );
            setUserBid(userPlacedBid);
          }
        }
      } else {
        Alert.alert('Error', jobResult.message || 'Failed to load job details');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Load job data error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  // Place a bid
  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }

    setIsSubmittingBid(true);
    try {
      const bidData = {
        jobId,
        amount: parseFloat(bidAmount),
        proposal: bidProposal,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : undefined,
      };

      const result = await bids.createBid(bidData);

      if (result.success) {
        Alert.alert('Success', 'Your bid has been placed successfully');
        setBidModalVisible(false);
        loadJobData(); // Reload job data
      } else {
        Alert.alert('Error', result.message || 'Failed to place bid');
      }
    } catch (error) {
      console.error('Place bid error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // Accept a bid (for job owners)
  const handleAcceptBid = async (bidId) => {
    Alert.alert(
      'Accept Bid',
      'Are you sure you want to accept this bid? This will assign the contractor to your job.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setIsLoading(true);
              const result = await jobs.assignContractor(jobId, bidId);

              if (result.success) {
                Alert.alert(
                  'Success',
                  'Contractor has been assigned to the job'
                );
                loadJobData(); // Reload job data
              } else {
                Alert.alert('Error', result.message || 'Failed to accept bid');
              }
            } catch (error) {
              console.error('Accept bid error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Start a conversation with user
  const startConversation = async (
    currentUserId,
    otherUserId,
    userName,
    jobId
  ) => {
    try {
      setIsLoading(true);
      const result = await chat.getOrCreateConversation(
        currentUserId,
        otherUserId
      );

      if (result.success) {
        navigation.navigate('Chat', {
          conversationId: result.data.conversation.id,
          name: userName,
          jobId, // Pass jobId for context
        });
      } else {
        Alert.alert('Error', result.message || 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Start conversation error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Render bid modal
  const renderBidModal = () => (
    <Modal
      visible={isBidModalVisible}
      transparent
      animationType='slide'
      onRequestClose={() => setBidModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Place a Bid</Text>

          <Text style={styles.modalLabel}>Bid Amount ($)</Text>
          <TextInput
            style={styles.modalInput}
            value={bidAmount}
            onChangeText={setBidAmount}
            placeholder='Enter your bid amount'
            keyboardType='numeric'
          />

          <Text style={styles.modalLabel}>Estimated Days</Text>
          <TextInput
            style={styles.modalInput}
            value={estimatedDays}
            onChangeText={setEstimatedDays}
            placeholder='Enter estimated days to complete'
            keyboardType='numeric'
          />

          <Text style={styles.modalLabel}>Proposal</Text>
          <TextInput
            style={[styles.modalInput, styles.proposalInput]}
            value={bidProposal}
            onChangeText={setBidProposal}
            placeholder='Describe your proposal and approach'
            multiline
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setBidModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={handlePlaceBid}
              disabled={isSubmittingBid}
            >
              {isSubmittingBid ? (
                <ActivityIndicator size='small' color='#fff' />
              ) : (
                <Text style={styles.submitButtonText}>Submit Bid</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render job status with appropriate styling
  const renderJobStatus = () => {
    const statusStyles = {
      [JOB_STATUS.OPEN]: styles.statusOpen,
      [JOB_STATUS.IN_PROGRESS]: styles.statusInProgress,
      [JOB_STATUS.COMPLETED]: styles.statusCompleted,
      [JOB_STATUS.CANCELLED]: styles.statusCancelled,
    };

    return (
      <Text style={[styles.statusBadge, statusStyles[job.status]]}>
        {job.status.toUpperCase()}
      </Text>
    );
  };

  // Render action buttons based on user role and job status
  const renderActionButtons = () => {
    // If user is the job owner (customer)
    if (user.id === job.customer_id) {
      if (job.status === JOB_STATUS.OPEN) {
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => {
                // Implement cancel job logic
                Alert.alert(
                  'Coming Soon',
                  'This feature is not yet implemented'
                );
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel Job</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                // Implement edit job logic
                Alert.alert(
                  'Coming Soon',
                  'This feature is not yet implemented'
                );
              }}
            >
              <Text style={styles.primaryButtonText}>Edit Job</Text>
            </TouchableOpacity>
          </View>
        );
      } else if (job.status === JOB_STATUS.IN_PROGRESS) {
        return (
          <TouchableOpacity
            style={[styles.fullWidthButton, styles.primaryButton]}
            onPress={() => {
              // Implement mark as complete logic
              Alert.alert('Coming Soon', 'This feature is not yet implemented');
            }}
          >
            <Text style={styles.primaryButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        );
      } else if (job.status === JOB_STATUS.COMPLETED) {
        // Check if user has already rated
        return (
          <TouchableOpacity
            style={[styles.fullWidthButton, styles.primaryButton]}
            onPress={() => {
              // Implement leave rating logic
              Alert.alert(
                'Coming Soon',
                'Rating feature is not yet implemented'
              );
            }}
          >
            <Text style={styles.primaryButtonText}>Leave Rating</Text>
          </TouchableOpacity>
        );
      }
    }
    // If user is a contractor
    else if (user.role === USER_ROLES.CONTRACTOR) {
      // If job is open and user hasn't placed a bid yet
      if (job.status === JOB_STATUS.OPEN && !userBid) {
        return (
          <TouchableOpacity
            style={[styles.fullWidthButton, styles.primaryButton]}
            onPress={() => setBidModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>Place Bid</Text>
          </TouchableOpacity>
        );
      }
      // If user has already placed a bid
      else if (job.status === JOB_STATUS.OPEN && userBid) {
        return (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                // Implement update bid logic
                Alert.alert(
                  'Coming Soon',
                  'Update bid feature is not yet implemented'
                );
              }}
            >
              <Text style={styles.secondaryButtonText}>Update Bid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => {
                // Implement withdraw bid logic
                Alert.alert(
                  'Coming Soon',
                  'Withdraw bid feature is not yet implemented'
                );
              }}
            >
              <Text style={styles.dangerButtonText}>Withdraw Bid</Text>
            </TouchableOpacity>
          </View>
        );
      }
      // If contractor is assigned to this job
      else if (job.contractor_id === user.id) {
        if (job.status === JOB_STATUS.IN_PROGRESS) {
          return (
            <TouchableOpacity
              style={[styles.fullWidthButton, styles.primaryButton]}
              onPress={() => {
                // Request completion approval
                Alert.alert(
                  'Coming Soon',
                  'This feature is not yet implemented'
                );
              }}
            >
              <Text style={styles.primaryButtonText}>Request Completion</Text>
            </TouchableOpacity>
          );
        }
      }
    }

    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#007BFF' />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Job Details Section */}
      <View style={styles.jobHeaderSection}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          {renderJobStatus()}
        </View>

        <View style={styles.jobMetaContainer}>
          <View style={styles.jobMeta}>
            <Text style={styles.metaLabel}>Budget:</Text>
            <Text style={styles.metaValue}>${job.budget}</Text>
          </View>

          <View style={styles.jobMeta}>
            <Text style={styles.metaLabel}>Category:</Text>
            <Text style={styles.metaValue}>{job.category}</Text>
          </View>

          {job.location && (
            <View style={styles.jobMeta}>
              <Text style={styles.metaLabel}>Location:</Text>
              <Text style={styles.metaValue}>{job.location}</Text>
            </View>
          )}

          <View style={styles.jobMeta}>
            <Text style={styles.metaLabel}>Posted:</Text>
            <Text style={styles.metaValue}>
              {new Date(job.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Job Description Section */}
      <View style={styles.descriptionSection}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.descriptionText}>{job.description}</Text>
      </View>

      {/* Customer/Contractor Information Section */}
      <View style={styles.userSection}>
        <Text style={styles.sectionTitle}>
          {job.customer_id === user.id ? 'Your Job' : 'Posted by'}
        </Text>

        <View style={styles.userCard}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{job.customer.full_name}</Text>
            {job.customer_id !== user.id && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() =>
                  startConversation(
                    user.id,
                    job.customer_id,
                    user.fullName,
                    job.id
                  )
                }
              >
                <Text style={styles.contactButtonText}>Contact</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {job.contractor && (
          <>
            <Text style={styles.sectionTitle}>Assigned Contractor</Text>
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{job.contractor.full_name}</Text>
                {job.contractor_id !== user.id && (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() =>
                      startConversation(
                        user.id,
                        job.contractor_id,
                        user.fullName,
                        job.id
                      )
                    }
                  >
                    <Text style={styles.contactButtonText}>Contact</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Bids Section - Only visible for job owner or if user has placed a bid */}
      {(job.customer_id === user.id || userBid) && jobBids.length > 0 && (
        <View style={styles.bidsSection}>
          <Text style={styles.sectionTitle}>Bids ({jobBids.length})</Text>

          {jobBids.map((bid) => (
            <View key={bid.id} style={styles.bidCard}>
              <View style={styles.bidHeader}>
                <Text style={styles.bidderName}>
                  {bid.contractor.full_name}
                </Text>
                <Text style={styles.bidAmount}>${bid.amount}</Text>
              </View>

              {bid.status !== BID_STATUS.PENDING && (
                <View style={styles.bidStatusContainer}>
                  <Text
                    style={[
                      styles.bidStatus,
                      bid.status === BID_STATUS.ACCEPTED
                        ? styles.acceptedBid
                        : styles.rejectedBid,
                    ]}
                  >
                    {bid.status.toUpperCase()}
                  </Text>
                </View>
              )}

              {bid.proposal &&
                (job.customer_id === user.id ||
                  bid.contractor_id === user.id) && (
                  <Text style={styles.bidProposal}>{bid.proposal}</Text>
                )}

              {bid.estimated_days && (
                <Text style={styles.bidEstimate}>
                  Estimated time: {bid.estimated_days} day
                  {bid.estimated_days !== 1 ? 's' : ''}
                </Text>
              )}

              <View style={styles.bidActions}>
                {job.customer_id === user.id &&
                  job.status === JOB_STATUS.OPEN && (
                    <TouchableOpacity
                      style={styles.acceptBidButton}
                      onPress={() => handleAcceptBid(bid.id)}
                    >
                      <Text style={styles.acceptBidButtonText}>Accept Bid</Text>
                    </TouchableOpacity>
                  )}

                {job.customer_id === user.id &&
                  bid.contractor_id !== user.id && (
                    <TouchableOpacity
                      style={styles.contactBidderButton}
                      onPress={() =>
                        startConversation(
                          user.id,
                          bid.contractor_id,
                          user.fullName,
                          job.id
                        )
                      }
                    >
                      <Text style={styles.contactBidderText}>Contact</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>{renderActionButtons()}</View>

      {/* Bid Modal */}
      {renderBidModal()}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  jobHeaderSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  jobTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: 'hidden',
    textAlign: 'center',
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
  jobMetaContainer: {
    marginTop: 10,
  },
  jobMeta: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    width: 80,
  },
  metaValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  descriptionSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  userSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  contactButton: {
    backgroundColor: '#007BFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bidsSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bidCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  bidderName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  bidAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  bidStatusContainer: {
    marginBottom: 10,
  },
  bidStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  acceptedBid: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  rejectedBid: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
  bidProposal: {
    fontSize: 14,
    color: '#666',
    marginVertical: 10,
  },
  bidEstimate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  bidActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  acceptBidButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  acceptBidButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  contactBidderButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 10,
  },
  contactBidderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  actionSection: {
    padding: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  fullWidthButton: {
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007BFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  proposalInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: '#007BFF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JobDetailScreen;