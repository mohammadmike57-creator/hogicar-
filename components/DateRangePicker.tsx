import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import X from 'lucide-react/dist/esm/icons/x';

export type DateField = 'pickup' | 'dropoff';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  minDate: string; // YYYY-MM-DD
  active: DateField;
  onActiveChange: (field: DateField) => void;
  onChange: (start: string, end: string) => void;
  onClose: () => void;
  /** Element the desktop popover is positioned under. */
  anchorEl?: HTMLElement | null;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MOBILE_MONTHS = 13;
const DESKTOP_WIDTH = 680;

const iso = (d: Date) => format(d, 'yyyy-MM-dd');
const safeParse = (value: string, fallback: Date) => {
  const d = value ? parseISO(value) : fallback;
  return Number.isNaN(d.getTime()) ? fallback : startOfDay(d);
};

const useIsDesktop = () => {
  const query = '(min-width: 1024px)';
  const [desktop, setDesktop] = React.useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setDesktop(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return desktop;
};

interface MonthGridProps {
  month: Date;
  start: Date;
  end: Date;
  minDate: Date;
  previewEnd: Date | null;
  active: DateField;
  onSelect: (day: Date) => void;
  onHover: (day: Date | null) => void;
  showTitle?: boolean;
  showWeekdays?: boolean;
}

const MonthGrid: React.FC<MonthGridProps> = ({ month, start, end, minDate, previewEnd, active, onSelect, onHover, showTitle = true, showWeekdays = false }) => {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const rangeEnd = active === 'dropoff' && previewEnd && isAfter(previewEnd, start) ? previewEnd : end;
  const today = startOfDay(new Date());

  const days: Date[] = [];
  for (let d = gridStart; !isAfter(d, gridEnd); d = addDays(d, 1)) days.push(d);

  return (
    <div className="w-full" data-month={format(monthStart, 'yyyy-MM')}>
      {showTitle && <h3 className="mb-2 text-center text-[15px] font-bold text-slate-900">{format(monthStart, 'MMMM yyyy')}</h3>}
      {showWeekdays && (
        <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-slate-500" aria-hidden>
          {WEEKDAYS.map(d => <span key={d} className="py-1">{d}</span>)}
        </div>
      )}
      <div className="grid grid-cols-7" role="grid" aria-label={format(monthStart, 'MMMM yyyy')}>
        {days.map(day => {
          if (!isSameMonth(day, monthStart)) return <div key={day.toISOString()} className="h-11" aria-hidden />;
          const disabled = isBefore(day, minDate);
          const isStart = isSameDay(day, start);
          const isEnd = isSameDay(day, rangeEnd);
          const inRange = isAfter(day, start) && isBefore(day, rangeEnd);
          const isToday = isSameDay(day, today);
          const hasRange = !isSameDay(start, rangeEnd);
          const band = inRange
            ? 'bg-accent-50'
            : isStart && hasRange
              ? 'bg-gradient-to-r from-transparent from-50% to-accent-50 to-50%'
              : isEnd && hasRange
                ? 'bg-gradient-to-r from-accent-50 from-50% to-transparent to-50%'
                : '';
          return (
            <div key={day.toISOString()} className={`flex h-11 items-center justify-center ${band}`}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(day)}
                onMouseEnter={() => onHover(day)}
                aria-label={format(day, 'EEEE, d MMMM yyyy')}
                aria-pressed={isStart || isEnd}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors
                  ${isStart || isEnd ? 'bg-accent font-bold text-white shadow-sm' : inRange ? 'font-medium text-accent-900 hover:bg-accent-100' : 'text-slate-800 hover:bg-slate-100'}
                  ${disabled ? 'cursor-not-allowed !bg-transparent !text-slate-300' : 'cursor-pointer'}
                  ${isToday && !isStart && !isEnd ? 'font-bold text-accent' : ''}`}
              >
                {format(day, 'd')}
                {isToday && !isStart && !isEnd && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Pick-up / drop-off date range picker in the style of the big travel sites:
 * two months side by side on desktop, a full-screen scrolling sheet on mobile.
 * Rendered into document.body so sticky bars on the page can never cover it.
 */
export const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, minDate, active, onActiveChange, onChange, onClose, anchorEl }) => {
  const isDesktop = useIsDesktop();
  const min = safeParse(minDate, startOfDay(new Date()));
  const start = safeParse(startDate, min);
  const end = safeParse(endDate, addDays(start, 3));
  const [previewEnd, setPreviewEnd] = React.useState<Date | null>(null);
  // Desktop always opens on the pick-up month so the whole range is visible.
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(start));
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const sheetScrollRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{ top: number; left: number } | null>(null);
  const days = Math.max(1, differenceInCalendarDays(end, start));

  const select = (day: Date) => {
    if (active === 'pickup') {
      const duration = Math.max(1, differenceInCalendarDays(end, start));
      const newEnd = isAfter(end, day) ? end : addDays(day, duration);
      onChange(iso(day), iso(newEnd));
      onActiveChange('dropoff');
      return;
    }
    if (isBefore(day, start)) {
      // Picked a day before the pick-up: treat it as the new pick-up date.
      const duration = Math.max(1, differenceInCalendarDays(end, start));
      onChange(iso(day), iso(addDays(day, duration)));
      return;
    }
    onChange(iso(start), iso(day));
    window.setTimeout(onClose, 180);
  };

  // Close on Escape; lock page scroll for the mobile sheet.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    let previous = '';
    if (!isDesktop) {
      previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      if (!isDesktop) document.body.style.overflow = previous;
    };
  }, [isDesktop, onClose]);

  // Desktop: close when clicking outside the popover and its anchor.
  React.useEffect(() => {
    if (!isDesktop) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || anchorEl?.contains(target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isDesktop, anchorEl, onClose]);

  // Desktop: keep the popover attached under the date fields while the page scrolls.
  React.useLayoutEffect(() => {
    if (!isDesktop) return;
    const place = () => {
      const rect = anchorEl?.getBoundingClientRect();
      const height = popoverRef.current?.offsetHeight || 460;
      const width = Math.min(DESKTOP_WIDTH, window.innerWidth - 32);
      if (!rect) {
        setPosition({ top: Math.max(16, (window.innerHeight - height) / 2), left: (window.innerWidth - width) / 2 });
        return;
      }
      let top = rect.bottom + 8;
      if (top + height > window.innerHeight - 8 && rect.top - height - 8 > 8) top = rect.top - height - 8;
      const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
      setPosition({ top, left });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isDesktop, anchorEl]);

  // Mobile: scroll the sheet to the pick-up month when it opens.
  React.useEffect(() => {
    if (isDesktop) return;
    const el = sheetScrollRef.current?.querySelector(`[data-month="${format(start, 'yyyy-MM')}"]`) as HTMLElement | null;
    if (el && sheetScrollRef.current) sheetScrollRef.current.scrollTop = Math.max(0, el.offsetTop - 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDesktop]);

  if (typeof document === 'undefined') return null;

  const fieldTab = (field: DateField, label: string, date: Date) => (
    <button
      type="button"
      onClick={() => onActiveChange(field)}
      className={`min-w-0 flex-1 rounded-xl border-2 px-3 py-2 text-start transition-colors ${active === field ? 'border-accent bg-accent-50/60' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      aria-pressed={active === field}
    >
      <span className="block text-xs text-slate-500">{label}</span>
      <span className="block truncate text-sm font-bold text-slate-900">{format(date, 'EEE, d MMM yyyy')}</span>
    </button>
  );

  const title = active === 'pickup' ? 'Select your pick-up date' : 'Select your drop-off date';
  const summary = `${days}-day rental`;

  if (isDesktop) {
    const canGoBack = isAfter(viewMonth, startOfMonth(min));
    return createPortal(
      <div
        ref={popoverRef}
        role="dialog"
        aria-label={title}
        className="fixed z-[1000] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.35)]"
        style={{ top: position?.top ?? -9999, left: position?.left ?? 0, width: Math.min(DESKTOP_WIDTH, window.innerWidth - 32) }}
        onMouseLeave={() => setPreviewEnd(null)}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3">
          {fieldTab('pickup', 'Pick-up date', start)}
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          {fieldTab('dropoff', 'Drop-off date', end)}
        </div>
        <div className="relative px-5 pb-2 pt-4">
          <button
            type="button"
            onClick={() => setViewMonth(m => addMonths(m, -1))}
            disabled={!canGoBack}
            className="absolute left-4 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMonth(m => addMonths(m, 1))}
            className="absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="grid grid-cols-2 gap-8">
            {[0, 1].map(offset => (
              <div key={offset}>
                <MonthGrid
                  month={addMonths(viewMonth, offset)}
                  start={start} end={end} minDate={min} previewEnd={previewEnd} active={active}
                  onSelect={select} onHover={setPreviewEnd} showWeekdays
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm text-slate-600"><span className="font-semibold text-slate-900">{summary}</span> · {title}</p>
          <button type="button" onClick={onClose} className="h-10 rounded-lg bg-accent px-6 text-sm font-semibold text-white hover:bg-accent-700">Done</button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col bg-white" role="dialog" aria-modal="true" aria-label={title}>
      <div className="border-b border-slate-200 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="Close calendar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          {fieldTab('pickup', 'Pick-up', start)}
          {fieldTab('dropoff', 'Drop-off', end)}
        </div>
        <div className="mt-3 grid grid-cols-7 text-center text-xs font-semibold text-slate-500">
          {WEEKDAYS.map(d => <span key={d}>{d}</span>)}
        </div>
      </div>
      <div ref={sheetScrollRef} className="relative flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4">
        {Array.from({ length: MOBILE_MONTHS }, (_, i) => (
          <MonthGrid
            key={i}
            month={addMonths(startOfMonth(min), i)}
            start={start} end={end} minDate={min} previewEnd={null} active={active}
            onSelect={select} onHover={() => {}}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="min-w-0 text-sm">
          <p className="font-bold text-slate-900">{summary}</p>
          <p className="truncate text-slate-500">{format(start, 'd MMM')} – {format(end, 'd MMM yyyy')}</p>
        </div>
        <button type="button" onClick={onClose} className="h-12 shrink-0 rounded-xl bg-accent px-8 text-base font-semibold text-white hover:bg-accent-700">Done</button>
      </div>
    </div>,
    document.body
  );
};

export default DateRangePicker;
