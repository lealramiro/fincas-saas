import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verificarToken } from '@/lib/auth'

function getTokenFromRequest(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  return verificarToken(token)
}

export async function GET(request: NextRequest) {
  const user = getTokenFromRequest(request)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const url = new URL(request.url)
  const comunidadIdParam = url.searchParams.get('comunidadId')
  const search = url.searchParams.get('search')?.trim()
  const comunidadId = comunidadIdParam ? Number(comunidadIdParam) : undefined

  if (user.tipo === 'admin') {
    const where: any = { comunidad: { administrador_id: user.id } }

    if (comunidadIdParam && !Number.isNaN(comunidadId)) {
      where.comunidad_id = comunidadId
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { vecino: { nombre: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const incidencias = await prisma.incidencia.findMany({
      where,
      include: {
        vecino: { select: { nombre: true, piso_puerta: true } },
        comunidad: { select: { nombre: true } },
        historial: { orderBy: { creado_en: 'desc' } }
      },
      orderBy: { fecha_creacion: 'desc' }
    })
    return NextResponse.json(incidencias)
  }

  if (user.tipo === 'vecino') {
    const incidencias = await prisma.incidencia.findMany({
      where: { vecino_id: user.id },
      include: {
        historial: { orderBy: { creado_en: 'desc' } }
      },
      orderBy: { fecha_creacion: 'desc' }
    })
    return NextResponse.json(incidencias)
  }

  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request)
  if (!user || user.tipo !== 'vecino') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { titulo, descripcion, imagen_url } = await request.json()

  if (!titulo || !descripcion) {
    return NextResponse.json({ error: 'Título y descripción son obligatorios' }, { status: 400 })
  }

  const vecino = await prisma.vecino.findUnique({
    where: { id: user.id }
  })

  if (!vecino) {
    return NextResponse.json({ error: 'Vecino no encontrado' }, { status: 404 })
  }

  const comunidad = await prisma.comunidad.findUnique({
    where: { id: vecino.comunidad_id },
    include: { administrador: true }
  })

  const incidencia = await prisma.incidencia.create({
    data: {
      titulo,
      descripcion,
      imagen_url: imagen_url || null,
      vecino_id: user.id,
      comunidad_id: vecino.comunidad_id
    }
  })

  let emailError: string | null = null
  if (comunidad?.administrador?.email) {
    try {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        emailError = 'RESEND_API_KEY no está definido. No se puede enviar el email al administrador.'
        console.error(emailError)
      } else {
        const { Resend } = await import('resend')
        const resend = new Resend(apiKey)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        console.log(`Intentando enviar email al admin ${comunidad.administrador.email} por nueva incidencia ${incidencia.id}`)

        const result = await resend.emails.send({
          from: 'Fincas SaaS <onboarding@resend.dev>',
          to: comunidad.administrador.email,
          subject: `Nueva incidencia registrada en ${comunidad.nombre}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Nueva incidencia registrada</h2>
              <p>Hola <strong>${comunidad.administrador.nombre}</strong>,</p>
              <p>Se ha creado una nueva incidencia en la comunidad <strong>${comunidad.nombre}</strong>:</p>
              <ul>
                <li><strong>Vecino:</strong> ${vecino.nombre} (${vecino.email})</li>
                <li><strong>Título:</strong> ${incidencia.titulo}</li>
                <li><strong>Descripción:</strong> ${incidencia.descripcion}</li>
              </ul>
              <p>Consulta la incidencia en el panel de administración:</p>
              <p><a href="${appUrl}/admin/incidencias">Ver incidencia</a></p>
              <p style="color: #888; font-size: 13px; margin-top: 32px;">Este es un mensaje automático, por favor no respondas a este email.</p>
            </div>
          `
        })

        if (result?.error) {
          emailError = JSON.stringify(result.error)
          console.error('Error en el resultado de Resend al notificar admin:', result.error)
        } else {
          console.log('Email de notificación al admin enviado con éxito:', result)
        }
      }
    } catch (error) {
      emailError = String(error)
      console.error('Error enviando email al administrador por nueva incidencia:', error)
    }
  }

  return NextResponse.json({ incidencia, emailError }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const user = getTokenFromRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()

  if (body.estado !== undefined) {
    if (user.tipo !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const incidenciaExistente = await prisma.incidencia.findUnique({
      where: { id: body.id },
      include: { comunidad: true }
    })

    if (!incidenciaExistente || incidenciaExistente.comunidad.administrador_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const incidencia = await prisma.incidencia.update({
      where: { id: body.id },
      data: { estado: body.estado },
      include: {
        vecino: { select: { nombre: true, email: true } }
      }
    })

    await prisma.incidenciaHistorial.create({
      data: {
        incidencia_id: incidencia.id,
        campo: 'estado',
        antiguo: incidencia.estado,
        nuevo: body.estado,
        autor: user.email,
        autor_tipo: 'ADMIN'
      }
    })

    const ESTADO_LABEL: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      EN_PROCESO: 'En proceso',
      RESUELTO: 'Resuelto'
    }

    let emailResult: any = null
    let emailError: string | null = null

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      emailError = 'RESEND_API_KEY no está definido. No se puede enviar el email de actualización de incidencia.'
      console.error(emailError)
    } else {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(apiKey)

        console.log(`Intentando enviar email de actualización de incidencia ${incidencia.id} a ${incidencia.vecino.email}`)

        emailResult = await resend.emails.send({
          from: 'Fincas SaaS <onboarding@resend.dev>',
          to: incidencia.vecino.email,
          subject: `Tu incidencia ha sido actualizada: ${ESTADO_LABEL[body.estado]}`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Actualización de tu incidencia</h2>
              <p>Hola <strong>${incidencia.vecino.nombre}</strong>,</p>
              <p>El estado de tu incidencia <strong>"${incidencia.titulo}"</strong> ha sido actualizado a:</p>
              <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
                <span style="font-size: 18px; font-weight: 600; color: #1a1a1a;">${ESTADO_LABEL[body.estado]}</span>
              </div>
              <p>Puedes consultar el estado de todas tus incidencias en el portal del vecino.</p>
              <p style="color: #888; font-size: 13px; margin-top: 32px;">Este es un mensaje automático, por favor no respondas a este email.</p>
            </div>
          `
        })

        if (emailResult?.error) {
          emailError = JSON.stringify(emailResult.error)
          console.error('Error en el resultado de Resend:', emailResult.error)
        } else {
          console.log('Email de actualización enviado con éxito:', emailResult)
        }
      } catch (error) {
        emailError = String(error)
        console.error('Error enviando email de actualización de incidencia:', error)
      }
    }

    if (emailError) {
      return NextResponse.json(
        {
          error: 'Error al enviar el correo de notificación',
          details: emailError,
          incidencia
        },
        { status: 502 }
      )
    }

    return NextResponse.json(incidencia)
  }

  if (user.tipo !== 'vecino') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id, titulo, descripcion, imagen_url } = body

  if (!id) {
    return NextResponse.json({ error: 'ID de incidencia es obligatorio' }, { status: 400 })
  }

  const incidencia = await prisma.incidencia.findUnique({
    where: { id },
    include: { historial: { orderBy: { creado_en: 'desc' } } }
  })

  if (!incidencia || incidencia.vecino_id !== user.id) {
    return NextResponse.json({ error: 'Incidencia no encontrada' }, { status: 404 })
  }

  if (incidencia.estado !== 'PENDIENTE') {
    return NextResponse.json({ error: 'Solo se pueden editar incidencias en estado Pendiente' }, { status: 400 })
  }

  const cambios: Array<{ campo: string; antiguo: string | null; nuevo: string | null }> = []
  const data: Record<string, unknown> = {}

  if (titulo !== undefined && titulo !== incidencia.titulo) {
    data.titulo = titulo
    cambios.push({ campo: 'titulo', antiguo: incidencia.titulo, nuevo: titulo })
  }

  if (descripcion !== undefined && descripcion !== incidencia.descripcion) {
    data.descripcion = descripcion
    cambios.push({ campo: 'descripcion', antiguo: incidencia.descripcion, nuevo: descripcion })
  }

  if (imagen_url !== undefined && imagen_url !== incidencia.imagen_url) {
    data.imagen_url = imagen_url || null
    cambios.push({ campo: 'imagen_url', antiguo: incidencia.imagen_url, nuevo: imagen_url || null })
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No hay cambios para aplicar' }, { status: 400 })
  }

  await prisma.incidencia.update({
    where: { id },
    data
  })

  if (cambios.length > 0) {
    await prisma.incidenciaHistorial.createMany({
      data: cambios.map(cambio => ({
        incidencia_id: id,
        campo: cambio.campo,
        antiguo: cambio.antiguo,
        nuevo: cambio.nuevo,
        autor: user.email,
        autor_tipo: 'VECINO'
      }))
    })
  }

  const incidenciaFinal = await prisma.incidencia.findUnique({
    where: { id },
    include: { historial: { orderBy: { creado_en: 'desc' } } }
  })

  return NextResponse.json(incidenciaFinal)
}
