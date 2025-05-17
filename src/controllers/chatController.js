const supabase = require('../config/supabase');
const { isValidUUID } = require('../utils/helpers');

/**
 * Get or create a conversation between two users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId, currentUserId } = req.body;

    console.log({ otherUserId, currentUserId });

    if (!isValidUUID(otherUserId)) {
      console.error('Invalid user ID format', otherUserId);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    if (currentUserId === otherUserId) {
      console.error('Cannot create conversation with yourself');
      return res
        .status(400)
        .json({ error: 'Cannot create conversation with yourself' });
    }

    // Check if other user exists
    const { data: otherUser, error: userError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', otherUserId)
      .single();

    if (userError || !otherUser) {
      console.error('User not found');
      return res.status(404).json({ error: 'User not found' });
    }

    // Try to find an existing conversation
    const { data: existingConversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .or(`user1_id.eq.${otherUserId},user2_id.eq.${otherUserId}`)
      .single();

    if (existingConversation) {
      return res.status(200).json({
        message: 'Conversation found',
        conversation: existingConversation,
      });
    }

    // Create a new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user1_id: currentUserId,
        user2_id: otherUserId,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Create conversation error:', createError);
      return res.status(400).json({ error: 'Failed to create conversation' });
    }

    return res.status(201).json({
      message: 'Conversation created successfully',
      conversation: newConversation,
    });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all conversations for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    // Get all conversations where the current user is involved
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:user1_id(id, full_name, profile_image),
        user2:user2_id(id, full_name, profile_image)
      `)
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .order('last_message_time', { ascending: false, nullsFirst: false });
    
    if (error) {
      console.error('Get conversations error:', error);
      return res.status(400).json({ error: 'Failed to fetch conversations' });
    }
    
    // Format the response to highlight the other user
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.user1_id === currentUserId ? conv.user2 : conv.user1;
      return {
        id: conv.id,
        otherUser: {
          id: otherUser.id,
          fullName: otherUser.full_name,
          profileImage: otherUser.profile_image
        },
        lastMessage: conv.last_message,
        lastMessageTime: conv.last_message_time,
        createdAt: conv.created_at
      };
    });
    
    return res.status(200).json({
      conversations: formattedConversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Send a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, jobId } = req.body;
    const senderId = req.user.userId;
    
    // Validate input
    if (!conversationId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!isValidUUID(conversationId) || (jobId && !isValidUUID(jobId))) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Check if conversation exists and user is part of it
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`user1_id.eq.${senderId},user2_id.eq.${senderId}`)
      .single();
    
    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found or you are not part of it' });
    }
    
    // Get receiver ID
    const receiverId = conversation.user1_id === senderId ? conversation.user2_id : conversation.user1_id;
    
    // Check if job exists if jobId is provided
    if (jobId) {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();
      
      if (jobError || !job) {
        return res.status(404).json({ error: 'Job not found' });
      }
    }
    
    // Create a new message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        is_read: false,
        job_id: jobId || null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Send message error:', error);
      return res.status(400).json({ error: 'Failed to send message' });
    }
    
    // Update conversation with last message details
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_time: new Date().toISOString()
      })
      .eq('id', conversationId);
    
    if (updateError) {
      console.error('Update conversation error:', updateError);
      // Not a critical error, continue
    }
    
    return res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get messages for a conversation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user.userId;
    
    if (!isValidUUID(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation ID format' });
    }
    
    // Calculate pagination values (for messages, we want the most recent first)
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Check if conversation exists and user is part of it
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
      .single();
    
    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found or you are not part of it' });
    }
    
    // Get messages for the conversation
    const { data: messages, error, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Get messages error:', error);
      return res.status(400).json({ error: 'Failed to fetch messages' });
    }
    
    // Mark messages as read if they were sent to the current user
    const messagesToMarkAsRead = messages
      .filter(msg => msg.receiver_id === currentUserId && !msg.is_read)
      .map(msg => msg.id);
    
    if (messagesToMarkAsRead.length > 0) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .in('id', messagesToMarkAsRead);
      
      if (updateError) {
        console.error('Mark messages as read error:', updateError);
        // Not critical, continue
      }
    }
    
    return res.status(200).json({
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        totalCount: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get unread message count for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    // Count unread messages
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);
    
    if (error) {
      console.error('Get unread count error:', error);
      return res.status(400).json({ error: 'Failed to fetch unread message count' });
    }
    
    return res.status(200).json({
      unreadCount: count
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getOrCreateConversation,
  getConversations,
  sendMessage,
  getMessages,
  getUnreadCount
};
