# MechanicApp

A React Native mobile application that connects customers with mechanics for automotive services. The app provides a platform for customers to request mechanic services and for mechanics to accept and complete jobs.

## Features

### For Customers
- **User Registration & Authentication**: Secure login and registration system
- **Service Requests**: Create service requests with detailed descriptions
- **Job Tracking**: Monitor the status of your service requests
- **Job History**: View all past service requests
- **Rating System**: Rate and review completed services
- **Real-time Updates**: Get notified about job status changes

### For Mechanics
- **Profile Management**: Manage availability status and profile information
- **Job Discovery**: Browse available service requests in your area
- **Job Management**: Accept, update status, and complete jobs
- **Earnings Tracking**: Monitor completed jobs and earnings
- **Performance Metrics**: View ratings and job statistics

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── LoadingSpinner.tsx
├── config/             # App configuration and constants
│   └── index.ts
├── navigation/         # Navigation configuration
│   └── AppNavigator.tsx
├── screens/           # Screen components
│   ├── auth/         # Authentication screens
│   │   ├── LoginScreen.tsx
│   │   └── RegisterScreen.tsx
│   ├── customer/     # Customer-specific screens
│   │   ├── HomeScreen.tsx
│   │   └── JobHistoryScreen.tsx
│   ├── mechanic/     # Mechanic-specific screens
│   │   ├── JobsScreen.tsx
│   │   └── MechanicProfileScreen.tsx
│   └── ProfileScreen.tsx
├── services/         # API services
│   └── api.ts
├── store/           # Redux store configuration
│   ├── index.ts
│   ├── authSlice.ts
│   └── jobSlice.ts
└── types/           # TypeScript type definitions
    └── index.ts
```

## Technology Stack

- **React Native**: 0.81.0
- **TypeScript**: For type safety
- **Redux Toolkit**: State management
- **React Navigation**: Navigation between screens
- **React Native Vector Icons**: Icon library
- **Axios**: HTTP client for API calls
- **AsyncStorage**: Local data persistence

## Getting Started

### Prerequisites

- Node.js (>= 18)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MachanicApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Start the Metro bundler**
   ```bash
   npm start
   ```

5. **Run the app**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

## Configuration

### API Configuration

Update the API base URL in `src/config/index.ts`:

```typescript
export const CONFIG = {
  API_BASE_URL: 'https://your-api-domain.com/v1',
  // ... other config
};
```

### Environment Variables

Create a `.env` file in the root directory for environment-specific variables:

```env
API_BASE_URL=https://your-api-domain.com/v1
```

## Key Features Implementation

### Authentication Flow
- JWT token-based authentication
- Automatic token refresh
- Persistent login state
- Role-based navigation (Customer/Mechanic)

### State Management
- Redux Toolkit for centralized state management
- Separate slices for authentication and jobs
- Async thunks for API calls
- Optimistic updates for better UX

### Navigation
- Stack navigation for authentication flow
- Tab navigation for main app screens
- Role-based navigation structure
- Deep linking support (ready for implementation)

### UI/UX
- Modern, clean design
- Consistent color scheme and typography
- Loading states and error handling
- Responsive layouts
- Accessibility considerations

## API Integration

The app is designed to work with a RESTful API. Key endpoints include:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile

### Jobs
- `GET /jobs` - Get jobs (with filters)
- `POST /jobs` - Create new job
- `PUT /jobs/:id` - Update job
- `POST /jobs/:id/accept` - Accept job (mechanic)
- `POST /jobs/:id/complete` - Complete job (mechanic)

### Mechanic-specific
- `GET /mechanic/available-jobs` - Get available jobs
- `PUT /mechanic/status` - Update availability status

### Customer-specific
- `GET /customer/my-jobs` - Get customer's jobs
- `POST /jobs/:id/rate` - Rate completed job

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@mechanicapp.com or create an issue in the repository.

## Roadmap

- [ ] Push notifications
- [ ] Real-time chat between customers and mechanics
- [ ] Payment integration
- [ ] Location-based job matching
- [ ] Photo upload for job documentation
- [ ] Offline mode support
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Advanced filtering and search
- [ ] Analytics dashboard for mechanics
