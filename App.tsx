import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { PhoneLogin } from './src/components/PhoneLogin.tsx';
import { SummaryCard } from './src/components/SummaryCard.tsx';
import { LoanList } from './src/components/LoanList.tsx';
import { CreateLoanModal } from './src/components/CreateLoanModal.tsx';
import { ReceiptModal } from './src/components/ReceiptModal.tsx';
import { TestRunnerModal } from './src/components/TestRunnerModal.tsx';
import {
  fetchLoans,
  fetchSummary,
  toggleLoanRepayment,
  deleteLoanApi,
  createLoanApi,
  getStoredAuth,
  clearStoredAuth,
} from './src/lib/api.ts';
import { LoanEntry, LoanSummary, UserProfile } from './src/types.ts';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Ledger state
  const [loans, setLoans] = useState<LoanEntry[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'repaid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceiptLoan, setSelectedReceiptLoan] = useState<LoanEntry | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  // Check stored auth session
  useEffect(() => {
    const authInfo = getStoredAuth();
    if (authInfo.token && authInfo.uid) {
      setCurrentUser({
        uid: authInfo.uid,
        phone: authInfo.phone,
        displayName: `User (${authInfo.phone || authInfo.uid})`,
      });
    }
    setAuthLoading(false);
  }, []);

  // Fetch loans and summary
  const loadLedgerData = useCallback(async () => {
    if (!currentUser) return;
    setDataLoading(true);
    try {
      const [loansData, summaryData] = await Promise.all([
        fetchLoans({ filter, search: searchQuery }),
        fetchSummary(),
      ]);
      setLoans(loansData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading ledger data:', err);
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, filter, searchQuery]);

  useEffect(() => {
    if (currentUser) {
      loadLedgerData();
    }
  }, [currentUser, loadLedgerData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLedgerData();
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    loadLedgerData();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of MiniLedger?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          clearStoredAuth();
          setCurrentUser(null);
          setLoans([]);
          setSummary(null);
        },
      },
    ]);
  };

  const handleToggleRepaid = async (loanId: number, currentStatus: boolean) => {
    // Optimistic UI update
    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, isRepaid: !currentStatus } : l))
    );

    try {
      await toggleLoanRepayment(loanId, !currentStatus);
      const newSummary = await fetchSummary();
      setSummary(newSummary);
    } catch (err) {
      console.error('Failed to update repayment:', err);
      loadLedgerData();
    }
  };

  const handleDeleteLoan = (loanId: number) => {
    Alert.alert('Delete Loan', 'Are you sure you want to delete this loan record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLoanApi(loanId);
            setLoans((prev) => prev.filter((l) => l.id !== loanId));
            const newSummary = await fetchSummary();
            setSummary(newSummary);
          } catch (err) {
            console.error('Failed to delete loan:', err);
          }
        },
      },
    ]);
  };

  const handleLoanCreated = (newLoan: LoanEntry) => {
    setLoans((prev) => [newLoan, ...prev]);
    fetchSummary().then(setSummary).catch(console.error);
  };

  const handleSeedDemoData = async () => {
    setSeedingLoading(true);
    try {
      const today = new Date();
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 5); // 5 days overdue
      const futureDate1 = new Date();
      futureDate1.setDate(today.getDate() + 4);
      const futureDate2 = new Date();
      futureDate2.setDate(today.getDate() + 14);

      await Promise.all([
        createLoanApi({
          friendName: 'Alex Rivera',
          amount: 85.0,
          dueDate: pastDate.toISOString().split('T')[0], // Overdue!
          notes: 'Split concert tickets & drinks',
          receiptUrl:
            'https://images.unsplash.com/photo-1554415707-9e4466b88738?auto=format&fit=crop&w=400&q=80',
        }),
        createLoanApi({
          friendName: 'Sarah Jenkins',
          amount: 42.5,
          dueDate: futureDate1.toISOString().split('T')[0],
          notes: 'Airport taxi ride share',
        }),
        createLoanApi({
          friendName: 'Samir Patel',
          amount: 150.0,
          dueDate: futureDate2.toISOString().split('T')[0],
          notes: 'Weekend trip cabin rental',
        }),
      ]);

      await loadLedgerData();
    } catch (err) {
      console.error('Failed to seed demo data:', err);
    } finally {
      setSeedingLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.splashScreen}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.splashText}>Initializing MiniLedger...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Mobile Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>ML</Text>
          </View>
          <View>
            <Text style={styles.appTitle}>MiniLedger</Text>
            <Text style={styles.appSubtitle}>Friend Loan Tracker</Text>
          </View>
        </View>

        {currentUser ? (
          <View style={styles.headerActions}>
            {/* Backend Tests Modal Button */}
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => setIsTestModalOpen(true)}
            >
              <Feather name="terminal" size={14} color="#4f46e5" />
              <Text style={styles.testBtnText}>Tests</Text>
            </TouchableOpacity>

            {/* User Chip */}
            <View style={styles.userChip}>
              <Ionicons name="person-circle" size={16} color="#64748b" />
              <Text style={styles.userPhoneText} numberOfLines={1}>
                {currentUser.phone || 'Friend'}
              </Text>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#e11d48" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* Main Screen Body */}
      {!currentUser ? (
        <PhoneLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <View style={styles.contentContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
            }
          >
            {/* Summary Card at Top */}
            <SummaryCard
              summary={summary}
              onNewLoanClick={() => setIsCreateOpen(true)}
              onFilterOverdueClick={() => setFilter('overdue')}
            />

            {/* Quick Demo Seed helper if list is empty */}
            {loans.length === 0 && !dataLoading ? (
              <View style={styles.seedBanner}>
                <View style={styles.seedBannerInfo}>
                  <Ionicons name="sparkles" size={16} color="#4f46e5" />
                  <Text style={styles.seedBannerText}>
                    Load sample loans with overdue alert & receipts
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.seedButton}
                  onPress={handleSeedDemoData}
                  disabled={seedingLoading}
                >
                  {seedingLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.seedButtonText}>Load Demo</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Loan Entries List */}
            <LoanList
              loans={loans}
              loading={dataLoading}
              filter={filter}
              onFilterChange={setFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onToggleRepaid={handleToggleRepaid}
              onDeleteLoan={handleDeleteLoan}
              onViewReceipt={(loan) => setSelectedReceiptLoan(loan)}
              onNewLoanClick={() => setIsCreateOpen(true)}
            />
          </ScrollView>

          {/* Floating Action Bar / Bottom Bar */}
          <View style={styles.bottomBar}>
            <View style={styles.bottomFilterRow}>
              <TouchableOpacity
                style={[styles.bottomTab, filter === 'all' && styles.bottomTabActive]}
                onPress={() => setFilter('all')}
              >
                <Text
                  style={[
                    styles.bottomTabText,
                    filter === 'all' && styles.bottomTabActiveText,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.bottomTab, filter === 'pending' && styles.bottomTabActive]}
                onPress={() => setFilter('pending')}
              >
                <Text
                  style={[
                    styles.bottomTabText,
                    filter === 'pending' && styles.bottomTabActiveText,
                  ]}
                >
                  Active
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.bottomTab,
                  filter === 'overdue' && styles.bottomTabOverdueActive,
                ]}
                onPress={() => setFilter('overdue')}
              >
                <Text
                  style={[
                    styles.bottomTabText,
                    filter === 'overdue' && styles.bottomTabOverdueActiveText,
                  ]}
                >
                  Overdue
                </Text>
              </TouchableOpacity>
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.fabButton}
              onPress={() => setIsCreateOpen(true)}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.fabText}>New Loan</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modals */}
      <CreateLoanModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onLoanCreated={handleLoanCreated}
      />

      <ReceiptModal
        loan={selectedReceiptLoan}
        onClose={() => setSelectedReceiptLoan(null)}
      />

      <TestRunnerModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  splashScreen: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  splashText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  appTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  appSubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: -1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  testBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    maxWidth: 110,
  },
  userPhoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  logoutBtn: {
    padding: 6,
    backgroundColor: '#fff1f2',
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  seedBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  seedBannerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seedBannerText: {
    flex: 1,
    fontSize: 11,
    color: '#3730a3',
    fontWeight: '500',
  },
  seedButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  seedButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  bottomFilterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bottomTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  bottomTabActive: {
    backgroundColor: '#0f172a',
  },
  bottomTabOverdueActive: {
    backgroundColor: '#e11d48',
  },
  bottomTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  bottomTabActiveText: {
    color: '#ffffff',
  },
  bottomTabOverdueActiveText: {
    color: '#ffffff',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
