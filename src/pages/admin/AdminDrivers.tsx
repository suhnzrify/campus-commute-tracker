import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, Pencil, Trash2, X, Phone, Search, RefreshCw, Eye, Bus as BusIcon, Route as RouteIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Driver } from '@/lib/mockData';
import { useBuses } from '@/hooks/useBuses';
import { API_URL } from '@/lib/api';

export default function AdminDrivers() {
  const busesQuery = useBuses();
  const buses = busesQuery.data || [];
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', assignedBusId: '' });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; driver: Driver | null }>({ open: false, driver: null });
  const [viewProfile, setViewProfile] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/drivers`);
      const data = await res.json();
      setDrivers(data);
    } catch {
      setError('Failed to load drivers from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) {
        const res = await fetch(`${API_URL}/drivers/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
        const updated: Driver = await res.json();
        setDrivers(drivers.map(d => (d.id === updated.id ? updated : d)));
      } else {
        const res = await fetch(`${API_URL}/drivers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
        const created: Driver = await res.json();
        setDrivers([...drivers, created]);
      }
    } catch {
      setError('Failed to save driver.');
    } finally {
      setLoading(false);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', phone: '', email: '', assignedBusId: '' });
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(search.toLowerCase()) ||
    driver.phone.includes(search) ||
    driver.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteDialog.driver) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/drivers/${deleteDialog.driver.id}`, { method: 'DELETE' });
      setDrivers(drivers.filter(d => d.id !== deleteDialog.driver!.id));
    } catch {
      setError('Failed to delete driver.');
    } finally {
      setLoading(false);
    }
    setDeleteDialog({ open: false, driver: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Drivers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadDrivers} disabled={loading} className="rounded-xl">
             <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', phone: '', email: '', assignedBusId: '' }); }} size="sm" className="rounded-xl gap-2" disabled={loading}>
            <Plus className="w-4 h-4" /> Add Driver
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 space-y-3 z-10 relative">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{editing ? 'Edit Driver' : 'Add Driver'}</h3>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted"><X className="w-4 h-4" /></button>
          </div>
          <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
          <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
          <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
          <select
            value={form.assignedBusId}
            onChange={e => setForm({ ...form, assignedBusId: e.target.value })}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Select Bus</option>
            {buses.map(b => <option key={b.id} value={b.id}>{b.number} - {b.model}</option>)}
          </select>
          <Button onClick={handleSave} className="w-full rounded-xl" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </motion.div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {filteredDrivers.map(driver => {
          const bus = buses.find(b => b.id === driver.assignedBusId);
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
                  <button onClick={() => setViewProfile(driver)} className="p-1.5 rounded-lg hover:bg-muted text-success" title="View Profile">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setEditing(driver); setForm({ name: driver.name, phone: driver.phone, email: driver.email || '', assignedBusId: driver.assignedBusId || '' }); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-muted text-primary" title="Edit">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteDialog({ open: true, driver })}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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

      <Dialog open={!!viewProfile} onOpenChange={(open) => !open && setViewProfile(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-display">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                 {viewProfile?.name}
                 <p className="text-xs text-muted-foreground font-normal tracking-wide uppercase">Driver Profile</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            
            <div className="grid grid-cols-2 gap-2 border-b border-border/50 pb-4">
               <div className="bg-muted p-3 rounded-xl flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success">
                   <RouteIcon className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-[10px] uppercase text-muted-foreground font-semibold">Live Fleet Status</p>
                   <p className="text-sm font-bold text-foreground">{viewProfile?.isOnTrip ? '🟢 Active Route' : '⚪ Off-Duty Standby'}</p>
                 </div>
               </div>
               <div className="bg-muted p-3 rounded-xl flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                   <BusIcon className="w-4 h-4" />
                 </div>
                 <div>
                   <p className="text-[10px] uppercase text-muted-foreground font-semibold">Vehicle Bond</p>
                   <p className="text-sm font-bold text-foreground">{buses.find(b => b.id === viewProfile?.assignedBusId)?.number || 'Unassigned'}</p>
                 </div>
               </div>
            </div>

            <div className="space-y-2 pt-2 text-sm">
               <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/50">
                 <span className="text-muted-foreground font-medium">Contact Number:</span>
                 <span className="font-semibold">{viewProfile?.phone || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/50">
                 <span className="text-muted-foreground font-medium">Authentication Email:</span>
                 <span className="font-semibold">{viewProfile?.email || 'N/A'}</span>
               </div>
               <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/50">
                 <span className="text-muted-foreground font-medium">Registry ID:</span>
                 <span className="font-mono text-xs">{viewProfile?.id}</span>
               </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, driver: open ? deleteDialog.driver : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDialog.driver?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
