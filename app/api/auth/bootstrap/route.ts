import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function HEAD() {
  const adminCount = await prisma.administrador.count()
  if (adminCount > 0) {
    return new NextResponse(null, { status: 403 })
  }

  return new NextResponse(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const { nombre, email, password } = await request.json()

    // Validar campos
    if (!nombre || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Verificar que no existe ningún admin
    const adminCount = await prisma.administrador.count()
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Ya existe un administrador. El bootstrap solo funciona una vez.' },
        { status: 403 }
      )
    }

    // Verificar que el email no esté en uso
    const adminExistente = await prisma.administrador.findUnique({
      where: { email }
    })

    if (adminExistente) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const salt = await bcryptjs.genSalt(10)
    const passwordHash = await bcryptjs.hash(password, salt)

    // Crear administrador
    const admin = await prisma.administrador.create({
      data: {
        nombre,
        email,
        password_hash: passwordHash
      }
    })

    // Generar token de sesión
    const token = jwt.sign(
      { id: admin.id, email: admin.email, tipo: 'admin' },
      process.env.JWT_SECRET || 'tu-secreto-super-seguro',
      { expiresIn: '7d' }
    )

    return NextResponse.json(
      {
        message: 'Admin registrado exitosamente',
        token,
        admin: {
          id: admin.id,
          nombre: admin.nombre,
          email: admin.email
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en bootstrap:', error)
    return NextResponse.json(
      { error: 'Error al registrar administrador' },
      { status: 500 }
    )
  }
}
