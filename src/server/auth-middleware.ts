import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { verifyAccessToken, verifyRefreshToken, setAuthCookies, type TokenPayload } from '@/lib/auth'

/**
 * Verify auth from API route. Returns token payload or error response.
 */
export async function requireAuth(): Promise<
  { user: TokenPayload; error?: never } | { user?: never; error: NextResponse }
> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  const refreshToken = cookieStore.get('refresh_token')?.value

  // Try access token first
  if (accessToken) {
    const payload = verifyAccessToken(accessToken)
    if (payload) {
      return { user: payload }
    }
  }

  // Try refresh token
  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken)
    if (payload) {
      // Rotate tokens
      await setAuthCookies({ userId: payload.userId, familyId: payload.familyId })
      return { user: payload }
    }
  }

  return {
    error: NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 }),
  }
}
