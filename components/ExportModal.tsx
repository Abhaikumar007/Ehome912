// components/ExportModal.tsx
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  RawStudent,
  formatStudents,
  generatePostgreSql,
  generateCsv,
  downloadFile,
  copyText,
} from '../lib/exportService';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  students: RawStudent[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ visible, onClose, students }) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'csv'>('sql');
  const [copied, setCopied] = useState(false);

  const formatted = formatStudents(students);
  const sqlContent = generatePostgreSql(formatted);
  const csvContent = generateCsv(formatted);

  const currentContent = activeTab === 'sql' ? sqlContent : csvContent;
  const currentFileName = activeTab === 'sql' ? 'supabase_students_seed.sql' : 'students_export.csv';
  const currentMime = activeTab === 'sql' ? 'text/plain' : 'text/csv';

  const handleCopy = async () => {
    const success = await copyText(currentContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      if (Platform.OS !== 'web') {
        Alert.alert('Info', 'Select text in preview to copy.');
      }
    }
  };

  const handleDownloadCurrent = () => {
    downloadFile(currentContent, currentFileName, currentMime);
  };

  const handleDownloadAll = () => {
    downloadFile(sqlContent, 'supabase_students_seed.sql', 'text/plain');
    setTimeout(() => {
      downloadFile(csvContent, 'students_export.csv', 'text/csv');
    }, 400);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Ionicons name="cloud-download" size={20} color="#1A56DB" />
                <Text style={styles.title}>Export Student Data</Text>
              </View>
              <Text style={styles.subtitle}>
                {formatted.length} students formatted with PostgreSQL SQL & CSV
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Format Switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'sql' && styles.tabBtnActive]}
              onPress={() => setActiveTab('sql')}
            >
              <Ionicons
                name="server-outline"
                size={16}
                color={activeTab === 'sql' ? '#1A56DB' : '#64748B'}
              />
              <Text style={[styles.tabText, activeTab === 'sql' && styles.tabTextActive]}>
                PostgreSQL SQL (.sql)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'csv' && styles.tabBtnActive]}
              onPress={() => setActiveTab('csv')}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={activeTab === 'csv' ? '#1A56DB' : '#64748B'}
              />
              <Text style={[styles.tabText, activeTab === 'csv' && styles.tabTextActive]}>
                Spreadsheet CSV (.csv)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Feature Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.infoBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.infoBadgeText}>Title Case</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.infoBadgeText}>Clean Phone (+91 stripped)</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.infoBadgeText}>2-Letter Initials</Text>
            </View>
            <View style={styles.infoBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text style={styles.infoBadgeText}>Attendance / Fees / Progress Seeds</Text>
            </View>
          </View>

          {/* Code Preview */}
          <ScrollView style={styles.previewBox} contentContainerStyle={{ paddingBottom: 10 }}>
            <Text style={styles.codeText} selectable>
              {currentContent}
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopy}>
              <Ionicons
                name={copied ? 'checkmark-done' : 'copy-outline'}
                size={18}
                color={copied ? '#059669' : '#1A56DB'}
              />
              <Text style={[styles.secondaryBtnText, copied && { color: '#059669' }]}>
                {copied ? 'Copied!' : 'Copy ' + activeTab.toUpperCase()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineBtn} onPress={handleDownloadCurrent}>
              <Ionicons name="download-outline" size={18} color="#1A56DB" />
              <Text style={styles.outlineBtnText}>Download {activeTab.toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleDownloadAll}>
              <Ionicons name="archive-outline" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Export All (SQL & CSV)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#1A56DB',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#166534',
  },
  previewBox: {
    maxHeight: 280,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 11.5,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  secondaryBtn: {
    flex: 1,
    minWidth: 130,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  secondaryBtnText: {
    color: '#1A56DB',
    fontWeight: '600',
    fontSize: 12.5,
  },
  outlineBtn: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  outlineBtnText: {
    color: '#1A56DB',
    fontWeight: '700',
    fontSize: 12.5,
  },
  primaryBtn: {
    flex: 1.4,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#1A56DB',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
