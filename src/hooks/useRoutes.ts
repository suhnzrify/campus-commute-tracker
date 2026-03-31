import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../lib/api';
import type { Route } from '@/lib/mockData';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async (): Promise<Route[]> => {
      const res = await fetch(`${API_URL}/routes`);
      if (!res.ok) throw new Error('Failed to fetch routes');
      return res.json();
    },
  });
}
