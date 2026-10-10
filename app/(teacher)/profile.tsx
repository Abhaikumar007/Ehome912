import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image,
  TextInput, Modal, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../lib/authContext';
import {
  TEACHER_ROSTER,
  TeacherProfile,
  getActiveTeacher,
  getCachedActiveTeacher,
  hasTeacherSession,
  clearActiveTeacher,
  subscribeToActiveTeacher,
  updateFacultySelfProfile,
  getInitials,
} from '../../lib/teacherRoster';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

const FACULTY_AVATAR_PRESETS = [
  { id: '👨‍🏫', label: 'Teacher', bg: '#0284C7' },
  { id: '👩‍🏫', label: 'Mentor', bg: '#7C3AED' },
  { id: '🎓', label: 'Scholar', bg: '#0E9F6E' },
  { id: '🔬', label: 'Science', bg: '#0284C7' },
  { id: '💻', label: 'Tech', bg: '#2563EB' },
  { id: '📐', label: 'Maths', bg: '#D97706' },
  { id: '⚡', label: 'Pro', bg: '#EA580C' },
];

export default function TeacherProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(() => !getCachedActiveTeacher());
  const [activeTeacher, setActiveTeacher] = useState<TeacherProfile>(() => {
    return getCachedActiveTeacher() || TEACHER_ROSTER[0];
  });

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      Promise.all([hasTeacherSession(), getActiveTeacher()]).then(([isAuth, teacher]) => {
        if (!isMounted) return;
        if (!isAuth) {
          router.replace('/login');
        } else {
          if (teacher) {
            setActiveTeacher({ ...teacher });
          }
          setLoading(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }, [router])
  );

  // Edit Profile Modal States
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editQual, setEditQual] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadActiveTeacher();
    }, [])
  );

  useEffect(() => {
    loadActiveTeacher();

    const unsub = subscribeToActiveTeacher((updated) => {
      setActiveTeacher({ ...updated });
    });

    // Supabase Realtime: updates live if admin renames faculty from the admin web portal
    const channel = supabase
      .channel('teacher_profile_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
        console.log('[Realtime] Faculty update received in profile screen!');
        loadActiveTeacher();
      })
      .subscribe();

    return () => {
      unsub();
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActiveTeacher = async () => {
    const teacher = await getActiveTeacher();
    setActiveTeacher({ ...teacher });
  };

  const handleLogout = async () => {
    await clearActiveTeacher();
    await logout();
    router.replace('/login');
  };

  const handleOpenEditModal = () => {
    setEditName(activeTeacher.name || '');
    setEditPhone(activeTeacher.phone || '');
    setEditEmail(activeTeacher.email || '');
    setEditQual(activeTeacher.qualification || '');
    if (activeTeacher.avatar && (activeTeacher.avatar.startsWith('http') || activeTeacher.avatar.startsWith('file://'))) {
      setEditPhoto(activeTeacher.avatar);
      setEditAvatar('');
    } else {
      setEditPhoto(null);
      setEditAvatar(activeTeacher.avatar || getInitials(activeTeacher.name));
    }
    setEditModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please enable camera roll permissions to select a photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setEditPhoto(result.assets[0].uri);
        setEditAvatar('');
      }
    } catch {
      Alert.alert('Error', 'Could not access image library.');
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name.');
      return;
    }

    setSavingProfile(true);
    try {
      const finalAvatar = editPhoto || editAvatar || getInitials(editName.trim());
      const result = await updateFacultySelfProfile(activeTeacher.id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        qualification: editQual.trim(),
        avatar: finalAvatar,
      });

      if (result.success && result.updated) {
        setActiveTeacher({ ...result.updated });
        setEditModalVisible(false);
        Alert.alert('Profile Updated', 'Your profile details have been successfully updated and synced with the Edu Home database.');
      } else {
        Alert.alert('Update Failed', result.error || 'Could not save profile changes.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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

        <View style={styles.activeFacultyBadge}>
          <Ionicons name="shield-checkmark" size={13} color="#0284C7" />
          <Text style={styles.activeFacultyBadgeText}>{activeTeacher.subject.split(' ')[0]}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            {activeTeacher.avatar && (activeTeacher.avatar.startsWith('http') || activeTeacher.avatar.startsWith('file://')) ? (
              <Image source={{ uri: activeTeacher.avatar }} style={styles.avatarLargeImg} />
            ) : (
              <Text style={styles.avatarLargeText}>{activeTeacher.avatar || getInitials(activeTeacher.name)}</Text>
            )}
            <View style={styles.adminDotBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#fff" />
            </View>
          </View>

          <Text style={styles.profileName}>{activeTeacher.name}</Text>
          <Text style={styles.profileRole}>{activeTeacher.subject} • {activeTeacher.department}</Text>
          <Text style={styles.profileId}>{activeTeacher.qualification}</Text>

          <View style={styles.tagsRow}>
            <View style={[styles.tagPill, { backgroundColor: '#F0F9FF' }]}>
              <Text style={[styles.tagText, { color: '#0284C7' }]}>{activeTeacher.gradeDescription}</Text>
            </View>
            {activeTeacher.isTemporary && (
              <View style={[styles.tagPill, { backgroundColor: '#FFFBEB' }]}>
                <Text style={[styles.tagText, { color: '#D97706' }]}>Temporary Assignment</Text>
              </View>
            )}
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.contactText}>{activeTeacher.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.contactText}>{activeTeacher.phone}</Text>
            </View>
          </View>

          {/* Edit Profile Action Button */}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={handleOpenEditModal}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={15} color="#0284C7" />
            <Text style={styles.editProfileBtnText}>Edit Profile Details</Text>
          </TouchableOpacity>
        </View>



        {/* Faculty Settings Menu */}
        <View style={[styles.menuCard, { marginTop: 16 }]}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(teacher)' as any)}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="calendar-outline" size={18} color="#0284C7" />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Teaching Schedule & Batches</Text>
              <Text style={styles.menuSub}>{activeTeacher.gradeDescription} • Tap to view</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Center Sync', 'Attendance and exam marks are synchronized with the center Supabase cloud database.')}
          >
            <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF3' }]}>
              <Ionicons name="sync-outline" size={18} color={Colors.green} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Center Database Sync</Text>
              <Text style={styles.menuSub}>Real-time timetable & cloud backup</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={[styles.menuCard, { marginTop: 12 }]}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.red} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={[styles.menuTitle, { color: Colors.red }]}>Sign Out of Faculty Portal</Text>
              <Text style={styles.menuSub}>Return to role login screen</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !savingProfile && setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.editModalCard}>
            <View style={styles.editModalHeader}>
              <View>
                <Text style={styles.editModalTitle}>Edit Faculty Profile</Text>
                <Text style={styles.editModalSub}>Update your display name & contact details</Text>
              </View>
              <TouchableOpacity
                onPress={() => !savingProfile && setEditModalVisible(false)}
                disabled={savingProfile}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Editable Information */}
              <Text style={styles.sectionHeaderSmall}>PERSONAL INFORMATION (EDITABLE)</Text>

              {/* Photo & Avatar Section */}
              <View style={styles.modalAvatarRow}>
                <View style={styles.previewAvatarWrap}>
                  {editPhoto ? (
                    <Image source={{ uri: editPhoto }} style={styles.modalAvatarImg} />
                  ) : (
                    <View style={styles.modalAvatarBox}>
                      <Text style={styles.modalAvatarText}>{editAvatar || getInitials(editName || activeTeacher.name)}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.avatarActions}>
                  <TouchableOpacity style={styles.pickPhotoBtn} onPress={pickImage}>
                    <Ionicons name="image-outline" size={15} color="#fff" />
                    <Text style={styles.pickPhotoBtnText}>Choose Photo</Text>
                  </TouchableOpacity>
                  {editPhoto && (
                    <TouchableOpacity onPress={() => setEditPhoto(null)} style={styles.removePhotoBtn}>
                      <Text style={styles.removePhotoText}>Remove photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Avatar Presets */}
              <Text style={styles.fieldSectionLabel}>Or choose an avatar</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                {FACULTY_AVATAR_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.presetPill,
                      editAvatar === p.id && !editPhoto && styles.presetPillActive,
                    ]}
                    onPress={() => {
                      setEditPhoto(null);
                      setEditAvatar(p.id);
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{p.id}</Text>
                    <Text style={[styles.presetText, editAvatar === p.id && !editPhoto && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.inputField}
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Dr. Ramesh Nair"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.inputField}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+91 98470 XXXXX"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.inputField}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="faculty@eduhome.ac.in"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Qualifications / Degree</Text>
              <TextInput
                style={styles.inputField}
                value={editQual}
                onChangeText={setEditQual}
                placeholder="e.g. M.Sc., Ph.D."
                placeholderTextColor={Colors.textMuted}
              />

              {/* Locked Administrative Academic Info */}
              <View style={styles.lockedSectionBox}>
                <View style={styles.lockedHeaderRow}>
                  <Ionicons name="lock-closed" size={13} color="#D97706" />
                  <Text style={styles.lockedSectionTitle}>ACADEMIC ALLOTMENTS (ADMIN ONLY)</Text>
                </View>
                <Text style={styles.lockedSectionSub}>
                  Subject assignments and grade scopes are determined by Super Admin and cannot be modified by faculty.
                </Text>

                <View style={styles.lockedFieldRow}>
                  <Text style={styles.lockedFieldLabel}>Assigned Subject:</Text>
                  <Text style={styles.lockedFieldValue}>{activeTeacher.subject} 🔒</Text>
                </View>

                <View style={styles.lockedFieldRow}>
                  <Text style={styles.lockedFieldLabel}>Grade Scope:</Text>
                  <Text style={styles.lockedFieldValue}>{activeTeacher.gradeDescription} 🔒</Text>
                </View>

                <View style={styles.lockedFieldRow}>
                  <Text style={styles.lockedFieldLabel}>Department:</Text>
                  <Text style={styles.lockedFieldValue}>{activeTeacher.department} 🔒</Text>
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.editActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={savingProfile}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, savingProfile && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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

  activeFacultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeFacultyBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatarLargeText: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#fff' },
  adminDotBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  profileRole: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#0284C7', marginTop: 3 },
  profileId: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12, justifyContent: 'center' },
  tagPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  contactRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  contactText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },

  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },

  rosterSectionHeader: { marginTop: 16, marginBottom: 8 },
  rosterTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  rosterSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },

  rosterCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  teacherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  teacherItemActive: {
    backgroundColor: '#F8FAFC',
  },
  teacherAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: '#475569',
  },
  teacherNameText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  teacherSubjectText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tempBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  tempBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#D97706',
  },
  activeCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchActionText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },

  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextWrap: { flex: 1 },
  menuTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  menuSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 1 },
  menuDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 14 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  editModalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  editModalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  editModalSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionHeaderSmall: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginTop: 8,
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },

  lockedSectionBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  lockedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lockedSectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#B45309',
  },
  lockedSectionSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: '#92400E',
    marginBottom: 8,
  },
  lockedFieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  lockedFieldLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#78350F',
  },
  lockedFieldValue: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#92400E',
  },

  editActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  avatarLargeImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  modalAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 10,
  },
  previewAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  modalAvatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalAvatarText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  avatarActions: {
    gap: 6,
  },
  pickPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  pickPhotoBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  removePhotoBtn: {
    alignSelf: 'flex-start',
  },
  removePhotoText: {
    color: Colors.red,
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  fieldSectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 6,
  },
  presetsScroll: {
    marginBottom: 10,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  presetPillActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  presetText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  presetTextActive: {
    color: '#0284C7',
    fontFamily: 'Inter_700Bold',
  },
});
