import { NextRequest, NextResponse } from 'next/server'
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

  const comunidades = await prisma.comunidad.findMany({
    where: { administrador_id: admin.id },
    include: { _count: { select: { vecinos: true, incidencias: true } } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(comunidades)
}

export async function POST(request: NextRequest) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { nombre, direccion } = await request.json()

  if (!nombre || !direccion) {
    return NextResponse.json({ error: 'Nombre y dirección son obligatorios' }, { status: 400 })
  }

  const comunidad = await prisma.comunidad.create({
    data: { nombre, direccion, administrador_id: admin.id }
  })

  return NextResponse.json(comunidad, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await request.json()

  await prisma.comunidad.delete({
    where: { id, administrador_id: admin.id }
  })

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const admin = getAdminFromRequest(request)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, nombre, direccion } = await request.json()

  if (!id || !nombre || !direccion) {
    return NextResponse.json({ error: 'Nombre y dirección son obligatorios' }, { status: 400 })
  }

  const comunidad = await prisma.comunidad.update({
    where: { id, administrador_id: admin.id },
    data: { nombre, direccion }
  })

  return NextResponse.json(comunidad)
}