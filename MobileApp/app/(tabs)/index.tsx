import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/src/store';
import { createJob } from '@/src/store/jobSlice';

import { Text, View } from '@/components/Themed';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isLoading } = useSelector((state: RootState) => state.jobs);

  const handleRequestMechanic = () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to request a mechanic');
      return;
    }

    // Mock job creation for demo purposes
    const mockJobData = {
      serviceType: 'Diagnostics',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY'
      },
      description: 'Car won\'t start, need diagnostic service'
    };

    dispatch(createJob(mockJobData) as any);
    Alert.alert('Success', 'Mechanic request sent!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Request Mechanic</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Need roadside assistance? Request a mechanic to come to your location.
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleRequestMechanic}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Requesting...' : 'Request Mechanic'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.services}>
          <Text style={styles.servicesTitle}>Available Services:</Text>
          <Text style={styles.serviceItem}>• Battery Jump Start</Text>
          <Text style={styles.serviceItem}>• Tire Change</Text>
          <Text style={styles.serviceItem}>• Fuel Delivery</Text>
          <Text style={styles.serviceItem}>• Towing Service</Text>
          <Text style={styles.serviceItem}>• Diagnostics</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  services: {
    width: '100%',
    alignItems: 'flex-start',
  },
  servicesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  serviceItem: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
});
