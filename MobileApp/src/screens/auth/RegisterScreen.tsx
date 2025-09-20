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
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'customer' as 'customer' | 'mechanic',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    };

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!CONFIG.VALIDATION.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!CONFIG.VALIDATION.PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} characters`;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const { confirmPassword, ...registerData } = formData;
      await dispatch(registerUser(registerData));
    } catch (error) {
      Alert.alert('Registration Failed', 'Please check your information and try again.');
    }
  };

  const handleLoginPress = () => {
    dispatch(clearError());
    navigation.navigate('Login');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join our mechanic community</Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              autoCapitalize="words"
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : null]}
              placeholder="Enter your email"
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone ? styles.inputError : null]}
              placeholder="Enter your phone number"
              value={formData.phone}
              onChangeText={(value) => updateFormData('phone', value)}
              keyboardType="phone-pad"
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : null]}
              placeholder="Enter your password"
              value={formData.password}
              onChangeText={(value) => updateFormData('password', value)}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={[styles.input, errors.confirmPassword ? styles.inputError : null]}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChangeText={(value) => updateFormData('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          <View style={styles.userTypeContainer}>
            <Text style={styles.label}>I am a:</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'customer' && styles.userTypeButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, userType: 'customer' }))}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  formData.userType === 'customer' && styles.userTypeButtonTextActive
                ]}>
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  formData.userType === 'mechanic' && styles.userTypeButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, userType: 'mechanic' }))}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  formData.userType === 'mechanic' && styles.userTypeButtonTextActive
                ]}>
                  Mechanic
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: CONFIG.DIMENSIONS.PADDING,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: CONFIG.FONT_SIZES.HEADER,
    fontWeight: 'bold',
    color: CONFIG.COLORS.DARK_GRAY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    color: CONFIG.COLORS.GRAY,
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: CONFIG.COLORS.ERROR + '20',
    padding: 12,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    fontWeight: '600',
    color: CONFIG.COLORS.DARK_GRAY,
    marginBottom: 8,
  },
  input: {
    height: CONFIG.DIMENSIONS.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    paddingHorizontal: 16,
    fontSize: CONFIG.FONT_SIZES.LARGE,
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  inputError: {
    borderColor: CONFIG.COLORS.ERROR,
  },
  errorText: {
    color: CONFIG.COLORS.ERROR,
    fontSize: CONFIG.FONT_SIZES.SMALL,
    marginTop: 4,
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  userTypeButton: {
    flex: 1,
    height: CONFIG.DIMENSIONS.INPUT_HEIGHT,
    borderWidth: 1,
    borderColor: CONFIG.COLORS.LIGHT_GRAY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CONFIG.COLORS.WHITE,
  },
  userTypeButtonActive: {
    borderColor: CONFIG.COLORS.PRIMARY,
    backgroundColor: CONFIG.COLORS.PRIMARY + '10',
  },
  userTypeButtonText: {
    fontSize: CONFIG.FONT_SIZES.LARGE,
    color: CONFIG.COLORS.GRAY,
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  registerButton: {
    height: CONFIG.DIMENSIONS.BUTTON_HEIGHT,
    backgroundColor: CONFIG.COLORS.PRIMARY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  loginText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
  },
  loginLink: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default RegisterScreen; 