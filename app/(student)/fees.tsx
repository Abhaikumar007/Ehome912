import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, RefreshControl, Image, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { feesData as defaultFees } from '../../constants/mockData';
import { DataService } from '../../lib/dataService';
import { useAuth } from '../../lib/authContext';

const UPI_APPS = [
  { label: 'G Pay', icon: 'logo-google', color: '#4285F4', bg: '#EBF3FF' },
  { label: 'PhonePe', icon: 'phone-portrait-outline', color: '#5F259F', bg: '#F5F3FF' },
  { label: 'Paytm', icon: 'wallet-outline', color: '#00BAF2', bg: '#E0F7FE' },
  { label: 'Other UPI', icon: 'flash-outline', color: Colors.amber, bg: Colors.amberLight },
];

// Target Tuition Center UPI ID & Payee details (Hardcoded as requested)
const HARDCODED_UPI_ID = 'devitintu12345@oksbi';
const HARDCODED_PAYEE_NAME = 'EduHome Tuition Center';

export default function FeesScreen() {
  const router = useRouter();
  const { student } = useAuth();
  const [fees, setFees] = useState(defaultFees);
  const [refreshing, setRefreshing] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [allPaymentsModalVisible, setAllPaymentsModalVisible] = useState(false);
  const [allPaymentsHistory, setAllPaymentsHistory] = useState<any[]>([]);
  const [utrInput, setUtrInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rollNo = student?.rollNo || '2024-JEE-0842';

  const loadData = async () => {
    try {
      const [res, hist] = await Promise.all([
        DataService.getFees(rollNo),
        DataService.getFullPaymentHistory(rollNo),
      ]);
      if (res) setFees(res);
      if (hist) setAllPaymentsHistory(hist);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, [rollNo]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch {}
    setRefreshing(false);
  };

  const handlePayUPI = async (appLabel?: string) => {
    // Strictly ₹1 formatted with 2 decimals (1.00) as required by NPCI standard
    const amount = '1.00';
    // Clean alphanumeric note without special characters (dashes/parentheses cause SBI/GPay gateway errors)
    const note = 'EduHome Tuition Fee';
    const genericUpi = `upi://pay?pa=${encodeURIComponent(HARDCODED_UPI_ID)}&pn=${encodeURIComponent(HARDCODED_PAYEE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

    let targetUrl = genericUpi;
    if (appLabel === 'PhonePe') {
      targetUrl = `phonepe://pay?pa=${encodeURIComponent(HARDCODED_UPI_ID)}&pn=${encodeURIComponent(HARDCODED_PAYEE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    } else if (appLabel === 'Paytm') {
      targetUrl = `paytmmp://pay?pa=${encodeURIComponent(HARDCODED_UPI_ID)}&pn=${encodeURIComponent(HARDCODED_PAYEE_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    }
    // Note: For GPay, generic upi://pay works reliably across all Android/iOS versions without merchant checks

    try {
      const canOpen = await Linking.canOpenURL(targetUrl);
      if (canOpen) {
        await Linking.openURL(targetUrl);
      } else {
        const canGeneric = await Linking.canOpenURL(genericUpi);
        if (canGeneric) {
          await Linking.openURL(genericUpi);
        } else {
          Alert.alert(
            'UPI Payment (₹1)',
            `UPI ID: ${HARDCODED_UPI_ID}\nName: ${HARDCODED_PAYEE_NAME}\nAmount: ₹1\n\nPlease transfer ₹1 to ${HARDCODED_UPI_ID} using Google Pay, PhonePe, or Paytm.`,
            [
              { text: 'Copy UPI ID', onPress: () => Alert.alert('Copied', `UPI ID: ${HARDCODED_UPI_ID}`) },
              { text: 'OK' }
            ]
          );
        }
      }
    } catch (e) {
      Alert.alert(
        'UPI Payment (₹1)',
        `UPI ID: ${HARDCODED_UPI_ID}\nName: ${HARDCODED_PAYEE_NAME}\nAmount: ₹1\n\nPay directly via Google Pay, PhonePe, or Paytm to: ${HARDCODED_UPI_ID}`
      );
    }

    // Auto prompt verification submission modal
    setTimeout(() => {
      setUtrInput(`UPI-${Date.now().toString().slice(-6)}`);
      setVerificationModalVisible(true);
    }, 1200);
  };

  const handleSubmitVerification = async () => {
    setSubmitting(true);
    try {
      const updated = await DataService.submitFeePayment(rollNo, utrInput);
      setFees(updated);
      setVerificationModalVisible(false);
      Alert.alert(
        'Submitted for Superadmin Approval',
        `Your payment proof of ₹1 has been sent to Super Admin Mr. R Madhusudanan.\n\nOnce received and approved, your dashboard and profile will immediately update to Paid.`,
        [{ text: 'OK' }]
      );
    } catch {
      Alert.alert('Error', 'Could not submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Instant simulation helper for quick testing
  const handleSuperAdminInstantApprove = async () => {
    try {
      const updated = await DataService.approveFeePayment(rollNo);
      setFees(updated);
      Alert.alert(
        'Superadmin Approved ✓',
        'Payment of ₹1 has been verified and approved by Mr. R Madhusudanan.\n\nStudent dashboard, home alert banner, and profile status are now cleared and marked as Paid!',
        [{ text: 'Awesome' }]
      );
    } catch {
      Alert.alert('Error', 'Approval failed');
    }
  };

  const handleResetForTesting = async () => {
    try {
      const reset = await DataService.resetFeePayment(rollNo);
      setFees(reset);
      Alert.alert('Reset', 'Fee status has been reset back to ₹1 Due for testing.');
    } catch {}
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/eduhome.png')}
            style={{ width: 34, height: 34, borderRadius: 8 }}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>EDU HOME</Text>
            <Text style={styles.headerSub}>YOUR SECOND HOME</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.classPill}>
            <Text style={styles.classPillText}>{student?.class || 'Class 12'}</Text>
            <Ionicons name="chevron-down" size={13} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(student)/profile')}>
            {student?.photoUrl ? (
              <Image source={{ uri: student.photoUrl }} style={{ width: 34, height: 34, borderRadius: 17 }} />
            ) : (
              <View style={styles.avatar}><Text style={styles.avatarText}>{student?.avatar || 'AS'}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Fees</Text>
          <View style={styles.taglineBox}>
            <Text style={styles.tagline}>Invest Today{'\n'}Brighter{'\n'}Tomorrow</Text>
            <Ionicons name="heart-outline" size={14} color={Colors.primary} style={{ marginTop: 4 }} />
          </View>
        </View>
        <Text style={styles.pageSub}>Your support keeps the learning going!</Text>

        {/* Fee Status Card */}
        {fees.isPaid ? (
          <View style={[styles.feeStatusCard, styles.paidCard]}>
            <View style={styles.paidContent}>
              <View style={styles.paidHeaderRow}>
                <View style={styles.paidIconCircle}>
                  <Ionicons name="checkmark-circle" size={26} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paidTitle}>September Fees Cleared</Text>
                  <Text style={styles.paidSub}>Verified by Super Admin Mr. R Madhusudanan ✓</Text>
                </View>
                <View style={styles.receiptBadge}>
                  <Text style={styles.receiptText}>Receipt Active ✓</Text>
                </View>
              </View>

              <View style={styles.paidDivider} />

              <View style={styles.paidMetaRow}>
                <View>
                  <Text style={styles.paidMetaLabel}>Amount Paid</Text>
                  <Text style={styles.paidMetaVal}>₹ 1.00</Text>
                </View>
                <View>
                  <Text style={styles.paidMetaLabel}>Target UPI ID</Text>
                  <Text style={styles.paidMetaVal}>{HARDCODED_UPI_ID}</Text>
                </View>
                <View>
                  <Text style={styles.paidMetaLabel}>Status</Text>
                  <Text style={[styles.paidMetaVal, { color: Colors.green }]}>On-Time ✓</Text>
                </View>
              </View>

              <View style={styles.nextCycleBox}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
                <Text style={styles.nextCycleText}>
                  Next fee recovery cycle opens 5 days before 25 Oct 2026.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.resetTestBtn}
                onPress={handleResetForTesting}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={12} color={Colors.textMuted} />
                <Text style={styles.resetTestText}>Reset to ₹1 Due (For Testing Demo)</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : fees.status === 'pending_verification' ? (
          <View style={[styles.feeStatusCard, styles.pendingCard]}>
            <View style={styles.pendingHeaderRow}>
              <View style={styles.pendingIconBox}>
                <Ionicons name="time" size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingTitle}>₹1 Payment Submitted</Text>
                <Text style={styles.pendingSub}>Awaiting Super Admin Verification</Text>
              </View>
              <View style={styles.pendingStatusBadge}>
                <View style={styles.pendingPulse} />
                <Text style={styles.pendingStatusText}>In Review</Text>
              </View>
            </View>

            <Text style={styles.pendingExplainText}>
              Your transfer of ₹1 to <Text style={{ fontFamily: 'Inter_700Bold' }}>{HARDCODED_UPI_ID}</Text> is currently queued in the Superadmin portal for confirmation.
            </Text>

            {/* Instant Demo Helper */}
            <TouchableOpacity
              style={styles.instantVerifyBtn}
              onPress={handleSuperAdminInstantApprove}
              activeOpacity={0.85}
            >
              <Ionicons name="shield-checkmark" size={16} color="#fff" />
              <Text style={styles.instantVerifyText}>⚡ Instant Superadmin Approval (Demo)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetPendingBtn}
              onPress={handleResetForTesting}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={12} color={Colors.textMuted} />
              <Text style={styles.resetTestText}>Reset back to ₹1 Due</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.feeStatusCard, styles.dueCard]}>
            <View style={styles.dueTopRow}>
              <View>
                <Text style={styles.dueLabel}>Current Tuition Due</Text>
                <Text style={styles.dueAmount}>₹ {fees.currentDue}.00</Text>
                <Text style={styles.dueDateText}>Due on {fees.dueDate}</Text>
              </View>
              <View style={[styles.daysLeftBadge, fees.daysLeft <= 0 && { backgroundColor: '#FEF2F2' }]}>
                <Ionicons
                  name={fees.daysLeft <= 0 ? 'alert-circle' : 'warning-outline'}
                  size={12}
                  color={fees.daysLeft <= 0 ? Colors.red : Colors.amber}
                />
                <Text style={[styles.daysLeftText, fees.daysLeft <= 0 && { color: Colors.red }]}>
                  {fees.daysLeft <= 0
                    ? fees.daysLeft === 0
                      ? 'Due Today!'
                      : `Overdue by ${Math.abs(fees.daysLeft)} days`
                    : `${fees.daysLeft} days left`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.duePayBtn}
              onPress={() => handlePayUPI('G Pay')}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={15} color="#fff" />
              <Text style={styles.duePayBtnText}>Pay ₹1 with GPay / UPI</Text>
            </TouchableOpacity>

            <View style={styles.dueSecondaryActionRow}>
              <TouchableOpacity
                style={styles.actionPillBtn}
                onPress={() => Alert.alert('UPI ID Copied', `${HARDCODED_UPI_ID}\n\nYou can transfer ₹1 directly inside Google Pay, PhonePe, or Paytm.`)}
                activeOpacity={0.75}
              >
                <Ionicons name="copy-outline" size={13} color={Colors.primary} />
                <Text style={styles.actionPillText} numberOfLines={1}>Copy UPI ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionPillBtn, styles.actionPillSubmit]}
                onPress={() => setVerificationModalVisible(true)}
                activeOpacity={0.75}
              >
                <Ionicons name="receipt-outline" size={13} color="#0369A1" />
                <Text style={[styles.actionPillText, { color: '#0369A1' }]} numberOfLines={1}>
                  Already Paid? Submit UTR →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dedicated Loyalty Bonus Card (Always full width and cleanly displayed) */}
        {(() => {
          const totalMonthsPaid = fees.monthsPaidOnTime ?? 2;
          const currentCycleNumber = Math.floor(totalMonthsPaid / 3) + 1;
          const cycleStartMonth = (currentCycleNumber - 1) * 3 + 1;
          const cycleMonths = [
            { label: `Month ${cycleStartMonth}`, earned: totalMonthsPaid >= cycleStartMonth },
            { label: `Month ${cycleStartMonth + 1}`, earned: totalMonthsPaid >= cycleStartMonth + 1 },
            { label: `Month ${cycleStartMonth + 2}`, earned: totalMonthsPaid >= cycleStartMonth + 2 },
          ];
          const hasRewardUnlocked = totalMonthsPaid >= 3;

          return (
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="gift" size={16} color={Colors.amber} />
                  <Text style={styles.loyaltyTitle}>Loyalty Bonus Program</Text>
                </View>
                <View style={styles.loyaltyCyclePill}>
                  <Text style={styles.loyaltyCycleText}>Cycle {currentCycleNumber}</Text>
                </View>
              </View>

              <Text style={styles.loyaltySub}>
                Maintain regular tuition payments to unlock ₹10–₹20 OFF every 3 months!
              </Text>

              {hasRewardUnlocked && (
                <View style={styles.rewardUnlockedBadge}>
                  <Ionicons name="checkmark-circle" size={13} color="#15803D" />
                  <Text style={styles.rewardUnlockedText}>🎁 ₹15 OFF Milestone Reward Unlocked!</Text>
                </View>
              )}

              <View style={styles.loyaltySteps}>
                {cycleMonths.map((m, i) => (
                  <View key={i} style={styles.loyaltyStep}>
                    <View style={[styles.loyaltyCircle, m.earned ? styles.loyaltyCircleActive : styles.loyaltyCircleSoon]}>
                      {m.earned ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      ) : (
                        <Ionicons name="gift-outline" size={14} color={Colors.amber} />
                      )}
                    </View>
                    <Text style={styles.loyaltyMonthLabel}>{m.label}</Text>
                    <Text style={[styles.loyaltyStatus, { color: m.earned ? Colors.green : Colors.amber }]}>
                      {m.earned ? '✓ On-Time' : 'Upcoming'}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.loyaltyFooterRow}>
                <Text style={styles.loyaltyCount}>
                  <Text style={styles.loyaltyCountNum}>{totalMonthsPaid}</Text> months paid on time
                </Text>
                <Text style={styles.loyaltyHint}>🎉 Next discount cycle in {3 - (totalMonthsPaid % 3 || 3)} mo</Text>
              </View>
            </View>
          );
        })()}

        {/* Pay Instantly */}
        <View style={styles.card}>
          <View style={styles.payHeader}>
            <View>
              <Text style={styles.payTitle}>Pay Instantly</Text>
              <Text style={styles.paySub}>Google Pay, PhonePe, Paytm or UPI</Text>
            </View>
            <Text style={styles.payTagline}>Quick{'\n'}Secure{'\n'}Hassle-free ✓</Text>
          </View>
          <View style={styles.upiRow}>
            {UPI_APPS.map((app) => (
              <TouchableOpacity
                key={app.label}
                style={[styles.upiBtn, { backgroundColor: app.bg }]}
                onPress={() => handlePayUPI(app.label)}
                activeOpacity={0.8}
              >
                <Ionicons name={app.icon as any} size={20} color={app.color} />
                <Text style={[styles.upiLabel, { color: app.color }]}>{app.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Motivation Banner */}
        <View style={styles.motivationCard}>
          <View style={styles.motivationLeft}>
            <Text style={styles.motivationEmoji}>🏆</Text>
          </View>
          <View style={styles.motivationContent}>
            <Text style={styles.motivationTitle}>Pay on time</Text>
            <Text style={styles.motivationHeading}>Keep your learning{'\n'}uninterrupted!</Text>
            <Text style={styles.motivationText}>
              On-time payments help us bring you better classes, more resources and a smoother learning experience.
            </Text>
          </View>
          <View style={styles.motivationRight}>
            <Text style={styles.motivationRightText}>🌱 Discipline today leads to bigger dreams tomorrow.</Text>
          </View>
        </View>

        {/* Recent Payments */}
        <View style={styles.card}>
          <View style={styles.payHistoryHeader}>
            <View style={styles.cardTitleRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              <Text style={styles.sectionSub}>(Last 3 Months)</Text>
            </View>
            <TouchableOpacity onPress={() => setAllPaymentsModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.viewAll}>View All ({allPaymentsHistory.length}) →</Text>
            </TouchableOpacity>
          </View>

          {fees.recentPayments.map((p, i) => (
            <View key={i} style={[styles.paymentRow, i < fees.recentPayments.length - 1 && styles.paymentRowBorder]}>
              <View style={styles.monthBadge}>
                <Text style={styles.monthBadgeText}>{p.month}</Text>
                <Ionicons name="calendar-outline" size={14} color={Colors.primary} />
              </View>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentMonth}>{p.fullMonth}</Text>
                <Text style={styles.paymentDate}>Paid on {p.paidOn}</Text>
              </View>
              <Text style={styles.paymentAmount}>₹ {p.amount.toLocaleString('en-IN')}</Text>
              <View style={[styles.onTimeBadge, { backgroundColor: p.onTime ? Colors.greenLight : Colors.redLight }]}>
                <Ionicons name={p.onTime ? 'checkmark' : 'close'} size={12} color={p.onTime ? Colors.green : Colors.red} />
                <Text style={[styles.onTimeText, { color: p.onTime ? Colors.green : Colors.red }]}>
                  {p.onTime ? 'On\nTime' : 'Late'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Verification / Proof Submission Modal */}
      <Modal
        visible={verificationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVerificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentBox}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.logoBox, { width: 30, height: 30, backgroundColor: Colors.primary }]}>
                  <Ionicons name="receipt-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.modalHeaderTitle}>Submit ₹1 UPI Proof</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setVerificationModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Once submitted, Super Admin Mr. R Madhusudanan will verify your ₹1 transfer to{' '}
              <Text style={{ fontFamily: 'Inter_700Bold', color: Colors.primary }}>{HARDCODED_UPI_ID}</Text> and unlock your cleared status.
            </Text>

            <Text style={styles.inputFieldLabel}>UPI Reference / UTR Number</Text>
            <TextInput
              style={styles.utrInputField}
              value={utrInput}
              onChangeText={setUtrInput}
              placeholder="e.g. 423985729104"
              placeholderTextColor={Colors.textMuted}
            />

            <TouchableOpacity
              style={[styles.submitVerifyBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmitVerification}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={15} color="#fff" />
              <Text style={styles.submitVerifyBtnText}>
                {submitting ? 'Submitting...' : 'Submit for Admin Approval'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.instantSimulateBtn}
              onPress={async () => {
                setVerificationModalVisible(false);
                await handleSuperAdminInstantApprove();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="shield-checkmark" size={14} color={Colors.green} />
              <Text style={styles.instantSimulateText}>⚡ Instant Superadmin Approval (Test Mode)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* All Payments History Modal */}
      <Modal
        visible={allPaymentsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAllPaymentsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentBox, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.logoBox, { width: 30, height: 30, backgroundColor: '#0284C7' }]}>
                  <Ionicons name="documents" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.modalHeaderTitle}>All Payment Receipts</Text>
                  <Text style={styles.historySubtitle}>Verified by Super Admin Mr. R Madhusudanan</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setAllPaymentsModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {allPaymentsHistory.map((item, idx) => (
                <View key={idx} style={styles.historyCard}>
                  <View style={styles.historyCardTop}>
                    <View style={styles.historyMonthBadge}>
                      <Text style={styles.historyMonthBadgeText}>{item.month}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyCardTitle}>{item.category || item.fullMonth}</Text>
                      <Text style={styles.historyCardDate}>{item.paidOn}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.historyAmountText}>₹ {item.amount.toLocaleString('en-IN')}</Text>
                      <View style={styles.historyVerifiedBadge}>
                        <Ionicons name="checkmark-circle" size={11} color={Colors.green} />
                        <Text style={styles.historyVerifiedText}>Verified</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.historyDivider} />

                  <View style={styles.historyDetailsRow}>
                    <Text style={styles.historyReceiptNo}>Receipt #{item.receiptNo}</Text>
                    <Text style={styles.historyMode}>{item.mode}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.background },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  headerSub: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.cardBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.border },
  classPillText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_700Bold' },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 },
  pageTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  taglineBox: { alignItems: 'flex-end' },
  tagline: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold', textAlign: 'right', lineHeight: 16 },
  pageSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 16, marginTop: 2 },

  feeStatusCard: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dueCard: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dueTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dueLabel: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  dueAmount: { fontSize: 28, fontFamily: 'Inter_700Bold', color: Colors.red, marginTop: 2 },
  dueDateText: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 4 },
  daysLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.redLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  daysLeftText: { fontSize: 11, color: Colors.red, fontFamily: 'Inter_600SemiBold' },
  duePayBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  duePayBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  dueSecondaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 4,
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actionPillSubmit: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  actionPillText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  resetPendingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 4,
  },

  // Payment History Modal Styles
  historySubtitle: { fontSize: 10.5, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyMonthBadge: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyMonthBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.primary },
  historyCardTitle: { fontSize: 12.5, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  historyCardDate: { fontSize: 10.5, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },
  historyAmountText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  historyVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 2,
  },
  historyVerifiedText: { fontSize: 9.5, fontFamily: 'Inter_700Bold', color: '#15803D' },
  historyDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 8 },
  historyDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyReceiptNo: { fontSize: 10.5, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  historyMode: { fontSize: 10.5, fontFamily: 'Inter_500Medium', color: Colors.primary },

  // Paid Card Styles
  paidCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    flexDirection: 'column',
    padding: 16,
  },
  paidContent: {
    width: '100%',
  },
  paidHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paidIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#15803D',
  },
  paidSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#166534',
    marginTop: 1,
  },
  receiptBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  receiptText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#15803D',
  },
  paidDivider: {
    height: 1,
    backgroundColor: '#BBF7D0',
    marginVertical: 12,
  },
  paidMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paidMetaLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: '#166534',
  },
  paidMetaVal: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#14532D',
    marginTop: 2,
  },
  nextCycleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nextCycleText: {
    fontSize: 10.5,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    flex: 1,
  },
  resetTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingVertical: 4,
  },
  resetTestText: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },

  // Pending Card Styles
  pendingCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    flexDirection: 'column',
    padding: 16,
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
  },
  pendingSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#92400E',
    marginTop: 1,
  },
  pendingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  pendingPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  pendingStatusText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
  },
  pendingExplainText: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#78350F',
    marginTop: 10,
    lineHeight: 16,
  },
  instantVerifyBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  instantVerifyText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContentBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  utrInputField: {
    backgroundColor: Colors.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  submitVerifyBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  submitVerifyBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  instantSimulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  instantSimulateText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#15803D',
  },

  loyaltyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  loyaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  loyaltyTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  loyaltyCyclePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  loyaltyCycleText: { fontSize: 10.5, fontFamily: 'Inter_700Bold', color: '#B45309' },
  loyaltySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    marginBottom: 10,
    lineHeight: 16,
  },
  rewardUnlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignSelf: 'flex-start',
  },
  rewardUnlockedText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#15803D',
  },
  loyaltySteps: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  loyaltyStep: { alignItems: 'center', gap: 5 },
  loyaltyCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyCircleActive: { backgroundColor: Colors.green },
  loyaltyCircleSoon: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  loyaltyMonthLabel: { fontSize: 11, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold' },
  loyaltyStatus: { fontSize: 9.5, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  loyaltyFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  loyaltyCount: { fontSize: 11.5, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  loyaltyCountNum: { fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  loyaltyHint: { fontSize: 10.5, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  card: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  payHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  payTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  paySub: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  payTagline: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold', textAlign: 'right', lineHeight: 16 },
  upiRow: { flexDirection: 'row', gap: 10 },
  upiBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 12, gap: 4,
  },
  upiLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },

  motivationCard: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, marginBottom: 12,
    flexDirection: 'row', gap: 10, borderWidth: 1, borderColor: Colors.borderLight,
  },
  motivationLeft: { justifyContent: 'center' },
  motivationEmoji: { fontSize: 32 },
  motivationContent: { flex: 1 },
  motivationTitle: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  motivationHeading: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, lineHeight: 20, marginTop: 2 },
  motivationText: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', lineHeight: 16, marginTop: 4 },
  motivationRight: { width: 80, justifyContent: 'center' },
  motivationRightText: { fontSize: 10, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', lineHeight: 14 },

  payHistoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  sectionSub: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  viewAll: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_500Medium' },

  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  paymentRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  monthBadge: {
    width: 48, backgroundColor: Colors.primaryLight, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 2,
  },
  monthBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Colors.primary },
  paymentInfo: { flex: 1 },
  paymentMonth: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  paymentDate: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 1 },
  paymentAmount: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  onTimeBadge: {
    alignItems: 'center', justifyContent: 'center', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', gap: 2,
  },
  onTimeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});
