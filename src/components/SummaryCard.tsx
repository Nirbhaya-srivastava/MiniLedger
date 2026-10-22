import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LoanSummary } from '../types.ts';

interface SummaryCardProps {
  summary: LoanSummary | null;
  onNewLoanClick: () => void;
  onFilterOverdueClick: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  onNewLoanClick,
  onFilterOverdueClick,
}) => {
  const totalLent = summary?.totalLent || 0;
  const totalRepaid = summary?.totalRepaid || 0;
  const overdueAmount = summary?.overdueAmount || 0;
  const totalPending = summary?.totalPending || 0;

  const repaidPercentage = totalLent > 0 ? Math.min(100, Math.round((totalRepaid / totalLent) * 100)) : 0;
  const overdueCount = summary?.overdueCount || 0;

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.categoryLabel}>MINILEDGER OVERVIEW</Text>
          <Text style={styles.subtitle}>Money Lent to Friends</Text>
        </View>

        <TouchableOpacity style={styles.lendButton} onPress={onNewLoanClick}>
          <Text style={styles.lendButtonText}>+ Lend</Text>
          <Feather name="arrow-up-right" size={14} color="#c7d2fe" />
        </TouchableOpacity>
      </View>

      {/* Hero Number: Total Lent */}
      <View style={styles.heroSection}>
        <Text style={styles.heroAmount}>
          ${totalLent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View style={styles.subMetricRow}>
          <Ionicons name="checkmark-circle" size={14} color="#34d399" />
          <Text style={styles.repaidPercentText}>{repaidPercentage}% Repaid</Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.pendingText}>${totalPending.toFixed(2)} active balance</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View style={[styles.progressBarFill, { width: `${repaidPercentage}%` }]} />
      </View>

      {/* 3 Metric Columns: Total Lent, Total Repaid, Overdue Amount */}
      <View style={styles.metricsGrid}>
        {/* Metric 1: Total Lent */}
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="trending-up" size={12} color="#818cf8" />
            <Text style={styles.metricLabel}>TOTAL LENT</Text>
          </View>
          <Text style={styles.metricValue}>${totalLent.toFixed(2)}</Text>
          <Text style={styles.metricCount}>{summary?.totalCount || 0} loans</Text>
        </View>

        {/* Metric 2: Total Repaid */}
        <View style={[styles.metricItem, styles.repaidItem]}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="checkmark-done" size={12} color="#34d399" />
            <Text style={[styles.metricLabel, { color: '#34d399' }]}>REPAID</Text>
          </View>
          <Text style={[styles.metricValue, { color: '#6ee7b7' }]}>${totalRepaid.toFixed(2)}</Text>
          <Text style={[styles.metricCount, { color: '#a7f3d0' }]}>
            {summary?.repaidCount || 0} settled
          </Text>
        </View>

        {/* Metric 3: Overdue Amount */}
        <TouchableOpacity
          style={[
            styles.metricItem,
            overdueAmount > 0 ? styles.overdueActiveItem : styles.overdueEmptyItem,
          ]}
          onPress={onFilterOverdueClick}
          activeOpacity={0.8}
        >
          <View style={styles.metricLabelRow}>
            <Ionicons
              name="alert-circle"
              size={12}
              color={overdueAmount > 0 ? '#fb7185' : '#94a3b8'}
            />
            <Text
              style={[
                styles.metricLabel,
                { color: overdueAmount > 0 ? '#fb7185' : '#94a3b8' },
              ]}
            >
              OVERDUE
            </Text>
          </View>
          <Text
            style={[
              styles.metricValue,
              { color: overdueAmount > 0 ? '#fda4af' : '#cbd5e1' },
            ]}
          >
            ${overdueAmount.toFixed(2)}
          </Text>
          <Text
            style={[
              styles.metricCount,
              { color: overdueAmount > 0 ? '#fecdd3' : '#64748b' },
            ]}
          >
            {overdueCount > 0 ? `${overdueCount} overdue` : 'None'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  lendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lendButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c7d2fe',
  },
  heroSection: {
    marginBottom: 14,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  subMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  repaidPercentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34d399',
  },
  dotSeparator: {
    color: '#64748b',
    fontSize: 12,
  },
  pendingText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 14,
  },
  metricItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  repaidItem: {
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  overdueActiveItem: {
    backgroundColor: 'rgba(225, 29, 72, 0.18)',
    borderColor: 'rgba(251, 113, 133, 0.35)',
  },
  overdueEmptyItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  metricCount: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
});
