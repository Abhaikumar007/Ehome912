import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
  Modal, TextInput, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Linking, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { studentData, progressData } from '../../constants/mockData';
import { useAuth } from '../../lib/authContext';
import { DataService } from '../../lib/dataService';

const menuItems = [
  { icon: 'person-outline',       title: 'Personal Details',    sub: 'Name, class, contact info',      color: Colors.primary,  bg: Colors.primaryLight },
  { icon: 'people-outline',       title: 'Parent / Guardian',   sub: 'Linked guardian contact',        color: Colors.purple,   bg: Colors.purpleLight },
  { icon: 'flag-outline',         title: 'Learning Goals',      sub: 'Set your subjects and targets',   color: Colors.green,    bg: Colors.greenLight },
  { icon: 'notifications-outline',title: 'Notifications',       sub: 'Manage alerts and reminders',     color: Colors.amber,    bg: Colors.amberLight },
  { icon: 'shield-outline',       title: 'Privacy & Security',  sub: 'Account security and data',       color: Colors.teal,     bg: Colors.tealLight },
  { icon: 'help-circle-outline',  title: 'Help & Support',      sub: 'FAQs, support and feedback',      color: Colors.orange,   bg: Colors.orangeLight },
];

const AVATAR_PRESETS = [
  { id: 'AS', label: 'Classic AS', bg: '#1A56DB', isEmoji: false },
  { id: '🎓', label: 'Scholar',    bg: '#0E9F6E', isEmoji: true },
  { id: '🚀', label: 'Achiever',   bg: '#7C3AED', isEmoji: true },
  { id: '⚡', label: 'Speed',      bg: '#EA580C', isEmoji: true },
  { id: '🦁', label: 'Leader',     bg: '#D97706', isEmoji: true },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { student, logout, refresh, updateProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Edit Profile Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [goalsInput, setGoalsInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('AS');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Parent / Guardian Modal State
  const [parentModalVisible, setParentModalVisible] = useState(false);
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [feeAlerts, setFeeAlerts] = useState(true);
  const [reportCardAlerts, setReportCardAlerts] = useState(true);
  const [isEditingGuardian, setIsEditingGuardian] = useState(false);

  // Security / PIN State
  const [changePin, setChangePin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Fees Status
  const [feeRecord, setFeeRecord] = useState<any>(null);

  const loadFeeStatus = async () => {
    try {
      const f = await DataService.getFees(student?.rollNo || '2024-JEE-0842');
      if (f) setFeeRecord(f);
    } catch {}
  };

  useEffect(() => {
    loadFeeStatus();
  }, [student?.rollNo]);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refresh(), loadFeeStatus()]);
    } catch {}
    setRefreshing(false);
  };

  const openEditModal = () => {
    setNameInput(student?.name || studentData.name);
    setPhoneInput(student?.phone || '');
    setGoalsInput(student?.goals || studentClass);
    setSelectedAvatar(student?.avatar || 'AS');
    setSelectedPhoto(student?.photoUrl || null);
    setChangePin(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setFormError('');
    setModalVisible(true);
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Please enable camera roll permissions to select a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error', e);
    }
  };

  const handleSaveProfile = async () => {
    setFormError('');

    if (changePin) {
      if (!currentPin) {
        setFormError('Please enter your current PIN to verify identity');
        return;
      }
      if (newPin.length !== 4) {
        setFormError('New PIN must be exactly 4 digits');
        return;
      }
      if (newPin !== confirmPin) {
        setFormError('New PIN and Confirm PIN do not match');
        return;
      }
    }

    setSaving(true);
    try {
      const res = await updateProfile(
        {
          name: student?.name || studentData.name,
          phone: phoneInput.trim(),
          goals: goalsInput.trim(),
          avatar: selectedAvatar,
          photoUrl: selectedPhoto || undefined,
        },
        changePin ? newPin : undefined,
        changePin ? currentPin : undefined
      );

      if (res.success) {
        setModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        setFormError(res.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const studentName = student?.name || studentData.name;
  const studentClass = student?.class || studentData.class;
  const studentAvatar = student?.avatar || studentData.avatar;
  const studentPhoto = student?.photoUrl;
  // Show blank dash if stat is 0 (not yet populated)
  const streak = student?.streak ?? studentData.streak;
  const accuracy = student?.accuracy ?? studentData.accuracy;
  const testsCompleted = student?.testsCompleted ?? studentData.testsCompleted;
  const topPercent = student?.topPercent ?? studentData.topPercent;

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
            <Text style={styles.classPillText}>{studentClass}</Text>
            <Ionicons name="chevron-down" size={13} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(student)/notifications' as any)}>
            <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
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
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <TouchableOpacity onPress={openEditModal} style={styles.avatarWrap} activeOpacity={0.85}>
              {studentPhoto ? (
                <Image source={{ uri: studentPhoto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{studentAvatar}</Text>
                </View>
              )}
              <View style={styles.cameraPill}>
                <Ionicons name="camera" size={11} color="#fff" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{studentName}</Text>
              <Text style={styles.profileClass}>{studentClass} • {student?.batch || 'JEE Batch'}</Text>
              <Text style={styles.profileMotivation} numberOfLines={1}>
                🎯 {student?.goals || '"Consistent steps, bigger..."'}
              </Text>
              <TouchableOpacity style={styles.editBtn} onPress={openEditModal}>
                <Ionicons name="pencil" size={12} color={Colors.primary} />
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.motivationCard}>
              <Text style={styles.motivationEmoji}>👑</Text>
              <Text style={styles.motivationTitle}>Keep going!</Text>
              <Text style={styles.motivationSub}>You're doing{'\n'}great!</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Ionicons name="flame" size={18} color={Colors.orange} />
              <Text style={styles.statValue}>{streak > 0 ? streak : '—'}</Text>
              <Text style={styles.statLabel}>Day{'\n'}Streak</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Ionicons name="radio-button-on" size={18} color={Colors.green} />
              <Text style={styles.statValue}>{accuracy > 0 ? `${accuracy}%` : '—'}</Text>
              <Text style={styles.statLabel}>Overall{'\n'}Accuracy</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Ionicons name="bar-chart" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{testsCompleted > 0 ? testsCompleted : '—'}</Text>
              <Text style={styles.statLabel}>Tests{'\n'}Completed</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={18} color={Colors.amber} />
              <Text style={styles.statValue}>{topPercent > 0 ? `Top\n${topPercent}%` : '—'}</Text>
              <Text style={styles.statLabel}>{topPercent > 0 ? `Among\n${studentClass}` : 'Percentile\nRank'}</Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.title === 'Parent / Guardian') {
                  setParentModalVisible(true);
                } else if (item.title === 'Personal Details' || item.title === 'Privacy & Security' || item.title === 'Learning Goals') {
                  openEditModal();
                } else if (item.title === 'Notifications') {
                  router.push('/(student)/notifications' as any);
                } else if (item.title === 'Help & Support') {
                  Alert.alert(
                    'EduHome Support & Helpdesk',
                    'Reach out to the EduHome administration:\n\n📞 Call / WhatsApp: +919072545116\n✉️ Email: support@eduhome.ac.in\n🕒 Hours: 9:00 AM - 7:30 PM (Mon - Sat)',
                    [
                      { text: 'Call Support', onPress: () => Linking.openURL('tel:+919072545116') },
                      { text: 'Close', style: 'cancel' },
                    ]
                  );
                }
              }}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon as any} size={18} color={item.color} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tuition Fee Status Card */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(student)/fees')}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.menuIcon,
                {
                  backgroundColor: feeRecord?.isPaid
                    ? Colors.greenLight
                    : feeRecord?.status === 'pending_verification'
                    ? '#FEF3C7'
                    : Colors.redLight,
                },
              ]}
            >
              <Ionicons
                name={
                  feeRecord?.isPaid
                    ? 'checkmark-circle'
                    : feeRecord?.status === 'pending_verification'
                    ? 'time'
                    : 'wallet-outline'
                }
                size={18}
                color={
                  feeRecord?.isPaid
                    ? Colors.green
                    : feeRecord?.status === 'pending_verification'
                    ? '#B45309'
                    : Colors.red
                }
              />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>
                {feeRecord?.isPaid
                  ? 'Tuition Fees: Cleared'
                  : feeRecord?.status === 'pending_verification'
                  ? 'Tuition Fees: Verification Pending'
                  : `Tuition Fees: ₹${(feeRecord?.monthlyFee || feeRecord?.actualDue || feeRecord?.currentDue || 0).toLocaleString('en-IN')} Due`}
              </Text>
              <Text style={styles.menuSub}>
                {feeRecord?.isPaid
                  ? `Paid ₹${(feeRecord?.monthlyFee || feeRecord?.actualDue || feeRecord?.currentDue || 0).toLocaleString('en-IN')} • Verified by Admin ✓`
                  : feeRecord?.status === 'pending_verification'
                  ? 'Submitted via UPI • Awaiting Admin approval'
                  : `Due on ${feeRecord?.dueDate ?? '—'} • Tap to Pay`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIcon, { backgroundColor: Colors.redLight }]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.red} />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.menuTitle, { color: Colors.red }]}>Logout</Text>
              <Text style={styles.menuSub}>See you soon!</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Inspiration Banner */}
        <View style={styles.inspirationBanner}>
          <View style={styles.mountainWrap}>
            <View style={styles.mountain1} />
            <View style={styles.mountain2} />
            <View style={styles.flag}>
              <Ionicons name="flag" size={14} color={Colors.red} />
            </View>
          </View>
          <View style={{ flex: 1, zIndex: 1 }}>
            <Text style={styles.inspiLine}>Focus on the next step,{'\n'}not the entire staircase.</Text>
            <View style={styles.inspiUnderline} />
          </View>
          <Text style={styles.keepGoingText}>Keep{'\n'}Going! 🚀</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ================= EDIT PROFILE MODAL ================= */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Profile & Security</Text>
                <Text style={styles.modalSub}>Customise photo, details & PIN</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Photo & Avatar Section */}
              <View style={styles.modalAvatarRow}>
                <View style={styles.previewAvatarWrap}>
                  {selectedPhoto ? (
                    <Image source={{ uri: selectedPhoto }} style={styles.modalAvatarImg} />
                  ) : (
                    <View style={styles.modalAvatarBox}>
                      <Text style={styles.modalAvatarText}>{selectedAvatar}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.avatarActions}>
                  <TouchableOpacity style={styles.pickPhotoBtn} onPress={pickImage}>
                    <Ionicons name="image-outline" size={15} color="#fff" />
                    <Text style={styles.pickPhotoBtnText}>Choose Photo</Text>
                  </TouchableOpacity>
                  {selectedPhoto && (
                    <TouchableOpacity onPress={() => setSelectedPhoto(null)} style={styles.removePhotoBtn}>
                      <Text style={styles.removePhotoText}>Remove photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Avatar Presets */}
              <Text style={styles.fieldSectionLabel}>Or choose an avatar icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
                {AVATAR_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.presetPill,
                      selectedAvatar === p.id && !selectedPhoto && styles.presetPillActive,
                    ]}
                    onPress={() => {
                      setSelectedPhoto(null);
                      setSelectedAvatar(p.id);
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{p.id}</Text>
                    <Text style={[styles.presetText, selectedAvatar === p.id && !selectedPhoto && styles.presetTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Enrolled Name & Class (Read-Only: Synced from Admin App) */}
              <View style={styles.adminSyncedFieldBox}>
                <View style={styles.adminSyncedHeaderRow}>
                  <Text style={styles.inputLabel}>Full Name & Class</Text>
                  <View style={styles.syncedBadge}>
                    <Ionicons name="lock-closed" size={10} color="#0284C7" />
                    <Text style={styles.syncedBadgeText}>Synced from Main Admin</Text>
                  </View>
                </View>

                <View style={styles.lockedFieldRow}>
                  <View style={styles.lockedIconBox}>
                    <Ionicons name="person" size={16} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lockedFieldVal}>{student?.name || studentData.name}</Text>
                    <Text style={styles.lockedFieldSub}>
                      {student?.class || studentData.class} • {student?.batch || studentData.batch} • {student?.rollNo || studentData.rollNo}
                    </Text>
                  </View>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.green} />
                </View>
                <Text style={styles.lockedFieldHint}>
                  Official name & class are centrally synced from Main Admin (Mr. R Madhusudanan) and cannot be modified here.
                </Text>
              </View>

              <Text style={styles.inputLabel}>Contact Phone</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  value={phoneInput}
                  onChangeText={setPhoneInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.inputLabel}>Target Exam / Goals</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="trophy-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.modalInput}
                  value={goalsInput}
                  onChangeText={setGoalsInput}
                  placeholder="e.g. JEE Advanced 2027"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Security Section Toggle */}
              <TouchableOpacity
                style={styles.securityToggle}
                onPress={() => setChangePin(!changePin)}
                activeOpacity={0.8}
              >
                <View style={styles.securityToggleLeft}>
                  <View style={[styles.secIcon, { backgroundColor: changePin ? Colors.greenLight : Colors.primaryLight }]}>
                    <Ionicons name="shield-checkmark" size={18} color={changePin ? Colors.green : Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.secTitle}>Change Security PIN</Text>
                    <Text style={styles.secSub}>Update your 4-digit student login PIN</Text>
                  </View>
                </View>
                <Ionicons name={changePin ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>

              {changePin && (
                <View style={styles.pinFieldsBox}>
                  <Text style={styles.inputLabel}>Current 4-Digit PIN</Text>
                  <TextInput
                    style={styles.pinInput}
                    value={currentPin}
                    onChangeText={setCurrentPin}
                    placeholder="••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={4}
                  />

                  <Text style={styles.inputLabel}>New 4-Digit PIN</Text>
                  <TextInput
                    style={styles.pinInput}
                    value={newPin}
                    onChangeText={setNewPin}
                    placeholder="••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={4}
                  />

                  <Text style={styles.inputLabel}>Confirm New 4-Digit PIN</Text>
                  <TextInput
                    style={styles.pinInput}
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    placeholder="••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              )}

              {/* Error Box */}
              {formError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color={Colors.red} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= PARENT / GUARDIAN MODAL ================= */}
      <Modal visible={parentModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Parent / Guardian Details</Text>
                <Text style={styles.modalSub}>Linked primary contact & alert access</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setParentModalVisible(false);
                  setIsEditingGuardian(false);
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Guardian Card Banner */}
              <View style={styles.guardianProfileBanner}>
                <View style={styles.guardianAvatar}>
                  <Text style={styles.guardianAvatarText}>RS</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guardianNameText}>{guardianName}</Text>
                  <Text style={styles.guardianRelationText}>Parent / Primary Guardian</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={12} color={Colors.green} />
                    <Text style={styles.verifiedText}>Verified Guardian Contact</Text>
                  </View>
                </View>
              </View>

              {/* Contact Information Box: Strictly Guardian Details & Phone Number */}
              <View style={styles.guardianInfoBox}>
                <View style={styles.guardianInfoRow}>
                  <Ionicons name="person-outline" size={18} color={Colors.primary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.guardianInfoLabel}>Guardian Name</Text>
                    {isEditingGuardian ? (
                      <TextInput
                        style={styles.guardianInlineInput}
                        value={guardianName}
                        onChangeText={setGuardianName}
                      />
                    ) : (
                      <Text style={styles.guardianInfoVal}>{guardianName}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.guardianDivider} />

                <View style={styles.guardianInfoRow}>
                  <Ionicons name="call-outline" size={18} color={Colors.green} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.guardianInfoLabel}>Phone Number</Text>
                    {isEditingGuardian ? (
                      <TextInput
                        style={styles.guardianInlineInput}
                        value={guardianPhone}
                        onChangeText={setGuardianPhone}
                        keyboardType="phone-pad"
                      />
                    ) : (
                      <Text style={styles.guardianInfoVal}>{guardianPhone}</Text>
                    )}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, { marginTop: 16 }]}
                onPress={() => {
                  if (isEditingGuardian) {
                    setIsEditingGuardian(false);
                    Alert.alert('Updated', 'Guardian phone number has been updated.');
                  } else {
                    setIsEditingGuardian(true);
                  }
                }}
              >
                <Ionicons name={isEditingGuardian ? "checkmark-circle" : "pencil"} size={16} color="#fff" />
                <Text style={styles.saveBtnText}>
                  {isEditingGuardian ? "Save Guardian Details" : "Edit Phone Number"}
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

  profileCard: {
    backgroundColor: Colors.cardBg, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  profileTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  avatarImage: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 2, borderColor: Colors.primary,
  },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.primary },
  cameraPill: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: Colors.primary, width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff',
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  profileClass: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  profileMotivation: { fontSize: 11, color: Colors.textMuted, fontFamily: 'Inter_400Regular', marginTop: 2 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  editBtnText: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  motivationCard: {
    backgroundColor: Colors.amberLight, borderRadius: 10, padding: 8, alignItems: 'center', width: 80,
  },
  motivationEmoji: { fontSize: 16 },
  motivationTitle: { fontSize: 10, fontFamily: 'Inter_700Bold', color: Colors.amber, textAlign: 'center' },
  motivationSub: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center', fontFamily: 'Inter_400Regular' },

  statsBar: { flexDirection: 'row', backgroundColor: Colors.background, borderRadius: 12, padding: 10 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, textAlign: 'center' },
  statLabel: { fontSize: 9, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  divider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  menuCard: {
    backgroundColor: Colors.cardBg, borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  menuSub: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 1 },

  inspirationBanner: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'flex-end', overflow: 'hidden', minHeight: 110,
  },
  mountainWrap: { position: 'absolute', right: 80, bottom: 0 },
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
  inspiLine: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff', lineHeight: 20 },
  inspiUnderline: { width: 40, height: 2.5, backgroundColor: Colors.red, marginTop: 6, borderRadius: 2 },
  keepGoingText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'right', fontStyle: 'italic' },

  // Modal styles
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  modalSub: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn: { padding: 6, backgroundColor: Colors.background, borderRadius: 16 },

  modalAvatarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14,
  },
  previewAvatarWrap: {},
  modalAvatarBox: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.primary,
  },
  modalAvatarImg: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: Colors.primary,
  },
  modalAvatarText: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.primary },
  avatarActions: { flex: 1, gap: 6 },
  pickPhotoBtn: {
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14,
  },
  pickPhotoBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  removePhotoBtn: { alignSelf: 'flex-start' },
  removePhotoText: { color: Colors.red, fontSize: 12, fontFamily: 'Inter_500Medium' },

  fieldSectionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, marginBottom: 8 },
  presetsScroll: { marginBottom: 16 },
  presetPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, marginRight: 8,
  },
  presetPillActive: {
    borderColor: Colors.primary, backgroundColor: Colors.primaryLight,
  },
  presetText: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  presetTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  adminSyncedFieldBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  adminSyncedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  syncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  syncedBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: '#0284C7',
  },
  lockedFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  lockedIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedFieldVal: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  lockedFieldSub: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  lockedFieldHint: {
    fontSize: 10.5,
    fontFamily: 'Inter_400Regular',
    color: '#0369A1',
    marginTop: 8,
    lineHeight: 14,
  },
  adminSyncBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary, marginBottom: 6, marginTop: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, height: 46,
  },
  modalInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontFamily: 'Inter_400Regular' },

  securityToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.background, padding: 12, borderRadius: 12, marginTop: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  securityToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  secIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: Colors.textPrimary },
  secSub: { fontSize: 11, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },

  pinFieldsBox: {
    backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  pinInput: {
    backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, height: 42, fontSize: 15, color: Colors.textPrimary,
    fontFamily: 'Inter_600SemiBold', letterSpacing: 4, textAlign: 'center',
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.redLight, padding: 10, borderRadius: 8, marginTop: 12,
  },
  errorText: { color: Colors.red, fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },

  saveBtn: {
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, height: 50, marginTop: 18,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },

  // Guardian Modal Styles
  guardianProfileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  guardianAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.purple,
  },
  guardianAvatarText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.purple,
  },
  guardianNameText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  guardianRelationText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.green,
  },

  quickActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
  },
  quickActionText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },

  guardianInfoBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 16,
  },
  guardianInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  guardianInfoLabel: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.textMuted,
  },
  guardianInfoVal: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  guardianInlineInput: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 2,
    marginTop: 2,
  },
  guardianDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },

  guardianSectionHeading: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  alertOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  alertOptionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  alertOptionSub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
