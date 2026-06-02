import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'

const JWT_SECRET = process.env.JWT_SECRET || 'secreto-temporal-cambiarse-en-produccion'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function getTokenFromRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verificarToken(token)
}

export async function POST(request: NextRequest) {
  try {
    const user = getTokenFromRequest(request)
    if (!user || user.tipo !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { email, nombre } = await request.json()

    if (!email || !nombre) {
      return NextResponse.json(
        { error: 'Email y nombre son obligatorios' },
        { status: 400 }
      )
    }

    const adminExistente = await prisma.administrador.findUnique({
      where: { email }
    })

    if (adminExistente) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    const invitacionExistente = await prisma.adminInvitacion.findFirst({
      where: {
        email,
        usado: false,
        expira_en: { gt: new Date() }
      }
    })

    if (invitacionExistente) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este email' },
        { status: 400 }
      )
    }


    const admin = await prisma.administrador.findUnique({
      where: { id: user.id },
      include: { comunidades: true }
    })

    if (!admin || admin.comunidades.length === 0) {
      return NextResponse.json(
        { error: 'Admin no tiene comunidades' },
        { status: 404 }
      )
    }

    const comunidad = admin.comunidades[0]

    const tokenInvitacion = jwt.sign(
      { email, nombre, comunidad_id: comunidad.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const expiracion = new Date()
    expiracion.setDate(expiracion.getDate() + 7)

    await prisma.adminInvitacion.create({
      data: {
        email,
        token: tokenInvitacion,
        comunidad_id: comunidad.id,
        admin_invitador_id: user.id,
        expira_en: expiracion
      }
    })

    const signupUrl = `${APP_URL}/admin/signup/${encodeURIComponent(tokenInvitacion)}`

    try {
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: 'Fincas SaaS <onboarding@resend.dev>',
        to: email,
        subject: 'Invitación para gestionar comunidad',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">¡Estás invitado!</h2>
            <p>Hola ${nombre},</p>
            <p><strong>${admin.nombre}</strong> te ha invitado a gestionar la comunidad <strong>${comunidad.nombre}</strong>.</p>
            <p>Pulsa el botón para crear tu cuenta y acceder al panel de administración:</p>
            <div style="margin: 24px 0;">
              <a href="${signupUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: 600;">Aceptar invitación</a>
            </div>
            <p>O copia este enlace en tu navegador:</p>
            <p style="background: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 12px;">${signupUrl}</p>
            <p style="color: #888; font-size: 13px; margin-top: 32px;">Esta invitación vence en 7 días. Si no la usas dentro de ese tiempo, solicitará una nueva.</p>
            <p style="color: #888; font-size: 13px;">Este es un mensaje automático, por favor no respondas a este email.</p>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Error enviando email:', emailError)
    }

    return NextResponse.json({
      message: 'Invitación enviada correctamente',
      invitacion: {
        email,
        comunidad: comunidad.nombre,
        expira_en: expiracion
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
