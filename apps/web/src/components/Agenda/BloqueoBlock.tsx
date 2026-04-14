import type { BloqueoAgenda } from '../../types/database'

interface Props {
  bloqueo: BloqueoAgenda
  top: number
  height: number
}

export default function BloqueoBlock({ bloqueo: _, top, height }: Props) {
  return (
    <div
      className="bloqueo-block"
      style={{
        top,
        height: Math.max(height, 16),
        background: 'repeating-linear-gradient(45deg, #fca5a5, #fca5a5 8px, #ffffff 8px, #ffffff 16px)',
        border: '2px solid #ef4444',
      }}
    >
      {/* Solo se ven las líneas de cancelación */}
    </div>
  )
}
