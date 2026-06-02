'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Vecino {
  id: number
  nombre: string
  email: string
  piso_puerta: string
  comunidad: { nombre: string }
  comunidad_id: number
}

interface Comunidad {
  id: number
  nombre: string
}

export default function VecinosPage() {
  const [vecinos, setVecinos] = useState<Vecino[]>([])
  const [comunidades, setComunidades] = useState<Comunidad[]>([])
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [piso_puerta, setPisoPuerta] = useState('')
  const [comunidad_id, setComunidadId] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Vecino | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function getToken() {
    return localStorage.getItem('token') || ''
  }

  async function cargarDatos() {
    const [resVecinos, resComunidades] = await Promise.all([
      fetch('/api/vecinos', { headers: { Authorization: `Bearer ${getToken()}` } }),
      fetch('/api/comunidades', { headers: { Authorization: `Bearer ${getToken()}` } })
    ])
    if (resVecinos.status === 401) { router.push('/login'); return }
    setVecinos(await resVecinos.json())
    setComunidades(await resComunidades.json())
  }

  useEffect(() => { cargarDatos() }, [])

  function handleIniciarEdicion(v: Vecino) {
    setEditando(v)
    setNombre(v.nombre)
    setEmail(v.email)
    setPisoPuerta(v.piso_puerta)
    setComunidadId(v.comunidad_id.toString())
    setMostrarForm(false)
  }

  function handleCancelar() {
    setEditando(null)
    setNombre('')
    setEmail('')
    setPassword('')
    setPisoPuerta('')
    setComunidadId('')
    setMostrarForm(false)
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/vecinos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        nombre, email, password, piso_puerta,
        comunidad_id: parseInt(comunidad_id)
      })
    })

    if (res.ok) {
      handleCancelar()
      cargarDatos()
    }
    setLoading(false)
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    setLoading(true)

    const res = await fetch('/api/vecinos', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        id: editando.id,
        nombre, email, piso_puerta,
        comunidad_id: parseInt(comunidad_id)
      })
    })

    if (res.ok) {
      handleCancelar()
      cargarDatos()
    }
    setLoading(false)
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar este vecino?')) return

    const res = await fetch('/api/vecinos', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ id })
    })

    if (!res.ok) {
      const data = await res.json()
      alert(data.error)
      return
    }

    cargarDatos()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-900">Panel del Administrador</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver al panel
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <section aria-labelledby="vecinos-heading">
          <div className="flex justify-between items-center mb-6">
            <h2 id="vecinos-heading" className="text-xl font-medium text-gray-900">Vecinos</h2>
            <button
              onClick={() => { handleCancelar(); setMostrarForm(true) }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Nuevo vecino
            </button>
          </div>

          {(mostrarForm || editando) && (
            <section aria-labelledby="vecinos-form-heading">
              <form
                onSubmit={editando ? handleEditar : handleCrear}
                className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4"
              >
                <h3 id="vecinos-form-heading" className="font-medium text-gray-900">
                  {editando ? `Editando a ${editando.nombre}` : 'Nuevo vecino'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vecino-nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      id="vecino-nombre"
                      type="text"
                      autoComplete="name"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Carlos García"
                      required
                    />
                  </div>
              <div>
                <label htmlFor="vecino-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="vecino-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="carlos@email.com"
                  required
                />
              </div>
              {!editando && (
                <div>
                  <label htmlFor="vecino-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña inicial</label>
                  <input
                    id="vecino-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="La que le darás al vecino"
                    required
                  />
                </div>
              )}
              <div>
                <label htmlFor="vecino-piso-puerta" className="block text-sm font-medium text-gray-700 mb-1">Piso y puerta</label>
                <input
                  id="vecino-piso-puerta"
                  type="text"
                  autoComplete="address-line2"
                  value={piso_puerta}
                  onChange={e => setPisoPuerta(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 3ºB"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="vecino-comunidad" className="block text-sm font-medium text-gray-700 mb-1">Comunidad</label>
              <select
                id="vecino-comunidad"
                value={comunidad_id}
                onChange={e => setComunidadId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecciona una comunidad</option>
                {comunidades.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={handleCancelar}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
          </section>
        )}

        {vecinos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No hay vecinos todavía. Crea el primero.</p>
          </div>
        ) : (
          <section aria-labelledby="vecinos-list-heading" role="list" className="space-y-3">
            <h3 id="vecinos-list-heading" className="sr-only">Lista de vecinos</h3>
            {vecinos.map(v => (
              <article key={v.id} role="listitem" className="bg-white rounded-xl border border-gray-200 p-5 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{v.nombre}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{v.email} · {v.piso_puerta}</p>
                  <p className="text-xs text-gray-400 mt-1">{v.comunidad.nombre}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleIniciarEdicion(v)}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(v.id)}
                    className="text-sm text-red-400 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
      </main>
    </div>
  )
}