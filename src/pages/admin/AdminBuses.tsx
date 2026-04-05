import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bus, Plus, Pencil, Trash2, X, Users, ChevronDown } from 'lucide-react';
// Removed mockRoutes - using API route data

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import type { Bus as BusType } from '@/lib/mockData';
import { useBuses, useCreateBus, useUpdateBus, useDeleteBus } from '@/hooks/useBuses';
import { useRoutes } from '@/hooks/useRoutes';


export default function AdminBuses() {
  const busesQuery = useBuses();
  const buses = busesQuery.data || [];
  const { data: routes = [] } = useRoutes();
  const createBus = useCreateBus();
  const updateBus = useUpdateBus();
  const deleteBus = useDeleteBus();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BusType | null>(null);
  const [form, setForm] = useState({ number: '', model: '', capacity: '', routeId: '', status: 'active' });
  const [error, setError] = useState<string | null>(null);
  const [expandedBus, setExpandedBus] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      if (editing) {
        await updateBus.mutateAsync({ id: editing.id, ...form, capacity: Number(form.capacity) });
      } else {
        await createBus.mutateAsync({ 
          number: form.number, 
          model: form.model, 
          capacity: Number(form.capacity),
          routeId: form.routeId,
          status: form.status as 'active' | 'maintenance' | 'inactive'
        });
      }
      busesQuery.refetch();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save bus.';
      setError(errorMsg);
      return;
    }
    setShowForm(false);
    setEditing(null);
    setForm({ number: '', model: '', capacity: '', routeId: '', status: 'active' });
  };


  const handleEdit = (bus: BusType) => {
    setEditing(bus);
    setForm({ 
      number: bus.number, 
      model: bus.model, 
      capacity: String(bus.capacity),
      routeId: bus.routeId || '',
      status: bus.status || 'active'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBus.mutateAsync(id);
    } catch {
      setError('Failed to delete bus.');
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Buses</h1>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ number: '', model: '', capacity: '', routeId: '', status: 'active' }); }} size="sm" className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Bus
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{editing ? 'Edit Bus' : 'Add New Bus'}</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <Input id="bus-number" name="bus-number" placeholder="Bus Number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <Input id="bus-model" name="bus-model" placeholder="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="rounded-xl" />
            <Input id="bus-capacity" name="bus-capacity" type="number" placeholder="Capacity" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="rounded-xl" />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.routeId}
              onChange={e => setForm({ ...form, routeId: e.target.value })}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="">No Route Assigned</option>
              {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <Button onClick={handleSave} className="w-full rounded-xl" disabled={createBus.isPending || updateBus.isPending}>
            {(createBus.isPending || updateBus.isPending) ? 'Saving...' : 'Save Bus Configuration'}
          </Button>
        </motion.div>
      )}


      <div className="grid gap-3 sm:grid-cols-2">
        {buses.map(bus => (
          <motion.div key={bus.id} layout className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg stat-gradient flex items-center justify-center">
                  <Bus className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-bold">{bus.number}</p>
                  <p className="text-xs text-muted-foreground">{bus.model}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(bus as BusType)} className="p-1.5 rounded-lg hover:bg-muted" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(bus.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Route: <span className="font-semibold text-primary">{routes.find(r => r.id === bus.routeId)?.name || 'Unassigned'}</span></p>
                <p>Capacity: {bus.capacity} seats</p>
                <p>Students: <span className="font-semibold">{bus.studentCount || 0}</span></p>
              </div>
            </div>
            <span className={`inline-block mt-3 text-xs px-2 py-0.5 rounded-full font-medium ${
              bus.status === 'active' ? 'bg-success/15 text-success' :
              'bg-muted/10 text-muted-foreground'
            }`}>
              {bus.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

