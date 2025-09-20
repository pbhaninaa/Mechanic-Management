import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';

import { Text, View } from '@/components/Themed';

export default function ProfileScreen() {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      {user ? (
        <View style={styles.profileInfo}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{user.name}</Text>
          
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
          
          <Text style={styles.label}>Role:</Text>
          <Text style={styles.value}>{user.role}</Text>
          
          {user.phone && (
            <>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{user.phone}</Text>
            </>
          )}
        </View>
      ) : (
        <Text style={styles.noUser}>Please log in to view your profile</Text>
      )}
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
  profileInfo: {
    width: '100%',
    maxWidth: 300,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#666',
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
    paddingLeft: 10,
  },
  noUser: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
