import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useAPI } from '../../context/APIContext';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, userId, name, jobId } = route.params;
  const { user } = useAuth();
  const { chat } = useAPI();
  
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef(null);
  
  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
    
    // Update the navigation title with the other user's name
    navigation.setOptions({ title: name });
    
    // Set up a polling interval to fetch new messages
    const interval = setInterval(loadMessages, 10000); // Fetch every 10 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [conversationId]);
  
  const loadMessages = async () => {
    try {
      const result = await chat.getMessages(conversationId);
      
      if (result.success) {
        setMessages(result.data.messages);
      } else {
        console.error('Failed to load messages:', result.message);
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!messageText.trim()) return;
    
    setIsSending(true);
    
    try {
      const result = await chat.sendMessage(
        conversationId,
        userId,
        messageText.trim(),
        jobId || null
      );
      
      if (result.success) {
        setMessageText(''); // Clear input
        await loadMessages(); // Reload messages
        
        // Scroll to bottom after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSending(false);
    }
  };
  
  // Format timestamp to readable time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Render message item
  const renderMessageItem = ({ item, index }) => {
    const isCurrentUser = item.sender_id === user.id;
    const showHeader = index === 0 || 
      messages[index - 1].sender_id !== item.sender_id;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.userMessageContainer : styles.otherMessageContainer
      ]}>
        {showHeader && !isCurrentUser && (
          <Text style={styles.senderName}>{name}</Text>
        )}
        
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.userMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.userMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        
        <Text style={[
          styles.messageTime,
          isCurrentUser ? styles.userMessageTime : styles.otherMessageTime
        ]}>
          {formatMessageTime(item.created_at)}
        </Text>
      </View>
    );
  };
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007BFF" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContainer}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                Send a message to start the conversation
              </Text>
            </View>
          }
        />
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (!messageText.trim() || isSending) && styles.sendButtonDisabled
          ]}
          onPress={sendMessage}
          disabled={!messageText.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  messagesContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    marginLeft: 10,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userMessageBubble: {
    backgroundColor: '#007BFF',
  },
  otherMessageBubble: {
    backgroundColor: '#e5e5ea',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
    marginHorizontal: 10,
  },
  userMessageTime: {
    color: '#999',
    alignSelf: 'flex-end',
  },
  otherMessageTime: {
    color: '#999',
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
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
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007BFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#b3d9ff',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ChatScreen;