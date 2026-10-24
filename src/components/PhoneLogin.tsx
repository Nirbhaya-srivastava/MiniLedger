import React, { useMemo, useState } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { requestOtp, verifyOtp } from '../lib/api.ts';
import { UserProfile } from '../types.ts';

interface PhoneLoginProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

type Country = {
  name: string;
  dialCode: string;
  minDigits: number;
  maxDigits: number;
};

// Common international calling codes. Add more countries here whenever needed.
const COUNTRIES: Country[] = [
  { name: 'India', dialCode: '+91', minDigits: 10, maxDigits: 10 },
  { name: 'United States', dialCode: '+1', minDigits: 10, maxDigits: 10 },
  { name: 'Canada', dialCode: '+1', minDigits: 10, maxDigits: 10 },
  { name: 'United Kingdom', dialCode: '+44', minDigits: 10, maxDigits: 10 },
  { name: 'Australia', dialCode: '+61', minDigits: 9, maxDigits: 9 },
  { name: 'United Arab Emirates', dialCode: '+971', minDigits: 9, maxDigits: 9 },
  { name: 'Singapore', dialCode: '+65', minDigits: 8, maxDigits: 8 },
  { name: 'New Zealand', dialCode: '+64', minDigits: 8, maxDigits: 10 },
  { name: 'Pakistan', dialCode: '+92', minDigits: 10, maxDigits: 10 },
  { name: 'Bangladesh', dialCode: '+880', minDigits: 10, maxDigits: 10 },
  { name: 'Nepal', dialCode: '+977', minDigits: 10, maxDigits: 10 },
  { name: 'Sri Lanka', dialCode: '+94', minDigits: 9, maxDigits: 9 },
  { name: 'Germany', dialCode: '+49', minDigits: 7, maxDigits: 13 },
  { name: 'France', dialCode: '+33', minDigits: 9, maxDigits: 9 },
  { name: 'Ireland', dialCode: '+353', minDigits: 7, maxDigits: 10 },
  { name: 'South Africa', dialCode: '+27', minDigits: 9, maxDigits: 9 },
  { name: 'Japan', dialCode: '+81', minDigits: 10, maxDigits: 10 },
  { name: 'China', dialCode: '+86', minDigits: 11, maxDigits: 11 },
  { name: 'Philippines', dialCode: '+63', minDigits: 10, maxDigits: 10 },
  { name: 'Malaysia', dialCode: '+60', minDigits: 9, maxDigits: 10 },
];

export const PhoneLogin: React.FC<PhoneLoginProps> = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const digitsOnlyPhone = phone.replace(/\D/g, '').slice(0, country.maxDigits);
  const fullPhone = `${country.dialCode}${digitsOnlyPhone}`;
  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.dialCode.includes(query)
    );
  }, [countrySearch]);

  const handleSendOtp = async () => {
    if (
      digitsOnlyPhone.length < country.minDigits ||
      digitsOnlyPhone.length > country.maxDigits
    ) {
      setError(
        `Enter a valid ${country.name} phone number (${country.minDigits}${country.minDigits === country.maxDigits ? '' : `–${country.maxDigits}`} digits).`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await requestOtp(fullPhone);
      setDevOtpHint(response.devOtpHint || null);
      setOtp('');
      setStep('OTP');
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Check the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{4,6}$/.test(otp.trim())) {
      setError('Enter the 4–6 digit verification code.');
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
      setError(err?.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountry = (item: Country) => {
    setCountry(item);
    setPhone((current) => current.replace(/\D/g, '').slice(0, item.maxDigits));
    setCountryPickerOpen(false);
    setCountrySearch('');
    setError(null);
  };

  const handleChangePhone = () => {
    setStep('PHONE');
    setOtp('');
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>ML</Text>
          </View>
          <Text style={styles.brandTitle}>MiniLedger</Text>
          <Text style={styles.brandSubtitle}>
            Track money lent to friends & repayments
          </Text>
        </View>

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
                  onPress={() => setCountryPickerOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose country code, currently ${country.name} ${country.dialCode}`}
                >
                  <Text style={styles.countryCodeText}>{country.dialCode}</Text>
                  <Ionicons name="chevron-down" size={14} color="#64748b" />
                </TouchableOpacity>

                <View style={styles.phoneInputContainer}>
                  <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    value={phone}
                    onChangeText={(value) => {
                      setPhone(value.replace(/\D/g, '').slice(0, country.maxDigits));
                      if (error) setError(null);
                    }}
                    placeholder={`Enter ${country.minDigits}${country.minDigits === country.maxDigits ? '' : `–${country.maxDigits}`} digits`}
                    placeholderTextColor="#94a3b8"
                    maxLength={country.maxDigits}
                    autoComplete="tel-national"
                    textContentType="telephoneNumber"
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.hintRow}>
                <MaterialCommunityIcons name="console-network" size={14} color="#6366f1" />
                <Text style={styles.hintText}>Mock OTP is logged in Node.js backend console</Text>
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
                <Text style={styles.fieldLabel}>ENTER OTP</Text>
                <TouchableOpacity onPress={handleChangePhone}>
                  <Text style={styles.changePhoneText}>Change number</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sentToText}>Code sent to {fullPhone}</Text>

              <View style={styles.otpInputContainer}>
                <Ionicons name="key-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
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
                  <TouchableOpacity style={styles.devAutoFillBtn} onPress={() => setOtp(devOtpHint.replace(/\D/g, '').slice(0, 6))}>
                    <Text style={styles.devAutoFillText}>Auto-Fill</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.verifyButton, (loading || otp.length < 4) && styles.buttonDisabled]}
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

              <TouchableOpacity style={styles.resendButton} onPress={handleSendOtp} disabled={loading}>
                <Text style={styles.resendText}>Didn't receive code? Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.footerRow}>
          <Ionicons name="shield-checkmark" size={14} color="#10b981" />
          <Text style={styles.footerText}>PostgreSQL Database & Express Server Verified</Text>
        </View>
      </ScrollView>

      <Modal
        visible={countryPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryPickerOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.countryModalOverlay}>
          <View style={styles.countryModal}>
            <View style={styles.countryModalHeader}>
              <View>
                <Text style={styles.countryModalTitle}>Choose country</Text>
                <Text style={styles.countryModalSubtitle}>Select your calling code</Text>
              </View>
              <TouchableOpacity
                style={styles.closeCountryButton}
                onPress={() => {
                  setCountryPickerOpen(false);
                  setCountrySearch('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Close country picker"
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.countrySearchContainer}>
              <Ionicons name="search-outline" size={18} color="#94a3b8" />
              <TextInput
                style={styles.countrySearchInput}
                value={countrySearch}
                onChangeText={setCountrySearch}
                placeholder="Search country or calling code"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item, index) => `${item.name}-${item.dialCode}-${index}`}
              keyboardShouldPersistTaps="handled"
              style={styles.countryList}
              ListEmptyComponent={<Text style={styles.noCountryText}>No countries found.</Text>}
              renderItem={({ item }) => {
                const selected = item.name === country.name;
                return (
                  <TouchableOpacity
                    style={[styles.countryRow, selected && styles.countryRowSelected]}
                    onPress={() => handleSelectCountry(item)}
                  >
                    <Text style={[styles.countryName, selected && styles.countryNameSelected]}>{item.name}</Text>
                    <View style={styles.countryCodeRight}>
                      <Text style={[styles.countryDialCode, selected && styles.countryNameSelected]}>{item.dialCode}</Text>
                      {selected ? <Ionicons name="checkmark-circle" size={18} color="#4f46e5" /> : null}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  brandContainer: { alignItems: 'center', marginBottom: 24 },
  logoBadge: { width: 60, height: 60, borderRadius: 18, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 },
  logoText: { color: '#ffffff', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  brandTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 13, color: '#64748b', marginTop: 4, textAlign: 'center' },
  card: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3', borderRadius: 12, padding: 10, marginBottom: 16 },
  errorIcon: { marginRight: 8 },
  errorText: { flex: 1, fontSize: 12, color: '#be123c', fontWeight: '500' },
  formSection: { width: '100%' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 0.6, marginBottom: 8 },
  phoneInputRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  countryCodeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  countryCodeText: { fontSize: 14, fontWeight: '700', color: '#334155' },
  phoneInputContainer: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  textInput: { flex: 1, minWidth: 0, fontSize: 14, color: '#0f172a', paddingVertical: 12, outlineStyle: 'none' as any },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 16 },
  hintText: { flex: 1, fontSize: 11, color: '#64748b' },
  primaryButton: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  verifyButton: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
  buttonDisabled: { opacity: 0.6 },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  otpHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  changePhoneText: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },
  sentToText: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  otpInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 },
  otpInput: { flex: 1, fontSize: 20, fontWeight: '700', color: '#0f172a', textAlign: 'center', letterSpacing: 8, paddingVertical: 10 },
  devBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe', borderRadius: 12, padding: 10, marginBottom: 16, gap: 8 },
  devBannerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  devBannerText: { flexShrink: 1, fontSize: 11, color: '#3730a3' },
  devOtpCode: { fontWeight: '900', color: '#4338ca' },
  devAutoFillBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  devAutoFillText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  resendButton: { marginTop: 14, alignItems: 'center' },
  resendText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  footerText: { fontSize: 11, color: '#94a3b8', fontWeight: '500', textAlign: 'center' },
  countryModalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.62)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  countryModal: { width: '100%', maxWidth: 440, maxHeight: '82%', backgroundColor: '#ffffff', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#e2e8f0' },
  countryModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  countryModalTitle: { fontSize: 19, fontWeight: '800', color: '#0f172a' },
  countryModalSubtitle: { fontSize: 12, color: '#64748b', marginTop: 3 },
  closeCountryButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  countrySearchContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 12, marginBottom: 10 },
  countrySearchInput: { flex: 1, minWidth: 0, paddingVertical: 11, fontSize: 14, color: '#0f172a', outlineStyle: 'none' as any },
  countryList: { flexGrow: 0 },
  countryRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, borderRadius: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  countryRowSelected: { backgroundColor: '#eef2ff' },
  countryName: { fontSize: 14, color: '#334155', fontWeight: '500' },
  countryNameSelected: { color: '#4338ca', fontWeight: '700' },
  countryCodeRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countryDialCode: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  noCountryText: { textAlign: 'center', padding: 24, color: '#64748b', fontSize: 13 },
});
