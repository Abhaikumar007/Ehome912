import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../../constants/colors';
import { DataService } from '../../lib/dataService';

interface UploadedFile {
  name: string;
  size?: number;
  uri: string;
  mimeType?: string;
}

export default function TeacherMaterialsScreen() {
  const router = useRouter();
  const [activeSubject, setActiveSubject] = useState('All');
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal and form states
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [chapterInput, setChapterInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('Physics');
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await DataService.getTeacherMaterials();
      setMaterials(data || []);
    } catch (e) {
      console.warn('Error loading teacher materials:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeSubject === 'All'
    ? materials
    : materials.filter((m) => m.subject.toLowerCase() === activeSubject.toLowerCase());

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile({
          name: file.name,
          size: file.size,
          uri: file.uri,
          mimeType: file.mimeType,
        });
      }
    } catch (err) {
      console.warn('Error selecting document:', err);
      Alert.alert('File Picker Error', 'Unable to access document. Please grant storage permissions.');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getSubjectIcon = (sub: string) => {
    const s = sub.toLowerCase();
    if (s.includes('chem')) return 'flask-outline';
    if (s.includes('phys')) return 'flash-outline';
    if (s.includes('math')) return 'calculator-outline';
    if (s.includes('bio')) return 'leaf-outline';
    if (s.includes('comp')) return 'code-slash-outline';
    return 'document-text-outline';
  };

  const getSubjectColor = (sub: string) => {
    const s = sub.toLowerCase();
    if (s.includes('chem')) return '#10B981';
    if (s.includes('phys')) return '#0284C7';
    if (s.includes('math')) return '#8B5CF6';
    if (s.includes('bio')) return '#059669';
    if (s.includes('comp')) return '#F59E0B';
    return '#64748B';
  };

  const handleUpload = async () => {
    if (!titleInput.trim()) {
      Alert.alert('Title Required', 'Please enter a module or chapter title.');
      return;
    }

    if (!selectedFile) {
      Alert.alert('File Required', 'Please tap "Choose Document / PDF" to attach a file before publishing.');
      return;
    }

    setIsUploading(true);
    try {
      const color = getSubjectColor(subjectInput);
      const icon = getSubjectIcon(subjectInput);

      const newMat = {
        id: 'mat-' + Date.now().toString(),
        subject: subjectInput,
        chapter: chapterInput.trim() || 'Unit Revision',
        title: titleInput.trim(),
        fileName: selectedFile.name,
        fileUri: selectedFile.uri,
        desc: `Published ${selectedFile.name}`,
        tag: "Teacher's Uploaded Notes",
        tagColor: '#EBF3FF',
        size: formatFileSize(selectedFile.size),
        icon,
        iconBg: color + '15',
        iconColor: color,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      };

      const updated = await DataService.saveTeacherMaterial(newMat);
      setMaterials(updated);

      // Reset
      setTitleInput('');
      setChapterInput('');
      setSelectedFile(null);
      setUploadModalVisible(false);
      Alert.alert('Upload Successful', `"${newMat.title}" has been published and is immediately accessible to students.`);
    } catch (e) {
      Alert.alert('Upload Failed', 'Could not save material. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMaterial = (item: any) => {
    Alert.alert(
      'Delete Study Material',
      `Are you sure you want to delete "${item.title}"? This will permanently remove it from the student repository.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await DataService.deleteTeacherMaterial(item.id);
              setMaterials(updated);
              Alert.alert('Deleted', `"${item.title}" has been deleted.`);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete material.');
            }
          },
        },
      ]
    );
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
            <Text style={[styles.statVal, { color: Colors.green }]}>
              {materials.length > 0 ? `${materials.length * 14}` : '0'}
            </Text>
            <Text style={styles.statLabel}>Student Views</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: '#F5F3FF' }]}>
            <Text style={[styles.statVal, { color: '#8B5CF6' }]}>
              {materials.length > 0 ? `${materials.length * 6}` : '0'}
            </Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>
        </View>

        {/* Subject Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'].map((s) => (
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

        {/* Materials List or Empty State */}
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.emptySub}>Loading repository...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={36} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>None Available</Text>
            <Text style={styles.emptySub}>
              {activeSubject === 'All'
                ? 'No study materials uploaded yet. Tap "+ Upload" to publish notes for students.'
                : `No study materials uploaded yet for ${activeSubject}.`}
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={() => setUploadModalVisible(true)}>
              <Ionicons name="cloud-upload-outline" size={16} color="#0284C7" />
              <Text style={styles.emptyActionText}>Upload First Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((item) => (
            <View key={item.id} style={styles.materialCard}>
              <View style={[styles.matIconWrap, { backgroundColor: item.iconBg || '#F0F9FF' }]}>
                <Ionicons name={item.icon || 'document-text-outline'} size={22} color={item.iconColor || '#0284C7'} />
              </View>
              <View style={styles.matInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.matChapter}>{item.subject} • {item.chapter}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteMaterial(item)}
                    style={styles.deleteMatBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.matTitle}>{item.title}</Text>
                {item.fileName ? (
                  <Text style={styles.matFileName} numberOfLines={1}>
                    📎 {item.fileName}
                  </Text>
                ) : null}
                <View style={styles.matMetaRow}>
                  <Text style={styles.matMeta}>{item.size} • {item.uploadedAt || 'Published'}</Text>
                  <View style={styles.statusPill}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active for Students</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}

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

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Subject</Text>
              <View style={styles.subjectRow}>
                {['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science'].map((sub) => (
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
                placeholder="e.g. Chapter 10 – Chemical Kinetics"
                placeholderTextColor={Colors.textMuted}
                value={chapterInput}
                onChangeText={setChapterInput}
              />

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Rate of Reaction Formulas & PYQ"
                placeholderTextColor={Colors.textMuted}
                value={titleInput}
                onChangeText={setTitleInput}
              />

              {/* Document Picker Box */}
              <Text style={styles.inputLabel}>Attach Document / PDF</Text>
              <TouchableOpacity
                style={[styles.filePickerBox, selectedFile && styles.filePickerBoxActive]}
                onPress={handlePickDocument}
                activeOpacity={0.8}
              >
                {selectedFile ? (
                  <View style={styles.fileSelectedContent}>
                    <View style={styles.fileIconCircle}>
                      <Ionicons name="document-text" size={24} color="#0284C7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedFileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.selectedFileSize}>
                        {formatFileSize(selectedFile.size)} • Ready to upload
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      style={styles.removeFileBtn}
                    >
                      <Ionicons name="close-circle" size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.filePickerEmpty}>
                    <Ionicons name="cloud-upload-outline" size={30} color="#0284C7" />
                    <Text style={styles.filePickerPrompt}>Choose Document or PDF</Text>
                    <Text style={styles.filePickerSub}>Tap to browse files from device</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadSubmitBtn, isUploading && { opacity: 0.6 }]}
                onPress={handleUpload}
                activeOpacity={0.85}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="cloud-done" size={18} color="#fff" style={{ marginRight: 6 }} />
                )}
                <Text style={styles.uploadSubmitBtnText}>
                  {isUploading ? 'Publishing...' : 'Publish to Student App'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  filterChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },

  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  emptyActionText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },

  materialCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  deleteMatBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
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
  matChapter: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#0284C7', textTransform: 'uppercase' },
  matTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginTop: 2 },
  matFileName: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#475569', marginTop: 3 },
  matMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  matMeta: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF3', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.green },
  statusText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.green },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 6, marginTop: 10 },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  subPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subPillActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  subPillText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary },
  subPillTextActive: { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    backgroundColor: '#FAFAFA',
  },

  filePickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BAE6FD',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  filePickerBoxActive: {
    borderStyle: 'solid',
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  filePickerEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePickerPrompt: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
    marginTop: 6,
  },
  filePickerSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  fileSelectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  fileIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFileName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  selectedFileSize: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  removeFileBtn: {
    padding: 4,
  },

  uploadSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 8,
    marginBottom: 16,
  },
  uploadSubmitBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
});
