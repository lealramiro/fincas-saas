'use client'

/* Hallmark · redesign: Dashboard Tactical · genre: modern-minimal
 * macrostructure: Workbench (stat-led asymmetric grid + sidebar ops)
 * states: default · hover · focus-visible · active · disabled · loading · error · success
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [admin, setAdmin] = useState<{ nombre: string; email: string } | null>(null)
  const [stats, setStats] = useState({ comunidades: 0, vecinos: 0, incidencias: 0 })
  const [invitEmail, setInvitEmail] = useState('')
  const [invitNombre, setInvitNombre] = useState('')
  const [invitLoading, setInvitLoading] = useState(false)
  const [invitError, setInvitError] = useState('')
  const [invitSuccess, setInvitSuccess] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showOpsMenu, setShowOpsMenu] = useState(false)
  const router = useRouter()

  function getToken() {
    return localStorage.getItem('token') || ''
  }

  useEffect(() => {
    const adminData = localStorage.getItem('admin')
    const token = localStorage.getItem('token')

    if (!adminData || !token) {
      router.push('/login')
      return
    }

    setAdmin(JSON.parse(adminData))

    async function cargarStats() {
      const [resComunidades, resVecinos, resIncidencias] = await Promise.all([
        fetch('/api/comunidades', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/vecinos', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/incidencias', { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const comunidades = resComunidades.ok ? await resComunidades.json() : []
      const vecinos = resVecinos.ok ? await resVecinos.json() : []
      const incidencias = resIncidencias.ok ? await resIncidencias.json() : []

      setStats({
        comunidades: comunidades.length,
        vecinos: vecinos.length,
        incidencias: incidencias.filter((i: {estado: string}) => i.estado === 'PENDIENTE' || i.estado === 'EN_PROCESO').length
      })
    }

    cargarStats()
  }, [router])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    router.push('/login')
  }

  async function handleInvitar(e: React.FormEvent) {
    e.preventDefault()
    setInvitError('')
    setInvitSuccess('')
    setInvitLoading(true)

    try {
      const res = await fetch('/api/auth/invite-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ email: invitEmail, nombre: invitNombre })
      })

      const data = await res.json()

      if (!res.ok) {
        setInvitError(data.error || 'Error al enviar invitación')
        return
      }

      setInvitSuccess(`Invitación enviada a ${invitEmail}. Expira en 7 días.`)
      setInvitEmail('')
      setInvitNombre('')
    } catch (error) {
      setInvitError('Error al enviar invitación')
    } finally {
      setInvitLoading(false)
    }
  }

  if (!admin) return null

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-0)' }}>
      {/* Header — minimal masthead */}
      <header className="border-b" style={{ borderColor: 'var(--border-1)', background: 'var(--surface-1)' }}>
        <div className="flex items-center justify-between px-6 py-5" style={{ minHeight: '56px' }}>
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Administración
            </h1>
            <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
              v1.0
            </span>
          </div>
          <div className="flex items-center gap-4" style={{ lineHeight: 1 }}>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {admin.nombre}
            </span>
            
            {/* Ops menu button */}
            <button
              onClick={() => setShowOpsMenu(!showOpsMenu)}
              className="relative px-3 py-2 rounded-lg transition-all duration-200 active:scale-95"
              style={{
                background: showOpsMenu ? 'var(--accent-6)' : 'var(--border-1)',
                color: showOpsMenu ? '#fff' : 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (!showOpsMenu) e.currentTarget.style.background = 'var(--border-1)'
              }}
              onMouseLeave={(e) => {
                if (!showOpsMenu) e.currentTarget.style.background = 'var(--border-1)'
              }}
              title={showOpsMenu ? 'Cerrar menú' : 'Operaciones'}
            >
              <span className="text-sm font-medium">⚙ Ops</span>
            </button>
            
            <button
              onClick={handleLogout}
              className="text-sm font-medium transition-colors duration-200 active:scale-95"
              style={{
                color: 'var(--accent-8)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-9)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--accent-8)')}
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Main — full width */}
      <main className="overflow-y-auto px-8 py-8" style={{ minHeight: 'calc(100vh - 56px)' }}>
        <div className="space-y-2 mb-10">
          <h2 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Bienvenido
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Estado actual del sistema
          </p>
        </div>

        {/* Stat cards — asymmetric grid */}
        <div className="grid gap-6 mb-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {/* Comunidades */}
          <Link
            href="/admin/comunidades"
            className="group relative rounded-lg border p-6 transition-all duration-200 cursor-pointer active:scale-95"
            style={{
              background: 'var(--surface-1)',
              borderColor: 'var(--border-1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-5)'
              e.currentTarget.style.background = 'var(--surface-2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-1)'
              e.currentTarget.style.background = 'var(--surface-1)'
            }}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                  Comunidades
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-5xl font-bold" style={{ color: 'var(--accent-6)' }}>
                  {stats.comunidades}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
                  activas en sistema
                </p>
              </div>
            </div>
            <div
              className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at top-right, rgba(var(--accent-rgb), 0.03), transparent)',
              }}
              aria-hidden="true"
            />
          </Link>

          {/* Vecinos */}
          <Link
            href="/admin/vecinos"
            className="group relative rounded-lg border p-6 transition-all duration-200 cursor-pointer active:scale-95"
            style={{
              background: 'var(--surface-1)',
              borderColor: 'var(--border-1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-5)'
              e.currentTarget.style.background = 'var(--surface-2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-1)'
              e.currentTarget.style.background = 'var(--surface-1)'
            }}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                  Vecinos
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-5xl font-bold" style={{ color: 'var(--accent-6)' }}>
                  {stats.vecinos}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
                  registrados
                </p>
              </div>
            </div>
            <div
              className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at top-right, rgba(var(--accent-rgb), 0.03), transparent)',
              }}
              aria-hidden="true"
            />
          </Link>

          {/* Incidencias abiertas */}
          <Link
            href="/admin/incidencias"
            className="group relative rounded-lg border p-6 transition-all duration-200 cursor-pointer active:scale-95"
            style={{
              background: 'var(--surface-1)',
              borderColor: 'var(--border-1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-5)'
              e.currentTarget.style.background = 'var(--surface-2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-1)'
              e.currentTarget.style.background = 'var(--surface-1)'
            }}
          >
            <div className="space-y-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                  Abiertas
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-display text-5xl font-bold" style={{ color: stats.incidencias > 0 ? 'var(--alert-5)' : 'var(--accent-6)' }}>
                  {stats.incidencias}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
                  incidencias pendientes
                </p>
              </div>
            </div>
            <div
              className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at top-right, rgba(var(--accent-rgb), 0.03), transparent)',
              }}
              aria-hidden="true"
            />
          </Link>
        </div>
      </main>

      {/* Backdrop — click to close */}
      {showOpsMenu && (
        <div
          className="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm"
          onClick={() => setShowOpsMenu(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown menu — Operaciones (fixed, top-right) */}
      {showOpsMenu && (
        <div
          className="fixed top-16 right-6 z-40 rounded-lg border shadow-lg flex flex-col overflow-hidden"
          style={{
            width: '320px',
            background: 'var(--surface-1)',
            borderColor: 'var(--border-1)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Menu header */}
          <div className="px-6 py-4 border-b space-y-1" style={{ borderColor: 'var(--border-1)' }}>
            <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Operaciones
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Gestión de accesos
            </p>
          </div>

          {/* Menu content */}
          <div className="flex-1 flex flex-col p-4 space-y-4">
            {/* Invite button — toggle form */}
            <button
              onClick={() => setShowInviteForm((p) => !p)}
              className="w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95"
              style={{
                background: 'var(--accent-6)',
                color: '#fff',
                border: '1px solid transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-7)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-6)'
              }}
            >
              {showInviteForm ? '✕ Cancelar' : '+ Invitar admin'}
            </button>

            {/* Invite form — conditional */}
            {showInviteForm && (
              <form onSubmit={handleInvitar} className="space-y-3 pb-3 border-t pt-4" style={{ borderColor: 'var(--border-1)' }}>
                <div>
                  <label htmlFor="invit-nombre" className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    Nombre
                  </label>
                  <input
                    id="invit-nombre"
                    type="text"
                    value={invitNombre}
                    onChange={(e) => setInvitNombre(e.target.value)}
                    placeholder="Juan Pérez"
                    required
                    className="w-full px-3 py-2 rounded-lg text-sm transition-all duration-200"
                    style={{
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border-1)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-5)'
                      e.currentTarget.style.outline = 'none'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-1)'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="invit-email" className="block text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    Email
                  </label>
                  <input
                    id="invit-email"
                    type="email"
                    value={invitEmail}
                    onChange={(e) => setInvitEmail(e.target.value)}
                    placeholder="admin@fincas.local"
                    required
                    className="w-full px-3 py-2 rounded-lg text-sm transition-all duration-200"
                    style={{
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border-1)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-5)'
                      e.currentTarget.style.outline = 'none'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-1)'
                    }}
                  />
                </div>

                {invitError && (
                  <div className="text-xs p-2 rounded-lg" style={{ background: 'var(--alert-0)', color: 'var(--alert-7)' }} role="alert">
                    {invitError}
                  </div>
                )}

                {invitSuccess && (
                  <div className="text-xs p-2 rounded-lg" style={{ background: 'var(--success-0)', color: 'var(--success-7)' }} role="alert">
                    {invitSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={invitLoading}
                  className="w-full px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
                  style={{
                    background: invitLoading ? 'var(--text-quaternary)' : 'var(--accent-6)',
                    color: '#fff',
                    cursor: invitLoading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!invitLoading) {
                      e.currentTarget.style.background = 'var(--accent-7)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!invitLoading) {
                      e.currentTarget.style.background = 'var(--accent-6)'
                    }
                  }}
                >
                  {invitLoading ? '⏳ Enviando…' : '✓ Enviar'}
                </button>
              </form>
            )}
          </div>

          {/* Menu footer */}
          <div className="px-4 py-3 border-t text-xs" style={{ borderColor: 'var(--border-1)', color: 'var(--text-quaternary)' }}>
            <p>Invitaciones válidas 7 días.</p>
          </div>
        </div>
      )}
    </div>
  )
}