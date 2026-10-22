import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { runServerTests } from '../lib/api.ts';
import { TestRunReport } from '../types.ts';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<TestRunReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunTests = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await runServerTests();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute test suite.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="console-line" size={18} color="#ffffff" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Backend Tests</Text>
                <Text style={styles.headerSubtitle}>PostgreSQL & Express API Integration</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.infoBanner}>
              <Ionicons name="information-circle" size={16} color="#4f46e5" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                Tests execute against the Node.js Express backend and PostgreSQL database to verify user upsert, loan insertion, summary math, and repayment mutations.
              </Text>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#e11d48" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {report ? (
              <View style={styles.reportSection}>
                <View style={styles.summaryBar}>
                  <Text style={styles.summaryLabel}>Test Suite Result</Text>
                  <View
                    style={[
                      styles.statusPill,
                      report.success ? styles.statusPillSuccess : styles.statusPillFail,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        report.success ? styles.statusSuccessText : styles.statusFailText,
                      ]}
                    >
                      {report.passedTests} / {report.totalTests} Passed
                    </Text>
                  </View>
                </View>

                {report.results.map((item, idx) => (
                  <View key={idx} style={styles.testItem}>
                    <Ionicons
                      name={item.passed ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={item.passed ? '#059669' : '#e11d48'}
                    />
                    <View style={styles.testItemInfo}>
                      <Text style={styles.testItemName}>{item.name}</Text>
                      <Text style={styles.testItemMessage}>{item.message}</Text>
                    </View>
                    <Text style={styles.testItemDuration}>{item.durationMs}ms</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.runButton, running && styles.buttonDisabled]}
              onPress={handleRunTests}
              disabled={running}
            >
              {running ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="play" size={16} color="#ffffff" />
                  <Text style={styles.runButtonText}>
                    {report ? 'Re-run Tests' : 'Run Backend Tests'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: '#94a3b8',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#3730a3',
    lineHeight: 18,
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
  },
  reportSection: {
    gap: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillSuccess: {
    backgroundColor: '#d1fae5',
  },
  statusPillFail: {
    backgroundColor: '#fee2e2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusSuccessText: {
    color: '#047857',
  },
  statusFailText: {
    color: '#be123c',
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  testItemInfo: {
    flex: 1,
  },
  testItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  testItemMessage: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  testItemDuration: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  runButton: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4f46e5',
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
    gap: 6,
  },
  runButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
