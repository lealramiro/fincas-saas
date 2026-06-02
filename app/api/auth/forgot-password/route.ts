import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secreto-temporal-cambiarse-en-produccion'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'El email es obligatorio' }, { status: 400 })
    }

    const admin = await prisma.administrador.findUnique({ where: { email } })
    const vecino = admin ? null : await prisma.vecino.findUnique({ where: { email } })
    const user = admin ?? vecino
    const tipo = admin ? 'admin' : vecino ? 'vecino' : null

    if (user && tipo) {
      const token = jwt.sign(
        { id: user.id, email: user.email, tipo },
        JWT_SECRET,
        { expiresIn: '1h' }
      )

      const resetUrl = `${APP_URL}/login/reset/${encodeURIComponent(token)}`
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Fincas SaaS <onboarding@resend.dev>',
        to: user.email,
        subject: 'Recupera tu contraseña',
        html: `<p>Hola ${user.nombre},</p>
               <p>Recibimos una solicitud para restablecer tu contraseña. Pulsa el enlace para continuar:</p>
               <p><a href="${resetUrl}" target="_blank" rel="noopener">Restablecer contraseña</a></p>
               <p>Si no solicitaste este cambio, ignora este mensaje.</p>`
      })
    }

    return NextResponse.json({ message: 'Si existe una cuenta con ese email, hemos enviado un enlace de recuperación.' })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
