import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secreto-temporal-cambiarse-en-produccion'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token y contraseña son obligatorios' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET) as { id: number; email: string; tipo: string }
    } catch {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 })
    }

    if (payload.tipo !== 'admin' && payload.tipo !== 'vecino') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    if (payload.tipo === 'admin') {
      const admin = await prisma.administrador.findUnique({ where: { id: payload.id } })
      if (!admin) {
        return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
      }

      await prisma.administrador.update({
        where: { id: admin.id },
        data: { password_hash: hashedPassword }
      })
    } else {
      const vecino = await prisma.vecino.findUnique({ where: { id: payload.id } })
      if (!vecino) {
        return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
      }

      await prisma.vecino.update({
        where: { id: vecino.id },
        data: { password_hash: hashedPassword }
      })
    }

    return NextResponse.json({ message: 'Contraseña restablecida correctamente. Ya puedes iniciar sesión.' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
