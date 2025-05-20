# 🏠 Home Services Marketplace

A sophisticated mobile marketplace platform built on Replit that connects homeowners with skilled contractors for various home services including plumbing, electrical work, gardening, carpentry, and more.

![Group 1](https://github.com/user-attachments/assets/5e1c2235-d1b8-4920-9c61-39f87e2ca458)

- **Multi-language Support**: Seamlessly combines Node.js for the backend API with React Native for the mobile frontend
- **Integrated Development Experience**: All code, from backend to frontend, lives in a single Replit environment
- **Database Integration**: Direct connection to Supabase (PostgreSQL) without leaving the Replit environment

## 🚀 Key Features

### For Customers
- **Post Jobs**: Create detailed service requests with descriptions, photos, location, and budget
- **Review Bids**: Browse contractor proposals and select the best offer
- **Real-time Chat**: Communicate directly with contractors
- **Contractor Verification**: View contractor profiles with ratings and reviews
- **Job Management**: Track ongoing and completed projects

### For Contractors
- **Job Discovery**: Browse open jobs filtered by category, location, or budget
- **Bidding System**: Submit competitive bids with pricing and time estimates
- **Work Management**: Track assigned jobs and communicate with clients
- **Reputation Building**: Receive ratings and reviews upon job completion
- **Profile Customization**: Showcase skills and specialties

### Technical Features
- **JWT Authentication**: Secure user accounts and API endpoints
- **Real-time Messaging**: Instant communication between users
- **Responsive Mobile Interface**: Built with React Native and Expo
- **RESTful API**: Structured backend with comprehensive endpoints
- **PostgreSQL Database**: Robust data storage with Supabase

## 🛠️ Technology Stack

- **Frontend**: React Native, Expo
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT, Supabase Auth

## 🔧 Project Structure

```
/
├── mobile/               # React Native Expo mobile app
│   ├── assets/           # Images, fonts and other static files
│   ├── src/              # Application source code
│   │   ├── screens/      # UI screens (auth, jobs, chat, etc.)
│   │   ├── context/      # React context for state management
│   │   ├── components/   # Reusable UI components
│   │   └── utils/        # Helper utilities and constants
│   ├── App.js            # Main application component
│   └── app.json          # Expo configuration
├── src/                  # Node.js backend API
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   └── utils/            # Helper utilities
└── .env                  # Environment variables
```

## 🚦 Getting Started

### Prerequisites
- Supabase account
- Node.js (v14+)
- Expo CLI

### Setting Up Supabase
1. Create a new Supabase project
2. Set up the required database tables (users, jobs, bids, etc.)
3. Get your Supabase URL and anon key

### Environment Configuration
1. Add your Supabase credentials to the `.env` file:
```
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
JWT_SECRET=your-secret-key
```

### Running the App on Replit
1. Fork this project
2. Add your environment variables in the Secrets tab
3. Run the project to start the server
4. For mobile app testing, use Expo Go on your device

## 🌐 API Documentation

The backend provides a comprehensive API with endpoints for:

- **Authentication**: Register, login, profile management
- **Jobs**: Create, list, filter, and manage job postings
- **Bidding**: Submit and manage bids on jobs
- **Messaging**: Real-time communication between users
- **Ratings**: Review system for completed jobs

Detailed API documentation is available at `/api/docs` when the server is running.

## 📱 Mobile App Screens

- **Auth**: Login, Register
- **Home**: Job listings with search and filters
- **Job Details**: Full job information with bidding functionality
- **Bids Management**: View and manage submitted bids
- **Chat**: Messaging interface with conversation list
- **Profile**: User information and ratings

## 🔒 Security

- **JWT Authentication**: Secure token-based authentication
- **Row-Level Security**: Database permissions using Supabase RLS policies
- **Input Validation**: Comprehensive request validation

## ⚠️ Important Note

This project is a demonstration of Replit's capabilities and is not intended for production use without additional security and performance considerations.

## 📄 License

MIT
