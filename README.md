# OpenBoard

A chess application with user authentication using NestJS backend.

## Setup

### Frontend
1. Install dependencies:
```bash
npm install
```

2. Start the React development server:
```bash
npm run dev
```

### Backend
1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the NestJS development server:
```bash
npm run start:dev
```

## Features

- User signup and signin
- MongoDB integration for user storage
- Modern React UI with authentication forms
- Toast notifications for user feedback
- NestJS backend with proper error handling

## Architecture

- **Frontend**: React with Vite (port 5173)
- **Backend**: NestJS with MongoDB (port 3001)
- **Database**: MongoDB Atlas Cluster 0, "Chess" database, "Chess-Users" collection
- **Authentication**: Simple username/password (max 40 chars, no validation)
- **Client**: Reusable functions in `src/client.js` that call the NestJS API

## API Endpoints

- `POST /auth/signup` - User registration
- `POST /auth/signin` - User authentication

Both endpoints expect: `{ "username": "string", "password": "string" }`
# OpenBoard
