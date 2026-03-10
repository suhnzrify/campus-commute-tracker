import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, Pencil, Trash2, X, Phone } from 'lucide-react';
import { mockDrivers, mockBuses } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Driver } from '@/lib/mockData';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState(mockDrivers);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const handleSave = () => {
    if (editing) {
      setDrivers(drivers.map(d => d.id === editing.id ? { ...d, ...form } : d));
    } else {
      setDrivers([...drivers, { id: `d${Date.now()}`, ...form, assignedBusId: '', isOnTrip: false }]);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', phone: '', email: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Drivers</h1>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', phone: '', email: '' }); }} size="sm" className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Driver
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{editing ? 'Edit Driver' : 'Add Driver'}</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
          <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
          <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
          <Button onClick={handleSave} className="w-full rounded-xl">Save</Button>
        </motion.div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {drivers.map(driver => {
          const bus = mockBuses.find(b => b.id === driver.assignedBusId);
          return (
            <motion.div key={driver.id} layout className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-display font-bold">{driver.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{driver.phone}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(driver); setForm({ name: driver.name, phone: driver.phone, email: driver.email }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDrivers(drivers.filter(d => d.id !== driver.id))} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Bus: {bus?.number || 'Unassigned'}</p>
                <p>Status: {driver.isOnTrip ? '🟢 On Trip' : '⚪ Off Duty'}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
