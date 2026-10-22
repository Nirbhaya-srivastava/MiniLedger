import React from 'react';
import { View, Text, Modal, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanEntry } from '../types.ts';

interface ReceiptModalProps {
  loan: LoanEntry | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ loan, onClose }) => {
  if (!loan || !loan.receiptUrl) return null;

  return (
    <Modal visible={!!loan} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Receipt Proof</Text>
              <Text style={styles.subtitle}>
                Lent to {loan.friendName} • ${Number(loan.amount).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: loan.receiptUrl }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </View>

          {/* Footer Info */}
          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
              <Text style={styles.infoText}>Due: {loan.dueDate}</Text>
            </View>
            {loan.notes ? (
              <Text style={styles.notesText} numberOfLines={1}>
                Note: {loan.notes}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 360,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  notesText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
});
