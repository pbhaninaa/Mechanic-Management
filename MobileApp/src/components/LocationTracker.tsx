import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import locationService, { Location, LocationError } from '../services/locationService';
import { CONFIG } from '../config';

interface LocationTrackerProps {
  onLocationUpdate?: (location: Location) => void;
  showMap?: boolean;
  height?: number;
  showControls?: boolean;
  initialLocation?: Location;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  onLocationUpdate,
  showMap = true,
  height = 300,
  showControls = true,
  initialLocation,
}) => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(
    initialLocation || null
  );
  const [isTracking, setIsTracking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        locationService.stopWatchingLocation(watchIdRef.current);
      }
    };
  }, []);

  const requestPermissionAndGetLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await locationService.requestLocationPermission();
      
      if (!hasPermission) {
        setError('Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to provide mechanic services. Please enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      onLocationUpdate?.(location);
    } catch (err) {
      const locationError = err as LocationError;
      setError(locationError.message);
      Alert.alert('Location Error', locationError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startTracking = async () => {
    if (isTracking) return;

    const hasPermission = await locationService.requestLocationPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Location permission is required for tracking.');
      return;
    }

    setIsTracking(true);
    setError(null);

    watchIdRef.current = locationService.watchLocation(
      (location) => {
        setCurrentLocation(location);
        onLocationUpdate?.(location);
      },
      (locationError) => {
        setError(locationError.message);
        setIsTracking(false);
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      locationService.stopWatchingLocation(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const centerMapOnLocation = () => {
    if (mapRef.current && currentLocation) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {showMap && currentLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
        >
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Current Location"
            description={currentLocation.address || 'Your current location'}
            pinColor={CONFIG.COLORS.PRIMARY}
          />
        </MapView>
      )}

      {!showMap && currentLocation && (
        <View style={styles.locationInfo}>
          <Icon name="location-on" size={24} color={CONFIG.COLORS.PRIMARY} />
          <View style={styles.locationText}>
            <Text style={styles.coordinates}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
            {currentLocation.address && (
              <Text style={styles.address}>{currentLocation.address}</Text>
            )}
            {currentLocation.accuracy && (
              <Text style={styles.accuracy}>
                Accuracy: ±{Math.round(currentLocation.accuracy)}m
              </Text>
            )}
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="error" size={20} color={CONFIG.COLORS.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {showControls && (
        <View style={styles.controls}>
          {!currentLocation && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={requestPermissionAndGetLocation}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={CONFIG.COLORS.WHITE} size="small" />
              ) : (
                <>
                  <Icon name="my-location" size={20} color={CONFIG.COLORS.WHITE} />
                  <Text style={styles.buttonText}>Get Current Location</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {currentLocation && (
            <View style={styles.buttonRow}>
              {!isTracking ? (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={startTracking}
                >
                  <Icon name="play-arrow" size={20} color={CONFIG.COLORS.PRIMARY} />
                  <Text style={[styles.buttonText, { color: CONFIG.COLORS.PRIMARY }]}>
                    Start Tracking
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={stopTracking}
                >
                  <Icon name="stop" size={20} color={CONFIG.COLORS.ERROR} />
                  <Text style={[styles.buttonText, { color: CONFIG.COLORS.ERROR }]}>
                    Stop Tracking
                  </Text>
                </TouchableOpacity>
              )}

              {showMap && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={centerMapOnLocation}
                >
                  <Icon name="center-focus-strong" size={20} color={CONFIG.COLORS.PRIMARY} />
                  <Text style={[styles.buttonText, { color: CONFIG.COLORS.PRIMARY }]}>
                    Center
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  locationText: {
    marginLeft: CONFIG.DIMENSIONS.PADDING,
    flex: 1,
  },
  coordinates: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  address: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginTop: 4,
  },
  accuracy: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.ERROR + '20',
  },
  errorText: {
    marginLeft: 8,
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.ERROR,
  },
  controls: {
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    minHeight: CONFIG.DIMENSIONS.BUTTON_HEIGHT,
  },
  primaryButton: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
  },
  secondaryButton: {
    backgroundColor: CONFIG.COLORS.WHITE,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.WHITE,
  },
});

export default LocationTracker;
