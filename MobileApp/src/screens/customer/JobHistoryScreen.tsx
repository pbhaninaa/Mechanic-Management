import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchMyJobs, rateJob } from '../../store/jobSlice';
import { CONFIG } from '../../config';
import LoadingSpinner from '../../components/LoadingSpinner';
import Icon from 'react-native-vector-icons/MaterialIcons';

const JobHistoryScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { jobs, isLoading } = useSelector((state: RootState) => state.jobs);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filteredJobs, setFilteredJobs] = useState(jobs);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery, statusFilter]);

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

  const filterJobs = () => {
    let filtered = jobs;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  };

  const handleJobPress = (job: any) => {
    // Navigate to job details screen
    // navigation.navigate('JobDetails', { jobId: job.id });
    Alert.alert('Job Details', `Job: ${job.title}\nStatus: ${job.status}`);
  };

  const handleRateJob = (job: any) => {
    Alert.prompt(
      'Rate this job',
      'How would you rate this service? (1-5 stars)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async (rating) => {
            if (rating && !isNaN(Number(rating)) && Number(rating) >= 1 && Number(rating) <= 5) {
              try {
                await dispatch(
                  rateJob({
                  jobId: job.id,
                  rating: { stars: Number(rating), review: '' }
                }));
                Alert.alert('Success', 'Thank you for your rating!');
              } catch (error) {
                Alert.alert('Error', 'Failed to submit rating. Please try again.');
              }
            } else {
              Alert.alert('Invalid Rating', 'Please enter a number between 1 and 5.');
            }
          }
        }
      ],
      'plain-text',
      '5'
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

  const renderJobItem = ({ item: job }: { item: any }) => (
    <TouchableOpacity style={styles.jobCard} onPress={() => handleJobPress(job)}>
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
      
      <View style={styles.jobMeta}>
        <View style={styles.metaItem}>
          <Icon name="category" size={16} color={CONFIG.COLORS.GRAY} />
          <Text style={styles.metaText}>{job.category}</Text>
        </View>
        
        <View style={styles.metaItem}>
          <Icon name="schedule" size={16} color={CONFIG.COLORS.GRAY} />
          <Text style={styles.metaText}>{formatDate(job.createdAt.toString())}</Text>
        </View>
        
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(job.priority) + '20' }]}>
          <Text style={[styles.priorityText, { color: getPriorityColor(job.priority) }]}>
            {job.priority.toUpperCase()}
          </Text>
        </View>
      </View>

      {job.status === 'completed' && !job.customerRating && (
        <TouchableOpacity style={styles.rateButton} onPress={() => handleRateJob(job)}>
          <Icon name="star" size={16} color={CONFIG.COLORS.WARNING} />
          <Text style={styles.rateButtonText}>Rate this job</Text>
        </TouchableOpacity>
      )}

      {job.customerRating && (
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color={CONFIG.COLORS.WARNING} />
          <Text style={styles.ratingText}>{job.customerRating}/5</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="history" size={48} color={CONFIG.COLORS.GRAY} />
      <Text style={styles.emptyStateTitle}>No jobs found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || statusFilter !== 'all' 
          ? 'Try adjusting your search or filters'
          : 'You haven\'t created any service requests yet'
        }
      </Text>
    </View>
  );

  if (isLoading && !refreshing) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={CONFIG.COLORS.GRAY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color={CONFIG.COLORS.GRAY} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterText, statusFilter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {CONFIG.JOB_STATUSES.map((status) => (
              <TouchableOpacity
                key={status.value}
                style={[styles.filterButton, statusFilter === status.value && styles.filterButtonActive]}
                onPress={() => setStatusFilter(status.value)}
              >
                <Text style={[styles.filterText, statusFilter === status.value && styles.filterTextActive]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: CONFIG.COLORS.LIGHT_GRAY,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: CONFIG.COLORS.PRIMARY,
  },
  filterText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.GRAY,
    fontWeight: '500',
  },
  filterTextActive: {
    color: CONFIG.COLORS.WHITE,
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
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
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
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONFIG.COLORS.WARNING + '20',
    paddingVertical: 8,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    gap: 4,
  },
  rateButtonText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.WARNING,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONFIG.COLORS.SUCCESS + '20',
    paddingVertical: 8,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    gap: 4,
  },
  ratingText: {
    fontSize: CONFIG.FONT_SIZES.SMALL,
    color: CONFIG.COLORS.SUCCESS,
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

export default JobHistoryScreen; 