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
import { registerUser, clearError } from '../../store/authSlice';
import { CONFIG } from '../../config';
import LoadingSpinner from '../../components/LoadingSpinner';

const RegisterScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({ username: '', password: '', confirmPassword: '' });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.username.trim()) e.username = 'Username is required';
    else if (formData.username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) e.password = `Password must be at least ${CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await dispatch(registerUser({ username: formData.username.trim(), password: formData.password }));
      Alert.alert('Success', 'Account created! Sign in to complete your profile.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch {
      Alert.alert('Error', error || 'Registration failed');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Create your user account. After signing in, you'll set up your profile.</Text>
        </View>
        {error && <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View>}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput style={[styles.input, errors.username ? styles.inputError : null]} placeholder="Choose a username" value={formData.username} onChangeText={v => updateField('username', v)} autoCapitalize="none" />
          {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={[styles.input, errors.password ? styles.inputError : null]} placeholder="Password" value={formData.password} onChangeText={v => updateField('password', v)} secureTextEntry />
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput style={[styles.input, errors.confirmPassword ? styles.inputError : null]} placeholder="Confirm password" value={formData.confirmPassword} onChangeText={v => updateField('confirmPassword', v)} secureTextEntry />
          {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
        </View>
        <TouchableOpacity style={styles.btn} onPress={handleRegister}>
          <Text style={styles.btnText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginLink} onPress={() => { dispatch(clearError()); navigation.navigate('Login'); }}>
          <Text style={styles.loginText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CONFIG.COLORS.WHITE },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: CONFIG.DIMENSIONS.PADDING },
  header: { alignItems: 'center', marginBottom: 24 },
  title: { fontSize: CONFIG.FONT_SIZES.HEADER, fontWeight: 'bold', color: CONFIG.COLORS.DARK_GRAY },
  subtitle: { fontSize: CONFIG.FONT_SIZES.MEDIUM, color: CONFIG.COLORS.GRAY, textAlign: 'center', marginTop: 8 },
  errorBanner: { backgroundColor: CONFIG.COLORS.ERROR + '20', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: CONFIG.COLORS.ERROR, fontSize: CONFIG.FONT_SIZES.SMALL, marginTop: 4 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: CONFIG.FONT_SIZES.MEDIUM, fontWeight: '600', marginBottom: 8 },
  input: { height: CONFIG.DIMENSIONS.INPUT_HEIGHT, borderWidth: 1, borderColor: CONFIG.COLORS.LIGHT_GRAY, borderRadius: 8, paddingHorizontal: 16 },
  inputError: { borderColor: CONFIG.COLORS.ERROR },
  btn: { height: CONFIG.DIMENSIONS.BUTTON_HEIGHT, backgroundColor: CONFIG.COLORS.PRIMARY, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  btnText: { color: '#fff', fontSize: CONFIG.FONT_SIZES.LARGE, fontWeight: '600' },
  loginLink: { alignItems: 'center', marginTop: 24 },
  loginText: { color: CONFIG.COLORS.PRIMARY, fontWeight: '600' },
});

export default RegisterScreen;
