import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';
import { DataService } from '../../lib/dataService';
import { supabase } from '../../lib/supabase';
import {
  CLASS_12_PYQ_DATA,
  CLASS_12_SUBJECTS_LIST,
  PyqSubject,
  PyqCard,
  PyqLink,
} from '../../constants/class12PyqData';

// Map icon names to valid Ionicons
const getSubjectIonIcon = (iconName: string): any => {
  switch (iconName) {
    case 'calculator':
      return 'calculator-outline';
    case 'magnet':
      return 'magnet-outline';
    case 'flask':
      return 'flask-outline';
    case 'fitness':
      return 'leaf-outline';
    case 'laptop':
      return 'laptop-outline';
    case 'bar-chart':
      return 'bar-chart-outline';
    case 'business':
      return 'business-outline';
    case 'globe':
      return 'globe-outline';
    case 'book':
      return 'book-outline';
    case 'feather':
      return 'create-outline';
    case 'language':
      return 'language-outline';
    case 'moon':
      return 'moon-outline';
    case 'folder':
    default:
      return 'folder-outline';
  }
};

const CATEGORIES = [
  { id: 'all', label: 'All Exams' },
  { id: 'board-exams', label: 'Board Exams' },
  { id: 'model-exams', label: 'Model Exams' },
  { id: 'terminal-exams', label: 'Terminal Exams' },
  { id: 'practice-sets', label: 'Practice Sets' },
];

export default function MaterialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { student } = useAuth();

  const rollNo = student?.rollNo || '';

  // Determine if the student is strictly in Class 12
  const isClass12Student = useMemo(() => {
    if (!student?.class) return false;
    const cls = String(student.class).toLowerCase();
    return /\b12\b/.test(cls) || cls.includes('plus two');
  }, [student?.class]);

  // Fee state for Class 12 locking
  const [fees, setFees] = useState<any>(null);
  const [feesLoading, setFeesLoading] = useState<boolean>(isClass12Student);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadFeeStatus = useCallback(async (forceFresh = false) => {
    if (!rollNo || !isClass12Student) {
      setFeesLoading(false);
      return;
    }
    try {
      const f = await DataService.getFees(rollNo, forceFresh);
      if (f) setFees(f);
    } catch {
      // ignore
    } finally {
      setFeesLoading(false);
    }
  }, [rollNo, isClass12Student]);

  useEffect(() => {
    loadFeeStatus();

    if (!rollNo || !isClass12Student) return;

    // Realtime listener so materials auto-unlocks as soon as Admin approves fee
    const channel = supabase
      .channel(`materials_fee_sync_${rollNo}`)
      .on('broadcast', { event: 'fee_updated' }, (event) => {
        if (!event?.payload || event.payload.rollNo === rollNo) loadFeeStatus(true);
      })
      .on('broadcast', { event: 'fee_approved' }, (event) => {
        if (!event?.payload || event.payload.rollNo === rollNo) loadFeeStatus(true);
      })
      .on('broadcast', { event: 'fee_rejected' }, (event) => {
        if (!event?.payload || event.payload.rollNo === rollNo) loadFeeStatus(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rollNo, isClass12Student, loadFeeStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeStatus(true);
    setRefreshing(false);
  };

  // Fee Paid & Pending Verification checks
  const isFeePaid = useMemo(() => {
    if (!fees) return false;
    return fees.isPaid === true || Number(fees.currentDue) === 0 || fees.status === 'paid';
  }, [fees]);

  const isFeePending = useMemo(() => {
    return fees?.status === 'pending_verification';
  }, [fees]);

  // Default subject for Class 12
  const defaultSubjectKey = useMemo(() => {
    const rawSubs = student?.subjects;
    const studentSubs = (Array.isArray(rawSubs) ? rawSubs.join(' ') : String(rawSubs || '')).toLowerCase();
    if (studentSubs.includes('phys')) return 'physics';
    if (studentSubs.includes('math')) return 'maths';
    if (studentSubs.includes('chem')) return 'chemistry';
    if (studentSubs.includes('bio')) return 'biology';
    if (studentSubs.includes('comp')) return 'computer';
    return 'physics';
  }, [student?.subjects]);

  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string>(defaultSubjectKey);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentSubject: PyqSubject = CLASS_12_PYQ_DATA[selectedSubjectKey] || CLASS_12_PYQ_DATA['physics'];

  // Filter cards by category and search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return currentSubject.sections
      .filter((sec) => {
        if (selectedCategory === 'all') return true;
        return sec.id === selectedCategory;
      })
      .map((sec) => {
        const matchingCards = sec.cards.filter((card) => {
          if (!q) return true;
          return (
            card.year.toLowerCase().includes(q) ||
            card.title.toLowerCase().includes(q) ||
            card.links.some((l) => l.label.toLowerCase().includes(q))
          );
        });

        const matchingPracticeSets = sec.practiceSets.filter((pset) => {
          if (!q) return true;
          return pset.label.toLowerCase().includes(q);
        });

        return {
          ...sec,
          cards: matchingCards,
          practiceSets: matchingPracticeSets,
        };
      })
      .filter((sec) => sec.cards.length > 0 || sec.practiceSets.length > 0);
  }, [currentSubject, selectedCategory, searchQuery]);

  const totalMatchingPapers = useMemo(() => {
    return filteredSections.reduce(
      (acc, sec) => acc + sec.cards.length + sec.practiceSets.length,
      0
    );
  }, [filteredSections]);

  const handleOpenLink = async (link: PyqLink | { url: string; label: string }) => {
    try {
      const supported = await Linking.canOpenURL(link.url);
      if (supported) {
        await Linking.openURL(link.url);
      } else {
        await Linking.openURL(link.url);
      }
    } catch {
      Alert.alert(
        'Could Not Open Document',
        'Unable to open this Google Drive link. Please make sure you have internet access or Google Drive installed.'
      );
    }
  };

  const studentDisplayClass = student?.class || 'Class 12';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header with dynamic student class pill */}
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
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>{studentDisplayClass}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(student)/profile')}>
            {student?.photoUrl ? (
              <Image source={{ uri: student.photoUrl }} style={{ width: 34, height: 34, borderRadius: 17 }} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{student?.avatar || 'ST'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: 32 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* CASE 1: Student is NOT in Class 12 -> Show Non-Class-12 In Preparation Screen */}
        {!isClass12Student && (
          <View>
            <View style={styles.nonClass12Banner}>
              <View style={styles.prepBadgeRow}>
                <View style={styles.prepPill}>
                  <Ionicons name="time-outline" size={12} color="#D97706" />
                  <Text style={styles.prepPillText}>IN PREPARATION</Text>
                </View>
                <Text style={styles.prepClassText}>{studentDisplayClass} Curriculum</Text>
              </View>

              <Text style={styles.nonClass12Title}>{studentDisplayClass} Study Materials</Text>
              <Text style={styles.nonClass12Sub}>
                Course notes, chapter formula summaries, and previous years’ question banks curated specifically for{' '}
                <Text style={{ fontFamily: 'Inter_700Bold', color: '#fff' }}>{studentDisplayClass}</Text>{' '}
                are currently being vetted by the EduHome faculty team.
              </Text>
            </View>

            {/* Upcoming Modules Preview */}
            <View style={styles.upcomingHeaderRow}>
              <Text style={styles.upcomingHeaderTitle}>Modules Being Curated</Text>
              <Text style={styles.upcomingHeaderSub}>For {studentDisplayClass}</Text>
            </View>

            <View style={styles.previewCard}>
              <View style={[styles.previewIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="clipboard-outline" size={22} color="#2563EB" />
              </View>
              <View style={styles.previewContent}>
                <View style={styles.previewTitleRow}>
                  <Text style={styles.previewTitle}>Previous Years’ Question Papers (PYQ)</Text>
                  <View style={styles.previewTag}>
                    <Text style={styles.previewTagText}>Question Bank</Text>
                  </View>
                </View>
                <Text style={styles.previewDesc}>
                  Board and terminal question papers with detailed answer keys and marking scheme breakdowns.
                </Text>
                <View style={styles.lockedFootRow}>
                  <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.lockedFootText}>Unlocks with next academic release</Text>
                </View>
              </View>
            </View>

            <View style={styles.previewCard}>
              <View style={[styles.previewIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="document-text-outline" size={22} color="#059669" />
              </View>
              <View style={styles.previewContent}>
                <View style={styles.previewTitleRow}>
                  <Text style={styles.previewTitle}>Curated Notes & Formula Sheets</Text>
                  <View style={styles.previewTag}>
                    <Text style={styles.previewTagText}>Syllabus Notes</Text>
                  </View>
                </View>
                <Text style={styles.previewDesc}>
                  High-yield chapter summaries, derivation sheets, and quick revision mind maps.
                </Text>
                <View style={styles.lockedFootRow}>
                  <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.lockedFootText}>In Faculty Review</Text>
                </View>
              </View>
            </View>

            <View style={styles.previewCard}>
              <View style={[styles.previewIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="timer-outline" size={22} color="#D97706" />
              </View>
              <View style={styles.previewContent}>
                <View style={styles.previewTitleRow}>
                  <Text style={styles.previewTitle}>Chapter Practice Sets</Text>
                  <View style={styles.previewTag}>
                    <Text style={styles.previewTagText}>Self Evaluation</Text>
                  </View>
                </View>
                <Text style={styles.previewDesc}>
                  Selected high-probability practice questions and model tests for self-assessment.
                </Text>
                <View style={styles.lockedFootRow}>
                  <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.lockedFootText}>In Digitization</Text>
                </View>
              </View>
            </View>

            {/* Inspiration Banner */}
            <View style={styles.inspirationBanner}>
              <Text style={styles.inspiText}>Consistent practice today,{'\n'}Board success tomorrow.</Text>
              <Text style={styles.inspiSubText}>EduHome Tuition Center</Text>
            </View>
          </View>
        )}

        {/* CASE 2: Student is Class 12, but Fee is Loading */}
        {isClass12Student && feesLoading && (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Verifying enrollment & fee status...</Text>
          </View>
        )}

        {/* CASE 3: Student is Class 12, but Payment is Pending Verification */}
        {isClass12Student && !feesLoading && isFeePending && (
          <View style={styles.pendingVerificationCard}>
            <View style={styles.pendingIconCircle}>
              <Ionicons name="hourglass-outline" size={32} color="#D97706" />
            </View>
            <Text style={styles.pendingCardTitle}>Payment Verification in Progress</Text>
            <Text style={styles.pendingCardSub}>
              Your fee payment confirmation is currently awaiting center admin approval. Your question paper bank will unlock automatically as soon as it is verified.
            </Text>

            <View style={styles.pendingInfoRow}>
              <View style={styles.pendingInfoItem}>
                <Text style={styles.pendingInfoLabel}>Submitted Amount</Text>
                <Text style={styles.pendingInfoVal}>₹{fees?.monthlyFee || fees?.actualDue || 4000}</Text>
              </View>
              <View style={styles.pendingInfoItem}>
                <Text style={styles.pendingInfoLabel}>Target Cycle</Text>
                <Text style={styles.pendingInfoVal}>{fees?.payingMonth || 'Current Month'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.pendingViewBtn}
              onPress={() => router.push('/(student)/fees' as any)}
            >
              <Text style={styles.pendingViewBtnText}>View Payment Status in Fees Tab →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CASE 4: Student is Class 12, but Fees are UNPAID / DUE -> Show Locked Screen */}
        {isClass12Student && !feesLoading && !isFeePaid && !isFeePending && (
          <View style={styles.feeLockedCard}>
            <View style={styles.lockIconCircleBig}>
              <Ionicons name="lock-closed" size={34} color="#DC2626" />
              <View style={styles.lockShieldBadge}>
                <Ionicons name="shield-outline" size={14} color="#fff" />
              </View>
            </View>

            <Text style={styles.feeLockedTitle}>Access Restricted: Fee Pending</Text>
            <Text style={styles.feeLockedSub}>
              Access to the Class 12 Previous Year Question Papers & Answer Keys bank is reserved for active enrolled students with cleared tuition fees.
            </Text>

            {/* Fee Due Highlight Box */}
            <View style={styles.dueHighlightBox}>
              <View style={styles.dueHighlightRow}>
                <View>
                  <Text style={styles.dueHighlightLabel}>Outstanding Fee Due</Text>
                  <Text style={styles.dueHighlightAmount}>
                    ₹{fees?.currentDue || fees?.actualDue || fees?.monthlyFee || 4000}
                  </Text>
                </View>
                <View style={styles.dueStatusBadge}>
                  <Text style={styles.dueStatusBadgeText}>
                    {fees?.daysLeft !== undefined && fees.daysLeft <= 0 ? 'OVERDUE' : 'DUE'}
                  </Text>
                </View>
              </View>

              <View style={styles.dueDivider} />

              <View style={styles.dueMetaRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748B" />
                <Text style={styles.dueMetaText}>
                  Due Date: <Text style={{ fontFamily: 'Inter_700Bold', color: '#1E293B' }}>{fees?.dueDate || 'Current Cycle'}</Text>
                </Text>
              </View>
            </View>

            {/* Pay Now Direct Button */}
            <TouchableOpacity
              style={styles.payNowBtn}
              onPress={() => router.push('/(student)/fees' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet-outline" size={18} color="#fff" />
              <Text style={styles.payNowBtnText}>Pay Fees via UPI to Unlock</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.unlockInstantNotice}>
              ✨ Unlocks automatically in real-time as soon as payment is confirmed.
            </Text>
          </View>
        )}

        {/* CASE 5: Student is Class 12 AND Fees are PAID -> Full Unlocked PYQ Browser */}
        {isClass12Student && !feesLoading && isFeePaid && (
          <View>
            {/* Hero Banner */}
            <View style={styles.heroBanner}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.betaBadge}>
                  <Ionicons name="sparkles" size={12} color="#fff" />
                  <Text style={styles.betaBadgeText}>BETA RELEASE</Text>
                </View>
                <View style={styles.feeClearedPill}>
                  <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                  <Text style={styles.feeClearedPillText}>Tuition Cleared</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Class 12 Question Bank</Text>
              <Text style={styles.heroSub}>
                DHSE Kerala State Board • Past Board Exams, Model Tests, and Terminal Papers from 2020 to 2026 with Verified Keys.
              </Text>
            </View>

            {/* Subject Selector Bar */}
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>1. Select Subject</Text>
              <Text style={styles.subjectCountHint}>{CLASS_12_SUBJECTS_LIST.length} Subjects</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectScroll}
            >
              {CLASS_12_SUBJECTS_LIST.map((sub) => {
                const isSelected = selectedSubjectKey === sub.key;
                return (
                  <TouchableOpacity
                    key={sub.key}
                    style={[
                      styles.subjectChip,
                      isSelected && { borderColor: sub.color, backgroundColor: sub.color },
                    ]}
                    onPress={() => setSelectedSubjectKey(sub.key)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.subjectIconCircle,
                        { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : sub.bg },
                      ]}
                    >
                      <Ionicons
                        name={getSubjectIonIcon(sub.icon)}
                        size={16}
                        color={isSelected ? '#fff' : sub.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.subjectChipText,
                        isSelected && { color: '#fff', fontFamily: 'Inter_700Bold' },
                      ]}
                    >
                      {sub.name}
                    </Text>
                    <View
                      style={[
                        styles.paperCountBadge,
                        isSelected ? { backgroundColor: 'rgba(255,255,255,0.3)' } : { backgroundColor: '#E2E8F0' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.paperCountText,
                          isSelected ? { color: '#fff' } : { color: Colors.textSecondary },
                        ]}
                      >
                        {sub.papersCount}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search & Category Filter Section */}
            <View style={styles.filterSection}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color="#94A3B8" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search year (e.g. 2026), Malayalam, Model..."
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                      onPress={() => setSelectedCategory(cat.id)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          isActive && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Papers Listing Header */}
            <View style={styles.listHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons
                  name={getSubjectIonIcon(currentSubject.icon)}
                  size={18}
                  color={currentSubject.color}
                />
                <Text style={styles.listHeaderTitle}>{currentSubject.subjectName}</Text>
              </View>
              <Text style={styles.listHeaderCount}>
                {totalMatchingPapers} {totalMatchingPapers === 1 ? 'Paper' : 'Papers'}
              </Text>
            </View>

            {/* Empty Search State */}
            {filteredSections.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="document-text-outline" size={44} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Papers Found</Text>
                <Text style={styles.emptySub}>
                  No question papers match &ldquo;{searchQuery}&rdquo; in this category. Try searching another year or clear the search.
                </Text>
                <TouchableOpacity
                  style={styles.clearSearchBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                >
                  <Text style={styles.clearSearchBtnText}>Show All {currentSubject.subjectName} Papers</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section Groups */}
            {filteredSections.map((sec) => (
              <View key={sec.id} style={styles.sectionWrap}>
                <View style={styles.sectionBar}>
                  <Text style={styles.sectionBarTitle}>{sec.title}</Text>
                  <View style={styles.sectionBarBadge}>
                    <Text style={styles.sectionBarBadgeText}>
                      {sec.cards.length + sec.practiceSets.length}
                    </Text>
                  </View>
                </View>

                {/* Exam Cards */}
                {sec.cards.map((card: PyqCard) => (
                  <View key={card.id} style={styles.paperCard}>
                    <View style={styles.cardTop}>
                      <View style={styles.yearPill}>
                        <Text style={styles.yearPillText}>{card.year || 'Exam'}</Text>
                      </View>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {card.title}
                      </Text>
                    </View>

                    {/* Buttons Row */}
                    <View style={styles.cardActions}>
                      {card.links.map((link, idx) => {
                        const isQp = link.type === 'qp';
                        return (
                          <TouchableOpacity
                            key={idx}
                            style={[styles.linkBtn, isQp ? styles.linkBtnQp : styles.linkBtnKey]}
                            onPress={() => handleOpenLink(link)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isQp ? 'document-text' : 'checkmark-circle'}
                              size={15}
                              color="#fff"
                            />
                            <Text style={styles.linkBtnText} numberOfLines={1}>
                              {link.label}
                            </Text>
                            <Ionicons name="open-outline" size={13} color="rgba(255,255,255,0.7)" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}

                {/* Practice Sets Grid (if any) */}
                {sec.practiceSets.length > 0 && (
                  <View style={styles.practiceGrid}>
                    {sec.practiceSets.map((pset, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.practiceSetCard}
                        onPress={() => handleOpenLink(pset)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="document-attach" size={20} color="#DC2626" />
                        <Text style={styles.practiceSetText} numberOfLines={2}>
                          {pset.label}
                        </Text>
                        <View style={styles.openPill}>
                          <Text style={styles.openPillText}>PDF</Text>
                          <Ionicons name="open-outline" size={11} color={Colors.primary} />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Footer Tip */}
            <View style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={20} color="#0284C7" />
              <Text style={styles.tipText}>
                <Text style={{ fontFamily: 'Inter_700Bold' }}>Study Tip: </Text>
                Practicing at least 5 years of previous board exams with the official answer keys boosts exam score by over 25%. Tap any button to view and practice offline.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: Colors.primary },
  headerSub: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, letterSpacing: 0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  classPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  classPillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: Colors.primary },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },

  loaderWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: '#64748B',
  },

  // Non-Class-12 Screen Styles
  nonClass12Banner: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  prepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  prepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.4)',
  },
  prepPillText: { color: '#FCD34D', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  prepClassText: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  nonClass12Title: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginBottom: 6 },
  nonClass12Sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#CBD5E1', lineHeight: 18 },

  upcomingHeaderRow: {
    marginBottom: 12,
  },
  upcomingHeaderTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  upcomingHeaderSub: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B' },

  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  previewIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: { flex: 1 },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  previewTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#1E293B', flex: 1, marginRight: 8 },
  previewTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewTagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  previewDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', lineHeight: 17, marginBottom: 8 },
  lockedFootRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedFootText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#94A3B8' },

  inspirationBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    gap: 4,
  },
  inspiText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.primary, textAlign: 'center', lineHeight: 20 },
  inspiSubText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B' },

  // Fee Locked Screen Styles
  feeLockedCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 24,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lockIconCircleBig: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  lockShieldBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeLockedTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#1E293B', textAlign: 'center', marginBottom: 8 },
  feeLockedSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', lineHeight: 19, marginBottom: 20 },

  dueHighlightBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
  },
  dueHighlightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dueHighlightLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
  dueHighlightAmount: { fontSize: 24, fontFamily: 'Inter_800ExtraBold', color: '#DC2626', marginTop: 2 },
  dueStatusBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  dueStatusBadgeText: { color: '#DC2626', fontSize: 11, fontFamily: 'Inter_800ExtraBold' },
  dueDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  dueMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dueMetaText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },

  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  payNowBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  unlockInstantNotice: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B', marginTop: 12, textAlign: 'center' },

  // Pending Verification Screen Styles
  pendingVerificationCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 24,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  pendingIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pendingCardTitle: { fontSize: 17, fontFamily: 'Inter_800ExtraBold', color: '#92400E', textAlign: 'center', marginBottom: 8 },
  pendingCardSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#78350F', textAlign: 'center', lineHeight: 18, marginBottom: 18 },
  pendingInfoRow: { flexDirection: 'row', width: '100%', gap: 12, marginBottom: 18 },
  pendingInfoItem: { flex: 1, backgroundColor: '#FEF3C7', padding: 12, borderRadius: 10, alignItems: 'center' },
  pendingInfoLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#92400E' },
  pendingInfoVal: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#78350F', marginTop: 2 },
  pendingViewBtn: {
    backgroundColor: '#FFFBEB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingViewBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#B45309' },

  // Class 12 Unlocked Hero Banner Styles
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    marginTop: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  betaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  betaBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  feeClearedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  feeClearedPillText: { color: '#34D399', fontSize: 10, fontFamily: 'Inter_700Bold' },
  heroTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#CBD5E1', lineHeight: 18 },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  subjectCountHint: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },

  subjectScroll: { gap: 8, paddingBottom: 14 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  subjectIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#334155' },
  paperCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  paperCountText: { fontSize: 10, fontFamily: 'Inter_700Bold' },

  filterSection: { marginBottom: 14, gap: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: '#1E293B' },

  categoryScroll: { gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#64748B' },
  categoryChipTextActive: { color: '#fff' },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  listHeaderTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  listHeaderCount: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  sectionWrap: { marginBottom: 20 },
  sectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionBarTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionBarBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionBarBadgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#475569' },

  paperCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  yearPill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  yearPillText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: 'Inter_700Bold', color: '#1E293B' },

  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkBtnQp: { backgroundColor: '#0284C7' },
  linkBtnKey: { backgroundColor: '#16A34A' },
  linkBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold', maxWidth: 180 },

  practiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  practiceSetCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 6,
  },
  practiceSetText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#1E293B', flex: 1 },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  openPillText: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.primary },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 30,
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#1E293B' },
  emptySub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', lineHeight: 18 },
  clearSearchBtn: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  clearSearchBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.primary },

  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginTop: 10,
    marginBottom: 20,
  },
  tipText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#0369A1', lineHeight: 18 },
});
