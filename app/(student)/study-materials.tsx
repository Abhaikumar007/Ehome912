import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { studyMaterials as defaultMaterials } from '../../constants/mockData';
import { DataService } from '../../lib/dataService';
import { useAuth } from '../../lib/authContext';

const subjects = ['All Subjects', 'Physics', 'Chemistry', 'Maths'];
const tabs = ['Notes & Summaries', 'Important Questions'];

export default function StudyMaterialsScreen() {
  const router = useRouter();
  const { student } = useAuth();
  const [materialsList, setMaterialsList] = useState(defaultMaterials);
  const [activeSubject, setActiveSubject] = useState('All Subjects');
  const [activeTab, setActiveTab] = useState('Notes & Summaries');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const res = await DataService.getStudyMaterials();
      if (res && res.length > 0) {
        setMaterialsList(res);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch {}
    setRefreshing(false);
  };

  const filtered = materialsList.filter((m) => {
    const matchSubject = activeSubject === 'All Subjects' || m.subject === activeSubject;
    const matchSearch = search === '' || m.title.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Ionicons name="book" size={16} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>EduHome</Text>
            <Text style={styles.headerSub}>YOUR SECOND HOME</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.classPill}>
            <Text style={styles.classPillText}>{student?.class || 'Class 12'} ▾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(student)/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
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

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/(student)/materials')}>
          <Text style={styles.breadcrumbLink}>← Materials</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> / </Text>
        <Text style={styles.breadcrumbActive}>Study Materials</Text>
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
          <Text style={styles.pageTitle}>Study Materials</Text>
          <View style={styles.cbseBadge}><Text style={styles.cbseText}>Class 12 CBSE</Text></View>
        </View>
        <Text style={styles.pageSub}>Comprehensive handpicked notes, formula cheat-sheets & high-yield PYQs.</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chapter, formula, question..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          <Ionicons name="options-outline" size={18} color={Colors.textSecondary} />
        </View>

        {/* Subject Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectScroll}>
          {subjects.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.subjectBtn, activeSubject === s && styles.subjectBtnActive]}
              onPress={() => setActiveSubject(s)}
            >
              <Text style={[styles.subjectText, activeSubject === s && styles.subjectTextActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Toggle */}
        <View style={styles.tabRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
              onPress={() => setActiveTab(t)}
            >
              <Ionicons
                name={t === 'Notes & Summaries' ? 'document-text-outline' : 'help-circle-outline'}
                size={14}
                color={activeTab === t ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Handwritten & Revision{'\n'}Notes</Text>
          <Text style={styles.moduleCount}>3 Modules{'\n'}available</Text>
        </View>

        {/* Material Cards */}
        {filtered.map((m) => (
          <View key={m.id} style={styles.materialCard}>
            {/* Card header */}
            <View style={styles.cardTop}>
              <View style={[styles.matIcon, { backgroundColor: m.iconBg }]}>
                <Ionicons name={m.icon as any} size={20} color={m.iconColor} />
              </View>
              <View style={styles.matMeta}>
                <Text style={styles.matSubject}>{m.subject.toUpperCase()} • {m.chapter}</Text>
                <Text style={styles.matTitle}>{m.title}</Text>
                <Text style={styles.matDesc}>{m.desc}</Text>
              </View>
              <Ionicons name="bookmark-outline" size={18} color={Colors.textMuted} />
            </View>

            <View style={[styles.tagWrap, { backgroundColor: m.tagColor }]}>
              <Ionicons name="reader-outline" size={12} color={m.iconColor} />
              <Text style={[styles.tagText, { color: m.iconColor }]}>{m.tag}</Text>
            </View>

            <View style={styles.fileInfo}>
              <Ionicons name="document-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.fileInfoText}>{m.pages} Pages • PDF • {m.size}</Text>
            </View>

            <View style={styles.hintRow}>
              <Ionicons name="bulb-outline" size={13} color={Colors.textMuted} />
              <Text style={styles.hintText} numberOfLines={2}>
                {m.id === 'sm1' && 'Includes step-by-step ray diagrams, mirror formula signs, and refractive index shortcuts.'}
                {m.id === 'sm2' && 'Quick table for redox identifications, exothermic reactions, and rust prevention steps.'}
                {m.id === 'sm3' && 'Hand-picked board exemplar solutions showing how to avoid sign errors in factorization.'}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.readBtn}>
                <Ionicons name="eye-outline" size={15} color={Colors.primary} />
                <Text style={styles.readBtnText}>Read Online</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadBtn}>
                <Ionicons name="download-outline" size={15} color="#fff" />
                <Text style={styles.downloadBtnText}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* High-Yield Banner */}
        <View style={styles.highYieldBanner}>
          <View style={styles.hyBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.hyBadgeText}>Senior Faculty Recommended</Text>
          </View>
          <Text style={styles.hyEmoji}>🎯</Text>
          <Text style={styles.hyTitle}>High-Yield Question Bank</Text>
          <Text style={styles.hyDesc}>Curated specifically from CBSE 10-year recurring trends for guaranteed scoring boost.</Text>
        </View>

        {/* IQ Row */}
        <View style={styles.iqCard}>
          <View style={styles.iqBadge}>
            <Ionicons name="flame" size={12} color={Colors.red} />
            <Text style={styles.iqBadgeText}>Most Repeated in Boards</Text>
            <Text style={styles.iqMarks}>3 & 5 Mark Sets</Text>
          </View>
          <Text style={styles.iqTitle}>Top 25 Important Questions: Electricity & Circuits</Text>
          <Text style={styles.iqDesc}>Ohm's law derivations, Joule's heating numericals, and resistor combinations.</Text>
          <View style={styles.iqFooter}>
            <View style={styles.iqStats}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.green} />
              <Text style={styles.iqStatsText}>25 Questions • 100% Solved</Text>
            </View>
            <TouchableOpacity style={styles.viewQBtn}>
              <Text style={styles.viewQText}>View{'\n'}Questions</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="person-circle-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.tipText}>
            <Text style={styles.tipBold}>Consistency is your superpower! </Text>
            Review 1 summary note and solve 5 high-yield questions every single day to ace your target scores.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 4 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.background },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  headerSub: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  classPillText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_700Bold' },

  breadcrumb: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 4 },
  breadcrumbLink: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_500Medium' },
  breadcrumbSep: { fontSize: 12, color: Colors.textMuted },
  breadcrumbActive: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_700Bold' },

  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  pageTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  cbseBadge: { backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  cbseText: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  pageSub: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 2, marginBottom: 14, lineHeight: 18 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.cardBg, borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontFamily: 'Inter_400Regular' },

  subjectScroll: { marginBottom: 10 },
  subjectBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  subjectBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  subjectText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  subjectTextActive: { color: '#fff', fontFamily: 'Inter_700Bold' },

  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.cardBg,
  },
  tabBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, lineHeight: 22 },
  moduleCount: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', textAlign: 'right' },

  materialCard: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  matIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  matMeta: { flex: 1 },
  matSubject: { fontSize: 10, color: Colors.primary, fontFamily: 'Inter_700Bold', letterSpacing: 0.5, marginBottom: 3 },
  matTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, lineHeight: 20, marginBottom: 4 },
  matDesc: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', lineHeight: 16 },

  tagWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  fileInfoText: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },

  hintRow: { flexDirection: 'row', gap: 5, alignItems: 'flex-start', marginBottom: 12, backgroundColor: Colors.background, borderRadius: 8, padding: 8 },
  hintText: { flex: 1, fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', lineHeight: 16 },

  actionRow: { flexDirection: 'row', gap: 10 },
  readBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10, paddingVertical: 10,
  },
  readBtnText: { fontSize: 13, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
  downloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 10,
  },
  downloadBtnText: { fontSize: 13, color: '#fff', fontFamily: 'Inter_600SemiBold' },

  highYieldBanner: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 16, marginBottom: 12,
  },
  hyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  hyBadgeText: { fontSize: 10, color: '#fff', fontFamily: 'Inter_600SemiBold' },
  hyEmoji: { fontSize: 20, marginBottom: 4 },
  hyTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 6 },
  hyDesc: { fontSize: 12, color: '#93C5FD', fontFamily: 'Inter_400Regular', lineHeight: 18 },

  iqCard: { backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.borderLight },
  iqBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  iqBadgeText: { fontSize: 11, color: Colors.red, fontFamily: 'Inter_600SemiBold', flex: 1 },
  iqMarks: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  iqTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, lineHeight: 20, marginBottom: 4 },
  iqDesc: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  iqFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iqStats: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  iqStatsText: { fontSize: 12, color: Colors.green, fontFamily: 'Inter_600SemiBold' },
  viewQBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  viewQText: { fontSize: 11, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  tipCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.cardBg, borderRadius: 14, padding: 14, marginBottom: 4,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  tipIcon: {},
  tipText: { flex: 1, fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  tipBold: { fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
});
