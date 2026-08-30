import { useState, useEffect } from 'react'
import { ListTodo, Plus, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useLang } from '../lib/i18n';
import appClient from '../api/appClient';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import PageHeader from '../components/PageHeader';

const CATEGORIES = [
  { value: 'planting', label: 'Planting', color: 'bg-mint/20 text-mint' },
  { value: 'weeding', label: 'Weeding', color: 'bg-amber-100 text-amber-400' },
  { value: 'feeding', label: 'Feeding', color: 'bg-rose-100 text-rose-700' },
  { value: 'irrigation', label: 'Irrigation', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'harvest', label: 'Harvest', color: 'bg-orange-100 text-orange-700' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-blue-100 text-cyan-400' },
  { value: 'other', label: 'Other', color: 'bg-surface-hover text-text-primary' },
];
const meta = (v) => CATEGORIES.find((c) => c.value === v) || CATEGORIES[6];
const today = new Date().toISOString().slice(0, 10);
const daysUntil = (d) => Math.ceil((new Date(d) - new Date(today)) / 86400000);

export default function TaskManager() {
  const { t } = useLang();
  const [tasks, setTasks] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'planting', plot_name: '', due_date: '', priority: 'medium', notes: '' });

  const load = () => appClient.entities.FarmTask.list('-due_date').then(setTasks).catch(() => []);
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title) { alert('Title required'); return; }
    await appClient.entities.FarmTask.create({
      title: form.title, category: form.category, plot_name: form.plot_name || undefined,
      due_date: form.due_date || undefined, priority: form.priority, notes: form.notes || undefined,
    });
    setForm({ title: '', category: 'planting', plot_name: '', due_date: '', priority: 'medium', notes: '' });
    setShowAdd(false);
    load();
  };

  const toggle = async (task) => { await appClient.entities.FarmTask.update(task.id, { status: task.status === 'done' ? 'pending' : 'done' }); load(); };
  const remove = async (id) => { await appClient.entities.FarmTask.delete(id); load(); };

  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return (a.due_date || '9999').localeCompare(b.due_date || '9999');
  });

  return (
    <div>
      <PageHeader titleKey="taskManager" icon={ListTodo} />
      <p className="text-xs text-text-secondary mb-3">{t('taskManagerIntro')}</p>

      <div className="space-y-2 mb-4">
        {sorted.length === 0 ? (
          <p className="text-sm text-text-muted">{t('noTasks')}</p>
        ) : sorted.map((task) => {
          const m = meta(task.category);
          const d = task.due_date ? daysUntil(task.due_date) : null;
          const overdue = d != null && d < 0 && task.status !== 'done';
          return (
            <Card key={task.id} className={task.status === 'done' ? 'opacity-60' : ''}><CardContent className="pt-3">
              <div className="flex items-start gap-2">
                <button onClick={() => toggle(task)} className="mt-0.5">
                  {task.status === 'done' ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-gray-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-text-muted' : ''}`}>{task.title}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <Badge className={m.color}>{m.label}</Badge>
                    {task.priority === 'high' && <Badge className="bg-red-100 text-red-400">{t('highPriority')}</Badge>}
                    {task.plot_name && <Badge variant="outline">{task.plot_name}</Badge>}
                    {d != null && !overdue && task.status !== 'done' && <Badge className={d <= 2 ? 'bg-amber-100 text-amber-400' : 'bg-surface-hover text-text-secondary'}>{d === 0 ? t('today') : `${d} ${t('daysLeft')}`}</Badge>}
                    {overdue && <Badge className="bg-red-100 text-red-400 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{t('overdue')}</Badge>}
                  </div>
                  {task.notes && <p className="text-xs text-text-secondary mt-1">{task.notes}</p>}
                </div>
                <button onClick={() => remove(task.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            </CardContent>
            </Card>
          );
        })}
      </div>

      {showAdd ? (
        <Card className="border-green-200"><CardContent className="pt-4 space-y-3">
          <div><Label className="mb-1 block text-xs">{t('title')}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-xs">{t('category')}</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">{t('priority')}</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">{t('lowPriority')}</SelectItem><SelectItem value="medium">{t('mediumPriority')}</SelectItem><SelectItem value="high">{t('highPriority')}</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="mb-1 block text-xs">{t('plotName')}</Label><Input value={form.plot_name} onChange={(e) => setForm({ ...form, plot_name: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs">{t('dueDate')}</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <Textarea placeholder={t('notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1 bg-green-600 hover:bg-green-700">{t('save')}</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">{t('cancel')}</Button>
          </div>
        </CardContent></Card>
      ) : (
        <Button onClick={() => setShowAdd(true)} variant="outline" className="w-full border-mint/40 text-mint"><Plus className="h-4 w-4 mr-1" />{t('addTask')}</Button>
      )}
    </div>
  );
}
