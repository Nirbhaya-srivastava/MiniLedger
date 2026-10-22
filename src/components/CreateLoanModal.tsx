import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { createLoanApi } from '../lib/api.ts';
import { LoanEntry } from '../types.ts';

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoanCreated: (loan: LoanEntry) => void;
}

const SAMPLE_RECEIPT_URL =
  'https://images.unsplash.com/photo-1554415707-9e4466b88738?auto=format&fit=crop&w=400&q=80';

export const CreateLoanModal: React.FC<CreateLoanModalProps> = ({
  isOpen,
  onClose,
  onLoanCreated,
}) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setQuickDays = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    setError(null);
    const cleanName = friendName.trim();
    if (!cleanName) {
      setError('Please provide your friend’s name.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid loan amount (greater than 0).');
      return;
    }

    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setError('Please enter a valid due date (YYYY-MM-DD).');
      return;
    }

    setLoading(true);

    try {
      const created = await createLoanApi({
        friendName: cleanName,
        amount: numericAmount,
        dueDate,
        notes: notes.trim() || undefined,
        receiptUrl: receiptUrl || undefined,
      });

      onLoanCreated(created);
      onClose();
      // Reset form
      setFriendName('');
      setAmount('');
      setNotes('');
      setReceiptUrl(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save loan entry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="cash-outline" size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>New Loan Entry</Text>
                <Text style={styles.headerSubtitle}>Record money lent to a friend</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#e11d48" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Friend Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FRIEND'S NAME *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#94a3b8" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={friendName}
                  onChangeText={setFriendName}
                  placeholder="e.g. Sarah Jenkins"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Name suggestions */}
              <View style={styles.pillRow}>
                {['Alex', 'Jordan', 'Sam', 'Taylor', 'Chris'].map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={styles.suggestionPill}
                    onPress={() => setFriendName(name)}
                  >
                    <Text style={styles.suggestionText}>+{name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>LOAN AMOUNT ($) *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  style={[styles.textInput, styles.amountInput]}
                  keyboardType="decimal-pad"
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Amount Quick Presets */}
              <View style={styles.pillRow}>
                {[20, 50, 100, 200].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={styles.presetPill}
                    onPress={() => setAmount(val.toString())}
                  >
                    <Text style={styles.presetPillText}>${val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>REPAYMENT DUE DATE (YYYY-MM-DD) *</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={18} color="#94a3b8" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-10-30"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              {/* Due Date Quick Presets */}
              <View style={styles.pillRow}>
                <TouchableOpacity style={styles.datePill} onPress={() => setQuickDays(3)}>
                  <Text style={styles.datePillText}>+3 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.datePill, styles.activeDatePill]} onPress={() => setQuickDays(7)}>
                  <Text style={styles.activeDatePillText}>+1 Week</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.datePill} onPress={() => setQuickDays(14)}>
                  <Text style={styles.datePillText}>+2 Weeks</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.datePill} onPress={() => setQuickDays(30)}>
                  <Text style={styles.datePillText}>+1 Month</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>REASON / NOTES (OPTIONAL)</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  numberOfLines={2}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Split dinner bill, concert ticket share"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* Receipt Photo (Bonus Feature) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>ATTACH RECEIPT PROOF</Text>
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusBadgeText}>BONUS</Text>
                </View>
              </View>

              {receiptUrl ? (
                <View style={styles.receiptPreviewCard}>
                  <Image source={{ uri: receiptUrl }} style={styles.receiptThumb} />
                  <View style={styles.receiptPreviewInfo}>
                    <Text style={styles.receiptAttachedText}>Receipt Photo Attached</Text>
                    <TouchableOpacity onPress={() => setReceiptUrl(null)}>
                      <Text style={styles.receiptRemoveText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadBox}
                  onPress={() => setReceiptUrl(SAMPLE_RECEIPT_URL)}
                >
                  <Ionicons name="camera-outline" size={24} color="#6366f1" />
                  <Text style={styles.uploadTitle}>Attach Receipt Photo</Text>
                  <Text style={styles.uploadSubtitle}>Tap to attach sample receipt photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <View style={styles.submitContent}>
                  <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Save Loan Entry</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#e0e7ff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 20,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#be123c',
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  fieldIcon: {
    marginRight: 8,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: '#64748b',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 12,
  },
  amountInput: {
    fontSize: 18,
    fontWeight: '800',
  },
  textArea: {
    height: 50,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  suggestionPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  suggestionText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  presetPill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  datePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activeDatePill: {
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  datePillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  activeDatePillText: {
    fontSize: 11,
    color: '#4338ca',
    fontWeight: '700',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bonusBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bonusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6d28d9',
  },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c7d2fe',
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338ca',
  },
  uploadSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  receiptPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 8,
    gap: 12,
  },
  receiptThumb: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  receiptPreviewInfo: {
    flex: 1,
  },
  receiptAttachedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  receiptRemoveText: {
    fontSize: 11,
    color: '#e11d48',
    fontWeight: '600',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
