'use client'

import { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

interface Incidencia {
  id: number
  titulo: string
  descripcion: string
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO'
  fecha_creacion: string
  imagen_url: string | null
  vecino: { nombre: string; piso_puerta: string }
  comunidad: { nombre: string }
  historial?: {
    campo: string
    antiguo: string | null
    nuevo: string | null
    autor: string
    autor_tipo: string
    creado_en: string
  }[]
}

interface ComunidadSelector {
  id: number
  nombre: string
}

const COLUMNAS = [
  { id: 'PENDIENTE', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'EN_PROCESO', label: 'En proceso', color: 'bg-blue-100 text-blue-800' },
  { id: 'RESUELTO', label: 'Resuelto', color: 'bg-green-100 text-green-800' },
]

function TarjetaIncidencia({ incidencia }: { incidencia: Incidencia }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: incidencia.id,
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="listitem"
      aria-label={`Incidencia: ${incidencia.titulo}, vecino ${incidencia.vecino.nombre}`}
      className="bg-white rounded-lg border border-gray-200 p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
    >
      <p className="font-medium text-gray-900 text-sm mb-1">{incidencia.titulo}</p>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{incidencia.descripcion}</p>
      {incidencia.imagen_url && (
        <img
          src={incidencia.imagen_url}
          alt="Imagen de la incidencia"
          className="rounded-lg max-h-32 object-contain w-full bg-gray-50 mb-3"
        />
      )}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-medium text-gray-700">{incidencia.vecino.nombre}</p>
          <p className="text-xs text-gray-400">{incidencia.vecino.piso_puerta} · {incidencia.comunidad.nombre}</p>
        </div>
        <p className="text-xs text-gray-400">
          {new Date(incidencia.fecha_creacion).toLocaleDateString('es-ES')}
        </p>
      </div>
      {incidencia.historial?.length ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700 mb-2">Historial</p>
          <ul className="space-y-2">
            {incidencia.historial.slice(0, 2).map((evento, index) => (
              <li key={index} className="rounded-xl border border-slate-200 bg-white p-2">
                <p className="text-slate-700 font-medium">{evento.campo}</p>
                <p className="text-slate-500">{evento.antiguo ?? '—'} → {evento.nuevo ?? '—'}</p>
                <p className="text-[10px] text-slate-400">{evento.autor} · {new Date(evento.creado_en).toLocaleString('es-ES')}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  )
}

function Columna({ id, label, color, incidencias }: {
  id: string
  label: string
  color: string
  incidencias: Incidencia[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <section aria-labelledby={`column-${id}`} className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <h3 id={`column-${id}`} className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>{label}</h3>
        <span className="text-xs text-gray-400">{incidencias.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`min-h-96 rounded-xl p-3 space-y-3 transition-colors ${isOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'bg-gray-100'}`}
      >
        {incidencias.map(i => (
          <TarjetaIncidencia key={i.id} incidencia={i} />
        ))}
        {incidencias.length === 0 && (
          <div className="h-24 flex items-center justify-center">
            <p className="text-xs text-gray-400">Arrastra aquí</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [comunidades, setComunidades] = useState<ComunidadSelector[]>([])
  const [selectedComunidadId, setSelectedComunidadId] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [activa, setActiva] = useState<Incidencia | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function getToken() {
    return localStorage.getItem('token') || ''
  }

  async function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    cargarIncidencias()
  }

  function handleComunidadChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value
    setSelectedComunidadId(value)
    cargarIncidencias({ comunidadId: value, search: searchTerm })
  }

  async function cargarComunidades() {
    const res = await fetch('/api/comunidades', {
      headers: { Authorization: `Bearer ${getToken()}` }
    })

    if (res.status === 401) {
      router.push('/login')
      return
    }

    const data = await res.json()
    setComunidades(data)
  }

  async function cargarIncidencias(overrides?: { comunidadId?: string; search?: string }) {
    const comunidadId = overrides?.comunidadId ?? selectedComunidadId
    const search = overrides?.search ?? searchTerm

    const params = new URLSearchParams()
    if (comunidadId && comunidadId !== 'all') params.append('comunidadId', comunidadId)
    if (search.trim()) params.append('search', search.trim())

    setIsLoading(true)
    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(`/api/incidencias${query}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    })
    setIsLoading(false)

    if (res.status === 401) {
      router.push('/login')
      return
    }

    const data = await res.json()
    setIncidencias(data)
  }

  useEffect(() => {
    cargarComunidades()
    cargarIncidencias()
  }, [])

  function handleDragStart(event: DragStartEvent) {
    const inc = incidencias.find(i => i.id === event.active.id)
    setActiva(inc || null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiva(null)
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!over) return

    const nuevoEstado = over.id as 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO'
    const incidencia = incidencias.find(i => i.id === active.id)

    if (!incidencia || incidencia.estado === nuevoEstado) return

    const estadoAnterior = incidencia.estado

    setIncidencias(prev =>
      prev.map(i => i.id === active.id ? { ...i, estado: nuevoEstado } : i)
    )

    const res = await fetch('/api/incidencias', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({ id: active.id, estado: nuevoEstado })
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorMessage(data?.error || 'Error actualizando el estado de la incidencia.')
      setIncidencias(prev =>
        prev.map(i => i.id === active.id ? { ...i, estado: estadoAnterior } : i)
      )
      return
    }

    setSuccessMessage(`Incidencia movida a ${nuevoEstado} y notificación enviada.`)
  }

  const porEstado = (estado: string) => incidencias.filter(i => i.estado === estado)

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-900">Panel del Administrador</h1>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
          ← Volver al panel
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <section aria-labelledby="incidencias-heading">
          <div className="flex flex-col gap-4 justify-between items-start sm:items-center sm:flex-row mb-6">
            <div>
              <h2 id="incidencias-heading" className="text-xl font-medium text-gray-900">Tablero de incidencias</h2>
              <p className="text-sm text-gray-400">Arrastra las tarjetas para cambiar el estado</p>
            </div>
            <div className="text-sm text-slate-500">
              {selectedComunidadId === 'all'
                ? `Mostrando incidencias de todas las comunidades (${incidencias.length})`
                : `Mostrando incidencias de ${comunidades.find(c => c.id.toString() === selectedComunidadId)?.nombre ?? 'la comunidad'} (${incidencias.length})`}
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto_auto] mb-6 items-end">
            <div>
              <label htmlFor="comunidad" className="block text-sm font-medium text-gray-700 mb-1">Filtrar por comunidad</label>
              <select
                id="comunidad"
                value={selectedComunidadId}
                onChange={handleComunidadChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todas las comunidades</option>
                {comunidades.map(comunidad => (
                  <option key={comunidad.id} value={comunidad.id}>{comunidad.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Título, descripción o vecino"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              {isLoading ? 'Cargando...' : 'Buscar'}
            </button>
          </form>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-6 text-sm text-red-800">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 mb-6 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          {incidencias.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-400 text-sm">No hay incidencias todavía.</p>
            <p className="text-gray-400 text-sm mt-1">Los vecinos las crearán desde su portal.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div role="list" className="flex gap-4">
              {COLUMNAS.map(col => (
                <Columna
                  key={col.id}
                  id={col.id}
                  label={col.label}
                  color={col.color}
                  incidencias={porEstado(col.id)}
                />
              ))}
            </div>
            <DragOverlay>
              {activa && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xl rotate-2">
                  <p className="font-medium text-gray-900 text-sm">{activa.titulo}</p>
                  <p className="text-xs text-gray-500 mt-1">{activa.vecino.nombre}</p>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </section>
      </main>
    </div>
  )
}