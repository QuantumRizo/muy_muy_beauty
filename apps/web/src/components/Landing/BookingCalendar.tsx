import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, isSameDay, isToday, isBefore,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths, startOfDay
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ahoraMX } from '../../lib/dateUtils'

interface BookingCalendarProps {
  currentMonth: Date
  selectedDate: Date | null
  onSelectDate: (date: Date) => void
  onChangeMonth: (date: Date) => void
}

export function BookingCalendar({ currentMonth, selectedDate, onSelectDate, onChangeMonth }: BookingCalendarProps) {
  const mStart = startOfMonth(currentMonth)
  const mEnd   = endOfMonth(mStart)
  const days   = eachDayOfInterval({ start: startOfWeek(mStart), end: endOfWeek(mEnd) })

  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: 20, border: '1px solid #f2f2f2', marginBottom: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 16, fontWeight: 700, textTransform: 'capitalize' }}>
          {format(currentMonth, 'MMMM yyyy', { locale: es })}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onChangeMonth(subMonths(currentMonth, 1))}
            disabled={isBefore(startOfMonth(subMonths(currentMonth, 0)), startOfMonth(ahoraMX()))}
            style={{
              background: '#f5f5f7', border: 'none', width: 36, height: 36,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              opacity: isBefore(startOfMonth(subMonths(currentMonth, 0)), startOfMonth(ahoraMX())) ? 0.3 : 1
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => onChangeMonth(addMonths(currentMonth, 1))}
            style={{ background: '#f5f5f7', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#86868b', padding: '8px 0' }}>{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isOutside  = !isSameDay(startOfMonth(day), mStart)
          const isPast     = isBefore(startOfDay(day), startOfDay(ahoraMX()))

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => onSelectDate(day)}
              style={{
                aspectRatio: '1/1', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 12, border: 'none', cursor: isPast ? 'default' : 'pointer',
                background: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? '#fff' : (isOutside ? '#d2d2d7' : (isPast ? '#e5e5e5' : '#1d1d1f')),
                fontWeight: (isSelected || isToday(day)) ? 700 : 400,
                position: 'relative', transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 14 }}>{format(day, 'd')}</span>
              {isToday(day) && !isSelected && (
                <div style={{ position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: '50%', background: 'var(--primary)' }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
