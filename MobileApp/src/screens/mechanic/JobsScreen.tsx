import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchAvailableJobs, acceptJob, completeJob, updateMechanicStatus } from '../../store/jobSlice';
import { CONFIG } from '../../config';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/MaterialIcons';

const JobsScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { jobs, isLoading } = useSelector((state: RootState) => state.jobs);
  
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      await dispatch(fetchAvailableJobs());
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleAvailabilityToggle = async (value: boolean) => {
    try {
      await dispatch(updateMechanicStatus(value));
      setIsAvailable(value);
      Alert.alert(
        'Status Updated',
        value ? 'You are now available for jobs' : 'You are now unavailable for jobs'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update availability status');
    }
  };

  const handleAcceptJob = async (job: any) => {
    Alert.alert(
      'Accept Job',
      `Are you sure you want to accept this ${job.category} job?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await dispatch(acceptJob(job.id));
              Alert.alert('Success', 'Job accepted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to accept job. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCompleteJob = async (job: any) => {
    Alert.prompt(
      'Complete Job',
      'Enter the actual cost for this job:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async (cost) => {
            if (cost && !isNaN(Number(cost)) && Number(cost) >= 0) {
              try {
                await dispatch(completeJob({
                  jobId: job.id,
                  completionData: { actualCost: Number(cost), notes: '' }
                }));
                Alert.alert('Success', 'Job completed successfully!');
              } catch (error) {
                Alert.alert('Error', 'Failed to complete job. Please try again.');
              }
            } else {
              Alert.alert('Invalid Cost', 'Please enter a valid cost amount.');
            }
          }
        }
      ],
      'plain-text',
      job.estimatedCost?.toString() || '0'
    );
  };

  const getStatusColor = (status: string) => {
    const statusConfig = CONFIG.JOB_STATUSES.find(s => s.value === status);
    return statusConfig?.color || CONFIG.COLORS.GRAY;
  };

  const getPriorityColor = (priority: string) => {
    const priorityConfig = CONFIG.JOB_PRIORITIES.find(p => p.value === priority);
    return priorityConfig?.color || CONFIG.COLORS.GRAY;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const renderJobItem = ({ item: job }: { item: any }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
            {job.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.jobDescription} numberOfLines={3}>
        {job.description}
      </Text>
      
      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="category" size={16} color={CONFIG.COLORS.GRAY} />
            <Text style={styles.detailText}>{job.category}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Icon name="schedule" size={16} color={CONFIG.COLORS.GRAY} />
            <Text style={styles.detailText}>{formatDate(job.createdAt.toString())}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="location-on" size={16} color={CONFIG.COLORS.GRAY} />
            <Text style={styles.detailText}>{job.location.address}</Text>
          </View>
          
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) + '20' }]}>
            <Text style={[styles.priorityText, { color: getPriorityColor(job.priority) }]}>
              {job.priority.toUpperCase()}
            </Text>
          </View>
        </View>

        {job.estimatedCost && (
          <View style={styles.costContainer}>
            <Icon name="attach-money" size={16} color={CONFIG.COLORS.SUCCESS} />
            <Text style={styles.costText}>Estimated: ${job.estimatedCost}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionButtons}>
        {job.status === 'pending' && (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptJob(job)}
          >
            <Icon name="check" size={16} color={CONFIG.COLORS.WHITE} />
            <Text style={styles.acceptButtonText}>Accept Job</Text>
          </TouchableOpacity>
        )}
        
        {job.status === 'assigned' && job.mechanicId === user?.id && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleCompleteJob(job)}
          >
            <Icon name="done" size={16} color={CONFIG.COLORS.WHITE} />
            <Text style={styles.completeButtonText}>Complete Job</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="work" size={48} color={CONFIG.COLORS.GRAY} />
      <Text style={styles.emptyStateTitle}>No available jobs</Text>
      <Text style={styles.emptyStateText}>
        {!isAvailable 
          ? 'Turn on availability to see jobs'
          : 'No jobs are currently available in your area'
        }
      </Text>
    </View>
  );

  if (isLoading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header with Availability Toggle */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Available Jobs</Text>
            <Text style={styles.headerSubtitle}>
              {isAvailable ? 'You are available for jobs' : 'You are currently unavailable'}
            </Text>
          </View>
          <View style={styles.availabilityContainer}>
            <Text style={styles.availabilityText}>Available</Text>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityToggle}
              trackColor={{ false: CONFIG.COLORS.GRAY, true: CONFIG.COLORS.PRIMARY }}
              thumbColor={CONFIG.COLORS.WHITE}
            />
          </View>
        </View>
      </View>

      {/* Jobs List */}
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  header: {
    backgroundColor: CONFIG.COLORS.WHITE,
    padding: CONFIG.DIMENSIONS.PADDING,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: CONFIG.FONT_SIZES.XLARGE,
    fontWeight: 'bold',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  headerSubtitle: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    marginTop: 4,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  availabilityText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.DARK_GRAY,
    fontWeight: '500',
  },
  listContainer: {
    padding: CONFIG.DIMENSIONS.PADDING,
  },
  jobCard: {
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    flex: 1,
    marginRight: 8,
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
    marginBottom: 16,
    lineHeight: 20,
  },
  jobDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    fontWeight: '600',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  costText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.SUCCESS,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONFIG.COLORS.SUCCESS,
    paddingVertical: 12,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    gap: 4,
  },
  acceptButtonText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONFIG.COLORS.PRIMARY,
    paddingVertical: 12,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    gap: 4,
  },
  completeButtonText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: CONFIG.FONT_SIZES.XLARGE,
    fontWeight: 'bold',
    color: CONFIG.COLORS.DARK_GRAY,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    textAlign: 'center',
  },
});

export default JobsScreen; 