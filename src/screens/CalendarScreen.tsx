import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../ui/theme';
import {
  getUserAppointments,
  addAppointment,
  deleteAppointment,
  type Appointment,
} from '../services/appointments';

const CalendarScreen: React.FC<any> = ({ navigation }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'medical' | 'lab' | 'general'>('medical');
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Predefined time slots
  const timeSlots = [
    '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
    '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM',
  ];

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    const appts = await getUserAppointments();
    setAppointments(appts);
    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty slots for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAppointmentsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleAddAppointment = async () => {
    if (!selectedDate) {
      Alert.alert('No Date', 'Please select a date first');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter an appointment title');
      return;
    }
    if (!time.trim()) {
      Alert.alert('Missing Time', 'Please enter a time');
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const result = await addAppointment({
      date: dateStr,
      title: title.trim(),
      time: time.trim(),
      type,
    });

    if (result) {
      setShowAddModal(false);
      setTitle('');
      setTime('');
      setType('medical');
      await loadAppointments();
      Alert.alert('✅ Added!', 'Your appointment has been scheduled', [
        {
          text: 'OK',
          onPress: () => {
            // Appointment will show on main screen when you go back
          }
        }
      ]);
    } else {
      Alert.alert('Error', 'Failed to add appointment');
    }
  };

  const handleDeleteAppointment = (apt: Appointment) => {
    Alert.alert(
      'Delete Appointment',
      `Delete "${apt.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (apt.id) {
              const success = await deleteAppointment(apt.id);
              if (success) {
                await loadAppointments();
                // Show success briefly
                Alert.alert('✅ Deleted', 'Appointment removed');
              } else {
                Alert.alert('Error', 'Failed to delete appointment');
              }
            }
          },
        },
      ]
    );
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateAppts = getAppointmentsForDate(selectedDate);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasAppointments = (date: Date | null) => {
    return getAppointmentsForDate(date).length > 0;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={previousMonth} style={styles.navButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthText}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaders}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.dayHeader}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.calendarGrid}>
            {days.map((date, index) => {
              const isSelected = selectedDate && date && selectedDate.toDateString() === date.toDateString();
              const isTodayDate = isToday(date);
              const hasAppts = hasAppointments(date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !date && styles.emptyCell,
                    isSelected && styles.selectedCell,
                    isTodayDate && !isSelected && styles.todayCell,
                  ]}
                  onPress={() => date && setSelectedDate(date)}
                  disabled={!date}
                >
                  {date && (
                    <>
                      <Text
                        style={[
                          styles.dayText,
                          isSelected && styles.selectedDayText,
                          isTodayDate && !isSelected && styles.todayDayText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {hasAppts && !isSelected && (
                        <View style={styles.appointmentDot} />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Selected Date Appointments */}
        {selectedDate && (
          <View style={styles.appointmentsSection}>
            <View style={styles.appointmentsHeader}>
              <Text style={styles.appointmentsTitle}>
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {selectedDateAppts.length === 0 ? (
              <View style={styles.emptyAppointments}>
                <Ionicons name="calendar-outline" size={40} color={theme.colors.subtext} />
                <Text style={styles.emptyText}>No appointments</Text>
                <TouchableOpacity
                  style={styles.addFirstButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Text style={styles.addFirstButtonText}>Add Appointment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              selectedDateAppts.map((apt) => (
                <View key={apt.id} style={styles.appointmentCard}>
                  <View style={styles.appointmentLeft}>
                    <View
                      style={[
                        styles.appointmentIcon,
                        { backgroundColor: theme.colors.primaryLight },
                      ]}
                    >
                      <Ionicons
                        name={
                          apt.type === 'medical'
                            ? 'medical'
                            : apt.type === 'lab'
                            ? 'flask'
                            : 'calendar'
                        }
                        size={24}
                        color={theme.colors.primary}
                      />
                    </View>
                    <View style={styles.appointmentDetails}>
                      <Text style={styles.appointmentTitle}>{apt.title}</Text>
                      <Text style={styles.appointmentTime}>
                        <Ionicons name="time-outline" size={14} color={theme.colors.subtext} />{' '}
                        {apt.time}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteAppointment(apt)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Appointment Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Appointment</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Doctor Visit"
              placeholderTextColor={theme.colors.subtext}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Time</Text>
            {time ? (
              <View style={styles.selectedTimeContainer}>
                <Text style={styles.selectedTime}>{time}</Text>
                <TouchableOpacity onPress={() => setTime('')}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.subtext} />
                </TouchableOpacity>
              </View>
            ) : null}
            <ScrollView 
              style={styles.timePickerScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.timeSlots}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    style={[
                      styles.timeSlot,
                      time === slot && styles.timeSlotActive
                    ]}
                    onPress={() => setTime(slot)}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      time === slot && styles.timeSlotTextActive
                    ]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.label}>Type</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'medical' && styles.typeButtonActive]}
                onPress={() => setType('medical')}
              >
                <Ionicons
                  name="medical"
                  size={20}
                  color={type === 'medical' ? '#FFFFFF' : theme.colors.text}
                />
                <Text style={[styles.typeText, type === 'medical' && styles.typeTextActive]}>
                  Medical
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'lab' && styles.typeButtonActive]}
                onPress={() => setType('lab')}
              >
                <Ionicons
                  name="flask"
                  size={20}
                  color={type === 'lab' ? '#FFFFFF' : theme.colors.text}
                />
                <Text style={[styles.typeText, type === 'lab' && styles.typeTextActive]}>
                  Lab
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'general' && styles.typeButtonActive]}
                onPress={() => setType('general')}
              >
                <Ionicons
                  name="calendar"
                  size={20}
                  color={type === 'general' ? '#FFFFFF' : theme.colors.text}
                />
                <Text style={[styles.typeText, type === 'general' && styles.typeTextActive]}>
                  General
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddAppointment}>
              <Text style={styles.saveButtonText}>Add Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  dayHeaders: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.subtext,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  selectedCell: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDayText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  appointmentDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  appointmentsSection: {
    padding: 16,
    marginTop: 16,
  },
  appointmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  appointmentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  emptyAppointments: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginTop: 12,
    marginBottom: 16,
  },
  addFirstButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.sm,
  },
  appointmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appointmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: theme.colors.subtext,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.bg,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  selectedTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timePickerScroll: {
    maxHeight: 200,
    marginBottom: 12,
  },
  timeSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    minWidth: 90,
    alignItems: 'center',
  },
  timeSlotActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default CalendarScreen;
