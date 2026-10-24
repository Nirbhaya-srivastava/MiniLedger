import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { PhoneLogin } from './src/components/PhoneLogin';
import { SummaryCard } from './src/components/SummaryCard';
import { LoanList } from './src/components/LoanList';
import { CreateLoanModal } from './src/components/CreateLoanModal';
import { ReceiptModal } from './src/components/ReceiptModal';
import { TestRunnerModal } from './src/components/TestRunnerModal';
import {
  fetchLoans,
  fetchSummary,
  toggleLoanRepayment,
  deleteLoanApi,
  createLoanApi,
  getStoredAuth,
  clearStoredAuth,
} from './src/lib/api';
import { LoanEntry, LoanSummary, UserProfile } from './src/types';

export default function App() {
  const { width } = useWindowDimensions();
  const compactHeader = width < 640;

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [loans, setLoans] = useState<LoanEntry[]>([]);
  const [summary, setSummary] = useState<LoanSummary | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'repaid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedReceiptLoan, setSelectedReceiptLoan] = useState<LoanEntry | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Guards against out-of-order responses overwriting newer data
  const requestIdRef = useRef(0);

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

  const loadLedgerData = useCallback(async () => {
    if (!currentUser) return;

    const requestId = ++requestIdRef.current;
    setDataLoading(true);

    try {
      const [loansData, summaryData] = await Promise.all([
        fetchLoans({ filter, search: searchQuery }),
        fetchSummary(),
      ]);

      if (requestId !== requestIdRef.current) return; // stale response

      setLoans(loansData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error loading ledger data:', err);
    } finally {
      if (requestId === requestIdRef.current) {
        setDataLoading(false);
        setRefreshing(false);
      }
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
  };

  const handleLogout = () => {
    clearStoredAuth();
    requestIdRef.current++; // invalidate in-flight requests
    setCurrentUser(null);
    setLoans([]);
    setSummary(null);
    setFilter('all');
    setSearchQuery('');
    setIsCreateOpen(false);
    setSelectedReceiptLoan(null);
    setIsTestModalOpen(false);
    setDeleteModalVisible(false);
    setSelectedLoanId(null);
    setRefreshing(false);
    setDataLoading(false);
  };

  const handleToggleRepaid = async (loanId: number, currentStatus: boolean) => {
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === loanId ? { ...loan, isRepaid: !currentStatus } : loan
      )
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
    setSelectedLoanId(loanId);
    setDeleteModalVisible(true);
  };

  const confirmDeleteLoan = async () => {
    if (selectedLoanId === null || deleteLoading) return;

    const loanId = selectedLoanId;
    setDeleteLoading(true);

    try {
      await deleteLoanApi(loanId);
      setLoans((prev) => prev.filter((loan) => loan.id !== loanId));

      const updatedSummary = await fetchSummary();
      setSummary(updatedSummary);

      setDeleteModalVisible(false);
      setSelectedLoanId(null);
    } catch (err) {
      console.error('Failed to delete loan:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;

    setDeleteModalVisible(false);
    setSelectedLoanId(null);
  };

  const handleLoanCreated = (newLoan: LoanEntry) => {
    // Only insert locally when it matches the active view; otherwise reload
    const matchesFilter = filter === 'all' || filter === 'pending';
    const matchesSearch =
      !searchQuery ||
      newLoan.friendName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (matchesFilter && matchesSearch) {
      setLoans((prev) => [newLoan, ...prev]);
      fetchSummary().then(setSummary).catch(console.error);
    } else {
      loadLedgerData();
    }
  };

  const handleSeedDemoData = async () => {
    setSeedingLoading(true);

    try {
      const today = new Date();

      const pastDate = new Date();
      pastDate.setDate(today.getDate() - 5);

      const futureDate1 = new Date();
      futureDate1.setDate(today.getDate() + 4);

      const futureDate2 = new Date();
      futureDate2.setDate(today.getDate() + 14);

      await Promise.all([
        createLoanApi({
          friendName: 'Alex Rivera',
          amount: 85.0,
          dueDate: pastDate.toISOString().split('T')[0],
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

  const headerActions = currentUser ? (
    <View
      style={[
        styles.headerActions,
        compactHeader && styles.headerActionsMobile,
      ]}
    >
      <TouchableOpacity
        style={styles.testBtn}
        onPress={() => setIsTestModalOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Open backend tests"
      >
        <Feather name="terminal" size={15} color="#4f46e5" />
        <Text style={styles.testBtnText}>Tests</Text>
      </TouchableOpacity>

      <View style={[styles.userChip, compactHeader && styles.userChipMobile]}>
        <Ionicons name="person-circle" size={17} color="#64748b" />
        <Text
          style={styles.userPhoneText}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {currentUser.phone || 'Friend'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="log-out-outline" size={21} color="#e11d48" />
      </TouchableOpacity>
    </View>
  ) : null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />

        {/* Responsive Header */}
        <View
          style={[
            styles.header,
            compactHeader ? styles.headerCompact : styles.headerWide,
          ]}
        >
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>ML</Text>
            </View>

            <View style={styles.brandText}>
              <Text style={styles.appTitle} numberOfLines={1}>
                MiniLedger
              </Text>
              <Text style={styles.appSubtitle} numberOfLines={1}>
                Friend Loan Tracker
              </Text>
            </View>
          </View>

          {headerActions}
        </View>

        {/* Main Screen Body */}
        {!currentUser ? (
          <PhoneLogin onLoginSuccess={handleLoginSuccess} />
        ) : (
          <View style={styles.contentContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4f46e5']}
                />
              }
            >
              <SummaryCard
                summary={summary}
                onNewLoanClick={() => setIsCreateOpen(true)}
                onFilterOverdueClick={() => setFilter('overdue')}
                phone={currentUser.phone ?? undefined}
              />

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
                    accessibilityRole="button"
                  >
                    {seedingLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.seedButtonText}>Load Demo</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}

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
                phone={currentUser.phone ?? undefined}
              />
            </ScrollView>

            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.fabButton}
                onPress={() => setIsCreateOpen(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Create a new loan"
              >
                <Ionicons name="add" size={20} color="#ffffff" />
                <Text style={styles.fabText}>New Loan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModalVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={closeDeleteModal}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalCard}>
              <View style={styles.deleteIconCircle}>
                <Ionicons name="trash-outline" size={28} color="#fb7185" />
              </View>

              <Text style={styles.deleteModalTitle}>Delete this loan?</Text>
              <Text style={styles.deleteModalMessage}>
                Are you sure you want to delete this loan record? This action
                cannot be undone.
              </Text>

              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  style={[
                    styles.deleteCancelButton,
                    deleteLoading && styles.disabledButton,
                  ]}
                  onPress={closeDeleteModal}
                  disabled={deleteLoading}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.deleteCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.deleteConfirmButton,
                    deleteLoading && styles.disabledButton,
                  ]}
                  onPress={confirmDeleteLoan}
                  disabled={deleteLoading}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  {deleteLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={16} color="#ffffff" />
                      <Text style={styles.deleteConfirmText}>Delete Loan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Other Modals */}
        <CreateLoanModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onLoanCreated={handleLoanCreated}
          phone={currentUser?.phone ?? undefined}
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    minWidth: 0,
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

  /* Header */
  header: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },

  headerCompact: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },

  headerWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },

  brandText: {
    flexShrink: 1,
    minWidth: 0,
  },

  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
    marginTop: 1,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },

  headerActionsMobile: {
    width: '100%',
    justifyContent: 'flex-start',
    flexShrink: 1,
  },

  testBtn: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    flexShrink: 0,
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
    height: 36,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 220,
  },

  userChipMobile: {
    flex: 1, // takes leftover space so logout is never pushed out
    maxWidth: '100%',
  },

  userPhoneText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },

  logoutBtn: {
    width: 40,
    height: 36,
    flexShrink: 0, // never shrinks or gets clipped
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },

  contentContainer: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#f8fafc',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
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

  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  deleteModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },

  deleteIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#321b28',
    borderWidth: 1,
    borderColor: '#5b2639',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  deleteModalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },

  deleteModalMessage: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 26,
  },

  deleteModalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },

  deleteCancelButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#172033',
  },

  deleteCancelText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },

  deleteConfirmButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteConfirmText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.6,
  },
});
