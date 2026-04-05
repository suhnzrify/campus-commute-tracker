import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'emergency';
  from_user: string;
  targetBusId: string;
  timestamp: number;
}

// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export function useNotifications(busId?: string) {
  const normalizedBusId = (busId && busId.trim()) ? busId.trim() : 'ALL';
  
  return useQuery({
    queryKey: ['notifications', normalizedBusId],
    queryFn: async (): Promise<Notification[]> => {
      const url = `${API_URL}/notifications?busId=${encodeURIComponent(normalizedBusId)}`;
      console.log(`📡 Fetching notifications for: ${normalizedBusId}`);
      
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ Notification fetch failed (${res.status}):`, errorText);
        throw new Error('Failed to fetch notifications');
      }
      return res.json();
    },
    refetchInterval: 10000, 
  });
}

export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Omit<Notification, 'id' | 'timestamp'>) => {
      const res = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: payload.title,
          message: payload.message,
          type: payload.type,
          from: payload.from_user,
          targetBusId: payload.targetBusId,
        }),
      });
      if (!res.ok) {
        let errStr = 'Failed to send notification';
        try {
          const errData = await res.json();
          errStr = errData.error || errStr;
        } catch {
          // Fallback to default error message if JSON parsing fails
        }
        throw new Error(errStr);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
