import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/lib/auth'

function getAdminFromRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verificarToken(token)
}

export async function GET(request: NextRequest) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const vecinos = await prisma.vecino.findMany({
    where: { comunidad: { administrador_id: admin.id } },
    include: { comunidad: { select: { nombre: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(vecinos)
}

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, email, password, piso_puerta, comunidad_id } = await request.json()

  if (!nombre || !email || !password || !piso_puerta || !comunidad_id) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
  }

  const comunidad = await prisma.comunidad.findFirst({
    where: { id: comunidad_id, administrador_id: admin.id }
  })

  if (!comunidad) {
    return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 })
  }

  const password_hash = await bcrypt.hash(password, 10)

  const vecino = await prisma.vecino.create({
    data: { nombre, email, password_hash, piso_puerta, comunidad_id }
  })

  return NextResponse.json(vecino, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await request.json()

  const incidenciasAbiertas = await prisma.incidencia.count({
    where: {
      vecino_id: id,
      estado: { in: ['PENDIENTE', 'EN_PROCESO'] }
    }
  })

  if (incidenciasAbiertas > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar el vecino porque tiene ${incidenciasAbiertas} incidencia${incidenciasAbiertas > 1 ? 's' : ''} abierta${incidenciasAbiertas > 1 ? 's' : ''}. Resuélvelas primero.` },
      { status: 409 }
    )
  }

  await prisma.comentario.deleteMany({
    where: { incidencia: { vecino_id: id } }
  })

  await prisma.incidencia.deleteMany({
    where: { vecino_id: id }
  })

  await prisma.vecino.delete({
    where: { id }
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, nombre, email, piso_puerta, comunidad_id } = await request.json()

  if (!id || !nombre || !email || !piso_puerta || !comunidad_id) {
    return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 })
  }

  const vecino = await prisma.vecino.update({
    where: { id },
    data: { nombre, email, piso_puerta, comunidad_id }
  })

  return NextResponse.json(vecino)
}