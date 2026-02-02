# MechConnect - Mechanic Service Platform

A comprehensive Vue.js 3 application that connects clients with mechanics and car wash services. Built with modern web technologies and a clean, responsive interface.

## 🚀 Features

### Core Functionality
- **Multi-Role User System** - Support for Clients, Mechanics, Admins, and Car Wash operators
- **User Authentication** - Secure login with JWT tokens and profile management
- **Service Requests** - Clients can request mechanic services and car wash bookings
- **Real-time Tracking** - Service status tracking and payment management
- **Earnings Management** - Track earnings for mechanics and car wash operators
- **User Management** - Admin panel for managing all users

### User Roles & Capabilities

#### 🔧 **Client**
- Request mechanic services
- Book car wash appointments
- View service history
- Make payments
- Track service status
- Access help resources

#### 🔨 **Mechanic**
- View and accept job requests
- Update service status
- Track earnings
- Manage service history

#### 🚗 **Car Wash Operator**
- Manage car wash bookings
- Update service status
- Track earnings
- View client bookings

#### 👨‍💼 **Admin**
- Manage all users
- View system reports
- Monitor platform activity
- User role management

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework with Composition API
- **Vite** - Fast build tool and development server
- **Vuetify 3** - Material Design component framework
- **Vue Router** - Official router with navigation guards
- **Axios** - HTTP client for API requests
- **Chart.js & ECharts** - Data visualization
- **Leaflet** - Interactive maps
- **Date-fns** - Date manipulation

## 📋 Prerequisites

- Node.js (v20.19.0 or higher)
- npm or yarn
- Backend API running (configured in environment variables)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:8080/api
VITE_APP_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 4. Build Commands

```bash
# Development build
npm run build:dev

# UAT build
npm run build:uat

# Production build
npm run build:prod

# Preview builds
npm run preview:dev
npm run preview:uat
npm run preview:prod
```

## 📁 Project Structure

```
src/
├── api/                    # API configuration and services
│   ├── apiService.js       # Main API service class
│   ├── axios.js           # Axios configuration
│   └── README.md          # API documentation
├── components/             # Reusable Vue components
│   ├── Button.vue         # Custom button component
│   ├── InputField.vue     # Custom input component
│   ├── SidebarNav.vue     # Navigation sidebar
│   ├── TableComponent.vue # Data table component
│   └── ...                # Other reusable components
├── composables/           # Vue 3 composables
│   └── useAuth.js         # Authentication composable
├── router/                # Vue Router configuration
│   └── index.js          # Route definitions and guards
├── utils/                 # Utility functions
│   ├── constants.js       # Application constants
│   └── helper.js          # Helper functions
├── views/                 # Page components
│   ├── Dashboards/        # Role-specific dashboards
│   ├── Usermanagement/    # User auth and profile pages
│   ├── Carwash/          # Car wash related pages
│   └── ...               # Other view components
├── assets/               # Static assets
└── main.js              # Application entry point
```

## 🔧 Configuration

### API Configuration

The API base URL is configured through environment variables. Update the `.env` file to match your backend server:

```javascript
// src/utils/constants.js
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  TIMEOUT: 10000
};
```

### User Roles

The application supports four user roles defined in `src/utils/constants.js`:

```javascript
export const USER_ROLES = {
  CLIENT: 'CLIENT',
  MECHANIC: 'MECHANIC',
  ADMIN: 'ADMIN',
  CAR_WASH: 'CARWASH'
};
```

### Profile Management

The application enforces profile creation for new users:
- Users without profiles are redirected to profile creation
- Navigation items are disabled until profile is completed
- Profile creation includes role selection and basic information

## 🎨 Customization

### Themes

Customize the application theme in `src/main.js`:

```javascript
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          // Add your custom colors
        },
      },
    },
  },
})
```

### Role-based Navigation

Navigation items are filtered based on user roles in `src/components/SidebarNav.vue`:

```javascript
const navigationItems = [
  { title: 'Home', icon: 'mdi-home', to: '/dashboard', roles: ['client','mechanic','admin','carwash'] },
  { title: 'Profile', icon: 'mdi-account', to: '/profile', roles: ['client','mechanic','admin','carwash'] },
  // Role-specific items...
]
```

## 🔐 Authentication & Security

- JWT token-based authentication
- Protected routes with navigation guards
- Role-based access control
- Secure token storage in localStorage
- Automatic token refresh handling

## 📱 Responsive Design

- Mobile-first approach
- Responsive sidebar navigation
- Touch-friendly interface
- Adaptive layouts for different screen sizes

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: The dev server will automatically try the next available port
2. **API connection errors**: Verify backend server is running and environment variables are correct
3. **Authentication issues**: Check JWT token storage and API endpoints
4. **Profile creation issues**: Ensure all required fields are filled and role is selected

### Development Tools

- **Vue DevTools**: Available in browser extensions
- **Hot Reload**: Automatic browser refresh on file changes
- **Console Logging**: Detailed error messages in browser console

## 📝 API Endpoints

The application integrates with the following backend endpoints:

### Authentication
- `POST /api/users/login` - User authentication
- `POST /api/users` - User registration

### Profile Management
- `GET /api/user-profile` - Get user profile
- `POST /api/user-profile` - Create user profile
- `PUT /api/user-profile` - Update user profile

### Service Management
- `POST /api/request-mechanic` - Create mechanic request
- `POST /api/carwash-bookings/create` - Create car wash booking
- `GET /api/payments` - Get payment information

## 🚀 Deployment

### Environment-specific Builds

The application supports multiple environments:
- **Development**: `npm run build:dev`
- **UAT**: `npm run build:uat`
- **Production**: `npm run build:prod`

### Preview Builds

Test production builds locally:
```bash
npm run preview:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section above
- Review the API documentation in `src/api/README.md`
- Create an issue in the repository

---

**MechConnect** - Connecting clients with reliable automotive services.