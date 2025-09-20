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
import { loginUser, clearError } from '../../store/authSlice';
import { CONFIG } from '../../config';
import LoadingSpinner from '../../components/LoadingSpinner';

const LoginScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateForm = () => {
    let isValid = true;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!CONFIG.VALIDATION.EMAIL_REGEX.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < CONFIG.VALIDATION.PASSWORD_MIN_LENGTH) {
      setPasswordError(`Password must be at least ${CONFIG.VALIDATION.PASSWORD_MIN_LENGTH} characters`);
      isValid = false;
    } else {
      setPasswordError('');
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(loginUser({ email, password }));
    } catch (error) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    }
  };

  const handleRegisterPress = () => {
    dispatch(clearError());
    navigation.navigate('Register');
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
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegisterPress}>
              <Text style={styles.registerLink}>Sign Up</Text>
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
    marginBottom: 40,
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
  loginButton: {
    height: CONFIG.DIMENSIONS.BUTTON_HEIGHT,
    backgroundColor: CONFIG.COLORS.PRIMARY,
    borderRadius: CONFIG.DIMENSIONS.BORDER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: CONFIG.COLORS.WHITE,
    fontSize: CONFIG.FONT_SIZES.LARGE,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerText: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.GRAY,
  },
  registerLink: {
    fontSize: CONFIG.FONT_SIZES.MEDIUM,
    color: CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default LoginScreen; 