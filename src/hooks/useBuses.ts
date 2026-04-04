import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { API_URL } from '../lib/api';

// const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export function useBuses() {
  return useQuery({
    queryKey: ['buses'],
  queryFn: async () => {
    const res = await fetch(`${API_URL}/buses`);

      if (!res.ok) throw new Error('Failed to fetch buses');
      return res.json();
    },
  });
}

export function useBusStudents(busId: string) {
  return useQuery({
    queryKey: ['bus', busId, 'students'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/buses/${busId}/students`);

      if (!res.ok) throw new Error('Failed to fetch bus students');
      return res.json();
    },
    enabled: !!busId,
  });
}

export function useAssignStudents(busId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (studentIds: string[]) => {
      const res = await fetch(`${API_URL}/buses/${busId}/assign-students`, {

        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds }),
      });
      if (!res.ok) throw new Error('Failed to assign students');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      queryClient.invalidateQueries({ queryKey: ['bus', busId, 'students'] });
    },
  });
}

export function useBusLocation(busId: string | undefined) {
  return useQuery({
    queryKey: ['bus', busId, 'location'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/buses/${busId}/location`);

      if (res.status === 404) return null; // No location yet
      if (!res.ok) throw new Error('Failed to fetch bus location');
      return res.json();
    },
    enabled: !!busId,
    refetchInterval: 3000,
  });
}

export function useUpdateBusLocation() {
  return useMutation({
    mutationFn: async ({ busId, lat, lng, speed }: { busId: string; lat: number; lng: number; speed: number }) => {
      const res = await fetch(`${API_URL}/buses/${busId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, speed }),
      });
      if (!res.ok) throw new Error('Failed to update location');
      return res.json();
    },
  });
}

export function useCreateBus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bus: { number: string; model: string; capacity: number; status?: string; routeId?: string; driverId?: string }) => {
      const res = await fetch(`${API_URL}/buses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bus),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
}

export function useUpdateBus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & { number?: string; model?: string; capacity?: number; status?: string; routeId?: string; driverId?: string }) => {
      const res = await fetch(`${API_URL}/buses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
}

export function useDeleteBus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/buses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
    },
  });
}
