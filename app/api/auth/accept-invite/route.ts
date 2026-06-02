import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generarToken } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'secreto-temporal-cambiarse-en-produccion'

interface InvitacionPayload {
  email: string
  nombre: string
  comunidad_id: number
}

export async function POST(request: NextRequest) {
  try {
    const { token, nombre, password } = await request.json()

    if (!token || !nombre || !password) {
      return NextResponse.json(
        { error: 'Token, nombre y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    let payload: InvitacionPayload
    try {
      payload = jwt.verify(token, JWT_SECRET) as InvitacionPayload
    } catch {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      )
    }

    const invitacion = await prisma.adminInvitacion.findUnique({
      where: { token }
    })

    if (!invitacion) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    if (invitacion.usado) {
      return NextResponse.json(
        { error: 'Esta invitación ya ha sido usada' },
        { status: 400 }
      )
    }

    if (invitacion.expira_en < new Date()) {
      return NextResponse.json(
        { error: 'La invitación ha expirado' },
        { status: 400 }
      )
    }

    if (invitacion.email !== payload.email) {
      return NextResponse.json(
        { error: 'El email de la invitación no coincide' },
        { status: 400 }
      )
    }

    const adminExistente = await prisma.administrador.findUnique({
      where: { email: invitacion.email }
    })

    if (adminExistente) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const nuevoAdmin = await prisma.administrador.create({
      data: {
        nombre,
        email: invitacion.email,
        password_hash: passwordHash,
        comunidades: {
          connect: [{ id: invitacion.comunidad_id }]
        }
      }
    })

    await prisma.adminInvitacion.update({
      where: { id: invitacion.id },
      data: { usado: true }
    })

    const tokenSesion = generarToken({
      id: nuevoAdmin.id,
      email: nuevoAdmin.email,
      tipo: 'admin'
    })

    return NextResponse.json({
      token: tokenSesion,
      admin: {
        id: nuevoAdmin.id,
        nombre: nuevoAdmin.nombre,
        email: nuevoAdmin.email
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
