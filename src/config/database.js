/**
 * This file contains database schema configuration for Supabase
 * Intended to be used for reference and documentation of the database schema
 * 
 * Note: Schema is defined in Supabase directly, this file serves as documentation
 */

/**
 * Database Schema:
 * 
 * Users Table:
 * - id: uuid (primary key, default: uuid_generate_v4())
 * - email: text (unique, not null)
 * - full_name: text
 * - role: text (enum: 'customer', 'contractor')
 * - phone: text
 * - profile_image: text (URL to image)
 * - address: text
 * - created_at: timestamp with time zone (default: now())
 * - updated_at: timestamp with time zone (default: now())
 * 
 * Jobs Table:
 * - id: uuid (primary key, default: uuid_generate_v4())
 * - title: text (not null)
 * - description: text (not null)
 * - customer_id: uuid (foreign key to users.id, not null)
 * - contractor_id: uuid (foreign key to users.id, nullable)
 * - category: text (not null)
 * - location: text
 * - budget: numeric (not null)
 * - status: text (enum: 'open', 'in_progress', 'completed', 'cancelled')
 * - images: text[] (array of image URLs)
 * - created_at: timestamp with time zone (default: now())
 * - updated_at: timestamp with time zone (default: now())
 * 
 * Bids Table:
 * - id: uuid (primary key, default: uuid_generate_v4())
 * - job_id: uuid (foreign key to jobs.id, not null)
 * - contractor_id: uuid (foreign key to users.id, not null)
 * - amount: numeric (not null)
 * - proposal: text
 * - estimated_days: integer
 * - status: text (enum: 'pending', 'accepted', 'rejected')
 * - created_at: timestamp with time zone (default: now())
 * - updated_at: timestamp with time zone (default: now())
 * 
 * Messages Table:
 * - id: uuid (primary key, default: uuid_generate_v4())
 * - conversation_id: uuid (not null)
 * - sender_id: uuid (foreign key to users.id, not null)
 * - receiver_id: uuid (foreign key to users.id, not null)
 * - content: text (not null)
 * - is_read: boolean (default: false)
 * - job_id: uuid (foreign key to jobs.id, nullable)
 * - created_at: timestamp with time zone (default: now())
 * 
 * Conversations Table:
 * - id: uuid (primary key, default: uuid_generate_v4())
 * - user1_id: uuid (foreign key to users.id, not null)
 * - user2_id: uuid (foreign key to users.id, not null)
 * - last_message: text
 * - last_message_time: timestamp with time zone
 * - created_at: timestamp with time zone (default: now())
 * 
 * Ratings Table:
 * - id: uuid (primary key, default: uuid_generate_v4())
 * - job_id: uuid (foreign key to jobs.id, not null)
 * - from_user_id: uuid (foreign key to users.id, not null)
 * - to_user_id: uuid (foreign key to users.id, not null)
 * - rating: integer (1-5, not null)
 * - comment: text
 * - created_at: timestamp with time zone (default: now())
 * 
 * Files Table:
 * - id: uuid (primary key, default: uuid_generate_v4())
 * - job_id: uuid (foreign key to jobs.id, nullable)
 * - user_id: uuid (foreign key to users.id, not null)
 * - file_name: text (not null)
 * - file_url: text (not null)
 * - file_type: text (not null)
 * - created_at: timestamp with time zone (default: now())
 */

/**
 * Row Level Security (RLS) Policies:
 * 
 * Users Table:
 * - Full access for authenticated users to their own records
 * - Limited read access for other users (only specific fields)
 * 
 * Jobs Table:
 * - Customers can create jobs and read/update their own jobs
 * - Contractors can read job listings
 * - Both roles can read individual job details
 * 
 * Bids Table:
 * - Contractors can create bids and read/update their own bids
 * - Customers can read bids for their own jobs
 * 
 * Messages & Conversations Tables:
 * - Users can only access conversations they're part of
 * - Users can only access messages they've sent or received
 * 
 * Ratings Table:
 * - Users can create ratings for completed jobs they were part of
 * - Everyone can read ratings
 * 
 * Files Table:
 * - Users can upload files for their own jobs
 * - Job-related files can be accessed by the job owner and assigned contractor
 */

module.exports = {
  tables: {
    users: {
      name: 'users',
      fields: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'email', type: 'text', notNull: true, unique: true },
        { name: 'full_name', type: 'text' },
        { name: 'role', type: 'text', notNull: true }, 
        { name: 'phone', type: 'text' },
        { name: 'profile_image', type: 'text' },
        { name: 'address', type: 'text' },
        { name: 'created_at', type: 'timestamp with time zone' },
        { name: 'updated_at', type: 'timestamp with time zone' }
      ]
    },
    jobs: {
      name: 'jobs',
      fields: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'title', type: 'text', notNull: true },
        { name: 'description', type: 'text', notNull: true },
        { name: 'customer_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'contractor_id', type: 'uuid', references: 'users.id' },
        { name: 'category', type: 'text', notNull: true },
        { name: 'location', type: 'text' },
        { name: 'budget', type: 'numeric', notNull: true },
        { name: 'status', type: 'text', notNull: true },
        { name: 'images', type: 'text[]' },
        { name: 'created_at', type: 'timestamp with time zone' },
        { name: 'updated_at', type: 'timestamp with time zone' }
      ]
    },
    bids: {
      name: 'bids',
      fields: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'job_id', type: 'uuid', notNull: true, references: 'jobs.id' },
        { name: 'contractor_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'amount', type: 'numeric', notNull: true },
        { name: 'proposal', type: 'text' },
        { name: 'estimated_days', type: 'integer' },
        { name: 'status', type: 'text', notNull: true },
        { name: 'created_at', type: 'timestamp with time zone' },
        { name: 'updated_at', type: 'timestamp with time zone' }
      ]
    },
    conversations: {
      name: 'conversations',
      fields: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'user1_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'user2_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'last_message', type: 'text' },
        { name: 'last_message_time', type: 'timestamp with time zone' },
        { name: 'created_at', type: 'timestamp with time zone' }
      ]
    },
    messages: {
      name: 'messages',
      fields: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'conversation_id', type: 'uuid', notNull: true, references: 'conversations.id' },
        { name: 'sender_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'receiver_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'content', type: 'text', notNull: true },
        { name: 'is_read', type: 'boolean' },
        { name: 'job_id', type: 'uuid', references: 'jobs.id' },
        { name: 'created_at', type: 'timestamp with time zone' }
      ]
    },
    ratings: {
      name: 'ratings',
      fields: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'job_id', type: 'uuid', notNull: true, references: 'jobs.id' },
        { name: 'from_user_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'to_user_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'rating', type: 'integer', notNull: true },
        { name: 'comment', type: 'text' },
        { name: 'created_at', type: 'timestamp with time zone' }
      ]
    },
    files: {
      name: 'files',
      fields: [
        { name: 'id', type: 'uuid', primaryKey: true },
        { name: 'job_id', type: 'uuid', references: 'jobs.id' },
        { name: 'user_id', type: 'uuid', notNull: true, references: 'users.id' },
        { name: 'file_name', type: 'text', notNull: true },
        { name: 'file_url', type: 'text', notNull: true },
        { name: 'file_type', type: 'text', notNull: true },
        { name: 'created_at', type: 'timestamp with time zone' }
      ]
    }
  }
};
