import * as React from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isBefore, 
  parseISO,
  startOfDay
} from 'date-fns';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

interface CalendarPickerProps {
  selectedDate: string; // ISO format YYYY-MM-DD
  onDateSelect: (date: string) => void;
  minDate?: string; // ISO format YYYY-MM-DD
  onClose: () => void;
}

const CalendarPicker: React.FC<CalendarPickerProps> = ({ 
  selectedDate, 
  onDateSelect, 
  minDate,
  onClose 
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(
    selectedDate ? parseISO(selectedDate) : new Date()
  );
  
  const parsedSelectedDate = selectedDate ? parseISO(selectedDate) : null;
  const parsedMinDate = minDate ? startOfDay(parseISO(minDate)) : startOfDay(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-slate-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2 border-b border-slate-50">
        {days.map((day) => (
          <div key={day} className="text-center text-[11px] font-bold text-slate-400 py-2 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const isDisabled = isBefore(startOfDay(cloneDay), parsedMinDate);
        const isSelected = parsedSelectedDate && isSameDay(day, parsedSelectedDate);
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <button
            key={day.toString()}
            type="button"
            disabled={isDisabled}
            onClick={() => {
              onDateSelect(format(cloneDay, 'yyyy-MM-dd'));
              onClose();
            }}
            className={`
              relative h-10 w-full flex items-center justify-center text-sm transition-all rounded-lg
              ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
              ${isSelected ? 'bg-[#007ac2] text-white font-bold shadow-md z-10' : 'hover:bg-blue-50'}
              ${isDisabled ? 'opacity-20 cursor-not-allowed hover:bg-transparent text-slate-400' : 'cursor-pointer'}
              ${isSameDay(day, new Date()) && !isSelected ? 'text-[#007ac2] font-bold' : ''}
            `}
          >
            <span>{formattedDate}</span>
            {isSameDay(day, new Date()) && !isSelected && (
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#007ac2] rounded-full"></span>
            )}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="p-2">{rows}</div>;
  };

  return (
    <div className={`
      w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50
      ${window.innerWidth < 640 ? 'fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto w-auto max-w-[340px]' : ''}
    `}>
      {renderHeader()}
      <div className="px-2 pt-2">
        {renderDays()}
        {renderCells()}
      </div>
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button 
            type="button"
            onClick={() => {
                onDateSelect(format(new Date(), 'yyyy-MM-dd'));
                onClose();
            }}
            className="text-[12px] font-bold text-[#007ac2] hover:underline"
          >
              Today
          </button>
          <button 
            type="button"
            onClick={onClose}
            className="text-[12px] font-bold text-slate-500 hover:text-slate-700"
          >
              Close
          </button>
      </div>
    </div>
  );
};

export default CalendarPicker;