'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import jwt from 'jsonwebtoken'

interface InvitacionPayload {
  email: string
  nombre: string
  comunidad_id: number
}

export default function AdminSignupPage() {
  const params = useParams()
  const token = params.token as string
  const router = useRouter()

  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [invitacionData, setInvitacionData] = useState<InvitacionPayload | null>(null)
  const [verificando, setVerificando] = useState(true)

  useEffect(() => {
    if (!token) {
      setError('Token no válido')
      setVerificando(false)
      return
    }

    try {
      const decoded = jwt.decode(token) as InvitacionPayload | null
      if (!decoded || !decoded.email) {
        setError('Token inválido o expirado')
        setVerificando(false)
        return
      }

      setInvitacionData(decoded)
      setNombre(decoded.nombre || '')
      setVerificando(false)
    } catch (err) {
      setError('Token inválido')
      setVerificando(false)
    }
  }, [token])

  async function handleRegistrar(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!nombre || !password) {
      setError('Todos los campos son obligatorios')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (!invitacionData) {
      setError('Datos de invitación no válidos')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        nombre,
        password
      })
    })

    if (res.ok) {
      const data = await res.json()
      localStorage.setItem('token', data.token)
      localStorage.setItem('admin', JSON.stringify({
        id: data.admin.id,
        nombre: data.admin.nombre,
        email: data.admin.email
      }))
      router.push('/admin')
    } else {
      const data = await res.json()
      setError(data.error || 'Error al registrar')
    }

    setLoading(false)
  }

  if (verificando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600">Verificando invitación...</p>
        </div>
      </div>
    )
  }

  if (error || !invitacionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error en la invitación</h1>
          <p className="text-red-600 mb-6">{error || 'La invitación no es válida o ha expirado'}</p>
          <Link
            href="/login"
            className="block text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-6 py-8">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Completar registro</h1>
        <p className="text-gray-600 text-sm mb-6">
          {invitacionData.email}
        </p>

        <form onSubmit={handleRegistrar} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              autoComplete="name"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu nombre"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Repite tu contraseña"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
