import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const categories = [
  {
    id: 'study',
    icon: 'document-text-outline',
    iconBg: '#EBF3FF',
    iconColor: Colors.primary,
    borderColor: Colors.primaryLight,
    title: 'Study Materials',
    desc: 'Notes, summaries, important questions and solved examples.',
    tags: ['Notes', 'Important Qs'],
    tagColors: [Colors.primaryLight, '#F5F3FF'],
    tagTextColors: [Colors.primary, Colors.purple],
    route: '/(student)/study-materials',
  },
  {
    id: 'practical',
    icon: 'flask-outline',
    iconBg: '#FFF7ED',
    iconColor: Colors.orange,
    borderColor: '#FDDCAB',
    title: 'Practical Classes',
    desc: 'Watch experiments, live sessions and lab demonstrations either Virtually',
    tags: ['Videos', 'Experiments'],
    tagColors: ['#FEF3F2', '#FFF7ED'],
    tagTextColors: [Colors.red, Colors.orange],
    route: '/(student)/practical-classes',
    comingSoon: true,
  },
  {
    id: 'mock',
    icon: 'clipboard-outline',
    iconBg: Colors.greenLight,
    iconColor: Colors.green,
    borderColor: '#A6F4C5',
    title: 'Mock Test & PYQ',
    desc: 'Practice chapter tests, full syllabus tests and previous year questions.',
    tags: ['Mock Tests', 'Previous Year Questions'],
    tagColors: [Colors.greenLight, Colors.greenLight],
    tagTextColors: [Colors.teal, Colors.teal],
    route: '/(student)/mock-tests',
    comingSoon: false,
  },
];

export default function MaterialsScreen() {
  const router = useRouter();

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
            <Text style={styles.classPillText}>Class 12</Text>
            <Ionicons name="chevron-down" size={13} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AS</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Materials</Text>
        <Text style={styles.pageSub}>Learn your way. One step closer to your goals.</Text>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.card, { borderColor: cat.borderColor }]}
            activeOpacity={cat.route ? 0.85 : 1}
            onPress={() => cat.route && router.push(cat.route as any)}
          >
            <View style={styles.cardTop}>
              <View style={[styles.cardIcon, { backgroundColor: cat.iconBg }]}>
                <Ionicons name={cat.icon as any} size={26} color={cat.iconColor} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{cat.title}</Text>
                <Text style={styles.cardDesc}>{cat.desc}</Text>
                <View style={styles.tagRow}>
                  {cat.tags.map((tag, i) => (
                    <View key={tag} style={[styles.tag, { backgroundColor: cat.tagColors[i] }]}>
                      <Text style={[styles.tagText, { color: cat.tagTextColors[i] }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
                {cat.comingSoon && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Inspiration Banner */}
        <View style={styles.inspirationBanner}>
          <View style={styles.mountainWrap}>
            <View style={styles.mountain1} />
            <View style={styles.mountain2} />
            <View style={styles.flag}>
              <Ionicons name="flag" size={14} color={Colors.red} />
            </View>
          </View>
          <Text style={styles.inspiText}>Discipline today,{'\n'}Results tomorrow.</Text>
          <Text style={styles.inspiSubText}>Smaller{'\n'}Steps{'\n'}Bigger You!</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: 16, paddingTop: 8 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.background,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Colors.primary, letterSpacing: 0.5 },
  headerSub: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, letterSpacing: 0.3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  classPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.cardBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  classPillText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, color: '#fff', fontFamily: 'Inter_700Bold' },

  pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 8 },
  pageSub: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 20, marginTop: 2 },

  card: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16,
    marginBottom: 14, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', lineHeight: 17, marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  comingSoonBadge: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: Colors.amberLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  comingSoonText: { fontSize: 10, color: Colors.amber, fontFamily: 'Inter_600SemiBold' },

  inspirationBanner: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 20,
    marginTop: 4, flexDirection: 'row', alignItems: 'flex-end',
    overflow: 'hidden', minHeight: 110,
  },
  mountainWrap: { position: 'absolute', right: 60, bottom: 0 },
  mountain1: {
    width: 0, height: 0,
    borderLeftWidth: 40, borderRightWidth: 40, borderBottomWidth: 70,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#3B82F6',
  },
  mountain2: {
    position: 'absolute', left: -20, bottom: 0,
    width: 0, height: 0,
    borderLeftWidth: 30, borderRightWidth: 30, borderBottomWidth: 55,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#1D4ED8',
  },
  flag: { position: 'absolute', top: -14, left: 26 },
  inspiText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 22, flex: 1 },
  inspiSubText: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#93C5FD', textAlign: 'right' },
});
