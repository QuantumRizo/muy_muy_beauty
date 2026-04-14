import { useState, useRef, useEffect } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface Props {
  value: string      // yyyy-MM-dd
  onChange: (date: string) => void
  label: string
  minDate?: string
}

export default function DatePicker({ value, onChange, label, minDate }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value + 'T00:00:00') : new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedDate = value ? new Date(value + 'T00:00:00') : null

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
  })

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentMonth(prev => addMonths(prev, 1))
  }

  const handleSelect = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'))
    setIsOpen(false)
  }

  const displayValue = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : ''

  return (
    <div className="outlined-group date-picker-container" ref={containerRef}>
      <label>{label}</label>
      <div 
        className="outlined-input date-picker-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span>{displayValue || 'Seleccionar fecha'}</span>
        <CalendarIcon size={16} style={{ opacity: 0.5 }} />
      </div>

      {isOpen && (
        <div className="date-picker-popover animate-in">
          <div className="dp-header">
            <button className="dp-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
            <span className="dp-month-label">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
            <button className="dp-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
          </div>
          
          <div className="dp-weekdays">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={i} className="dp-weekday">{d}</span>
            ))}
          </div>

          <div className="dp-grid">
            {days.map((day, i) => {
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isDisabled = !!(minDate && format(day, 'yyyy-MM-dd') < minDate)
              
              return (
                <button
                  key={i}
                  className={`dp-day ${isSelected ? 'selected' : ''} ${!isCurrentMonth ? 'other-month' : ''} ${isToday(day) ? 'today' : ''}`}
                  onClick={() => !isDisabled && handleSelect(day)}
                  disabled={isDisabled}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
