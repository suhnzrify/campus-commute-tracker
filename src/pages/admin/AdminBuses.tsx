import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bus, Plus, Pencil, Trash2, X } from 'lucide-react';
import { mockBuses, mockRoutes, mockDrivers } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Bus as BusType } from '@/lib/mockData';

export default function AdminBuses() {
  const [buses, setBuses] = useState(mockBuses);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BusType | null>(null);
  const [form, setForm] = useState({ number: '', model: '', capacity: '' });

  const handleSave = () => {
    if (editing) {
      setBuses(buses.map(b => b.id === editing.id ? { ...b, number: form.number, model: form.model, capacity: Number(form.capacity) } : b));
    } else {
      setBuses([...buses, { id: `b${Date.now()}`, number: form.number, model: form.model, capacity: Number(form.capacity), status: 'inactive', routeId: '', driverId: '' }]);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ number: '', model: '', capacity: '' });
  };

  const handleEdit = (bus: BusType) => {
    setEditing(bus);
    setForm({ number: bus.number, model: bus.model, capacity: String(bus.capacity) });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setBuses(buses.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Buses</h1>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ number: '', model: '', capacity: '' }); }} size="sm" className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Bus
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{editing ? 'Edit Bus' : 'Add New Bus'}</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <Input placeholder="Bus Number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="rounded-xl" />
          <Input placeholder="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="rounded-xl" />
          <Input placeholder="Capacity" type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="rounded-xl" />
          <Button onClick={handleSave} className="w-full rounded-xl">Save</Button>
        </motion.div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {buses.map(bus => {
          const route = mockRoutes.find(r => r.id === bus.routeId);
          const driver = mockDrivers.find(d => d.id === bus.driverId);
          return (
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
                  <button onClick={() => handleEdit(bus)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(bus.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Capacity: {bus.capacity} seats</p>
                <p>Route: {route?.name || 'Unassigned'}</p>
                <p>Driver: {driver?.name || 'Unassigned'}</p>
              </div>
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                bus.status === 'active' ? 'bg-success/15 text-success' :
                bus.status === 'maintenance' ? 'bg-warning/15 text-warning' :
                'bg-muted-foreground/15 text-muted-foreground'
              }`}>
                {bus.status}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
