'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BootstrapPage() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificando, setVerificando] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si ya existe un admin
    async function verificar() {
      try {
        const res = await fetch('/api/auth/bootstrap', { method: 'HEAD' })
        if (res.status === 403) {
          // Si ya existe un admin, redirigimos a login
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Error verificando bootstrap:', error)
      } finally {
        setVerificando(false)
      }
    }
    verificar()
  }, [router])

  async function handleRegistrar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrar')
        return
      }

      // Guardar token y datos
      localStorage.setItem('token', data.token)
      localStorage.setItem('admin', JSON.stringify({
        id: data.admin.id,
        nombre: data.admin.nombre,
        email: data.admin.email
      }))

      router.push('/admin')
    } catch (error) {
      setError('Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  if (verificando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-lg">Verificando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bootstrap Admin</h1>
          <p className="text-gray-600 mb-6">Crea tu primer administrador</p>

          <form onSubmit={handleRegistrar} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Registrando...' : 'Registrar administrador'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
            <p className="font-semibold mb-2">💡 Tip: Usa alias de Gmail</p>
            <p>Para crear múltiples vecinos con el mismo email, usa alias:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><code className="text-xs">tu@gmail.com</code> - Admin</li>
              <li><code className="text-xs">tu+vecino1@gmail.com</code> - Vecino 1</li>
              <li><code className="text-xs">tu+vecino2@gmail.com</code> - Vecino 2</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
