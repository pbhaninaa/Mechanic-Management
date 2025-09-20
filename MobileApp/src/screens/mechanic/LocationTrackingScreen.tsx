import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootState } from '../../store';
import { startLocationTracking, stopLocationTracking } from '../../store/locationSlice';
import LocationTracker from '../../components/LocationTracker';
import { CONFIG } from '../../config';
import locationService from '../../services/locationService';

const LocationTrackingScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { jobs } = useSelector((state: RootState) => state.jobs);
  const { activeTrackings, currentLocation, isTracking, isLoading } = useSelector(
    (state: RootState) => state.location
  );

  const [refreshing, setRefreshing] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Filter jobs assigned to current mechanic
  const assignedJobs = jobs.filter(job => job.mechanicId === user?.id);

  useEffect(() => {
    if (assignedJobs.length > 0 && !selectedJob) {
      setSelectedJob(assignedJobs[0]);
    }
  }, [assignedJobs, selectedJob]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Refresh job data here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleStartTracking = async (jobId: string) => {
    try {
      await dispatch(startLocationTracking(jobId) as any);
      Alert.alert('Success', 'Location tracking started successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const handleStopTracking = async (jobId: string) => {
    try {
      await dispatch(stopLocationTracking(jobId) as any);
      Alert.alert('Success', 'Location tracking stopped');
    } catch (error) {
      Alert.alert('Error', 'Failed to stop location tracking');
    }
  };

  const getTrackingStatus = (jobId: string) => {
    return activeTrackings.find(tracking => tracking.jobId === jobId);
  };

  const formatDistance = (meters: number) => {
    return locationService.formatDistance(meters);
  };

  const getEstimatedArrivalTime = (distance: number) => {
    // Assuming average speed of 30 km/h in city traffic
    const speedKmh = 30;
    const speedMs = speedKmh * 1000 / 3600; // Convert to m/s
    const timeSeconds = distance / speedMs;
    const timeMinutes = Math.ceil(timeSeconds / 60);
    
    const now = new Date();
    const arrivalTime = new Date(now.getTime() + timeMinutes * 60000);
    
    return arrivalTime.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderJobCard = (job: any) => {
    const tracking = getTrackingStatus(job.id);
    const isActive = tracking?.isActive;

    return (
      <View key={job.id} style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: CONFIG.JOB_STATUSES.find(s => s.value === job.status)?.color + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: CONFIG.JOB_STATUSES.find(s => s.value === job.status)?.color }
            ]}>
              {CONFIG.JOB_STATUSES.find(s => s.value === job.status)?.label}
            </Text>
          </View>
        </View>

        <Text style={styles.jobDescription}>{job.description}</Text>
        
        <View style={styles.locationInfo}>
          <Icon name="location-on" size={16} color={CONFIG.COLORS.GRAY} />
          <Text style={styles.locationText} numberOfLines={2}>
            {job.location.address}
          </Text>
        </View>

        {tracking && (
          <View style={styles.trackingInfo}>
            {tracking.distance && (
              <View style={styles.distanceInfo}>
                <Icon name="directions-car" size={16} color={CONFIG.COLORS.PRIMARY} />
                <Text style={styles.distanceText}>
                  {formatDistance(tracking.distance)} away
                </Text>
                {tracking.estimatedArrivalTime && (
                  <Text style={styles.etaText}>
                    ETA: {getEstimatedArrivalTime(tracking.distance)}
                  </Text>
                )}
              </View>
            )}
            
            <View style={styles.locationStatus}>
              <View style={styles.statusItem}>
                <Icon 
                  name={tracking.customerLocation ? "check-circle" : "radio-button-unchecked"} 
                  size={16} 
                  color={tracking.customerLocation ? CONFIG.COLORS.SUCCESS : CONFIG.COLORS.GRAY} 
                />
                <Text style={styles.statusLabel}>Customer Location</Text>
              </View>
              <View style={styles.statusItem}>
                <Icon 
                  name={tracking.mechanicLocation ? "check-circle" : "radio-button-unchecked"} 
                  size={16} 
                  color={tracking.mechanicLocation ? CONFIG.COLORS.SUCCESS : CONFIG.COLORS.GRAY} 
                />
                <Text style={styles.statusLabel}>Your Location</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionButtons}>
          {!isActive ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleStartTracking(job.id)}
              disabled={isLoading}
            >
              <Icon name="play-arrow" size={20} color={CONFIG.COLORS.WHITE} />
              <Text style={styles.buttonText}>Start Tracking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.stopButton]}
              onPress={() => handleStopTracking(job.id)}
            >
              <Icon name="stop" size={20} color={CONFIG.COLORS.WHITE} />
              <Text style={styles.buttonText}>Stop Tracking</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.actionButton, styles.selectButton]}
            onPress={() => setSelectedJob(job)}
          >
            <Icon name="map" size={20} color={CONFIG.COLORS.PRIMARY} />
            <Text style={[styles.buttonText, { color: CONFIG.COLORS.PRIMARY }]}>View Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMap = () => {
    if (!selectedJob) return null;

    const tracking = getTrackingStatus(selectedJob.id);
    const markers = [];
    const polylines = [];

    // Add customer location marker
    if (tracking?.customerLocation) {
      markers.push({
        id: 'customer',
        coordinate: {
          latitude: tracking.customerLocation.latitude,
          longitude: tracking.customerLocation.longitude,
        },
        title: 'Customer Location',
        description: tracking.customerLocation.address,
        pinColor: CONFIG.COLORS.ERROR,
      });
    }

    // Add mechanic location marker
    if (tracking?.mechanicLocation) {
      markers.push({
        id: 'mechanic',
        coordinate: {
          latitude: tracking.mechanicLocation.latitude,
          longitude: tracking.mechanicLocation.longitude,
        },
        title: 'Your Location',
        description: tracking.mechanicLocation.address,
        pinColor: CONFIG.COLORS.PRIMARY,
      });
    }

    // Add route line if both locations are available
    if (tracking?.customerLocation && tracking?.mechanicLocation) {
      polylines.push({
        coordinates: [
          {
            latitude: tracking.mechanicLocation.latitude,
            longitude: tracking.mechanicLocation.longitude,
          },
          {
            latitude: tracking.customerLocation.latitude,
            longitude: tracking.customerLocation.longitude,
          },
        ],
        strokeColor: CONFIG.COLORS.PRIMARY,
        strokeWidth: 3,
      });
    }

    const initialRegion = tracking?.customerLocation ? {
      latitude: tracking.customerLocation.latitude,
      longitude: tracking.customerLocation.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    } : {
      latitude: CONFIG.MAP.DEFAULT_LATITUDE,
      longitude: CONFIG.MAP.DEFAULT_LONGITUDE,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    return (
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Location Tracking</Text>
          <Text style={styles.mapSubtitle}>{selectedJob.title}</Text>
        </View>
        
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
        >
          {markers.map(marker => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              pinColor={marker.pinColor}
            />
          ))}
          
          {polylines.map((polyline, index) => (
            <Polyline
              key={index}
              coordinates={polyline.coordinates}
              strokeColor={polyline.strokeColor}
              strokeWidth={polyline.strokeWidth}
            />
          ))}
        </MapView>

        {tracking && (
          <View style={styles.mapInfo}>
            {tracking.distance && (
              <View style={styles.mapInfoItem}>
                <Icon name="directions-car" size={20} color={CONFIG.COLORS.PRIMARY} />
                <Text style={styles.mapInfoText}>
                  {formatDistance(tracking.distance)} • ETA: {getEstimatedArrivalTime(tracking.distance)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Location Tracking</Text>
        <Text style={styles.subtitle}>
          Track customer locations and navigate to job sites
        </Text>
      </View>

      {assignedJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="location-off" size={64} color={CONFIG.COLORS.GRAY} />
          <Text style={styles.emptyTitle}>No Assigned Jobs</Text>
          <Text style={styles.emptySubtitle}>
            You don't have any jobs assigned to you yet.
          </Text>
        </View>
      ) : (
        <>
          {selectedJob && renderMap()}
          
          <View style={styles.jobsSection}>
            <Text style={styles.sectionTitle}>Assigned Jobs</Text>
            {assignedJobs.map(renderJobCard)}
          </View>

          <View style={styles.locationTrackerSection}>
            <Text style={styles.sectionTitle}>Your Current Location</Text>
            <LocationTracker
              showMap={false}
              height={120}
              showControls={true}
              initialLocation={currentLocation}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  header: {
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  title: {
    fontSize: CONFIG.FONT_SIZES.HEADER,
    fontWeight: '700',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  subtitle: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: CONFIG.DIMENSIONS.PADDING * 3,
  },
  emptyTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    marginTop: CONFIG.DIMENSIONS.PADDING,
  },
  emptySubtitle: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    textAlign: 'center',
    marginTop: 8,
  },
  mapContainer: {
    margin: CONFIG.DIMENSIONS.MARGIN,
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    overflow: 'hidden',
  },
  mapHeader: {
    padding: CONFIG.DIMENSIONS.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  mapTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  mapSubtitle: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginTop: 2,
  },
  map: {
    height: 300,
  },
  mapInfo: {
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  mapInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapInfoText: {
    marginLeft: 8,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  jobsSection: {
    margin: CONFIG.DIMENSIONS.MARGIN,
  },
  sectionTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  jobCard: {
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    padding: CONFIG.DIMENSIONS.PADDING,
    marginBottom: CONFIG.DIMENSIONS.MARGIN,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    fontWeight: '600',
  },
  jobDescription: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  locationText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginLeft: 8,
    flex: 1,
  },
  trackingInfo: {
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    padding: CONFIG.DIMENSIONS.PADDING,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    marginLeft: 8,
  },
  etaText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginLeft: 8,
  },
  locationStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    minHeight: CONFIG.DIMENSIONS.BUTTON_HEIGHT,
    flex: 0.48,
  },
  startButton: {
    backgroundColor: CONFIG.COLORS.SUCCESS,
  },
  stopButton: {
    backgroundColor: CONFIG.COLORS.ERROR,
  },
  selectButton: {
    backgroundColor: CONFIG.COLORS.WHITE,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.PRIMARY,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.WHITE,
  },
  locationTrackerSection: {
    margin: CONFIG.DIMENSIONS.MARGIN,
  },
});

export default LocationTrackingScreen;
