import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/lib/authContext';
import { useStudents } from '@/hooks/useStudents';
import { useDrivers } from '@/hooks/useDrivers';

export function useNativeNotifications() {
  const { user, isAuthenticated } = useAuth();
  const { data: students = [] } = useStudents();
  const { data: drivers = [] } = useDrivers();

  // Determine which busId to listen for
  let busId = 'ALL';
  if (user?.role === 'student') {
    const student = students.find(s => s.id === user?.entityId);
    if (student?.assignedBusId) busId = student.assignedBusId;
  } else if (user?.role === 'driver') {
    const driver = drivers.find(d => d.id === user?.entityId);
    if (driver?.assignedBusId) busId = driver.assignedBusId;
  }

  const { data: notifications = [] } = useNotifications(busId);

  useEffect(() => {
    if (!isAuthenticated) return;

    const requestPerms = async () => {
      const status = await LocalNotifications.checkPermissions();
      if (status.display !== 'granted') {
        const result = await LocalNotifications.requestPermissions();
        console.log('📡 Notification permission result:', result.display);
      }
    };
    requestPerms();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || notifications.length === 0) return;

    // Get the last ID we've notified from localStorage
    const storageKey = `last_notified_id_${user?.id}`;
    const lastNotifiedId = localStorage.getItem(storageKey);
    
    // Most recent notification (first in sorted array)
    const latest = notifications[0];

    if (latest && latest.id !== lastNotifiedId) {
      // Don't notify on the very first load if lastNotifiedId is null (to avoid flooding on login)
      if (lastNotifiedId !== null) {
        LocalNotifications.schedule({
          notifications: [
            {
              title: latest.title,
              body: latest.message,
              id: Math.floor(Math.random() * 1000000),
              schedule: { at: new Date(Date.now() + 500) }, // Small delay
              smallIcon: 'ic_stat_bus', // Should be in android res/drawable
              actionTypeId: 'OPEN_APP',
              extra: { nId: latest.id }
            },
          ],
        }).then(() => {
          console.log(`🔔 Native notification sent: ${latest.title}`);
        }).catch(err => {
          console.error('❌ Failed to schedule local notification:', err);
        });
      }
      
      localStorage.setItem(storageKey, latest.id);
    }
  }, [notifications, isAuthenticated, user?.id]);
}
