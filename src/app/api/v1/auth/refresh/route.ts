import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRefreshToken, setAuthCookies } from '@/lib/auth'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token відсутній', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        { error: 'Refresh token невалідний', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Rotate tokens
    await setAuthCookies({
      userId: payload.userId,
      familyId: payload.familyId,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Refresh error:', error)
    return NextResponse.json(
      { error: 'Помилка сервера', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
