import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { createJob } from '../../store/jobSlice';
import LocationPicker from '../../components/LocationPicker';
import { CONFIG } from '../../config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Location, CreateJobData } from '../../types';

const CreateJobScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isLoading } = useSelector((state: RootState) => state.jobs);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [location, setLocation] = useState<Location | null>(null);
  const [locationFor, setLocationFor] = useState<'self' | 'other'>('self');
  const [otherPersonName, setOtherPersonName] = useState('');
  const [otherPersonPhone, setOtherPersonPhone] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  const handleLocationSelect = (selectedLocation: Location) => {
    setLocation(selectedLocation);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a job title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a job description');
      return false;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return false;
    }
    if (!location) {
      Alert.alert('Error', 'Please select a location');
      return false;
    }
    if (locationFor === 'other') {
      if (!otherPersonName.trim()) {
        Alert.alert('Error', 'Please enter the person\'s name');
        return false;
      }
      if (!otherPersonPhone.trim()) {
        Alert.alert('Error', 'Please enter the person\'s phone number');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const jobData: CreateJobData = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      location: {
        latitude: location!.latitude,
        longitude: location!.longitude,
        address: location!.address || '',
      },
      locationFor,
      otherPersonName: locationFor === 'other' ? otherPersonName.trim() : undefined,
      otherPersonPhone: locationFor === 'other' ? otherPersonPhone.trim() : undefined,
      vehicleInfo: vehicleMake || vehicleModel || vehicleYear ? {
        make: vehicleMake.trim(),
        model: vehicleModel.trim(),
        year: parseInt(vehicleYear) || 0,
        licensePlate: licensePlate.trim() || undefined,
      } : undefined,
    };

    try {
      await dispatch(createJob(jobData) as any);
      Alert.alert(
        'Success',
        'Job created successfully! A mechanic will be assigned to you soon.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create job. Please try again.');
    }
  };

  const renderLocationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location</Text>
      
      <View style={styles.locationTypeSelector}>
        <TouchableOpacity
          style={[
            styles.locationTypeButton,
            locationFor === 'self' && styles.locationTypeButtonActive
          ]}
          onPress={() => setLocationFor('self')}
        >
          <Icon 
            name="person" 
            size={20} 
            color={locationFor === 'self' ? CONFIG.COLORS.WHITE : CONFIG.COLORS.GRAY} 
          />
          <Text style={[
            styles.locationTypeText,
            locationFor === 'self' && styles.locationTypeTextActive
          ]}>
            For Myself
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.locationTypeButton,
            locationFor === 'other' && styles.locationTypeButtonActive
          ]}
          onPress={() => setLocationFor('other')}
        >
          <Icon 
            name="people" 
            size={20} 
            color={locationFor === 'other' ? CONFIG.COLORS.WHITE : CONFIG.COLORS.GRAY} 
          />
          <Text style={[
            styles.locationTypeText,
            locationFor === 'other' && styles.locationTypeTextActive
          ]}>
            For Someone Else
          </Text>
        </TouchableOpacity>
      </View>

      {locationFor === 'other' && (
        <View style={styles.otherPersonInfo}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Person's Name</Text>
            <TextInput
              style={styles.textInput}
              value={otherPersonName}
              onChangeText={setOtherPersonName}
              placeholder="Enter the person's name"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Person's Phone</Text>
            <TextInput
              style={styles.textInput}
              value={otherPersonPhone}
              onChangeText={setOtherPersonPhone}
              placeholder="Enter the person's phone number"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      )}

      <LocationPicker
        onLocationSelect={handleLocationSelect}
        title={locationFor === 'self' ? 'Select Your Location' : 'Select Their Location'}
      />
    </View>
  );

  const renderVehicleSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Vehicle Information (Optional)</Text>
      
      <View style={styles.vehicleGrid}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Make</Text>
          <TextInput
            style={styles.textInput}
            value={vehicleMake}
            onChangeText={setVehicleMake}
            placeholder="e.g., Toyota"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Model</Text>
          <TextInput
            style={styles.textInput}
            value={vehicleModel}
            onChangeText={setVehicleModel}
            placeholder="e.g., Camry"
          />
        </View>
      </View>
      
      <View style={styles.vehicleGrid}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Year</Text>
          <TextInput
            style={styles.textInput}
            value={vehicleYear}
            onChangeText={setVehicleYear}
            placeholder="e.g., 2020"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>License Plate</Text>
          <TextInput
            style={styles.textInput}
            value={licensePlate}
            onChangeText={setLicensePlate}
            placeholder="e.g., ABC123"
            autoCapitalize="characters"
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={CONFIG.COLORS.DARK_GRAY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Title</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Car won't start, Flat tire, etc."
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the problem in detail..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CONFIG.JOB_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.priorityGrid}>
              {CONFIG.JOB_PRIORITIES.map((pri) => (
                <TouchableOpacity
                  key={pri.value}
                  style={[
                    styles.priorityButton,
                    priority === pri.value && styles.priorityButtonActive,
                    { borderColor: pri.color }
                  ]}
                  onPress={() => setPriority(pri.value)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    priority === pri.value && { color: pri.color }
                  ]}>
                    {pri.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Location Section */}
        {renderLocationSection()}

        {/* Vehicle Information */}
        {renderVehicleSection()}
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={CONFIG.COLORS.WHITE} size="small" />
          ) : (
            <>
              <Icon name="send" size={20} color={CONFIG.COLORS.WHITE} />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  headerTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: CONFIG.DIMENSIONS.MARGIN,
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
  },
  sectionTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    marginBottom: CONFIG.DIMENSIONS.PADDING,
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
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationTypeSelector: {
    flexDirection: 'row',
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  locationTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: CONFIG.DIMENSIONS.PADDING,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    marginHorizontal: 4,
  },
  locationTypeButtonActive: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
    borderColor: CONFIG.COLORS.PRIMARY,
  },
  locationTypeText: {
    marginLeft: 8,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.GRAY,
  },
  locationTypeTextActive: {
    color: CONFIG.COLORS.WHITE,
  },
  otherPersonInfo: {
    marginBottom: CONFIG.DIMENSIONS.PADDING,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: 16,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  categoryButtonActive: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
    borderColor: CONFIG.COLORS.PRIMARY,
  },
  categoryButtonText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
  },
  categoryButtonTextActive: {
    color: CONFIG.COLORS.WHITE,
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  priorityButtonActive: {
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  priorityButtonText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    fontWeight: '600',
    color: CONFIG.COLORS.GRAY,
  },
  vehicleGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  footer: {
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONFIG.COLORS.PRIMARY,
    padding: CONFIG.DIMENSIONS.PADDING,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    minHeight: CONFIG.DIMENSIONS.BUTTON_HEIGHT,
  },
  submitButtonDisabled: {
    backgroundColor: CONFIG.COLORS.GRAY,
  },
  submitButtonText: {
    marginLeft: 8,
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.WHITE,
  },
});

export default CreateJobScreen;
