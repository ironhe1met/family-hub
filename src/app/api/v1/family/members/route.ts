import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const members = await prisma.user.findMany({
    where: { familyId: auth.user.familyId },
    select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ members })
}
