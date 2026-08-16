// frontend/src/pages/Calendar.jsx
// Calendar module — month grid view of deal milestones and activities from GET /api/calendar/events.
// Real data, theme-aware, with day-popover details.
// Used in: App.jsx /calendar route.

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, GitBranch } from 'lucide-react';
import api from '../api/axios';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Panel from '../components/common/Panel';
import { pageVariants, containerVariants, itemVariants } from '../animations/variants';
import { formatCurrency } from '../utils/format';
import StatusState from '../components/ui/StatusState';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function Calendar() {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchEvents = async (year, month) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/calendar/events', { params: { year, month } });
      setEvents(response.data.events);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load calendar events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(view.year, view.month);
  }, [view]);

  const navigate = (delta) => {
    setView((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    });
  };

  // Build month grid.
  const firstDay = new Date(view.year, view.month - 1, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(view.year, view.month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDay = {};
  events.forEach((ev) => {
    const day = new Date(ev.date).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(ev);
  });

  const monthLabel = new Date(view.year, view.month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  const stageColor = {
    Won: 'bg-success/15 text-success border-success/30',
    Lost: 'bg-danger/15 text-danger border-danger/30',
    Qualified: 'bg-info/15 text-info border-info/30',
    Proposal: 'bg-accent-primary/15 text-accent-secondary-glow border-accent-primary/30',
    Negotiation: 'bg-warning/15 text-warning border-warning/30',
  };

  const dayEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
      <PageHeader
        title="Calendar"
        icon={CalendarDays}
        subtitle="Deal milestones and team activity across the month."
        badge="Monthly"
        accent="#3B82F6"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl glass-deep hover:bg-overlay/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-display font-semibold text-text-primary min-w-[140px] text-center">{monthLabel}</span>
            <button
              onClick={() => navigate(1)}
              className="p-2 rounded-xl glass-deep hover:bg-overlay/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer outline-none"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setView({ year: today.getFullYear(), month: today.getMonth() + 1 })}
              className="px-3 py-2 rounded-xl glass-deep hover:bg-overlay/5 text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors cursor-pointer outline-none"
            >
              Today
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month grid */}
        <Panel title={monthLabel} icon={CalendarDays} accent="#3B82F6" className="lg:col-span-2" lift={false}>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-text-secondary/50 py-1">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="h-[420px] shimmer rounded-2xl" />
          ) : error ? (
            <StatusState type="error" message={error} onRetry={() => fetchEvents(view.year, view.month)} />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, idx) => {
                const dayKey = day ? `${view.year}-${view.month}-${day}` : null;
                const isToday = dayKey === todayKey;
                const dayEvts = day ? eventsByDay[day] || [] : [];
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={idx}
                    disabled={!day}
                    onClick={() => day && setSelectedDay(day)}
                    className={`relative min-h-[72px] rounded-xl p-1.5 text-left transition-all cursor-pointer outline-none border ${
                      isToday
                        ? 'border-accent-primary/60 bg-accent-primary/10'
                        : isSelected
                        ? 'border-accent-highlight/60 bg-accent-highlight/10'
                        : 'border-overlay/5 bg-overlay/[0.02] hover:bg-overlay/5'
                    } ${day ? '' : 'opacity-30'}`}
                  >
                    <span className={`text-[11px] font-semibold ${isToday ? 'text-accent-secondary-glow' : 'text-text-secondary'}`}>
                      {day || ''}
                    </span>
                {dayEvts.length > 0 && (
                  <motion.div
                    className="flex flex-col gap-0.5 mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {dayEvts.slice(0, 2).map((ev) => (
                      <motion.span
                        key={ev.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="block text-[9px] leading-tight px-1 py-0.5 rounded-md border truncate font-medium"
                        style={{
                          color: ev.type === 'deal' ? '#C084FC' : '#10B981',
                          background: ev.type === 'deal' ? 'rgba(124,58,237,0.12)' : 'rgba(16,185,129,0.12)',
                          borderColor: ev.type === 'deal' ? 'rgba(124,58,237,0.3)' : 'rgba(16,185,129,0.3)',
                        }}
                      >
                        {ev.title}
                      </motion.span>
                    ))}
                    {dayEvts.length > 2 && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, delay: 0.1, ease: 'easeOut' }}
                        className="text-[9px] text-text-secondary/60 font-semibold"
                      >
                        +{dayEvts.length - 2} more
                      </motion.span>
                    )}
                  </motion.div>
                )}
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Day detail panel */}
        <div className="glass-deep rounded-2xl p-5 flex flex-col gap-4 h-fit">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-accent-secondary-glow" />
            <h3 className="text-sm font-display font-semibold text-text-primary">
              {selectedDay
                ? new Date(view.year, view.month - 1, selectedDay).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Select a day'}
            </h3>
          </div>

          {selectedDay === null ? (
            <EmptyState title="No day selected" description="Click a date on the calendar to see its events." />
          ) : dayEvents.length === 0 ? (
            <EmptyState title="Nothing scheduled" description="No deals or activities on this day." />
          ) : (
            <motion.div
              className="flex flex-col gap-3"
              variants={containerVariants}
              initial="initial"
              animate="animate"
            >
              {dayEvents.map((ev) => (
                <motion.div
                  key={ev.id}
                  variants={itemVariants}
                  className="p-3 rounded-xl border border-overlay/5 bg-bg-card/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                      {ev.type === 'deal' ? <GitBranch size={13} className="text-accent-secondary-glow" /> : <CheckCircle2 size={13} className="text-success" />}
                      {ev.type === 'deal' ? 'Deal milestone' : 'Activity'}
                    </span>
                    {ev.type === 'deal' && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${stageColor[ev.stage] || stageColor.Qualified}`}>
                        {ev.stage}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary mt-1.5 font-medium">{ev.title}</p>
                  {ev.type === 'deal' && (
                    <div className="flex items-center justify-between mt-2 text-[11px] text-text-secondary">
                      <span>{ev.customer}</span>
                      <span className="font-bold text-success">{formatCurrency(ev.value)}</span>
                    </div>
                  )}
                  {ev.notes && <p className="text-[11px] text-text-secondary/70 mt-1">{ev.notes}</p>}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default Calendar;
