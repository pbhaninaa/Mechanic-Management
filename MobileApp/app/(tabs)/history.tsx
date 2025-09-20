import { StyleSheet, FlatList } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';

import { Text, View } from '@/components/Themed';

export default function HistoryScreen() {
  const { jobs } = useSelector((state: RootState) => state.jobs);

  const renderJobItem = ({ item }: { item: any }) => (
    <View style={styles.jobItem}>
      <Text style={styles.jobTitle}>{item.serviceType}</Text>
      <Text style={styles.jobStatus}>Status: {item.status}</Text>
      <Text style={styles.jobDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job History</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      {jobs.length > 0 ? (
        <FlatList
          data={jobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      ) : (
        <Text style={styles.noJobs}>No job history available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  list: {
    width: '100%',
  },
  jobItem: {
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  jobStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  jobDate: {
    fontSize: 12,
    color: '#999',
  },
  noJobs: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
