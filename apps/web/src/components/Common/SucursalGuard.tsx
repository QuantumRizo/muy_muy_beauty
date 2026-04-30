import { useAuthContext } from '../../context/AuthContext'
import { useSucursalContext } from '../../context/SucursalContext'
import { useSucursales } from '../../hooks/useSucursales'
import { Lock } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

/**
 * SucursalGuard — Blocks access to branch-specific sections when the user
 * has a home sucursal assigned (profile.sucursal_id) and has selected a
 * different sucursal in the selector.
 *
 * Superadmins and users without an assigned sucursal bypass this guard entirely.
 */
export default function SucursalGuard({ children }: Props) {
  const { profile } = useAuthContext()
  const { selectedSucursalId } = useSucursalContext()
  const { data: sucursales = [] } = useSucursales()

  // No restriction if: still loading, no assigned sucursal, or is superadmin
  if (!profile || !profile.sucursal_id) return <>{children}</>
  if (profile.rol === 'superadmin') return <>{children}</>

  // If the selected sucursal matches the assigned one → allow
  if (!selectedSucursalId || selectedSucursalId === profile.sucursal_id) return <>{children}</>

  const homeBranch = sucursales.find(s => s.id === profile.sucursal_id)
  const selectedBranch = sucursales.find(s => s.id === selectedSucursalId)

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    }}>
      <div style={{
        maxWidth: 420,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'var(--danger-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--danger)',
        }}>
          <Lock size={28} />
        </div>

        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)', marginBottom: 8 }}>
            Sección no disponible
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
            Tu cuenta pertenece a la sucursal{' '}
            <strong style={{ color: 'var(--accent)' }}>{homeBranch?.nombre ?? 'asignada'}</strong>.
            {selectedBranch && (
              <>
                {' '}Esta sección no está disponible para la sucursal{' '}
                <strong>{selectedBranch.nombre}</strong>.
              </>
            )}
          </p>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Puedes cambiar de sucursal en el selector del menú lateral para regresar a tu sucursal.
        </p>
      </div>
    </div>
  )
}
