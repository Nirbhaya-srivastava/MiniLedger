import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LoanSummary } from '../types';

interface SummaryCardProps {
  summary: LoanSummary | null;
  onNewLoanClick: () => void;
  onFilterOverdueClick: () => void;
  phone?: string;
}

type CurrencyInfo = { locale: string; currency: string };

const CURRENCIES: Record<string, CurrencyInfo> = {
  '1': { locale: 'en-US', currency: 'USD' },
  '44': { locale: 'en-GB', currency: 'GBP' },
  '91': { locale: 'en-IN', currency: 'INR' },
  '61': { locale: 'en-AU', currency: 'AUD' },
  '64': { locale: 'en-NZ', currency: 'NZD' },
  '65': { locale: 'en-SG', currency: 'SGD' },
  '81': { locale: 'ja-JP', currency: 'JPY' },
  '82': { locale: 'ko-KR', currency: 'KRW' },
  '86': { locale: 'zh-CN', currency: 'CNY' },
  '971': { locale: 'ar-AE', currency: 'AED' },
  '966': { locale: 'ar-SA', currency: 'SAR' },
  '27': { locale: 'en-ZA', currency: 'ZAR' },
  '55': { locale: 'pt-BR', currency: 'BRL' },
  '52': { locale: 'es-MX', currency: 'MXN' },
  '41': { locale: 'de-CH', currency: 'CHF' },
  '49': { locale: 'de-DE', currency: 'EUR' },
  '33': { locale: 'fr-FR', currency: 'EUR' },
  '39': { locale: 'it-IT', currency: 'EUR' },
  '31': { locale: 'nl-NL', currency: 'EUR' },
  '353': { locale: 'en-IE', currency: 'EUR' },
  '46': { locale: 'sv-SE', currency: 'SEK' },
  '47': { locale: 'nb-NO', currency: 'NOK' },
  '45': { locale: 'da-DK', currency: 'DKK' },
  '90': { locale: 'tr-TR', currency: 'TRY' },
  '62': { locale: 'id-ID', currency: 'IDR' },
  '60': { locale: 'ms-MY', currency: 'MYR' },
  '63': { locale: 'en-PH', currency: 'PHP' },
  '66': { locale: 'th-TH', currency: 'THB' },
  '92': { locale: 'ur-PK', currency: 'PKR' },
  '880': { locale: 'bn-BD', currency: 'BDT' },
  '94': { locale: 'si-LK', currency: 'LKR' },
  '20': { locale: 'ar-EG', currency: 'EGP' },
  '234': { locale: 'en-NG', currency: 'NGN' },
  '254': { locale: 'en-KE', currency: 'KES' },
};

const getCurrency = (phone?: string): CurrencyInfo => {
  // Keep digits only, so "+81 90-1234" and "8190..." both work
  const digits = (phone || '').replace(/\D/g, '');

  // Match the longest calling code first, such as 971 before 97.
  const match = Object.keys(CURRENCIES)
    .sort((a, b) => b.length - a.length)
    .find((prefix) => digits.startsWith(prefix));

  return CURRENCIES[match || '91'];
};

const formatMoney = (amount: number, currencyInfo: CurrencyInfo) => {
  const value = Number(amount) || 0;

  try {
    // No forced decimals: JPY/KRW/IDR show 0, INR/USD/etc. show 2
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: currencyInfo.currency,
    }).format(value);
  } catch {
    return `${currencyInfo.currency} ${value.toFixed(2)}`;
  }
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  onNewLoanClick,
  onFilterOverdueClick,
  phone,
}) => {
  const currencyInfo = getCurrency(phone);

  const money = (amount: number) => formatMoney(amount, currencyInfo);

  const totalLent = summary?.totalLent ?? 0;
  const totalRepaid = summary?.totalRepaid ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;
  const totalPending = summary?.totalPending ?? 0;

  const repaidPercentage =
    totalLent > 0
      ? Math.min(100, Math.round((totalRepaid / totalLent) * 100))
      : 0;

  const overdueCount = summary?.overdueCount ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.categoryLabel}>MINILEDGER OVERVIEW</Text>
          <Text style={styles.subtitle}>Money Lent to Friends</Text>
        </View>

        <TouchableOpacity
          style={styles.lendButton}
          onPress={onNewLoanClick}
          accessibilityRole="button"
          accessibilityLabel="Create a new loan"
        >
          <Text style={styles.lendButtonText}>+ Lend</Text>
          <Feather name="arrow-up-right" size={14} color="#c7d2fe" />
        </TouchableOpacity>
      </View>

      <View style={styles.heroSection}>
        <Text style={styles.heroAmount}>{money(totalLent)}</Text>

        <View style={styles.subMetricRow}>
          <Ionicons name="checkmark-circle" size={14} color="#34d399" />
          <Text style={styles.repaidPercentText}>
            {repaidPercentage}% Repaid
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.pendingText}>
            {money(totalPending)} active balance
          </Text>
        </View>
      </View>

      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${repaidPercentage}%` },
          ]}
        />
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="trending-up" size={12} color="#818cf8" />
            <Text style={styles.metricLabel}>TOTAL LENT</Text>
          </View>
          <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
            {money(totalLent)}
          </Text>
          <Text style={styles.metricCount}>
            {summary?.totalCount ?? 0} loans
          </Text>
        </View>

        <View style={[styles.metricItem, styles.repaidItem]}>
          <View style={styles.metricLabelRow}>
            <Ionicons name="checkmark-done" size={12} color="#34d399" />
            <Text style={[styles.metricLabel, { color: '#34d399' }]}>
              REPAID
            </Text>
          </View>
          <Text
            style={[styles.metricValue, { color: '#6ee7b7' }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {money(totalRepaid)}
          </Text>
          <Text style={[styles.metricCount, { color: '#a7f3d0' }]}>
            {summary?.repaidCount ?? 0} settled
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.metricItem,
            overdueAmount > 0
              ? styles.overdueActiveItem
              : styles.overdueEmptyItem,
          ]}
          onPress={onFilterOverdueClick}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Filter overdue loans"
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
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {money(overdueAmount)}
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
    flexWrap: 'wrap',
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
    minWidth: 0,
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
