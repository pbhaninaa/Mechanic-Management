import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import locationService, { Location } from '../services/locationService';
import { CONFIG } from '../config';

interface LocationPickerProps {
  onLocationSelect: (location: Location) => void;
  initialLocation?: Location;
  title?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  title = 'Select Location',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    initialLocation || null
  );
  const [locationType, setLocationType] = useState<'current' | 'manual' | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const hasPermission = await locationService.requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const location = await locationService.getCurrentLocation();
      const address = await locationService.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );
      
      const fullLocation: Location = {
        ...location,
        address,
      };
      
      setSelectedLocation(fullLocation);
      setLocationType('current');
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLocation = () => {
    setLocationType('manual');
    setManualLatitude('');
    setManualLongitude('');
    setManualAddress('');
  };

  const validateManualLocation = (): boolean => {
    const lat = parseFloat(manualLatitude);
    const lng = parseFloat(manualLongitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid Coordinates', 'Please enter valid latitude and longitude values.');
      return false;
    }
    
    if (lat < -90 || lat > 90) {
      Alert.alert('Invalid Latitude', 'Latitude must be between -90 and 90.');
      return false;
    }
    
    if (lng < -180 || lng > 180) {
      Alert.alert('Invalid Longitude', 'Longitude must be between -180 and 180.');
      return false;
    }
    
    return true;
  };

  const handleManualLocationSubmit = async () => {
    if (!validateManualLocation()) return;
    
    const lat = parseFloat(manualLatitude);
    const lng = parseFloat(manualLongitude);
    
    try {
      let address = manualAddress;
      if (!address.trim()) {
        address = await locationService.getAddressFromCoordinates(lat, lng);
      }
      
      const location: Location = {
        latitude: lat,
        longitude: lng,
        address,
      };
      
      setSelectedLocation(location);
    } catch (error) {
      Alert.alert('Error', 'Failed to get address for the coordinates.');
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      setShowModal(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setManualLatitude(latitude.toString());
    setManualLongitude(longitude.toString());
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setShowModal(true)}
      >
        <Icon name="location-on" size={24} color={CONFIG.COLORS.PRIMARY} />
        <View style={styles.triggerContent}>
          <Text style={styles.triggerTitle}>{title}</Text>
          {selectedLocation ? (
            <Text style={styles.triggerSubtitle} numberOfLines={1}>
              {selectedLocation.address || `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`}
            </Text>
          ) : (
            <Text style={styles.triggerSubtitle}>Tap to select location</Text>
          )}
        </View>
        <Icon name="chevron-right" size={24} color={CONFIG.COLORS.GRAY} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Icon name="close" size={24} color={CONFIG.COLORS.DARK_GRAY} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              disabled={!selectedLocation}
            >
              <Text style={[
                styles.confirmButtonText,
                { color: selectedLocation ? CONFIG.COLORS.PRIMARY : CONFIG.COLORS.GRAY }
              ]}>
                Confirm
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {!locationType && (
              <View style={styles.locationOptions}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleCurrentLocation}
                  disabled={isLoading}
                >
                  <Icon name="my-location" size={32} color={CONFIG.COLORS.PRIMARY} />
                  <Text style={styles.optionTitle}>Use Current Location</Text>
                  <Text style={styles.optionSubtitle}>
                    Automatically detect your current location
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={handleManualLocation}
                >
                  <Icon name="edit-location" size={32} color={CONFIG.COLORS.SECONDARY} />
                  <Text style={styles.optionTitle}>Enter Location Manually</Text>
                  <Text style={styles.optionSubtitle}>
                    Enter coordinates or address manually
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {locationType === 'current' && selectedLocation && (
              <View style={styles.locationDisplay}>
                <Text style={styles.sectionTitle}>Current Location</Text>
                <View style={styles.locationInfo}>
                  <Text style={styles.coordinates}>
                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </Text>
                  {selectedLocation.address && (
                    <Text style={styles.address}>{selectedLocation.address}</Text>
                  )}
                </View>
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                  >
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                      }}
                      title="Selected Location"
                      pinColor={CONFIG.COLORS.PRIMARY}
                    />
                  </MapView>
                </View>
              </View>
            )}

            {locationType === 'manual' && (
              <View style={styles.manualLocation}>
                <Text style={styles.sectionTitle}>Enter Location</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address (Optional)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={manualAddress}
                    onChangeText={setManualAddress}
                    placeholder="Enter address or landmark"
                    multiline
                  />
                </View>

                <View style={styles.coordinatesGroup}>
                  <View style={styles.coordinateInput}>
                    <Text style={styles.inputLabel}>Latitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={manualLatitude}
                      onChangeText={setManualLatitude}
                      placeholder="e.g., 37.7749"
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.coordinateInput}>
                    <Text style={styles.inputLabel}>Longitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={manualLongitude}
                      onChangeText={setManualLongitude}
                      placeholder="e.g., -122.4194"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleManualLocationSubmit}
                >
                  <Text style={styles.submitButtonText}>Get Location</Text>
                </TouchableOpacity>

                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                      latitude: CONFIG.MAP.DEFAULT_LATITUDE,
                      longitude: CONFIG.MAP.DEFAULT_LONGITUDE,
                      latitudeDelta: 0.1,
                      longitudeDelta: 0.1,
                    }}
                    onPress={handleMapPress}
                  >
                    {manualLatitude && manualLongitude && (
                      <Marker
                        coordinate={{
                          latitude: parseFloat(manualLatitude),
                          longitude: parseFloat(manualLongitude),
                        }}
                        title="Selected Location"
                        pinColor={CONFIG.COLORS.PRIMARY}
                      />
                    )}
                  </MapView>
                  <Text style={styles.mapHint}>Tap on map to set coordinates</Text>
                </View>
              </View>
            )}

            {locationType && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setLocationType(null);
                  setSelectedLocation(null);
                }}
              >
                <Icon name="arrow-back" size={20} color={CONFIG.COLORS.PRIMARY} />
                <Text style={styles.backButtonText}>Choose Different Option</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: CONFIG.DIMENSIONS.MARGIN,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  triggerContent: {
    flex: 1,
    marginLeft: CONFIG.DIMENSIONS.PADDING,
  },
  triggerTitle: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  triggerSubtitle: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: CONFIG.DIMENSIONS.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  confirmButton: {
    padding: 8,
  },
  confirmButtonText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  locationOptions: {
    padding: CONFIG.DIMENSIONS.PADDING,
  },
  optionButton: {
    alignItems: 'center',
    padding: CONFIG.DIMENSIONS.PADDING * 2,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    marginBottom: CONFIG.DIMENSIONS.MARGIN,
  },
  optionTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    marginTop: CONFIG.DIMENSIONS.PADDING,
  },
  optionSubtitle: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    textAlign: 'center',
    marginTop: 4,
  },
  locationDisplay: {
    padding: CONFIG.DIMENSIONS.PADDING,
  },
  sectionTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  locationInfo: {
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    padding: CONFIG.DIMENSIONS.PADDING,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    marginBottom: CONFIG.DIMENSIONS.PADDING,
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
  mapContainer: {
    height: 200,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    overflow: 'hidden',
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  map: {
    flex: 1,
  },
  mapHint: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: CONFIG.COLORS.WHITE,
    padding: 8,
    borderRadius: 4,
    fontSize: CONFIG.FONT_SIZES.SMALL,
    textAlign: 'center',
  },
  manualLocation: {
    padding: CONFIG.DIMENSIONS.PADDING,
  },
  inputGroup: {
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  inputLabel: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    padding: CONFIG.DIMENSIONS.PADDING,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  coordinatesGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  coordinateInput: {
    flex: 0.48,
  },
  submitButton: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
    padding: CONFIG.DIMENSIONS.PADDING,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    alignItems: 'center',
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  submitButtonText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: CONFIG.DIMENSIONS.PADDING,
    marginTop: CONFIG.DIMENSIONS.PADDING,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default LocationPicker;
