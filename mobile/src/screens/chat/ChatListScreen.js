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

const ChatListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { chat } = useAPI();
  
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load conversations
  useEffect(() => {
    loadConversations();
    
    // Set up listener for when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadConversations();
    });
    
    // Clean up listener on unmount
    return unsubscribe;
  }, [navigation]);
  
  const loadConversations = async () => {
    setIsLoading(true);
    try {
      const result = await chat.getConversations();
      
      if (result.success) {
        setConversations(result.data.conversations);
      } else {
        Alert.alert('Error', result.message || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('Load conversations error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };
  
  // Navigate to chat detail
  const openChat = (conversation) => {
    // Determine the other user's details
    const otherUser = conversation.user1_id === user.id 
      ? { id: conversation.user2_id, name: conversation.user2.full_name }
      : { id: conversation.user1_id, name: conversation.user1.full_name };
    
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      userId: otherUser.id,
      name: otherUser.name
    });
  };
  
  // Format timestamp into relative time
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 7) {
      return date.toLocaleDateString();
    } else if (diffDay > 0) {
      return `${diffDay}d ago`;
    } else if (diffHour > 0) {
      return `${diffHour}h ago`;
    } else if (diffMin > 0) {
      return `${diffMin}m ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Render conversation item
  const renderConversationItem = ({ item }) => {
    // Determine if the conversation is with user1 or user2
    const otherUser = item.user1_id === user.id 
      ? item.user2
      : item.user1;
    
    return (
      <TouchableOpacity 
        style={styles.conversationItem} 
        onPress={() => openChat(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {otherUser.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{otherUser.full_name}</Text>
            <Text style={styles.timeAgo}>
              {formatTimeAgo(item.last_message_time)}
            </Text>
          </View>
          
          <Text 
            style={styles.lastMessage}
            numberOfLines={1}
          >
            {item.last_message || 'No messages yet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>
                Start a conversation by contacting a job owner or contractor
              </Text>
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
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timeAgo: {
    fontSize: 14,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
  }
});

export default ChatListScreen;