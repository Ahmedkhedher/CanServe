import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../ui/theme';
import { useAuth } from '../context/AuthContext';
import type { Appointment } from '../services/appointments';
import { getUserAppointments, addAppointment, deleteAppointment } from '../services/appointments';

const { width } = Dimensions.get('window');

const MainScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'home' | 'calendar'>('home');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [newAppointmentTitle, setNewAppointmentTitle] = useState('');
  const [newAppointmentTime, setNewAppointmentTime] = useState('');
  const [newAppointmentType, setNewAppointmentType] = useState<'medical' | 'lab' | 'general'>('medical');

  // Load appointments
  const loadAppointments = async () => {
    setLoadingAppointments(true);
    const data = await getUserAppointments();
    setAppointments(data);
    setLoadingAppointments(false);
  };

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const hasAppointmentOnDate = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return appointments.some(apt => apt.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  const getAppointmentsForSelectedDate = () => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return appointments.filter(apt => apt.date === dateStr);
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments
      .filter(apt => new Date(apt.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  const getPastAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments
      .filter(apt => new Date(apt.date) < today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  };

  const handleAddAppointment = async () => {
    if (!newAppointmentTitle.trim() || !newAppointmentTime.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    await addAppointment({
      date: dateStr,
      title: newAppointmentTitle,
      time: newAppointmentTime,
      type: newAppointmentType
    });

    await loadAppointments();
    setShowAddAppointment(false);
    setNewAppointmentTitle('');
    setNewAppointmentTime('');
    setNewAppointmentType('medical');
  };

  const handleDeleteAppointment = async (aptId: string | undefined) => {
    if (!aptId) return;
    const success = await deleteAppointment(aptId);
    if (success) {
      await loadAppointments();
    } else {
      Alert.alert('Error', 'Failed to delete appointment');
    }
  };

  const { firstDay, daysInMonth } = getDaysInMonth(selectedDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <LinearGradient 
      colors={['#a78bfa', '#ec4899']} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }} 
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', {})} style={styles.profileBtn}>
          <Text style={styles.profileBtnText}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Access Buttons */}
        <View style={styles.quickAccessSection}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity 
              style={[styles.accessCard, { backgroundColor: '#3b82f6' }]}
              onPress={() => navigation.navigate('Chat', {})}
            >
              <Text style={styles.accessIcon}>💬</Text>
              <Text style={styles.accessText}>AI Chat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.accessCard, { backgroundColor: '#10b981' }]}
              onPress={() => navigation.navigate('FoodScan', {})}
            >
              <Text style={styles.accessIcon}>📸</Text>
              <Text style={styles.accessText}>Food Scan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.accessCard, { backgroundColor: '#f59e0b' }]}
              onPress={() => setViewMode(viewMode === 'home' ? 'calendar' : 'home')}
            >
              <Text style={styles.accessIcon}>📅</Text>
              <Text style={styles.accessText}>Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.accessCard, { backgroundColor: '#ef4444' }]}
              onPress={() => navigation.navigate('Profile', {})}
            >
              <Text style={styles.accessIcon}>⚙️</Text>
              <Text style={styles.accessText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* View Mode Toggle */}
        {viewMode === 'home' ? (
          <>
            {/* Upcoming Appointments */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                <TouchableOpacity onPress={() => setShowAddAppointment(true)}>
                  <Text style={styles.addBtn}>+ Add</Text>
                </TouchableOpacity>
              </View>
              
              {getUpcomingAppointments().length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No upcoming appointments</Text>
                </View>
              ) : (
                getUpcomingAppointments().map((apt, idx) => (
                  <View key={idx} style={styles.appointmentCard}>
                    <View style={styles.appointmentLeft}>
                      <Text style={styles.appointmentIcon}>
                        {apt.type === 'medical' ? '🏥' : apt.type === 'lab' ? '🔬' : '📋'}
                      </Text>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentTitle}>{apt.title}</Text>
                        <Text style={styles.appointmentDate}>{apt.date} at {apt.time}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        Alert.alert(
                          'Delete Appointment',
                          'Are you sure?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteAppointment(apt.id) }
                          ]
                        );
                      }}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {/* Past Appointments */}
            {getPastAppointments().length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Past Appointments</Text>
                {getPastAppointments().map((apt, idx) => (
                  <View key={idx} style={[styles.appointmentCard, styles.pastAppointmentCard]}>
                    <View style={styles.appointmentLeft}>
                      <Text style={styles.appointmentIcon}>
                        {apt.type === 'medical' ? '🏥' : apt.type === 'lab' ? '🔬' : '📋'}
                      </Text>
                      <View style={styles.appointmentInfo}>
                        <Text style={[styles.appointmentTitle, styles.pastText]}>{apt.title}</Text>
                        <Text style={styles.appointmentDate}>{apt.date} at {apt.time}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        Alert.alert(
                          'Delete Appointment',
                          'Are you sure?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteAppointment(apt.id) }
                          ]
                        );
                      }}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          /* Calendar View */
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calendar</Text>
            
            {/* Month Navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity 
                onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                style={styles.navBtn}
              >
                <Text style={styles.navBtnText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.monthText}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
              <TouchableOpacity 
                onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                style={styles.navBtn}
              >
                <Text style={styles.navBtnText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Day Labels */}
            <View style={styles.dayLabels}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <Text key={day} style={styles.dayLabel}>{day}</Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.calendarDay} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.calendarDay,
                      isToday(day) && styles.today,
                      hasAppointmentOnDate(day) && styles.hasAppointment
                    ]}
                    onPress={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                  >
                    <Text style={[
                      styles.dayText,
                      isToday(day) && styles.todayText,
                      hasAppointmentOnDate(day) && styles.hasAppointmentText
                    ]}>
                      {day}
                    </Text>
                    {hasAppointmentOnDate(day) && <View style={styles.appointmentDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Appointments for Selected Date */}
            <View style={styles.selectedDateSection}>
              <Text style={styles.selectedDateTitle}>
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
              {getAppointmentsForSelectedDate().length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No appointments</Text>
                  <TouchableOpacity onPress={() => setShowAddAppointment(true)} style={styles.addAppointmentBtn}>
                    <Text style={styles.addAppointmentBtnText}>+ Add Appointment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                getAppointmentsForSelectedDate().map((apt, idx) => (
                  <View key={idx} style={styles.appointmentCard}>
                    <View style={styles.appointmentLeft}>
                      <Text style={styles.appointmentIcon}>
                        {apt.type === 'medical' ? '🏥' : apt.type === 'lab' ? '🔬' : '📋'}
                      </Text>
                      <View style={styles.appointmentInfo}>
                        <Text style={styles.appointmentTitle}>{apt.title}</Text>
                        <Text style={styles.appointmentDate}>{apt.time}</Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => {
                        Alert.alert(
                          'Delete Appointment',
                          'Are you sure?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteAppointment(apt.id) }
                          ]
                        );
                      }}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Appointment Modal */}
      <Modal visible={showAddAppointment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Appointment</Text>
            
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={newAppointmentTitle}
              onChangeText={setNewAppointmentTitle}
              placeholder="e.g., Doctor Checkup"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Time</Text>
            <TextInput
              style={styles.input}
              value={newAppointmentTime}
              onChangeText={setNewAppointmentTime}
              placeholder="e.g., 10:00 AM"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeButtons}>
              {(['medical', 'lab', 'general'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setNewAppointmentType(type)}
                  style={[styles.typeButton, newAppointmentType === type && styles.typeButtonActive]}
                >
                  <Text style={[styles.typeButtonText, newAppointmentType === type && styles.typeButtonTextActive]}>
                    {type === 'medical' ? '🏥 Medical' : type === 'lab' ? '🔬 Lab' : '📋 General'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.selectedDateInfo}>
              Date: {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={() => {
                  setShowAddAppointment(false);
                  setNewAppointmentTitle('');
                  setNewAppointmentTime('');
                }}
                style={[styles.modalButton, styles.modalButtonCancel]}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleAddAppointment}
                style={[styles.modalButton, styles.modalButtonAdd]}
              >
                <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {},
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  userName: { fontSize: 28, color: '#FFF', fontWeight: 'bold', marginTop: 4 },
  profileBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnText: { fontSize: 24 },
  content: { flex: 1, paddingHorizontal: 20 },
  quickAccessSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  accessCard: {
    width: (width - 56) / 2,
    height: 100,
    borderRadius: 16,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  accessIcon: { fontSize: 32, marginBottom: 8 },
  accessText: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtn: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  emptyState: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  appointmentCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pastAppointmentCard: { opacity: 0.7 },
  appointmentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  appointmentIcon: { fontSize: 28, marginRight: 12 },
  appointmentInfo: { flex: 1 },
  appointmentTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  pastText: { textDecorationLine: 'line-through', color: '#6B7280' },
  appointmentDate: { fontSize: 14, color: '#6B7280' },
  deleteBtn: { padding: 8 },
  deleteBtnText: { fontSize: 20 },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  navBtn: { padding: 8 },
  navBtnText: { fontSize: 20, color: '#FFF', fontWeight: 'bold' },
  monthText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  dayLabels: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  calendarDay: {
    width: (width - 56) / 7,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  today: { backgroundColor: 'rgba(255,255,255,0.3)' },
  hasAppointment: { backgroundColor: 'rgba(59,130,246,0.3)' },
  dayText: { fontSize: 14, color: '#FFF', fontWeight: '500' },
  todayText: { fontWeight: 'bold' },
  hasAppointmentText: { fontWeight: 'bold', color: '#3b82f6' },
  appointmentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginTop: 2,
  },
  selectedDateSection: { marginTop: 8 },
  selectedDateTitle: { fontSize: 16, fontWeight: '600', color: '#FFF', marginBottom: 12 },
  addAppointmentBtn: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  addAppointmentBtnText: { fontSize: 14, fontWeight: '600', color: '#FFF', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: width - 48,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  typeButtons: { flexDirection: 'row', marginBottom: 12 },
  typeButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  typeButtonActive: { backgroundColor: '#3b82f6' },
  typeButtonText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  typeButtonTextActive: { color: '#FFF' },
  selectedDateInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', marginTop: 8 },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonCancel: { backgroundColor: '#F3F4F6' },
  modalButtonAdd: { backgroundColor: '#3b82f6' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
});

export default MainScreen;
