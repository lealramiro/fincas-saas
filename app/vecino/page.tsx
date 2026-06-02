'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function VecinoLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/vecino-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    localStorage.setItem('vecino-token', data.token)
    localStorage.setItem('vecino', JSON.stringify(data.vecino))
    router.push('/vecino/incidencias')
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Portal del vecino</h1>
        <p className="text-gray-500 text-sm mb-8">Accede para consultar y reportar incidencias</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="vecino-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="vecino-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu@email.com"
              required
            />
          </div>
          <div>
            <label htmlFor="vecino-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              id="vecino-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && <p role="alert" aria-live="assertive" className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <a
            href="/login/forgot"
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            ¿Has olvidado tu contraseña?
          </a>
        </div>
      </div>
    </main>
  )
}