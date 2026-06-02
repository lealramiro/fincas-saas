'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface HistorialCambio {
  id: number
  campo: string
  antiguo: string | null
  nuevo: string | null
  autor: string
  autor_tipo: 'ADMIN' | 'VECINO' | 'SYSTEM'
  creado_en: string
}

interface Incidencia {
  id: number
  titulo: string
  descripcion: string
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO'
  fecha_creacion: string
  imagen_url: string | null
  historial?: HistorialCambio[]
}

interface Vecino {
  nombre: string
  piso_puerta: string
  comunidad: string
}

const ESTADO_CONFIG = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  EN_PROCESO: { label: 'En proceso', color: 'bg-blue-100 text-blue-800' },
  RESUELTO: { label: 'Resuelto', color: 'bg-green-100 text-green-800' },
}

export default function VecinoIncidenciasPage() {
  const [vecino, setVecino] = useState<Vecino | null>(null)
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [previsualizacion, setPrevisualizacion] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [editImagen, setEditImagen] = useState<File | null>(null)
  const [editPrevisualizacion, setEditPrevisualizacion] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [error, setError] = useState('')
  const [editError, setEditError] = useState('')
  const router = useRouter()

  function getToken() {
    return localStorage.getItem('vecino-token') || ''
  }

  async function cargarIncidencias() {
    const res = await fetch('/api/incidencias', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    if (res.status === 401) { router.push('/vecino'); return }
    setIncidencias(await res.json())
  }

  useEffect(() => {
    const vecinoData = localStorage.getItem('vecino')
    const token = localStorage.getItem('vecino-token')

    if (!vecinoData || !token) {
      router.push('/vecino')
      return
    }

    setVecino(JSON.parse(vecinoData))
    cargarIncidencias()
  }, [])

  function handleImagenSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImagen(file)
    setPrevisualizacion(URL.createObjectURL(file))
  }

  function handleEditarImagenSeleccionada(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditImagen(file)
    setEditPrevisualizacion(URL.createObjectURL(file))
  }

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let imagen_url = null

    if (imagen) {
      const nombreArchivo = `${Date.now()}-${imagen.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('incidencias')
        .upload(nombreArchivo, imagen)

      if (!uploadError && data) {
        const { data: urlData } = supabase.storage
          .from('incidencias')
          .getPublicUrl(data.path)
        imagen_url = urlData.publicUrl
      }
    }

    const res = await fetch('/api/incidencias', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ titulo, descripcion, imagen_url })
    })

    if (res.ok) {
      setTitulo('')
      setDescripcion('')
      setImagen(null)
      setPrevisualizacion(null)
      setMostrarForm(false)
      cargarIncidencias()
    } else {
      const data = await res.json()
      setError(data.error || 'Error creando la incidencia')
    }

    setLoading(false)
  }

  function handleIniciarEdicion(incidencia: Incidencia) {
    setMostrarForm(false)
    setEditandoId(incidencia.id)
    setEditTitulo(incidencia.titulo)
    setEditDescripcion(incidencia.descripcion)
    setEditImagen(null)
    setEditPrevisualizacion(incidencia.imagen_url)
    setEditError('')
  }

  function handleCancelarEdicion() {
    setEditandoId(null)
    setEditTitulo('')
    setEditDescripcion('')
    setEditImagen(null)
    setEditPrevisualizacion(null)
    setEditError('')
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoId) return
    setEditLoading(true)
    setEditError('')

    const incidenciaActual = incidencias.find(i => i.id === editandoId)
    if (!incidenciaActual) {
      setEditError('Incidencia no encontrada')
      setEditLoading(false)
      return
    }

    let imagen_url: string | undefined

    if (editImagen) {
      const nombreArchivo = `${Date.now()}-${editImagen.name}`
      const { data, error: uploadError } = await supabase.storage
        .from('incidencias')
        .upload(nombreArchivo, editImagen)

      if (!uploadError && data) {
        const { data: urlData } = supabase.storage
          .from('incidencias')
          .getPublicUrl(data.path)
        imagen_url = urlData.publicUrl
      }
    }

    const body: Record<string, unknown> = { id: editandoId, descripcion: editDescripcion }
    if (incidenciaActual.estado === 'PENDIENTE') {
      body.titulo = editTitulo
    }
    if (imagen_url !== undefined) {
      body.imagen_url = imagen_url
    }

    const res = await fetch('/api/incidencias', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(body)
    })

    if (res.ok) {
      handleCancelarEdicion()
      cargarIncidencias()
    } else {
      const data = await res.json()
      setEditError(data.error || 'Error actualizando la incidencia')
    }

    setEditLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('vecino-token')
    localStorage.removeItem('vecino')
    router.push('/vecino')
  }

  if (!vecino) return null

  const incidenciaEnEdicion = editandoId ? incidencias.find(i => i.id === editandoId) : null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Portal del vecino</h1>
          <p className="text-xs text-gray-400">{vecino.piso_puerta} · {vecino.comunidad}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{vecino.nombre}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-900">Mis incidencias</h2>
          {!editandoId && (
            <button
              onClick={() => { setMostrarForm(!mostrarForm); handleCancelarEdicion() }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              + Nueva incidencia
            </button>
          )}
        </div>

        {mostrarForm && !editandoId && (
          <form onSubmit={handleCrear} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
            <h3 className="font-medium text-gray-900">Nueva incidencia</h3>
            <div>
              <label htmlFor="incidencia-titulo" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                id="incidencia-titulo"
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Gotera en el techo del portal"
                required
              />
            </div>
            <div>
              <label htmlFor="incidencia-descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                id="incidencia-descripcion"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe el problema con el mayor detalle posible..."
                required
              />
            </div>
            <div>
              <label htmlFor="incidencia-imagen" className="block text-sm font-medium text-gray-700 mb-2">Foto (opcional)</label>
              <label htmlFor="incidencia-imagen" className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors">
                <span className="text-gray-400 text-sm">
                  {imagen ? imagen.name : 'Haz clic para adjuntar una foto'}
                </span>
                <input
                  id="incidencia-imagen"
                  type="file"
                  accept="image/*"
                  onChange={handleImagenSeleccionada}
                  className="hidden"
                />
              </label>
              {previsualizacion && (
                <img
                  src={previsualizacion}
                  alt="Vista previa"
                  className="mt-3 rounded-lg max-h-48 object-contain w-full bg-gray-100"
                />
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar incidencia'}
              </button>
              <button
                type="button"
                onClick={() => { setMostrarForm(false); setError('') }}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {editandoId && incidenciaEnEdicion && (
          <form onSubmit={handleEditar} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
            <h3 className="font-medium text-gray-900">Editar incidencia</h3>
            <div>
              <label htmlFor="edit-incidencia-titulo" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                id="edit-incidencia-titulo"
                type="text"
                value={editTitulo}
                onChange={e => setEditTitulo(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Título"
                required
                disabled={incidenciaEnEdicion.estado === 'EN_PROCESO'}
              />
              {incidenciaEnEdicion.estado === 'EN_PROCESO' && (
                <p className="text-xs text-gray-500 mt-1">El título no se puede cambiar cuando la incidencia está en proceso.</p>
              )}
            </div>
            <div>
              <label htmlFor="edit-incidencia-descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                id="edit-incidencia-descripcion"
                value={editDescripcion}
                onChange={e => setEditDescripcion(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Actualiza la descripción si ha cambiado algo..."
                required
              />
            </div>
            <div>
              <label htmlFor="edit-incidencia-imagen" className="block text-sm font-medium text-gray-700 mb-2">Foto (opcional)</label>
              <label htmlFor="edit-incidencia-imagen" className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors">
                <span className="text-gray-400 text-sm">
                  {editImagen ? editImagen.name : editPrevisualizacion ? 'Mantener imagen actual o sustituirla' : 'Haz clic para adjuntar una foto'}
                </span>
                <input
                  id="edit-incidencia-imagen"
                  type="file"
                  accept="image/*"
                  onChange={handleEditarImagenSeleccionada}
                  className="hidden"
                />
              </label>
              {editPrevisualizacion && (
                <img
                  src={editPrevisualizacion}
                  alt="Vista previa"
                  className="mt-3 rounded-lg max-h-48 object-contain w-full bg-gray-100"
                />
              )}
            </div>
            {editError && <p className="text-sm text-red-500">{editError}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={editLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {editLoading ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={handleCancelarEdicion}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {incidencias.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No tienes incidencias reportadas.</p>
            <p className="text-gray-400 text-sm mt-1">Pulsa el botón para crear la primera.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidencias.map(i => (
              <div key={i.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{i.titulo}</p>
                    <p className="text-xs text-gray-400 mt-1">{ESTADO_CONFIG[i.estado].label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {i.estado !== 'RESUELTO' && (
                      <button
                        onClick={() => handleIniciarEdicion(i)}
                        className="text-sm text-blue-500 hover:text-blue-700"
                      >
                        Editar
                      </button>
                    )}
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${ESTADO_CONFIG[i.estado].color}`}>
                      {ESTADO_CONFIG[i.estado].label}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">{i.descripcion}</p>
                {i.imagen_url && (
                  <img
                    src={i.imagen_url}
                    alt="Imagen de la incidencia"
                    className="rounded-lg max-h-48 object-contain w-full bg-gray-100 mb-3"
                  />
                )}
                <p className="text-xs text-gray-400">
                  {new Date(i.fecha_creacion).toLocaleDateString('es-ES', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
                {i.historial && i.historial.length > 0 && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-900">Historial de cambios</h4>
                    <ul className="mt-2 space-y-2 text-xs text-gray-500">
                      {i.historial.map(evento => (
                        <li key={evento.id} className="leading-5">
                          <span className="font-semibold text-gray-700">{evento.campo}</span>: {evento.antiguo ?? '—'} → {evento.nuevo ?? '—'}
                          <span className="text-gray-400"> · {evento.autor} · {new Date(evento.creado_en).toLocaleString('es-ES')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
