import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';
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

  // Pick first subject (prioritize student's enrolled subject if matches, else Physics/Maths)
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

  // Total matching count
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

  const isClass12Student =
    !student?.class ||
    student.class.includes('12') ||
    student.class.toLowerCase().includes('plus two');

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
          <View style={styles.classPill}>
            <Text style={styles.classPillText}>Class 12 (Plus Two)</Text>
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
      >
        {/* Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroBadgeRow}>
            <View style={styles.betaBadge}>
              <Ionicons name="sparkles" size={12} color="#fff" />
              <Text style={styles.betaBadgeText}>BETA RELEASE</Text>
            </View>
            <Text style={styles.boardBadgeText}>Kerala State Board (DHSE)</Text>
          </View>

          <Text style={styles.heroTitle}>Class 12 Question Bank</Text>
          <Text style={styles.heroSub}>
            Past Board Exams, Model Tests, and Terminal Papers from 2020 to 2026 with Verified Answer Keys.
          </Text>

          {!isClass12Student && (
            <View style={styles.classNotice}>
              <Ionicons name="information-circle" size={15} color="#D97706" />
              <Text style={styles.classNoticeText}>
                Previewing Class 12 PYQ papers. Class {student?.class || '10'} resources are coming soon!
              </Text>
            </View>
          )}
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

        {/* Footer Info Tip */}
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#0284C7" />
          <Text style={styles.tipText}>
            <Text style={{ fontFamily: 'Inter_700Bold' }}>Study Tip: </Text>
            Practicing at least 5 years of previous board exams with the official answer keys boosts exam score by over 25%. Tap any button to view and practice offline.
          </Text>
        </View>
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
  boardBadgeText: { color: '#94A3B8', fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  heroTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginBottom: 6 },
  heroSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#CBD5E1', lineHeight: 18 },
  classNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  classNoticeText: { color: '#FCD34D', fontSize: 11, fontFamily: 'Inter_500Medium', flex: 1 },

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
