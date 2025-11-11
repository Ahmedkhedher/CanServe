import { auth, db } from '../firebase/app';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

export type Appointment = {
  id?: string;
  userId: string;
  date: string; // ISO format: YYYY-MM-DD
  title: string;
  time: string;
  type: 'medical' | 'lab' | 'general';
  createdAt?: any; // Timestamp or date
};

// Get all appointments for current user
export async function getUserAppointments(): Promise<Appointment[]> {
  const user = auth?.currentUser;
  if (!user || !db) return [];
  
  try {
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('userId', '==', user.uid),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    snapshot.forEach((doc) => {
      const appointment = {
        id: doc.id,
        ...doc.data()
      } as Appointment;
      appointments.push(appointment);
      console.log('[Appointments] Loaded appointment with ID:', doc.id, 'Title:', appointment.title);
    });
    
    console.log('[Appointments] Total loaded:', appointments.length);
    return appointments;
  } catch (error) {
    console.error('[Appointments] Failed to load appointments:', error);
    return [];
  }
}

// Get upcoming appointments (from today onwards)
export async function getUpcomingAppointments(): Promise<Appointment[]> {
  const user = auth?.currentUser;
  if (!user || !db) return [];
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('userId', '==', user.uid),
      where('date', '>=', todayStr),
      orderBy('date', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    snapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('[Appointments] Failed to load upcoming appointments:', error);
    return [];
  }
}

// Add new appointment
export async function addAppointment(appointment: Omit<Appointment, 'id' | 'userId' | 'createdAt'>): Promise<Appointment | null> {
  const user = auth?.currentUser;
  if (!user || !db) {
    console.error('[Appointments] User not authenticated');
    return null;
  }
  
  try {
    const appointmentData = {
      userId: user.uid,
      date: appointment.date,
      title: appointment.title,
      time: appointment.time,
      type: appointment.type,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
    console.log('[Appointments] Appointment added with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...appointmentData
    } as Appointment;
  } catch (error) {
    console.error('[Appointments] Failed to add appointment:', error);
    return null;
  }
}

// Delete appointment
export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  const user = auth?.currentUser;
  if (!db) {
    console.error('[Appointments] Delete failed - no database');
    return false;
  }
  
  if (!user) {
    console.error('[Appointments] Delete failed - not authenticated');
    return false;
  }
  
  if (!appointmentId) {
    console.error('[Appointments] Delete failed - no appointment ID');
    return false;
  }
  
  try {
    console.log('[Appointments] Attempting to delete appointment:', appointmentId, 'for user:', user.uid);
    await deleteDoc(doc(db, 'appointments', appointmentId));
    console.log('[Appointments] Appointment deleted successfully:', appointmentId);
    return true;
  } catch (error: any) {
    console.error('[Appointments] Failed to delete appointment:', appointmentId);
    console.error('[Appointments] Error details:', error.message, error.code);
    return false;
  }
}

// Get appointments for a specific date
export async function getAppointmentsForDate(dateStr: string): Promise<Appointment[]> {
  const user = auth?.currentUser;
  if (!user || !db) return [];
  
  try {
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('userId', '==', user.uid),
      where('date', '==', dateStr)
    );
    
    const snapshot = await getDocs(q);
    const appointments: Appointment[] = [];
    
    snapshot.forEach((doc) => {
      appointments.push({
        id: doc.id,
        ...doc.data()
      } as Appointment);
    });
    
    return appointments;
  } catch (error) {
    console.error('[Appointments] Failed to load appointments for date:', error);
    return [];
  }
}
