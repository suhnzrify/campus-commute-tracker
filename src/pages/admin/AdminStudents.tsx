import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import { mockStudents, mockBuses } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Student } from '@/lib/mockData';

export default function AdminStudents() {
  const [students, setStudents] = useState(mockStudents);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', registerNumber: '', phone: '', email: '', assignedBusId: '' });

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.registerNumber.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = () => {
    if (editing) {
      setStudents(students.map(s => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setStudents([...students, { id: `st${Date.now()}`, ...form }]);
    }
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', registerNumber: '', phone: '', email: '', assignedBusId: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Students</h1>
        <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', registerNumber: '', phone: '', email: '', assignedBusId: '' }); }} size="sm" className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-semibold">{editing ? 'Edit Student' : 'Add Student'}</h3>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
          <Input placeholder="Register Number" value={form.registerNumber} onChange={e => setForm({ ...form, registerNumber: e.target.value })} className="rounded-xl" />
          <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-xl" />
          <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
          <select
            value={form.assignedBusId}
            onChange={e => setForm({ ...form, assignedBusId: e.target.value })}
            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
          >
            <option value="">Select Bus</option>
            {mockBuses.map(b => <option key={b.id} value={b.id}>{b.number}</option>)}
          </select>
          <Button onClick={handleSave} className="w-full rounded-xl">Save</Button>
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
                <th className="text-left p-3 font-semibold">Bus</th>
                <th className="text-right p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(student => {
                const bus = mockBuses.find(b => b.id === student.assignedBusId);
                return (
                  <tr key={student.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">{student.registerNumber}</p>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{student.registerNumber}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{student.phone}</td>
                    <td className="p-3"><span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">{bus?.number || '-'}</span></td>
                    <td className="p-3 text-right">
                      <button onClick={() => { setEditing(student); setForm(student); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setStudents(students.filter(s => s.id !== student.id))} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
