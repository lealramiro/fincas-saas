import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generarToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    const vecino = await prisma.vecino.findUnique({
      where: { email },
      include: { comunidad: { select: { nombre: true } } }
    })

    if (!vecino) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const passwordCorrecta = await bcrypt.compare(password, vecino.password_hash)

    if (!passwordCorrecta) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      )
    }

    const token = generarToken({
      id: vecino.id,
      email: vecino.email,
      tipo: 'vecino'
    })

    return NextResponse.json({
      token,
      vecino: {
        id: vecino.id,
        nombre: vecino.nombre,
        email: vecino.email,
        piso_puerta: vecino.piso_puerta,
        comunidad: vecino.comunidad.nombre
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