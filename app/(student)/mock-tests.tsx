import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function MockTestsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(student)/materials')}>
          <Ionicons name="chevron-back" size={22} color={Colors.primary} />
          <Text style={styles.backText}>Materials</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}>/</Text>
        <Text style={styles.breadcrumbActive}>Mock Tests & PYQ</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.comingSoonBadge}>
          <View style={styles.comingSoonDot} />
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        </View>
      </View>

      <View style={styles.center}>
        {/* Avatar placeholder */}
        <View style={styles.avatarCircle}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={14} color="#fff" />
          </View>
        </View>

        <View style={styles.devBadge}>
          <Ionicons name="construct" size={14} color={Colors.amber} />
          <Text style={styles.devBadgeText}>UNDER ACTIVE DEVELOPMENT</Text>
        </View>

        <Text style={styles.title}>Mock Tests & PYQs are{'\n'}Coming Soon!</Text>
        <Text style={styles.desc}>
          We are currently curating 10-year board papers, chapter-wise mock tests with instant answer keys, and teacher-evaluated offline exam simulations for Class 12.
        </Text>

        <TouchableOpacity
          style={styles.backMaterialsBtn}
          onPress={() => router.push('/(student)/materials')}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color={Colors.primary} />
          <Text style={styles.backMaterialsBtnText}>Back to Study Materials</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Handwritten notes, formulas, and revision summaries are fully accessible
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 6,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { fontSize: 14, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  breadcrumbSep: { fontSize: 14, color: Colors.textMuted },
  breadcrumbActive: { fontSize: 14, color: Colors.primary, fontFamily: 'Inter_700Bold' },
  comingSoonBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.greenLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  comingSoonDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.green },
  comingSoonText: { fontSize: 11, color: Colors.green, fontFamily: 'Inter_600SemiBold' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },

  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#D4DEFF', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  lockBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: Colors.background,
  },

  devBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginBottom: 14,
  },
  devBadgeText: { fontSize: 11, color: Colors.amber, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  title: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, textAlign: 'center', lineHeight: 28, marginBottom: 10 },
  desc: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  backMaterialsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primaryLight, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 24, width: '100%',
    marginBottom: 16,
  },
  backMaterialsBtnText: { fontSize: 15, color: Colors.primary, fontFamily: 'Inter_700Bold' },

  hint: { fontSize: 12, color: Colors.textMuted, fontFamily: 'Inter_400Regular', fontStyle: 'italic', textAlign: 'center' },
});
