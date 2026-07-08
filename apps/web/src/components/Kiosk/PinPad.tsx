import { useState, useEffect } from 'react'
import { Delete, X } from 'lucide-react'

interface PinPadProps {
  onPinComplete: (pin: string) => void
  onCancel: () => void
  error?: string | null
  isLoading?: boolean
  title?: string
  subtitle?: string
}

export default function PinPad({ onPinComplete, onCancel, error, isLoading, title = "Ingresa tu PIN", subtitle = "4 dígitos para verificar tu identidad" }: PinPadProps) {
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (pin.length === 4) {
      onPinComplete(pin)
    }
  }, [pin, onPinComplete])

  useEffect(() => {
    if (error) {
      setPin('') // Reset pin on error
    }
  }, [error])

  const handleKeyPress = (num: string) => {
    if (pin.length < 4 && !isLoading) {
      setPin(prev => prev + num)
    }
  }

  const handleDelete = () => {
    if (pin.length > 0 && !isLoading) {
      setPin(prev => prev.slice(0, -1))
    }
  }

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9]

  return (
    <div className="flex flex-col items-center p-6 bg-[var(--surface-1)] rounded-2xl shadow-xl w-full max-w-sm mx-auto relative border border-[var(--border)]">
      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 p-2 text-[var(--text-3)] hover:text-[var(--text-1)] rounded-full hover:bg-[var(--surface-2)] transition-colors"
      >
        <X size={20} />
      </button>

      <h2 className="text-xl font-bold mb-2 text-[var(--text-1)]">{title}</h2>
      <p className="text-sm text-[var(--text-3)] mb-6 text-center">
        {subtitle}
      </p>

      {/* Dots display */}
      <div className="flex gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length 
                ? 'bg-[var(--accent)] scale-110' 
                : 'bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      {error && (
        <div className="text-[var(--danger)] text-sm mb-4 font-medium bg-[var(--danger)]/10 px-4 py-2 rounded-lg text-center w-full">
          {error}
        </div>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full">
        {digits.map(num => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            disabled={isLoading}
            className="h-16 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] active:scale-95 text-[var(--text-1)] text-2xl font-semibold transition-all flex items-center justify-center border border-[var(--border)]"
          >
            {num}
          </button>
        ))}
        
        {/* Empty spot */}
        <div></div>

        <button
          onClick={() => handleKeyPress('0')}
          disabled={isLoading}
          className="h-16 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] active:scale-95 text-[var(--text-1)] text-2xl font-semibold transition-all flex items-center justify-center border border-[var(--border)]"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="h-16 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] active:scale-95 text-[var(--text-2)] transition-all flex items-center justify-center border border-[var(--border)]"
        >
          <Delete size={24} />
        </button>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-[var(--surface-1)]/50 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
        </div>
      )}
    </div>
  )
}
