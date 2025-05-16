# Home Services Marketplace

A mobile marketplace app that connects customers with contractors for home services such as gardening, plumbing, carpentry, tutoring, and more.

## Project Structure

The project consists of two main parts:

1. **Backend**: Node.js/Express API server with Supabase integration
2. **Mobile App**: React Native Expo frontend

## Backend API

The backend API provides endpoints for:

- User authentication (login/register)
- Job management (creation, listing, filtering, details)
- Bidding system (place, accept, view bids)
- Chat functionality (conversations between users)
- User profiles and ratings

## Mobile App

The React Native Expo mobile app includes screens for:

- Authentication (login/register)
- Home page with job listings
- Job details and creation
- Bid management
- Chat/messaging system
- User profiles and ratings

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Expo CLI
- Supabase account

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Install dependencies:

```bash
# Install backend dependencies
npm install

# Install Expo dependencies
cd mobile
npm install
```

### Running the App

1. Start the backend server:

```bash
npm start
```

2. Start the mobile app:

```bash
cd mobile
npm start
```

3. Use Expo Go app on your mobile device to scan the QR code or use an emulator

## Database Schema

The project uses Supabase with the following tables:

- **Users**: User accounts (customers and contractors)
- **Jobs**: Service requests posted by customers
- **Bids**: Proposals from contractors for jobs
- **Conversations**: Chat conversations between users
- **Messages**: Individual chat messages
- **Ratings**: User ratings and feedback

## License

MIT