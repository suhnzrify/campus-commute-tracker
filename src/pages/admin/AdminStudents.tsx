import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, X, Search, Eye, MapPin, GraduationCap, Clock } from 'lucide-react';
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
import type { Student } from '@/lib/mockData';
import { useBuses } from '@/hooks/useBuses';
import { useRoutes } from '@/hooks/useRoutes';
import { API_URL } from '@/lib/api';

export default function AdminStudents() {
  const busesQuery = useBuses();
  const buses = busesQuery.data || [];
  const routesQuery = useRoutes();
  const routes = routesQuery.data || [];
  const allStops = routes.flatMap(r => r.stops);

  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ 
    name: '', registerNumber: '', phone: '', email: '', 
    assignedBusId: '', class: '', semester: '', admissionYear: '', 
    pickupStopId: '', dropStopId: '' 
  });
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; student: Student | null }>({ open: false, student: null });
  const [viewProfile, setViewProfile] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/students`);
        const data = await res.json();
        setStudents(data);
      } catch {
        setError('Failed to load students from server.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async () => {
    if (!deleteDialog.student) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/students/${deleteDialog.student.id}`, { method: 'DELETE' });
      setStudents(students.filter(s => s.id !== deleteDialog.student!.id));
    } catch {
      setError('Failed to delete student.');
    } finally {
      setLoading(false);
    }
    setDeleteDialog({ open: false, student: null });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editing) {
        const res = await fetch(`${API_URL}/students/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
        const updated: Student = await res.json();
        setStudents(students.map(s => (s.id === updated.id ? updated : s)));
      } else {
        const res = await fetch(`${API_URL}/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error(await res.text());
        const created: Student = await res.json();
        setStudents([...students, created]);
      }
    } catch {
      setError('Failed to save student.');
    } finally {
      setLoading(false);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', registerNumber: '', phone: '', email: '', assignedBusId: '', class: '', semester: '', admissionYear: '', pickupStopId: '', dropStopId: '' });
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.registerNumber.toLowerCase().includes(search.toLowerCase()) ||
    (student.phone && student.phone.includes(search)) ||
    (student.email && student.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Students</h1>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', registerNumber: '', phone: '', email: '', assignedBusId: '', class: '', semester: '', admissionYear: '', pickupStopId: '', dropStopId: '' }); }} size="sm" className="rounded-xl gap-2" disabled={loading}>
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 space-y-4 border border-primary/20 bg-background/90 shadow-xl z-20 relative">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{editing ? 'Edit Student' : 'Add Student'}</h3>
            <button onClick={() => setShowForm(false)} className="hover:bg-muted p-1 rounded-md"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input name="student-name" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            <Input name="student-regnum" placeholder="Register Number" value={form.registerNumber} onChange={e => setForm({ ...form, registerNumber: e.target.value })} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
            <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-2">
             <Input placeholder="Class (e.g. CS)" value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="rounded-xl text-xs" />
             <Input placeholder="Semester (e.g. S4)" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className="rounded-xl text-xs" />
             <Input placeholder="Year (e.g. 2024)" value={form.admissionYear} onChange={e => setForm({ ...form, admissionYear: e.target.value })} className="rounded-xl text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
             <select value={form.pickupStopId} onChange={e => setForm({ ...form, pickupStopId: e.target.value })} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs">
               <option value="">Select Pickup Stop</option>
               {allStops.map(s => <option key={`p-${s.id}`} value={s.id}>{s.name}</option>)}
             </select>
             <select value={form.dropStopId} onChange={e => setForm({ ...form, dropStopId: e.target.value })} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs">
               <option value="">Select Drop Stop</option>
               {allStops.map(s => <option key={`d-${s.id}`} value={s.id}>{s.name}</option>)}
             </select>
          </div>
          <select
            value={form.assignedBusId}
            onChange={e => setForm({ ...form, assignedBusId: e.target.value })}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Assign To Bus</option>
            {buses.map(b => <option key={b.id} value={b.id}>{b.number} - {b.model}</option>)}
          </select>
          <Button onClick={handleSave} className="w-full rounded-xl" disabled={loading}>
            {loading ? 'Saving...' : 'Save Student'}
          </Button>
        </motion.div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-semibold">Name</th>
                <th className="text-left p-3 font-semibold hidden sm:table-cell">Reg No</th>
                <th className="text-left p-3 font-semibold hidden md:table-cell">Phone</th>
                <th className="text-left p-3 font-semibold hidden lg:table-cell">Email</th>
                <th className="text-left p-3 font-semibold">Bus</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => {
                const bus = buses.find(b => b.id === student.assignedBusId);
                return (
                  <tr key={student.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{student.registerNumber}</p>
                      <p className="text-xs text-muted-foreground lg:hidden">{student.email}</p>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{student.registerNumber}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{student.phone}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{student.email}</td>
                    <td className="p-3"><span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">{bus?.number || '-'}</span></td>
                    <td className="p-3 text-right">
                      <button onClick={() => setViewProfile(student)} className="p-1.5 rounded-lg hover:bg-muted text-success" title="View Profile">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { 
                        setEditing(student); 
                        setForm({ 
                          name: student.name, registerNumber: student.registerNumber, phone: student.phone || '', email: student.email || '', 
                          assignedBusId: student.assignedBusId || '', class: student.class || '', semester: student.semester || '', admissionYear: student.admissionYear || '', 
                          pickupStopId: student.pickupStopId || '', dropStopId: student.dropStopId || ''
                        }); 
                        setShowForm(true); 
                      }} className="p-1.5 rounded-lg hover:bg-muted ml-1 text-primary" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteDialog({ open: true, student })}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive ml-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!viewProfile} onOpenChange={(open) => !open && setViewProfile(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl glass-card border-primary/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-display">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {viewProfile?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                 {viewProfile?.name}
                 <p className="text-xs text-muted-foreground font-normal tracking-wide uppercase">{viewProfile?.registerNumber}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-4">
               <div className="bg-muted p-2 rounded-lg text-center">
                 <p className="text-[10px] uppercase text-muted-foreground font-semibold">Class</p>
                 <p className="text-sm font-bold text-primary">{viewProfile?.class || 'N/A'}</p>
               </div>
               <div className="bg-muted p-2 rounded-lg text-center">
                 <p className="text-[10px] uppercase text-muted-foreground font-semibold">Semester</p>
                 <p className="text-sm font-bold text-primary">{viewProfile?.semester || 'N/A'}</p>
               </div>
               <div className="bg-muted p-2 rounded-lg text-center">
                 <p className="text-[10px] uppercase text-muted-foreground font-semibold">Year</p>
                 <p className="text-sm font-bold text-primary">{viewProfile?.admissionYear || 'N/A'}</p>
               </div>
            </div>

            <div className="space-y-3 pt-2">
               <h4 className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-warning" /> Route Logistics</h4>
               
               <div className="flex border border-border/50 rounded-xl overflow-hidden text-sm">
                  <div className="w-1/2 p-3 bg-muted/50 border-r border-border/50">
                     <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Pickup Stop</p>
                     <p className="font-medium text-foreground">{allStops.find(s => s.id === viewProfile?.pickupStopId)?.name || 'Not Assigned'}</p>
                  </div>
                  <div className="w-1/2 p-3 bg-muted/50">
                     <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Drop Stop</p>
                     <p className="font-medium text-foreground">{allStops.find(s => s.id === viewProfile?.dropStopId)?.name || 'Not Assigned'}</p>
                  </div>
               </div>

               <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 flex items-center justify-between">
                 <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold mb-1">Assigned Vehicle</p>
                    <p className="font-semibold text-primary">{buses.find(b => b.id === viewProfile?.assignedBusId)?.number || 'Unassigned'}</p>
                 </div>
                 <div className="bg-white/50 p-2 rounded-lg shadow-sm">🚌</div>
               </div>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-border/50 mt-2">
               <p className="text-xs text-muted-foreground"><strong>Email:</strong> {viewProfile?.email || 'N/A'}</p>
               <p className="text-xs text-muted-foreground"><strong>Phone:</strong> {viewProfile?.phone || 'N/A'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, student: open ? deleteDialog.student : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteDialog.student?.name}? This action cannot be undone.
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
