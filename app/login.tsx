import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Dimensions, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

import { useAuth } from '../lib/authContext';
import { loginTeacher } from '../lib/teacherRoster';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [rollNo, setRollNo] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleChange = (newRole: 'student' | 'teacher') => {
    setRole(newRole);
    setErrorMsg('');
    setRollNo('');
    setPin('');
  };

  const handleLogin = async () => {
    setErrorMsg('');

    const activeRoll = rollNo.trim();
    const activePin = pin.trim();

    if (!activeRoll) {
      setErrorMsg(
        role === 'student'
          ? 'Please enter your Tuition Roll Number (e.g. EDU-2026-XXX).'
          : 'Please enter your Faculty ID (e.g. FAC-2026-XXX).'
      );
      return;
    }

    if (!activePin) {
      setErrorMsg('Please enter your Security PIN or Password.');
      return;
    }

    setLoading(true);

    try {
      if (role === 'student') {
        const res = await login(activeRoll, activePin);
        if (res.success) {
          router.replace('/(student)');
        } else {
          setErrorMsg(res.error || 'Invalid username or password. Please try again.');
        }
      } else {
        const res = await loginTeacher(activeRoll, activePin);
        if (res.success) {
          router.replace('/(teacher)' as any);
        } else {
          setErrorMsg(res.error || 'Invalid username or password. Please try again.');
        }
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Decorative blobs */}
        <View style={styles.blobTopRight} />
        <View style={styles.blobBottomLeft} />

        {/* Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/eduhome.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.centerBadge}>
            <View style={styles.dot} />
            <Text style={styles.centerBadgeText}>EduHome Tuition Center</Text>
          </View>
          <Text style={styles.title}>Edu Home Login</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Role Toggle */}
          <Text style={styles.label}>Select Login Role</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]}
              onPress={() => handleRoleChange('student')}
            >
              <Ionicons name="school-outline" size={16} color={role === 'student' ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.roleBtnText, role === 'student' && styles.roleBtnTextActive]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]}
              onPress={() => handleRoleChange('teacher')}
            >
              <Ionicons name="person-outline" size={16} color={role === 'teacher' ? Colors.primary : Colors.textSecondary} />
              <Text style={[styles.roleBtnText, role === 'teacher' && styles.roleBtnTextActive]}>Teacher / Staff</Text>
            </TouchableOpacity>
          </View>

          {/* ID Field */}
          <Text style={styles.fieldLabel}>
            {role === 'student' ? 'Tuition Roll Number' : 'Teacher / Faculty ID'}
          </Text>
          <View style={styles.inputWrap}>
            <Ionicons name="id-card-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={role === 'student' ? 'EDU-2026-XXX' : 'FAC-2026-XXX'}
              placeholderTextColor={Colors.textMuted}
              value={rollNo}
              onChangeText={setRollNo}
              autoCapitalize="none"
            />
          </View>

          {/* PIN / Password Field */}
          <Text style={styles.fieldLabel}>
            {role === 'student' ? 'Student Password / Security PIN' : 'Faculty Password / Security PIN'}
          </Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter password or PIN"
              placeholderTextColor={Colors.textMuted}
              value={pin}
              onChangeText={setPin}
              secureTextEntry={!showPin}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={32}
            />
            <TouchableOpacity onPress={() => setShowPin(!showPin)} style={styles.eyeBtn}>
              <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Stay signed in */}
          <View style={styles.stayRow}>
            <TouchableOpacity style={styles.checkRow} onPress={() => setStaySignedIn(!staySignedIn)}>
              <View style={[styles.checkbox, staySignedIn && styles.checkboxActive]}>
                {staySignedIn && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.stayText}>Stay signed in on this phone</Text>
            </TouchableOpacity>
            <View style={styles.encryptRow}>
              <Ionicons name="shield-checkmark-outline" size={13} color={Colors.green} />
              <Text style={styles.encryptText}>Encrypted</Text>
            </View>
          </View>

          {/* Error Message */}
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Colors.red} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.signInBtnText}>
                  {role === 'student' ? 'Sign In to EduHome' : 'Sign In as Teacher / Faculty'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Switch link */}
          <Text style={styles.switchHint}>
            {role === 'student' ? 'Are you a Teacher or Admin?' : 'Are you a Student?'}
          </Text>
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => handleRoleChange(role === 'student' ? 'teacher' : 'student')}
          >
            <Ionicons
              name={role === 'student' ? 'person-outline' : 'school-outline'}
              size={15} color={Colors.primary}
            />
            <Text style={styles.switchBtnText}>
              {role === 'student' ? 'Faculty & Staff Portal' : 'Switch to Student Login'}
            </Text>
            <Ionicons name="arrow-forward" size={15} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  blobTopRight: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: Colors.primaryLight, opacity: 0.6,
  },
  blobBottomLeft: {
    position: 'absolute', top: 160, left: -50,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#E6F4FF', opacity: 0.8,
  },

  logoWrap: { alignItems: 'center', paddingTop: 60, paddingBottom: 32 },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 16,
  },
  logoCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  checkBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.green,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  centerBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginTop: 14,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.primary, marginRight: 6 },
  centerBadgeText: { fontSize: 12, color: Colors.primary, fontFamily: 'Inter_500Medium' },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', color: Colors.textPrimary, marginTop: 10 },

  card: {
    backgroundColor: Colors.cardBg, marginHorizontal: 16,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },

  label: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_500Medium', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  roleBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleBtnText: { fontSize: 13, color: Colors.textSecondary, fontFamily: 'Inter_500Medium' },
  roleBtnTextActive: { color: Colors.primary, fontFamily: 'Inter_600SemiBold' },

  fieldLabel: { fontSize: 13, color: Colors.textPrimary, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, marginBottom: 14, height: 50,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, fontFamily: 'Inter_400Regular' },
  eyeBtn: { padding: 4 },

  stayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stayText: { fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular' },
  encryptRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  encryptText: { fontSize: 11, color: Colors.green, fontFamily: 'Inter_500Medium' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.redLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: Colors.red,
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },

  signInBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  signInBtnText: { fontSize: 16, color: '#fff', fontFamily: 'Inter_700Bold' },

  switchHint: { textAlign: 'center', fontSize: 12, color: Colors.textSecondary, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  switchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.primaryLight,
    borderRadius: 12, paddingVertical: 12, backgroundColor: Colors.primaryLight,
  },
  switchBtnText: { fontSize: 14, color: Colors.primary, fontFamily: 'Inter_600SemiBold' },
});
