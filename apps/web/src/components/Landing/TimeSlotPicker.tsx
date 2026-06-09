import { Clock, RefreshCw } from 'lucide-react'

interface TimeSlotPickerProps {
  totalTime: number
  availableSlots: string[]
  selectedTime: string | null
  fetchingSlots: boolean
  onSelectTime: (time: string) => void
}

export function TimeSlotPicker({ totalTime, availableSlots, selectedTime, fetchingSlots, onSelectTime }: TimeSlotPickerProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, color: '#86868b' }}>
        <Clock size={16} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Horarios disponibles para {totalTime} min</span>
      </div>

      {fetchingSlots ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <RefreshCw size={24} className="animate-spin" color="#c7c7cc" />
        </div>
      ) : availableSlots.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {availableSlots.map(time => (
            <button
              key={time}
              onClick={() => onSelectTime(time)}
              style={{
                padding: '12px 0', borderRadius: 10,
                border: '1px solid #efefef',
                background: selectedTime === time ? 'var(--primary)' : '#fff',
                color: selectedTime === time ? '#fff' : '#1d1d1f',
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {time}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff', borderRadius: 20, border: '1px dashed #efefef' }}>
          <p style={{ color: '#86868b', fontSize: 15 }}>No hay espacios disponibles para esta combinación de servicios en la fecha seleccionada.</p>
        </div>
      )}
    </div>
  )
}
