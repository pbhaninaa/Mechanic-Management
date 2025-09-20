# Location Tracking Functionality

This document describes the comprehensive location tracking functionality implemented in the MechanicApp.

## Overview

The location tracking system allows mechanics to track customer locations in real-time and provides customers with the ability to specify their location when requesting services. The system supports both current location detection and manual location entry.

## Features

### For Customers
1. **Location Selection**: Choose between current location and manual location entry
2. **Service for Others**: Request services for someone else by entering their location
3. **Location Validation**: Automatic validation of coordinates and address lookup
4. **Map Integration**: Visual location selection with interactive maps

### For Mechanics
1. **Real-time Tracking**: Track customer locations in real-time
2. **Distance Calculation**: Automatic distance calculation between mechanic and customer
3. **ETA Estimation**: Estimated arrival time based on distance and average speed
4. **Location History**: View location updates and tracking history
5. **Map Visualization**: Interactive maps showing both mechanic and customer locations

## Components

### 1. LocationService (`src/services/locationService.ts`)
Core service handling all location-related operations:

- **Permission Management**: Request and handle location permissions
- **Current Location**: Get current device location with high accuracy
- **Location Watching**: Real-time location updates
- **Reverse Geocoding**: Convert coordinates to addresses
- **Distance Calculation**: Calculate distances between two points
- **Location Validation**: Validate coordinates and format distances

### 2. LocationTracker (`src/components/LocationTracker.tsx`)
Reusable component for tracking and displaying location:

- **Map Display**: Show location on interactive maps
- **Location Controls**: Start/stop tracking, get current location
- **Error Handling**: Handle location errors and permission issues
- **Customizable**: Configurable height, controls, and map display

### 3. LocationPicker (`src/components/LocationPicker.tsx`)
Component for selecting locations:

- **Current Location**: Automatic location detection
- **Manual Entry**: Manual coordinate and address entry
- **Map Selection**: Tap on map to set coordinates
- **Address Lookup**: Automatic address resolution from coordinates

### 4. LocationTrackingScreen (`src/screens/mechanic/LocationTrackingScreen.tsx`)
Dedicated screen for mechanics to track jobs:

- **Job List**: Display all assigned jobs with tracking status
- **Real-time Updates**: Live location updates for active tracking
- **Distance Display**: Show distance to customer and ETA
- **Map Integration**: Interactive maps with customer and mechanic markers
- **Route Visualization**: Draw routes between mechanic and customer

### 5. CreateJobScreen (`src/screens/customer/CreateJobScreen.tsx`)
Enhanced job creation with location features:

- **Location Type Selection**: Choose between "For Myself" or "For Someone Else"
- **Location Picker Integration**: Integrated location selection
- **Validation**: Location validation before job submission
- **Vehicle Information**: Optional vehicle details with location context

## Redux State Management

### LocationSlice (`src/store/locationSlice.ts`)
Manages location tracking state:

```typescript
interface LocationState {
  activeTrackings: LocationTracking[];
  currentLocation: Location | null;
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
}
```

### Actions
- `startLocationTracking`: Start tracking for a specific job
- `stopLocationTracking`: Stop tracking for a specific job
- `updateJobLocation`: Update location for a job
- `setCurrentLocation`: Set current user location
- `updateTrackingDistance`: Update distance calculations
- `updateEstimatedArrival`: Update ETA calculations

## Types

### Location Interfaces
```typescript
interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp?: number;
}

interface LocationTracking {
  jobId: string;
  customerId: string;
  mechanicId?: string;
  customerLocation?: LocationWithTimestamp;
  mechanicLocation?: LocationWithTimestamp;
  distance?: number;
  estimatedArrivalTime?: Date;
  isActive: boolean;
}

interface LocationUpdate {
  jobId: string;
  userId: string;
  userType: 'customer' | 'mechanic';
  location: Location;
  timestamp: Date;
}
```

## Usage Examples

### Starting Location Tracking
```typescript
import { useDispatch } from 'react-redux';
import { startLocationTracking } from '../store/locationSlice';

const dispatch = useDispatch();

// Start tracking for a specific job
await dispatch(startLocationTracking(jobId));
```

### Using LocationPicker
```typescript
import LocationPicker from '../components/LocationPicker';

<LocationPicker
  onLocationSelect={(location) => {
    console.log('Selected location:', location);
  }}
  title="Select Service Location"
/>
```

### Using LocationTracker
```typescript
import LocationTracker from '../components/LocationTracker';

<LocationTracker
  onLocationUpdate={(location) => {
    console.log('Location updated:', location);
  }}
  showMap={true}
  height={300}
  showControls={true}
/>
```

## Configuration

### Map Configuration
```typescript
// src/config/index.ts
MAP: {
  DEFAULT_LATITUDE: 37.7749,
  DEFAULT_LONGITUDE: -122.4194,
  DEFAULT_ZOOM: 13,
  SEARCH_RADIUS: 5000, // meters
}
```

### Location Service Configuration
- **High Accuracy**: Enabled for precise location tracking
- **Update Interval**: 5 seconds for real-time updates
- **Distance Filter**: 10 meters to reduce unnecessary updates
- **Timeout**: 15 seconds for location requests

## Permissions

### Android
- `ACCESS_FINE_LOCATION`: Required for precise location tracking
- `ACCESS_COARSE_LOCATION`: Fallback for approximate location

### iOS
- Location permissions are handled automatically by the native module
- Users will be prompted for location access when needed

## Error Handling

The system includes comprehensive error handling for:

- **Permission Denied**: Graceful handling when location permissions are denied
- **Location Unavailable**: Fallback options when GPS is unavailable
- **Network Errors**: Handling for geocoding and API failures
- **Invalid Coordinates**: Validation and error messages for invalid locations

## Performance Considerations

- **Battery Optimization**: Efficient location updates to minimize battery drain
- **Network Usage**: Optimized API calls for geocoding and location services
- **Memory Management**: Proper cleanup of location watchers and listeners
- **Background Processing**: Support for background location updates

## Security

- **Location Privacy**: User consent required for location access
- **Data Encryption**: Location data encrypted in transit and storage
- **Access Control**: Location data only accessible to authorized users
- **Data Retention**: Configurable retention policies for location data

## Future Enhancements

1. **Geofencing**: Automatic notifications when entering/exiting job areas
2. **Route Optimization**: Optimal route calculation for multiple jobs
3. **Offline Support**: Offline location tracking and synchronization
4. **Location History**: Detailed location history and analytics
5. **Emergency Features**: Emergency location sharing and SOS functionality

## Dependencies

```json
{
  "react-native-geolocation-service": "^5.3.1",
  "react-native-maps": "^1.7.1",
  "react-native-permissions": "^3.8.4",
  "@react-native-community/geolocation": "^3.0.6"
}
```

## Installation Notes

1. Install required dependencies
2. Configure Google Maps API key for Android and iOS
3. Set up location permissions in native configurations
4. Configure background location capabilities if needed

## Testing

The location tracking functionality can be tested using:

- **Simulator**: iOS Simulator and Android Emulator with location simulation
- **Real Device**: Physical devices for accurate GPS testing
- **Mock Locations**: Development tools for location simulation
- **Network Conditions**: Testing with various network conditions

## Troubleshooting

### Common Issues
1. **Location not updating**: Check permissions and GPS settings
2. **Map not loading**: Verify Google Maps API key configuration
3. **High battery usage**: Adjust location update intervals
4. **Permission denied**: Guide users through permission settings

### Debug Tools
- Location service logs for debugging
- Map debugging tools for visualization issues
- Network monitoring for API call issues
- Performance profiling for optimization
