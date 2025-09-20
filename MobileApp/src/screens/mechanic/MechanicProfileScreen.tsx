import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logoutUser, updateProfile } from '../../store/authSlice';
import { fetchMyJobs } from '../../store/jobSlice';
import { CONFIG } from '../../config';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/MaterialIcons';

const MechanicProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);
  const { jobs } = useSelector((state: RootState) => state.jobs);
  
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      await dispatch(fetchMyJobs());
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    try {
      await dispatch(updateProfile({ isAvailable: value }));
      setIsAvailable(value);
      Alert.alert(
        'Status Updated',
        value ? 'You are now available for jobs' : 'You are now unavailable for jobs'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability status');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(logoutUser());
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    // navigation.navigate('EditProfile');
    Alert.alert('Coming Soon', 'Profile editing feature will be available soon!');
  };

  const handleSettings = () => {
    // Navigate to settings screen
    // navigation.navigate('Settings');
    Alert.alert('Coming Soon', 'Settings feature will be available soon!');
  };

  const handleHelp = () => {
    // Navigate to help screen
    // navigation.navigate('Help');
    Alert.alert('Help', 'Contact support at support@mechanicapp.com');
  };

  const getCompletedJobs = () => {
    return jobs.filter(job => job.status === 'completed').length;
  };

  const getTotalEarnings = () => {
    return jobs
      .filter(job => job.status === 'completed' && job.actualCost)
      .reduce((total, job) => total + (job.actualCost || 0), 0);
  };

  const getAverageRating = () => {
    const ratedJobs = jobs.filter(job => job.customerRating);
    if (ratedJobs.length === 0) return 0;
    const totalRating = ratedJobs.reduce((sum, job) => sum + (job.customerRating || 0), 0);
    return (totalRating / ratedJobs.length).toFixed(1);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Icon name="person" size={48} color={CONFIG.COLORS.WHITE} />
          </View>
          <View style={styles.availabilityIndicator}>
            <View style={[
              styles.availabilityDot,
              { backgroundColor: isAvailable ? CONFIG.COLORS.SUCCESS : CONFIG.COLORS.GRAY }
            ]} />
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color={CONFIG.COLORS.WARNING} />
            <Text style={styles.ratingText}>{getAverageRating()}/5</Text>
            <Text style={styles.ratingCount}>({jobs.filter(job => job.customerRating).length} reviews)</Text>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="check-circle" size={24} color={CONFIG.COLORS.SUCCESS} />
            <Text style={styles.statNumber}>{getCompletedJobs()}</Text>
            <Text style={styles.statLabel}>Completed Jobs</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="attach-money" size={24} color={CONFIG.COLORS.SUCCESS} />
            <Text style={styles.statNumber}>${getTotalEarnings()}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="star" size={24} color={CONFIG.COLORS.WARNING} />
            <Text style={styles.statNumber}>{getAverageRating()}</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
        </View>
      </View>

      {/* Availability Toggle */}
      <View style={styles.availabilitySection}>
        <View style={styles.availabilityHeader}>
          <View>
            <Text style={styles.availabilityTitle}>Availability</Text>
            <Text style={styles.availabilitySubtitle}>
              {isAvailable ? 'You are currently available for jobs' : 'You are currently unavailable'}
            </Text>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleAvailabilityToggle}
            trackColor={{ false: CONFIG.COLORS.GRAY, true: CONFIG.COLORS.PRIMARY }}
            thumbColor={CONFIG.COLORS.WHITE}
          />
        </View>
      </View>

      {/* Profile Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleEditProfile}>
          <View style={styles.actionLeft}>
            <Icon name="edit" size={20} color={CONFIG.COLORS.PRIMARY} />
            <Text style={styles.actionText}>Edit Profile</Text>
          </View>
          <Icon name="chevron-right" size={20} color={CONFIG.COLORS.GRAY} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleSettings}>
          <View style={styles.actionLeft}>
            <Icon name="settings" size={20} color={CONFIG.COLORS.PRIMARY} />
            <Text style={styles.actionText}>Settings</Text>
          </View>
          <Icon name="chevron-right" size={20} color={CONFIG.COLORS.GRAY} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={handleHelp}>
          <View style={styles.actionLeft}>
            <Icon name="help" size={20} color={CONFIG.COLORS.PRIMARY} />
            <Text style={styles.actionText}>Help & Support</Text>
          </View>
          <Icon name="chevron-right" size={20} color={CONFIG.COLORS.GRAY} />
        </TouchableOpacity>
      </View>

      {/* Account Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={styles.actionItem} onPress={handleLogout}>
          <View style={styles.actionLeft}>
            <Icon name="logout" size={20} color={CONFIG.COLORS.ERROR} />
            <Text style={[styles.actionText, { color: CONFIG.COLORS.ERROR }]}>Logout</Text>
          </View>
          <Icon name="chevron-right" size={20} color={CONFIG.COLORS.GRAY} />
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfoSection}>
        <Text style={styles.appVersion}>Version {CONFIG.APP_VERSION}</Text>
        <Text style={styles.appName}>{CONFIG.APP_NAME}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  profileHeader: {
    backgroundColor: CONFIG.COLORS.WHITE,
    padding: CONFIG.DIMENSIONS.PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: CONFIG.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: CONFIG.COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: CONFIG.COLORS.WHITE,
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: CONFIG.FONT_SIZES.XXLARGE,
    fontWeight: 'bold',
    color: CONFIG.COLORS.DARK_GRAY,
    marginBottom: 4,
  },
  email: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    marginBottom: 2,
  },
  phone: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  ratingCount: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
  },
  statsSection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    padding: CONFIG.DIMENSIONS.PADDING,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: CONFIG.FONT_SIZES.XLARGE,
    fontWeight: 'bold',
    color: CONFIG.COLORS.DARK_GRAY,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
  },
  statNumber: {
    fontSize: CONFIG.FONT_SIZES.XXLARGE,
    fontWeight: 'bold',
    color: CONFIG.COLORS.DARK_GRAY,
    marginTop: 8,
  },
  statLabel: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginTop: 4,
    textAlign: 'center',
  },
  availabilitySection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    padding: CONFIG.DIMENSIONS.PADDING,
    marginTop: 16,
  },
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  availabilitySubtitle: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    marginTop: 2,
  },
  actionsSection: {
    backgroundColor: CONFIG.COLORS.WHITE,
    padding: CONFIG.DIMENSIONS.PADDING,
    marginTop: 16,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.DARK_GRAY,
  },
  appInfoSection: {
    alignItems: 'center',
    padding: CONFIG.DIMENSIONS.PADDING,
    marginTop: 16,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
  },
  appName: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    marginTop: 4,
  },
});

export default MechanicProfileScreen; 