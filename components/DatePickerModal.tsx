import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (displayDate: string, isoDate: string) => void;
  title?: string;
  initialDate?: Date;
  minDate?: Date;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePickerModal({
  visible,
  onClose,
  onSelectDate,
  title = 'Select Date',
  initialDate,
  minDate = new Date(),
}: DatePickerModalProps) {
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(initialDate || new Date());

  useEffect(() => {
    if (visible) {
      const base = initialDate || new Date();
      setCurrentDate(new Date(base.getFullYear(), base.getMonth(), 1));
      setSelectedDay(new Date(base.getFullYear(), base.getMonth(), base.getDate()));
    }
  }, [visible, initialDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar matrix calculation
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: Array<{ day: number | null; date: Date | null; isPast: boolean; isSelected: boolean; isToday: boolean }> = [];

  // Empty padding cells before first day
  for (let i = 0; i < firstDayIndex; i++) {
    days.push({ day: null, date: null, isPast: false, isSelected: false, isToday: false });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const min = new Date(minDate);
  min.setHours(0, 0, 0, 0);

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(year, month, d);
    cellDate.setHours(0, 0, 0, 0);

    const isPast = cellDate < min;
    const isSelected =
      selectedDay.getFullYear() === year &&
      selectedDay.getMonth() === month &&
      selectedDay.getDate() === d;
    const isToday = cellDate.getTime() === today.getTime();

    days.push({ day: d, date: cellDate, isPast, isSelected, isToday });
  }

  // Quick select helper
  const handleQuickSelect = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setSelectedDay(target);
    setCurrentDate(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  // Select next specified day of week (e.g. next Saturday: 6, next Monday: 1)
  const handleNextDayOfWeek = (dayOfWeek: number) => {
    const target = new Date();
    const currentDay = target.getDay();
    let diff = (dayOfWeek - currentDay + 7) % 7;
    if (diff === 0) diff = 7;
    target.setDate(target.getDate() + diff);
    setSelectedDay(target);
    setCurrentDate(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  const formatDisplay = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleConfirm = () => {
    onSelectDate(formatDisplay(selectedDay), formatIso(selectedDay));
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.selectedDatePreview}>{formatDisplay(selectedDay)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Quick Shortcuts */}
          <Text style={styles.shortcutsLabel}>QUICK SHORTCUTS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shortcutsRow}>
            <TouchableOpacity style={styles.shortcutChip} onPress={() => handleQuickSelect(0)}>
              <Text style={styles.shortcutChipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutChip} onPress={() => handleQuickSelect(1)}>
              <Text style={styles.shortcutChipText}>Tomorrow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutChip} onPress={() => handleNextDayOfWeek(6)}>
              <Text style={styles.shortcutChipText}>This Saturday</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutChip} onPress={() => handleNextDayOfWeek(1)}>
              <Text style={styles.shortcutChipText}>Next Monday</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutChip} onPress={() => handleQuickSelect(7)}>
              <Text style={styles.shortcutChipText}>In 1 Week</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutChip} onPress={() => handleQuickSelect(14)}>
              <Text style={styles.shortcutChipText}>In 2 Weeks</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Month Navigator */}
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.navArrow}>
              <Ionicons name="chevron-back" size={20} color="#0284C7" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navArrow}>
              <Ionicons name="chevron-forward" size={20} color="#0284C7" />
            </TouchableOpacity>
          </View>

          {/* Day of week headers */}
          <View style={styles.daysHeader}>
            {DAY_LABELS.map((lbl, idx) => (
              <Text key={idx} style={[styles.dayLabel, idx === 0 && { color: '#EF4444' }]}>
                {lbl}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {days.map((item, idx) => {
              if (item.day === null) {
                return <View key={idx} style={styles.dayCell} />;
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    item.isSelected && styles.dayCellSelected,
                    item.isToday && !item.isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => item.date && setSelectedDay(item.date)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayText,
                      item.isSelected && styles.dayTextSelected,
                      item.isToday && !item.isSelected && styles.dayTextToday,
                      item.isPast && !item.isSelected && styles.dayTextPast,
                    ]}
                  >
                    {item.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.confirmBtnText}>Set Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  selectedDatePreview: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
    marginTop: 2,
  },
  closeIcon: {
    padding: 4,
  },
  shortcutsLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  shortcutsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  shortcutChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginRight: 6,
  },
  shortcutChipText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: '#0284C7',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 8,
  },
  navArrow: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  monthTitle: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  daysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  dayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dayCell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#0284C7',
  },
  dayCellSelected: {
    backgroundColor: '#0284C7',
  },
  dayText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  dayTextToday: {
    color: '#0284C7',
    fontFamily: 'Inter_700Bold',
  },
  dayTextSelected: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
  },
  dayTextPast: {
    color: '#CBD5E1',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0284C7',
  },
  confirmBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
});
