import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CONFIG } from '../../config';
import apiService from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PaymentScreen = ({ route, navigation }: any) => {
  const { bookingId, amount, jobDes, mechanicId, carWashId, isCarWash } = route.params || {};
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Mobile Money' | 'Card'>('Bank Transfer');
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<{ username?: string } | null>(null);
  React.useEffect(() => {
    AsyncStorage.getItem('user').then((s) => {
      if (s) setUser(JSON.parse(s));
    });
  }, []);

  const clientUsername = user?.username || '';
  const methods: Array<'Bank Transfer' | 'Mobile Money' | 'Card'> = ['Bank Transfer', 'Mobile Money', 'Card'];

  const processPayment = async () => {
    if (!bookingId || !amount || !clientUsername || loading) return;
    setLoading(true);
    try {
      const payload: any = { jobId: bookingId, amount: Number(amount), clientUsername };
      if (mechanicId) payload.mechanicId = mechanicId;
      if (carWashId) payload.carWashId = carWashId;
      if (isCarWash && !carWashId) {
        const bookingRes = await apiService.getCarWashBookingById(bookingId);
        const b = bookingRes.data;
        if (b?.carWashId) payload.carWashId = b.carWashId;
      }

      if (paymentMethod === 'Card') {
        Alert.alert('Card Payment', 'Card payments require Stripe. Use Bank Transfer or Mobile Money for now.');
        setLoading(false);
        return;
      }

      await apiService.createPayment(payload);

      if (!isCarWash && mechanicId) {
        await apiService.updateJob(bookingId, { status: 'paid', mechanicId });
      } else if (isCarWash) {
        const bookingRes = await apiService.getCarWashBookingById(bookingId);
        const booking = bookingRes.data;
        if (booking) {
          const carWashIdForPayment = carWashId || booking.carWashId;
          if (carWashIdForPayment && !payload.carWashId) payload.carWashId = carWashIdForPayment;
          booking.status = 'paid';
          await apiService.updateCarWashBooking(bookingId, booking);
        }
      }

      Alert.alert('Success', 'Payment recorded successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => `R ${Number(val).toFixed(2)}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Payment</Text>
      <Text style={styles.subtitle}>Complete your payment for the service below</Text>

      <View style={styles.summary}>
        <View style={styles.row}>
          <Text>Client:</Text>
          <Text style={styles.bold}>{clientUsername}</Text>
        </View>
        <View style={styles.row}>
          <Text>Booking ID:</Text>
          <Text style={styles.bold}>{bookingId}</Text>
        </View>
        <View style={styles.row}>
          <Text>Description:</Text>
          <Text style={styles.bold}>{jobDes || 'Service'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Amount:</Text>
          <Text style={styles.bold}>{formatCurrency(Number(amount))}</Text>
        </View>
      </View>

      <Text style={styles.methodLabel}>Payment Method</Text>
      {methods.map((m) => (
        <TouchableOpacity
          key={m}
          style={[styles.methodOption, paymentMethod === m && styles.methodOptionActive]}
          onPress={() => setPaymentMethod(m)}
        >
          <Icon name={m === 'Card' ? 'credit-card' : m === 'Mobile Money' ? 'phone-android' : 'account-balance'} size={24} color={paymentMethod === m ? '#fff' : CONFIG.COLORS.GRAY} />
          <Text style={[styles.methodText, paymentMethod === m && styles.methodTextActive]}>{m}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={processPayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirm Payment</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONFIG.COLORS.LIGHT_GRAY },
  content: { padding: CONFIG.DIMENSIONS.PADDING },
  title: { fontSize: CONFIG.FONT_SIZES.TITLE, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: CONFIG.FONT_SIZES.MEDIUM, color: CONFIG.COLORS.GRAY, marginBottom: 24 },
  summary: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bold: { fontWeight: '600' },
  methodLabel: { fontSize: CONFIG.FONT_SIZES.LARGE, fontWeight: '600', marginBottom: 12 },
  methodOption: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderRadius: 8, marginBottom: 8, gap: 12 },
  methodOptionActive: { backgroundColor: CONFIG.COLORS.PRIMARY },
  methodText: { fontSize: CONFIG.FONT_SIZES.MEDIUM },
  methodTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: CONFIG.COLORS.PRIMARY, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: CONFIG.FONT_SIZES.LARGE, fontWeight: '600' },
});

export default PaymentScreen;
