import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secreto-temporal-cambiarse-en-produccion'

export function generarToken(payload: { id: number; email: string; tipo: 'admin' | 'vecino' }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verificarToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string; tipo: 'admin' | 'vecino' }
  } catch {
    return null
  }
}