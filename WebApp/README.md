# Job Application Tracker - Frontend

A modern Vue.js 3 application for tracking job applications with a clean, responsive interface built using Vuetify.

## 🚀 Features

- **User Authentication** - Secure login with JWT tokens
- **Profile Management** - View and manage user profile information
- **Job Applications Tracking** - Track job applications with status indicators
- **Responsive Design** - Mobile-friendly interface using Vuetify
- **Error Handling** - Comprehensive error handling and user feedback
- **Loading States** - Professional loading indicators
- **Navigation Guards** - Protected routes based on authentication status

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and development server
- **Vuetify 3** - Material Design component framework
- **Vue Router** - Official router for Vue.js
- **Axios** - HTTP client for API requests

## 📋 Prerequisites

- Node.js (v20.19.0 or higher)
- npm or yarn
- Backend API running on `http://localhost:8080`

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
src/
├── api/           # API configuration and axios setup
├── components/    # Reusable Vue components
├── composables/   # Vue 3 composables for shared logic
├── router/        # Vue Router configuration
├── utils/         # Utility functions and constants
├── views/         # Page components
├── assets/        # Static assets
└── main.js        # Application entry point
```

## 🔧 Configuration

### API Configuration

The API base URL is configured in `src/api/axios.js`. Update the `baseURL` to match your backend server:

```javascript
const API = axios.create({
  baseURL: "http://localhost:8080/api", // Update this URL
  timeout: 10000,
});
```

### Environment Variables

Create a `.env` file in the root directory for environment-specific configuration:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_TITLE=Job Application Tracker
```

## 🎨 Customization

### Themes

The application uses Vuetify's theming system. Customize colors in `src/main.js`:

```javascript
const vuetify = createVuetify({
  theme: {
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          // Add your custom colors
        },
      },
    },
  },
})
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**: The dev server will automatically try the next available port
2. **API connection errors**: Ensure your backend server is running on the correct port
3. **Authentication issues**: Check that JWT tokens are being stored correctly in localStorage

### Development Tools

- **Vue DevTools**: Available at `http://localhost:5173/__devtools__/`
- **Hot Reload**: Changes are automatically reflected in the browser
- **Console Logging**: Check browser console for detailed error messages

## 📝 API Endpoints

The application expects the following backend endpoints:

- `POST /api/users/login` - User authentication
- `GET /api/user-profile` - Get user profile
- `GET /api/job-applications` - Get job applications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
