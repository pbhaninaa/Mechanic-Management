import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LocationTracking, LocationUpdate, Location } from '../types';
import locationService from '../services/locationService';

interface LocationState {
  activeTrackings: LocationTracking[];
  currentLocation: Location | null;
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  activeTrackings: [],
  currentLocation: null,
  isTracking: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const startLocationTracking = createAsyncThunk(
  'location/startTracking',
  async (jobId: string, { getState, dispatch }) => {
    const state = getState() as any;
    const job = state.jobs.jobs.find((j: any) => j.id === jobId);
    
    if (!job) {
      throw new Error('Job not found');
    }

    // Request location permission
    const hasPermission = await locationService.requestLocationPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    // Get current location
    const location = await locationService.getCurrentLocation();
    const address = await locationService.getAddressFromCoordinates(
      location.latitude,
      location.longitude
    );

    const fullLocation: Location = {
      ...location,
      address,
    };

    // Update current location in state
    dispatch(setCurrentLocation(fullLocation));

    // Start watching location
    const watchId = locationService.watchLocation(
      (newLocation) => {
        dispatch(updateCurrentLocation(newLocation));
        dispatch(updateJobLocation({ jobId, location: newLocation }));
      },
      (error) => {
        dispatch(setError(error.message));
      }
    );

    return { jobId, watchId, location: fullLocation };
  }
);

export const stopLocationTracking = createAsyncThunk(
  'location/stopTracking',
  async (jobId: string, { getState }) => {
    const state = getState() as any;
    const tracking = state.location.activeTrackings.find(
      (t: LocationTracking) => t.jobId === jobId
    );

    if (tracking && tracking.watchId) {
      locationService.stopWatchingLocation(tracking.watchId);
    }

    return jobId;
  }
);

export const updateJobLocation = createAsyncThunk(
  'location/updateJobLocation',
  async ({ jobId, location }: { jobId: string; location: Location }, { getState }) => {
    const state = getState() as any;
    const user = state.auth.user;
    const job = state.jobs.jobs.find((j: any) => j.id === jobId);

    if (!job || !user) {
      throw new Error('Job or user not found');
    }

    const locationUpdate: LocationUpdate = {
      jobId,
      userId: user.id,
      userType: user.userType,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
      },
      timestamp: new Date(),
    };

    // Here you would typically send the location update to your API
    // For now, we'll just return the update
    return locationUpdate;
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
    },
    updateCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addActiveTracking: (state, action: PayloadAction<LocationTracking>) => {
      const existingIndex = state.activeTrackings.findIndex(
        (tracking) => tracking.jobId === action.payload.jobId
      );
      if (existingIndex >= 0) {
        state.activeTrackings[existingIndex] = action.payload;
      } else {
        state.activeTrackings.push(action.payload);
      }
    },
    removeActiveTracking: (state, action: PayloadAction<string>) => {
      state.activeTrackings = state.activeTrackings.filter(
        (tracking) => tracking.jobId !== action.payload
      );
    },
    updateTrackingDistance: (
      state,
      action: PayloadAction<{ jobId: string; distance: number }>
    ) => {
      const tracking = state.activeTrackings.find(
        (t) => t.jobId === action.payload.jobId
      );
      if (tracking) {
        tracking.distance = action.payload.distance;
      }
    },
    updateEstimatedArrival: (
      state,
      action: PayloadAction<{ jobId: string; estimatedArrivalTime: Date }>
    ) => {
      const tracking = state.activeTrackings.find(
        (t) => t.jobId === action.payload.jobId
      );
      if (tracking) {
        tracking.estimatedArrivalTime = action.payload.estimatedArrivalTime;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startLocationTracking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startLocationTracking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isTracking = true;
        state.activeTrackings.push({
          jobId: action.payload.jobId,
          customerId: '', // Will be set from job data
          mechanicId: '', // Will be set from job data
          isActive: true,
          watchId: action.payload.watchId,
        });
      })
      .addCase(startLocationTracking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start location tracking';
      })
      .addCase(stopLocationTracking.fulfilled, (state, action) => {
        state.activeTrackings = state.activeTrackings.filter(
          (tracking) => tracking.jobId !== action.payload
        );
        if (state.activeTrackings.length === 0) {
          state.isTracking = false;
        }
      })
      .addCase(updateJobLocation.fulfilled, (state, action) => {
        const tracking = state.activeTrackings.find(
          (t) => t.jobId === action.payload.jobId
        );
        if (tracking) {
          if (action.payload.userType === 'customer') {
            tracking.customerLocation = {
              latitude: action.payload.location.latitude,
              longitude: action.payload.location.longitude,
              address: action.payload.location.address,
              lastUpdated: action.payload.timestamp,
            };
          } else {
            tracking.mechanicLocation = {
              latitude: action.payload.location.latitude,
              longitude: action.payload.location.longitude,
              address: action.payload.location.address,
              lastUpdated: action.payload.timestamp,
            };
          }

          // Calculate distance if both locations are available
          if (tracking.customerLocation && tracking.mechanicLocation) {
            const distance = locationService.calculateDistance(
              tracking.customerLocation.latitude,
              tracking.customerLocation.longitude,
              tracking.mechanicLocation.latitude,
              tracking.mechanicLocation.longitude
            );
            tracking.distance = distance;
          }
        }
      });
  },
});

export const {
  setCurrentLocation,
  updateCurrentLocation,
  setError,
  clearError,
  addActiveTracking,
  removeActiveTracking,
  updateTrackingDistance,
  updateEstimatedArrival,
} = locationSlice.actions;

export default locationSlice.reducer;
