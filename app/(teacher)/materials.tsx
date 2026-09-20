import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { studyMaterials } from '../../constants/mockData';

export default function TeacherMaterialsScreen() {
  const router = useRouter();
  const [activeSubject, setActiveSubject] = useState('All');
  const [materials, setMaterials] = useState(studyMaterials);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [chapterInput, setChapterInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('Physics');

  const filtered = activeSubject === 'All'
    ? materials
    : materials.filter((m) => m.subject.toLowerCase() === activeSubject.toLowerCase());

  const handleUpload = () => {
    if (!titleInput.trim()) {
      Alert.alert('Required', 'Please enter a module title.');
      return;
    }

    const newMat = {
      id: Date.now().toString(),
      subject: subjectInput,
      chapter: chapterInput.trim() || 'Chapter Revision',
      title: titleInput.trim(),
      desc: 'Teacher annotated study material for board preparation',
      tag: "Teacher's Uploaded Notes",
      tagColor: '#EBF3FF',
      pages: 12,
      size: '3.4 MB',
      icon: subjectInput === 'Physics' ? 'flash-outline' : subjectInput === 'Chemistry' ? 'flask-outline' : 'calculator-outline',
      iconBg: '#EBF3FF',
      iconColor: '#0284C7',
    };

    setMaterials([newMat, ...materials]);
    setTitleInput('');
    setChapterInput('');
    setUploadModalVisible(false);
    Alert.alert('Success', 'Study material uploaded and published to all Class 10 & 12 students.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/eduhome.png')}
            style={styles.headerLogoImg}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.logoTitle}>EDU HOME</Text>
            <Text style={styles.logoSub}>FACULTY PORTAL</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.uploadTopBtn} onPress={() => setUploadModalVisible(true)}>
          <Ionicons name="cloud-upload" size={16} color="#fff" />
          <Text style={styles.uploadTopText}>+ Upload</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Study Material Repository</Text>
          <Text style={styles.pageSub}>Manage and publish handwritten notes & formulas</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: '#F0F9FF' }]}>
            <Text style={[styles.statVal, { color: '#0284C7' }]}>{materials.length}</Text>
            <Text style={styles.statLabel}>Published Notes</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#ECFDF3' }]}>
            <Text style={[styles.statVal, { color: Colors.green }]}>1,420</Text>
            <Text style={styles.statLabel}>Student Views</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#F5F3FF' }]}>
            <Text style={[styles.statVal, { color: '#8B5CF6' }]}>864</Text>
            <Text style={styles.statLabel}>PDF Downloads</Text>
          </View>
        </View>

        {/* Subject Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Physics', 'Chemistry', 'Mathematics'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.filterChip, activeSubject === s && styles.filterChipActive]}
              onPress={() => setActiveSubject(s)}
            >
              <Text style={[styles.filterChipText, activeSubject === s && styles.filterChipTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List of Materials */}
        {filtered.map((item) => (
          <View key={item.id} style={styles.materialCard}>
            <View style={[styles.matIconWrap, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
            </View>
            <View style={styles.matInfo}>
              <Text style={styles.matChapter}>{item.subject} • {item.chapter}</Text>
              <Text style={styles.matTitle}>{item.title}</Text>
              <Text style={styles.matDesc}>{item.desc}</Text>
              <View style={styles.matMetaRow}>
                <Text style={styles.matMeta}>{item.pages} Pages • {item.size}</Text>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Active for Students</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Upload Study Material</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Subject</Text>
            <View style={styles.subjectRow}>
              {['Physics', 'Chemistry', 'Maths'].map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={[styles.subPill, subjectInput === sub && styles.subPillActive]}
                  onPress={() => setSubjectInput(sub)}
                >
                  <Text style={[styles.subPillText, subjectInput === sub && styles.subPillTextActive]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Chapter / Unit</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Chapter 10 – Optics"
              placeholderTextColor={Colors.textMuted}
              value={chapterInput}
              onChangeText={setChapterInput}
            />

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Ray Diagrams & Mirror Formula"
              placeholderTextColor={Colors.textMuted}
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <TouchableOpacity style={styles.uploadSubmitBtn} onPress={handleUpload} activeOpacity={0.85}>
              <Ionicons name="cloud-done" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.uploadSubmitBtnText}>Publish to Student App</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogoImg: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#0284C7', letterSpacing: 0.5 },
  logoSub: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },

  uploadTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  uploadTopText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  titleSection: { marginTop: 8, marginBottom: 14 },
  pageTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  pageSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statVal: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginTop: 2 },

  filterScroll: { marginBottom: 14 },
  filterChip: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  filterChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },

  materialCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  matIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  matInfo: { flex: 1 },
  matChapter: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#0284C7' },
  matTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginVertical: 2 },
  matDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginBottom: 6 },
  matMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  matMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textMuted },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  statusText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: Colors.green },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 6 },
  subjectRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  subPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  subPillActive: { backgroundColor: '#F0F9FF', borderColor: '#0284C7' },
  subPillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  subPillTextActive: { color: '#0284C7' },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  uploadSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 48,
    marginTop: 8,
  },
  uploadSubmitBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
