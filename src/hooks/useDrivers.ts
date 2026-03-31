import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../lib/api';
import type { Driver } from '@/lib/mockData';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async (): Promise<Driver[]> => {
      const res = await fetch(`${API_URL}/drivers`);
      if (!res.ok) throw new Error('Failed to fetch drivers');
      return res.json();
    },
  });
}
