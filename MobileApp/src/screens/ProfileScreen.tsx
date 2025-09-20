import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { logoutUser } from '../store/authSlice';
import { CONFIG } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state: RootState) => state.auth);

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
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <View style={styles.userTypeContainer}>
            <Icon 
              name={user?.userType === 'mechanic' ? 'build' : 'person'} 
              size={16} 
              color={CONFIG.COLORS.PRIMARY} 
            />
            <Text style={styles.userType}>
              {user?.userType === 'mechanic' ? 'Mechanic' : 'Customer'}
            </Text>
          </View>
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
  userTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userType: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  actionsSection: {
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

export default ProfileScreen; 