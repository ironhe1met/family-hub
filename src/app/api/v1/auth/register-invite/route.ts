import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, setAuthCookies } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName, inviteCode } = body

    if (!email || !password || !firstName || !inviteCode) {
      return NextResponse.json(
        { error: 'Всі поля обов\'язкові', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль має бути не менше 8 символів', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Find invite
    const invite = await prisma.invite.findUnique({ where: { code: inviteCode } })
    if (!invite) {
      return NextResponse.json(
        { error: 'Код запрошення не знайдено', code: 'INVITE_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (invite.usedBy) {
      return NextResponse.json(
        { error: 'Код запрошення вже використано', code: 'INVITE_USED' },
        { status: 410 }
      )
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: 'Код запрошення протермінований', code: 'INVITE_EXPIRED' },
        { status: 410 }
      )
    }

    // Check email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Цей email вже зареєстрований', code: 'EMAIL_EXISTS' },
        { status: 409 }
      )
    }

    // Create user + mark invite as used
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          familyId: invite.familyId,
          email,
          passwordHash: await hashPassword(password),
          firstName,
        },
      })

      await tx.invite.update({
        where: { id: invite.id },
        data: { usedBy: newUser.id },
      })

      return newUser
    })

    await setAuthCookies({
      userId: user.id,
      familyId: invite.familyId,
    })

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          familyId: invite.familyId,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register invite error:', error)
    return NextResponse.json(
      { error: 'Помилка сервера', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
