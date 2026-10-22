import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LoanEntry } from '../types.ts';

interface LoanListProps {
  loans: LoanEntry[];
  loading?: boolean;
  filter: 'all' | 'pending' | 'repaid' | 'overdue';
  onFilterChange: (f: 'all' | 'pending' | 'repaid' | 'overdue') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleRepaid: (loanId: number, currentStatus: boolean) => void;
  onDeleteLoan: (loanId: number) => void;
  onViewReceipt: (loan: LoanEntry) => void;
  onNewLoanClick: () => void;
}

export const LoanList: React.FC<LoanListProps> = ({
  loans,
  loading,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onToggleRepaid,
  onDeleteLoan,
  onViewReceipt,
  onNewLoanClick,
}) => {
  const getAvatarColor = (name: string) => {
    const colors = ['#4f46e5', '#7c3aed', '#059669', '#d97706', '#0284c7'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search friend name or note..."
          placeholderTextColor="#94a3b8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'overdue', label: '⚠️ Overdue' },
          { id: 'repaid', label: 'Settled' },
        ].map((tab) => {
          const isActive = filter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                isActive && (tab.id === 'overdue' ? styles.filterTabOverdueActive : styles.filterTabActive),
              ]}
              onPress={() => onFilterChange(tab.id as any)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  isActive && styles.filterTabActiveText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List Items */}
      {loading && loans.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#4f46e5" size="small" />
          <Text style={styles.loadingText}>Loading ledger entries...</Text>
        </View>
      ) : loans.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="receipt-outline" size={28} color="#6366f1" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery
              ? 'No matching loans found'
              : filter === 'overdue'
              ? 'No overdue loans! Everything is clear.'
              : 'No loans recorded yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try searching with another name.'
              : 'Tap below to record the first amount you lent to a friend.'}
          </Text>
          {!searchQuery ? (
            <TouchableOpacity style={styles.emptyButton} onPress={onNewLoanClick}>
              <Text style={styles.emptyButtonText}>+ Record Loan</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <View style={styles.listSection}>
          {loans.map((loan) => {
            const isOverdue = !loan.isRepaid && loan.dueDate < today;

            return (
              <View
                key={loan.id}
                style={[
                  styles.loanCard,
                  loan.isRepaid
                    ? styles.loanCardRepaid
                    : isOverdue
                    ? styles.loanCardOverdue
                    : styles.loanCardPending,
                ]}
              >
                {/* Overdue Warning Tag */}
                {isOverdue ? (
                  <View style={styles.overdueBanner}>
                    <Ionicons name="warning" size={13} color="#e11d48" />
                    <Text style={styles.overdueBannerText}>
                      OVERDUE • Due {loan.dueDate} (
                      {loan.daysDifference ? `${Math.abs(loan.daysDifference)}d past` : 'Past due'}
                      )
                    </Text>
                  </View>
                ) : null}

                <View style={styles.cardMainRow}>
                  {/* Left: Avatar & Info */}
                  <View style={styles.cardLeft}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: getAvatarColor(loan.friendName) },
                      ]}
                    >
                      <Text style={styles.avatarText}>{getInitials(loan.friendName)}</Text>
                    </View>

                    <View style={styles.infoCol}>
                      <View style={styles.nameRow}>
                        <Text style={styles.friendName}>{loan.friendName}</Text>

                        {/* Status Chip */}
                        {loan.isRepaid ? (
                          <View style={styles.repaidChip}>
                            <Ionicons name="checkmark-circle" size={11} color="#059669" />
                            <Text style={styles.repaidChipText}>Repaid</Text>
                          </View>
                        ) : (
                          <View style={styles.dueChip}>
                            <Ionicons name="time-outline" size={11} color="#4f46e5" />
                            <Text style={styles.dueChipText}>Due {loan.dueDate}</Text>
                          </View>
                        )}
                      </View>

                      {loan.notes ? (
                        <Text style={styles.notesText} numberOfLines={1}>
                          {loan.notes}
                        </Text>
                      ) : null}

                      {/* Receipt button if attached */}
                      {loan.receiptUrl ? (
                        <TouchableOpacity
                          style={styles.receiptBadge}
                          onPress={() => onViewReceipt(loan)}
                        >
                          <Ionicons name="image-outline" size={12} color="#4f46e5" />
                          <Text style={styles.receiptBadgeText}>View Receipt</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>

                  {/* Right: Amount & Action Buttons */}
                  <View style={styles.cardRight}>
                    <Text
                      style={[
                        styles.amountText,
                        loan.isRepaid && styles.amountRepaid,
                        isOverdue && styles.amountOverdue,
                      ]}
                    >
                      ${Number(loan.amount).toFixed(2)}
                    </Text>

                    <View style={styles.actionsRow}>
                      {/* Repay Toggle Button */}
                      <TouchableOpacity
                        style={[
                          styles.repayToggleBtn,
                          loan.isRepaid ? styles.undoBtn : styles.markRepaidBtn,
                        ]}
                        onPress={() => onToggleRepaid(loan.id, loan.isRepaid)}
                      >
                        <Ionicons
                          name={loan.isRepaid ? 'refresh' : 'checkmark'}
                          size={13}
                          color="#ffffff"
                        />
                        <Text style={styles.repayToggleText}>
                          {loan.isRepaid ? 'Undo' : 'Repaid'}
                        </Text>
                      </TouchableOpacity>

                      {/* Delete Button */}
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDeleteLoan(loan.id)}
                      >
                        <Feather name="trash-2" size={13} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  filterTabActive: {
    backgroundColor: '#4f46e5',
  },
  filterTabOverdueActive: {
    backgroundColor: '#e11d48',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabActiveText: {
    color: '#ffffff',
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  emptyButton: {
    marginTop: 14,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  listSection: {
    gap: 10,
  },
  loanCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  loanCardPending: {
    borderColor: '#e2e8f0',
  },
  loanCardRepaid: {
    backgroundColor: '#f8fafc',
    opacity: 0.85,
  },
  loanCardOverdue: {
    backgroundColor: '#fff1f2',
    borderColor: '#fca5a5',
    borderWidth: 1.5,
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  overdueBannerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#be123c',
  },
  cardMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  friendName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  repaidChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  repaidChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  dueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  dueChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4338ca',
  },
  notesText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eef2ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  receiptBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  amountRepaid: {
    color: '#059669',
    textDecorationLine: 'line-through',
  },
  amountOverdue: {
    color: '#e11d48',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repayToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  markRepaidBtn: {
    backgroundColor: '#059669',
  },
  undoBtn: {
    backgroundColor: '#64748b',
  },
  repayToggleText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 5,
  },
});
