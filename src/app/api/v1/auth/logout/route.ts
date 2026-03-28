import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/auth'

export async function POST() {
  await clearAuthCookies()
  return new NextResponse(null, { status: 204 })
}
