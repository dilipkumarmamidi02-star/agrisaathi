import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '../lib/i18n';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DashboardCalendar({ harvestEvents = [], milestoneEvents = [] }) {
  const { t } = useLang();
  const today = new Date();
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const eventsByDate = {};
  [...harvestEvents, ...milestoneEvents].forEach((e) => {
    if (!e.date) return;
    eventsByDate[e.date] = eventsByDate[e.date] || [];
    eventsByDate[e.date].push(e);
  });

  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = today.toISOString().slice(0, 10);
  const monthKey = `${view.year}-${String(view.month + 1).padStart(2, '0')}`;
  const monthEvents = [...harvestEvents, ...milestoneEvents]
    .filter((e) => e.date && e.date.startsWith(monthKey))
    .sort((a, b) => a.date.localeCompare(b.date));

  const prev = () => setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }));
  const next = () => setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }));

  return (
    <div className="rounded-xl border bg-lt-card p-3">
      <div className="flex items-center justify-between mb-2">
        <button onClick={prev} className="p-1 rounded hover:bg-lt-bg"><ChevronLeft className="h-4 w-4" /></button>
        <p className="text-sm font-semibold">{MONTHS[view.month]} {view.year}</p>
        <button onClick={next} className="p-1 rounded hover:bg-lt-bg"><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DOW.map((d, i) => <div key={i} className="text-[10px] text-center text-lt-text-muted font-medium">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = `${view.year}-${String(view.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayEvents = eventsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          return (
            <div key={i} className={`min-h-9 rounded p-1 ${isToday ? 'bg-lt-primary/10 ring-1 ring-green-300' : dayEvents.length ? 'bg-lt-bg' : ''}`}>
              <p className={`text-[10px] ${isToday ? 'font-bold text-lt-primary-dark' : 'text-lt-text-secondary'}`}>{d}</p>
              <div className="flex gap-0.5 flex-wrap">
                {dayEvents.map((e, j) => (
                  <span key={j} className={`h-1.5 w-1.5 rounded-full ${e.kind === 'harvest' ? 'bg-lt-primary' : 'bg-blue-500'}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2 text-[10px] text-lt-text-secondary">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-lt-primary" />{t('harvest')}</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />{t('maintenance')}</span>
      </div>
      {monthEvents.length > 0 && (
        <div className="mt-2 space-y-1 border-t pt-2">
          {monthEvents.slice(0, 5).map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px]">
              <span className={`h-2 w-2 rounded-full shrink-0 ${e.kind === 'harvest' ? 'bg-lt-primary' : 'bg-blue-500'}`} />
              <span className="text-lt-text-muted w-20 shrink-0">{e.date}</span>
              <span className="text-lt-text truncate">{e.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
