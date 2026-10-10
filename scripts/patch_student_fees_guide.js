const fs = require('fs');
const path = require('path');

console.log('=== PATCHING FEES SCREEN: PAYMENT CONFIRMATION GUIDE & APPROVAL BUTTON ===\n');

const feesPath = path.join(__dirname, '../app/(student)/fees.tsx');
let code = fs.readFileSync(feesPath, 'utf8');

// 1. Add handleOpenApprovalModal and update handleSubmitVerification
const oldSubmitHandler = `  const handleSubmitVerification = async () => {
    if (!screenshot && !utrInput.trim()) {
      Alert.alert(
        'Proof Required',
        'Please upload a screenshot of your payment receipt or enter the UPI transaction UTR.'
      );
      return;
    }
    setSubmitting(true);
    try {
      const updated = await DataService.submitFeePayment(rollNo, utrInput.trim() || undefined, screenshot);
      setFees(updated);
      setVerificationModalVisible(false);
      setScreenshot(null);
      setScreenshotPreview(null);
      setUtrInput('');
      Alert.alert(
        'Payment Proof Submitted!',
        \`Your payment proof of ₹\${targetFeeAmount.toLocaleString('en-IN')} has been sent to Center Admin.\\n\\nOnce received and approved, your dashboard and profile will immediately update to Paid.\`,
        [{ text: 'Great!', onPress: () => {} }]
      );
    } catch {
      Alert.alert('Error', 'Could not submit payment proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };`;

const newSubmitHandler = `  const handleOpenApprovalModal = () => {
    if (fees?.status === 'pending_verification') {
      Alert.alert(
        'Payment Confirmation In Review',
        'Your payment confirmation has already been submitted and is currently being verified by the tuition centre.\\n\\nWould you like to view or update your submitted receipt proof?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View / Update Proof', onPress: () => setVerificationModalVisible(true) },
        ]
      );
      return;
    }
    setVerificationModalVisible(true);
  };

  const handleSubmitVerification = async () => {
    if (!screenshot && !utrInput.trim()) {
      Alert.alert(
        'Proof Required',
        'Please upload a screenshot of your payment receipt or enter the UPI transaction UTR.'
      );
      return;
    }
    setSubmitting(true);
    try {
      const updated = await DataService.submitFeePayment(rollNo, utrInput.trim() || undefined, screenshot);
      setFees(updated);
      setVerificationModalVisible(false);
      setScreenshot(null);
      setScreenshotPreview(null);
      setUtrInput('');
      Alert.alert(
        'Payment Confirmation Submitted Successfully',
        "Payment confirmation submitted successfully. We'll verify it soon.\\n\\nThe tuition centre has been notified and will verify your payment and update the status.",
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch {
      Alert.alert('Error', 'Could not submit payment confirmation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };`;

if (code.includes(oldSubmitHandler)) {
  code = code.replace(oldSubmitHandler, newSubmitHandler);
  console.log('✓ Updated handleSubmitVerification & added handleOpenApprovalModal');
} else {
  console.warn('Could not find exact oldSubmitHandler, checking partial replace...');
}

// 2. Update Due card secondary action row to avoid truncation
const oldDueActions = `<View style={styles.dueSecondaryActionRow}>
              <TouchableOpacity
                style={styles.actionPillBtn}
                onPress={handleCopyUpiId}
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
                  Already Paid? Submit Receipt Proof →
                </Text>
              </TouchableOpacity>
            </View>`;

const newDueActions = `<View style={styles.dueSecondaryActionRow}>
              <TouchableOpacity
                style={styles.actionPillBtn}
                onPress={handleCopyUpiId}
                activeOpacity={0.75}
              >
                <Ionicons name="copy-outline" size={14} color={Colors.primary} />
                <Text style={styles.actionPillText} numberOfLines={1}>Copy UPI ID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionPillBtn, styles.actionPillSubmit]}
                onPress={handleOpenApprovalModal}
                activeOpacity={0.75}
              >
                <Ionicons name="checkmark-done-circle" size={15} color="#0369A1" />
                <Text style={[styles.actionPillText, { color: '#0369A1' }]} numberOfLines={1}>
                  Confirm Payment →
                </Text>
              </TouchableOpacity>
            </View>`;

if (code.includes(oldDueActions)) {
  code = code.replace(oldDueActions, newDueActions);
  console.log('✓ Updated dueSecondaryActionRow in Due Card');
}

// 3. Insert Payment Confirmation Guide Card directly after Open Payment App card
const paymentAppAnchor = `        {/* Pay Instantly */}
        <View style={styles.card}>
          <View style={styles.payHeader}>
            <Text style={styles.payTitle}>Open Payment App</Text>
            <Text style={styles.paySub}>Launches app directly • Copies UPI ID automatically</Text>
          </View>
          <View style={styles.upiRow}>
            {UPI_APPS.map((app) => (
              <TouchableOpacity
                key={app.label}
                style={[styles.upiBtn, { backgroundColor: app.bg }]}
                onPress={() => handlePayUPI(app)}
                activeOpacity={0.8}
              >
                <Ionicons name={app.icon as any} size={20} color={app.color} />
                <Text style={[styles.upiLabel, { color: app.color }]}>{app.label}</Text>
                <Text style={styles.upiDirectTag} numberOfLines={1}>Direct</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>`;

const guideCardJSX = `        {/* Pay Instantly */}
        <View style={styles.card}>
          <View style={styles.payHeader}>
            <Text style={styles.payTitle}>Open Payment App</Text>
            <Text style={styles.paySub}>Launches app directly • Copies UPI ID automatically</Text>
          </View>
          <View style={styles.upiRow}>
            {UPI_APPS.map((app) => (
              <TouchableOpacity
                key={app.label}
                style={[styles.upiBtn, { backgroundColor: app.bg }]}
                onPress={() => handlePayUPI(app)}
                activeOpacity={0.8}
              >
                <Ionicons name={app.icon as any} size={20} color={app.color} />
                <Text style={[styles.upiLabel, { color: app.color }]}>{app.label}</Text>
                <Text style={styles.upiDirectTag} numberOfLines={1}>Direct</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step-by-Step Payment Confirmation Guide & Prominent Approval Button */}
        <View style={styles.guideCard}>
          {/* Card Header */}
          <View style={styles.guideHeader}>
            <View style={styles.guideIconCircle}>
              <Ionicons name="shield-checkmark" size={18} color="#0284C7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.guideCardTitle}>Payment Confirmation Guide</Text>
              <Text style={styles.guideCardSub}>3 simple steps for parents to clear monthly fees</Text>
            </View>
            <View style={styles.guideBadge}>
              <Text style={styles.guideBadgeText}>Step-by-Step</Text>
            </View>
          </View>

          {/* Stepped Timeline */}
          <View style={styles.stepsTimeline}>
            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={styles.stepLeftCol}>
                <View style={[styles.stepNumberCircle, { backgroundColor: '#0284C7' }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepConnectorLine} />
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Step 1: Pay the Monthly Fee</Text>
                  <Ionicons name="wallet-outline" size={14} color="#0284C7" />
                </View>
                <Text style={styles.stepDesc}>Pay the tuition fee for the current month.</Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={styles.stepLeftCol}>
                <View style={[styles.stepNumberCircle, { backgroundColor: '#0284C7' }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepConnectorLine} />
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Step 2: Confirm Your Payment</Text>
                  <Ionicons name="checkmark-done-circle-outline" size={15} color="#0284C7" />
                </View>
                <Text style={styles.stepDesc}>
                  Once you have paid the fee, click the “Submit Payment Approval” button to notify the tuition centre.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={[styles.stepItem, { marginBottom: 0 }]}>
              <View style={styles.stepLeftCol}>
                <View style={[styles.stepNumberCircle, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
              </View>
              <View style={styles.stepContentCol}>
                <View style={styles.stepTitleRow}>
                  <Text style={styles.stepTitle}>Step 3: Wait for Confirmation</Text>
                  <Ionicons name="time-outline" size={14} color="#10B981" />
                </View>
                <Text style={styles.stepDesc}>
                  The tuition centre will verify the payment and update the payment status.
                </Text>
              </View>
            </View>
          </View>

          {/* Section Divider */}
          <View style={styles.guideDivider} />

          {/* Payment Approval Action Section */}
          <View style={styles.approvalSection}>
            {fees.isPaid ? (
              // State 3: Payment Verified by Tuition Centre
              <View style={styles.approvalVerifiedBox}>
                <View style={styles.approvalVerifiedTop}>
                  <View style={styles.verifiedIconBox}>
                    <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.approvalVerifiedTitle}>Payment Verified by Tuition Centre ✓</Text>
                    <Text style={styles.approvalVerifiedSub}>
                      Your tuition fee for {fees.clearedMonth || 'this month'} has been verified and cleared by Edu Home.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.advancePaymentPill}
                  onPress={() => setVerificationModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="receipt-outline" size={14} color="#0369A1" />
                  <Text style={styles.advancePaymentPillText}>Pay {fees.nextMonthLabel || 'Next Month'} in Advance →</Text>
                </TouchableOpacity>
              </View>
            ) : fees.status === 'pending_verification' ? (
              // State 2: Confirmation Submitted by Parent (In Review) - Prevents duplicate submissions!
              <View style={styles.approvalPendingBox}>
                <View style={styles.approvalPendingHeader}>
                  <View style={styles.approvalPendingIconBox}>
                    <Ionicons name="time" size={20} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.approvalPendingTitle}>Payment Confirmation Submitted</Text>
                    <Text style={styles.approvalPendingSub}>Pending Tuition Centre Verification</Text>
                  </View>
                  <View style={styles.inReviewPill}>
                    <View style={styles.inReviewDot} />
                    <Text style={styles.inReviewText}>In Review</Text>
                  </View>
                </View>
                <Text style={styles.approvalPendingExplain}>
                  You have already submitted your payment confirmation. The tuition centre has received your notification and is verifying the transfer. You do not need to submit again.
                </Text>
                <TouchableOpacity
                  style={styles.viewSubmittedProofBtn}
                  onPress={() => setVerificationModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="eye-outline" size={14} color="#B45309" />
                  <Text style={styles.viewSubmittedProofText}>View or Update Submitted Proof</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // State 1: Due / Action Needed - The Prominent "Submit Payment Approval" Button
              <View>
                {/* Short Helper Text */}
                <View style={styles.helperTextRow}>
                  <Ionicons name="information-circle" size={15} color="#0284C7" />
                  <Text style={styles.helperText}>
                    Already paid this month's fee? Confirm your payment here.
                  </Text>
                </View>

                {/* Prominent Modern "Submit Payment Approval" Button */}
                <TouchableOpacity
                  style={styles.submitApprovalButton}
                  onPress={handleOpenApprovalModal}
                  activeOpacity={0.85}
                >
                  <View style={styles.submitApprovalIconCircle}>
                    <Ionicons name="checkmark-done" size={17} color="#0284C7" />
                  </View>
                  <Text style={styles.submitApprovalButtonText}>Submit Payment Approval</Text>
                  <Ionicons name="arrow-forward" size={17} color="#E0F2FE" />
                </TouchableOpacity>

                <Text style={styles.submitApprovalNote}>
                  🔒 Notifies Edu Home Tuition Centre to verify your transaction and issue official receipt.
                </Text>
              </View>
            )}
          </View>
        </View>`;

if (code.includes(paymentAppAnchor)) {
  code = code.replace(paymentAppAnchor, guideCardJSX);
  console.log('✓ Inserted Payment Confirmation Guide & Approval Action Card');
} else {
  console.warn('Could not find paymentAppAnchor');
}

// 4. Update the Verification Modal Header & Submit Button
const oldModalHeader = `<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.logoBox, { width: 30, height: 30, backgroundColor: Colors.primary }]}>
                  <Ionicons name="receipt-outline" size={16} color="#fff" />
                </View>
                <Text style={styles.modalHeaderTitle}>Submit ₹{targetFeeAmount.toLocaleString('en-IN')} UPI Proof</Text>
              </View>`;

const newModalHeader = `<View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.logoBox, { width: 34, height: 34, backgroundColor: Colors.primary, borderRadius: 10 }]}>
                  <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle}>Submit Payment Approval</Text>
                  <Text style={styles.modalHeaderSub}>₹{targetFeeAmount.toLocaleString('en-IN')} Tuition Fee • {fees.payingMonth || 'Current Month'}</Text>
                </View>
              </View>`;

if (code.includes(oldModalHeader)) {
  code = code.replace(oldModalHeader, newModalHeader);
  console.log('✓ Updated Modal Header');
}

const oldModalDesc = `<Text style={styles.modalDesc}>
              Upload your payment receipt screenshot from GPay, PhonePe, Paytm, or BHIM. Center Admin will verify and clear your fee status.
            </Text>`;

const newModalDesc = `<Text style={styles.modalDesc}>
              Once you have paid the fee via Google Pay, PhonePe, Paytm, or UPI, upload your payment screenshot or enter the transaction reference (UTR) to notify the tuition centre for verification.
            </Text>`;

if (code.includes(oldModalDesc)) {
  code = code.replace(oldModalDesc, newModalDesc);
  console.log('✓ Updated Modal Description');
}

const oldModalBtn = `<TouchableOpacity
              style={[styles.submitVerifyBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmitVerification}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={15} color="#fff" />
              <Text style={styles.submitVerifyBtnText}>
                {submitting ? 'Submitting...' : 'Submit for Admin Approval'}
              </Text>
            </TouchableOpacity>`;

const newModalBtn = `<TouchableOpacity
              style={[styles.submitVerifyBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmitVerification}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
              <Text style={styles.submitVerifyBtnText}>
                {submitting ? 'Submitting Payment Approval...' : 'Submit Payment Approval'}
              </Text>
            </TouchableOpacity>`;

if (code.includes(oldModalBtn)) {
  code = code.replace(oldModalBtn, newModalBtn);
  console.log('✓ Updated Modal Submit Button');
}

// 5. Add new styles for the Guide Card and Prominent Button
const styleAnchor = `  // Payment History Modal Styles`;
const newStyles = `  // Step-by-Step Payment Confirmation Guide Card Styles
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  guideIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideCardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  guideCardSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    marginTop: 1,
  },
  guideBadge: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  guideBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },
  stepsTimeline: {
    paddingLeft: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stepLeftCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  stepNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  stepConnectorLine: {
    width: 2,
    height: 32,
    backgroundColor: '#E0F2FE',
    marginVertical: 3,
  },
  stepContentCol: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 8,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  stepDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#475569',
    marginTop: 2,
    lineHeight: 17,
  },
  guideDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  approvalSection: {
    paddingTop: 2,
  },
  helperTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0369A1',
    flex: 1,
  },
  submitApprovalButton: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  submitApprovalIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitApprovalButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  submitApprovalNote: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },

  // State 2: Approval Pending In-Review Box
  approvalPendingBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
  },
  approvalPendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  approvalPendingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalPendingTitle: {
    fontSize: 13.5,
    fontFamily: 'Inter_700Bold',
    color: '#92400E',
  },
  approvalPendingSub: {
    fontSize: 10.5,
    fontFamily: 'Inter_500Medium',
    color: '#B45309',
    marginTop: 1,
  },
  inReviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  inReviewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D97706',
  },
  inReviewText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
  },
  approvalPendingExplain: {
    fontSize: 11.5,
    fontFamily: 'Inter_400Regular',
    color: '#78350F',
    marginTop: 8,
    lineHeight: 16,
  },
  viewSubmittedProofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: 8,
  },
  viewSubmittedProofText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#92400E',
  },

  // State 3: Approval Verified Box
  approvalVerifiedBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    padding: 14,
  },
  approvalVerifiedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifiedIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalVerifiedTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#15803D',
  },
  approvalVerifiedSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  advancePaymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingVertical: 8,
  },
  advancePaymentPillText: {
    fontSize: 11.5,
    fontFamily: 'Inter_600SemiBold',
    color: '#0369A1',
  },

  modalHeaderSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // Payment History Modal Styles`;

if (code.includes(styleAnchor)) {
  code = code.replace(styleAnchor, newStyles);
  console.log('✓ Added Guide Card and Prominent Button Styles');
} else {
  console.warn('Could not find styleAnchor');
}

fs.writeFileSync(feesPath, code, 'utf8');
console.log('=== ALL ENHANCEMENTS APPLIED TO fees.tsx ===');
