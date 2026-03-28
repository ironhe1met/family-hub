import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { requireAuth } from '@/server/auth-middleware'

export async function POST(request: Request) {
  try {
    const auth = await requireAuth()
    if (auth.error) return auth.error

    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Поточний та новий пароль обов\'язкові', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Новий пароль має бути не менше 8 символів', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { passwordHash: true },
    })

    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return NextResponse.json(
        { error: 'Невірний поточний пароль', code: 'INVALID_PASSWORD' },
        { status: 401 }
      )
    }

    await prisma.user.update({
      where: { id: auth.user.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Помилка сервера', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
