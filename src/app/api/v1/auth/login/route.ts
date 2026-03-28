import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, setAuthCookies } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email та пароль обов\'язкові', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        familyId: true,
        passwordHash: true,
      },
    })

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: 'Невірний email або пароль', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      )
    }

    await setAuthCookies({
      userId: user.id,
      familyId: user.familyId,
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        familyId: user.familyId,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Помилка сервера', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
