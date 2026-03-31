import { useQuery } from '@tanstack/react-query';
import { API_URL } from '../lib/api';
import type { Student } from '@/lib/mockData';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async (): Promise<Student[]> => {
      const res = await fetch(`${API_URL}/students`);
      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json();
    },
  });
}
