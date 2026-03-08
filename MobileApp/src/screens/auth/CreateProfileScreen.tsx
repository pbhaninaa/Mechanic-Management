import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { createProfile } from '../../store/authSlice';
import { CONFIG } from '../../config';
import LoadingSpinner from '../../components/LoadingSpinner';

const ROLES = [
  { value: 'CLIENT', label: 'Customer' },
  { value: 'MECHANIC', label: 'Mechanic' },
  { value: 'CARWASH', label: 'Car Wash' },
];

const CreateProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    role: 'CLIENT',
    numberOfEmployees: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const username = (user as any)?.username || user?.name || (user as any)?.email?.split?.('@')?.[0] || '';

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = 'First name required';
    if (!form.lastName.trim()) e.lastName = 'Last name required';
    if (!form.email.trim()) e.email = 'Email required';
    else if (!CONFIG.VALIDATION.EMAIL_REGEX.test(form.email)) e.email = 'Invalid email';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'Phone required';
    else if (!CONFIG.VALIDATION.PHONE_REGEX.test(form.phoneNumber)) e.phoneNumber = 'Invalid phone';
    if ((form.role === 'MECHANIC' || form.role === 'CARWASH') && !form.address?.trim()) {
      e.address = 'Address required for Mechanic/Car Wash (clients need directions)';
    }
    if (form.role === 'MECHANIC' || form.role === 'CARWASH') {
      const n = parseInt(form.numberOfEmployees?.trim() ?? '', 10);
      if (!Number.isInteger(n) || n < 1) {
        e.numberOfEmployees = 'Number of employees is required (at least 1)';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !username) return;
    const numberOfEmployees =
      (form.role === 'MECHANIC' || form.role === 'CARWASH')
        ? Math.max(1, parseInt(form.numberOfEmployees?.trim() ?? '1', 10))
        : undefined;
    const result = await dispatch(createProfile({
      username,
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      countryCode: '+27',
      address: form.address.trim() || undefined,
      roles: [form.role],
      numberOfEmployees,
    }));
    if (createProfile.rejected.match(result)) {
      const msg = (result.payload as string) || error || 'Failed to create profile';
      Alert.alert('Error', msg);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Set up your profile to use the app</Text>
        </View>
        {error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={[styles.input, styles.inputDisabled]} value={username} editable={false} />
        </View>
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput style={[styles.input, errors.firstName ? styles.inputError : null]} placeholder="First name" value={form.firstName} onChangeText={v => update('firstName', v)} />
            {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput style={[styles.input, errors.lastName ? styles.inputError : null]} placeholder="Last name" value={form.lastName} onChangeText={v => update('lastName', v)} />
            {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput style={[styles.input, errors.email ? styles.inputError : null]} placeholder="email@example.com" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone *</Text>
          <TextInput style={[styles.input, errors.phoneNumber ? styles.inputError : null]} placeholder="e.g. 0812345678" value={form.phoneNumber} onChangeText={v => update('phoneNumber', v)} keyboardType="phone-pad" />
          {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Address {(form.role === 'MECHANIC' || form.role === 'CARWASH') ? '* (required for clients to get directions)' : '(optional)'}
          </Text>
          <TextInput style={[styles.input, errors.address ? styles.inputError : null]} placeholder="Your address or workshop location" value={form.address} onChangeText={v => update('address', v)} />
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>I am a</Text>
          <View style={styles.roleRow}>
            {ROLES.map(r => (
              <TouchableOpacity key={r.value} style={[styles.roleBtn, form.role === r.value && styles.roleBtnActive]} onPress={() => update('role', r.value)}>
                <Text style={[styles.roleBtnText, form.role === r.value && styles.roleBtnTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {(form.role === 'MECHANIC' || form.role === 'CARWASH') && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Employees *</Text>
            <TextInput
              style={[styles.input, errors.numberOfEmployees ? styles.inputError : null]}
              placeholder="e.g. 2"
              value={form.numberOfEmployees}
              onChangeText={v => update('numberOfEmployees', v)}
              keyboardType="number-pad"
            />
            {errors.numberOfEmployees ? <Text style={styles.errorText}>{errors.numberOfEmployees}</Text> : null}
            <Text style={styles.hint}>Limits how many paid jobs you can have at once.</Text>
          </View>
        )}
        <TouchableOpacity style={styles.btn} onPress={handleSave}>
          <Text style={styles.btnText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONFIG.COLORS.WHITE },
  scroll: { padding: CONFIG.DIMENSIONS.PADDING, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: CONFIG.FONT_SIZES.HEADER, fontWeight: 'bold', color: CONFIG.COLORS.DARK_GRAY },
  subtitle: { fontSize: CONFIG.FONT_SIZES.MEDIUM, color: CONFIG.COLORS.GRAY, marginTop: 8 },
  errorBanner: { backgroundColor: CONFIG.COLORS.ERROR + '20', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: CONFIG.COLORS.ERROR, fontSize: CONFIG.FONT_SIZES.SMALL, marginTop: 4 },
  inputGroup: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: CONFIG.FONT_SIZES.MEDIUM, fontWeight: '600', marginBottom: 8 },
  input: { height: CONFIG.DIMENSIONS.INPUT_HEIGHT, borderWidth: 1, borderColor: CONFIG.COLORS.LIGHT_GRAY, borderRadius: 8, paddingHorizontal: 16 },
  inputError: { borderColor: CONFIG.COLORS.ERROR },
  inputDisabled: { backgroundColor: CONFIG.COLORS.LIGHT_GRAY + '80', color: CONFIG.COLORS.GRAY },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleBtn: { flex: 1, height: 44, borderWidth: 1, borderColor: CONFIG.COLORS.LIGHT_GRAY, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  roleBtnActive: { borderColor: CONFIG.COLORS.PRIMARY, backgroundColor: CONFIG.COLORS.PRIMARY + '15' },
  roleBtnText: { fontSize: CONFIG.FONT_SIZES.MEDIUM, color: CONFIG.COLORS.GRAY },
  roleBtnTextActive: { color: CONFIG.COLORS.PRIMARY, fontWeight: '600' },
  hint: { fontSize: CONFIG.FONT_SIZES.SMALL, color: CONFIG.COLORS.GRAY, marginTop: 4 },
  btn: { height: CONFIG.DIMENSIONS.BUTTON_HEIGHT, backgroundColor: CONFIG.COLORS.PRIMARY, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: CONFIG.FONT_SIZES.LARGE, fontWeight: '600' },
});

export default CreateProfileScreen;
