'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Comunidad {
  id: number
  nombre: string
  direccion: string
  _count: { vecinos: number; incidencias: number }
}

export default function ComunidadesPage() {
  const [comunidades, setComunidades] = useState<Comunidad[]>([])
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState<Comunidad | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function getToken() {
    return localStorage.getItem('token') || ''
  }

  async function cargarComunidades() {
    const res = await fetch('/api/comunidades', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.status === 401) { router.push('/login'); return }
    const data = await res.json()
    setComunidades(data)
  }

  useEffect(() => { cargarComunidades() }, [])

  function handleIniciarEdicion(c: Comunidad) {
    setEditando(c)
    setNombre(c.nombre)
    setDireccion(c.direccion)
    setMostrarForm(false)
  }

  function handleCancelar() {
    setEditando(null)
    setNombre('')
    setDireccion('')
    setMostrarForm(false)
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/comunidades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ nombre, direccion })
    })

    if (res.ok) {
      handleCancelar()
      cargarComunidades()
    }
    setLoading(false)
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    setLoading(true)

    const res = await fetch('/api/comunidades', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ id: editando.id, nombre, direccion })
    })

    if (res.ok) {
      handleCancelar()
      cargarComunidades()
    }
    setLoading(false)
  }

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar esta comunidad?')) return

    const res = await fetch('/api/comunidades', {
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

    cargarComunidades()
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
        <section aria-labelledby="comunidades-heading">
          <div className="flex justify-between items-center mb-6">
            <h2 id="comunidades-heading" className="text-xl font-medium text-gray-900">Comunidades</h2>
            <button
              onClick={() => { handleCancelar(); setMostrarForm(true) }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Nueva comunidad
            </button>
          </div>

          {(mostrarForm || editando) && (
            <section aria-labelledby="comunidades-form-heading">
              <form
                onSubmit={editando ? handleEditar : handleCrear}
                className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4"
              >
                <h3 id="comunidades-form-heading" className="font-medium text-gray-900">
                  {editando ? `Editando: ${editando.nombre}` : 'Nueva comunidad'}
                </h3>
                <div>
                  <label htmlFor="comunidad-nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    id="comunidad-nombre"
                    type="text"
                    autoComplete="organization"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Comunidad Calle Mayor 12"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="comunidad-direccion" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input
                    id="comunidad-direccion"
                    type="text"
                    autoComplete="street-address"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Calle Mayor 12, Madrid"
                    required
                  />
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

          {comunidades.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No hay comunidades todavía. Crea la primera.</p>
          </div>
        ) : (
          <section aria-labelledby="comunidades-list-heading" role="list" className="space-y-3">
            <h3 id="comunidades-list-heading" className="sr-only">Lista de comunidades</h3>
            {comunidades.map(c => (
              <article key={c.id} role="listitem" className="bg-white rounded-xl border border-gray-200 p-5 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{c.nombre}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{c.direccion}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-gray-400">{c._count.vecinos} vecinos</span>
                    <span className="text-xs text-gray-400">{c._count.incidencias} incidencias</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleIniciarEdicion(c)}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(c.id)}
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