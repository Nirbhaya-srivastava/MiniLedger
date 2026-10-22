import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { requestOtp, verifyOtp } from '../lib/api.ts';
import { UserProfile } from '../types.ts';

interface PhoneLoginProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const PhoneLogin: React.FC<PhoneLoginProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('555-019-2834');
  const [countryCode, setCountryCode] = useState('+1');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const fullPhone = `${countryCode}${phone.replace(/\D/g, '')}`;

  const handleSendOtp = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 6) {
      setError('Please enter a valid phone number (at least 6 digits).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestOtp(fullPhone);
      setDevOtpHint(response.devOtpHint || null);
      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch OTP. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the verification OTP code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyOtp(fullPhone, otp.trim());
      const token = response.sessionToken || response.customToken || '';

      onLoginSuccess(
        response.user || {
          uid: response.uid,
          phone: response.phone,
          displayName: `User (${response.phone})`,
        },
        token
      );
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo and Brand Title */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>ML</Text>
          </View>
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandSubtitle}>Track money lent to friends & repayments</Text>
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#e11d48" style={styles.errorIcon} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === 'PHONE' ? (
            <View style={styles.formSection}>
              <Text style={styles.fieldLabel}>PHONE NUMBER LOGIN</Text>

              <View style={styles.phoneInputRow}>
                <TouchableOpacity
                  style={styles.countryCodeButton}
                  onPress={() => setCountryCode(countryCode === '+1' ? '+44' : '+1')}
                >
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>

                <View style={styles.phoneInputContainer}>
                  <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="555-019-2834"
                    placeholderTextColor="#94a3b8"
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.hintRow}>
                <MaterialCommunityIcons name="console-network" size={14} color="#6366f1" />
                <Text style={styles.hintText}>
                  Mock OTP is logged in Node.js backend console
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                    <Ionicons name="arrow-forward" size={16} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formSection}>
              <View style={styles.otpHeaderRow}>
                <Text style={styles.fieldLabel}>ENTER 6-DIGIT OTP</Text>
                <TouchableOpacity onPress={() => setStep('PHONE')}>
                  <Text style={styles.changePhoneText}>Change</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.otpInputContainer}>
                <Ionicons name="key-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(val) => setOtp(val.replace(/\D/g, ''))}
                  placeholder="------"
                  placeholderTextColor="#cbd5e1"
                  autoFocus
                />
              </View>

              {devOtpHint ? (
                <View style={styles.devBanner}>
                  <View style={styles.devBannerInfo}>
                    <Ionicons name="flash" size={14} color="#4f46e5" />
                    <Text style={styles.devBannerText}>
                      Server Log OTP: <Text style={styles.devOtpCode}>{devOtpHint}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.devAutoFillBtn}
                    onPress={() => setOtp(devOtpHint)}
                  >
                    <Text style={styles.devAutoFillText}>Auto-Fill</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.verifyButton,
                  (loading || otp.length < 4) && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={loading || otp.length < 4}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={styles.primaryButtonText}>Verify & Access Ledger</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleSendOtp}
                disabled={loading}
              >
                <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Security Footer */}
        <View style={styles.footerRow}>
          <Ionicons name="shield-checkmark" size={14} color="#10b981" />
          <Text style={styles.footerText}>PostgreSQL Database & Express Server Verified</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#be123c',
    fontWeight: '500',
  },
  formSection: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 12,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 16,
  },
  hintText: {
    fontSize: 11,
    color: '#64748b',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changePhoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  otpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  otpInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 10,
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  devBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  devBannerText: {
    fontSize: 11,
    color: '#3730a3',
  },
  devOtpCode: {
    fontWeight: '900',
    color: '#4338ca',
  },
  devAutoFillBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  devAutoFillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  resendButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
