import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataService, StudentProfile } from './dataService';

interface AuthContextType {
  student: StudentProfile | null;
  loading: boolean;
  login: (rollNo: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (
    updates: Partial<StudentProfile>,
    newPin?: string,
    currentPin?: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  student: null,
  loading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refresh: async () => {},
  updateProfile: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = async () => {
    try {
      const cur = await DataService.getCurrentStudent();
      setStudent(cur);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async (rollNo: string, pin: string) => {
    setLoading(true);
    const res = await DataService.loginStudent(rollNo, pin);
    if (res.success && res.student) {
      setStudent(res.student);
    }
    setLoading(false);
    return res;
  };

  const logout = async () => {
    await DataService.clearCurrentStudent();
    setStudent(null);
  };

  const refresh = async () => {
    await loadSession();
  };

  const updateProfile = async (
    updates: Partial<StudentProfile>,
    newPin?: string,
    currentPin?: string
  ) => {
    if (!student?.rollNo) return { success: false, error: 'No active student session' };
    const res = await DataService.updateStudentProfile(student.rollNo, updates, newPin, currentPin);
    if (res.success && res.student) {
      setStudent(res.student);
    }
    return res;
  };

  return (
    <AuthContext.Provider value={{ student, loading, login, logout, refresh, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
