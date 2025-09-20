import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchMyJobs, createJob } from '../../store/jobSlice';
import { CONFIG } from '../../config';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/MaterialIcons';

const HomeScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { jobs, isLoading } = useSelector((state: RootState) => state.jobs);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  const handleCreateJob = () => {
    // Navigate to job creation screen
    navigation.navigate('CreateJob');
  };

  const handleJobPress = (job: any) => {
    // Navigate to job details screen
    // navigation.navigate('JobDetails', { jobId: job.id });
    Alert.alert('Job Details', `Job: ${job.title}\nStatus: ${job.status}`);
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

  if (isLoading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}!</Text>
            <Text style={styles.subtitle}>Need a mechanic? We're here to help.</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Icon name="person" size={24} color={CONFIG.COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.createJobButton} onPress={handleCreateJob}>
            <Icon name="add" size={24} color={CONFIG.COLORS.WHITE} />
            <Text style={styles.createJobText}>Request Service</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {jobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="build" size={48} color={CONFIG.COLORS.GRAY} />
              <Text style={styles.emptyStateTitle}>No jobs yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first service request to get started
              </Text>
              <TouchableOpacity style={styles.emptyStateButton} onPress={handleCreateJob}>
                <Text style={styles.emptyStateButtonText}>Request Service</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {jobs.slice(0, 5).map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobCard}
                  onPress={() => handleJobPress(job)}
                >
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                        {job.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.jobDescription} numberOfLines={2}>
                    {job.description}
                  </Text>
                  
                  <View style={styles.jobFooter}>
                    <View style={styles.jobMeta}>
                      <Icon name="category" size={16} color={CONFIG.COLORS.GRAY} />
                      <Text style={styles.jobMetaText}>{job.category}</Text>
                    </View>
                    
                    <View style={styles.jobMeta}>
                      <Icon name="schedule" size={16} color={CONFIG.COLORS.GRAY} />
                      <Text style={styles.jobMetaText}>{formatDate(job.createdAt.toString())}</Text>
                    </View>
                    
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(job.priority) }]}>
                        {job.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Icon name="pending" size={24} color={CONFIG.COLORS.WARNING} />
              <Text style={styles.statNumber}>
                {jobs.filter(job => job.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="build" size={24} color={CONFIG.COLORS.INFO} />
              <Text style={styles.statNumber}>
                {jobs.filter(job => job.status === 'in_progress').length}
              </Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            
            <View style={styles.statCard}>
              <Icon name="check-circle" size={24} color={CONFIG.COLORS.SUCCESS} />
              <Text style={styles.statNumber}>
                {jobs.filter(job => job.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  greeting: {
    fontSize: CONFIG.FONT_SIZES.XXLARGE,
    fontWeight: 'bold',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  subtitle: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    padding: CONFIG.DIMENSIONS.PADDING,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  createJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONFIG.COLORS.PRIMARY,
    padding: 16,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    gap: 8,
  },
  createJobText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    backgroundColor: CONFIG.COLORS.WHITE,
    padding: CONFIG.DIMENSIONS.PADDING,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: CONFIG.FONT_SIZES.XLARGE,
    fontWeight: 'bold',
    color: CONFIG.COLORS.DARK_GRAY,
  },
  seeAllText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.PRIMARY,
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
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
  },
  emptyStateButtonText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: CONFIG.COLORS.WHITE,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    padding: 16,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
    marginBottom: 12,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
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
  statsSection: {
    marginTop: 16,
    backgroundColor: CONFIG.COLORS.WHITE,
    padding: CONFIG.DIMENSIONS.PADDING,
    marginBottom: 20,
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
  },
});

export default HomeScreen; 